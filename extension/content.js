(function () {
  "use strict";
  var RUNTIME_VERSION = chrome.runtime.getManifest().version;
  var SIGNAL_RUNTIME_MARKER = "__SIGNAL_INTERPRETER_CLOUD_RUNTIME__";
  var ANSWER_LEASE_MARKER = "__SIGNAL_INTERPRETER_ANSWER_LEASE__";
  var CALL_BEEP_MARKER = "__SIGNAL_INTERPRETER_CALL_BEEP__";
  var existingRuntimeMarker = window[SIGNAL_RUNTIME_MARKER];
  if (existingRuntimeMarker && existingRuntimeMarker.extensionId === chrome.runtime.id && existingRuntimeMarker.version === RUNTIME_VERSION && existingRuntimeMarker.active) return;
  window[SIGNAL_RUNTIME_MARKER] = { extensionId: chrome.runtime.id, version: RUNTIME_VERSION, active: true, startedAt: new Date().toISOString() };
  try { delete window.__SIGNAL_INTERPRETER_CLOUD_V0913__; } catch (_) {}

  var DIALOG = '[role="dialog"]';
  var CONNECT = 'button[aria-label="Connect"]';
  var AUTHORIZED_PROFILE_PATH = "/profile/cmu2wuz1v0uwr07adbzb9djfz";
  var AUTHORIZED_PROFILE_ORIGIN = "https://app.cloudinterpreter.com";
  var PAGE_FAVICON_MARKER = "data-signal-interpreter-favicon";
  var config = {
    targetHost: "app.cloudinterpreter.com",
    autoAnswerEnabled: true,
    soundEnabled: true,
    volume: 0.8,
    observationEnabled: true,
    networkTelemetryEnabled: true,
    performanceTelemetryEnabled: true,
    interactionTelemetryEnabled: true,
    telemetryHeartbeatSeconds: 30,
    transcriptionEnabled: true,
    overlayEnabled: true,
    overlayCompact: true,
    opiRatePerMinute: 0.20,
    vriRatePerMinute: 0.25,
    usdMxnRate: null,
    exchangeRateDate: null,
    exchangeRateUpdatedAt: null,
    earningsDisplayCurrency: "MXN"
  };
  var state = {};
  var earningsMetrics = globalThis.SignalInterpreterEarningsMetrics || null;
  var platformMirror = {};
  var activeCallEarnings = {};
  var overlayHost = null;
  var overlayRoot = null;
  var screenshotOverlayPreviousVisibility=null;
  var overlayTimer = null;
  var overlayLifecycleActive = false;
  var overlayLifecycleCallId = null;
  var overlayRatingStopEmitted = false;
  var overlayPeriod = "today";
  var overlayCurrency = "MXN";
  var overlaySyncPending = {};
  var overlayLastLocalDay = null;
  var overlayLastLocalMonth = null;
  var overlayFxRefreshRequestedDate = null;
  var callDisplayStartedAt = null;
  var observer = null;
  var telemetryStarted = false;
  var telemetryTimer = null;
  var sessionId = crypto.randomUUID();
  var pageLifecycleId = crypto.randomUUID();
  var resourceCursor = 0;
  var mutationAggregate = { batches: 0, addedNodes: 0, removedNodes: 0, attributes: 0, textChanges: 0 };
  var performanceAggregate = { longTasks: 0, longTaskTotalMs: 0, longestTaskMs: 0, layoutShifts: 0, layoutShiftScore: 0 };
  var clickedNodes = new WeakSet();
  var fingerprints = new Map();
  var route = location.pathname;
  var callRouteId = null;
  var lastIncomingSignature = "";
  var lastAvailability = "";
  var readinessTimer = null;
  var lastSpokenCallId = "";
  var lastMediaSignature = "";
  var lastMediaAt = 0;
  var lastScreenSignature = "";
  var lastMirrorSignature = "";
  var lastPortalStructureSignature = "";
  var lastPlatformSurfaceHash = "";
  var lastObservedHref = location.href;
  var platformSurfaceTimer = null;
  var navigationProbeTimer = null;
  var navigationListenersInstalled = false;
  var lastCallEndMeasurement = null;
  var ratingConfirmationTimer = null;
  var answerWatchdog = null;
  var existingAnswerLease = window[ANSWER_LEASE_MARKER];
  var answerFlow = existingAnswerLease && existingAnswerLease.flowId && existingAnswerLease.clickAt && (Date.now() - Date.parse(existingAnswerLease.clickAt) < 30000)
    ? Object.assign({ flowId: null, clickAt: null, modality: null, fingerprint: null, routeConfirmed: false }, existingAnswerLease)
    : { flowId: null, clickAt: null, modality: null, fingerprint: null, routeConfirmed: false };
  if (answerFlow.flowId) emitHotloadLeaseNote();
  var mirrorTimer = null;
  var mediaTimer = null;
  var integrityTimer = null;
  var micMainCommandEvent = "__SIGNAL_INTERPRETER_MIC_COMMAND_V1__";
  var micMainAckEvent = "__SIGNAL_INTERPRETER_MIC_ACK_V1__";
  var integrity = {
    extensionDomWrites: 0,
    extensionMediaApiCalls: 0,
    extensionTrackMutations: 0,
    permittedConnectClicks: 0,
    forbiddenPlatformActions: 0
  };


  function iso() { return new Date().toISOString(); }
  function emitHotloadLeaseNote() {
    try { emit("HOTLOAD_ANSWER_LEASE_REHYDRATED", { flowId: answerFlow.flowId, modality: answerFlow.modality, routeConfirmed: !!answerFlow.routeConfirmed, runtimeVersion: RUNTIME_VERSION }); } catch (_) {}
  }
  function normalized(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
  function safe(value) {
    return normalized(value)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
      .replace(/\b\d{7,}\b/g, "[NUMBER]")
      .slice(0, 1000);
  }
  function mirrorText(value, limit) { return safe(normalized(value)).slice(0, limit || 500); }
  function normalizePlatformPath(pathname) {
    var path = String(pathname || "")
      .replace(/\/call\/[^/]+/g, "/call/<ID>")
      .replace(/\/profile\/[^/]+/g, "/profile/<ID>");
    return path.split("/").map(function (segment) {
      return /^(?:[0-9]{6,}|[a-f0-9]{16,}|[A-Za-z0-9_-]{20,})$/i.test(segment) ? "<ID>" : segment;
    }).join("/");
  }
  function safePlatformUrl(raw) {
    if (!raw) return "";
    try {
      var url = new URL(String(raw || ""), location.href);
      if (url.origin === AUTHORIZED_PROFILE_ORIGIN) {
        var path = normalizePlatformPath(url.pathname);
        var keys = Array.from(url.searchParams.keys()).sort().slice(0, 30);
        return url.origin + path + (keys.length ? "?" + keys.map(function (key) { return encodeURIComponent(key) + "=<VALUE>"; }).join("&") : "");
      }
      return url.origin;
    } catch (_) { return "[INVALID_URL]"; }
  }
  function stableSurfaceToken(value) {
    var text = String(value == null ? "" : value);
    var hash = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }
  function structuralText(value) {
    var text = normalized(value).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]");
    text = text.replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "[PHONE]");
    text = text.replace(/\b\d{7,}\b/g, "[NUMBER]");
    return text.slice(0, 120);
  }
  function structuralToken(value) {
    var text = structuralText(value);
    if (!text) return "";
    return text.length > 80 ? "[TEXT:" + text.length + ":" + stableSurfaceToken(text) + "]" : text;
  }
  function selectorPath(element) {
    if (!element || !element.tagName) return "";
    var parts = [], current = element, depth = 0;
    while (current && current.nodeType === 1 && depth < 5) {
      var tag = String(current.tagName || "").toLowerCase();
      var id = current.getAttribute && current.getAttribute("id");
      if (id) {
        parts.unshift(tag + "#" + structuralToken(id).replace(/[^a-z0-9_-]/gi, "_").slice(0, 80));
        break;
      }
      var parent = current.parentElement, index = parent ? Array.prototype.indexOf.call(parent.children, current) + 1 : 1;
      parts.unshift(tag + ":nth-child(" + index + ")");
      current = parent;
      depth += 1;
    }
    return parts.join(">");
  }
  function attributeInventory(element) {
    if (!element || !element.attributes) return {};
    var allowed = ["id","role","aria-label","aria-labelledby","aria-describedby","data-testid","data-test","data-state","data-slot","data-component","data-cy","type","name","rel","target","href"];
    var result = {};
    allowed.forEach(function (name) {
      var value = element.getAttribute(name);
      if (value == null) return;
      if (name === "href") result[name] = safePlatformUrl(value);
      else if (name === "aria-label" || name === "aria-labelledby" || name === "aria-describedby" || name === "name" || name === "id" || name === "data-testid" || name === "data-test" || name === "data-component" || name === "data-cy") result[name] = structuralToken(value);
      else result[name] = structuralToken(value);
    });
    return result;
  }
  function computedStyleSurface(style) {
    if (!style) return null;
    var keys = ["display","position","boxSizing","flexDirection","justifyContent","alignItems","gridTemplateColumns","overflow","width","height","padding","margin","color","backgroundColor","fontFamily","fontSize","fontWeight","lineHeight","letterSpacing","textTransform","border","borderRadius","boxShadow","opacity","zIndex","accentColor"];
    var output = {};
    keys.forEach(function (key) {
      var value = style.getPropertyValue(key);
      if (value) output[key] = structuralToken(value);
    });
    return output;
  }
  function elementSurface(element) {
    var style = element && getComputedStyle(element);
    var rect = element && element.getBoundingClientRect ? element.getBoundingClientRect() : null;
    var classes = element && typeof element.className === "string"
      ? element.className.split(/\s+/).filter(Boolean).map(structuralToken).filter(Boolean).slice(0, 20)
      : [];
    var text = structuralToken(element && (element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent) || "");
    return {
      selector: selectorPath(element),
      tag: String(element && element.tagName || "").toLowerCase(),
      attributes: attributeInventory(element),
      classes: classes,
      text: text ? "[TEXT:" + text.length + ":" + stableSurfaceToken(text) + "]" : "",
      visible: !!(style && style.display !== "none" && style.visibility !== "hidden" && !element.hidden && rect && rect.width > 0 && rect.height > 0),
      disabled: !!(element && element.disabled),
      childCount: element && element.children ? element.children.length : 0,
      textLength: text.length,
      textFingerprint: stableSurfaceToken(text),
      computedStyle: computedStyleSurface(style),
      bbox: rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null
    };
  }
  function inlineStyleSurface() {
    return Array.from(document.querySelectorAll("style")).slice(0, 80).map(function (style, index) {
      var text = String(style.textContent || "");
      return {
        index: index,
        type: structuralToken(style.getAttribute("type") || ""),
        media: structuralToken(style.getAttribute("media") || ""),
        noncePresent: !!style.getAttribute("nonce"),
        disabled: !!style.disabled,
        length: text.length,
        inlineFingerprint: stableSurfaceToken(text)
      };
    });
  }
  function stylesheetSurface() {
    var sheets = [];
    Array.from(document.styleSheets || []).slice(0, 100).forEach(function (sheet) {
      var href = safePlatformUrl(sheet.href || "");
      var ruleCount = null, readable = false, selectorCount = 0, atRuleCount = 0, selectors = [];
      try {
        var rules = sheet.cssRules ? Array.from(sheet.cssRules) : [];
        ruleCount = rules.length; readable = true;
        rules.slice(0, 120).forEach(function (rule) {
          var cssType = Number(rule && rule.type || 0);
          if (cssType === 1 && rule.selectorText) {
            selectorCount += 1;
            if (selectors.length < 40) selectors.push(structuralToken(rule.selectorText));
          } else if (cssType !== 1) atRuleCount += 1;
        });
      } catch (_) {}
      var owner = sheet.ownerNode;
      sheets.push({
        href: href,
        disabled: !!sheet.disabled,
        media: sheet.media ? structuralToken(String(sheet.media.mediaText || "")) : "",
        ownerTag: String(owner && owner.tagName || "").toLowerCase(),
        ruleCount: ruleCount,
        selectorCount: selectorCount,
        atRuleCount: atRuleCount,
        selectors: selectors,
        sameOriginReadable: readable
      });
    });
    return sheets;
  }
  function scriptSurface() {
    return Array.from(document.scripts || []).slice(0, 120).map(function (script) {
      var src = safePlatformUrl(script.src || "");
      return {
        src: src,
        type: structuralToken(script.type || (script.src && /\.m?js(?:$|[?#])/i.test(script.src) ? "module-or-js" : "")),
        async: !!script.async,
        defer: !!script.defer,
        noModule: !!script.noModule,
        integrityPresent: !!script.integrity,
        inlineLength: script.src ? 0 : String(script.textContent || "").length,
        inlineFingerprint: script.src ? "" : stableSurfaceToken(String(script.textContent || ""))
      };
    });
  }
  function resourceSurface() {
    var entries = performance.getEntriesByType("resource") || [];
    var seen = {};
    var recent = entries.slice(-100).map(function (entry) {
      var name = safePlatformUrl(entry.name);
      var key = [name, entry.initiatorType || "other"].join("|");
      seen[key] = true;
      return {
        url: name,
        initiatorType: entry.initiatorType || "other",
        durationMs: Math.round(Number(entry.duration || 0)),
        transferBytes: Number(entry.transferSize || 0),
        encodedBytes: Number(entry.encodedBodySize || 0),
        decodedBytes: Number(entry.decodedBodySize || 0),
        protocol: structuralToken(entry.nextHopProtocol || "")
      };
    });
    return { totalObserved: entries.length, recent: recent.slice(-80), uniqueRecent: Object.keys(seen).length };
  }
  function frameworkHints(scripts, elements) {
    var signals = [];
    var ids = elements.map(function (x) { return x.attributes && x.attributes.id || ""; }).join(" ");
    var srcs = scripts.map(function (x) { return x.src || ""; }).join(" ");
    if (document.querySelector("#__next")) signals.push("nextjs");
    if (document.querySelector("#root")) signals.push("react-root-candidate");
    if (document.querySelector("[data-reactroot]")) signals.push("react");
    if (/_next\//i.test(srcs)) signals.push("nextjs-assets");
    if (/\bwebpack\b/i.test(srcs)) signals.push("webpack-assets");
    if (/\bvite\b/i.test(srcs)) signals.push("vite-assets");
    if (/\bvue\b/i.test(srcs)) signals.push("vue-assets");
    if (/\bangular\b/i.test(srcs)) signals.push("angular-assets");
    if (/\bsvelte\b/i.test(srcs)) signals.push("svelte-assets");
    if (/\bnuxt\b/i.test(srcs)) signals.push("nuxt-assets");
    if (ids) signals.push("structural-id-surface");
    return Array.from(new Set(signals));
  }
  function extractPortalStructure() {
    function labelOf(element) {
      return structuralToken(element.getAttribute && (element.getAttribute("aria-label") || element.getAttribute("title") || "") || "");
    }
    var controls = Array.from(document.querySelectorAll("button,[role='button']")).filter(visibleElement).slice(0, 180);
    var buttons = controls.map(function (element) {
      return {tag: String(element.tagName || "").toLowerCase(), role: structuralToken(element.getAttribute && element.getAttribute("role") || ""), label: labelOf(element), disabled: !!element.disabled};
    }).filter(function (x) { return x.label || x.role; });
    var links = Array.from(document.querySelectorAll("a[href]")).filter(visibleElement).slice(0, 140).map(function (element) {
      var href = "";
      try { href = safePlatformUrl(element.getAttribute("href")); } catch (_) {}
      return {label: labelOf(element), path: href};
    }).filter(function (x) { return x.label || x.path; });
    var fields = Array.from(document.querySelectorAll("input,select,textarea")).filter(visibleElement).slice(0, 100).map(function (element) {
      return {tag: String(element.tagName || "").toLowerCase(), type: structuralToken(element.getAttribute("type") || ""), name: structuralToken(element.getAttribute("name") || ""), aria: structuralToken(element.getAttribute("aria-label") || element.getAttribute("placeholder") || "")};
    });
    var headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,[role='heading']")).filter(visibleElement).slice(0, 100).map(function (element) {
      return structuralToken(element.textContent);
    }).filter(Boolean);
    var surfaceCandidates = Array.from(document.querySelectorAll("html,head,body,main,nav,header,footer,aside,section,form,dialog,button,a,input,select,textarea,[role]")).slice(0, 500);
    var elements = surfaceCandidates.map(elementSurface);
    var tagCounts = {};
    Array.from(document.querySelectorAll("body *")).slice(0, 6000).forEach(function (element) {
      var tag = String(element.tagName || "").toLowerCase();
      if (tag) tagCounts[tag] = Number(tagCounts[tag] || 0) + 1;
    });
    var metadata = Array.from(document.querySelectorAll("meta")).slice(0, 100).map(function (meta) {
      return {
        name: structuralToken(meta.getAttribute("name") || meta.getAttribute("property") || ""),
        contentLength: String(meta.getAttribute("content") || "").length
      };
    }).filter(function (x) { return x.name; });
    var scripts = scriptSurface();
    var stylesheets = stylesheetSurface();
    var page = {
      origin: location.origin,
      url: safePlatformUrl(location.href),
      path: safePlatformUrl(location.origin + location.pathname),
      route: routeTemplate(),
      title: structuralToken(document.title),
      language: structuralToken(document.documentElement && document.documentElement.lang || ""),
      charset: document.characterSet || "",
      readyState: document.readyState,
      visibility: document.visibilityState,
      nodeCount: document.getElementsByTagName("*").length,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio: devicePixelRatio },
      searchKeys: Array.from(new URL(location.href).searchParams.keys()).sort().slice(0, 40),
      hashPresent: !!location.hash
    };
    var surface = {
      schema: "signal-interpreter-platform-surface/v1",
      page: page,
      controls: { buttons: buttons, links: links, fields: fields, headings: headings },
      dom: { tagCounts: tagCounts, elements: elements },
      css: { stylesheets: stylesheets, inlineStyles: inlineStyleSurface(), inlineStyleCount: document.querySelectorAll("[style]").length, styleElementCount: document.querySelectorAll("style").length },
      javascript: { scripts: scripts, scriptCount: scripts.length },
      resources: resourceSurface(),
      metadata: metadata,
      frameworkHints: frameworkHints(scripts, elements),
      privacy: {
        rawTextStored: false,
        rawHtmlStored: false,
        rawCssStored: false,
        rawJavascriptStored: false,
        rawAudioStored: false
      }
    };
    function approxBytes(value) {
      try { return new TextEncoder().encode(JSON.stringify(value)).length; } catch (_) { return JSON.stringify(value).length * 2; }
    }
    var originalCounts = {
      elements: surface.dom.elements.length,
      buttons: surface.controls.buttons.length,
      links: surface.controls.links.length,
      fields: surface.controls.fields.length,
      headings: surface.controls.headings.length,
      resources: surface.resources.recent.length,
      stylesheets: surface.css.stylesheets.length,
      scripts: surface.javascript.scripts.length,
      metadata: surface.metadata.length
    };
    surface.dom.elements = surface.dom.elements.slice(0, 360);
    surface.controls.buttons = surface.controls.buttons.slice(0, 120);
    surface.controls.links = surface.controls.links.slice(0, 100);
    surface.controls.fields = surface.controls.fields.slice(0, 80);
    surface.controls.headings = surface.controls.headings.slice(0, 70);
    surface.resources.recent = surface.resources.recent.slice(-60);
    surface.css.stylesheets = surface.css.stylesheets.slice(0, 80);
    surface.css.inlineStyles = surface.css.inlineStyles.slice(0, 60);
    surface.javascript.scripts = surface.javascript.scripts.slice(0, 100);
    surface.metadata = surface.metadata.slice(0, 80);
    var maxBytes = 48000;
    while (approxBytes(surface) > maxBytes && surface.dom.elements.length > 120) surface.dom.elements = surface.dom.elements.slice(0, Math.max(120, Math.floor(surface.dom.elements.length * 0.8)));
    while (approxBytes(surface) > maxBytes && surface.resources.recent.length > 20) surface.resources.recent = surface.resources.recent.slice(-Math.max(20, Math.floor(surface.resources.recent.length * 0.8)));
    surface.bounds = {
      maxApproxBytes: maxBytes,
      actualApproxBytes: approxBytes(surface),
      originalCounts: originalCounts,
      retainedCounts: {
        elements: surface.dom.elements.length, buttons: surface.controls.buttons.length, links: surface.controls.links.length,
        fields: surface.controls.fields.length, headings: surface.controls.headings.length, resources: surface.resources.recent.length,
        stylesheets: surface.css.stylesheets.length, inlineStyles: surface.css.inlineStyles.length, scripts: surface.javascript.scripts.length, metadata: surface.metadata.length
      }
    };
    return surface;
  }
  function isTarget() { return location.hostname === config.targetHost; }
  function isAuthorizedProfilePage() {
    return location.origin === AUTHORIZED_PROFILE_ORIGIN &&
      (location.pathname === AUTHORIZED_PROFILE_PATH || location.pathname === AUTHORIZED_PROFILE_PATH + "/");
  }
  function readAvailabilityState() {
    var controls = Array.from(document.querySelectorAll("button,[role='button'],[aria-label],[title],[data-testid]"))
      .filter(visibleElement).slice(0, 320);
    var signals = controls.map(function (element) {
      return normalized([
        element.getAttribute("aria-label") || "",
        element.getAttribute("title") || "",
        element.getAttribute("data-testid") || "",
        element.textContent || ""
      ].join(" "));
    }).filter(Boolean);
    var text = signals.join(" ");
    if (/(?:click to go offline|you are online|go offline|status[:\s]+online|online status)/i.test(text)) return "online";
    if (/(?:click to go online|you are offline|go online|status[:\s]+offline|offline status)/i.test(text)) return "offline";
    return "unknown";
  }
  function syncPageFavicon() {
    var existing = document.querySelector("link[" + PAGE_FAVICON_MARKER + "]");
    if (!isAuthorizedProfilePage()) {
      if (existing) existing.remove();
      return;
    }
    var availability = readAvailabilityState();
    var status = !config.autoAnswerEnabled ? "disabled" : availability === "online" ? "active" : availability === "offline" ? "offline" : "waiting";
    var colors = { active: "#22c55e", waiting: "#f59e0b", offline: "#6b7280", disabled: "#ef4444" };
    var color = colors[status];
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#111827"/><circle cx="32" cy="32" r="22" fill="' + color + '"/><circle cx="32" cy="32" r="9" fill="#fff"/></svg>';
    var href = "data:image/svg+xml," + encodeURIComponent(svg);
    if (!existing) {
      existing = document.createElement("link");
      existing.rel = "icon";
      existing.setAttribute(PAGE_FAVICON_MARKER, "1");
      (document.head || document.documentElement).appendChild(existing);
    }
    existing.href = href;
  }
  function isAutoAnswerReady() {
    return isAuthorizedProfilePage() && config.autoAnswerEnabled && readAvailabilityState() === "online";
  }
  function currentCallId() {
    var match = location.pathname.match(/^\/call\/([^/?#]+)\/?$/);
    return match ? match[1] : null;
  }
  function routeTemplate() {
    return location.pathname
      .replace(/^\/call\/[^/]+/, "/call/<ID>")
      .replace(/^\/profile\/[^/]+/, "/profile/<ID>");
  }
  function emit(action, payload, level) {
    var event = {
      timestamp: iso(), action: action, level: level || "info",
      source: "content", host: location.hostname, url: location.origin + routeTemplate(),
      sessionId: sessionId, pageLifecycleId: pageLifecycleId,
      context: { route: routeTemplate(), visibility: document.visibilityState, focused: document.hasFocus(), online: navigator.onLine, monotonicMs: Math.round(performance.now()) },
      payload: payload || {}
    };
    try {
      console[event.level === "error" ? "error" : "log"](
        "[SIGNAL-INTERPRETER]", event.timestamp, action, event.payload
      );
      try {
        var messagePromise = chrome.runtime.sendMessage({ type: "EFFECTIF_EVENT", event: event });
        if (messagePromise && typeof messagePromise.catch === "function") messagePromise.catch(function () {});
      } catch (_) {}
    } catch (_) {}
  }

  // Fallback en la pestaña de Cloud Interpreter: sigue funcionando aunque
  // Chrome deje el comando de extensión sin atajo asignado.
  document.addEventListener("keydown", function (event) {
    if (!event || event.repeat || event.isComposing) return;
    if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey) return;
    if (!(event.code === "Period" || event.key === "." || event.key === ">")) return;
    event.preventDefault();
    event.stopPropagation();
    emit("EXTENSION_MICROPHONE_KEYBOARD_FALLBACK_TRIGGERED", {
      hotkey: "Ctrl+Shift+.", code: event.code || null, key: event.key || null,
      path: "content-keydown-fallback"
    });
    try {
      chrome.runtime.sendMessage({
        type: "SIGNAL_EXTENSION_MICROPHONE_KEYBOARD_FALLBACK",
        source: "keyboard-content-fallback"
      }, function (response) {
        var runtimeError = chrome.runtime && chrome.runtime.lastError;
        if (runtimeError) {
          emit("EXTENSION_MICROPHONE_KEYBOARD_FALLBACK_ERROR", {
            hotkey: "Ctrl+Shift+.", error: String(runtimeError.message || runtimeError)
          }, "error");
          return;
        }
        emit(response && response.ok && response.verified
          ? "EXTENSION_MICROPHONE_KEYBOARD_FALLBACK_COMPLETED"
          : "EXTENSION_MICROPHONE_KEYBOARD_FALLBACK_ERROR", {
          hotkey: "Ctrl+Shift+.", ok: !!(response && response.ok),
          verified: !!(response && response.verified),
          muted: response && typeof response.muted === "boolean" ? response.muted : null,
          duplicateSuppressed: !!(response && response.duplicateSuppressed),
          error: response && response.error || null
        }, response && response.ok && response.verified ? "info" : "error");
      });
    } catch (error) {
      emit("EXTENSION_MICROPHONE_KEYBOARD_FALLBACK_ERROR", {
        hotkey: "Ctrl+Shift+.", error: String(error)
      }, "error");
    }
  }, true);
  function parsePlatformSeconds() {
    var endButton = Array.from(document.querySelectorAll("button,[role='button']")).filter(visibleElement).find(function (element) {
      return /^End call$/i.test(normalized(element.getAttribute("aria-label") || element.textContent || ""));
    });
    var buttonRect = endButton ? endButton.getBoundingClientRect() : null;
    var candidates = Array.from(document.querySelectorAll("body *")).filter(function (element) {
      if (element.children.length > 2) return false;
      var text = normalized(element.textContent);
      if (!/^\d{1,2}:\d{2}(?::\d{2})?$/.test(text)) return false;
      var rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).map(function (element) {
      var rect = element.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
      var score = buttonRect
        ? Math.hypot(centerX - (buttonRect.left + buttonRect.width / 2), centerY - (buttonRect.top + buttonRect.height / 2))
        : Math.abs(centerX - innerWidth / 2) + rect.top;
      return { text: normalized(element.textContent), score: score };
    }).sort(function (a, b) { return a.score - b.score; });
    if (!candidates.length) return null;
    var parts = candidates[0].text.split(":").map(Number);
    return parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1];
  }
  function playPageCallBeep(trigger, callId, flowId) {
    if (!config.soundEnabled) return false;
    var now = Date.now();
    var marker = window[CALL_BEEP_MARKER] || {};
    if (marker.playedAt && now - Number(marker.playedAt) < 15000 &&
        ((callId && marker.callId === callId) || (flowId && marker.flowId === flowId))) return true;
    var volume = Math.max(0.15, Math.min(1, Number(config.volume) || 0.8));
    window[CALL_BEEP_MARKER] = Object.assign({}, marker, { callId: callId || marker.callId || null, flowId: flowId || marker.flowId || null, requestedAt: now, playedAt: null, trigger: trigger || "call-route-entered" });
    emit("CALL_ALERT_PAGE_BEEP_REQUESTED", { callId: callId || null, flowId: flowId || null, trigger: trigger || "call-route-entered" });
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) throw new Error("AudioContext no disponible");
      var ctx = new Ctx(), o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.frequency.setValueAtTime(880, t); o.frequency.setValueAtTime(1174.66, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.45), t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g); g.connect(ctx.destination);
      var playedAt = Date.now();
      o.onended = function () { try { ctx.close(); } catch (_) {} };
      o.start(t); o.stop(t + 0.37);
      window[CALL_BEEP_MARKER] = Object.assign({}, window[CALL_BEEP_MARKER], { playedAt: playedAt });
      try { chrome.storage.local.set({ effectifPageBeep: { callId: callId || null, flowId: flowId || null, playedAt: playedAt, trigger: trigger || "call-route-entered" } }); } catch (_) {}
      emit("CALL_ALERT_PAGE_BEEP_PLAYED", { callId: callId || null, flowId: flowId || null, trigger: trigger || "call-route-entered" });
      return true;
    } catch (error) {
      window[CALL_BEEP_MARKER] = Object.assign({}, window[CALL_BEEP_MARKER], { error: String(error) });
      emit("CALL_ALERT_PAGE_BEEP_ERROR", { callId: callId || null, flowId: flowId || null, trigger: trigger || "call-route-entered", error: String(error) }, "warn");
      return false;
    }
  }
  function speakConfirmedAnswer(callId, flowId) {
    if (!config.soundEnabled || !callId || lastSpokenCallId === callId) return false;
    lastSpokenCallId = callId;
    try {
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) throw new Error("SpeechSynthesis no disponible");
      var utterance = new SpeechSynthesisUtterance("Llamada entrante.");
      utterance.lang = "es-MX";
      utterance.volume = Math.max(0.15, Math.min(1, Number(config.volume) || 0.8));
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      emit("CALL_ALERT_TTS_PLAYED", { callId: callId, flowId: flowId || null, phrase: "Llamada entrante.", lang: "es-MX" });
      return true;
    } catch (error) {
      emit("CALL_ALERT_TTS_ERROR", { callId: callId, flowId: flowId || null, error: String(error) }, "warn");
      return false;
    }
  }
  function callActivationEvidence() {
    var endButtons = Array.from(document.querySelectorAll("button,[role='button']")).filter(visibleElement).filter(function (element) {
      return /^End call$/i.test(normalized(element.getAttribute("aria-label") || element.textContent || ""));
    });
    var mediaCount = document.querySelectorAll("audio,video").length;
    var timerSeconds = parsePlatformSeconds();
    return {
      endCallButtonVisible: endButtons.length > 0,
      endCallButtonCount: endButtons.length,
      mediaElements: mediaCount,
      platformTimerSeconds: Number.isFinite(timerSeconds) ? timerSeconds : null,
      urlPattern: /^\/call\/[^/?#]+\/?$/.test(location.pathname)
    };
  }
  function emitRatingConfirmed(callId, previousCallId, endMeasurement) {
    if (!callId || !isRatingRoute() || !ratingStarsVisible()) return false;
    emit("CALL_ROUTE_ENDED", {
      callId: callId,
      platformSeconds: Number.isFinite(endMeasurement) ? endMeasurement : null,
      reason: "rating-stars-confirmed",
      endSignal: "rating-stars-confirmed"
    });
    emit("RATING_ROUTE_ENTERED", {
      callId: callId,
      previousCallId: previousCallId || null,
      platformSeconds: Number.isFinite(endMeasurement) ? endMeasurement : null,
      confirmation: "rating-stars-visible"
    });
    return true;
  }
  function scheduleRatingCompletionConfirmation(callId, previousCallId, endMeasurement) {
    if (ratingConfirmationTimer) clearTimeout(ratingConfirmationTimer);
    var startedAt = Date.now();
    function check() {
      if (!isRatingRoute() || currentCallId()) {
        emit("CALL_ROUTE_ENDED", {
          callId: callId,
          platformSeconds: Number.isFinite(endMeasurement) ? endMeasurement : null,
          reason: "rating-route-left-before-confirmation",
          endSignal: "route-fallback-no-rating"
        });
        emit("RATING_ROUTE_FAILED", {
          callId: callId,
          previousCallId: previousCallId || null,
          confirmation: "rating-route-left-before-stars"
        }, "warn");
        ratingConfirmationTimer = null;
        return;
      }
      if (emitRatingConfirmed(callId, previousCallId, endMeasurement)) {
        ratingConfirmationTimer = null;
        return;
      }
      if (Date.now() - startedAt >= 3000) {
        emit("CALL_ROUTE_ENDED", {
          callId: callId,
          platformSeconds: Number.isFinite(endMeasurement) ? endMeasurement : null,
          reason: "rating-stars-timeout",
          endSignal: "route-fallback-no-rating"
        });
        emit("RATING_ROUTE_FAILED", {
          callId: callId,
          previousCallId: previousCallId || null,
          confirmation: "rating-stars-not-observed"
        }, "warn");
        ratingConfirmationTimer = null;
        return;
      }
      ratingConfirmationTimer = setTimeout(check, 150);
    }
    check();
  }
  function trackRoute(reason) {
    var next = location.pathname;
    if (next === route && reason !== "start") return;
    var previousRoute = route;
    var previousCallId = callRouteId;
    var ratingMatch = next.match(/^\/call\/([^/?#]+)\/rate\/?$/);
    var nextCallId = currentCallId();
    var leavingCall = previousCallId && previousCallId !== nextCallId;
    var endMeasurement = lastCallEndMeasurement && lastCallEndMeasurement.callId === previousCallId
      ? lastCallEndMeasurement.platformSeconds : null;
    route = next;
    callRouteId = nextCallId;
    emitAutoAnswerReadiness("route:" + reason);
    if (leavingCall) {
      if (!Number.isFinite(endMeasurement)) endMeasurement = ratingMatch ? null : parsePlatformSeconds();
      if (ratingMatch) scheduleRatingCompletionConfirmation(previousCallId, previousCallId, endMeasurement);
      else emit("CALL_ROUTE_ENDED", {
        callId: previousCallId,
        platformSeconds: Number.isFinite(endMeasurement) ? endMeasurement : null,
        reason: reason,
        endSignal: "route-fallback"
      });
    }
    if (ratingMatch && (!previousCallId || previousCallId === ratingMatch[1])) {
      if (!previousCallId) {
        emit("RATING_ROUTE_ENTERED", {
          callId: ratingMatch[1],
          previousCallId: null,
          platformSeconds: Number.isFinite(endMeasurement) ? endMeasurement : null,
          confirmation: "rating-route-direct"
        });
      }
    }
    if (callRouteId && callRouteId !== previousCallId) {
      callDisplayStartedAt = Date.now();
      var routeFromAuthorizedProfile = location.origin === AUTHORIZED_PROFILE_ORIGIN &&
        (previousRoute === AUTHORIZED_PROFILE_PATH || previousRoute === AUTHORIZED_PROFILE_PATH + "/");
      var answerFlowConfirmed = !!(
        routeFromAuthorizedProfile &&
        answerFlow.flowId &&
        answerFlow.clickAt &&
        !answerFlow.routeConfirmed &&
        Date.now() - Date.parse(answerFlow.clickAt) <= 30000
      );
      var evidence = callActivationEvidence();
      if (answerFlowConfirmed) {
        answerFlow.routeConfirmed = true;
        window[ANSWER_LEASE_MARKER] = Object.assign({}, window[ANSWER_LEASE_MARKER] || {}, answerFlow, {
          callId: callRouteId, routeConfirmed: true, confirmedAt: iso()
        });
        playPageCallBeep("confirmed-answer-route", callRouteId, answerFlow.flowId);
        speakConfirmedAnswer(callRouteId, answerFlow.flowId);
        emit("ANSWER_FLOW_ROUTE_CONFIRMED", {
          flowId: answerFlow.flowId,
          callId: callRouteId,
          modality: answerFlow.modality,
          latencyMs: Math.max(0, Date.parse(iso()) - Date.parse(answerFlow.clickAt)),
          evidence: evidence,
          confirmation: "authorized-profile-to-call-route"
        });
      } else {
        emit("CALL_ROUTE_ENTERED", {
          callId: callRouteId,
          reason: reason,
          evidence: evidence,
          autoAnswerConfirmation: "not-claimed"
        });
      }
      activateOverlayForCall(callRouteId, "call-route-entered");
      if (answerWatchdog) { clearTimeout(answerWatchdog); answerWatchdog = null; }
      emitIntegrity("call-entered");
    }
    if (!callRouteId && !isRatingRoute()) {
      callDisplayStartedAt = null;
      lastCallEndMeasurement = null;
    }
    if (isRatingRoute() && overlayLifecycleActive) renderOverlay();
    schedulePlatformMirror("route:" + reason);
    portalStructureSnapshot("route:" + reason, true);
    updateDiagnosticTimers();
    renderOverlay();
  }
  function cleanupFingerprints() {
    var cutoff = Date.now() - 15000;
    fingerprints.forEach(function (at, key) {
      if (at < cutoff) fingerprints.delete(key);
    });
  }
  function autoAnswer() {
    syncPageFavicon();
    if (!isAutoAnswerReady() || currentCallId()) return;
    var dialogs = document.querySelectorAll(DIALOG);
    if (!dialogs.length) {
      if (lastIncomingSignature) {
        emit("INCOMING_DIALOG_CLOSED", {
          signature: lastIncomingSignature,
          reason: currentCallId() ? "call-route-confirmed" : "dialog-removed"
        });
      }
      lastIncomingSignature = "";
      return;
    }
    dialogs.forEach(function (dialog) {
      var text = normalized(dialog.innerText || dialog.textContent);
      if (!/(?:is\s+requesting\s+interpretation|requesting\s+interpretation)/i.test(text)) return;
      var modality = /Audio interpreting/i.test(text) ? "OPI" :
        /Video interpreting/i.test(text) ? "VRI" : "UNKNOWN";
      var button = Array.from(dialog.querySelectorAll("button,[role='button']")).filter(visibleElement).find(function (element) {
        var label = normalized(element.getAttribute("aria-label") || element.textContent || "");
        return /^Connect$/i.test(label);
      }) || null;
      var signature = modality + "|" + !!button + "|" + (button ? !!button.disabled : "none");
      var newIncoming = signature !== lastIncomingSignature;
      if (newIncoming) {
        lastIncomingSignature = signature;
        emit("INCOMING_DIALOG_DETECTED", {
          modality: modality, connectFound: !!button,
          connectDisabled: button ? !!button.disabled : null,
          requestTextLength: text.length,
          dialog: {
            buttons: dialog.querySelectorAll("button").length,
            inputs: dialog.querySelectorAll("input,select,textarea").length,
            textLength: text.length
          },
          validation: {
            requestPhrase: true,
            audioPhrase: /Audio interpreting/i.test(text),
            videoPhrase: /Video interpreting/i.test(text)
          }
        });
        if (button) emit("CONNECT_BUTTON_FOUND", {
          modality: modality, disabled: !!button.disabled,
          label: safe(button.getAttribute("aria-label") || button.textContent).slice(0, 120)
        });
        else emit("CONNECT_BUTTON_NOT_FOUND", { modality: modality, dialogButtons: dialog.querySelectorAll("button,[role='button']").length }, "warn");
        if (button && button.disabled) emit("CONNECT_BUTTON_DISABLED", { modality: modality }, "warn");
      }
      if (!config.autoAnswerEnabled || !button || button.disabled || clickedNodes.has(button)) return;
      if (modality !== "OPI") {
        emit("AUTO_ANSWER_SKIPPED_UNVERIFIED_MODALITY", { modality: modality, decision: "blocked", reason: "only-verified-OPI" }, "warn");
        return;
      }
      cleanupFingerprints();
      var fingerprint = safe(text) + "|" + modality;
      if (fingerprints.has(fingerprint)) return;
      emit("AUTO_ANSWER_ELIGIBLE", {
        modality: modality, decision: "click-connect",
        buttonLabel: safe(button.getAttribute("aria-label") || button.textContent).slice(0, 120)
      });
      clickedNodes.add(button);
      fingerprints.set(fingerprint, Date.now());
      try {
        var started = performance.now();
        var flowId = crypto.randomUUID();
        answerFlow = {
          flowId: flowId,
          clickAt: iso(),
          modality: modality,
          fingerprint: fingerprint,
          routeConfirmed: false
        };
        window[ANSWER_LEASE_MARKER] = { flowId: flowId, clickAt: answerFlow.clickAt, modality: modality, fingerprint: fingerprint, routeConfirmed: false, runtimeVersion: RUNTIME_VERSION };
        button.click();
        integrity.permittedConnectClicks += 1;
        emit("CONNECT_CLICKED", {
          modality: modality,
          flowId: flowId,
          expectedRoute: "/call/<ID>",
          clickLatencyMs: Math.round((performance.now() - started) * 1000) / 1000,
          buttonLabel: safe(button.getAttribute("aria-label") || button.textContent).slice(0, 120),
          buttonDisabledAtClick: !!button.disabled,
          platformInteraction: "permitted-connect-only"
        });
        emitIntegrity("after-connect");
        if (answerWatchdog) clearTimeout(answerWatchdog);
        answerWatchdog = setTimeout(function () {
          answerWatchdog = null;
          if (answerFlow.flowId !== flowId || answerFlow.routeConfirmed || currentCallId()) return;
          emit("CONNECT_ROUTE_TIMEOUT", {
            flowId: flowId,
            modality: modality,
            elapsedMs: Date.now() - Date.parse(answerFlow.clickAt),
            expectedRoute: "/call/<ID>",
            action: "no-second-click"
          }, "error");
        }, 7000);
      } catch (error) {
        if (answerWatchdog) { clearTimeout(answerWatchdog); answerWatchdog = null; }
        emit("CONNECT_ERROR", { message: String(error), flowId: answerFlow.flowId || null }, "error");
      }
    });
  }
  function emitAutoAnswerReadiness(reason) {
    var availability = readAvailabilityState();
    var ready = isAuthorizedProfilePage() && config.autoAnswerEnabled && availability === "online";
    emit("AUTO_ANSWER_READINESS", {
      ready: ready,
      availability: availability,
      authorizedProfile: isAuthorizedProfilePage(),
      route: routeTemplate(),
      exactUrl: location.origin + location.pathname,
      runtimeVersion: RUNTIME_VERSION,
      reason: reason || "state-check"
    });
    return ready;
  }
  function scheduleReadinessHeartbeat() {
    if (readinessTimer) clearInterval(readinessTimer);
    readinessTimer = setInterval(function () {
      emitAutoAnswerReadiness("heartbeat");
    }, 2000);
    emitAutoAnswerReadiness("startup");
  }
  function detectAvailability() {
    var next = readAvailabilityState();
    syncPageFavicon();
    emitAutoAnswerReadiness("availability");
    if (next !== "unknown" && next !== lastAvailability) {
      lastAvailability = next;
      emit("AVAILABILITY_STATE", { state: next });
    }
    return next;
  }
  function mediaSnapshot(reason) {
    if (!currentCallId()) return;
    var media = Array.from(document.querySelectorAll("audio,video")).map(function (element, index) {
      var stream = element.srcObject;
      var tracks = stream && typeof stream.getTracks === "function" ? stream.getTracks().map(function (track) {
        var settings = typeof track.getSettings === "function" ? track.getSettings() : {};
        return {
          kind: track.kind, enabled: track.enabled, muted: track.muted,
          readyState: track.readyState,
          sampleRate: settings.sampleRate || null,
          channelCount: settings.channelCount || null,
          echoCancellation: settings.echoCancellation == null ? null : settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression == null ? null : settings.noiseSuppression,
          autoGainControl: settings.autoGainControl == null ? null : settings.autoGainControl
        };
      }) : [];
      return {
        index: index, tag: element.tagName.toLowerCase(), readyState: element.readyState,
        paused: element.paused, ended: element.ended, muted: element.muted,
        volume: element.volume, currentTime: Math.round(element.currentTime || 0),
        hasSrcObject: !!stream, tracks: tracks
      };
    });
    var signature = JSON.stringify(media);
    var now = Date.now();
    if (signature === lastMediaSignature && now - lastMediaAt < 15000) return;
    lastMediaSignature = signature;
    lastMediaAt = now;
    emit("MEDIA_HEALTH", { reason: reason, callId: currentCallId(), media: media, mediaElementsFound: media.length, interpretation: media.length ? "media-elements-present" : "no-media-elements-observed-in-dom" }, "info");
  }
  function emitIntegrity(reason) {
    emit("PLATFORM_INTEGRITY_CHECK", {
      reason: reason,
      callId: currentCallId(),
      policy: "read-only-except-validated-connect",
      counters: Object.assign({}, integrity),
      guarantees: {
        tabCaptureUsed: false,
        microphoneOpenedByExtension: false,
        originalTracksStopped: false,
        originalTracksReplaced: false,
        originalTrackConstraintsChanged: false,
        platformMediaElementsModified: false,
        privatePlatformApiCalled: false
      }
    }, integrity.forbiddenPlatformActions ? "error" : "info");
  }
  function updateDiagnosticTimers() {
    if (currentCallId() && !mediaTimer) {
      mediaSnapshot("call-start");
      mediaTimer = setInterval(function () { mediaSnapshot("heartbeat"); }, 5000);
    } else if (!currentCallId() && mediaTimer) {
      clearInterval(mediaTimer);
      mediaTimer = null;
    }
    if (currentCallId() && !integrityTimer) {
      integrityTimer = setInterval(function () { emitIntegrity("heartbeat"); }, 15000);
    } else if (!currentCallId() && integrityTimer) {
      clearInterval(integrityTimer);
      integrityTimer = null;
    }
  }
  function visibleElement(element) {
    if (!element) return false;
    var style = getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
  }
  function mirrorKey() {
    var path = location.pathname;
    if (/^\/profile\/[^/]+\/logs\/scheduled\/?$/.test(path)) return "pre-scheduled";
    if (/^\/profile\/[^/]+\/logs\/?$/.test(path)) return "statistics";
    if (/^\/profile\/[^/]+\/appointments\/?$/.test(path)) return "appointments";
    if (/^\/profile\/[^/]+\/finance\/?$/.test(path)) return "finance";
    if (/^\/profile\/[^/]+\/?$/.test(path)) return "profile";
    return "";
  }
  function parseOfficialUsd(value) {
    var match = String(value || "").match(/(?:US\$|\$)\s*([0-9]+(?:[.,][0-9]+)?)/);
    return match ? Number(String(match[1]).replace(",", ".")) : null;
  }
  function extractSummary() {
    var definitions = [
      ["earned", /^(Totally earned|Total earned)$/i],
      ["callLength", /^Total call length$/i],
      ["callCount", /^Total number of calls$/i]
    ];
    var result = {};
    var elements = Array.from(document.querySelectorAll("main *,body *")).filter(function (element) {
      return element.children.length <= 2 && visibleElement(element);
    });
    definitions.forEach(function (definition) {
      for (var i = 0; i < elements.length; i += 1) {
        if (!definition[1].test(normalized(elements[i].textContent))) continue;
        var parent = elements[i].parentElement;
        var values = parent ? String(parent.innerText || "").split(/\n+/).map(normalized).filter(Boolean) : [];
        var value = values.filter(function (item) { return !definition[1].test(item); })[0] || "";
        if (value) { result[definition[0]] = mirrorText(value, 120); if (definition[0] === "earned") result.earnedUsd = parseOfficialUsd(value); }
        break;
      }
    });
    return result;
  }
  function extractTables() {
    return Array.from(document.querySelectorAll("table,[role='table']")).filter(visibleElement).slice(0, 8)
      .map(function (table) {
        var rows = Array.from(table.querySelectorAll("tr,[role='row']")).filter(visibleElement).slice(0, 100)
          .map(function (row) {
            return Array.from(row.querySelectorAll("th,td,[role='columnheader'],[role='cell']"))
              .filter(visibleElement).map(function (cell) {
                return mirrorText(cell.innerText || cell.textContent, 300);
              });
          }).filter(function (row) { return row.length; });
        return { rows: rows };
      }).filter(function (table) { return table.rows.length; });
  }
  function emitPlatformSurfaceSnapshot(reason) {
    if (!isTarget() || !config.observationEnabled) return;
    var platformSurface = extractPortalStructure();
    var signature = JSON.stringify(platformSurface);
    if (signature === lastPlatformSurfaceHash) return;
    lastPortalStructureSignature = signature;
    lastPlatformSurfaceHash = signature;
    emit("PLATFORM_SURFACE_SNAPSHOT", {
      schema: "signal-interpreter-platform-surface-event/v1",
      snapshotReason: reason || "heartbeat",
      snapshotHash: stableSurfaceToken(signature),
      platformSurface: platformSurface
    }, "info");
    try { chrome.runtime.sendMessage({ type: "SIGNAL_PLATFORM_SCREENSHOT_REQUEST", reason: "platform-surface-change" }).catch(function () {}); } catch (_) {}
  }
  function portalStructureSnapshot(reason, force) {
    if (!isTarget() || !config.observationEnabled) return;
    if (platformSurfaceTimer) {
      clearTimeout(platformSurfaceTimer);
      platformSurfaceTimer = null;
    }
    if (force) {
      emitPlatformSurfaceSnapshot(reason);
      return;
    }
    platformSurfaceTimer = setTimeout(function () {
      platformSurfaceTimer = null;
      emitPlatformSurfaceSnapshot(reason);
    }, 500);
  }
  function platformRouteFromPath(pathname) {
    return String(pathname || "")
      .replace(/^\/call\/[^/?#]+/, "/call/<ID>")
      .replace(/^\/profile\/[^/?#]+/, "/profile/<ID>");
  }
  function platformUrlDescriptor(raw) {
    try {
      var url = new URL(String(raw || ""), location.href);
      var keys = Array.from(url.searchParams.keys()).sort().slice(0, 40);
      return {
        origin: url.origin,
        path: platformRouteFromPath(url.pathname),
        route: platformRouteFromPath(url.pathname),
        searchKeys: keys,
        hashPresent: !!url.hash
      };
    } catch (_) { return {origin: "", path: "", route: "", searchKeys: [], hashPresent: false}; }
  }
  function observePlatformUrl(reason) {
    if (!isTarget() || !config.observationEnabled) return false;
    var href = location.href;
    if (href === lastObservedHref) return false;
    var previous = lastObservedHref;
    lastObservedHref = href;
    emit("PLATFORM_URL_CHANGED", {
      reason: reason || "poll",
      previous: platformUrlDescriptor(previous),
      current: platformUrlDescriptor(href),
      navigationType: (performance.getEntriesByType("navigation")[0] || {}).type || "unknown"
    }, "info");
    portalStructureSnapshot("url-change:" + (reason || "poll"), true);
    try { chrome.runtime.sendMessage({ type: "SIGNAL_PLATFORM_SCREENSHOT_REQUEST", reason: "platform-url-change" }).catch(function () {}); } catch (_) {}
    return true;
  }

  function capturePlatformMirror(reason, force) {
    var key = mirrorKey();
    if (!key || !config.observationEnabled || location.hostname !== config.targetHost) return;
    var root = document.querySelector("main") || document.body;
    var seen = new Set();
    var lines = String(root && root.innerText || "").split(/\n+/).map(normalized).filter(function (line) {
      if (!line || seen.has(line)) return false;
      seen.add(line);
      return true;
    }).slice(0, 600).map(function (line) { return mirrorText(line, 500); });
    var snapshot = {
      schema: "signal-interpreter-visible-page/v1", key: key,
      route: routeTemplate(), title: safe(document.title), capturedAt: iso(),
      reason: reason, summary: extractSummary(), tables: extractTables(), lines: lines, portal: extractPortalStructure()
    };
    var signature = JSON.stringify({
      key: key, summary: snapshot.summary, tables: snapshot.tables, lines: lines
    });
    if (signature === lastMirrorSignature && !force) return;
    lastMirrorSignature = signature;
    try {
      var snapshotPromise = chrome.runtime.sendMessage({ type: "EFFECTIF_PLATFORM_SNAPSHOT", snapshot: snapshot });
      if (snapshotPromise && typeof snapshotPromise.catch === "function") snapshotPromise.catch(function () {});
    } catch (_) {}
  }
  function schedulePlatformMirror(reason) {
    if (mirrorTimer) clearTimeout(mirrorTimer);
    mirrorTimer = setTimeout(function () {
      mirrorTimer = null;
      capturePlatformMirror(reason);
    }, 500);
  }
  function mapScreen(reason) {
    if (!config.observationEnabled) return;
    var payload = {
      reason: reason, route: routeTemplate(), title: safe(document.title),
      controls: {
        buttons: document.querySelectorAll("button").length,
        dialogs: document.querySelectorAll('[role="dialog"]').length,
        audio: document.querySelectorAll("audio").length,
        video: document.querySelectorAll("video").length,
        iframes: document.querySelectorAll("iframe").length
      }
    };
    var signature = JSON.stringify(payload);
    if (signature === lastScreenSignature) return;
    lastScreenSignature = signature;
    emit("SCREEN_MAP", payload);
  }
  function elementDescriptor(element) {
    if (!element || element === overlayHost || (overlayHost && overlayHost.contains && overlayHost.contains(element))) return null;
    var text = safe(element.getAttribute && (element.getAttribute("aria-label") || element.getAttribute("title")) || element.textContent || "").slice(0, 120);
    return {
      tag: String(element.tagName || "").toLowerCase(),
      role: safe(element.getAttribute && element.getAttribute("role") || "").slice(0, 60),
      type: safe(element.getAttribute && element.getAttribute("type") || "").slice(0, 40),
      label: text, disabled: !!element.disabled
    };
  }
  function resourceTelemetry() {
    var entries = performance.getEntriesByType("resource");
    var fresh = entries.slice(resourceCursor); resourceCursor = entries.length;
    var byType = {}; var totalDuration = 0; var transferBytes = 0; var slowest = [];
    fresh.forEach(function (entry) {
      var type = entry.initiatorType || "other"; byType[type] = Number(byType[type] || 0) + 1;
      totalDuration += Number(entry.duration || 0); transferBytes += Number(entry.transferSize || 0);
      var name;
      try { var u = new URL(entry.name); name = u.origin + u.pathname.replace(/\/call\/[^/]+/, "/call/<ID>").replace(/\/profile\/[^/]+/, "/profile/<ID>"); }
      catch (_) { name = "[INVALID_URL]"; }
      slowest.push({ name: name.slice(0, 400), type: type, durationMs: Math.round(Number(entry.duration || 0)), transferBytes: Number(entry.transferSize || 0) });
    });
    slowest.sort(function (a, b) { return b.durationMs - a.durationMs; });
    return { newResources: fresh.length, byType: byType, totalDurationMs: Math.round(totalDuration), transferBytes: transferBytes, slowest: slowest.slice(0, 12) };
  }
  function performanceSnapshot(reason) {
    if (!config.observationEnabled || !config.performanceTelemetryEnabled) return;
    var navigation = performance.getEntriesByType("navigation")[0];
    var connection = navigator.connection || {};
    var memory = performance.memory || {};
    var payload = {
      reason: reason, route: routeTemplate(), uptimeMs: Math.round(performance.now()),
      document: { readyState: document.readyState, visibility: document.visibilityState, focused: document.hasFocus(), online: navigator.onLine, title: safe(document.title), nodes: document.getElementsByTagName("*").length },
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio: devicePixelRatio },
      navigation: navigation ? { type: navigation.type, durationMs: Math.round(navigation.duration), domInteractiveMs: Math.round(navigation.domInteractive), domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd), loadMs: Math.round(navigation.loadEventEnd), transferBytes: navigation.transferSize || 0 } : null,
      connection: { effectiveType: connection.effectiveType || null, downlinkMbps: connection.downlink || null, rttMs: connection.rtt || null, saveData: !!connection.saveData },
      memory: memory.usedJSHeapSize ? { usedBytes: memory.usedJSHeapSize, totalBytes: memory.totalJSHeapSize, limitBytes: memory.jsHeapSizeLimit } : null,
      performance: Object.assign({}, performanceAggregate),
      mutations: Object.assign({}, mutationAggregate),
      resources: resourceTelemetry(),
      controls: { buttons: document.querySelectorAll("button").length, inputs: document.querySelectorAll("input").length, selects: document.querySelectorAll("select").length, dialogs: document.querySelectorAll('[role="dialog"]').length, media: document.querySelectorAll("audio,video").length, iframes: document.querySelectorAll("iframe").length }
    };
    mutationAggregate = { batches: 0, addedNodes: 0, removedNodes: 0, attributes: 0, textChanges: 0 };
    portalStructureSnapshot("heartbeat", false);
    emit("PERFORMANCE_HEARTBEAT", payload);
  }
  function startRichTelemetry() {
    if (!telemetryStarted) {
      telemetryStarted = true;
    try {
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          performanceAggregate.longTasks += 1; performanceAggregate.longTaskTotalMs += Math.round(entry.duration);
          performanceAggregate.longestTaskMs = Math.max(performanceAggregate.longestTaskMs, Math.round(entry.duration));
        });
      }).observe({ type: "longtask", buffered: true });
    } catch (_) {}
    try {
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          if (entry.hadRecentInput) return; performanceAggregate.layoutShifts += 1; performanceAggregate.layoutShiftScore += Number(entry.value || 0);
        });
      }).observe({ type: "layout-shift", buffered: true });
    } catch (_) {}
    window.addEventListener("error", function (event) {
      var message = safe(event.message);
      if (/Extension context invalidated/i.test(message)) {
        try { event.preventDefault(); } catch (_) {}
        return;
      }
      emit("PAGE_RUNTIME_ERROR", { message: message, filename: safe(event.filename).replace(/\?.*$/, ""), line: event.lineno || null, column: event.colno || null }, "error");
    }, true);
    window.addEventListener("unhandledrejection", function (event) {
      var reason = safe(event.reason && (event.reason.stack || event.reason.message) || event.reason).slice(0, 1000);
      if (/Extension context invalidated/i.test(reason)) {
        try { event.preventDefault(); } catch (_) {}
        return;
      }
      emit("PAGE_UNHANDLED_REJECTION", { reason: reason }, "error");
    });
    ["focus", "blur", "online", "offline", "pageshow", "pagehide", "freeze", "resume"].forEach(function (name) {
      window.addEventListener(name, function (event) { emit("PAGE_LIFECYCLE", { event: name, persisted: !!event.persisted }); });
    });
    document.addEventListener("visibilitychange", function () { emit("PAGE_VISIBILITY_CHANGED", { visibility: document.visibilityState }); });
    document.addEventListener("submit", function (event) {
      if (!config.interactionTelemetryEnabled) return;
      emit("FORM_SUBMITTED", { form: elementDescriptor(event.target), controls: event.target && event.target.elements ? event.target.elements.length : null });
    }, true);
    document.addEventListener("click", function (event) {
      if (!config.interactionTelemetryEnabled) return;
      var target = event.target && event.target.closest ? event.target.closest("button,a,[role='button'],input,select") : null;
      var descriptor = elementDescriptor(target); if (!descriptor) return;
      var label = normalized(descriptor.label || "");
      if (/^(?:end call|hang up|end)$/i.test(label)) {
        emit("CALL_END_CONTROL_INTERACTION", {
          kind: "click",
          target: descriptor,
          callId: currentCallId(),
          route: routeTemplate(),
          source: "user-interaction-observer"
        }, "info");
      }
      emit("USER_INTERACTION", { kind: "click", target: descriptor });
    }, true);
      performanceSnapshot("telemetry-start");
    }
    if (!telemetryTimer) telemetryTimer = setInterval(function () { performanceSnapshot("heartbeat"); }, Math.max(10, Number(config.telemetryHeartbeatSeconds || 30)) * 1000);
  }
  function localDay(value) {
    var date = value ? new Date(value) : new Date();
    if (!Number.isFinite(date.getTime())) date = new Date();
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }
  function money(value, currency, digits) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency", currency: currency, minimumFractionDigits: digits, maximumFractionDigits: digits
    }).format(Number(value) || 0);
  }
  function overlayCallInPeriod(call, period) {
    var date = new Date(call.startedAt || call.endedAt);
    var now = new Date();
    if (!Number.isFinite(date.getTime())) return false;
    if (period === "today") return localDay(date) === localDay(now);
    if (period === "currentMonth") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    if (period === "year") return date.getFullYear() === now.getFullYear();
    var previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return date.getFullYear() === previous.getFullYear() && date.getMonth() === previous.getMonth();
  }
  function activeOverlayStartedAt() {
    if (state.callStartedAt) return state.callStartedAt;
    return currentCallId() && callDisplayStartedAt ? new Date(callDisplayStartedAt).toISOString() : null;
  }
  function finiteMetric(value) {
    if (value == null || value === "") return null;
    var number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }
  function overlayPeriodMatches(value, period) {
    if (!value) return false;
    if (earningsMetrics) return earningsMetrics.callStartsInPeriod(period, value, Date.now());
    return overlayCallInPeriod({ startedAt: value }, period);
  }
  function overlayLocalBaseline(period) {
    var now = new Date();
    var completed = Array.isArray(state.completedCalls) ? state.completedCalls.filter(function (call) {
      return overlayCallInPeriod(call, period);
    }) : [];
    var unfinished = Array.isArray(state.unfinishedCalls) ? state.unfinishedCalls.filter(function (call) {
      return overlayCallInPeriod(call, period);
    }) : [];
    var missed = Array.isArray(state.missedCallRecords) ? state.missedCallRecords.filter(function (call) {
      return overlayCallInPeriod({ startedAt: call.detectedAt || call.classifiedAt }, period);
    }) : [];
    var seen = new Set(), records = [];
    completed.concat(unfinished).forEach(function (call, index) {
      var key = call.callId || call.id || String(call.startedAt || "") + "|" + String(call.endedAt || "") + "|" + index;
      if (seen.has(key)) return;
      seen.add(key);
      records.push(call);
    });
    var completedUsd = completed.reduce(function (sum, call) {
      return sum + (finiteMetric(call.estimatedRevenue) || 0);
    }, 0);
    var durationSeconds = records.reduce(function (sum, call) {
      var seconds = null;
      if (earningsMetrics && call.startedAt && call.endedAt) {
        seconds = earningsMetrics.intervalSecondsInPeriod(period, call.startedAt, call.endedAt, now);
      }
      if (!(seconds >= 0)) {
        seconds = finiteMetric(call.platformSeconds);
        if (seconds == null) seconds = finiteMetric(call.observedSeconds);
        if (seconds == null) seconds = finiteMetric(call.billableSecondsAssumed);
        if (seconds == null && call.startedAt && call.endedAt) {
          var start = Date.parse(call.startedAt), end = Date.parse(call.endedAt);
          if (Number.isFinite(start) && Number.isFinite(end) && end >= start) seconds = (end - start) / 1000;
        }
        if (!(seconds >= 0) || !overlayPeriodMatches(call.startedAt || call.endedAt, period)) seconds = 0;
      }
      return sum + seconds;
    }, 0);
    var missedKeys = new Set();
    var missedCount = missed.filter(function (call, index) {
      var key = call.callId || call.id || String(call.detectedAt || call.classifiedAt || "") + "|" + index;
      if (seen.has(key) || missedKeys.has(key)) return false;
      missedKeys.add(key);
      return true;
    }).length;
    return {
      earnedUsd: completedUsd,
      earned: null,
      callCount: completed.length + unfinished.length + missedCount,
      minutes: durationSeconds / 60,
      callLength: null,
      capturedAt: null,
      periodKey: earningsMetrics ? earningsMetrics.periodKey(period, now) : null,
      source: "local-reconciled-state",
      authoritative: false
    };
  }
  function overlayOfficialBaseline(entry, summary, period) {
    if (!entry || !summary || typeof summary !== "object") return null;
    var earnedUsd = finiteMetric(summary.earnedUsd);
    if (earnedUsd == null && summary.earned != null) earnedUsd = finiteMetric(parseOfficialUsd(summary.earned));
    var callCount = finiteMetric(summary.callCount);
    var minutes = earningsMetrics ? earningsMetrics.parseCallLengthMinutes(summary.callLength) : null;
    if (minutes == null && summary.callLength != null) {
      var text = String(summary.callLength);
      var parsed = text.split(":").map(Number);
      if (parsed.length === 3 && parsed.every(Number.isFinite)) minutes = parsed[0] * 60 + parsed[1] + parsed[2] / 60;
      else if (parsed.length === 2 && parsed.every(Number.isFinite)) minutes = parsed[0] + parsed[1] / 60;
    }
    if (earnedUsd == null && callCount == null && minutes == null && summary.earned == null) return null;
    var source = entry.source || "platform-page-context";
    var keyReference = entry.startIso || entry.capturedAt || Date.now();
    var baselinePeriodKey = null;
    if (earningsMetrics) {
      if (period === "previousMonth") {
        var periodStartDate = new Date(keyReference);
        if (Number.isFinite(periodStartDate.getTime())) {
          baselinePeriodKey = String(periodStartDate.getFullYear()) + "-" + String(periodStartDate.getMonth() + 1).padStart(2, "0");
        }
      } else {
        baselinePeriodKey = earningsMetrics.periodKey(period, keyReference);
      }
    }
    return {
      earnedUsd: earnedUsd,
      earned: summary.earned == null ? null : summary.earned,
      callCount: callCount,
      minutes: minutes,
      callLength: summary.callLength == null ? null : summary.callLength,
      capturedAt: entry.capturedAt || null,
      periodKey: baselinePeriodKey,
      source: source,
      authoritative: source === "platform-page-context" || source === "fetchInterpreterLogs" || source === "platform-page-context-call-safe"
    };
  }
  function normalizeOverlayBaseline(baseline, period) {
    if (!baseline) return null;
    var source = baseline.source || "unknown";
    var minutes = finiteMetric(baseline.minutes);
    if (minutes == null && earningsMetrics) minutes = earningsMetrics.parseCallLengthMinutes(baseline.callLength);
    var earnedUsd = finiteMetric(baseline.earnedUsd);
    if (earnedUsd == null && baseline.earned != null) earnedUsd = finiteMetric(parseOfficialUsd(baseline.earned));
    var key = baseline.periodKey || (earningsMetrics
      ? earningsMetrics.periodKey(period, baseline.startIso || baseline.capturedAt || Date.now()) : null);
    return {
      earnedUsd: earnedUsd,
      earned: baseline.earned == null ? null : baseline.earned,
      callCount: finiteMetric(baseline.callCount),
      minutes: minutes,
      callLength: baseline.callLength == null ? null : baseline.callLength,
      capturedAt: baseline.capturedAt || null,
      periodKey: key,
      source: source,
      authoritative: baseline.authoritative === true || source === "platform-page-context" || source === "fetchInterpreterLogs" || source === "platform-page-context-call-safe"
    };
  }
  function overlayBaselineMatchesPeriod(baseline, period, key) {
    var normalizedBaseline = normalizeOverlayBaseline(baseline, period);
    return !!(normalizedBaseline && normalizedBaseline.periodKey === key);
  }
  function resolveOverlayBaseline(period, entry, summary, activeStartedAt) {
    var now = new Date();
    var currentKey = earningsMetrics ? earningsMetrics.periodKey(period, now) : null;
    var hasActiveCall = !!activeStartedAt && period !== "previousMonth";
    var callId = state.callId || currentCallId();
    if (hasActiveCall) {
      var storedCallBaseline = activeCallEarnings && activeCallEarnings.callId === callId &&
        activeCallEarnings.baselines && activeCallEarnings.baselines[period];
      if (overlayBaselineMatchesPeriod(storedCallBaseline, period, currentKey)) {
        return normalizeOverlayBaseline(storedCallBaseline, period);
      }
      var itemBaseline = entry && entry.callBaseline;
      if (itemBaseline && itemBaseline.callId === callId &&
          overlayBaselineMatchesPeriod(itemBaseline, period, currentKey)) {
        return normalizeOverlayBaseline(itemBaseline, period);
      }
    }
    var officialBaseline = overlayOfficialBaseline(entry, summary, period);
    if (officialBaseline && (!hasActiveCall || !currentKey || officialBaseline.periodKey === currentKey)) {
      return officialBaseline;
    }
    return overlayLocalBaseline(period);
  }
  function earningsNow(period) {
    period = /^(today|currentMonth|previousMonth|year)$/.test(String(period || "")) ? period : "today";
    var now = Date.now();
    var activeStartedAt = activeOverlayStartedAt();
    var activePeriod = period !== "previousMonth" && !!activeStartedAt;
    var liveSeconds = activePeriod && earningsMetrics
      ? earningsMetrics.elapsedSeconds(activeStartedAt, now)
      : activePeriod ? Math.max(0, (now - Date.parse(activeStartedAt)) / 1000) : 0;
    var livePeriodSeconds = activePeriod && earningsMetrics
      ? earningsMetrics.activeSecondsInPeriod(period, activeStartedAt, now)
      : activePeriod && overlayPeriodMatches(activeStartedAt, period) ? liveSeconds : 0;
    var modality = state.callModality || state.pendingCall && state.pendingCall.modality || "OPI";
    var rate = modality === "VRI" ? Number(config.vriRatePerMinute || 0.25) : Number(config.opiRatePerMinute || 0.20);
    var liveUsd = livePeriodSeconds / 60 * rate;
    var fallback = overlayLocalBaseline(period);

    if (period === "year") {
      var yearChart = platformMirror.earningsCharts && platformMirror.earningsCharts.year;
      var yearItems = Array.isArray(yearChart && yearChart.items) ? yearChart.items : [];
      var nowDate = new Date(now), currentMonthKey = nowDate.getFullYear() + "-" + String(nowDate.getMonth() + 1).padStart(2, "0");
      var monthEntry = platformMirror.earnings && platformMirror.earnings.currentMonth;
      var monthSummary = monthEntry && monthEntry.summary || {};
      var monthBaseline = resolveOverlayBaseline("currentMonth", monthEntry, monthSummary, activeStartedAt);
      var monthLiveSeconds = activePeriod && earningsMetrics
        ? earningsMetrics.activeSecondsInPeriod("currentMonth", activeStartedAt, now)
        : activePeriod && overlayPeriodMatches(activeStartedAt, "currentMonth") ? liveSeconds : 0;
      var monthLiveUsd = monthLiveSeconds / 60 * rate;
      var yearUsd = yearItems.reduce(function (sum, item) {
        var value = Number(item.earnedUsd) || 0;
        if (item.key === currentMonthKey && yearChart && yearChart.complete) {
          var monthBaseUsd = finiteMetric(monthBaseline && monthBaseline.earnedUsd);
          if (monthBaseUsd != null) value = monthBaseUsd;
          if (activePeriod) value += monthLiveUsd;
        }
        return sum + value;
      }, 0);
      var yearCalls = yearItems.reduce(function (sum, item) {
        var count = Number(item.callCount) || 0;
        if (item.key === currentMonthKey && yearChart && yearChart.complete && finiteMetric(monthBaseline && monthBaseline.callCount) != null) {
          count = Number(monthBaseline.callCount) + (activePeriod && overlayPeriodMatches(activeStartedAt, "currentMonth") ? 1 : 0);
        }
        return sum + count;
      }, 0);
      var yearMinutes = yearItems.reduce(function (sum, item) {
        var minutes = Number(item.minutes) || 0;
        if (item.key === currentMonthKey && yearChart && yearChart.complete && finiteMetric(monthBaseline && monthBaseline.minutes) != null) {
          minutes = Number(monthBaseline.minutes) + monthLiveSeconds / 60;
        }
        return sum + minutes;
      }, 0);
      var yearBaseUsd = fallback.earnedUsd || 0;
      if (!(yearChart && yearChart.complete)) yearUsd = yearBaseUsd + liveUsd;
      if (!(yearChart && yearChart.complete)) {
        yearCalls = fallback.callCount + (activePeriod && overlayPeriodMatches(activeStartedAt, period) ? 1 : 0);
        yearMinutes = Number(fallback.minutes || 0) + livePeriodSeconds / 60;
      }
      return {
        period: period,
        calls: yearCalls,
        callsAuthoritative: !!(yearChart && yearChart.complete),
        modality: modality,
        liveSeconds: liveSeconds,
        liveUsd: liveUsd,
        periodMinutes: yearMinutes,
        totalUsd: yearChart && yearChart.complete ? yearUsd : yearBaseUsd + liveUsd,
        officialUsd: yearChart && yearChart.complete ? yearUsd : null,
        fx: Number(config.usdMxnRate || 0),
        fxDate: config.exchangeRateDate || null,
        hasOfficial: !!(yearChart && yearChart.complete),
        baselineSource: yearChart && yearChart.complete ? "platform-page-context" : "local-reconciled-state"
      };
    }

    var entry = period === "today"
      ? (platformMirror.earnings && platformMirror.earnings.today) || platformMirror.statistics
      : platformMirror.earnings && platformMirror.earnings[period];
    var official = entry && entry.summary || {};
    var baseline = resolveOverlayBaseline(period, entry, official, activeStartedAt);
    var baseUsd = finiteMetric(baseline && baseline.earnedUsd);
    if (baseUsd == null) baseUsd = finiteMetric(fallback.earnedUsd) || 0;
    var baseCalls = finiteMetric(baseline && baseline.callCount);
    if (baseCalls == null) baseCalls = Number(fallback.callCount || 0);
    var baseMinutes = finiteMetric(baseline && baseline.minutes);
    if (baseMinutes == null) baseMinutes = Number(fallback.minutes || 0);
    var activeStartsInPeriod = activePeriod && earningsMetrics
      ? earningsMetrics.callStartsInPeriod(period, activeStartedAt, now)
      : activePeriod && overlayPeriodMatches(activeStartedAt, period);
    var calls = baseCalls + (activeStartsInPeriod ? 1 : 0);
    var periodMinutes = baseMinutes + livePeriodSeconds / 60;
    var totalUsd = baseUsd + liveUsd;
    var hasOfficial = !!(baseline && baseline.authoritative && finiteMetric(baseline.earnedUsd) != null);
    return {
      period: period,
      calls: calls,
      callsAuthoritative: !!(hasOfficial && finiteMetric(baseline.callCount) != null),
      modality: modality,
      liveSeconds: liveSeconds,
      liveUsd: liveUsd,
      periodMinutes: periodMinutes,
      totalUsd: totalUsd,
      officialUsd: hasOfficial ? baseline.earnedUsd : null,
      fx: Number(config.usdMxnRate || 0),
      fxDate: config.exchangeRateDate || null,
      hasOfficial: hasOfficial,
      baselineSource: baseline && baseline.source || "local-reconciled-state"
    };
  }
  function requestOverlayEarnings(period) {
    period = /^(today|currentMonth|previousMonth)$/.test(String(period || "")) ? period : "today";
    if (overlaySyncPending[period]) return;
    overlaySyncPending[period] = true;
    try {
      chrome.runtime.sendMessage({ type: "EFFECTIF_EARNINGS_RANGE", period: period }, function (response) {
        overlaySyncPending[period] = false;
        if (!response || !response.ok) {
          emit("EARNINGS_OVERLAY_SYNC_ERROR", { period: period, error: String(response && response.error || "sin respuesta") }, "warn");
        }
        renderOverlay();
      });
    } catch (error) {
      overlaySyncPending[period] = false;
      emit("EARNINGS_OVERLAY_SYNC_ERROR", { period: period, error: String(error) }, "warn");
    }
  }
  function requestOverlayChart(period) {
    period = period === "year" ? "year" : "currentMonth";
    var key = "chart:" + period;
    if (overlaySyncPending[key]) return;
    overlaySyncPending[key] = true;
    try {
      chrome.runtime.sendMessage({ type: "EFFECTIF_EARNINGS_CHART", period: period }, function (response) {
        overlaySyncPending[key] = false;
        if (!response || !response.ok) {
          emit("EARNINGS_OVERLAY_CHART_SYNC_ERROR", { period: period, error: String(response && response.error || "sin respuesta") }, "warn");
        }
        renderOverlay();
      });
    } catch (error) {
      overlaySyncPending[key] = false;
      emit("EARNINGS_OVERLAY_CHART_SYNC_ERROR", { period: period, error: String(error) }, "warn");
    }
  }
  function callStatsForPeriod(period, info) {
    function inPeriod(value) {
      return overlayCallInPeriod({ startedAt: value }, period);
    }
    var completed = Array.isArray(state.completedCalls) ? state.completedCalls.filter(function (call) { return inPeriod(call.startedAt || call.endedAt); }).length : 0;
    var unfinished = Array.isArray(state.unfinishedCalls) ? state.unfinishedCalls.filter(function (call) { return inPeriod(call.startedAt || call.endedAt); }).length : 0;
    var missed = Array.isArray(state.missedCallRecords) ? state.missedCallRecords.filter(function (call) { return inPeriod(call.detectedAt || call.classifiedAt); }).length : 0;
    var activeStartedAt = activeOverlayStartedAt();
    var active = activeStartedAt && period !== "previousMonth" && earningsMetrics
      ? (earningsMetrics.callStartsInPeriod(period, activeStartedAt, Date.now()) ? 1 : 0)
      : activeStartedAt && period !== "previousMonth" && inPeriod(activeStartedAt) ? 1 : 0;
    var localTotal = completed + unfinished + missed + active;
    var officialOrReconciledTotal = info && finiteMetric(info.calls);
    var total = officialOrReconciledTotal == null ? localTotal : officialOrReconciledTotal;
    return { completed: completed, unfinished: unfinished, missed: missed, active: active, total: total, localTotal: localTotal };
  }
  function escapeXml(value) {
    return String(value == null ? "" : value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
  }
  function renderCurrentMonthChart(container) {
    var chart = platformMirror.earningsCharts && platformMirror.earningsCharts.currentMonth;
    var items = Array.isArray(chart && chart.items) ? chart.items.slice() : [];
    if (!chart || !chart.complete || !items.length) {
      container.innerHTML = '<div class="chart-empty">Histórico diario oficial: cargando…</div>';
      return;
    }
    var today = localDay();
    var todayInfo = earningsNow("today");
    var liveMinutes = todayInfo.liveSeconds / 60;
    var baselineToday = activeCallEarnings && activeCallEarnings.callId === state.callId && activeCallEarnings.baselines && activeCallEarnings.baselines.today;
    items = items.map(function (item) {
      if (item.key !== today) return item;
      var todayItem = Object.assign({}, item, { earnedUsd: todayInfo.totalUsd });
      if (state.callId && state.callStartedAt) todayItem.minutes = (baselineToday ? Number(baselineToday.minutes || 0) : Number(item.minutes || 0)) + liveMinutes;
      return todayItem;
    });
    var chartCurrency = overlayCurrency === "MXN" && config.usdMxnRate > 0 && config.exchangeRateDate === localDay() ? "MXN" : "USD";
    var chartFx = chartCurrency === "MXN" ? Number(config.usdMxnRate) : 1;
    var max = Math.max(0.0001, items.reduce(function (m, item) { return Math.max(m, (Number(item.earnedUsd) || 0) * chartFx); }, 0));
    var width = 250, height = 92, left = 8, top = 7, bottom = 18, plotH = height - top - bottom;
    var gap = 2, barWidth = Math.max(3, (width - left * 2 - gap * (items.length - 1)) / items.length);
    var bars = items.map(function (item, index) {
      var rawValue = Math.max(0, Number(item.earnedUsd) || 0), value = rawValue * chartFx, barH = value / max * plotH;
      var x = left + index * (barWidth + gap), y = top + plotH - barH;
      var title = item.key + " · " + money(value, chartCurrency, 4) + " · " + Number(item.minutes || 0).toFixed(1) + " min";
      return '<rect class="day-bar" x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + Math.max(1, barWidth).toFixed(2) + '" height="' + Math.max(0.5, barH).toFixed(2) + '" rx="1"><title>' + escapeXml(title) + '</title></rect>';
    }).join("");
    var points = items.map(function (item, index) {
      var value = Math.max(0, Number(item.earnedUsd) || 0) * chartFx, x = left + index * (barWidth + gap) + barWidth / 2, y = top + plotH - value / max * plotH;
      return x.toFixed(2) + "," + y.toFixed(2);
    }).join(" ");
    var labels = items.map(function (item, index) {
      var day = Number(item.label), show = day === 1 || day % 5 === 0 || index === items.length - 1;
      if (!show) return "";
      var x = left + index * (barWidth + gap) + barWidth / 2;
      return '<text x="' + x.toFixed(2) + '" y="88" text-anchor="middle">' + escapeXml(item.label) + '</text>';
    }).join("");
    container.innerHTML = '<div class="chart-title">Este mes · ingreso por día</div>' +
      '<svg class="chart-svg current-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Ingreso por día del mes actual">' +      '<line class="axis" x1="8" y1="78" x2="242" y2="78"></line>' + bars + '<polyline class="trend" points="' + points + '"></polyline>' + labels + '</svg>' +
      '<div class="chart-note">Barras = ingreso diario · línea = tendencia · Hoy incluye la llamada viva</div>';
  }
  function renderYearChart(container) {
    var chart = platformMirror.earningsCharts && platformMirror.earningsCharts.year;
    var items = Array.isArray(chart && chart.items) ? chart.items.slice() : [];
    if (!chart || !chart.complete || items.length !== 12) {
      container.innerHTML = '<div class="chart-empty">Histórico anual oficial: cargando…</div>';
      return;
    }
    var now = new Date(), currentMonthKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    var baselineMonth = activeCallEarnings && activeCallEarnings.callId === state.callId && activeCallEarnings.baselines && activeCallEarnings.baselines.currentMonth;
    items = items.map(function (item) {
      var next = Object.assign({}, item);
      if (item.key === currentMonthKey && state.callId && state.callStartedAt) {
        next.earnedUsd = Number(baselineMonth && baselineMonth.earnedUsd || 0) + earningsNow("currentMonth").liveUsd;
        next.minutes = Number(baselineMonth && baselineMonth.minutes || item.minutes || 0) + earningsNow("currentMonth").liveSeconds / 60;
      }
      return next;
    });
    var currency = overlayCurrency === "MXN" && config.usdMxnRate > 0 && config.exchangeRateDate === localDay() ? "MXN" : "USD";
    var fx = currency === "MXN" ? Number(config.usdMxnRate) : 1;
    var maxMoney = Math.max(0.0001, items.reduce(function (m, item) { return Math.max(m, (Number(item.earnedUsd) || 0) * fx); }, 0));
    var maxMinutes = Math.max(0.0001, items.reduce(function (m, item) { return Math.max(m, Number(item.minutes) || 0); }, 0));
    var width = 250, height = 112, left = 16, right = 6, incomeTop = 8, rowH = 40, minuteTop = 62;
    var groupW = (width - left - right) / 12, barW = Math.max(4, groupW * 0.3);
    var incomeBars = items.map(function (item, index) {
      var moneyValue = (Number(item.earnedUsd) || 0) * fx, h = moneyValue / maxMoney * rowH, x = left + index * groupW + groupW * 0.17, y = incomeTop + rowH - h;
      return '<rect class="income-bar" x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + barW.toFixed(2) + '" height="' + Math.max(0.5, h).toFixed(2) + '" rx="1"><title>' + escapeXml(item.label + " · " + money(moneyValue, currency, 2)) + '</title></rect>';
    }).join("");
    var minuteBars = items.map(function (item, index) {
      var minutes = Number(item.minutes) || 0, h = minutes / maxMinutes * rowH, x = left + index * groupW + groupW * 0.53, y = minuteTop + rowH - h;
      return '<rect class="minute-bar" x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + barW.toFixed(2) + '" height="' + Math.max(0.5, h).toFixed(2) + '" rx="1"><title>' + escapeXml(item.label + " · " + minutes.toFixed(1) + " min") + '</title></rect>';
    }).join("");
    var labels = items.map(function (item, index) { var x = left + index * groupW + groupW / 2; return '<text x="' + x.toFixed(2) + '" y="109" text-anchor="middle">' + escapeXml(item.label) + '</text>'; }).join("");
    container.innerHTML = '<div class="chart-title">' + now.getFullYear() + ' · ingreso y minutos</div>' +
      '<div class="chart-legend"><span><i class="income-key"></i>' + escapeXml(currency) + '</span><span><i class="minute-key"></i>minutos</span></div>' +
      '<svg class="chart-svg year-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Ingresos y minutos trabajados por mes">' +
      '<line class="axis" x1="16" y1="48" x2="244" y2="48"></line><line class="axis" x1="16" y1="102" x2="244" y2="102"></line>' + incomeBars + minuteBars + labels + '</svg>' +
      '<div class="chart-note">Barras dobles por mes · escalas independientes para dinero y minutos</div>';
  }
  function renderOverlayChart(container) {
    if (overlayPeriod === "currentMonth") renderCurrentMonthChart(container);
    else if (overlayPeriod === "year") renderYearChart(container);
    else container.innerHTML = overlayPeriod === "previousMonth" ? '<div class="chart-empty">Mes pasado: total oficial del rango cerrado · 1.º al último día del mes.</div>' : '';
  }
  function requestOverlayExchangeRate(reason) {
    var today = localDay();
    if (overlayFxRefreshRequestedDate === today || overlaySyncPending.fx) return;
    overlayFxRefreshRequestedDate = today;
    overlaySyncPending.fx = true;
    try {
      chrome.runtime.sendMessage({ type: "EFFECTIF_REFRESH_EXCHANGE_RATE", reason: reason || "overlay" }, function (response) {
        overlaySyncPending.fx = false;
        if (!response || !response.ok) {
          emit("EARNINGS_OVERLAY_FX_SYNC_ERROR", { error: String(response && response.error || "sin respuesta"), reason: reason || "overlay" }, "warn");
        }
        renderOverlay();
      });
    } catch (error) {
      overlaySyncPending.fx = false;
      emit("EARNINGS_OVERLAY_FX_SYNC_ERROR", { error: String(error), reason: reason || "overlay" }, "warn");
    }
  }
  function reconcileOverlayDateRollover() {
    var today = localDay();
    var month = today.slice(0, 7);
    if (overlayLastLocalDay === null) {
      overlayLastLocalDay = today;
      overlayLastLocalMonth = month;
      if (config.exchangeRateDate !== today) requestOverlayExchangeRate("overlay-start-stale-fx");
      return;
    }
    if (today === overlayLastLocalDay) {
      if (config.exchangeRateDate !== today) requestOverlayExchangeRate("overlay-stale-fx");
      return;
    }
    var monthChanged = overlayLastLocalMonth !== month;
    overlayLastLocalDay = today;
    overlayLastLocalMonth = month;
    overlayFxRefreshRequestedDate = null;
    requestOverlayExchangeRate("local-date-rollover");
    requestOverlayEarnings("today");
    if (overlayPeriod === "currentMonth") requestOverlayEarnings("currentMonth");
    else if (overlayPeriod === "previousMonth") requestOverlayEarnings("previousMonth");
    else if (overlayPeriod === "year") requestOverlayChart("year");
    if (monthChanged && overlayPeriod === "currentMonth") requestOverlayChart("currentMonth");
    emit("EARNINGS_OVERLAY_DATE_ROLLOVER", { localDay: today, monthChanged: monthChanged, callId: overlayLifecycleCallId });
  }
  function stopOverlay(reason) {
    if (overlayTimer) clearInterval(overlayTimer);
    overlayTimer = null;
    if (overlayHost) overlayHost.remove();
    overlayHost = null;
    overlayRoot = null;
    if (reason === "rating-stars" && overlayLifecycleCallId && !overlayRatingStopEmitted) {
      overlayRatingStopEmitted = true;
      emit("EARNINGS_OVERLAY_STOPPED", { callId: overlayLifecycleCallId, reason: "rating-stars-visible" });
    }
    overlayLifecycleActive = false;
    overlayLifecycleCallId = null;
    overlayRatingStopEmitted = false;
  }
  function isRatingRoute() {
    return /^\/call\/[^/?#]+\/rate\/?$/.test(location.pathname);
  }
  function ratingStarsVisible() {
    if (!isRatingRoute()) return false;
    var nodes = Array.from(document.querySelectorAll("button,[role='button'],[aria-label],[title],[class]")).filter(visibleElement).slice(0, 400);
    var namedStars = nodes.filter(function (element) {
      var label = normalized(
        (element.getAttribute && element.getAttribute("aria-label") || "") + " " +
        (element.getAttribute && element.getAttribute("title") || "") + " " +
        (element.getAttribute && element.getAttribute("class") || "")
      );
      var text = normalized(element.textContent || "");
      return /(?:^|\\s)(?:[1-5]\\s*stars?|stars?\\s*[1-5])(?:\\s|$)/i.test(label) ||
        /rating|star/i.test(label) && /[1-5]|rate/i.test(label + " " + text) ||
        /(?:rate|rating).*(?:1|2|3|4|5)/i.test(text);
    });
    if (namedStars.length >= 2) return true;
    var starLike = nodes.filter(function (element) {
      var label = normalized((element.getAttribute && element.getAttribute("aria-label") || "") + " " + (element.getAttribute && element.getAttribute("title") || ""));
      var cls = String(element.getAttribute && element.getAttribute("class") || "");
      return /star|rating/i.test(label + " " + cls);
    });
    return starLike.length >= 3;
  }
  function requestMainMicrophoneProbe(reason) {
    return new Promise(function(resolve){
      var requestId=crypto.randomUUID(),settled=false,timeout=null;
      function cleanup(){if(timeout)clearTimeout(timeout);window.removeEventListener(micMainAckEvent,onAck,true);}
      function finish(result){if(settled)return;settled=true;cleanup();resolve(result);}
      function onAck(event){var ack=null;try{ack=JSON.parse(String(event&&event.detail||""));}catch(_){}if(!ack||ack.requestId!==requestId)return;finish(ack);}
      window.addEventListener(micMainAckEvent,onAck,true);
      try{document.dispatchEvent(new CustomEvent(micMainCommandEvent,{detail:JSON.stringify({schema:"signal-main-mic-command/v1",op:"probe",requestId:requestId,reason:reason||"background-probe"})}));}
      catch(error){finish({ok:false,muted:false,verified:false,error:String(error)});return;}
      timeout=setTimeout(function(){finish({ok:false,muted:false,verified:false,error:"MAIN microphone guard probe timed out."});},1200);
    });
  }
  function requestMainMicrophoneMute(muted, reason) {
    return new Promise(function(resolve){
      var requestId=crypto.randomUUID(),settled=false,timeout=null;
      function cleanup(){if(timeout)clearTimeout(timeout);window.removeEventListener(micMainAckEvent,onAck,true);}
      function finish(result){if(settled)return;settled=true;cleanup();resolve(result);}
      function onAck(event){var ack=null;try{ack=JSON.parse(String(event&&event.detail||""));}catch(_){}if(!ack||ack.requestId!==requestId)return;finish(ack);}
      window.addEventListener(micMainAckEvent,onAck,true);
      try{document.dispatchEvent(new CustomEvent(micMainCommandEvent,{detail:JSON.stringify({schema:"signal-main-mic-command/v1",op:"set",requestId:requestId,muted:!!muted,reason:reason||"background"})}));}
      catch(error){finish({ok:false,muted:!!muted,verified:false,error:String(error)});return;}
      timeout=setTimeout(function(){finish({ok:false,muted:!!muted,verified:false,error:"MAIN microphone guard did not acknowledge the request."});},900);
    });
  }

  function activateOverlayForCall(callId, reason) {
    if (!callId) return;
    overlayLifecycleActive = true;
    overlayLifecycleCallId = callId;
    overlayRatingStopEmitted = false;
    overlayPeriod = "today";
    overlayCurrency = /^(MXN|USD)$/.test(String(config.earningsDisplayCurrency || "")) ? config.earningsDisplayCurrency : "MXN";
    emit("EARNINGS_OVERLAY_STARTED", { callId: callId, reason: reason || "call-start" });
    renderOverlay();
  }
  function ensureOverlay() {
    if (!config.overlayEnabled || !document.documentElement || !overlayLifecycleActive) {
      if (!overlayLifecycleActive) stopOverlay();
      return;
    }
    if (overlayHost && overlayHost.isConnected) return;
    overlayHost = document.createElement("div");
    overlayHost.id = "signal-interpreter-earnings-overlay";
    overlayHost.style.cssText = "all:initial;position:fixed;z-index:2147483647;top:12px;right:12px;pointer-events:auto";
    overlayRoot = overlayHost.attachShadow({ mode: "closed" });
    overlayRoot.innerHTML = '<style>:host{all:initial}.card{width:296px;max-width:calc(100vw - 24px);box-sizing:border-box;padding:10px 12px;border:1px solid rgba(111,211,255,.28);border-radius:13px;background:rgba(5,18,34,.92);box-shadow:0 8px 30px rgba(0,0,0,.24);backdrop-filter:blur(12px);color:#dff7ff;font:12px/1.25 Arial,sans-serif;user-select:none}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand{color:#75d9ff;font-size:9px;font-weight:700;letter-spacing:.14em}.actions,.periods,.currencies{display:flex;gap:4px}.toolbar{display:flex;gap:4px;margin-top:8px}.toolbar button{flex:1}.currencies{margin-top:4px}.currencies button{flex:1}button{border:0;border-radius:6px;background:rgba(255,255,255,.08);color:#9db2c6;min-width:0;height:23px;padding:0 7px;font:700 9px/1 Arial,sans-serif;cursor:pointer}.mic-toggle{min-width:54px}.mic-toggle.muted{background:rgba(225,87,115,.18);color:#ffd8df}.mic-toggle.live{background:rgba(121,228,166,.14);color:#bff5d5}button:hover{background:rgba(255,255,255,.16);color:white}button.active{background:rgba(111,211,255,.2);color:#dff7ff;box-shadow:inset 0 0 0 1px rgba(111,211,255,.35)}.top .actions button{width:22px;padding:0}.top .actions .mic-toggle{width:54px;min-width:54px}.amount{margin-top:7px;color:white;font-size:22px;font-weight:750;font-variant-numeric:tabular-nums}.detail{display:flex;justify-content:space-between;gap:8px;margin-top:5px;color:#8fa6bb;font-size:10px}.live{color:#79e4a6;font-variant-numeric:tabular-nums}.fx{margin-top:6px;color:#647f98;font-size:9px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:8px}.stat{min-width:0;padding:5px 4px;border-radius:7px;background:rgba(255,255,255,.045);text-align:center}.stat b{display:block;color:#fff;font-size:13px;font-variant-numeric:tabular-nums}.stat span{display:block;margin-top:2px;color:#6f879e;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chart-block{margin-top:8px;padding-top:7px;border-top:1px solid rgba(111,211,255,.12)}.chart-title{color:#a9c2d6;font-size:9px;font-weight:700;margin-bottom:3px}.chart-svg{width:100%;height:auto;display:block}.chart-svg text{fill:#6f879e;font-size:7px;font-family:Arial,sans-serif}.axis{stroke:rgba(159,190,214,.18);stroke-width:1}.day-bar{fill:#4db6df;opacity:.42}.trend{fill:none;stroke:#8de8ff;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.income-bar{fill:#7fd7ff;opacity:.72}.minute-bar{fill:#79e4a6;opacity:.68}.chart-empty{padding:10px 4px;color:#718ba3;font-size:9px}.chart-note{margin-top:3px;color:#5c7389;font-size:8px}.chart-legend{display:flex;gap:10px;margin:2px 0 4px;color:#7892a8;font-size:8px}.chart-legend i{display:inline-block;width:7px;height:7px;border-radius:2px;margin-right:3px;vertical-align:-1px}.income-key{background:#7fd7ff}.minute-key{background:#79e4a6}.compact .detail,.compact .fx,.compact .stats,.compact .chart-block{display:none}.compact{width:236px;padding:8px 10px}.compact .amount{font-size:18px;margin-top:5px}</style><section class="card" aria-live="polite"><div class="top"><span class="brand">SIGNAL INTERPRETER · INGRESO</span><span class="actions"><button id="mic" class="mic-toggle" type="button" title="Micrófono de Signal Interpreter">MIC ON</button><button id="compact" title="Compactar o ampliar">↕</button><button id="close" title="Ocultar overlay">×</button></span></div><div class="toolbar periods"><button data-period="today">Hoy</button><button data-period="currentMonth">Este mes</button><button data-period="previousMonth">Mes pasado</button><button data-period="year">Año</button></div><div class="currencies"><button data-currency="MXN">MXN</button><button data-currency="USD">USD</button></div><div class="amount" id="amount">MX$—</div><div class="detail"><span id="summary">Hoy · Sin llamada</span><span class="live" id="live">+MX$0.0000</span></div><div class="stats"><div class="stat"><b id="completed">0</b><span>Completadas</span></div><div class="stat"><b id="unfinished">0</b><span>No terminadas</span></div><div class="stat"><b id="missed">0</b><span>Perdidas</span></div><div class="stat"><b id="totalCalls">0</b><span>Total</span></div></div><div class="chart-block" id="chart"></div><div class="fx" id="fx">Actualizando tasa de hoy…</div></section>';
    document.documentElement.appendChild(overlayHost);
    integrity.extensionDomWrites += 1;
    overlayRoot.getElementById("mic").addEventListener("click", function () {
      chrome.runtime.sendMessage({ type: "SIGNAL_EXTENSION_MICROPHONE_TOGGLE", source: "overlay-button" }, function (response) {
        if (!response || !response.ok || response.verified !== true) {
          emit("EXTENSION_MICROPHONE_UI_ERROR", { source: "overlay-button", error: String(response && response.error || "No se pudo verificar el micrófono.") }, "error");
          return;
        }
        renderOverlay();
      });
    });
    overlayRoot.getElementById("close").addEventListener("click", function () {
      chrome.storage.local.get(["effectifConfig"], function (stored) {
        chrome.storage.local.set({ effectifConfig: Object.assign({}, stored.effectifConfig || {}, { overlayEnabled: false }) });
      });
    });
    overlayRoot.getElementById("compact").addEventListener("click", function () {
      chrome.storage.local.get(["effectifConfig"], function (stored) {
        var current = Object.assign({}, config, stored.effectifConfig || {});
        current.overlayCompact = !current.overlayCompact;
        chrome.storage.local.set({ effectifConfig: current });
      });
    });
    overlayRoot.querySelectorAll("[data-period]").forEach(function (button) {
      button.addEventListener("click", function () {
        overlayPeriod = button.getAttribute("data-period") || "today";
        emit("EARNINGS_OVERLAY_PERIOD_SELECTED", { period: overlayPeriod, callId: overlayLifecycleCallId });
        renderOverlay();
        if (overlayPeriod === "currentMonth") {
          requestOverlayEarnings("currentMonth");
          requestOverlayChart("currentMonth");
        } else if (overlayPeriod === "year") {
          requestOverlayChart("year");
        } else {
          requestOverlayEarnings(overlayPeriod);
        }
      });
    });
    overlayRoot.querySelectorAll("[data-currency]").forEach(function (button) {
      button.addEventListener("click", function () {
        overlayCurrency = /^(MXN|USD)$/.test(button.getAttribute("data-currency") || "") ? button.getAttribute("data-currency") : "MXN";
        config.earningsDisplayCurrency = overlayCurrency;
        chrome.storage.local.set({ effectifConfig: config });
        emit("EARNINGS_OVERLAY_CURRENCY_SELECTED", { currency: overlayCurrency, callId: overlayLifecycleCallId });
        renderOverlay();
      });
    });
    overlayTimer = setInterval(renderOverlay, 100);
  }
  function renderOverlay() {
    var routeCallId = currentCallId();
    if (!routeCallId) {
      if (overlayLifecycleActive) stopOverlay(isRatingRoute() ? "rating-route" : "route-not-call");
      return;
    }
    if (!overlayLifecycleActive || overlayLifecycleCallId !== routeCallId) {
      activateOverlayForCall(routeCallId, "call-detected");
    }
    reconcileOverlayDateRollover();
    if (ratingStarsVisible()) {
      stopOverlay("rating-stars");
      return;
    }
    ensureOverlay();
    if (!overlayRoot) return;
    var info = earningsNow(overlayPeriod);
    var fxFresh = info.fx > 0 && info.fxDate === localDay();
    var currency = overlayCurrency === "USD" ? "USD" : "MXN";
    var convertedTotal = currency === "MXN" ? (fxFresh ? info.totalUsd * info.fx : null) : info.totalUsd;
    var convertedLive = currency === "MXN" ? (fxFresh ? info.liveUsd * info.fx : null) : info.liveUsd;
    var totalText = convertedTotal == null ? "MX$—" : money(convertedTotal, "MXN", 4);
    var liveText = convertedLive == null ? "+MX$—" : "+" + money(convertedLive, currency, 4);
    if (currency === "USD") totalText = money(info.totalUsd, "USD", 4);
    if (overlayPeriod === "previousMonth") liveText = "Sin llamada";
    var periodLabel = overlayPeriod === "today" ? "Hoy" : overlayPeriod === "currentMonth" ? "Este mes" : overlayPeriod === "previousMonth" ? "Mes pasado" : "Año";
    var callStats = callStatsForPeriod(overlayPeriod, info);
    var expandedHistorical = overlayPeriod !== "today";
    overlayRoot.querySelector(".card").classList.toggle("compact", !!config.overlayCompact && !expandedHistorical);
    overlayRoot.querySelectorAll("[data-period]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-period") === overlayPeriod);
    });
    overlayRoot.querySelectorAll("[data-currency]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-currency") === currency);
    });
    var micButton = overlayRoot.getElementById("mic");
    if (micButton) {
      var activeCapture = !!(state.groqCapture && state.groqCapture.status === "connected");
      var actualMuted = !!state.microphoneMuted || !!state.microphoneOutputMuted || (activeCapture && !!state.groqCapture.microphoneMuted);
      var muteStatus = String(state.microphoneMuteStatus || "");
      var outputStatus = String(state.microphoneOutputStatus || "");
      var muteError = outputStatus === "error" || (activeCapture && muteStatus === "error");
      micButton.textContent = muteError ? "MIC ERR" : (actualMuted ? "MIC OFF" : "MIC ON");
      micButton.classList.toggle("muted", actualMuted && !muteError);
      micButton.classList.toggle("live", !actualMuted && !muteError && muteStatus === "applied");
      micButton.setAttribute("aria-pressed", actualMuted ? "true" : "false");
      micButton.title = muteError
        ? "Error: no se pudo verificar el mute del micrófono de Signal Interpreter · pulsa Ctrl+Shift+. para reintentar"
        : actualMuted
          ? "Micrófono de Signal Interpreter desactivado · Ctrl+Shift+. para activar"
          : "Micrófono de Signal Interpreter activo · Ctrl+Shift+. para silenciar";
    }
    overlayRoot.getElementById("amount").textContent = totalText;
    overlayRoot.getElementById("live").textContent = state.callStartedAt && overlayPeriod !== "previousMonth"
      ? "En llamada " + liveText
      : liveText;
    var activeStartedAt = activeOverlayStartedAt();
    var activeLiveLabel = activeStartedAt && overlayPeriod !== "previousMonth"
      ? " · en curso " + (info.liveSeconds / 60).toFixed(2) + " min"
      : "";
    overlayRoot.getElementById("summary").textContent = periodLabel + " · " + callStats.total + " llamadas · " +
      (Number.isFinite(info.periodMinutes) ? info.periodMinutes.toFixed(2) + " min del periodo" : "minutos sin confirmar") +
      activeLiveLabel;
    overlayRoot.getElementById("completed").textContent = String(callStats.completed);
    overlayRoot.getElementById("unfinished").textContent = String(callStats.unfinished);
    overlayRoot.getElementById("missed").textContent = String(callStats.missed);
    overlayRoot.getElementById("totalCalls").textContent = String(callStats.total);
    renderOverlayChart(overlayRoot.getElementById("chart"));
    overlayRoot.getElementById("fx").textContent = fxFresh
      ? "USD/MXN " + info.fx.toFixed(4) + " · tasa de hoy " + info.fxDate
      : "Tasa USD/MXN de hoy no confirmada todavía";
  }
  function installNavigationObservers() {
    if (navigationListenersInstalled) return;
    navigationListenersInstalled = true;
    window.addEventListener("popstate", function () {
      trackRoute("popstate");
      observePlatformUrl("popstate");
      emitAutoAnswerReadiness("popstate");
    });
    window.addEventListener("hashchange", function () {
      trackRoute("hashchange");
      observePlatformUrl("hashchange");
      emitAutoAnswerReadiness("hashchange");
    });
    window.addEventListener("pageshow", function () {
      if (isTarget() && (config.autoAnswerEnabled || config.observationEnabled) && !observer) start();
      observePlatformUrl("pageshow");
      emitAutoAnswerReadiness("pageshow");
    });
    if (window.navigation && window.navigation.addEventListener) {
      window.navigation.addEventListener("navigate", function () {
        setTimeout(function () {
          trackRoute("navigation");
          observePlatformUrl("navigation");
        }, 0);
      });
    }
  }

  function start() {
    if (observer || !isTarget() || (!config.autoAnswerEnabled && !config.observationEnabled)) return;
    if (!document.documentElement) {
      document.addEventListener("DOMContentLoaded", start, { once: true });
      return;
    }
    observer = new MutationObserver(function (records) {
      mutationAggregate.batches += 1;
      records.forEach(function (record) {
        if (record.type === "childList") { mutationAggregate.addedNodes += record.addedNodes.length; mutationAggregate.removedNodes += record.removedNodes.length; }
        else if (record.type === "attributes") mutationAggregate.attributes += 1;
        else if (record.type === "characterData") mutationAggregate.textChanges += 1;
      });
      trackRoute("mutation");
      detectAvailability();
      syncPageFavicon();
      autoAnswer();
      mediaSnapshot("mutation");
      mapScreen("mutation");
      schedulePlatformMirror("mutation");
      if (currentCallId()) renderOverlay();
    });
    observer.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden", "aria-modal", "aria-label", "disabled"]
    });
    startRichTelemetry();
    lastObservedHref = location.href;
    observePlatformUrl("start");
    installNavigationObservers();
    if (navigationProbeTimer) clearInterval(navigationProbeTimer);
    navigationProbeTimer = setInterval(function () { observePlatformUrl("interval"); }, 1000);
    emit("PLATFORM_SESSION_STARTED", { title: safe(document.title), userAgent: navigator.userAgent, language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    emit("OBSERVER_STARTED", { autoAnswerEnabled: config.autoAnswerEnabled });
    emitIntegrity("startup");
    trackRoute("start");
    detectAvailability();
    syncPageFavicon();
    autoAnswer();
    mapScreen("start");
    schedulePlatformMirror("start");
    renderOverlay();
  }
  function deactivateForHotload(reason) {
    var stopReason = reason || "hotload-replace";
    try { window[SIGNAL_RUNTIME_MARKER] = { extensionId: chrome.runtime.id, version: RUNTIME_VERSION, active: false, stoppedAt: iso(), reason: stopReason }; } catch (_) {}
    if (answerWatchdog) { clearTimeout(answerWatchdog); answerWatchdog = null; }
    if (ratingConfirmationTimer) { clearTimeout(ratingConfirmationTimer); ratingConfirmationTimer = null; }
    if (mirrorTimer) { clearTimeout(mirrorTimer); mirrorTimer = null; }
    if (mediaTimer) { clearInterval(mediaTimer); mediaTimer = null; }
    if (integrityTimer) { clearInterval(integrityTimer); integrityTimer = null; }
    stopOverlay(stopReason);
    stop(stopReason);
  }

  function stop(reason) {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (platformSurfaceTimer) { clearTimeout(platformSurfaceTimer); platformSurfaceTimer = null; }
    if (navigationProbeTimer) { clearInterval(navigationProbeTimer); navigationProbeTimer = null; }
    if (telemetryTimer) { clearInterval(telemetryTimer); telemetryTimer = null; }
    emit("OBSERVER_STOPPED", { reason: reason || "config" });
  }
  function apply(next) {
    config = Object.assign({}, config, next || {});
    if (isTarget() && (config.autoAnswerEnabled || config.observationEnabled)) start();
    else stop("disabled-or-host-mismatch");
    detectAvailability();
    syncPageFavicon();
    autoAnswer();
    renderOverlay();
    if (!isTarget() || !config.autoAnswerEnabled || currentCallId()) { if (answerWatchdog) { clearTimeout(answerWatchdog); answerWatchdog = null; } }
    syncPageFavicon();
    emitAutoAnswerReadiness("config");
    if (telemetryStarted && telemetryTimer) {
      clearInterval(telemetryTimer);
      telemetryTimer = setInterval(function () { performanceSnapshot("heartbeat"); }, Math.max(10, Number(config.telemetryHeartbeatSeconds || 30)) * 1000);
    }
  }


  chrome.storage.local.get(["effectifConfig", "effectifState", "effectifPlatformMirror", "effectifCallEarnings"], function (stored) {
    state = stored.effectifState || {}; platformMirror = stored.effectifPlatformMirror || {};
    activeCallEarnings = stored.effectifCallEarnings || {};
    apply(stored.effectifConfig);
  });
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== "local") return;
    if (changes.effectifState) { state = changes.effectifState.newValue || {}; renderOverlay(); }
    if (changes.effectifPlatformMirror) { platformMirror = changes.effectifPlatformMirror.newValue || {}; renderOverlay(); }
    if (changes.effectifCallEarnings) { activeCallEarnings = changes.effectifCallEarnings.newValue || {}; renderOverlay(); }
    if (changes.effectifConfig) apply(changes.effectifConfig.newValue);
  });
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
     if (message && message.type === "EFFECTIF_SCREENSHOT_PREPARE") {
       if (overlayHost && overlayHost.isConnected) {
         screenshotOverlayPreviousVisibility=overlayHost.style.visibility;
         overlayHost.style.visibility="hidden";
       }
       if (sendResponse) sendResponse({ok:true,hidden:!!(overlayHost&&overlayHost.isConnected)});
       return true;
     }
     if (message && message.type === "EFFECTIF_SCREENSHOT_RESTORE") {
       if (overlayHost && overlayHost.isConnected) overlayHost.style.visibility=screenshotOverlayPreviousVisibility===null?"":screenshotOverlayPreviousVisibility;
       screenshotOverlayPreviousVisibility=null;
       if (sendResponse) sendResponse({ok:true});
       return true;
     }
    if (message && message.type === "EFFECTIF_HOTLOAD_REPLACE") {
      deactivateForHotload(message.reason || "hotload-replace");
      if (sendResponse) sendResponse({ ok: true, reason: "deactivated-for-hotload" });
      return true;
    }
    if (message && message.type === "SIGNAL_MAIN_MICROPHONE_SET") {
      requestMainMicrophoneMute(!!message.muted,message.source||message.reason||"background").then(function(result){if(sendResponse)sendResponse(result);}).catch(function(error){if(sendResponse)sendResponse({ok:false,muted:!!message.muted,verified:false,error:String(error)});});
      return true;
    }
    if (message && message.type === "SIGNAL_MAIN_MICROPHONE_PROBE") {
      requestMainMicrophoneProbe(message.source||message.reason||"background-probe").then(function(result){if(sendResponse)sendResponse(result);}).catch(function(error){if(sendResponse)sendResponse({ok:false,muted:false,verified:false,error:String(error)});});
      return true;
    }
    if (message && message.type === "EFFECTIF_REQUEST_PLATFORM_SNAPSHOT") {
      capturePlatformMirror("popup-sync", true);
      portalStructureSnapshot("popup-sync", true);
      return false;
    }
    if (message && message.type === "EFFECTIF_PLATFORM_SCREENSHOT_PRIVACY_MASK") {
      var maskId = "__SIGNAL_INTERPRETER_SCREENSHOT_PRIVACY_MASK__";
      var mask = document.getElementById(maskId);
      var enabled = !!message.enabled;
      if (enabled) {
        if (mask) mask.remove();
        mask = document.createElement("div");
        mask.id = maskId;
        mask.setAttribute("aria-hidden", "true");
        mask.style.cssText = "position:fixed;z-index:2147483646;left:0;right:0;top:92px;bottom:124px;background:#111;pointer-events:none;";
        (document.documentElement || document.body).appendChild(mask);
      } else if (mask) {
        mask.remove();
      }
      var applied = !!document.getElementById(maskId);
      if (sendResponse) sendResponse({ ok: true, enabled: applied, requested: enabled });
      return true;
    }
    if (message && message.type === "EFFECTIF_REFRESH_OVERLAY") {
      if (message.callId && currentCallId() === message.callId) {
        emit("EARNINGS_OVERLAY_REFRESHED", { callId: message.callId, reason: message.reason || "background-request" });
        requestOverlayExchangeRate("call-answered");
        requestOverlayEarnings("today");
        requestOverlayEarnings("currentMonth");
        requestOverlayChart("currentMonth");
        if (overlayPeriod === "previousMonth") requestOverlayEarnings("previousMonth");
        if (overlayPeriod === "year") requestOverlayChart("year");
        reconcileOverlayDateRollover();
        renderOverlay();
        if (sendResponse) sendResponse({ ok: true, callId: message.callId });
        return true;
      }
      if (sendResponse) sendResponse({ ok: false, error: "La pestaña ya no está en la llamada indicada" });
      return true;
    }
    return false;
  });
  document.addEventListener("click", function (event) {
    var button = event.target && event.target.closest ? event.target.closest("button") : null;
    if (button && /^End call$/i.test(normalized(button.getAttribute("aria-label") || button.textContent))) {
      var callId = currentCallId();
      var platformSeconds = parsePlatformSeconds();
      lastCallEndMeasurement = {
        callId: callId,
        clickedAt: iso(),
        platformSeconds: Number.isFinite(platformSeconds) ? platformSeconds : null
      };
      emit("CALL_END_CLICKED", {
        callId: callId,
        platformSeconds: Number.isFinite(platformSeconds) ? platformSeconds : null,
        signal: "platform-end-call"
      });
    }
  }, true);
  scheduleReadinessHeartbeat();
  emitAutoAnswerReadiness("initial-route");
  installNavigationObservers();
  window.addEventListener("pagehide", function () {
    if (readinessTimer) { clearInterval(readinessTimer); readinessTimer = null; }
    var activeCallId = currentCallId();
    if (activeCallId) {
      emit("CALL_ROUTE_ENDED", {
        callId: activeCallId, platformSeconds: null, reason: "pagehide", endSignal: "pagehide-fallback"
      });
    }
    emitIntegrity("pagehide");
    emit("PLATFORM_SESSION_ENDED", { reason: "pagehide" });
    if (mediaTimer) clearInterval(mediaTimer);
    if (integrityTimer) clearInterval(integrityTimer);
    stopOverlay();
    if (telemetryTimer) clearInterval(telemetryTimer);
    performanceSnapshot("pagehide");
    stop("pagehide");
  });
})();