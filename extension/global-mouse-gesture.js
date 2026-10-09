(function () {
  "use strict";
  var MARKER = "__SIGNAL_INTERPRETER_GLOBAL_MOUSE_GESTURE_V2__";
  var prior = window[MARKER];
  if (prior && typeof prior.cleanup === "function") {
    try { prior.cleanup(); } catch (_) {}
  }
  var left = false, right = false, holdTimer = null, startedAt = 0;
  var fired = false, suppressUntil = 0, disposed = false, listeners = [];

  function listen(target, type, handler, capture) {
    target.addEventListener(type, handler, capture);
    listeners.push([target, type, handler, capture]);
  }
  function clearHoldTimer() {
    if (holdTimer !== null) clearTimeout(holdTimer);
    holdTimer = null;
  }
  function reset() {
    left = false; right = false; startedAt = 0; fired = false;
    clearHoldTimer();
  }
  function updateButtons(buttons) {
    var mask = Number(buttons) || 0;
    left = (mask & 1) === 1;
    right = (mask & 2) === 2;
    if (left && right) { arm(); return; }
    clearHoldTimer();
    startedAt = 0;
    if (!left && !right) fired = false;
  }
  function arm() {
    if (!left || !right || holdTimer !== null || fired || disposed) return;
    startedAt = Date.now();
    holdTimer = setTimeout(function () {
      holdTimer = null;
      if (!left || !right || fired || disposed) return;
      fired = true;
      suppressUntil = Date.now() + 800;
      try {
        chrome.runtime.sendMessage({
          type: "SIGNAL_EXTENSION_MICROPHONE_TOGGLE",
          source: "mouse-chord-global",
          gesture: "left+right-hold",
          holdMs: Date.now() - startedAt
        }, function (response) {
          var runtimeError = chrome.runtime && chrome.runtime.lastError;
          if (runtimeError) {
            console.warn("[SIGNAL-INTERPRETER] MICROPHONE_GESTURE_DELIVERY_ERROR", String(runtimeError.message || runtimeError));
          } else if (!response || response.ok !== true || response.verified !== true) {
            console.warn("[SIGNAL-INTERPRETER] MICROPHONE_GESTURE_NOT_VERIFIED", response && response.error || "no verified response");
          }
        });
      } catch (error) {
        console.warn("[SIGNAL-INTERPRETER] MICROPHONE_GESTURE_SEND_ERROR", String(error || "unknown"));
      }
    }, 240);
  }
  function pointerEvent(e) {
    if (!e || e.pointerType !== "mouse") return;
    updateButtons(e.buttons);
  }
  function mouseEvent(e) {
    if (!e || disposed) return;
    updateButtons(e.buttons);
  }
  function contextMenu(e) {
    if (e && ((left && right) || fired || Date.now() < suppressUntil)) {
      e.preventDefault(); e.stopPropagation();
    }
  }
  function consumeGestureClick(e) {
    if (e && (fired || Date.now() < suppressUntil)) {
      e.preventDefault(); e.stopPropagation();
    }
  }
  function cleanup() {
    disposed = true;
    clearHoldTimer();
    listeners.forEach(function (entry) {
      try { entry[0].removeEventListener(entry[1], entry[2], entry[3]); } catch (_) {}
    });
    listeners = [];
  }

  listen(document, "pointerdown", pointerEvent, true);
  listen(document, "pointermove", pointerEvent, true);
  listen(document, "pointerup", pointerEvent, true);
  listen(document, "pointercancel", reset, true);
  listen(document, "contextmenu", contextMenu, true);
  listen(document, "click", consumeGestureClick, true);
  listen(document, "auxclick", consumeGestureClick, true);
  if (typeof window.PointerEvent !== "function") {
    listen(document, "mousedown", mouseEvent, true);
    listen(document, "mousemove", mouseEvent, true);
    listen(document, "mouseup", mouseEvent, true);
  }
  if (window && typeof window.addEventListener === "function") {
    listen(window, "blur", reset, true);
    listen(window, "pagehide", cleanup, true);
  }
  window[MARKER] = { cleanup: cleanup, version: 2 };
})();