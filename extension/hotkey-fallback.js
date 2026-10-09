(function () {
  "use strict";
  var MARKER = "__SIGNAL_INTERPRETER_MIC_HOTKEY_FALLBACK_V2__";
  var prior = window[MARKER];
  if (prior && typeof prior.cleanup === "function") {
    try { prior.cleanup(); } catch (_) {}
  }

  function isMicrophoneHotkey(event) {
    if (!event || event.isTrusted !== true || event.repeat || event.isComposing) return false;
    if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey) return false;
    // Prefer the physical key/code; keyCode is a compatibility fallback for keyboard layouts.
    var code = String(event.code || "");
    var key = String(event.key || "");
    var keyCode = Number(event.keyCode || event.which || 0);
    return code === "Period" || code === "NumpadDecimal" ||
      key === "." || key === ">" || keyCode === 190 || keyCode === 110;
  }

  function onKeyDown(event) {
    if (!isMicrophoneHotkey(event)) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      chrome.runtime.sendMessage({
        type: "SIGNAL_EXTENSION_MICROPHONE_KEYBOARD_FALLBACK",
        source: "global-content-hotkey-fallback",
        hotkey: "Ctrl+Shift+."
      }, function (response) {
        var runtimeError = chrome.runtime && chrome.runtime.lastError;
        if (runtimeError) {
          console.warn("[SIGNAL-INTERPRETER] MICROPHONE_HOTKEY_DELIVERY_ERROR", String(runtimeError.message || runtimeError));
        } else if (!response || response.ok !== true || response.verified !== true) {
          console.warn("[SIGNAL-INTERPRETER] MICROPHONE_HOTKEY_NOT_VERIFIED", response && response.error || "no verified response");
        }
      });
    } catch (error) {
      console.warn("[SIGNAL-INTERPRETER] MICROPHONE_HOTKEY_SEND_ERROR", String(error || "unknown"));
    }
  }

  // Capture at window scope before document/page handlers can consume the shortcut.
  var keyTarget = window && typeof window.addEventListener === "function" ? window : document;
  keyTarget.addEventListener("keydown", onKeyDown, true);
  window[MARKER] = {
    cleanup: function () { keyTarget.removeEventListener("keydown", onKeyDown, true); },
    version: 2
  };
})();