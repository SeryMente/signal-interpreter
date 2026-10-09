(function () {
  "use strict";

  var core = globalThis.SignalCaptionCore;
  if (!core) return;

  var MAX_ROWS = 5;
  var rows = [];
  var liveNative = null;
  var host = null;
  var root = null;
  var enabled = true;
  var active = false;
  var positionRaf = null;
  var screenshotPreviousVisibility = null;

  function isCloudInterpreterPage() {
    return location.hostname === "app.cloudinterpreter.com";
  }

  function ensureHost() {
    if (!enabled || !isCloudInterpreterPage() || !document.documentElement) return;
    if (host && host.isConnected) return;

    host = document.createElement("div");
    host.id = "signal-interpreter-live-caption-overlay";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "all:initial;position:fixed;z-index:2147483647;pointer-events:none;display:none";

    root = host.attachShadow({ mode: "closed" });
    root.innerHTML =
      '<style>' +
      ':host{all:initial}' +
      '.card{box-sizing:border-box;width:420px;max-width:calc(100vw - 28px);padding:9px 11px 10px;border:1px solid rgba(118,213,255,.22);border-radius:12px;background:rgba(8,16,26,.90);box-shadow:0 10px 30px rgba(0,0,0,.22);backdrop-filter:blur(10px);color:#e9f4fb;font:12px/1.4 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.01em}' +
      '.head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;color:#6e899f;font-size:8px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}' +
      '.state{display:inline-flex;align-items:center;gap:5px}' +
      '.dot{width:6px;height:6px;border-radius:50%;background:#78e3ad;box-shadow:0 0 0 2px rgba(120,227,173,.10)}' +
      '.dot.idle{background:#6d8496;box-shadow:none}' +
      '.rows{display:grid;gap:5px}' +
      '.row{display:grid;grid-template-columns:7px 1fr;gap:8px;align-items:start;padding:4px 0}' +
      '.accent{width:3px;min-height:100%;border-radius:3px;background:#76d5ff}' +
      '.row.es .accent{background:#78e3ad}' +
      '.meta{display:flex;align-items:baseline;gap:7px;margin-bottom:1px}' +
      '.role{font-size:8px;font-weight:800;letter-spacing:.10em;color:#76d5ff}' +
      '.row.es .role{color:#78e3ad}' +
      '.lang{font-size:7px;font-weight:700;letter-spacing:.10em;color:#71889a}' +
      '.text{color:#ecf4f8;font-size:13px;line-height:1.38;word-break:break-word}' +
      '.row.live .text{color:#fff}' +
      '</style>' +
      '<section class="card" role="status" aria-live="polite">' +
        '<div class="head"><span class="state"><i class="dot"></i><span>INTERPRETACIÓN · SUBTÍTULOS</span></span><span>LIVE</span></div>' +
        '<div class="rows"></div>' +
      '</section>';

    document.documentElement.appendChild(host);
    positionOverlay();
  }

  function interactiveRects() {
    var selectors = ["button", "[role='button']", "a", "input", "select", "textarea", "[tabindex]:not([tabindex='-1'])"];
    var nodes = [];
    selectors.forEach(function (selector) {
      try { nodes = nodes.concat(Array.from(document.querySelectorAll(selector))); } catch (_) {}
    });
    var seen = new Set();
    return nodes.filter(function (el) {
      if (!el || seen.has(el) || (host && host.contains(el))) return false;
      seen.add(el);
      var style, rect;
      try { style = getComputedStyle(el); rect = el.getBoundingClientRect(); } catch (_) { return false; }
      if (!style || style.display === "none" || style.visibility === "hidden" || Number(style.opacity || 1) === 0) return false;
      if (!rect || rect.width < 2 || rect.height < 2) return false;
      return rect.bottom >= 0 && rect.right >= 0 && rect.left <= innerWidth && rect.top <= innerHeight;
    }).map(function (el) {
      var r = el.getBoundingClientRect();
      return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
    });
  }

  function positionOverlay() {
    if (!host || !root) return;
    var card = root.querySelector(".card");
    if (!card) return;

    var viewportWidth = Math.max(220, innerWidth || document.documentElement.clientWidth || 220);
    var viewportHeight = Math.max(180, innerHeight || document.documentElement.clientHeight || 180);
    var margin = 14;
    var w = Math.min(420, viewportWidth - margin * 2);
    var h = Math.min(210, Math.max(112, card.getBoundingClientRect().height || 156));
    var centerX = (viewportWidth - w) / 2;
    var centerY = (viewportHeight - h) / 2;
    var edgeX = Math.max(margin, viewportWidth - w - margin);
    var edgeY = Math.max(margin, viewportHeight - h - margin);
    var rawCandidates = [
      { name: "bottom-left", left: margin, top: edgeY },
      { name: "bottom-right", left: edgeX, top: edgeY },
      { name: "top-left", left: margin, top: margin },
      { name: "top-right", left: edgeX, top: margin },
      { name: "left-center", left: margin, top: centerY },
      { name: "right-center", left: edgeX, top: centerY },
      { name: "top-center", left: centerX, top: margin },
      { name: "bottom-center", left: centerX, top: edgeY }
    ];
    var candidates = rawCandidates.map(function (candidate) {
      return Object.assign({}, candidate, {
        left: Math.max(margin, Math.min(edgeX, candidate.left)),
        top: Math.max(margin, Math.min(edgeY, candidate.top))
      });
    });
    var rects = interactiveRects();
    var best = candidates.map(function (candidate) {
      var rect = {
        left: candidate.left, top: candidate.top,
        right: candidate.left + w, bottom: candidate.top + h,
        width: w, height: h
      };
      var score = rects.reduce(function (sum, item) {
        var overlap = core.overlapRatio(rect, item);
        var controlArea = Math.max(1, item.width * item.height);
        var functionalWeight = controlArea < 1800 ? 1.5 : 1;
        return sum + overlap * functionalWeight;
      }, 0);
      return { candidate: candidate, score: score };
    }).sort(function (a, b) { return a.score - b.score; })[0].candidate;

    host.style.width = w + "px";
    host.style.left = best.left + "px";
    host.style.top = best.top + "px";
    host.style.right = "auto";
    host.style.bottom = "auto";
  }

  function laneForSource(source) {
    return source === "yo" ? "yo" : "cliente";
  }

  function pushRow(text, language, source, isLive) {
    var clean = core.normalizeText(text);
    if (!clean) return;
    source = source === "yo" || source === "chrome-live-caption" ? source : "cliente";
    language = core.resolveLanguage(language, clean);
    var now = Date.now();
    var lane = laneForSource(source);
    var candidate = null;

    for (var i = rows.length - 1; i >= 0; i -= 1) {
      if (laneForSource(rows[i].source) !== lane) continue;
      if (now - Number(rows[i].at || 0) > 12000) break;
      candidate = rows[i];
      break;
    }

    if (candidate) {
      var relation = core.captionRelation(candidate.text, clean);
      if (relation !== "new") {
        if (relation === "duplicate" || relation === "stale") {
          if (relation === "duplicate") {
            candidate.at = now;
            if (language !== "unknown") candidate.language = language;
            if (source === "chrome-live-caption") {
              candidate.source = source;
              candidate.live = true;
            } else if (candidate.source !== "chrome-live-caption") {
              candidate.source = source;
              candidate.live = !!isLive;
            }
            render();
          }
          return;
        }
        var previousAt = Number(candidate.at || 0);
        var previousSource = candidate.source;
        candidate.text = core.mergeCaptionText(candidate.text, clean).slice(0, 4000);
        candidate.at = now;
        if (language !== "unknown" || candidate.language === "unknown") candidate.language = language;
        if (source === "chrome-live-caption") {
          candidate.source = source;
          candidate.live = true;
        } else if (previousSource !== "chrome-live-caption" || now - previousAt > 4500) {
          candidate.source = source;
          candidate.live = !!isLive;
        }
        render();
        return;
      }
    }

    rows.push({ text: clean, language: language, source: source, live: !!isLive, at: now });
    rows = rows.slice(-MAX_ROWS);
    render();
  }

  function createRowNode() {
    var row = document.createElement("div");
    row.className = "row";
    var accent = document.createElement("i");
    accent.className = "accent";
    var body = document.createElement("div");
    var meta = document.createElement("div");
    meta.className = "meta";
    var role = document.createElement("span");
    role.className = "role";
    var lang = document.createElement("span");
    lang.className = "lang";
    var text = document.createElement("div");
    text.className = "text";
    meta.appendChild(role);
    meta.appendChild(lang);
    body.appendChild(meta);
    body.appendChild(text);
    row.appendChild(accent);
    row.appendChild(body);
    return row;
  }

  function render() {
    ensureHost();
    if (!host || !root) return;
    var container = root.querySelector(".rows");
    var dot = root.querySelector(".dot");
    if (!container) return;

    var data = rows.slice(-MAX_ROWS);
    while (container.children.length > data.length) {
      container.removeChild(container.lastElementChild);
    }
    data.forEach(function (item, index) {
      var node = container.children[index];
      if (!node) {
        node = createRowNode();
        container.appendChild(node);
      }
      var language = item.language || "unknown";
      node.className = "row" + (language === "es" ? " es" : "") + (item.live ? " live" : "");
      var role = node.querySelector(".role");
      var lang = node.querySelector(".lang");
      var text = node.querySelector(".text");
      if (role && role.textContent !== core.roleForLanguage(language)) role.textContent = core.roleForLanguage(language);
      if (lang && lang.textContent !== core.languageLabel(language)) lang.textContent = core.languageLabel(language);
      if (text && text.textContent !== item.text) text.textContent = item.text;
    });

    if (dot) dot.className = "dot" + (active ? "" : " idle");
    var newestAt = data.reduce(function (latest, item) {
      return Math.max(latest, Number(item.at || 0));
    }, 0);
    var hasRecentContext = newestAt > 0 && Date.now() - newestAt <= 12000;
    if (data.length && (active || hasRecentContext)) {
      host.style.display = "block";
      positionOverlay();
    } else {
      host.style.display = "none";
    }
  }

  function applyConfig(next) {
    enabled = !next || next.liveCaptionOverlayEnabled !== false;
    if (!enabled) {
      active = false;
      rows = [];
      if (host) host.style.display = "none";
      return;
    }
    if (isCloudInterpreterPage()) ensureHost();
    render();
  }

  function setActive(value) {
    active = !!value;
    render();
  }

  chrome.storage.local.get(["effectifConfig"], function (stored) {
    applyConfig(stored.effectifConfig || {});
  });

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "local" && changes.effectifConfig) applyConfig(changes.effectifConfig.newValue || {});
  });

  chrome.runtime.onMessage.addListener(function (message) {
    if (!message) return;
    if (message.type === "SIGNAL_CAPTION_UPDATE") {
      var caption = message.caption || {};
      if (caption.text) {
        pushRow(caption.text, caption.language, caption.source, caption.live);
        setActive(true);
      }
    } else if (message.type === "SIGNAL_CAPTION_NATIVE_STATUS") {
      var statusActive = message.captionFresh === false
        ? false
        : (message.active === true || (message.captionFresh == null && message.visible === true));
      setActive(statusActive);
    } else if (message.type === "SIGNAL_CAPTION_SESSION_RESET") {
      rows = [];
      active = false;
      render();
    } else if (message.type === "EFFECTIF_SCREENSHOT_PREPARE") {
      if (host && host.isConnected && screenshotPreviousVisibility === null) {
        screenshotPreviousVisibility = host.style.visibility;
        host.style.visibility = "hidden";
      }
    } else if (message.type === "EFFECTIF_SCREENSHOT_RESTORE") {
      if (host && host.isConnected) {
        host.style.visibility = screenshotPreviousVisibility === null ? "" : screenshotPreviousVisibility;
      }
      screenshotPreviousVisibility = null;
    } else if (message.type === "EFFECTIF_HOTLOAD_REPLACE") {
      rows = [];
      active = false;
      if (host) host.remove();
      host = null;
      root = null;
    }
  });

  function schedulePosition() {
    if (positionRaf) return;
    positionRaf = requestAnimationFrame(function () {
      positionRaf = null;
      positionOverlay();
    });
  }

  window.addEventListener("resize", schedulePosition);
  window.addEventListener("scroll", schedulePosition, true);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", schedulePosition);
    window.visualViewport.addEventListener("scroll", schedulePosition);
  }

  var routeTimer = setInterval(function () {
    if (!enabled) return;
    if (isCloudInterpreterPage()) {
      ensureHost();
      if (rows.length) render();
    } else if (host) {
      host.style.display = "none";
      active = false;
    }
  }, 2000);

  window.addEventListener("pagehide", function () {
    clearInterval(routeTimer);
    if (host) host.remove();
  });

  ensureHost();
})();
