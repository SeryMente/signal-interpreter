/* Presence authorization is ephemeral: storage preferences never arm the guard. */
(function (root) {
  "use strict";
  var armed = false, generation = 0, threshold = 0, lastCheck = Date.now();
  var consumed = new Set(), busy = false, activeLease = null;
  var PROFILE = "https://app.cloudinterpreter.com/profile/cmu2wuz1v0uwr07adbzb9djfz";
  var KEY = "signalPresenceGuard";
  var reason = "confirmation-required";
  var allowedSeconds = [60, 180, 300, 600];
  function snapshot() { return { armed: armed, generation: generation, idleSeconds: threshold, reason: reason }; }
  function publish() {
    // Only arm state, never input, captions or desktop content, is persisted.
    return chrome.storage.local.set({ signalPresenceGuard: snapshot() }).catch(function () {});
  }
  function disarm(why) {
    armed = false; generation++; reason = why || "confirmation-required";
    consumed.clear(); activeLease = null; publish(); return snapshot();
  }
  function continuity() {
    var now = Date.now(), gap = now - lastCheck; lastCheck = now;
    if (gap < 0 || gap > 45000) disarm("observation-gap-confirm-again");
  }
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
    return sender && sender.id === chrome.runtime.id && !sender.tab &&
      sender.url === chrome.runtime.getURL("extension/ui/popup.html");
  }
  async function arm(seconds) {
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
    await publish(); return { ok: true, state: snapshot() };
  }
  async function armFromPlatform(message, sender) {
    continuity();
    if (!profile(sender)) return { ok: false, error: "sender-not-authorized", state: snapshot() };
    if (!message || message.availability !== "online" || message.userGesture !== true) {
      return { ok: false, error: "platform-online-not-user-confirmed", state: snapshot() };
    }
    var values;
    try { values = await chrome.storage.local.get(["signalLabLock", "effectifConfig"]); }
    catch (_) { disarm("verification-error-confirm-again"); return { ok: false, error: reason, state: snapshot() }; }
    if (values.signalLabLock === true) {
      disarm("laboratory"); return { ok: false, error: "laboratory", state: snapshot() };
    }
    var cfg = values.effectifConfig || {};
    var seconds = Number(cfg.presenceIdleSeconds);
    if (!allowedSeconds.includes(seconds)) {
      disarm("choose-idle-limit-confirm-again");
      return { ok: false, error: "choose-idle-limit", state: snapshot() };
    }
    var armedResult = await arm(seconds);
    if (!armedResult.ok) return armedResult;
    try {
      await chrome.storage.local.set({
        effectifConfig: Object.assign({}, cfg, { autoAnswerEnabled: true, presenceIdleSeconds: seconds })
      });
      if (!armed || generation !== armedResult.state.generation) {
        return { ok: false, error: "platform-state-changed", state: snapshot() };
      }
      return { ok: true, source: "platform-online-click", autoAnswerEnabled: true, state: snapshot() };
    } catch (_) {
      disarm("settings-write-failed-confirm-again");
      return { ok: false, error: reason, state: snapshot() };
    }
  }
  function authorizedProfileUrl(raw) {
    try {
      var url = new URL(String(raw || "").split(/[?#]/)[0]);
      var profile = new URL(PROFILE);
      var basePath = profile.pathname.replace(/\/+$/, "");
      var path = url.pathname.replace(/\/+$/, "");
      return url.origin === profile.origin && (path === basePath || path.indexOf(basePath + "/") === 0);
    } catch (_) { return false; }
  }
  function profile(sender) {
    return sender && sender.id === chrome.runtime.id && sender.frameId === 0 && sender.tab &&
      Number.isInteger(sender.tab.id) && authorizedProfileUrl(sender.url) &&
      authorizedProfileUrl(sender.tab.url);
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
        if (authorizedProfileUrl(url.href)) return true;
        if (url.origin !== "https://app.cloudinterpreter.com") return false;
        var path = url.pathname.replace(/\/+$/, "");
        if (path.indexOf("/call/") !== 0) return false;
        var callId = path.slice("/call/".length);
        return !!callId && callId.indexOf("/") === -1;
      } catch (_) { return false; }
    }
    return allowedPage(sender.url) && allowedPage(sender.tab.url) &&
      normalizedPage(sender.url) === normalizedPage(sender.tab.url);
  }
  function releaseAuthorization(message, sender) {
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
      if (!authorizedProfileUrl(tab.url)) return { ok: false, error: "route-changed" };
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
    if (armed) return { ok: true, state: disarm("manual-pause") };
    var stored = await chrome.storage.local.get(["effectifConfig"]);
    var cfg = stored.effectifConfig || {};
    var result = await arm(Number(cfg.presenceIdleSeconds));
    if (result.ok) await chrome.storage.local.set({ effectifConfig: Object.assign({}, cfg, { autoAnswerEnabled: true }) });
    return result;
  }
  root.SignalPresenceGuard = { snapshot: snapshot, disarm: disarm, arm: arm, armFromPlatform: armFromPlatform, authorize: authorize, releaseAuthorization: releaseAuthorization, toggleFromKeyboard: toggleFromKeyboard };
  disarm("worker-start-confirm-again");
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
    var work;
    if (message.type === "SIGNAL_PRESENCE_RELEASE") work = Promise.resolve(releaseAuthorization(message, sender));
    else if (message.type === "SIGNAL_PRESENCE_AUTHORIZE") work = authorize(message, sender);
    else if (message.type === "SIGNAL_PRESENCE_PLATFORM_ONLINE") work = armFromPlatform(message, sender);
    else if (message.type === "SIGNAL_PRESENCE_END" && profile(sender)) work = Promise.resolve({ ok: true, state: disarm("session-ended-confirm-again") });
    else if (!popup(sender)) work = Promise.resolve({ ok: false, error: "popup-only" });
    else if (message.type === "SIGNAL_PRESENCE_ARM") work = arm(Number(message.idleSeconds));
    else if (message.type === "SIGNAL_PRESENCE_PAUSE") work = Promise.resolve({ ok: true, state: disarm("manual-pause") });
    else work = Promise.resolve({ ok: true, state: snapshot() });
    work.then(respond).catch(function () { disarm("verification-error-confirm-again"); respond({ ok: false, error: reason }); });
    return true;
  });
})(typeof self !== "undefined" ? self : globalThis);
