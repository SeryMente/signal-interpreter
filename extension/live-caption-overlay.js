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

    var w = Math.min(420, Math.max(220, innerWidth - 28));
    var h = Math.min(210, Math.max(112, card.getBoundingClientRect().height || 156));
    var margin = 14;
    var candidates = [
      { name:"bottom-left", left:margin, top:innerHeight - h - margin },
      { name:"bottom-right", left:innerWidth - w - margin, top:innerHeight - h - margin },
      { name:"top-left", left:margin, top:margin },
      { name:"top-right", left:innerWidth - w - margin, top:margin }
    ];

    var rects = interactiveRects();
    var best = candidates.map(function (candidate) {
      var rect = { left:candidate.left, top:candidate.top, right:candidate.left+w, bottom:candidate.top+h, width:w, height:h };
      var score = rects.reduce(function (sum, item) { return sum + core.overlapRatio(rect, item); }, 0);
      return { candidate:candidate, score:score };
    }).sort(function (a,b) { return a.score - b.score; })[0].candidate;

    host.style.left = Math.max(margin, best.left) + "px";
    host.style.top = Math.max(margin, best.top) + "px";
    host.style.right = "auto";
    host.style.bottom = "auto";
  }

  function pushRow(text, language, source, isLive) {
    var clean = core.normalizeText(text);
    if (!clean) return;

    language = core.normalizeLanguage(language);
    if (language !== "en" && language !== "es") language = core.detectLanguage(clean);
    var now = Date.now();

    if (source === "chrome-live-caption") {
      if (liveNative && (now - liveNative.updatedAt) < 15000) {
        var previous = liveNative.text;
        var sameFamily = clean === previous ||
          clean.indexOf(previous) === 0 ||
          previous.indexOf(clean) === 0 ||
          (previous.length > 24 && clean.slice(0, 60) === previous.slice(0, 60));
        if (sameFamily) {
          liveNative.text = clean;
          liveNative.language = language;
          liveNative.updatedAt = now;
          var last = rows[rows.length - 1];
          if (last) { last.text = clean; last.language = language; last.live = true; }
          render();
          return;
        }
      }
      liveNative = { text:clean, language:language, updatedAt:now };
      rows.push({ text:clean, language:language, source:source, live:true, at:now });
      rows = rows.slice(-MAX_ROWS);
      render();
      return;
    }

    var duplicate = rows.some(function (row) {
      return row.source === source && now - row.at < 12000 && row.text === clean;
    });
    if (duplicate) return;

    rows.push({ text:clean, language:language, source:source, live:!!isLive, at:now });
    rows = rows.slice(-MAX_ROWS);
    liveNative = null;
    render();
  }

  function render() {
    ensureHost();
    if (!host || !root) return;
    var container = root.querySelector(".rows");
    var dot = root.querySelector(".dot");
    if (!container) return;

    var data = rows.slice(-MAX_ROWS);
    container.innerHTML = data.map(function (row) {
      var lang = row.language || "unknown";
      var cls = lang === "es" ? "row es" : "row";
      if (row.live) cls += " live";
      return '<div class="' + cls + '">' +
        '<i class="accent"></i>' +
        '<div><div class="meta"><span class="role">' + core.roleForLanguage(lang) + '</span><span class="lang">' + core.languageLabel(lang) + '</span></div><div class="text"></div></div>' +
      '</div>';
    }).join("");

    Array.from(container.querySelectorAll(".text")).forEach(function (el, index) {
      el.textContent = data[index].text;
    });

    dot.className = "dot" + (active ? "" : " idle");
    if (data.length && active) {
      host.style.display = "block";
      positionOverlay();
    } else if (!data.length) {
      host.style.display = "none";
    }
  }

  function applyConfig(next) {
    enabled = !next || next.liveCaptionOverlayEnabled !== false;
    if (!enabled) {
      active = false;
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
      setActive(true);
      pushRow(message.caption && message.caption.text, message.caption && message.caption.language, message.caption && message.caption.source, message.caption && message.caption.live);
    } else if (message.type === "SIGNAL_CAPTION_NATIVE_STATUS") {
      setActive(!!(message.active || message.visible));
    } else if (message.type === "EFFECTIF_HOTLOAD_REPLACE") {
      if (host) host.remove();
      host = null;
      root = null;
      active = false;
    }
  });

  window.addEventListener("resize", function () {
    if (positionRaf) cancelAnimationFrame(positionRaf);
    positionRaf = requestAnimationFrame(function () {
      positionRaf = null;
      positionOverlay();
    });
  });

  var routeTimer = setInterval(function () {
    if (!enabled) return;
    if (isCloudInterpreterPage()) {
      ensureHost();
      if (rows.length && active) render();
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
