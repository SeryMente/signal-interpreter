(function (root) {
  "use strict";

  var HOST_NAME = "com.signalinterpreter.captionhost";
  var port = null;
  var targetTabId = null;
  var lastCaptionAt = 0;
  var lastErrorAt = 0;

  function sendToTab(type, payload) {
    var tabId = Number(targetTabId);
    if (!Number.isFinite(tabId)) return;
    try {
      chrome.tabs.sendMessage(tabId, Object.assign({ type: type }, payload || {})).catch(function () {});
    } catch (_) {}
  }

  function markError(error) {
    var now = Date.now();
    if (now - lastErrorAt < 10000) return;
    lastErrorAt = now;
    try {
      root.SignalCaptionBridge && root.SignalCaptionBridge.onError && root.SignalCaptionBridge.onError(String(error || "native-caption-error"));
    } catch (_) {}
  }

  function handleMessage(message) {
    if (!message || typeof message !== "object") return;

    if (message.type === "caption") {
      lastCaptionAt = Date.now();
      sendToTab("SIGNAL_CAPTION_UPDATE", {
        caption: {
          text: message.text || "",
          language: message.language || "unknown",
          source: "chrome-live-caption",
          live: true,
          native: true
        }
      });
      sendToTab("SIGNAL_CAPTION_NATIVE_STATUS", { active: true, visible: true });
      return;
    }

    if (message.type === "status") {
      var status = {
        active: !!message.active,
        visible: !!message.visible,
        error: message.error || null
      };
      sendToTab("SIGNAL_CAPTION_NATIVE_STATUS", status);
      try {
        if (root.SignalCaptionBridge.onStatus) root.SignalCaptionBridge.onStatus(status);
      } catch (_) {}
    }
  }

  function disconnect() {
    var current = port;
    port = null;
    targetTabId = null;
    if (!current) return;
    try { current.disconnect(); } catch (_) {}
  }

  function start(tabId) {
    var nextTabId = Number(tabId);
    if (!Number.isFinite(nextTabId)) return false;

    targetTabId = nextTabId;
    if (port) return true;

    try {
      port = chrome.runtime.connectNative(HOST_NAME);
      port.onMessage.addListener(handleMessage);
      port.onDisconnect.addListener(function () {
        var error = chrome.runtime.lastError;
        var lostTabId = targetTabId;
        port = null;
        if (Number.isFinite(Number(lostTabId))) {
          try {
            chrome.tabs.sendMessage(Number(lostTabId), {
              type: "SIGNAL_CAPTION_NATIVE_STATUS",
              active: false,
              visible: false,
              error: error ? String(error.message || error) : null
            }).catch(function () {});
          } catch (_) {}
        }
        if (error) markError(error.message || error);
      });
      port.postMessage({ type: "start" });
      return true;
    } catch (error) {
      port = null;
      markError(error);
      return false;
    }
  }

  function isFresh(maxAgeMs) {
    var maxAge = Number(maxAgeMs || 4500);
    return lastCaptionAt > 0 && (Date.now() - lastCaptionAt) <= maxAge;
  }

  function getLastCaptionAt() {
    return lastCaptionAt;
  }

  root.SignalCaptionBridge = {
    start: start,
    stop: disconnect,
    isFresh: isFresh,
    getLastCaptionAt: getLastCaptionAt,
    onError: null,
    onStatus: null
  };
})(typeof globalThis !== "undefined" ? globalThis : self);
