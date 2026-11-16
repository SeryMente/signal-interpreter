(function () {
  "use strict";

  var KEY = "__SIGNAL_INTERPRETER_MAIN_MIC_GUARD_V1__";
  var COMMAND_EVENT = "__SIGNAL_INTERPRETER_MIC_COMMAND_V1__";
  var ACK_EVENT = "__SIGNAL_INTERPRETER_MIC_ACK_V1__";
  var EMERGENCY_EVENT = "__SIGNAL_INTERPRETER_MIC_EMERGENCY_RELEASED_V1__";
  var EMERGENCY_MESSAGE = "__SIGNAL_INTERPRETER_MIC_EMERGENCY_RELEASE_V1__";
  var EMERGENCY_KEY = "KeyM";
  var previousState = window[KEY] || null;
  if (previousState && previousState.timer !== null && previousState.timer !== undefined) {
    try { clearInterval(previousState.timer); } catch (_) {}
  }
  var old = previousState && (previousState.version === "1.0" || previousState.version === "2.0") ? previousState : null;
  var state = old || {
    version: "2.0",
    startedAt: new Date().toISOString(),
    muted: true,
    tracks: new Map(),
    senders: new Set(),
    patches: { gum: false, getSenders: false, addTrack: false, addTransceiver: false, replaceTrack: false, clone: false },
    patchRecords: [],
    timer: null,
    commandListener: null,
    emergencyKeyHandler: null,
    emergencyMessageHandler: null,
    emergencyReleased: false
  };
  var tracks = state.tracks instanceof Map ? state.tracks : new Map();
  var senders = state.senders instanceof Set ? state.senders : new Set();
  var patchRecords = Array.isArray(state.patchRecords) ? state.patchRecords : [];
  var patches = state.patches || {};
  var timer = state.timer !== null && state.timer !== undefined ? state.timer : null;

  if (timer) {
    try { clearInterval(timer); } catch (_) {}
    timer = null;
  }
  state.legacyWrappers = state.legacyWrappers === true || !!(previousState && previousState.version !== "2.0");
  state.version = "2.0";
  state.tracks = tracks;
  state.senders = senders;
  state.patchRecords = patchRecords;
  state.patches = patches;
  state.timer = null;
  state.muted = state.muted === true;

  function now() { return new Date().toISOString(); }
  function isAudio(track) {
    return !!track && track.kind === "audio" && typeof track.id === "string";
  }
  function isMuted() { return state.muted === true; }
  function setMuted(value) {
    state.muted = value === true;
    state.lastStateChangeAt = now();
    return state.muted;
  }
  function ack(requestId, payload) {
    try {
      document.dispatchEvent(new CustomEvent(ACK_EVENT, {
        detail: JSON.stringify(Object.assign({
          version: "2.0", requestId: requestId || null, timestamp: now()
        }, payload || {}))
      }));
    } catch (_) {}
  }
  function remember(track) {
    if (!isAudio(track)) return;
    tracks.set(track.id, track);
    try { track.enabled = state.emergencyReleased === true || !isMuted(); } catch (_) {}
  }
  function rememberSender(sender) {
    if (!sender) return;
    try {
      if (isAudio(sender.track)) {
        remember(sender.track);
        senders.add(sender);
      }
    } catch (_) {}
  }
  function patchMethod(owner, name, makeWrapper, patchName) {
    try {
      if (!owner || typeof owner[name] !== "function") return;
      if (owner[name].__signalMicWrapped && owner[name].__signalMicOriginal) return;
      if (owner[name].__signalMicWrapped && !owner[name].__signalMicOriginal) state.legacyWrappers = true;
      var descriptor = Object.getOwnPropertyDescriptor(owner, name) || null;
      var original = owner[name];
      var wrapper = makeWrapper(original);
      Object.defineProperty(wrapper, "__signalMicWrapped", { value: true });
      Object.defineProperty(wrapper, "__signalMicOriginal", { value: original });
      Object.defineProperty(owner, name, {
        configurable: true,
        enumerable: descriptor ? descriptor.enumerable : false,
        writable: true,
        value: wrapper
      });
      patchRecords.push({ owner: owner, name: name, descriptor: descriptor, wrapper: wrapper });
      patches[patchName] = true;
    } catch (_) {
      patches[patchName] = false;
    }
  }
  function patchGetUserMedia() {
    try {
      var mediaDevices = navigator.mediaDevices;
      if (!mediaDevices) return;
      var current = mediaDevices.getUserMedia;
      if (current && current.__signalMicWrapped &&
          Object.prototype.hasOwnProperty.call(mediaDevices, "getUserMedia")) {
        try { delete mediaDevices.getUserMedia; } catch (_) {}
      }
      patches.gum = typeof mediaDevices.getUserMedia === "function";
    } catch (_) { patches.gum = false; }
  }
  function patchPeerConnections() {
    try {
      var prototype = window.RTCPeerConnection && window.RTCPeerConnection.prototype;
      patchMethod(prototype, "getSenders", function (original) {
        return function () {
          var result = original.apply(this, arguments) || [];
          result.forEach(rememberSender);
          return result;
        };
      }, "getSenders");
      patchMethod(prototype, "addTrack", function (original) {
        return function (track) {
          var result = original.apply(this, arguments);
          if (isAudio(track)) {
            remember(track);
            rememberSender(result);
          }
          return result;
        };
      }, "addTrack");
      patchMethod(prototype, "addTransceiver", function (original) {
        return function (track) {
          var result = original.apply(this, arguments);
          if (isAudio(track)) {
            remember(track);
            rememberSender(result && result.sender);
          }
          return result;
        };
      }, "addTransceiver");
    } catch (_) {}
    try {
      var senderPrototype = window.RTCRtpSender && window.RTCRtpSender.prototype;
      patchMethod(senderPrototype, "replaceTrack", function (original) {
        return function (track) {
          var result = original.apply(this, arguments);
          if (isAudio(track)) {
            remember(track);
            rememberSender(this);
          }
          return result;
        };
      }, "replaceTrack");
    } catch (_) {}
  }
  function patchClone() {
    try {
      var prototype = window.MediaStreamTrack && window.MediaStreamTrack.prototype;
      patchMethod(prototype, "clone", function (original) {
        return function () {
          var clone = original.apply(this, arguments);
          if (tracks.has(this.id)) remember(clone);
          return clone;
        };
      }, "clone");
    } catch (_) {}
  }
  function patch() {
    if (state.emergencyReleased) return;
    patchGetUserMedia();
    patchPeerConnections();
    patchClone();
  }
  function restorePatches() {
    // 1.0 did not retain original prototype references. Keep the new outer
    // wrappers as a passive compatibility shim so stale 1.0 closures cannot
    // re-disable tracks after emergency release.
    if (state.legacyWrappers === true) {
      state.emergencyShimActive = true;
      state.emergencyShimInstalledAt = now();
      return;
    }
    for (var index = patchRecords.length - 1; index >= 0; index -= 1) {
      var entry = patchRecords[index];
      try {
        var current = Object.getOwnPropertyDescriptor(entry.owner, entry.name);
        if (!current || current.value !== entry.wrapper) continue;
        if (entry.descriptor) Object.defineProperty(entry.owner, entry.name, entry.descriptor);
        else delete entry.owner[entry.name];
      } catch (_) {}
    }
    patchRecords.length = 0;
    state.patchRecords = patchRecords;
    state.patches = { gum: patches.gum === true, getSenders: false, addTrack: false, addTransceiver: false, replaceTrack: false, clone: false };
  }
  function report() {
    var liveTracks = Array.from(tracks.values()).filter(function (track) {
      try { return track.readyState !== "ended"; } catch (_) { return false; }
    });
    tracks.clear();
    liveTracks.forEach(function (track) { tracks.set(track.id, track); });
    Array.from(senders).forEach(function (sender) {
      try {
        if (!sender.track || sender.track.readyState === "ended" || !tracks.has(sender.track.id)) senders.delete(sender);
      } catch (_) { senders.delete(sender); }
    });
    var tracksVerified = liveTracks.length === 0 && isMuted();
    if (liveTracks.length > 0) {
      tracksVerified = liveTracks.every(function (track) {
        try { return track.enabled === !isMuted(); } catch (_) { return false; }
      });
    }
    var sendersVerified = Array.from(senders).every(function (sender) {
      try { return !!sender.track && sender.track.enabled === !isMuted(); } catch (_) { return false; }
    });
    return {
      trackCount: liveTracks.length,
      senderCount: senders.size,
      verified: tracksVerified && sendersVerified
    };
  }
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  async function stableReport(samples, gap) {
    var first = null, last = null;
    for (var index = 0; index < samples; index += 1) {
      last = report();
      if (!last.verified) return Object.assign({}, last, { stable: false, stableSamples: index + 1 });
      if (!first) first = last;
      else if (last.trackCount !== first.trackCount || last.senderCount !== first.senderCount) {
        return Object.assign({}, last, { verified: false, stable: false, unstable: true, stableSamples: index + 1 });
      }
      if (index + 1 < samples) await wait(gap);
    }
    return Object.assign({}, last, { stable: true, stableSamples: samples });
  }
  async function forceMute(requestId) {
    if (state.emergencyReleased) {
      ack(requestId, { ok: false, muted: false, verified: false, error: "emergency-release-active" });
      return;
    }
    setMuted(true);
    patch();
    tracks.forEach(function (track) {
      try { if (track.readyState !== "ended") track.enabled = false; } catch (_) {}
    });
    var result = await stableReport(3, 20);
    ack(requestId, {
      ok: result.verified && result.stable,
      muted: true,
      verified: result.verified && result.stable,
      stable: !!result.stable,
      stableSamples: result.stableSamples || 0,
      trackCount: result.trackCount,
      senderCount: result.senderCount,
      patches: patches,
      error: result.verified && result.stable ? null : "No se pudo verificar de forma estable la pista saliente del micrófono."
    });
  }
  async function unmute(requestId, allowEmpty) {
    if (state.emergencyReleased) {
      ack(requestId, { ok: false, muted: false, verified: false, error: "emergency-release-active" });
      return;
    }
    patch();
    var before = await stableReport(2, 15);
    if (allowEmpty === true && before.verified && before.stable &&
        Number(before.trackCount || 0) === 0 && Number(before.senderCount || 0) === 0) {
      setMuted(false);
      ack(requestId, {
        ok: true, muted: false, verified: true, stable: true,
        stableSamples: before.stableSamples || 2, trackCount: 0, senderCount: 0,
        patches: patches, preCall: true, noTracks: true
      });
      return;
    }
    if (Number(before.trackCount || 0) === 0 && Number(before.senderCount || 0) === 0) {
      setMuted(false);
      ack(requestId, {
        ok: false, muted: false, verified: false, stable: !!before.stable,
        stableSamples: before.stableSamples || 0, trackCount: 0, senderCount: 0,
        noTracks: true,
        error: "Este frame no tiene una pista WebRTC saliente registrada."
      });
      return;
    }
    if (!before.verified || !before.stable) {
      setMuted(true);
      tracks.forEach(function (track) {
        try { if (track.readyState !== "ended") track.enabled = false; } catch (_) {}
      });
      var safe = await stableReport(3, 25);
      if (!safe.verified || !safe.stable || Number(safe.trackCount || 0) < 1) {
        ack(requestId, {
          ok: false, muted: true, verified: false, stable: !!safe.stable,
          stableSamples: safe.stableSamples || 0, trackCount: safe.trackCount,
          senderCount: safe.senderCount,
          error: "No se libera el micrófono: no fue posible restablecer una pista saliente viva y estable.",
          recoveryBaselineAttempted: true
        });
        return;
      }
    }
    setMuted(false);
    tracks.forEach(function (track) {
      try { if (track.readyState !== "ended") track.enabled = true; } catch (_) {}
    });
    var result = await stableReport(3, 20);
    if (!result.verified || !result.stable) {
      setMuted(true);
      tracks.forEach(function (track) {
        try { if (track.readyState !== "ended") track.enabled = false; } catch (_) {}
      });
      result = await stableReport(3, 20);
      ack(requestId, {
        ok: false, muted: true, verified: false, stable: !!result.stable,
        stableSamples: result.stableSamples || 0, trackCount: result.trackCount,
        senderCount: result.senderCount,
        error: "El unmute no pudo verificarse de forma estable; el micrófono permanece silenciado."
      });
      return;
    }
    ack(requestId, {
      ok: true, muted: false, verified: true, stable: true,
      stableSamples: result.stableSamples || 3, trackCount: result.trackCount,
      senderCount: result.senderCount, patches: patches
    });
  }
  function emergencyRelease(reason) {
    if (state.emergencyReleased) return state.emergencyReleaseResult || { ok: true, alreadyReleased: true };
    setMuted(false);
    var enabledTracks = 0;
    tracks.forEach(function (track) {
      try {
        if (track.readyState !== "ended") {
          track.enabled = true;
          if (track.enabled === true) enabledTracks += 1;
        }
      } catch (_) {}
    });
    senders.forEach(function (sender) {
      try {
        if (sender.track && sender.track.kind === "audio" && sender.track.readyState !== "ended") {
          sender.track.enabled = true;
        }
      } catch (_) {}
    });
    if (timer !== null && timer !== undefined) {
      try { clearInterval(timer); } catch (_) {}
      timer = null;
    }
    state.timer = null;
    var methodsRestorable = patchRecords.length;
    restorePatches();
    if (state.commandListener) {
      try { document.removeEventListener(COMMAND_EVENT, state.commandListener, true); } catch (_) {}
      state.commandListener = null;
    }
    state.emergencyReleased = true;
    state.emergencyReleasedAt = now();
    state.emergencyReleaseReason = String(reason || "manual-emergency").slice(0, 80);
    state.active = false;
    var result = {
      ok: true, released: true, muted: false, enabledTrackCount: enabledTracks,
      restoredPatchCount: state.legacyWrappers === true ? 0 : methodsRestorable,
      compatibilityShimActive: state.legacyWrappers === true,
      timerStopped: true, at: state.emergencyReleasedAt,
      reason: state.emergencyReleaseReason
    };
    state.emergencyReleaseResult = result;
    try {
      document.dispatchEvent(new CustomEvent(EMERGENCY_EVENT, { detail: JSON.stringify(result) }));
    } catch (_) {}
    return result;
  }
  function broadcastEmergency() {
    try {
      var frames = document.querySelectorAll("iframe,frame");
      Array.prototype.forEach.call(frames, function (frame) {
        try { if (frame.contentWindow) frame.contentWindow.postMessage(EMERGENCY_MESSAGE, "*"); } catch (_) {}
      });
    } catch (_) {}
  }
  function emergencyMessageHandler(event) {
    if (!event || event.origin !== location.origin || event.data !== EMERGENCY_MESSAGE) return;
    emergencyRelease("emergency-hotkey-broadcast");
    if (window === window.top) broadcastEmergency();
  }
  function emergencyKeyHandler(event) {
    if (!event || !event.ctrlKey || !event.altKey || !event.shiftKey ||
        (event.code !== EMERGENCY_KEY && String(event.key || "").toLowerCase() !== "m")) return;
    try { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); } catch (_) {}
    emergencyRelease("ctrl-alt-shift-m");
    try {
      if (window.top && window.top !== window) window.top.postMessage(EMERGENCY_MESSAGE, "*");
      else window.top.postMessage(EMERGENCY_MESSAGE, "*");
    } catch (_) { broadcastEmergency(); }
  }
  function commandListener(event) {
    if (state.emergencyReleased) return;
    var message = null;
    try { message = JSON.parse(String(event && event.detail || "")); } catch (_) {}
    if (!message || message.schema !== "signal-main-mic-command/v1") return;
    if (message.op === "set") {
      if (message.muted) forceMute(message.requestId);
      else unmute(message.requestId, message.allowEmpty === true);
    } else if (message.op === "probe") {
      patch();
      stableReport(2, 15).then(function (result) {
        ack(message.requestId, {
          ok: true, muted: isMuted(), verified: result.verified,
          stable: !!result.stable, stableSamples: result.stableSamples || 0,
          trackCount: result.trackCount, senderCount: result.senderCount,
          noTracks: Number(result.trackCount || 0) === 0 && Number(result.senderCount || 0) === 0,
          patches: patches
        });
      }).catch(function (error) {
        ack(message.requestId, { ok: false, muted: isMuted(), verified: false, stable: false, error: String(error), patches: patches });
      });
    } else if (message.op === "emergency-release") {
      var result = emergencyRelease(message.reason || "command");
      ack(message.requestId, Object.assign({ verified: true }, result));
    }
  }

  if (state.commandListener) {
    try { document.removeEventListener(COMMAND_EVENT, state.commandListener, true); } catch (_) {}
  }
  state.commandListener = commandListener;
  document.addEventListener(COMMAND_EVENT, state.commandListener, true);

  if (state.emergencyKeyHandler) {
    try { window.removeEventListener("keydown", state.emergencyKeyHandler, true); } catch (_) {}
  }
  if (state.emergencyMessageHandler) {
    try { window.removeEventListener("message", state.emergencyMessageHandler, true); } catch (_) {}
  }
  state.emergencyKeyHandler = emergencyKeyHandler;
  state.emergencyMessageHandler = emergencyMessageHandler;
  window.addEventListener("keydown", state.emergencyKeyHandler, true);
  window.addEventListener("message", state.emergencyMessageHandler, true);
  window.__SIGNAL_INTERPRETER_MIC_EMERGENCY_RELEASE__ = emergencyRelease;

  if (!state.emergencyReleased) {
    patch();
    timer = setInterval(function () {
      patch();
      if (isMuted()) {
        tracks.forEach(function (track) {
          try { if (track.readyState !== "ended") track.enabled = false; } catch (_) {}
        });
      }
    }, 50);
    state.timer = timer;
    state.active = true;
    state.lastPatchedAt = now();
  } else {
    restorePatches();
  }
  window[KEY] = state;
})();