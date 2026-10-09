(function (root) {
  "use strict";

  var HOST_NAME = "com.signalinterpreter.captionhost";
  var port = null;
  var targetTabId = null;
  var targetCallId = null;
  var lastCaptionAt = 0;
  var lastErrorAt = 0;
  var lastNotifiedActive = false;
  var lastNotifiedVisible = false;
  var reconnectAttempt = 0;
  var reconnectTimer = null;
  var RECONNECT_DELAYS = [1000, 2500, 5000, 10000];

  function sendToTab(type, payload, tabIdOverride) {
    var tabId = Number(tabIdOverride == null ? targetTabId : tabIdOverride);
    if (!Number.isFinite(tabId)) return;
    try {
      var pending = chrome.tabs.sendMessage(tabId, Object.assign({ type: type }, payload || {}));
      if (pending && typeof pending.catch === "function") pending.catch(function () {});
    } catch (_) {}
  }

  function markError(error) {
    var now = Date.now();
    if (lastErrorAt > 0 && now >= lastErrorAt && now - lastErrorAt < 10000) return;
    lastErrorAt = now;
    try {
      if (root.SignalCaptionBridge && root.SignalCaptionBridge.onError) {
        root.SignalCaptionBridge.onError(String(error || "native-caption-error").slice(0, 240));
      }
    } catch (_) {}
  }

  function isFresh(maxAgeMs) {
    var maxAge = Number(maxAgeMs || 4500);
    return lastCaptionAt > 0 && (Date.now() - lastCaptionAt) <= maxAge;
  }

  function notifyStatus(raw, reason, force) {
    raw = raw || {};
    var visible = raw.visible === true;
    var fresh = isFresh(4500);
    var active = raw.active === true && fresh;
    var status = {
      active: active,
      visible: visible,
      captionFresh: fresh,
      lastCaptionAgeMs: lastCaptionAt > 0 ? Math.max(0, Date.now() - lastCaptionAt) : null,
      reason: String(reason || "native-status").slice(0, 80),
      error: raw.error ? String(raw.error).slice(0, 240) : null
    };
    sendToTab("SIGNAL_CAPTION_NATIVE_STATUS", status);
    if (force || active !== lastNotifiedActive || visible !== lastNotifiedVisible) {
      lastNotifiedActive = active;
      lastNotifiedVisible = visible;
      try {
        if (root.SignalCaptionBridge && root.SignalCaptionBridge.onStatus) {
          root.SignalCaptionBridge.onStatus(status);
        }
      } catch (_) {}
    }
    return status;
  }

  function handleMessage(message, ownerPort) {
    if (!message || typeof message !== "object") return;
    if (ownerPort && port && ownerPort !== port) return;

    if (message.type === "caption") {
      var text = String(message.text || "").trim();
      if (!text) return;
      lastCaptionAt = Date.now();
      sendToTab("SIGNAL_CAPTION_UPDATE", {
        caption: {
          text: text,
          language: message.language || "unknown",
          source: "chrome-live-caption",
          live: true,
          native: true
        }
      });
      notifyStatus({ active: true, visible: true }, "native-caption");
      return;
    }

    if (message.type === "status" || message.type === "heartbeat") {
      if (message.error) markError(message.error);
      if (message.active !== true) lastCaptionAt = 0;
      notifyStatus({
        active: message.active === true,
        visible: message.visible === true,
        error: message.error || null
      }, message.type === "heartbeat" ? "native-heartbeat" : "native-status");
    }
  }

  function clearReconnectTimer() {
    if (!reconnectTimer) return;
    try { clearTimeout(reconnectTimer); } catch (_) {}
    reconnectTimer = null;
  }

  function scheduleReconnect() {
    if (targetTabId == null || port || reconnectTimer) return;
    if (reconnectAttempt >= RECONNECT_DELAYS.length) {
      markError("native-reconnect-exhausted");
      return;
    }
    var delay = RECONNECT_DELAYS[reconnectAttempt];
    reconnectAttempt += 1;
    reconnectTimer = setTimeout(function () {
      reconnectTimer = null;
      if (targetTabId == null || port) return;
      if (!connect()) scheduleReconnect();
    }, delay);
  }

  function handleDisconnect(disconnectedPort) {
    if (port !== disconnectedPort) return;
    var error = chrome.runtime.lastError;
    port = null;
    lastCaptionAt = 0;
    notifyStatus({ active: false, visible: false, error: error && error.message }, "native-disconnect", true);
    if (error) markError(error.message || error);
    scheduleReconnect();
  }

  function connect() {
    if (targetTabId == null || port) return !!port;
    try {
      var nextPort = chrome.runtime.connectNative(HOST_NAME);
      port = nextPort;
      nextPort.onMessage.addListener(function (message) { handleMessage(message, nextPort); });
      nextPort.onDisconnect.addListener(function () { handleDisconnect(nextPort); });
      nextPort.postMessage({ type: "start" });
      reconnectAttempt = 0;
      return true;
    } catch (error) {
      port = null;
      markError(error);
      return false;
    }
  }

  function resetCallState() {
    lastCaptionAt = 0;
    lastNotifiedActive = false;
    lastNotifiedVisible = false;
    reconnectAttempt = 0;
  }

  function start(tabId, callId) {
    var nextTabId = Number(tabId);
    if (!Number.isFinite(nextTabId)) return false;
    var nextCallId = String(callId || "");
    var targetChanged = targetTabId !== nextTabId;
    var callChanged = !!nextCallId && targetCallId !== nextCallId;
    targetTabId = nextTabId;
    if (nextCallId) targetCallId = nextCallId;
    if (targetChanged || callChanged) {
      var previousPort = port;
      port = null;
      resetCallState();
      sendToTab("SIGNAL_CAPTION_SESSION_RESET", { reason: callChanged ? "new-call" : "target-changed" });
      notifyStatus({ active: false, visible: false }, "target-changed", true);
      if (previousPort) {
        try { previousPort.disconnect(); } catch (_) {}
      }
    }
    if (port) return true;
    var connected = connect();
    if (!connected) scheduleReconnect();
    return connected;
  }

  function stop() {
    clearReconnectTimer();
    var current = port;
    var lostTabId = targetTabId;
    port = null;
    targetTabId = null;
    targetCallId = null;
    resetCallState();
    sendToTab("SIGNAL_CAPTION_SESSION_RESET", { reason: "native-stopped" }, lostTabId);
    sendToTab("SIGNAL_CAPTION_NATIVE_STATUS", {
      active: false, visible: false, captionFresh: false, lastCaptionAgeMs: null, reason: "native-stopped"
    }, lostTabId);
    if (!current) return;
    try { current.disconnect(); } catch (_) {}
  }

  function getLastCaptionAt() {
    return lastCaptionAt;
  }

  root.SignalCaptionBridge = {
    start: start,
    stop: stop,
    isFresh: isFresh,
    getLastCaptionAt: getLastCaptionAt,
    onError: null,
    onStatus: null
  };
})(typeof globalThis !== "undefined" ? globalThis : self);
