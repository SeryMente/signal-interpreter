/* Presence authorization is ephemeral: storage preferences never arm the guard. */
(function (root) {
  "use strict";
  var armed = false, generation = 0, threshold = 0, lastCheck = Date.now();
  var consumed = new Set(), busy = false, leaseUntil = 0;
  var PROFILE = "https://app.cloudinterpreter.com/profile/cmu2wuz1v0uwr07adbzb9djfz";
  var KEY = "signalPresenceGuard";
  var SESSION_GRANT_KEY = "signalPresenceGrant";
  var SESSION_GRANT_SCHEMA = "signal-presence-session-grant/v1";
  var reason = "confirmation-required";
  var allowedSeconds = [60, 180, 300, 600];
  function snapshot() { return { armed: armed, generation: generation, idleSeconds: threshold, reason: reason }; }
  function publish() {
    // Only arm state, never input, captions or desktop content, is persisted.
    return chrome.storage.local.set({ signalPresenceGuard: snapshot() }).catch(function () {});
  }
  function clearSessionGrant() {
    if (!chrome.storage.session || typeof chrome.storage.session.remove !== "function") return Promise.resolve();
    return chrome.storage.session.remove(SESSION_GRANT_KEY).catch(function () {});
  }
  function disarm(why, preserveSessionGrant) {
    armed = false; generation++; reason = why || "confirmation-required";
    consumed.clear(); leaseUntil = 0;
    if (!preserveSessionGrant) clearSessionGrant();
    publish(); return snapshot();
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
    var stored = await chrome.storage.local.get(["signalLabLock", "effectifConfig"]);
    if (stored.signalLabLock === true || epoch !== generation) return { ok: false, error: "lab-or-state-changed", state: snapshot() };
    if (!chrome.storage.session || typeof chrome.storage.session.set !== "function") {
      disarm("presence-session-storage-unavailable");
      return { ok: false, error: reason, state: snapshot() };
    }
    try {
      await chrome.storage.session.set({[SESSION_GRANT_KEY]:{
        schema:SESSION_GRANT_SCHEMA,idleSeconds:seconds,grantedAt:Date.now()
      }});
    } catch (_) {
      disarm("presence-session-storage-unavailable");
      return { ok: false, error: reason, state: snapshot() };
    }
    if (epoch !== generation) { await clearSessionGrant(); return { ok: false, error: "state-changed", state: snapshot() }; }
    try { chrome.idle.setDetectionInterval(seconds); } catch (_) {
      disarm("idle-unavailable"); return { ok: false, error: reason, state: snapshot() };
    }
    threshold = seconds; lastCheck = Date.now(); armed = true; reason = "explicit-availability";
    await publish(); return { ok: true, state: snapshot() };
  }
  function profile(sender) {
    return sender && sender.id === chrome.runtime.id && sender.frameId === 0 && sender.tab &&
      Number.isInteger(sender.tab.id) && String(sender.url || "").split(/[?#]/)[0] === PROFILE &&
      String(sender.tab.url || "").split(/[?#]/)[0] === PROFILE;
  }
  async function authorize(message, sender) {
    continuity();
    if (!armed || busy || Date.now() < leaseUntil || !profile(sender) || message.modality !== "OPI") return { ok: false, error: "not-authorized", state: snapshot() };
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
      if (String(tab.url || "").split(/[?#]/)[0] !== PROFILE) return { ok: false, error: "route-changed" };
      var key = sender.tab.id + ":" + String(message.requestId || "");
      if (!message.requestId || consumed.has(key) || !armed || epoch !== generation || Date.now() - started > 1000) return { ok: false, error: "stale-or-used" };
      leaseUntil = Date.now() + 15000; // Cross-tab reservation, not a presence timeout.
      consumed.add(key);
      if (consumed.size > 1000) { disarm("confirmation-required"); return { ok: false, error: reason }; }
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
  async function restoreSessionAuthorization() {
    // MV3 may suspend and restart this worker while the operator remains active.
    // Restore only an explicit grant made in this browser session; never restore from preferences alone.
    disarm("worker-start-confirm-again", true);
    if (!chrome.storage.session || typeof chrome.storage.session.get !== "function") return snapshot();
    try {
      var storedGrant = await chrome.storage.session.get([SESSION_GRANT_KEY]);
      var grant = storedGrant && storedGrant[SESSION_GRANT_KEY];
      if (!grant || grant.schema !== SESSION_GRANT_SCHEMA || !allowedSeconds.includes(Number(grant.idleSeconds)) ||
          !Number.isFinite(Number(grant.grantedAt))) return snapshot();
      var epoch = generation, seconds = Number(grant.idleSeconds);
      var presence = await idleState(seconds);
      if (epoch !== generation) return snapshot();
      if (presence !== "active") { disarm("idle-or-locked-confirm-again"); return snapshot(); }
      var stored = await chrome.storage.local.get(["signalLabLock", "effectifConfig"]);
      if (epoch !== generation) return snapshot();
      if (stored.signalLabLock === true) { disarm("laboratory"); return snapshot(); }
      if (!stored.effectifConfig || stored.effectifConfig.autoAnswerEnabled !== true) {
        disarm("settings-changed-confirm-again"); return snapshot();
      }
      try { chrome.idle.setDetectionInterval(seconds); }
      catch (_) { disarm("idle-unavailable"); return snapshot(); }
      threshold = seconds;
      lastCheck = Date.now();
      armed = true;
      generation++;
      reason = "explicit-availability-restored";
      consumed.clear();
      leaseUntil = 0;
      await publish();
      return snapshot();
    } catch (_) {
      disarm("verification-error-confirm-again");
      return snapshot();
    }
  }
  root.SignalPresenceGuard = { snapshot: snapshot, disarm: disarm, arm: arm, authorize: authorize, toggleFromKeyboard: toggleFromKeyboard };
  disarm("worker-start-confirm-again", true);
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
    if (message.type === "SIGNAL_PRESENCE_AUTHORIZE") work = authorize(message, sender);
    else if (message.type === "SIGNAL_PRESENCE_END" && profile(sender)) work = Promise.resolve({ ok: true, state: disarm("session-ended-confirm-again") });
    else if (!popup(sender)) work = Promise.resolve({ ok: false, error: "popup-only" });
    else if (message.type === "SIGNAL_PRESENCE_ARM") work = arm(Number(message.idleSeconds));
    else if (message.type === "SIGNAL_PRESENCE_PAUSE") work = Promise.resolve({ ok: true, state: disarm("manual-pause") });
    else work = Promise.resolve({ ok: true, state: snapshot() });
    work.then(respond).catch(function () { disarm("verification-error-confirm-again"); respond({ ok: false, error: reason }); });
    return true;
  });
  restoreSessionAuthorization();
})(typeof self !== "undefined" ? self : globalThis);
