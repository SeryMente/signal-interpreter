(function () {
  "use strict";
  var MARKER = "__SIGNAL_INTERPRETER_MIC_HOTKEY_FALLBACK_V1__";
  var prior = window[MARKER];
  if (prior && typeof prior.cleanup === "function") {
    try { prior.cleanup(); } catch (_) {}
  }
  function isMicrophoneHotkey(event) {
    if (!event || event.isTrusted !== true || event.repeat || event.isComposing) return false;
    if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey) return false;
    return event.code === "Period" || event.code === "NumpadDecimal" ||
      event.key === "." || event.key === ">";
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
  document.addEventListener("keydown", onKeyDown, true);
  window[MARKER] = {
    cleanup: function () { document.removeEventListener("keydown", onKeyDown, true); },
    version: 1
  };
})();