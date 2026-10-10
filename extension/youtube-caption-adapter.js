(function () {
  "use strict";

  var TARGET_VIDEO_ID = "TshOFzKQfG8";
  var core = globalThis.SignalCaptionCore;
  if (!core || location.hostname !== "www.youtube.com") return;

  function isTargetVideo() {
    if (location.pathname !== "/watch") return false;
    try { return new URLSearchParams(location.search).get("v") === TARGET_VIDEO_ID; }
    catch (_) { return false; }
  }

  var lastCaption = "";
  var lastStatus = false;
  var observer = null;
  var captionTimer = null;
  var routeTimer = null;
  var active = false;
  var lastHref = location.href;

  function emit(type, detail) {
    try { document.dispatchEvent(new CustomEvent(type, { detail: detail || {} })); } catch (_) {}
  }

  function readVisibleCaption() {
    if (!active || !isTargetVideo()) return "";
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
      stopObserver();
      return;
    }
    var caption = readVisibleCaption();
    if (!caption) {
      if (lastStatus) {
        lastStatus = false;
        emit("signal-interpreter-youtube-caption-status", { active: false });
      }
      lastCaption = "";
      return;
    }
    lastStatus = true;
    if (caption === lastCaption) return;
    lastCaption = caption;
    emit("signal-interpreter-youtube-caption", {
      text: caption.slice(0, 1500),
      language: core.resolveLanguage("unknown", caption),
      timestamp: Date.now()
    });
    emit("signal-interpreter-youtube-caption-status", { active: true });
  }

  function startObserver() {
    if (active || !isTargetVideo() || !document.documentElement) return;
    active = true;
    observer = new MutationObserver(checkCaption);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    captionTimer = setInterval(checkCaption, 500);
    checkCaption();
  }

  function stopObserver() {
    if (observer) observer.disconnect();
    if (captionTimer) clearInterval(captionTimer);
    observer = null;
    captionTimer = null;
    active = false;
    lastCaption = "";
    if (lastStatus) {
      lastStatus = false;
      emit("signal-interpreter-youtube-caption-status", { active: false });
    }
  }

  function reconcileRoute() {
    var href = location.href;
    var target = isTargetVideo();
    if (href === lastHref && target === active) return;
    lastHref = href;
    if (target) startObserver();
    else stopObserver();
  }

  document.addEventListener("yt-navigate-finish", reconcileRoute, true);
  window.addEventListener("popstate", reconcileRoute);
  routeTimer = setInterval(reconcileRoute, 800);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reconcileRoute, { once: true });
  } else {
    reconcileRoute();
  }

  window.addEventListener("pagehide", function () {
    stopObserver();
    if (routeTimer) clearInterval(routeTimer);
    routeTimer = null;
  }, { once: true });
})();