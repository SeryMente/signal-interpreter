(function (root) {
  "use strict";

  var HOST_NAME = "com.signalinterpreter.captionhost";
  var port = null;
  var nativeEvidence = {readyObserved:false,schema:null,statusMessages:0,captionMessages:0,lastType:null,windowDetected:null,textReadActive:null,readerErrorObserved:false};
  var targetTabId = null;
  var targetCallId = null;
  var lastCaptionAt = 0;
  var lastErrorAt = 0;
  var lastNotifiedActive = false;
  var lastNotifiedVisible = false;
  var reconnectAttempt = 0;
  var reconnectTimer = null;
  var connectionStartedAt = 0;
  var lastMessageAt = 0;
  var watchdogTimer = null;
  var currentStatus = { active:false, reason:"native-stopped", captureScope:"native-text-only" };
  var RECONNECT_DELAYS = [1000, 2500, 5000, 10000];

  function sendToTab(type, payload, tabIdOverride) {
    var tabId = Number(tabIdOverride == null ? targetTabId : tabIdOverride);
    if (!Number.isFinite(tabId)) return;
    try {
      var pending = chrome.tabs.sendMessage(tabId, Object.assign({ type: type }, payload || {}));
      if (pending && typeof pending.catch === "function") pending.catch(function () {});
    } catch (_) {}
  }

  function sendSessionEvent(type, payload, tabId) {
    try {
      if (root.SignalCaptionBridge && typeof root.SignalCaptionBridge.onSessionEvent === "function") {
        root.SignalCaptionBridge.onSessionEvent(type, payload || {}, tabId == null ? targetTabId : tabId);
        return;
      }
    } catch (_) {}
    sendToTab(type, payload, tabId);
  }

  function nativeErrorCode(error) {
    var message = String(error && error.message || error || "").toLowerCase();
    if (/not found|not registered|specified native messaging host/.test(message)) return "native-host-not-registered";
    if (/forbidden|access|permission/.test(message)) return "native-host-access-denied";
    if (/exited|broken pipe/.test(message)) return "native-host-exited";
    if (/reconnect-exhausted/.test(message)) return "native-reconnect-exhausted";
    if (/invalid|malformed/.test(message)) return "native-host-protocol-error";
    return "native-host-connection-error";
  }
  function getContext() { return { callId: targetCallId, tabId: targetTabId }; }
  function markError(error) {
    var now = Date.now();
    if (lastErrorAt > 0 && now >= lastErrorAt && now - lastErrorAt < 10000) return;
    lastErrorAt = now;
    try {
      if (root.SignalCaptionBridge && root.SignalCaptionBridge.onError) {
        root.SignalCaptionBridge.onError(nativeErrorCode(error), getContext());
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
      captureScope: "native-text-only",
      connected: !!port,
      callId: targetCallId,
      tabId: targetTabId,
      active: active,
      visible: visible,
      captionFresh: fresh,
      lastCaptionAgeMs: lastCaptionAt > 0 ? Math.max(0, Date.now() - lastCaptionAt) : null,
      reason: String(reason || "native-status").slice(0, 80),
      error: raw.error ? String(raw.error).slice(0, 240) : null,
      nativeEvidence: Object.assign({}, nativeEvidence)
    };
    var reasonChanged = currentStatus.reason !== status.reason;
    currentStatus = status;
    sendToTab("SIGNAL_CAPTION_NATIVE_STATUS", status);
    if (force || reasonChanged || active !== lastNotifiedActive || visible !== lastNotifiedVisible) {
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
    if (ownerPort && ownerPort !== port) return;
    lastMessageAt = Date.now();
    nativeEvidence.lastType = String(message.type || "unknown").slice(0,40);
    if (message.type === "ready") {
      nativeEvidence.schema = message.schema === "signal-caption-native/v1" ? message.schema : null;
      nativeEvidence.readyObserved = nativeEvidence.schema !== null;
      notifyStatus({active:false,visible:false}, "native-connected", true); return;
    }

    if (message.type === "caption") {
      var text = String(message.text || "").trim();
      if (!text) return;
      nativeEvidence.captionMessages += 1;
      nativeEvidence.windowDetected = message.visible === true;
      nativeEvidence.textReadActive = true;
      lastCaptionAt = Date.now();
      var caption = {
        text: text,
        language: message.language || "unknown",
        source: "chrome-live-caption",
        live: true,
        native: true
      };
      try {
        if (root.SignalCaptionBridge && typeof root.SignalCaptionBridge.onCaption === "function") {
          root.SignalCaptionBridge.onCaption(caption, targetTabId);
        } else {
          sendToTab("SIGNAL_CAPTION_UPDATE", { caption: caption });
        }
      } catch (_) {
        sendToTab("SIGNAL_CAPTION_UPDATE", { caption: caption });
      }
      notifyStatus({ active: true, visible: message.visible !== false }, "native-caption");
      return;
    }

    if (message.type === "status" || message.type === "heartbeat") {
      nativeEvidence.statusMessages += 1;
      nativeEvidence.windowDetected = message.visible === true;
      nativeEvidence.textReadActive = message.active === true;
      nativeEvidence.readerErrorObserved = nativeEvidence.readerErrorObserved || !!message.error;
      if (message.error) markError(message.error);
      if (message.type === "heartbeat" && connectionStartedAt > 0 &&
          Date.now() - connectionStartedAt >= 15000) reconnectAttempt = 0;
      if (message.active !== true) lastCaptionAt = 0;
      notifyStatus({
        active: message.active === true,
        visible: message.visible === true,
        error: message.error || null
      }, message.error ? "native-reader-error" : message.active !== true ? (message.visible === true ? "native-window-without-text" : "native-candidate-not-found") : (isFresh(4500) ? "native-caption" : "native-caption-stale"));
    }
  }

  function clearReconnectTimer() {
    if (!reconnectTimer) return;
    try { clearTimeout(reconnectTimer); } catch (_) {}
    reconnectTimer = null;
  }

  function scheduleReconnect() {
    if (targetTabId == null || port || reconnectTimer) return;
    var delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
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
    connectionStartedAt = 0;
    notifyStatus({ active: false, visible: false, error: error && error.message }, error ? nativeErrorCode(error) : "native-disconnect", true);
    if (error) markError(error.message || error);
    scheduleReconnect();
  }

  function connect() {
    if (targetTabId == null || port) return !!port;
    try {
      connectionStartedAt = Date.now();
      lastMessageAt = connectionStartedAt;
      if (!watchdogTimer && typeof setInterval === "function") watchdogTimer = setInterval(function () {
        if (!port || Date.now() - lastMessageAt < 15000) return;
        var stalePort = port;
        port = null; lastCaptionAt = 0;
        notifyStatus({active:false,visible:false}, "native-heartbeat-timeout", true);
        markError("native-heartbeat-timeout");
        try { stalePort.disconnect(); } catch (_) {}
        scheduleReconnect();
      }, 5000);
      var nextPort = chrome.runtime.connectNative(HOST_NAME);
      port = nextPort;
      nextPort.onMessage.addListener(function (message) { handleMessage(message, nextPort); });
      nextPort.onDisconnect.addListener(function () { handleDisconnect(nextPort); });
      nextPort.postMessage({ type: "start" });
      return true;
    } catch (error) {
      port = null;
      markError(error);
      notifyStatus({active:false,visible:false}, nativeErrorCode(error), true);
      return false;
    }
  }

  function resetCallState() {
    nativeEvidence = {readyObserved:false,schema:null,statusMessages:0,captionMessages:0,lastType:null,windowDetected:null,textReadActive:null,readerErrorObserved:false};
    lastCaptionAt = 0;
    lastNotifiedActive = false;
    lastNotifiedVisible = false;
    reconnectAttempt = 0;
    connectionStartedAt = 0;
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
      clearReconnectTimer();
      var previousPort = port;
      port = null;
      resetCallState();
      sendSessionEvent("SIGNAL_CAPTION_SESSION_RESET", { reason: callChanged ? "new-call" : "target-changed" }, nextTabId);
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
    if (watchdogTimer) { try { clearInterval(watchdogTimer); } catch (_) {} watchdogTimer = null; }
    currentStatus = {active:false,reason:"native-stopped",captureScope:"native-text-only"};
    var current = port;
    var lostTabId = targetTabId;
    port = null;
    targetTabId = null;
    targetCallId = null;
    resetCallState();
    if (lostTabId != null) sendSessionEvent("SIGNAL_CAPTION_SESSION_END", { reason: "native-stopped" }, lostTabId);
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
    nativeErrorCode: nativeErrorCode,
    getContext: getContext,
    getDiagnostics: function () { return Object.assign({}, nativeEvidence); },
    getStatus: function () { return Object.assign({}, currentStatus); },
    start: start,
    stop: stop,
    isFresh: isFresh,
    getLastCaptionAt: getLastCaptionAt,
    onError: null,
    onStatus: null
  };
})(typeof globalThis !== "undefined" ? globalThis : self);
