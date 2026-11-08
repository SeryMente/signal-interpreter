(function () {
  "use strict";

  var KEY = "__SIGNAL_INTERPRETER_MAIN_MIC_GUARD_V1__";
  var COMMAND_EVENT = "__SIGNAL_INTERPRETER_MIC_COMMAND_V1__";
  var ACK_EVENT = "__SIGNAL_INTERPRETER_MIC_ACK_V1__";
  var previous = window[KEY] && window[KEY].version === "1.0" ? window[KEY] : null;
  var callRouteActive = /^\\/call\\/[^/?#]+\\/?$/.test(String(location.pathname || ""));
  var muted = previous && callRouteActive ? !!previous.muted : true;
  var tracks = previous && previous.tracks instanceof Map ? previous.tracks : new Map();
  var senders = previous && previous.senders instanceof Set ? previous.senders : new Set();
  var patches = previous && previous.patches
    ? previous.patches
    : { gum: false, addTrack: false, addTransceiver: false, replaceTrack: false, clone: false };
  var timer = previous && previous.timer ? previous.timer : null;
  if (timer) clearInterval(timer);

  var state = previous || {
    version: "1.0",
    startedAt: new Date().toISOString(),
    commandEvent: COMMAND_EVENT,
    ackEvent: ACK_EVENT,
    tracks: tracks,
    senders: senders,
    patches: patches,
    muted: muted,
    timer: null
  };
  state.tracks = tracks;
  state.senders = senders;
  state.patches = patches;
  state.muted = muted;
  state.timer = null;

  function ack(requestId, payload) {
    try {
      document.dispatchEvent(new CustomEvent(ACK_EVENT, {
        detail: JSON.stringify(Object.assign({
          version: "1.0",
          requestId: requestId || null,
          timestamp: new Date().toISOString()
        }, payload || {}))
      }));
    } catch (_) {}
  }

  function isAudio(track) {
    return !!track && track.kind === "audio" && typeof track.id === "string";
  }

  function isKnown(track) {
    return isAudio(track) && tracks.has(track.id);
  }

  function liveTracks() {
    var live = [];
    tracks.forEach(function (track) {
      try {
        if (track && track.readyState !== "ended") live.push(track);
      } catch (_) {}
    });
    return live;
  }

  function stopMuteEnforcement() {
    if (timer) clearInterval(timer);
    timer = null;
    state.timer = null;
  }

  // No idle poll: a timer exists only while live tracks must remain muted.
  function ensureMuteEnforcement() {
    if (!muted) {
      stopMuteEnforcement();
      return;
    }
    if (!liveTracks().length) {
      stopMuteEnforcement();
      return;
    }
    if (timer) return;
    timer = setInterval(function () {
      if (!muted) {
        stopMuteEnforcement();
        return;
      }
      var live = liveTracks();
      if (!live.length) {
        stopMuteEnforcement();
        return;
      }
      live.forEach(function (track) {
        try { track.enabled = false; } catch (_) {}
      });
    }, 250);
    state.timer = timer;
  }

  function remember(track) {
    if (!isAudio(track)) return;
    tracks.set(track.id, track);
    if (muted) {
      try { track.enabled = false; } catch (_) {}
      ensureMuteEnforcement();
    }
  }

  function rememberStream(stream) {
    try {
      stream.getAudioTracks().forEach(remember);
    } catch (_) {}
    return stream;
  }

  function rememberSender(sender) {
    if (!sender) return;
    try {
      if (isAudio(sender.track)) remember(sender.track);
      if (isKnown(sender.track)) senders.add(sender);
    } catch (_) {}
  }

  function patchGetUserMedia() {
    try {
      var mediaDevices = navigator.mediaDevices;
      if (!mediaDevices || typeof mediaDevices.getUserMedia !== "function") return;
      var current = mediaDevices.getUserMedia;
      if (current.__signalMicWrapped) {
        patches.gum = true;
        return;
      }
      var original = current.bind(mediaDevices);
      var wrapped = function (constraints) {
        return original(constraints).then(function (stream) {
          if (constraints && constraints.audio) rememberStream(stream);
          return stream;
        });
      };
      Object.defineProperty(wrapped, "__signalMicWrapped", { value: true });
      Object.defineProperty(mediaDevices, "getUserMedia", {
        value: wrapped, configurable: true, writable: true
      });
      patches.gum = true;
    } catch (_) {}
  }

  function patchPeerConnection() {
    try {
      var PeerConnection = window.RTCPeerConnection;
      if (!PeerConnection || !PeerConnection.prototype) return;
      var proto = PeerConnection.prototype;

      if (typeof proto.getSenders === "function" && !proto.getSenders.__signalMicWrapped) {
        var originalGetSenders = proto.getSenders;
        var wrappedGetSenders = function () {
          var result = originalGetSenders.apply(this, arguments) || [];
          result.forEach(rememberSender);
          return result;
        };
        Object.defineProperty(wrappedGetSenders, "__signalMicWrapped", { value: true });
        Object.defineProperty(proto, "getSenders", {
          value: wrappedGetSenders, configurable: true, writable: true
        });
      }

      if (typeof proto.addTrack === "function" && !proto.addTrack.__signalMicWrapped) {
        var originalAddTrack = proto.addTrack;
        var wrappedAddTrack = function (track) {
          var sender = originalAddTrack.apply(this, arguments);
          if (isAudio(track)) {
            remember(track);
            rememberSender(sender);
          }
          return sender;
        };
        Object.defineProperty(wrappedAddTrack, "__signalMicWrapped", { value: true });
        Object.defineProperty(proto, "addTrack", {
          value: wrappedAddTrack, configurable: true, writable: true
        });
        patches.addTrack = true;
      }

      if (typeof proto.addTransceiver === "function" && !proto.addTransceiver.__signalMicWrapped) {
        var originalAddTransceiver = proto.addTransceiver;
        var wrappedAddTransceiver = function (trackOrKind) {
          var result = originalAddTransceiver.apply(this, arguments);
          if (isAudio(trackOrKind)) {
            remember(trackOrKind);
            rememberSender(result && result.sender);
          }
          return result;
        };
        Object.defineProperty(wrappedAddTransceiver, "__signalMicWrapped", { value: true });
        Object.defineProperty(proto, "addTransceiver", {
          value: wrappedAddTransceiver, configurable: true, writable: true
        });
        patches.addTransceiver = true;
      }
    } catch (_) {}

    try {
      var senderProto = window.RTCRtpSender && window.RTCRtpSender.prototype;
      if (senderProto && typeof senderProto.replaceTrack === "function" && !senderProto.replaceTrack.__signalMicWrapped) {
        var originalReplaceTrack = senderProto.replaceTrack;
        var wrappedReplaceTrack = function (track) {
          if (isAudio(track)) remember(track);
          var result = originalReplaceTrack.apply(this, arguments);
          if (isKnown(track)) rememberSender(this);
          return result;
        };
        Object.defineProperty(wrappedReplaceTrack, "__signalMicWrapped", { value: true });
        Object.defineProperty(senderProto, "replaceTrack", {
          value: wrappedReplaceTrack, configurable: true, writable: true
        });
        patches.replaceTrack = true;
      }
    } catch (_) {}
  }

  function patchClone() {
    try {
      var proto = window.MediaStreamTrack && window.MediaStreamTrack.prototype;
      if (!proto || typeof proto.clone !== "function" || proto.clone.__signalMicWrapped) return;
      var originalClone = proto.clone;
      var wrappedClone = function () {
        var clone = originalClone.apply(this, arguments);
        if (isKnown(this)) remember(clone);
        return clone;
      };
      Object.defineProperty(wrappedClone, "__signalMicWrapped", { value: true });
      Object.defineProperty(proto, "clone", {
        value: wrappedClone, configurable: true, writable: true
      });
        patches.clone = true;
    } catch (_) {}
  }

  function patch() {
    patchGetUserMedia();
    patchPeerConnection();
    patchClone();
  }

  function report() {
    var live = liveTracks();
    var liveIds = new Set(live.map(function (track) { return track.id; }));
    tracks.forEach(function (_, id) {
      if (!liveIds.has(id)) tracks.delete(id);
    });
    Array.from(senders).forEach(function (sender) {
      try {
        if (!sender.track || sender.track.readyState === "ended" || !isKnown(sender.track)) {
          senders.delete(sender);
        }
      } catch (_) {}
    });
    var tracksMatch = live.every(function (track) {
      try { return track.enabled === !muted; } catch (_) { return false; }
    });
    var sendersMatch = Array.from(senders).every(function (sender) {
      try { return !!sender.track && sender.track.enabled === !muted; } catch (_) { return false; }
    });
    return {
      trackCount: live.length,
      senderCount: senders.size,
      verified: tracksMatch && sendersMatch
    };
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

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
    muted = true;
    state.muted = true;
    patch();
    liveTracks().forEach(function (track) {
      try { track.enabled = false; } catch (_) {}
    });
    ensureMuteEnforcement();
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

  async function unmute(requestId) {
    patch();
    var recoveredBaseline = false;
    var before = await stableReport(2, 15);
    if (!before.verified || !before.stable) {
      muted = true;
      state.muted = true;
      liveTracks().forEach(function (track) {
        try { track.enabled = false; } catch (_) {}
      });
      ensureMuteEnforcement();
      var safe = await stableReport(3, 25);
      if (!safe.verified || !safe.stable) {
        ack(requestId, {
          ok: false, muted: true, verified: false,
          stable: !!safe.stable, stableSamples: safe.stableSamples || 0,
          trackCount: safe.trackCount, senderCount: safe.senderCount,
          error: "No se libera el micrófono: no fue posible restablecer una línea base silenciada y estable.",
          recoveryBaselineAttempted: true
        });
        return;
      }
      recoveredBaseline = true;
    }

    muted = false;
    state.muted = false;
    stopMuteEnforcement();
    liveTracks().forEach(function (track) {
      try { track.enabled = true; } catch (_) {}
    });
    var result = await stableReport(3, 20);
    if (!result.verified || !result.stable) {
      muted = true;
      state.muted = true;
      liveTracks().forEach(function (track) {
        try { track.enabled = false; } catch (_) {}
      });
      ensureMuteEnforcement();
      result = await stableReport(3, 20);
      ack(requestId, {
        ok: false, muted: true, verified: false,
        stable: !!result.stable, stableSamples: result.stableSamples || 0,
        trackCount: result.trackCount, senderCount: result.senderCount,
        error: "El unmute no pudo verificarse de forma estable; el micrófono permanece silenciado.",
        recoveredBaseline: recoveredBaseline
      });
      return;
    }
    ack(requestId, {
      ok: true, muted: false, verified: true, stable: true,
      stableSamples: result.stableSamples || 3,
      trackCount: result.trackCount, senderCount: result.senderCount,
      patches: patches, recoveredBaseline: recoveredBaseline
    });
  }

  document.addEventListener(COMMAND_EVENT, function (event) {
    var message = null;
    try { message = JSON.parse(String(event && event.detail || "")); } catch (_) {}
    if (!message || message.schema !== "signal-main-mic-command/v1") return;
    if (message.op === "set") {
      if (message.muted) forceMute(message.requestId);
      else unmute(message.requestId);
    } else if (message.op === "probe") {
      patch();
      if (muted) {
        liveTracks().forEach(function (track) {
          try { track.enabled = false; } catch (_) {}
        });
        ensureMuteEnforcement();
      }
      stableReport(2, 15).then(function (result) {
        ack(message.requestId, {
          ok: true, muted: muted, verified: result.verified,
          stable: !!result.stable, stableSamples: result.stableSamples || 0,
          trackCount: result.trackCount, senderCount: result.senderCount,
          patches: patches
        });
      }).catch(function (error) {
        ack(message.requestId, {
          ok: false, muted: muted, verified: false, stable: false,
          error: String(error), patches: patches
        });
      });
    }
  }, true);

  patch();
  if (muted) {
    liveTracks().forEach(function (track) {
      try { track.enabled = false; } catch (_) {}
    });
    ensureMuteEnforcement();
  }
  state.tracks = tracks;
  state.senders = senders;
  state.patches = patches;
  state.muted = muted;
  state.timer = timer;
  state.lastPatchedAt = new Date().toISOString();
  window[KEY] = state;
})();