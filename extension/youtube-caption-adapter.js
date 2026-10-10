(function () {
  "use strict";

  var TARGET_VIDEO_ID = "TshOFzKQfG8";
  var core = globalThis.SignalCaptionCore;
  if (!core || location.hostname !== "www.youtube.com" || location.pathname !== "/watch") return;

  function isTargetVideo() {
    try { return new URLSearchParams(location.search).get("v") === TARGET_VIDEO_ID; }
    catch (_) { return false; }
  }

  if (!isTargetVideo()) return;

  var lastCaption = "";
  var lastStatus = false;
  var observer = null;
  var timer = null;

  function emit(type, detail) {
    try { document.dispatchEvent(new CustomEvent(type, { detail: detail || {} })); } catch (_) {}
  }

  function readVisibleCaption() {
    if (!isTargetVideo()) return "";
    var segments = [];
    var nodes = document.querySelectorAll("#movie_player .ytp-caption-window-container .ytp-caption-segment");
    nodes.forEach(function (node) {
      var value = core.normalizeText(node.textContent || "");
      if (value && segments.indexOf(value) < 0) segments.push(value);
    });
    return core.normalizeText(segments.join(" "));
  }

  function checkCaption() {
    if (!isTargetVideo()) {
      emit("signal-interpreter-youtube-caption-status", { active: false });
      lastCaption = "";
      if (observer) observer.disconnect();
      if (timer) clearInterval(timer);
      return;
    }
    var caption = readVisibleCaption();
    if (!caption) {
      if (lastStatus) {
        lastStatus = false;
        emit("signal-interpreter-youtube-caption-status", { active: false });
      }
      return;
    }
    lastStatus = true;
    if (caption === lastCaption) return;
    lastCaption = caption;
    emit("signal-interpreter-youtube-caption", {
      text: caption.slice(0, 4000),
      language: core.resolveLanguage("unknown", caption),
      timestamp: Date.now()
    });
    emit("signal-interpreter-youtube-caption-status", { active: true });
  }

  function startObserver() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(checkCaption);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    timer = setInterval(checkCaption, 500);
    checkCaption();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }

  window.addEventListener("pagehide", function () {
    if (observer) observer.disconnect();
    if (timer) clearInterval(timer);
    observer = null;
    timer = null;
  }, { once: true });
})();