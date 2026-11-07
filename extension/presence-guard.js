/* Presence authorization is ephemeral: storage preferences never arm the guard. */
(function (root) {
  "use strict";
  var SESSION_KEY = "signalPresenceGuardSession";
  var armed = false, generation = 0, threshold = 0, lastCheck = Date.now();
  var consumed = new Set(), busy = false, activeLease = null;
  var sessionWriteQueue = Promise.resolve(), startupReady = Promise.resolve();
  var PROFILE = "https://app.cloudinterpreter.com/profile/cmu2wuz1v0uwr07adbzb9djfz";
  var KEY = "signalPresenceGuard";
  var reason = "confirmation-required";
  var allowedSeconds = [60, 180, 300, 600];
  function snapshot() { return { armed: armed, generation: generation, idleSeconds: threshold, reason: reason }; }
  function publish() {
    // Only arm state, never input, captions or desktop content, is persisted locally.
    return chrome.storage.local.set({ signalPresenceGuard: snapshot() }).catch(function () {});
  }
  function queueSessionWrite(task) {
    var next = sessionWriteQueue.then(task);
    sessionWriteQueue = next.catch(function () {});
    return next;
  }
  function clearSessionArm() {
    if (!chrome.storage.session || !chrome.storage.session.remove) return Promise.resolve();
    return queueSessionWrite(function () { return chrome.storage.session.remove(SESSION_KEY); });
  }
  function saveSessionArm() {
    if (!chrome.storage.session || !chrome.storage.session.set) return Promise.reject(new Error("session-storage-unavailable"));
    var saved = {
      version: 1, explicit: true, armed: true, extensionId: chrome.runtime.id,
      generation: generation, idleSeconds: threshold, armedAt: Date.now()
    };
    return queueSessionWrite(function () {
      var patch = {}; patch[SESSION_KEY] = saved;
      return chrome.storage.session.set(patch);
    });
  }
  function disarm(why) {
    armed = false; generation++; reason = why || "confirmation-required";
    consumed.clear(); activeLease = null;
    clearSessionArm().catch(function () {});
    publish();
    return snapshot();
  }
  // MV3 may suspend an idle worker. Each authorization independently revalidates idle state.
  function continuity() { lastCheck = Date.now(); }
  function idleState(seconds) {
    return new Promise(function (resolve) {
      if (!chrome.idle || !chrome.idle.queryState) { resolve("unavailable"); return; }
      var finished = false;
      var timer = setTimeout(function () { if (!finished) { finished = true; resolve("unavailable"); } }, 1500);
      try { chrome.idle.queryState(seconds, function (state) {
        if (finished) return; finished = true; clearTimeout(timer);
        resolve(chrome.runtime.lastError ? "unavailable" : state);
      }); } catch (_) { clearTimeout(timer); finished = true; resolve("unavailable"); }
    });
  }
  function popup(sender) {
    var manifest = chrome.runtime.getManifest ? chrome.runtime.getManifest() : null;
    var popupPath = manifest && manifest.action && manifest.action.default_popup;
    return sender && sender.id === chrome.runtime.id && !sender.tab &&
      typeof popupPath === "string" && popupPath.length > 0 &&
      sender.url === chrome.runtime.getURL(popupPath);
  }
  async function arm(seconds) {
    await startupReady;
    disarm("checking-presence");
    if (!allowedSeconds.includes(seconds)) return { ok: false, error: "choose-idle-limit", state: snapshot() };
    var epoch = generation;
    if (await idleState(seconds) !== "active" || epoch !== generation) {
      disarm("presence-unavailable-confirm-again"); return { ok: false, error: reason, state: snapshot() };
    }
    var stored = await chrome.storage.local.get(["signalLabLock"]);
    if (stored.signalLabLock === true || epoch !== generation) return { ok: false, error: "lab-or-state-changed", state: snapshot() };
    try { chrome.idle.setDetectionInterval(seconds); } catch (_) { return { ok: false, error: "idle-unavailable", state: snapshot() }; }
    threshold = seconds; lastCheck = Date.now(); armed = true; reason = "explicit-availability";
    try { await saveSessionArm(); }
    catch (_) {
      disarm("session-persistence-unavailable-confirm-again");
      return { ok: false, error: reason, state: snapshot() };
    }
    if (epoch !== generation || !armed) {
      await clearSessionArm().catch(function () {});
      return { ok: false, error: "presence-state-changed", state: snapshot() };
    }
    await publish();
    return { ok: true, state: snapshot() };
  }
  function isAuthorizedProfileUrl(raw) {
    try {
      var url = new URL(String(raw || ""));
      var expected = new URL(PROFILE);
      var path = url.pathname;
      if (path.length > 1 && path.charAt(path.length - 1) === "/") path = path.slice(0, -1);
      return url.origin === expected.origin && path === expected.pathname &&
        !url.username && !url.password;
    } catch (_) { return false; }
  }
  function profile(sender) {
    return sender && sender.id === chrome.runtime.id && sender.frameId === 0 && sender.tab &&
      Number.isInteger(sender.tab.id) && isAuthorizedProfileUrl(sender.url) &&
      isAuthorizedProfileUrl(sender.tab.url);
  }
  function releaseSender(sender) {
    if (!sender || sender.id !== chrome.runtime.id || sender.frameId !== 0 || !sender.tab ||
        !Number.isInteger(sender.tab.id)) return false;
    function normalizedPage(raw) {
      return String(raw || "").split(/[?#]/)[0].replace(/\/+$/, "");
    }
    function allowedPage(raw) {
      try {
        var url = new URL(normalizedPage(raw));
        if (url.origin !== "https://app.cloudinterpreter.com") return false;
        var path = url.pathname.replace(/\/+$/, "");
        if (path === "/profile/cmu2wuz1v0uwr07adbzb9djfz") return true;
        if (path.indexOf("/call/") !== 0) return false;
        var callId = path.slice("/call/".length);
        return !!callId && callId.indexOf("/") === -1;
      } catch (_) { return false; }
    }
    return allowedPage(sender.url) && allowedPage(sender.tab.url) &&
      normalizedPage(sender.url) === normalizedPage(sender.tab.url);
  }
  async function releaseAuthorization(message, sender) {
    await startupReady;
    continuity();
    if (!releaseSender(sender)) return { ok: false, error: "sender-not-authorized" };
    var requestId = String(message && message.requestId || "");
    if (!requestId) return { ok: false, error: "request-id-required" };
    if (activeLease && Date.now() >= activeLease.expiresAt) activeLease = null;
    if (!activeLease) return { ok: true, released: false, reason: "no-active-lease" };
    if (activeLease.requestId !== requestId || activeLease.tabId !== sender.tab.id) {
      return { ok: false, error: "lease-mismatch" };
    }
    var releasedGeneration = activeLease.generation;
    activeLease = null;
    return { ok: true, released: true, generation: releasedGeneration };
  }
  async function authorize(message, sender) {
    await startupReady;
    continuity();
    if (!armed) return { ok: false, error: "presence-disarmed", state: snapshot() };
    if (busy) return { ok: false, error: "authorization-busy", state: snapshot() };
    if (!profile(sender)) return { ok: false, error: "sender-not-authorized", state: snapshot() };
    if (message.modality !== "OPI") return { ok: false, error: "modality-not-eligible", state: snapshot() };
    var requestId = String(message.requestId || "");
    if (!requestId) return { ok: false, error: "request-id-required", state: snapshot() };
    if (activeLease && Date.now() >= activeLease.expiresAt) activeLease = null;
    if (activeLease) return { ok: false, error: "authorization-lease-active", state: snapshot() };
    busy = true;
    try {
      var epoch = generation, started = Date.now();
      var values = await chrome.storage.local.get(["signalLabLock", "effectifConfig"]);
      if (values.signalLabLock === true || !values.effectifConfig || values.effectifConfig.autoAnswerEnabled !== true) return { ok: false, error: "disabled-or-lab" };
      if (await idleState(threshold) !== "active") { disarm("idle-or-locked-confirm-again"); return { ok: false, error: reason }; }
      // Revalidate the live tab, not just the sender's earlier URL snapshot.
      var activeCalls = await chrome.tabs.query({ url: "https://app.cloudinterpreter.com/call/*" });
      if (activeCalls.length) return { ok: false, error: "call-already-open" };
      var tab = await chrome.tabs.get(sender.tab.id);
      if (!isAuthorizedProfileUrl(tab.url)) return { ok: false, error: "route-changed" };
      var key = sender.tab.id + ":" + requestId;
      if (consumed.has(key) || !armed || epoch !== generation || Date.now() - started > 1000) return { ok: false, error: "stale-or-used" };
      consumed.add(key);
      if (consumed.size > 1000) { disarm("confirmation-required"); return { ok: false, error: reason }; }
      activeLease = {
        requestId: requestId, tabId: sender.tab.id, generation: generation,
        expiresAt: Date.now() + 15000
      };
      return { ok: true, generation: generation, expiresAt: Date.now() + 500, state: snapshot() };
    } catch (_) { disarm("verification-error-confirm-again"); return { ok: false, error: reason }; }
    finally { busy = false; }
  }
  async function toggleFromKeyboard() {
    await startupReady;
    if (armed) return { ok: true, state: disarm("manual-pause") };
    var stored = await chrome.storage.local.get(["effectifConfig"]);
    var cfg = stored.effectifConfig || {};
    var result = await arm(Number(cfg.presenceIdleSeconds));
    if (result.ok) await chrome.storage.local.set({ effectifConfig: Object.assign({}, cfg, { autoAnswerEnabled: true }) });
    return result;
  }
  async function restorePresenceSession() {
    var epoch = generation;
    try {
      if (!chrome.storage.session || !chrome.storage.session.get) {
        await publish();
        return;
      }
      var session = await chrome.storage.session.get([SESSION_KEY]);
      var saved = session && session[SESSION_KEY];
      if (!saved || saved.armed !== true || saved.explicit !== true) {
        await publish();
        return;
      }
      var seconds = Number(saved.idleSeconds);
      if (saved.version !== 1 || saved.extensionId !== chrome.runtime.id || !allowedSeconds.includes(seconds)) {
        disarm("session-state-invalid-confirm-again");
        return;
      }
      var current = await chrome.storage.local.get(["signalLabLock", "effectifConfig"]);
      if (current.signalLabLock === true || !current.effectifConfig ||
          current.effectifConfig.autoAnswerEnabled !== true) {
        disarm(current.signalLabLock === true ? "laboratory" : "settings-changed-confirm-again");
        return;
      }
      if (await idleState(seconds) !== "active") {
        disarm("idle-or-locked-confirm-again");
        return;
      }
      if (epoch !== generation) return;
      threshold = seconds;
      if (Number.isInteger(saved.generation)) generation = Math.max(generation, saved.generation);
      armed = true;
      reason = "explicit-availability-resumed";
      lastCheck = Date.now();
      consumed.clear();
      activeLease = null;
      await publish();
    } catch (_) {
      disarm("session-restore-failed-confirm-again");
    }
  }
  root.SignalPresenceGuard = { snapshot: snapshot, disarm: disarm, arm: arm, authorize: authorize, releaseAuthorization: releaseAuthorization, toggleFromKeyboard: toggleFromKeyboard };
  startupReady = restorePresenceSession();
  if (chrome.idle && chrome.idle.onStateChanged) chrome.idle.onStateChanged.addListener(function (state) {
    // Returning/unlocking never re-arms. A current call is deliberately untouched.
    if (state !== "active") disarm("idle-or-locked-confirm-again");
  });
  setInterval(function () {
    continuity();
    if (armed) { var epoch = generation; idleState(threshold).then(function (state) { if (epoch === generation && state !== "active") disarm("idle-or-locked-confirm-again"); }); }
  }, 15000);
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== "local") return;
    if (changes.signalLabLock && changes.signalLabLock.newValue === true) disarm("laboratory");
    if (changes.effectifConfig) {
      var after = changes.effectifConfig.newValue || {};
      if (after.autoAnswerEnabled !== true || (armed && Number(after.presenceIdleSeconds) !== threshold)) disarm("settings-changed-confirm-again");
    }
  });
  chrome.runtime.onMessage.addListener(function (message, sender, respond) {
    if (!message || !/^SIGNAL_PRESENCE_/.test(message.type || "")) return false;
    var work = startupReady.then(function () {
      if (message.type === "SIGNAL_PRESENCE_RELEASE") return releaseAuthorization(message, sender);
      if (message.type === "SIGNAL_PRESENCE_AUTHORIZE") return authorize(message, sender);
      if (message.type === "SIGNAL_PRESENCE_END" && profile(sender)) return { ok: true, state: disarm("session-ended-confirm-again") };
      if (!popup(sender)) return { ok: false, error: "popup-only" };
      if (message.type === "SIGNAL_PRESENCE_ARM") return arm(Number(message.idleSeconds));
      if (message.type === "SIGNAL_PRESENCE_PAUSE") return { ok: true, state: disarm("manual-pause") };
      return { ok: true, state: snapshot() };
    });
    work.then(respond).catch(function () { disarm("verification-error-confirm-again"); respond({ ok: false, error: reason }); });
    return true;
  });
})(typeof self !== "undefined" ? self : globalThis);
