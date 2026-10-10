(function () {
  "use strict";

  var core = globalThis.SignalCaptionCore;
  if (!core || !globalThis.chrome || !chrome.runtime || !chrome.storage) return;

  var MAX_HISTORY = 800;
  var rows = [];
  var host = null;
  var root = null;
  var config = { liveCaptionOverlayEnabled: true, liveCaptionOverlayScope: "source-only" };
  var layout = { left: null, top: null, width: 560, height: 400, manual: false };
  var sourceTabId = null;
  var isSourceTab = false;
  var callActive = false;
  var pageAllowed = false;
  var youtubeTarget = false;
  var active = false;
  var sessionEnded = false;
  var collapsed = false;
  var unreadCount = 0;
  var dragging = null;
  var resizing = null;
  var positionRaf = null;
  var saveLayoutTimer = null;
  var toastTimer = null;
  var screenshotPreviousVisibility = null;
  var contextReady = false;

  function isCloudInterpreterPage() {
    return location.hostname === "app.cloudinterpreter.com";
  }

  function isYoutubeTargetPage() {
    if (location.hostname !== "www.youtube.com" || location.pathname !== "/watch") return false;
    try { return new URLSearchParams(location.search).get("v") === "TshOFzKQfG8"; }
    catch (_) { return false; }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || min));
  }

  function scopeIsGlobal() {
    return config.liveCaptionOverlayScope === "all-tabs";
  }

  function canShowOnThisPage() {
    if (config.liveCaptionOverlayEnabled === false || !contextReady || !pageAllowed) return false;
    if (youtubeTarget) return true;
    if (scopeIsGlobal()) return callActive || rows.length > 0 || sessionEnded;
    return isSourceTab && (callActive || rows.length > 0 || sessionEnded);
  }

  function ensureHost() {
    if (!canShowOnThisPage() || !document.documentElement) return;
    if (host && host.isConnected) return;

    host = document.createElement("div");
    host.id = "signal-interpreter-live-caption-overlay";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "all:initial;position:fixed;z-index:2147483647;pointer-events:none;display:none;left:12px;top:12px;width:560px;height:400px;overflow:visible";

    root = host.attachShadow({ mode: "closed" });
    root.innerHTML =
      '<style>' +
      ':host{all:initial;pointer-events:none;color-scheme:dark}' +
      '.card{box-sizing:border-box;position:relative;display:flex;flex-direction:column;gap:0;width:100%;height:100%;min-width:300px;min-height:190px;max-width:calc(100vw - 12px);max-height:calc(100vh - 12px);overflow:hidden;border:1px solid rgba(125,211,252,.34);border-radius:14px;background:rgba(9,15,24,.97);box-shadow:0 12px 38px rgba(0,0,0,.42);backdrop-filter:blur(16px);color:#edf5fb;font:13px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:0;pointer-events:auto}' +
      '.header{display:flex;align-items:center;gap:8px;min-height:45px;padding:6px 8px 6px 10px;border-bottom:1px solid #263748;background:linear-gradient(115deg,rgba(24,42,59,.98),rgba(13,22,33,.98));user-select:none}' +
      '.move{display:flex;flex:1;align-items:center;justify-content:space-between;gap:10px;min-width:0;padding:2px 0;border:0;background:transparent;color:inherit;text-align:left;cursor:grab;touch-action:none}' +
      '.move:active{cursor:grabbing}' +
      '.brand{display:flex;flex-direction:column;gap:2px;min-width:0}' +
      '.title{font-size:12px;line-height:1.25;font-weight:800;letter-spacing:.02em;color:#f0f7ff}' +
      '.subtitle{font-size:10px;font-weight:500;color:#8fa8bc;letter-spacing:0}' +
      '.state{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;color:#a7bfd2;font-size:10px;font-weight:700;letter-spacing:.04em}' +
      '.dot{width:7px;height:7px;flex:0 0 auto;border-radius:50%;background:#7fe0ad;box-shadow:0 0 0 3px rgba(127,224,173,.10)}' +
      '.dot.idle{background:#708396;box-shadow:none}' +
      '.toolbar{display:flex;align-items:center;gap:4px;flex:0 0 auto}' +
      '.tool{display:inline-flex;align-items:center;justify-content:center;min-width:30px;min-height:29px;padding:4px 7px;border:1px solid #354b5e;border-radius:7px;background:#132130;color:#d9e8f4;font:700 11px/1.1 Inter,system-ui,sans-serif;cursor:pointer}' +
      '.tool:hover{background:#20364a;border-color:#55738b}' +
      '.tool:focus-visible,.move:focus-visible,.unread:focus-visible,.resize:focus-visible{outline:2px solid #7dd3fc;outline-offset:2px}' +
      '.transcript{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#4a6377 #0c141f;padding:8px 12px 18px;display:flex;flex-direction:column;gap:7px;overflow-anchor:auto}' +
      '.row{display:grid;grid-template-columns:3px minmax(0,1fr);align-items:stretch;gap:9px;padding:6px 0 7px;border-bottom:1px solid rgba(83,111,135,.22)}' +
      '.row:last-child{border-bottom:0}' +
      '.accent{display:block;width:3px;min-height:100%;border-radius:4px;background:#76d5ff}' +
      '.row.es .accent{background:#7fe0ad}' +
      '.body{min-width:0}' +
      '.meta{display:flex;flex-wrap:wrap;align-items:baseline;gap:7px;margin-bottom:3px}' +
      '.role{color:#79d5ff;font-size:10px;font-weight:800;letter-spacing:.07em}' +
      '.row.es .role{color:#84e8b0}' +
      '.lang{color:#8197aa;font-size:9px;font-weight:700;letter-spacing:.07em}' +
      '.time{margin-left:auto;color:#687d90;font-size:9px;font-variant-numeric:tabular-nums}' +
      '.text{color:#eaf2f8;font-size:13px;line-height:1.52;overflow-wrap:anywhere;white-space:pre-wrap;user-select:text}' +
      '.row.live .text{color:#fff}' +
      '.smart-token{display:inline;border:0;border-bottom:1px dotted #8fcfff;border-radius:2px;padding:0 1px;background:rgba(64,143,190,.10);color:inherit;font:inherit;cursor:pointer;user-select:text}' +
      '.smart-token[data-smart-type="phone"]{border-bottom-color:#8ae2b1;background:rgba(75,187,126,.10)}' +
      '.smart-token:hover,.smart-token:focus-visible{background:rgba(79,171,224,.24);outline:1px solid rgba(125,211,252,.55);outline-offset:1px}' +
      '.action-toast{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);z-index:4;max-width:calc(100% - 22px);padding:7px 10px;border:1px solid #49657a;border-radius:8px;background:#132232;color:#f2f8fc;font:600 11px/1.35 Inter,system-ui,sans-serif;box-shadow:0 5px 18px rgba(0,0,0,.3);pointer-events:none;text-align:center}' +
      '.empty{padding:18px 8px;color:#9badbc;font-size:12px;line-height:1.55;text-align:center}' +
      '.unread{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);z-index:2;max-width:calc(100% - 24px);min-height:30px;padding:6px 12px;border:1px solid #42627a;border-radius:999px;background:#183047;color:#eaf6ff;box-shadow:0 4px 14px rgba(0,0,0,.32);font:700 11px Inter,system-ui,sans-serif;cursor:pointer}' +
      '.resize{position:absolute;right:3px;bottom:3px;z-index:3;width:23px;height:23px;min-width:23px;min-height:23px;padding:0;border:0;border-radius:5px;background:linear-gradient(135deg,transparent 46%,#7192aa 47%,#7192aa 53%,transparent 54%);color:#c5dced;cursor:nwse-resize;touch-action:none;pointer-events:auto}' +
      '.resize::after{content:"";position:absolute;right:4px;bottom:4px;width:7px;height:7px;border-right:2px solid #b7cee0;border-bottom:2px solid #b7cee0}' +
      '.collapsed .transcript,.collapsed .unread,.collapsed .resize{display:none!important}' +
      '.collapsed .header{border-bottom:0;border-radius:13px}' +
      '@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}' +
      '</style>' +
      '<section class="card" role="region" aria-label="Subtítulos en vivo de Signal Interpreter">' +
        '<header class="header">' +
          '<button class="move" type="button" aria-label="Mover panel: arrastra este encabezado o usa las flechas del teclado">' +
            '<span class="brand"><span class="title">Signal Interpreter</span><span class="subtitle">Clic: copiar teléfono/dirección · Ctrl+clic: verificar · Ctrl+Mayús+clic: Linguee</span></span>' +
            '<span class="state"><i class="dot idle"></i><span class="stateLabel">EN ESPERA</span></span>' +
          '</button>' +
          '<div class="toolbar"><button class="tool auto" type="button" title="Restablecer posición y tamaño automáticos">Auto</button><button class="tool collapse" type="button" aria-expanded="true" title="Contraer o expandir el historial">−</button></div>' +
        '</header>' +
        '<div class="transcript" role="log" aria-label="Historial completo de subtítulos" aria-live="off" tabindex="0"><div class="empty">Esperando la primera intervención…</div></div>' +
        '<button class="unread" type="button" hidden>Nuevas intervenciones ↓</button>' +
        '<button class="resize" type="button" aria-label="Cambiar tamaño: arrastra la esquina o usa las flechas del teclado" title="Arrastra para redimensionar"></button>' +
        '<div class="action-toast" role="status" aria-live="polite" hidden></div>' +
      '</section>';

    document.documentElement.appendChild(host);
    bindControls();
    bindCaptionTextActions();
    applyLayout();
    updateAriaVisibility();
  }

  function interactiveRects() {
    var selectors = [
      'button', '[role="button"]', 'a', 'input', 'select', 'textarea',
      '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]'
    ];
    var nodes = [];
    selectors.forEach(function (selector) {
      try { nodes = nodes.concat(Array.from(document.querySelectorAll(selector))); } catch (_) {}
    });
    var seen = new Set();
    return nodes.filter(function (el) {
      if (!el || seen.has(el) || el === host || (host && host.contains(el))) return false;
      seen.add(el);
      var style, rect;
      try { style = getComputedStyle(el); rect = el.getBoundingClientRect(); } catch (_) { return false; }
      if (!style || style.display === "none" || style.visibility === "hidden" || Number(style.opacity || 1) === 0) return false;
      if (!rect || rect.width < 3 || rect.height < 3) return false;
      return rect.bottom >= 0 && rect.right >= 0 && rect.left <= innerWidth && rect.top <= innerHeight;
    }).map(function (el) {
      var r = el.getBoundingClientRect();
      return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
    });
  }

  function positionOverlay() {
    if (!host || !root || !canShowOnThisPage() || layout.manual || collapsed) return;
    var card = root.querySelector(".card");
    if (!card) return;
    var viewportWidth = Math.max(320, innerWidth || document.documentElement.clientWidth || 320);
    var viewportHeight = Math.max(200, innerHeight || document.documentElement.clientHeight || 200);
    var margin = 12;
    var width = clamp(layout.width, 300, Math.max(300, viewportWidth - margin * 2));
    var height = clamp(layout.height, 190, Math.max(190, viewportHeight - margin * 2));
    var edgeX = Math.max(margin, viewportWidth - width - margin);
    var edgeY = Math.max(margin, viewportHeight - height - margin);
    var centerX = Math.max(margin, (viewportWidth - width) / 2);
    var centerY = Math.max(margin, (viewportHeight - height) / 2);
    var candidates = [
      { name:"bottom-left", left:margin, top:edgeY },
      { name:"bottom-right", left:edgeX, top:edgeY },
      { name:"top-right", left:edgeX, top:margin },
      { name:"top-left", left:margin, top:margin },
      { name:"right-center", left:edgeX, top:centerY },
      { name:"left-center", left:margin, top:centerY },
      { name:"top-center", left:centerX, top:margin },
      { name:"bottom-center", left:centerX, top:edgeY }
    ];
    var rects = interactiveRects();
    var best = core.choosePositionCandidate(candidates, rects, width, height) || candidates[0];
    host.style.width = width + "px";
    host.style.height = height + "px";
    host.style.left = clamp(best.left, 6, Math.max(6, viewportWidth - width - 6)) + "px";
    host.style.top = clamp(best.top, 6, Math.max(6, viewportHeight - height - 6)) + "px";
    host.style.right = "auto";
    host.style.bottom = "auto";
  }

  function applyLayout() {
    if (!host || !root) return;
    var viewportWidth = Math.max(320, innerWidth || document.documentElement.clientWidth || 320);
    var viewportHeight = Math.max(200, innerHeight || document.documentElement.clientHeight || 200);
    layout.width = clamp(layout.width, 300, Math.max(300, viewportWidth - 12));
    layout.height = clamp(layout.height, 190, Math.max(190, viewportHeight - 12));
    if (layout.manual && Number.isFinite(Number(layout.left)) && Number.isFinite(Number(layout.top))) {
      host.style.width = layout.width + "px";
      host.style.height = layout.height + "px";
      host.style.left = clamp(layout.left, 6, Math.max(6, viewportWidth - layout.width - 6)) + "px";
      host.style.top = clamp(layout.top, 6, Math.max(6, viewportHeight - layout.height - 6)) + "px";
      host.style.right = "auto";
      host.style.bottom = "auto";
    } else {
      positionOverlay();
    }
  }

  function persistLayoutSoon() {
    if (saveLayoutTimer) clearTimeout(saveLayoutTimer);
    saveLayoutTimer = setTimeout(function () {
      saveLayoutTimer = null;
      try { chrome.storage.local.set({ signalCaptionOverlayLayout: layout }); } catch (_) {}
    }, 180);
  }

  function saveManualPosition() {
    if (!host) return;
    var rect = host.getBoundingClientRect();
    layout.left = clamp(rect.left, 6, Math.max(6, innerWidth - rect.width - 6));
    layout.top = clamp(rect.top, 6, Math.max(6, innerHeight - rect.height - 6));
    layout.width = rect.width;
    layout.height = rect.height;
    layout.manual = true;
    persistLayoutSoon();
  }

  function startDrag(event) {
    if (!host || event.button !== 0 || collapsed) return;
    var rect = host.getBoundingClientRect();
    dragging = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top
    };
    event.preventDefault();
  }

  function startResize(event) {
    if (!host || event.button !== 0 || collapsed) return;
    var rect = host.getBoundingClientRect();
    resizing = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: rect.width,
      height: rect.height
    };
    event.preventDefault();
    event.stopPropagation();
  }

  function handlePointerMove(event) {
    if (dragging && (dragging.pointerId == null || dragging.pointerId === event.pointerId) && host) {
      var width = host.getBoundingClientRect().width;
      var height = host.getBoundingClientRect().height;
      host.style.left = clamp(dragging.left + event.clientX - dragging.startX, 6, Math.max(6, innerWidth - width - 6)) + "px";
      host.style.top = clamp(dragging.top + event.clientY - dragging.startY, 6, Math.max(6, innerHeight - height - 6)) + "px";
      layout.manual = true;
      event.preventDefault();
    } else if (resizing && (resizing.pointerId == null || resizing.pointerId === event.pointerId) && host) {
      var maxWidth = Math.max(300, innerWidth - 12);
      var maxHeight = Math.max(190, innerHeight - 12);
      layout.width = clamp(resizing.width + event.clientX - resizing.startX, 300, Math.min(900, maxWidth));
      layout.height = clamp(resizing.height + event.clientY - resizing.startY, 190, Math.min(820, maxHeight));
      host.style.width = layout.width + "px";
      host.style.height = layout.height + "px";
      layout.manual = true;
      event.preventDefault();
    }
  }

  function handlePointerUp(event) {
    if (!dragging && !resizing) return;
    if (dragging && (dragging.pointerId == null || dragging.pointerId === event.pointerId)) dragging = null;
    if (resizing && (resizing.pointerId == null || resizing.pointerId === event.pointerId)) resizing = null;
    saveManualPosition();
  }

  function bindControls() {
    if (!root) return;
    var move = root.querySelector(".move");
    var auto = root.querySelector(".auto");
    var collapseButton = root.querySelector(".collapse");
    var resize = root.querySelector(".resize");
    var unread = root.querySelector(".unread");
    if (move) {
      move.addEventListener("pointerdown", startDrag);
      move.addEventListener("keydown", function (event) {
        var delta = event.shiftKey ? 64 : 16;
        var left = Number.parseFloat(host.style.left) || 6;
        var top = Number.parseFloat(host.style.top) || 6;
        var changed = true;
        if (event.key === "ArrowLeft") left -= delta;
        else if (event.key === "ArrowRight") left += delta;
        else if (event.key === "ArrowUp") top -= delta;
        else if (event.key === "ArrowDown") top += delta;
        else changed = false;
        if (!changed) return;
        event.preventDefault();
        layout.manual = true;
        var rect = host.getBoundingClientRect();
        host.style.left = clamp(left, 6, Math.max(6, innerWidth - rect.width - 6)) + "px";
        host.style.top = clamp(top, 6, Math.max(6, innerHeight - rect.height - 6)) + "px";
        saveManualPosition();
      });
    }
    if (auto) auto.addEventListener("click", function () {
      layout = { left:null, top:null, width:560, height:400, manual:false };
      collapsed = false;
      applyCollapsedState();
      applyLayout();
      persistLayoutSoon();
      schedulePosition();
    });
    if (collapseButton) collapseButton.addEventListener("click", function () {
      collapsed = !collapsed;
      applyCollapsedState();
      if (!collapsed) schedulePosition();
      else if (host) host.style.height = "46px";
    });
    if (resize) {
      resize.addEventListener("pointerdown", startResize);
      resize.addEventListener("keydown", function (event) {
        var delta = event.shiftKey ? 64 : 24;
        var changed = true;
        if (event.key === "ArrowLeft") layout.width -= delta;
        else if (event.key === "ArrowRight") layout.width += delta;
        else if (event.key === "ArrowUp") layout.height -= delta;
        else if (event.key === "ArrowDown") layout.height += delta;
        else changed = false;
        if (!changed) return;
        event.preventDefault();
        layout.width = clamp(layout.width, 300, Math.max(300, Math.min(900, innerWidth - 12)));
        layout.height = clamp(layout.height, 190, Math.max(190, Math.min(820, innerHeight - 12)));
        layout.manual = true;
        applyLayout();
        saveManualPosition();
      });
    }
    if (unread) unread.addEventListener("click", scrollToBottom);
  }

  function applyCollapsedState() {
    if (!root || !host) return;
    var card = root.querySelector(".card");
    var button = root.querySelector(".collapse");
    if (card) card.classList.toggle("collapsed", collapsed);
    if (button) {
      button.textContent = collapsed ? "+" : "−";
      button.setAttribute("aria-expanded", collapsed ? "false" : "true");
      button.title = collapsed ? "Expandir el historial" : "Contraer el historial";
    }
    if (collapsed) {
      host.style.height = "46px";
      host.style.width = Math.max(300, Math.min(layout.width, innerWidth - 12)) + "px";
    } else {
      applyLayout();
    }
  }

  function updateAriaVisibility() {
    if (!host) return;
    host.setAttribute("aria-hidden", host.style.display === "none" ? "true" : "false");
  }

  function formatTime(timestamp) {
    var value = Number(timestamp);
    if (!Number.isFinite(value) || value <= 0) return "";
    try {
      return new Date(value).toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit", second:"2-digit" });
    } catch (_) { return ""; }
  }

  function laneForSource(source) {
    return source === "yo" ? "yo" : "cliente";
  }

  function nearBottom(container) {
    return !container || container.scrollHeight - container.scrollTop - container.clientHeight < 52;
  }

  function scrollToBottom() {
    if (!root) return;
    var container = root.querySelector(".transcript");
    if (container) container.scrollTop = container.scrollHeight;
    unreadCount = 0;
    updateUnreadButton();
  }

  function updateUnreadButton() {
    if (!root) return;
    var button = root.querySelector(".unread");
    if (!button) return;
    button.hidden = unreadCount <= 0 || collapsed;
    button.textContent = unreadCount === 1 ? "1 nueva intervención ↓" : String(unreadCount) + " nuevas intervenciones ↓";
  }

  function renderSmartText(element, value) {
    if (!element) return;
    var text = String(value || "");
    var tokens = typeof core.findSmartTokens === "function" ? core.findSmartTokens(text) : [];
    element.textContent = "";
    if (!tokens.length) {
      element.textContent = text;
      return;
    }
    var cursor = 0;
    tokens.forEach(function (token) {
      if (token.start > cursor) element.appendChild(document.createTextNode(text.slice(cursor, token.start)));
      var node = document.createElement("span");
      node.className = "smart-token";
      node.dataset.smartType = token.type;
      node.dataset.smartValue = token.text;
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      node.textContent = token.text;
      node.title = token.type === "address"
        ? "Clic: copiar dirección · Ctrl+clic: abrir Google Maps · Ctrl+Mayús+clic: Linguee"
        : "Clic: copiar teléfono · Ctrl+clic: buscar teléfono · Ctrl+Mayús+clic: Linguee";
      element.appendChild(node);
      cursor = token.end;
    });
    if (cursor < text.length) element.appendChild(document.createTextNode(text.slice(cursor)));
  }

  function showActionToast(message, isError) {
    if (!root) return;
    var toast = root.querySelector(".action-toast");
    if (!toast) return;
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = String(message || "");
    toast.hidden = false;
    toast.style.borderColor = isError ? "#a85c63" : "#49657a";
    toastTimer = setTimeout(function () {
      if (toast) toast.hidden = true;
      toastTimer = null;
    }, 2600);
  }

  async function copySmartValue(value, label) {
    var copied = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(value);
        copied = true;
      }
    } catch (_) {}
    if (!copied && root) {
      var field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.cssText = "position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0";
      root.appendChild(field);
      field.select();
      try { copied = !!document.execCommand("copy"); } catch (_) {}
      field.remove();
    }
    showActionToast(copied ? label + " copiado al portapapeles" : "No se pudo copiar automáticamente; selecciona el texto y usa Ctrl+C", !copied);
  }

  function termAtPoint(event, textElement) {
    var selected = "", selection = null;
    try {
      selection = window.getSelection ? window.getSelection() : null;
      selected = String(selection || "").trim();
      if (selected && selected.length <= 180 && selection.rangeCount > 0) {
        var selectedRange = selection.getRangeAt(0);
        if (textElement.contains(selectedRange.commonAncestorContainer)) return selected;
      }
    } catch (_) {}
    var range = null;
    try {
      if (document.caretPositionFromPoint) {
        var position = document.caretPositionFromPoint(event.clientX, event.clientY, { shadowRoots: [root] });
        if (position && position.offsetNode) {
          range = document.createRange();
          range.setStart(position.offsetNode, position.offset);
          range.collapse(true);
        }
      }
    } catch (_) {}
    if (!range) {
      try { if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(event.clientX, event.clientY); } catch (_) {}
    }
    if (!range || !textElement.contains(range.startContainer) || range.startContainer.nodeType !== 3) return "";
    var raw = String(range.startContainer.nodeValue || "");
    var offset = Math.max(0, Math.min(raw.length, Number(range.startOffset) || 0));
    var pattern = /[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu;
    var match;
    while ((match = pattern.exec(raw))) {
      if (offset >= match.index && offset <= match.index + match[0].length) return match[0].slice(0, 180);
    }
    return "";
  }

  function requestCaptionLookup(kind, query) {
    chrome.runtime.sendMessage({ type: "SIGNAL_CAPTION_OPEN_LOOKUP", kind: kind, query: query }, function (response) {
      if (chrome.runtime.lastError) {
        showActionToast("No se pudo abrir la búsqueda.", true);
        return;
      }
      if (!response || response.ok !== true) {
        showActionToast(String(response && response.error || "No se pudo abrir la búsqueda."), true);
        return;
      }
      showActionToast(kind === "address" ? "Abriendo Google Maps…" :
        kind === "phone" ? "Verificando teléfono en Google…" : "Abriendo Linguee…", false);
    });
  }

  function bindCaptionTextActions() {
    if (!root) return;
    var transcript = root.querySelector(".transcript");
    if (!transcript || transcript.dataset.lookupBound === "true") return;
    transcript.dataset.lookupBound = "true";
    transcript.addEventListener("click", function (event) {
      var textElement = event.target && event.target.closest ? event.target.closest(".text") : null;
      if (!textElement) return;
      if (event.ctrlKey && event.shiftKey) {
        var term = termAtPoint(event, textElement);
        if (!term) {
          showActionToast("Selecciona un término o pulsa sobre una palabra para buscarla en Linguee.", true);
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        requestCaptionLookup("term", term);
        return;
      }
      var token = event.target && event.target.closest ? event.target.closest(".smart-token") : null;
      if (token) {
        var kind = token.dataset.smartType;
        var value = token.dataset.smartValue || token.textContent || "";
        if (event.ctrlKey) {
          event.preventDefault();
          event.stopPropagation();
          requestCaptionLookup(kind === "address" ? "address" : "phone", value);
        } else {
          event.preventDefault();
          event.stopPropagation();
          copySmartValue(value, kind === "address" ? "Dirección" : "Teléfono");
        }
        return;
      }
      if (event.ctrlKey) {
        var searchTerm = termAtPoint(event, textElement);
        if (!searchTerm) return;
        event.preventDefault();
        event.stopPropagation();
        requestCaptionLookup("term", searchTerm);
      }
    });
    transcript.addEventListener("keydown", function (event) {
      var token = event.target && event.target.closest ? event.target.closest(".smart-token") : null;
      if (!token || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      copySmartValue(token.dataset.smartValue || token.textContent || "",
        token.dataset.smartType === "address" ? "Dirección" : "Teléfono");
    });
  }

  function createRowNode() {
    var row = document.createElement("article");
    row.className = "row";
    var accent = document.createElement("i");
    accent.className = "accent";
    var body = document.createElement("div");
    body.className = "body";
    var meta = document.createElement("div");
    meta.className = "meta";
    var role = document.createElement("span");
    role.className = "role";
    var lang = document.createElement("span");
    lang.className = "lang";
    var time = document.createElement("span");
    time.className = "time";
    var text = document.createElement("div");
    text.className = "text";
    meta.appendChild(role);
    meta.appendChild(lang);
    meta.appendChild(time);
    body.appendChild(meta);
    body.appendChild(text);
    row.appendChild(accent);
    row.appendChild(body);
    return row;
  }

  function render(skipUnreadTracking) {
    if (!canShowOnThisPage()) {
      if (host) host.style.display = "none";
      updateAriaVisibility();
      return;
    }
    ensureHost();
    if (!host || !root) return;
    var container = root.querySelector(".transcript");
    var dot = root.querySelector(".dot");
    var stateLabel = root.querySelector(".stateLabel");
    if (!container) return;

    var wasNearBottom = nearBottom(container);
    var data = rows.slice(-MAX_HISTORY);
    var rendered = container.querySelectorAll(".row");
    while (rendered.length > data.length) {
      rendered[rendered.length - 1].remove();
      rendered = container.querySelectorAll(".row");
    }
    data.forEach(function (item, index) {
      var node = rendered[index];
      if (!node) {
        node = createRowNode();
        container.appendChild(node);
      }
      var language = item.language || "unknown";
      node.className = "row" + (language === "es" ? " es" : "") + (item.live ? " live" : "");
      var role = node.querySelector(".role");
      var lang = node.querySelector(".lang");
      var time = node.querySelector(".time");
      var text = node.querySelector(".text");
      var nextText = String(item.text || "");
      var speakerRole = typeof core.roleForSource === "function" ? core.roleForSource(item.source, language) : core.roleForLanguage(language);
      if (role && role.textContent !== speakerRole) role.textContent = speakerRole;
      if (lang && lang.textContent !== core.languageLabel(language)) lang.textContent = core.languageLabel(language);
      if (time) time.textContent = formatTime(item.at);
      if (text && text.textContent !== nextText) renderSmartText(text, nextText);
    });

    var empty = container.querySelector(".empty");
    if (empty) {
      empty.hidden = data.length > 0;
      empty.textContent = youtubeTarget
        ? "Esperando subtítulos del video. Activa CC y reproduce el video."
        : "Esperando la primera intervención…";
    }
    if (dot) dot.className = "dot" + (active ? "" : " idle");
    if (stateLabel) stateLabel.textContent = active ? "EN VIVO" : (sessionEnded ? "HISTORIAL" : "EN ESPERA");
    host.style.display = collapsed ? "block" : "block";
    updateAriaVisibility();
    if (wasNearBottom && !collapsed) {
      container.scrollTop = container.scrollHeight;
      unreadCount = 0;
    } else if (data.length > 0 && skipUnreadTracking !== true) {
      unreadCount = Math.min(999, unreadCount + 1);
    }
    updateUnreadButton();
    if (!layout.manual && !collapsed) schedulePosition();
    if (collapsed) applyCollapsedState();
  }

  function addRow(text, language, source, isLive, timestamp) {
    var clean = core.normalizeText(text).slice(0, 1500);
    if (!clean) return;
    source = source === "yo" || source === "chrome-live-caption" ? source : "cliente";
    language = core.resolveLanguage(language, clean);
    var now = Number(timestamp);
    if (!Number.isFinite(now) || now <= 0) now = Date.now();
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
      if (relation === "duplicate") {
        candidate.at = Math.max(Number(candidate.at || 0), now);
        if (language !== "unknown") candidate.language = language;
        if (source === "chrome-live-caption") { candidate.source = source; candidate.live = true; }
        else if (candidate.source !== "chrome-live-caption") { candidate.source = source; candidate.live = !!isLive; }
        render();
        return;
      }
      if (relation === "stale") return;
      if (relation !== "new") {
        var previousAt = Number(candidate.at || 0);
        var previousSource = candidate.source;
        candidate.text = core.mergeCaptionText(candidate.text, clean).slice(0, 4000);
        candidate.at = Math.max(previousAt, now);
        if (language !== "unknown" || candidate.language === "unknown") candidate.language = language;
        if (source === "chrome-live-caption") { candidate.source = source; candidate.live = true; }
        else if (previousSource !== "chrome-live-caption" || now - previousAt > 4500) {
          candidate.source = source;
          candidate.live = !!isLive;
        }
        render();
        return;
      }
    }

    rows.push({ text: clean, language: language, source: source, live: !!isLive, at: now });
    if (rows.length > MAX_HISTORY) rows.splice(0, rows.length - MAX_HISTORY);
    render();
  }

  function hydrateHistory(history) {
    if (!Array.isArray(history)) return;
    var previousScroll = root && root.querySelector(".transcript") ? root.querySelector(".transcript").scrollTop : 0;
    rows = history.slice(-MAX_HISTORY).map(function (item) {
      return {
        text: core.normalizeText(item && item.text).slice(0, 1500),
        language: core.resolveLanguage(item && item.language, item && item.text),
        source: item && item.source === "yo" ? "yo" : (item && item.source === "chrome-live-caption" ? "chrome-live-caption" : "cliente"),
        live: !!(item && item.live),
        at: Number(item && (item.timestamp || item.at)) || Date.now(),
        id: item && item.id || null
      };
    }).filter(function (item) { return !!item.text; });
    render(true);
    var container = root && root.querySelector(".transcript");
    if (container) {
      container.scrollTop = previousScroll > 0 ? previousScroll : container.scrollHeight;
    }
  }

  function applyContext(result, hydrate) {
    if (!result || result.ok !== true) return;
    contextReady = true;
    config.liveCaptionOverlayEnabled = result.enabled !== false;
    config.liveCaptionOverlayScope = result.scope === "all-tabs" ? "all-tabs" : "source-only";
    sourceTabId = Number.isFinite(Number(result.sourceTabId)) ? Number(result.sourceTabId) : null;
    isSourceTab = result.isSourceTab === true;
    callActive = result.callActive === true;
    sessionEnded = !callActive && result.sessionEnded === true;
    youtubeTarget = isYoutubeTargetPage();
    pageAllowed = result.pageAllowed === true || youtubeTarget;
    if (hydrate && Array.isArray(result.history)) hydrateHistory(result.history);
    if (canShowOnThisPage()) ensureHost();
    render();
  }

  function syncContext(hydrate) {
    try {
      chrome.runtime.sendMessage({ type: "SIGNAL_CAPTION_OVERLAY_HELLO" }, function (result) {
        if (chrome.runtime.lastError) return;
        applyContext(result, hydrate === true);
      });
    } catch (_) {}
  }

  function applyConfig(next) {
    config = Object.assign({}, config, next || {});
    youtubeTarget = isYoutubeTargetPage();
    if (config.liveCaptionOverlayEnabled === false) {
      active = false;
      if (host) host.style.display = "none";
      updateAriaVisibility();
      return;
    }
    if (canShowOnThisPage()) ensureHost();
    render(true);
  }

  function schedulePosition() {
    if (positionRaf) return;
    positionRaf = requestAnimationFrame(function () {
      positionRaf = null;
      if (!layout.manual && !collapsed) positionOverlay();
    });
  }

  chrome.storage.local.get(["effectifConfig", "signalCaptionOverlayLayout"], function (stored) {
    config = Object.assign({}, config, stored.effectifConfig || {});
    var saved = stored.signalCaptionOverlayLayout;
    if (saved && typeof saved === "object") {
      layout = {
        left: Number.isFinite(Number(saved.left)) ? Number(saved.left) : null,
        top: Number.isFinite(Number(saved.top)) ? Number(saved.top) : null,
        width: clamp(saved.width, 300, 900),
        height: clamp(saved.height, 190, 820),
        manual: saved.manual === true
      };
    }
    syncContext(true);
    if (canShowOnThisPage()) { ensureHost(); applyLayout(); render(); }
  });

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== "local") return;
    if (changes.effectifConfig) {
      config = Object.assign({}, config, changes.effectifConfig.newValue || {});
      syncContext(true);
      applyConfig(changes.effectifConfig.newValue || {});
    }
    if (changes.signalCaptionOverlayLayout && changes.signalCaptionOverlayLayout.newValue) {
      var saved = changes.signalCaptionOverlayLayout.newValue;
      layout = {
        left: Number.isFinite(Number(saved.left)) ? Number(saved.left) : null,
        top: Number.isFinite(Number(saved.top)) ? Number(saved.top) : null,
        width: clamp(saved.width, 300, 900),
        height: clamp(saved.height, 190, 820),
        manual: saved.manual === true
      };
      applyLayout();
      if (collapsed) applyCollapsedState();
    }
  });

  chrome.runtime.onMessage.addListener(function (message) {
    if (!message) return;
    if (message.type === "SIGNAL_YOUTUBE_CAPTION_PREVIEW_STATUS") {
      if (youtubeTarget) {
        active = message.active === true;
        if (host) render(true);
      }
    } else if (message.type === "SIGNAL_CAPTION_UPDATE") {
      var caption = message.caption || {};
      if (!caption.text || !canShowOnThisPage()) return;
      active = true;
      sessionEnded = false;
      addRow(caption.text, caption.language, caption.source, caption.live, caption.timestamp);
    } else if (message.type === "SIGNAL_CAPTION_NATIVE_STATUS") {
      active = message.captionFresh === false
        ? false
        : (message.active === true || (message.captionFresh == null && message.visible === true));
      if (host) render(true);
    } else if (message.type === "SIGNAL_CAPTION_SESSION_RESET") {
      rows = [];
      active = false;
      sessionEnded = false;
      unreadCount = 0;
      if (root) {
        var container = root.querySelector(".transcript");
        if (container) container.scrollTop = 0;
      }
      render(true);
      syncContext(false);
    } else if (message.type === "SIGNAL_CAPTION_SESSION_END") {
      active = false;
      callActive = false;
      sessionEnded = rows.length > 0;
      render(true);
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
      active = false;
      if (host) host.remove();
      host = null;
      root = null;
      syncContext(true);
    }
  });

  document.addEventListener("signal-interpreter-youtube-caption", function (event) {
    if (!youtubeTarget || !event || !event.detail || !event.detail.text) return;
    active = true;
    addRow(event.detail.text, event.detail.language || "unknown", "chrome-live-caption", true, event.detail.timestamp || Date.now());
  });

  document.addEventListener("signal-interpreter-youtube-caption-status", function (event) {
    if (!youtubeTarget || !event || !event.detail) return;
    active = event.detail.active === true;
    render(true);
  });

  if (window) {
    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("pointercancel", handlePointerUp, true);
    window.addEventListener("resize", function () {
      applyLayout();
      schedulePosition();
    });
    window.addEventListener("scroll", schedulePosition, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", schedulePosition);
      window.visualViewport.addEventListener("scroll", schedulePosition);
    }
    window.addEventListener("pagehide", function () {
      if (saveLayoutTimer) clearTimeout(saveLayoutTimer);
      if (host) host.remove();
    });
  }

  if (document.body && typeof MutationObserver === "function") {
    var mutationObserver = new MutationObserver(function (mutations) {
      if (layout.manual || collapsed || !canShowOnThisPage()) return;
      var relevant = mutations.some(function (mutation) {
        return !(host && (mutation.target === host || host.contains(mutation.target)));
      });
      if (relevant) schedulePosition();
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden", "disabled"]
    });
  }

  youtubeTarget = isYoutubeTargetPage();
  syncContext(true);
})();