(function () {
  "use strict";
  if (window.__SIGNAL_INTERPRETER_CLOUD_V090__) return;
  window.__SIGNAL_INTERPRETER_CLOUD_V090__ = true;

  var DIALOG = 'div[role="dialog"][aria-modal="true"]';
  var CONNECT = 'button[aria-label="Connect"]';
  var config = {
    targetHost: "app.cloudinterpreter.com",
    autoAnswerEnabled: true,
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
    usdMxnRate: null
  };
  var state = {};
  var platformMirror = {};
  var overlayHost = null;
  var overlayRoot = null;
  var overlayTimer = null;
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
  var lastMediaSignature = "";
  var lastMediaAt = 0;
  var lastScreenSignature = "";
  var lastMirrorSignature = "";
  var lastPortalStructureSignature = "";
  var lastCallEndMeasurement = null;
  var mirrorTimer = null;
  var mediaTimer = null;
  var integrityTimer = null;
  var integrity = {
    extensionDomWrites: 0,
    extensionMediaApiCalls: 0,
    extensionTrackMutations: 0,
    permittedConnectClicks: 0,
    forbiddenPlatformActions: 0
  };


  function iso() { return new Date().toISOString(); }
  function normalized(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
  function safe(value) {
    return normalized(value)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
      .replace(/\b\d{7,}\b/g, "[NUMBER]")
      .slice(0, 1000);
  }
  function mirrorText(value, limit) { return safe(normalized(value)).slice(0, limit || 500); }
  function extractPortalStructure() {
    function labelOf(element) {
      return safe(element.getAttribute && (element.getAttribute("aria-label") || element.getAttribute("title") || "") || element.textContent || "").slice(0, 120);
    }
    var buttons = Array.from(document.querySelectorAll("button,[role='button']")).filter(visibleElement).slice(0, 160).map(function (element) {
      return {tag: String(element.tagName || "").toLowerCase(), role: safe(element.getAttribute && element.getAttribute("role") || ""), label: labelOf(element), disabled: !!element.disabled};
    }).filter(function (x) { return x.label || x.role; });
    var links = Array.from(document.querySelectorAll("a[href]")).filter(visibleElement).slice(0, 120).map(function (element) {
      var href = "";
      try { var u = new URL(element.getAttribute("href"), location.href); href = u.origin === location.origin ? u.pathname : u.origin; } catch (_) {}
      return {label: labelOf(element), path: href};
    }).filter(function (x) { return x.label || x.path; });
    var fields = Array.from(document.querySelectorAll("input,select,textarea")).filter(visibleElement).slice(0, 80).map(function (element) {
      return {tag: String(element.tagName || "").toLowerCase(), type: safe(element.getAttribute("type") || ""), name: safe(element.getAttribute("name") || ""), aria: safe(element.getAttribute("aria-label") || element.getAttribute("placeholder") || "")};
    });
    var headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,[role='heading']")).filter(visibleElement).slice(0, 80).map(function (element) {
      return safe(element.textContent).slice(0, 160);
    }).filter(Boolean);
    return {route: routeTemplate(), title: safe(document.title), buttons: buttons, links: links, fields: fields, headings: headings};
  }
  function isTarget() { return location.hostname === config.targetHost; }
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
  function trackRoute(reason) {
    var next = location.pathname;
    if (next === route && reason !== "start") return;
    var previousCallId = callRouteId;
    var ratingMatch = next.match(/^\/call\/([^/?#]+)\/rate\/?$/);
    var nextCallId = currentCallId();
    var leavingCall = previousCallId && previousCallId !== nextCallId;
    var endMeasurement = lastCallEndMeasurement && lastCallEndMeasurement.callId === previousCallId
      ? lastCallEndMeasurement.platformSeconds : null;
    route = next;
    callRouteId = nextCallId;
    if (leavingCall) {
      if (!Number.isFinite(endMeasurement)) endMeasurement = ratingMatch ? null : parsePlatformSeconds();
      emit("CALL_ROUTE_ENDED", {
        callId: previousCallId,
        platformSeconds: Number.isFinite(endMeasurement) ? endMeasurement : null,
        reason: ratingMatch ? "rating-route" : reason,
        endSignal: ratingMatch ? "rating-stars-route" : "route-fallback"
      });
    }
    if (ratingMatch && (!previousCallId || previousCallId === ratingMatch[1])) {
      emit("RATING_ROUTE_ENTERED", {
        callId: ratingMatch[1],
        previousCallId: previousCallId || null,
        platformSeconds: Number.isFinite(endMeasurement) ? endMeasurement : null,
        confirmation: "rating-stars-route"
      });
    }
    if (callRouteId && callRouteId !== previousCallId) {
      emit("CALL_ROUTE_ENTERED", { callId: callRouteId, reason: reason, evidence: callActivationEvidence() });
      emitIntegrity("call-entered");
    }
    if (!callRouteId) lastCallEndMeasurement = null;
    schedulePlatformMirror("route:" + reason);
    portalStructureSnapshot("route:" + reason, true);
    updateDiagnosticTimers();
  }
  function cleanupFingerprints() {
    var cutoff = Date.now() - 15000;
    fingerprints.forEach(function (at, key) {
      if (at < cutoff) fingerprints.delete(key);
    });
  }
  function autoAnswer() {
    if (!isTarget() || currentCallId()) return;
    var dialogs = document.querySelectorAll(DIALOG);
    if (!dialogs.length) lastIncomingSignature = "";
    dialogs.forEach(function (dialog) {
      var text = normalized(dialog.innerText || dialog.textContent);
      if (!/Is requesting interpretation/i.test(text)) return;
      var modality = /Audio interpreting/i.test(text) ? "OPI" :
        /Video interpreting/i.test(text) ? "VRI" : "UNKNOWN";
      var button = dialog.querySelector(CONNECT);
      var signature = modality + "|" + !!button + "|" + (button ? !!button.disabled : "none");
      var newIncoming = signature !== lastIncomingSignature;
      if (newIncoming) {
        lastIncomingSignature = signature;
        emit("INCOMING_DIALOG_DETECTED", {
          modality: modality, connectFound: !!button,
          connectDisabled: button ? !!button.disabled : null,
          requestTextSafe: safe(text).slice(0, 500),
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
      }
      if (!config.autoAnswerEnabled || !button || button.disabled || clickedNodes.has(button)) return;
      if (modality !== "OPI") {
        emit("AUTO_ANSWER_SKIPPED_UNVERIFIED_MODALITY", { modality: modality }, "warn");
        return;
      }
      cleanupFingerprints();
      var fingerprint = safe(text) + "|" + modality;
      if (fingerprints.has(fingerprint)) return;
      clickedNodes.add(button);
      fingerprints.set(fingerprint, Date.now());
      try {
        var started = performance.now();
        button.click();
        integrity.permittedConnectClicks += 1;
        emit("CONNECT_CLICKED", {
          modality: modality,
          clickLatencyMs: Math.round((performance.now() - started) * 1000) / 1000,
          platformInteraction: "permitted-connect-only"
        });
        emitIntegrity("after-connect");
      } catch (error) {
        emit("CONNECT_ERROR", { message: String(error) }, "error");
      }
    });
  }
  function detectAvailability() {
    var text = Array.from(document.querySelectorAll("button,[role='button'],[aria-label]")).slice(0, 160)
      .map(function (element) {
        return normalized((element.getAttribute("aria-label") || "") + " " + (element.textContent || ""));
      }).join(" ");
    var next = /Click to go Offline|You are Online/i.test(text) ? "online" :
      /Click to go Online|You are Offline/i.test(text) ? "offline" : "unknown";
    if (next !== "unknown" && next !== lastAvailability) {
      lastAvailability = next;
      emit("AVAILABILITY_STATE", { state: next });
    }
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
  function portalStructureSnapshot(reason, force) {
    if (!isTarget() || !config.observationEnabled) return;
    var portal = extractPortalStructure(), signature = JSON.stringify(portal);
    if (signature === lastPortalStructureSignature && !force) return;
    lastPortalStructureSignature = signature;
    emit("PORTAL_STRUCTURE_SNAPSHOT", {reason:reason || "heartbeat", portal:portal});
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
    if (telemetryStarted) return;
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
      emit("USER_INTERACTION", { kind: "click", target: descriptor });
    }, true);
    performanceSnapshot("telemetry-start");
    telemetryTimer = setInterval(function () { performanceSnapshot("heartbeat"); }, Math.max(10, Number(config.telemetryHeartbeatSeconds || 30)) * 1000);
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
  function earningsNow() {
    var today = localDay();
    var calls = Array.isArray(state.completedCalls) ? state.completedCalls.filter(function (call) {
      return localDay(call.startedAt || call.endedAt) === today;
    }) : [];
    var completedUsd = calls.reduce(function (sum, call) { return sum + Number(call.estimatedRevenue || 0); }, 0);
    var liveSeconds = state.callStartedAt ? Math.max(0, (Date.now() - Date.parse(state.callStartedAt)) / 1000) : 0;
    var modality = state.callModality || "OPI";
    var rate = modality === "VRI" ? Number(config.vriRatePerMinute || 0.25) : Number(config.opiRatePerMinute || 0.20);
    var liveUsd = liveSeconds / 60 * rate;
    var fx = Number(config.usdMxnRate || 0);
    var official = platformMirror.statistics && platformMirror.statistics.summary || {};
    var officialUsd = Number(official.earnedUsd);
    if (!(officialUsd > 0)) officialUsd = parseOfficialUsd(official.earned);
    var hasOfficial = Number.isFinite(officialUsd) && officialUsd >= 0 && official.earned != null;
    var baseUsd = hasOfficial ? officialUsd : completedUsd;
    return { calls: calls.length, modality: modality, liveSeconds: liveSeconds, liveUsd: liveUsd, totalUsd: baseUsd + (hasOfficial ? 0 : liveUsd), officialUsd: hasOfficial ? officialUsd : null, fx: fx };
  }
  function ensureOverlay() {
    if (!config.overlayEnabled || !document.documentElement) {
      if (overlayHost) overlayHost.remove();
      overlayHost = null; overlayRoot = null;
      if (overlayTimer) clearInterval(overlayTimer);
      overlayTimer = null;
      return;
    }
    if (overlayHost && overlayHost.isConnected) return;
    overlayHost = document.createElement("div");
    overlayHost.id = "signal-interpreter-earnings-overlay";
    overlayHost.style.cssText = "all:initial;position:fixed;z-index:2147483647;top:12px;right:12px;pointer-events:auto";
    overlayRoot = overlayHost.attachShadow({ mode: "closed" });
    overlayRoot.innerHTML = '<style>:host{all:initial}.card{width:210px;box-sizing:border-box;padding:10px 12px;border:1px solid rgba(111,211,255,.28);border-radius:13px;background:rgba(5,18,34,.90);box-shadow:0 8px 30px rgba(0,0,0,.24);backdrop-filter:blur(12px);color:#dff7ff;font:12px/1.25 Arial,sans-serif;user-select:none}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand{color:#75d9ff;font-size:9px;font-weight:700;letter-spacing:.14em}.actions{display:flex;gap:4px}button{border:0;border-radius:6px;background:rgba(255,255,255,.08);color:#9db2c6;width:22px;height:22px;cursor:pointer}button:hover{background:rgba(255,255,255,.16);color:white}.amount{margin-top:5px;color:white;font-size:21px;font-weight:750;font-variant-numeric:tabular-nums}.detail{display:flex;justify-content:space-between;gap:8px;margin-top:5px;color:#8fa6bb;font-size:10px}.live{color:#79e4a6;font-variant-numeric:tabular-nums}.fx{margin-top:6px;color:#647f98;font-size:9px}.compact .detail,.compact .fx{display:none}.compact{width:174px;padding:8px 10px}.compact .amount{font-size:17px;margin-top:2px}</style><section class="card" aria-live="polite"><div class="top"><span class="brand">SIGNAL INTERPRETER · INGRESO</span><span class="actions"><button id="compact" title="Compactar o ampliar">↕</button><button id="close" title="Ocultar overlay">×</button></span></div><div class="amount" id="amount">MX$0.0000</div><div class="detail"><span id="summary">Sin llamada</span><span class="live" id="live">+MX$0.0000</span></div><div class="fx" id="fx">Obteniendo tipo de cambio…</div></section>';
    document.documentElement.appendChild(overlayHost);
    integrity.extensionDomWrites += 1;
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
    overlayTimer = setInterval(renderOverlay, 50);
  }
  function renderOverlay() {
    ensureOverlay();
    if (!overlayRoot) return;
    var info = earningsNow();
    var mxnAvailable = info.fx > 0;
    var total = mxnAvailable ? info.totalUsd * info.fx : info.totalUsd;
    var live = mxnAvailable ? info.liveUsd * info.fx : info.liveUsd;
    var currency = mxnAvailable ? "MXN" : "USD";
    overlayRoot.querySelector(".card").classList.toggle("compact", !!config.overlayCompact);
    overlayRoot.getElementById("amount").textContent = money(total, currency, 4);
    overlayRoot.getElementById("live").textContent = info.officialUsd !== null ? "En llamada +" + money(live, currency, 4) : "+" + money(live, currency, 4);
    overlayRoot.getElementById("summary").textContent = state.callStartedAt ? info.modality + " · " + (info.liveSeconds / 60).toFixed(2) + " min" : info.calls + " llamadas hoy";
    overlayRoot.getElementById("fx").textContent = mxnAvailable
      ? "USD/MXN " + info.fx.toFixed(4) + " · " + (config.exchangeRateDate || "último disponible")
      : "Sin tasa MXN: mostrando USD";
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
      autoAnswer();
      detectAvailability();
      mediaSnapshot("mutation");
      mapScreen("mutation");
      schedulePlatformMirror("mutation");
    });
    observer.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden", "aria-modal", "aria-label", "disabled"]
    });
    startRichTelemetry();
    emit("PLATFORM_SESSION_STARTED", { title: safe(document.title), userAgent: navigator.userAgent, language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    emit("OBSERVER_STARTED", { autoAnswerEnabled: config.autoAnswerEnabled });
    emitIntegrity("startup");
    trackRoute("start");
    autoAnswer();
    detectAvailability();
    mapScreen("start");
    schedulePlatformMirror("start");
    renderOverlay();
  }
  function stop(reason) {
    if (!observer) return;
    observer.disconnect();
    observer = null;
    emit("OBSERVER_STOPPED", { reason: reason || "config" });
  }
  function apply(next) {
    config = Object.assign({}, config, next || {});
    if (isTarget() && (config.autoAnswerEnabled || config.observationEnabled)) start();
    else stop("disabled-or-host-mismatch");
    autoAnswer();
    renderOverlay();
    if (telemetryStarted && telemetryTimer) {
      clearInterval(telemetryTimer);
      telemetryTimer = setInterval(function () { performanceSnapshot("heartbeat"); }, Math.max(10, Number(config.telemetryHeartbeatSeconds || 30)) * 1000);
    }
  }


  chrome.storage.local.get(["effectifConfig", "effectifState", "effectifPlatformMirror"], function (stored) {
    state = stored.effectifState || {}; platformMirror = stored.effectifPlatformMirror || {};
    apply(stored.effectifConfig);
  });
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== "local") return;
    if (changes.effectifState) { state = changes.effectifState.newValue || {}; renderOverlay(); }
    if (changes.effectifPlatformMirror) { platformMirror = changes.effectifPlatformMirror.newValue || {}; renderOverlay(); }
    if (changes.effectifConfig) apply(changes.effectifConfig.newValue);
  });
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message && message.type === "EFFECTIF_REQUEST_PLATFORM_SNAPSHOT") {
      capturePlatformMirror("popup-sync", true);
    }
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
  window.addEventListener("popstate", function () { trackRoute("popstate"); });
  window.addEventListener("hashchange", function () { trackRoute("hashchange"); });
  if (window.navigation && window.navigation.addEventListener) {
    window.navigation.addEventListener("navigate", function () {
      setTimeout(function () { trackRoute("navigation"); }, 0);
    });
  }
  window.addEventListener("pagehide", function () {
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
    if (overlayTimer) clearInterval(overlayTimer);
    if (telemetryTimer) clearInterval(telemetryTimer);
    performanceSnapshot("pagehide");
    stop("pagehide");
  });
})();