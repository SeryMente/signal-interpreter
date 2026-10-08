(function () {
  "use strict";
  var MARKER = "__SIGNAL_INTERPRETER_GLOBAL_MOUSE_GESTURE_V1__";
  if (window[MARKER]) return;
  window[MARKER] = true;

  var left = false;
  var right = false;
  var timer = null;
  var start = 0;
  var fired = false;

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function reset() {
    left = false;
    right = false;
    fired = false;
    start = 0;
    clearTimer();
  }

  function mouse(e) {
    return !!e && e.pointerType === "mouse";
  }

  function arm() {
    if (!left || !right || timer || fired) return;
    start = Date.now();
    timer = setTimeout(function () {
      timer = null;
      if (!left || !right || fired) return;
      fired = true;
      try {
        chrome.runtime.sendMessage({
          type: "SIGNAL_EXTENSION_MICROPHONE_TOGGLE",
          source: "mouse-chord-global",
          gesture: "left+right-hold",
          holdMs: Date.now() - start
        }, function (response) {
          var runtimeError = chrome.runtime && chrome.runtime.lastError;
          if (runtimeError) {
            console.warn("[SIGNAL-INTERPRETER] MICROPHONE_GESTURE_DELIVERY_ERROR", String(runtimeError.message || runtimeError));
          } else if (!response || response.ok !== true || response.verified !== true) {
            console.warn("[SIGNAL-INTERPRETER] MICROPHONE_GESTURE_NOT_VERIFIED", response && response.error || "no verified response");
          }
        });
      } catch (_) {}
    }, 240);
  }

  document.addEventListener("pointerdown", function (e) {
    if (!mouse(e)) return;
    if (e.button === 0) left = true;
    if (e.button === 2) right = true;
    if (left && right && (e.buttons & 3) === 3) arm();
  }, true);

  document.addEventListener("pointerup", function (e) {
    if (!mouse(e)) return;
    if (e.button === 0) left = false;
    if (e.button === 2) right = false;
    if (!left || !right) {
      clearTimer();
      start = 0;
    }
    if (!left && !right) fired = false;
  }, true);

  document.addEventListener("pointercancel", reset, true);
  if (window && typeof window.addEventListener === "function") window.addEventListener("blur", reset, true);

  document.addEventListener("contextmenu", function (e) {
    if ((left && right) || fired) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  document.addEventListener("click", function (e) {
    if (!fired) return;
    e.preventDefault();
    e.stopPropagation();
    fired = false;
  }, true);

  document.addEventListener("auxclick", function (e) {
    if (!fired) return;
    e.preventDefault();
    e.stopPropagation();
    fired = false;
  }, true);
})();
