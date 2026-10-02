try{importScripts("groq-secret.local.js");}catch(_){/* Se genera localmente; no se versiona. */}
importScripts("dialogue-engine.js","telemetry-db.js","observation-sync.js","groq-transcriber.js");
(function () {
  "use strict";

  var GROQ_MODEL = "whisper-large-v3-turbo";
  var GROQ_USD_PER_AUDIO_HOUR = 0.04;
  var DEFAULT_CONFIG = {
    targetHost: "app.cloudinterpreter.com",
    autoAnswerEnabled: true,
    observationEnabled: true,
    networkTelemetryEnabled: true,
    performanceTelemetryEnabled: true,
    interactionTelemetryEnabled: true,
    telemetryRetentionDays: 180,
    telemetryMaxEvents: 250000,
    telemetryHeartbeatSeconds: 30,
    soundEnabled: true,
    volume: 0.8,
    transcriptionAvailable: true,
    transcriptionEnabled: true,
    instantPreviewEnabled: false,
    audioSafetyMode: true,
    opiRatePerMinute: 0.20,
    vriRatePerMinute: 0.25,
    currency: "USD",
    billingRule: "pro_rata_by_second_assumed",
    overlayEnabled: true,
    overlayCompact: true,
    usdMxnRate: null,
    exchangeRateDate: null,
    exchangeRateUpdatedAt: null,
    exchangeRateSource: "Frankfurter / European Central Bank",
    groqModel: GROQ_MODEL,
    groqEstimatedUsdPerAudioHour: GROQ_USD_PER_AUDIO_HOUR
  };
  var offscreenCreation = null;
  var eventQueue = Promise.resolve();
  var stateQueue = Promise.resolve();
  var cachedConfig = Object.assign({}, DEFAULT_CONFIG);
  var signalGroqQueue = Promise.resolve();

  function uid() { return crypto.randomUUID(); }
  function iso() { return new Date().toISOString(); }
  function redactString(value) {
    return String(value || "")
      .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
      .replace(/\b(?:gsk|sk|pk)_[A-Za-z0-9_-]{12,}\b/g, "[REDACTED_KEY]")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
      .slice(0, 5000);
  }
  function scrub(value, depth) {
    if (depth > 8) return "[MAX_DEPTH]";
    if (typeof value === "string") return redactString(value);
    if (Array.isArray(value)) return value.slice(0, 500).map(function (item) { return scrub(item, depth + 1); });
    if (!value || typeof value !== "object") return value;
    var output = {};
    Object.keys(value).slice(0, 500).forEach(function (key) {
      if (/api.?key|authorization|cookie|password|secret|token/i.test(key)) output[key] = "[REDACTED]";
      else output[key] = scrub(value[key], depth + 1);
    });
    return output;
  }
  function localDay(value) {
    var date = value ? new Date(value) : new Date();
    if (!Number.isFinite(date.getTime())) date = new Date();
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }
  async function fetchJson(url) {
    var response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status + " en " + new URL(url).hostname);
    var text = await response.text();
    var data;
    try { data = JSON.parse(text); } catch (_) { throw new Error("JSON inválido en " + new URL(url).hostname); }
    return data;
  }
  async function refreshExchangeRate(reason) {
    var sources = [
      { url: "https://api.frankfurter.app/latest?from=USD&to=MXN", name: "Frankfurter / European Central Bank", read: function (data) { return { rate: Number(data && data.rates && data.rates.MXN), date: data && data.date }; } },
      { url: "https://api.frankfurter.dev/v1/latest?base=USD&symbols=MXN", name: "Frankfurter / European Central Bank", read: function (data) { return { rate: Number(data && data.rates && data.rates.MXN), date: data && data.date }; } },
      { url: "https://open.er-api.com/v6/latest/USD", name: "ExchangeRate-API", read: function (data) { return { rate: Number(data && data.rates && data.rates.MXN), date: data && data.time_last_update_utc ? new Date(data.time_last_update_utc).toISOString().slice(0, 10) : null }; } }
    ];
    var failures = [];
    for (var i = 0; i < sources.length; i += 1) {
      try {
        var data = await fetchJson(sources[i].url);
        var result = sources[i].read(data);
        if (!(result.rate > 0)) throw new Error("Respuesta sin tasa USD/MXN válida");
        var stored = await chrome.storage.local.get(["effectifConfig", "effectifState"]);
        var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {}, {
          usdMxnRate: result.rate, exchangeRateDate: result.date || localDay(),
          exchangeRateUpdatedAt: iso(), exchangeRateSource: sources[i].name
        });
        var state = Object.assign(baseState(), stored.effectifState || {}, { exchangeRateError: null });
        await chrome.storage.local.set({ effectifConfig: config, effectifState: state });
        record("EXCHANGE_RATE_UPDATED", { pair: "USD/MXN", rate: result.rate, rateDate: result.date || null, source: sources[i].name, reason: reason || "scheduled" }, "info", "background");
        return result.rate;
      } catch (error) { failures.push(String(error)); }
    }
    var saved = await chrome.storage.local.get(["effectifState"]);
    var message = failures.join(" | ") || "No hubo fuente disponible";
    var next = Object.assign(baseState(), saved.effectifState || {}, { exchangeRateError: message });
    await chrome.storage.local.set({ effectifState: next });
    record("EXCHANGE_RATE_ERROR", { pair: "USD/MXN", message: message, reason: reason || "scheduled" }, "warn", "background");
    throw new Error(message);
  }
  function baseState() {
    return {
      sessionStartedAt: null, sessionSegments: [], pendingCall: null,
      onlineStartedAt: null, onlineSegments: [],
      callStartedAt: null, callId: null, callModality: null,
      completedCalls: [], totalCalls: 0, dailyCalls: {},
      missedCalls: 0, dailyMissedCalls: {}, missedCallRecords: [],
      transcriptionActive: false, transcriptionTabId: null,
      transcriptionStatus: { phase: "idle", connected: false, engine: null },
      transcriptionMetrics: {
        segments: 0, localSegments: 0, groqSegments: 0,
        queueDepth: 0, averageLatencyMs: 0, groqEstimatedUsd: 0
      },
      lastConnectAt: null,
      exchangeRateError: null,
      groqUsage: {
        requests: 0, successes: 0, errors: 0, audioSeconds: 0,
        bytesSent: 0, charactersReturned: 0, totalLatencyMs: 0, estimatedUsd: 0
      },
      groqCapture:{status:"idle",tabAudio:false,microphone:false,startedAt:null,lastChunkAt:null,error:null},
      groqTranscript:{active:false,segments:0,lastTimestamp:null,model:GROQ_MODEL},
      eventSequence:0,
      telemetryHealth: { dbWrites: 0, dbErrors: 0, lastWriteAt: null, lastMaintenanceAt: null }
    };
  }
  function log(level, action, payload) {
    try {
      var target = console[level === "error" ? "error" : "log"];
      var printable = payload || {};
      if (printable && typeof printable === "object") {
        try { printable = JSON.stringify(printable); } catch (_) { printable = String(printable); }
      }
      target.call(console, "[SIGNAL-INTERPRETER]", iso(), action, printable);
    } catch (_) {}
  }
  function normalizeStateShape(state) {
    if (!state || typeof state !== "object") state = baseState();
    if (!Array.isArray(state.sessionSegments)) state.sessionSegments = [];
    if (!Array.isArray(state.onlineSegments)) state.onlineSegments = [];
    if (!Array.isArray(state.completedCalls)) state.completedCalls = [];
    if (!Array.isArray(state.missedCallRecords)) state.missedCallRecords = [];
    if (!state.dailyCalls || typeof state.dailyCalls !== "object" || Array.isArray(state.dailyCalls)) state.dailyCalls = {};
    if (!state.dailyMissedCalls || typeof state.dailyMissedCalls !== "object" || Array.isArray(state.dailyMissedCalls)) state.dailyMissedCalls = {};
    if (!state.transcriptionStatus || typeof state.transcriptionStatus !== "object" || Array.isArray(state.transcriptionStatus)) state.transcriptionStatus = {phase:"idle",connected:false,engine:null};
    if (!state.transcriptionMetrics || typeof state.transcriptionMetrics !== "object" || Array.isArray(state.transcriptionMetrics)) state.transcriptionMetrics = {segments:0,localSegments:0,groqSegments:0,queueDepth:0,averageLatencyMs:0,groqEstimatedUsd:0};
    if (!state.groqUsage || typeof state.groqUsage !== "object" || Array.isArray(state.groqUsage)) state.groqUsage = {requests:0,successes:0,errors:0,audioSeconds:0,bytesSent:0,charactersReturned:0,totalLatencyMs:0,estimatedUsd:0};
    return state;
  }
  function inferEventPhase(action){var a=String(action||"");if(/_REQUESTED$|_QUEUED$/.test(a))return"start";if(/_STARTED$|_CONNECTED$|_SENT$/.test(a))return"started";if(/_COMPLETED$|_UPDATED$|_PERSISTED$|_ACCEPTED$/.test(a))return"completed";if(/_ERROR$|_FAILED$/.test(a))return"error";if(/_REJECTED$|_BLOCKED$/.test(a))return"blocked";if(/_TIMEOUT$/.test(a))return"timeout";if(/_ABORTED$/.test(a))return"aborted";return"event"}
  function inferEventOutcome(action,level){var a=String(action||"");if(level==="error"||/_ERROR$|_FAILED$/.test(a))return"error";if(/_REJECTED$|_BLOCKED$/.test(a))return"blocked";if(/_TIMEOUT$/.test(a))return"timeout";if(/_ACCEPTED$|_COMPLETED$|_PERSISTED$|_UPDATED$|_STARTED$|_CONNECTED$/.test(a))return"success";return"observed"}
  function inferEventCategory(action){var a=String(action||"");if(/^SIGNAL_/.test(a)){if(/CAPTION/.test(a))return"LIVE_CAPTION";if(/UIA/.test(a))return"UIA";if(/BRIDGE/.test(a))return"BRIDGE";if(/SESSION/.test(a))return"SESSION";if(/DIALOGUE/.test(a))return"DIALOGUE";if(/AUDIO/.test(a))return"CAPTURE";if(/PERSIST|SEGMENT/.test(a))return"STORAGE";if(/CONSOLE|LIVE_/.test(a))return"UI";return"SIGNAL"}if(/NETWORK|EXCHANGE/.test(a))return"BILLING";if(/TRANSCRIPTION/.test(a))return"TRANSCRIPT";if(/CALL|MISSED/.test(a))return"SESSION";if(/SOUND/.test(a))return"SOUND";return"RUNTIME"}
  function appendEvent(input, callback) {
    eventQueue = eventQueue.then(async function () {
      var stored = await chrome.storage.local.get(["effectifEvents", "effectifEventSequence", "effectifTelemetryHealth"]);
      var sequence = Number(stored.effectifEventSequence || 0) + 1;
      var event = Object.assign({
        schema: "khora-effectif-event/v4", id: uid(), sequence: sequence,
        timestamp: iso(), level: "info", source: "background",
        extensionVersion: chrome.runtime.getManifest().version, category: inferEventCategory(input && input.action), component: (input && input.source) || "background", phase: inferEventPhase(input && input.action), outcome: inferEventOutcome(input && input.action, input && input.level || "info"), traceId: (input && input.traceId) || uid(), operationId: (input && input.operationId) || null, parentEventId: (input && input.parentEventId) || null, attempt: Number(input && input.attempt) || 1, durationMs: input && input.durationMs != null ? Number(input.durationMs) : null, session: {}, environment: { extensionVersion: chrome.runtime.getManifest().version, userAgent: typeof navigator!=="undefined"?navigator.userAgent:"", platform: typeof navigator!=="undefined"?navigator.platform:"" }, expected: null, observed: null, reasonCode: null, metrics: {}, privacy: { rawTextStored: false, captionTextStored: false, credentialRedaction: "active" }
      }, input || {});
      delete event.apiKey; delete event.audio; delete event.text;
      if (event.payload) {
        delete event.payload.apiKey; delete event.payload.audio;
        delete event.payload.text; delete event.payload.dialogText;
      }
      event.ingestedAt = iso();
      event.ingestDelayMs = Math.max(0, Date.parse(event.ingestedAt) - Date.parse(event.timestamp || event.ingestedAt));
      event.payload = scrub(event.payload || {}, 0);
      event.context = scrub(event.context || {}, 0);
      try{var pp=event.payload||{};event.reasonCode=event.reasonCode||pp.reasonCode||pp.reason||null;event.error=event.error||pp.error||pp.message||null;event.metrics=event.metrics&&Object.keys(event.metrics).length?event.metrics:((pp.metrics&&typeof pp.metrics==="object")?pp.metrics:{});event.expected=event.expected!=null?event.expected:(pp.expected!=null?pp.expected:null);event.observed=event.observed!=null?event.observed:(pp.observed!=null?pp.observed:null);}catch(_){}
      try{var ep=event.payload||{};event.session=Object.assign({},event.session||{},ep.sessionId?{sessionId:ep.sessionId}:{} ,ep.sourceOrigin?{sourceOrigin:ep.sourceOrigin}:{} ,ep.sourceTabId!=null?{sourceTabId:ep.sourceTabId}:{} ,ep.sourceWindowId!=null?{sourceWindowId:ep.sourceWindowId}:{});}catch(_){}
      event.url = redactString(event.url || "");
      var health = Object.assign({ dbWrites: 0, dbErrors: 0, lastWriteAt: null }, stored.effectifTelemetryHealth || {});
      try {
        await KhoraTelemetryDB.putEvent(event);
        health.dbWrites += 1;
        health.lastWriteAt = event.timestamp;
      } catch (dbError) {
        health.dbErrors += 1;
        health.lastError = String(dbError);
      }
      var events = Array.isArray(stored.effectifEvents) ? stored.effectifEvents : [];
      events.push(event);
      if (events.length > 500) events = events.slice(-500);
      await chrome.storage.local.set({
        effectifEvents: events, effectifLastEvent: event, effectifEventSequence: sequence,
        effectifTelemetryHealth: health
      });
      log(event.level, event.action || "EVENT", event.payload);
      try{if(typeof SignalObservationSync!=="undefined"&&SignalObservationSync&&SignalObservationSync.noteEvent)SignalObservationSync.noteEvent(event)}catch(_){}
      if (callback) callback(event);
    }).catch(function (error) {
      console.error("[SIGNAL-INTERPRETER] EVENT_LOG_ERROR", String(error));
    });
  }
  function record(action, payload, level, source) {
    appendEvent({ action: action, payload: payload || {}, level: level || "info", source: source || "background" });
  }
  function cloneStateForStorage(state) {
    var normalized = normalizeStateShape(state);
    try { return JSON.parse(JSON.stringify(normalized)); } catch (_) {
      return normalizeStateShape(baseState());
    }
  }
  function mutateState(mutator, operation) {
    stateQueue = stateQueue.then(async function () {
      var before = cloneStateForStorage(baseState());
      try {
        var stored = await chrome.storage.local.get(["effectifState", "effectifConfig"]);
        before = cloneStateForStorage(Object.assign(baseState(), stored.effectifState || {}));
        var state = cloneStateForStorage(before);
        var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {});
        await mutator(state, config);
        state = cloneStateForStorage(state);
        await chrome.storage.local.set({ effectifState: state });
        return state;
      } catch (error) {
        record("STATE_MUTATION_ERROR", {
          operation: operation || mutator.name || "anonymous",
          message: String(error),
          name: error && error.name || null,
          stack: error && error.stack ? String(error.stack).slice(0, 2000) : null,
          recovered: true
        }, "warn", "background");
        try {
          await chrome.storage.local.set({ effectifState: before });
          return before;
        } catch (repairError) {
          record("STATE_REPAIR_ERROR", {
            operation: operation || mutator.name || "anonymous",
            message: String(repairError),
            name: repairError && repairError.name || null,
            stack: repairError && repairError.stack ? String(repairError.stack).slice(0, 2000) : null
          }, "error", "background");
          return before;
        }
      }
    });
    return stateQueue;
  }
  async function initialize() {
    var stored = await chrome.storage.local.get(["effectifConfig", "effectifState", "effectifEvents", "effectifTelemetryMigrated"]);
    var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {}, { transcriptionAvailable: true, transcriptionEnabled: true });
    cachedConfig = config;
    var state = normalizeStateShape(Object.assign(baseState(), stored.effectifState || {}, {
      transcriptionActive: false,
      transcriptionTabId: null,
      transcriptionStatus: { phase: "idle", connected: false, engine: "groq" }
    }));
    await chrome.storage.local.set({ effectifConfig: config, effectifState: cloneStateForStorage(state) });
    try {
      if (!stored.effectifTelemetryMigrated && Array.isArray(stored.effectifEvents) && stored.effectifEvents.length) {
        await KhoraTelemetryDB.putEvents(stored.effectifEvents);
        await chrome.storage.local.set({ effectifTelemetryMigrated: true });
      }
      if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
      await KhoraTelemetryDB.putMetadata("schema", { version: 1, extensionVersion: chrome.runtime.getManifest().version });
    } catch (error) {
      state.telemetryHealth = Object.assign({}, state.telemetryHealth || {}, { lastError: String(error) });
      await chrome.storage.local.set({ effectifState: state });
    }
  }
  async function ensureOffscreen() {
    var target=chrome.runtime.getURL("offscreen.html");
    if(chrome.runtime.getContexts){
      var contexts=await chrome.runtime.getContexts({contextTypes:["OFFSCREEN_DOCUMENT"],documentUrls:[target]});
      if(contexts.length)return;
      try{if(await chrome.offscreen.hasDocument())await chrome.offscreen.closeDocument()}catch(_){}
    }else{try{if(await chrome.offscreen.hasDocument())return}catch(_){}}
    if(!offscreenCreation){
      offscreenCreation=chrome.offscreen.createDocument({
        url:"offscreen.html",
        reasons:["AUDIO_PLAYBACK","USER_MEDIA"],
        justification:"Capturar audio de la pestaña y del micrófono en segundo plano para enviarlo a Groq Whisper y producir transcripción."
      }).finally(function(){offscreenCreation=null});
    }
    await offscreenCreation;
  }
  async function playSound(volume){
    await ensureOffscreen();
    var response=await chrome.runtime.sendMessage({target:"offscreen",type:"EFFECTIF_PLAY_SOUND",volume:Math.max(0,Math.min(1,Number(volume)||0))});
    if(!response||!response.ok)throw new Error(response&&response.error||"No se pudo reproducir la alerta sonora");
    return response;
  }
  function handleSession(event) {
    chrome.storage.local.get(["effectifState"], function (stored) {
      var state = Object.assign(baseState(), stored.effectifState || {});
      if (event.action === "PLATFORM_SESSION_STARTED" && !state.sessionStartedAt) {
        state.sessionStartedAt = event.timestamp;
      } else if (event.action === "PLATFORM_SESSION_ENDED" && state.sessionStartedAt) {
        state.sessionSegments = (state.sessionSegments || []).concat({
          startedAt: state.sessionStartedAt, endedAt: event.timestamp,
          durationSeconds: Math.max(0, (Date.parse(event.timestamp) - Date.parse(state.sessionStartedAt)) / 1000),
          reason: event.payload && event.payload.reason || "pagehide"
        }).slice(-1000);
        state.sessionStartedAt = null;
      }
      chrome.storage.local.set({ effectifState: state });
    });
  }
  function handleAvailability(event) {
    chrome.storage.local.get(["effectifState"], function (stored) {
      var state = Object.assign(baseState(), stored.effectifState || {});
      var next = event.payload && event.payload.state;
      if (next === "online" && !state.onlineStartedAt) {
        state.onlineStartedAt = event.timestamp;
      } else if (next === "offline" && state.onlineStartedAt) {
        state.onlineSegments = (state.onlineSegments || []).concat({
          startedAt: state.onlineStartedAt,
          endedAt: event.timestamp,
          durationSeconds: Math.max(0, (Date.parse(event.timestamp) - Date.parse(state.onlineStartedAt)) / 1000)
        }).slice(-1000);
        state.onlineStartedAt = null;
      }
      chrome.storage.local.set({ effectifState: state });
    });
  }
  function markIncoming(event) {
    mutateState(async function (state) {
      if (state.callId) return;
      var pendingAge = state.pendingCall && Date.parse(event.timestamp) - Date.parse(state.pendingCall.detectedAt);
      if (!state.pendingCall || !Number.isFinite(pendingAge) || pendingAge > 60000) {
        state.pendingCall = {
          id: uid(), detectedAt: event.timestamp,
          modality: event.payload && event.payload.modality || event.modality || "OPI",
          clickedAt: null
        };
      }
      chrome.alarms.create("effectif-pending-call", { when: Date.now() + 15000 });
    });
  }
  function startCall(event) {
    var callId = event.callId || event.payload && event.payload.callId;
    mutateState(async function (state) {
      if (!callId || state.callId === callId ||
          (state.completedCalls || []).some(function (call) { return call.callId === callId; })) return;
      state.callId = callId;
      state.callStartedAt = event.timestamp;
      state.callModality = state.pendingCall && state.pendingCall.modality || "OPI";
      state.pendingCall = null;
      chrome.alarms.clear("effectif-pending-call");
      state.totalCalls = Number(state.totalCalls || 0) + 1;
      var day = localDay(event.timestamp);
      state.dailyCalls = Object.assign({}, state.dailyCalls || {});
      state.dailyCalls[day] = Number(state.dailyCalls[day] || 0) + 1;
      record("CALL_TIMER_STARTED", { callId: callId, modality: state.callModality }, "info", "background");
    }).then(function (state) {
      if (state && state.callId === callId) {
        record("TRANSCRIPTION_MODULE_READY", { callId: callId, engine: "groq-whisper" }, "info", "background");
      }
    });
  }
  function alertOnConnect(event) {
    mutateState(async function (state, config) {
      state.lastConnectAt = event.timestamp;
      if (state.pendingCall) {
        state.pendingCall.clickedAt = event.timestamp;
      } else if (!state.callId) {
        state.pendingCall = {
          id: uid(), detectedAt: event.timestamp, clickedAt: event.timestamp,
          modality: event.payload && event.payload.modality || "OPI"
        };
      }
      chrome.alarms.create("effectif-pending-call", { when: Date.now() + 15000 });
      if (!config.soundEnabled) return;
      playSound(config.volume).then(function () {
        record("ALERT_SOUND_PLAYED", { detectedAt: event.timestamp }, "info", "offscreen");
      }).catch(function (error) {
        record("ALERT_SOUND_ERROR", { message: String(error) }, "error", "offscreen");
      });
    });
  }
  function closeCall(source, platformSeconds, sendResponse) {
    mutateState(async function (state, config) {
      if (!state.callStartedAt || !state.callId) {
        if (sendResponse) sendResponse({ ok: false, error: "No hay llamada activa" });
        return;
      }
      var endedAt = iso();
      var observedSeconds = Math.max(0, (Date.parse(endedAt) - Date.parse(state.callStartedAt)) / 1000);
      var hasPlatformSeconds = Number.isFinite(platformSeconds) && platformSeconds >= 0;
      var billableSeconds = hasPlatformSeconds ? platformSeconds : observedSeconds;
      var modality = state.callModality || "OPI";
      var rate = modality === "VRI" ? config.vriRatePerMinute : config.opiRatePerMinute;
      var call = {
        callId: state.callId, startedAt: state.callStartedAt, endedAt: endedAt,
        modality: modality, observedSeconds: Math.round(observedSeconds * 1000) / 1000,
        platformSeconds: hasPlatformSeconds ? platformSeconds : null,
        billableSecondsAssumed: Math.round(billableSeconds * 1000) / 1000,
        ratePerMinute: rate, estimatedRevenue: Math.round((billableSeconds / 60) * rate * 10000) / 10000,
        currency: config.currency, billingRule: config.billingRule, endSource: source
      };
      state.completedCalls = (state.completedCalls || []).concat(call).slice(-1000);
      if (state.transcriptionActive) {
        stopGroqCapture("call-ended").catch(function () {});
        state.transcriptionActive = false;
        state.transcriptionTabId = null;
        state.transcriptionStatus = { phase: "stopped", connected: false, engine: "groq" };
      }
      state.callStartedAt = null; state.callId = null; state.callModality = null;
      record("CALL_TIMER_STOPPED", call, "info", source);
      if (sendResponse) sendResponse({ ok: true, call: call });
    });
  }
  function savePlatformSnapshot(message, sender, sendResponse) {
    var snapshot = message.snapshot || {};
    if (!sender.tab || !/^https:\/\/app\.cloudinterpreter\.com\//.test(sender.tab.url || "")) {
      sendResponse({ ok: false, error: "Origen no autorizado" });
      return;
    }
    chrome.storage.local.get(["effectifPlatformMirror"], function (stored) {
      var mirror = Object.assign({}, stored.effectifPlatformMirror || {});
      var key = String(snapshot.key || "other").slice(0, 80);
      mirror[key] = Object.assign({}, snapshot, {
        tabId: sender.tab.id,
        capturedAt: snapshot.capturedAt || iso()
      });
      KhoraTelemetryDB.putSnapshot(Object.assign({}, snapshot, { tabId: sender.tab ? sender.tab.id : null }))
        .catch(function (error) { record("TELEMETRY_SNAPSHOT_DB_ERROR", { message: String(error) }, "error", "background"); });
      chrome.storage.local.set({ effectifPlatformMirror: mirror }, function () {
        record("PLATFORM_MIRROR_UPDATED", {
          key: key,
          route: snapshot.route || "",
          summaryFields: Object.keys(snapshot.summary || {}).length,
          tableCount: Array.isArray(snapshot.tables) ? snapshot.tables.length : 0,
          visibleLines: Array.isArray(snapshot.lines) ? snapshot.lines.length : 0
        }, "info", "content");
        sendResponse({ ok: true });
      });
    });
  }
  function updateGroqUsage(message) {
    chrome.storage.local.get(["effectifState", "effectifConfig"], function (stored) {
      var state = Object.assign(baseState(), stored.effectifState || {});
      var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {});
      var usage = Object.assign({}, baseState().groqUsage, state.groqUsage || {});
      usage.requests += 1;
      usage.audioSeconds += Number(message.audioSeconds || 0);
      usage.bytesSent += Number(message.bytesSent || 0);
      usage.totalLatencyMs += Number(message.latencyMs || 0);
      if (message.ok) {
        usage.successes += 1;
        usage.charactersReturned += Number(message.characters || 0);
      } else usage.errors += 1;
      usage.estimatedUsd = Math.round(
        (usage.audioSeconds / 3600) * Number(config.groqEstimatedUsdPerAudioHour || 0) * 1000000
      ) / 1000000;
      state.groqUsage = usage;
      chrome.storage.local.set({ effectifState: state });
      record(message.ok ? "GROQ_TRANSCRIPTION_OK" : "GROQ_TRANSCRIPTION_ERROR", {
        speaker: message.speaker, audioSeconds: message.audioSeconds,
        bytesSent: message.bytesSent, latencyMs: message.latencyMs,
        characters: message.characters || 0, httpStatus: message.httpStatus || null,
        error: message.ok ? undefined : message.error, estimatedTotalUsd: usage.estimatedUsd
      }, message.ok ? "info" : "error", "offscreen");
    });
  }


  var signalActiveSessionId=null,signalLiveConsoleOpen=false,signalLivePort=null,signalRuntimeId=uid();
  var signalGroqSeen=new Map();
  function recordSignalDiagnostic(action,payload,level,source){record(action,Object.assign({sessionId:signalActiveSessionId},payload||{}),level||"info",source||"groq");}
  function normalizeSignalSourceUrl(rawUrl){try{var u=new URL(String(rawUrl||""));u.hash="";return u.toString()}catch(_){return String(rawUrl||"")}}
  function normalizeSignalSessionUrl(rawUrl){try{return new URL(String(rawUrl||"")).origin.toLowerCase()}catch(_){return String(rawUrl||"").split("/").slice(0,3).join("/").toLowerCase()}}
  function signalProfileForOrigin(origin){return{mode:"dialogue",profile:"groq-audio-2p",participantModel:"2p",expectedParticipants:2,roles:["CLIENTE","YO"]};}
  function normalizeSignalSession(s){
    s=Object.assign({id:uid(),sourceKey:"",sourceUrl:"",title:"Sesión",sourceTabId:null,sourceWindowId:null,traceId:uid(),lastOperationId:null,createdAt:iso(),lastActivatedAt:null,activationCount:0,segments:[],segmentCount:0,activeSpeaker:"CLIENTE",view:"timeline",fontSize:20,autoScroll:true,compactDensity:false,voiceMap:{A:"CLIENTE",B:"YO"},mode:"unknown",profile:"groq-audio-2p",participantModel:"2p",expectedParticipants:2,roles:["CLIENTE","YO"],detectedSpeakerIds:{}},s||{});
    s.sourceUrl=normalizeSignalSourceUrl(s.sourceUrl||s.sourceKey);s.sourceKey=normalizeSignalSessionUrl(s.sourceUrl||s.sourceKey);s.profile="groq-audio-2p";s.participantModel="2p";s.expectedParticipants=2;s.roles=["CLIENTE","YO"];
    s.segments=Array.isArray(s.segments)?s.segments.slice(-100):[];s.segmentCount=Math.max(Number(s.segmentCount)||0,s.segments.length);s.detectedSpeakerIds=s.detectedSpeakerIds&&typeof s.detectedSpeakerIds==="object"?s.detectedSpeakerIds:{};return s;
  }
  function signalSessionCopy(s,includeSegments){var copy=normalizeSignalSession(s);if(!includeSegments)copy.segments=[];return JSON.parse(JSON.stringify(copy));}
  async function loadSignalSessions(){var stored=await chrome.storage.local.get(["signalInterpreterSessions","signalInterpreterActiveSessionId"]);return{sessions:(Array.isArray(stored.signalInterpreterSessions)?stored.signalInterpreterSessions:[]).map(normalizeSignalSession),activeSessionId:stored.signalInterpreterActiveSessionId||null};}
  async function saveSignalSessions(sessions,activeSessionId){await chrome.storage.local.set({signalInterpreterSessions:sessions,signalInterpreterActiveSessionId:activeSessionId||null});signalActiveSessionId=activeSessionId||null;}
  async function ensureSignalSession(info){
    var sourceUrl=normalizeSignalSourceUrl(info&&info.sourceUrl||""),sourceKey=normalizeSignalSessionUrl(sourceUrl),sourceWindowId=null;
    try{if(info&&info.tabId!=null){var tab=await chrome.tabs.get(info.tabId);sourceWindowId=tab&&tab.windowId!=null?tab.windowId:null;}}catch(_){}
    var requestedTabId=info&&info.tabId!=null?Number(info.tabId):null,data=await loadSignalSessions(),session=data.sessions.find(function(x){return x.sourceKey===sourceKey&&Number(x.sourceTabId)===requestedTabId});
    if(!session){session=normalizeSignalSession({sourceKey:sourceKey,sourceUrl:sourceUrl,title:info&&info.title||"Sesión",sourceTabId:requestedTabId,sourceWindowId:sourceWindowId});data.sessions.push(session);if(data.sessions.length>50)data.sessions=data.sessions.slice(-50);}
    else{if(sourceUrl)session.sourceUrl=sourceUrl;if(requestedTabId!=null)session.sourceTabId=requestedTabId;if(sourceWindowId!=null)session.sourceWindowId=sourceWindowId;if(String(info&&info.title||"").trim())session.title=String(info.title).trim().slice(0,140);session.lastActivatedAt=iso();session=normalizeSignalSession(session);}
    await saveSignalSessions(data.sessions,session.id);return session;
  }
  async function persistSignalSegment(sessionId,segment){
    var data=await loadSignalSessions(),session=data.sessions.find(function(s){return s.id===sessionId});if(!session)return{ok:false,error:"Sesión no encontrada"};
    var dbOk=false,cacheOk=false,dbError=null,cacheError=null;
    try{await KhoraTelemetryDB.putSignalSegment(Object.assign({},segment,{sessionId:sessionId}));dbOk=true;}catch(error){dbError=String(error);}
    session.segments=(session.segments||[]).concat(segment).sort(function(a,b){return(Date.parse(a.timestamp)||0)-(Date.parse(b.timestamp)||0)}).slice(-100);session.segmentCount=Math.max(Number(session.segmentCount||0),session.segments.length);
    var ids=Object.assign({},session.detectedSpeakerIds||{});if(segment.speaker)ids[String(segment.speaker)]=true;session.detectedSpeakerIds=ids;if(Object.keys(ids).length>=2)session.mode="dialogue";else if(Object.keys(ids).length===1)session.mode="monologue";
    try{await saveSignalSessions(data.sessions,data.activeSessionId||sessionId);cacheOk=true;}catch(error){cacheError=String(error);}
    return{ok:dbOk||cacheOk,dbOk:dbOk,cacheOk:cacheOk,dbError:dbError,cacheError:cacheError,session:signalSessionCopy(session,true)};
  }
  async function updateGroqCaptureState(patch){
    var stored=await chrome.storage.local.get(["effectifState"]),state=normalizeStateShape(Object.assign(baseState(),stored.effectifState||{}));state.groqCapture=Object.assign({},state.groqCapture||{},patch||{});
    state.transcriptionStatus={phase:state.groqCapture.status||"idle",connected:state.groqCapture.status==="connected",engine:"groq"};state.transcriptionActive=state.groqCapture.status==="connected";state.transcriptionTabId=state.transcriptionActive?(signalActiveSessionId||null):null;
    await chrome.storage.local.set({effectifState:cloneStateForStorage(state)});
  }
  async function startGroqCapture(sessionId,audioStreamId,sendResponse){
    try{
      var data=await loadSignalSessions(),session=data.sessions.find(function(s){return s.id===sessionId||s.id===data.activeSessionId});var stored=await chrome.storage.local.get(["effectifConfig"]),config=Object.assign({},DEFAULT_CONFIG,stored.effectifConfig||{});
      if(!session)throw new Error("Sesión no encontrada");if(!(await SignalGroqTranscriber.ready()))throw new Error("Configura la Groq API Key una sola vez en este equipo.");if(!audioStreamId)throw new Error("No se recibió el audio de la pestaña.");
      await ensureOffscreen();var response=await chrome.runtime.sendMessage({target:"offscreen",type:"SIGNAL_START_GROQ_CAPTURE",streamId:audioStreamId,sessionId:session.id});if(!response||!response.ok)throw new Error(response&&response.error||"No se pudo iniciar la captura de audio.");
      signalActiveSessionId=session.id;await updateGroqCaptureState({status:"connected",tabAudio:true,microphone:true,startedAt:iso(),lastChunkAt:null,error:null});
      recordSignalDiagnostic("SIGNAL_GROQ_CAPTURE_STARTED",{sessionId:session.id,sourceTabId:session.sourceTabId,model:config.groqModel||GROQ_MODEL});broadcastSignalEvent({type:"signal.groq.status",sessionId:session.id,status:"connected",tabAudio:true,microphone:true,timestamp:iso()});
      if(sendResponse)sendResponse({ok:true,session:signalSessionCopy(session,true)});return{ok:true};
    }catch(error){await updateGroqCaptureState({status:"error",error:String(error)}).catch(function(){});recordSignalDiagnostic("SIGNAL_GROQ_CAPTURE_ERROR",{sessionId:sessionId,error:String(error)},"error");if(sendResponse)sendResponse({ok:false,error:String(error)});return{ok:false,error:String(error)}}
  }
  async function stopGroqCapture(reason){
    try{await ensureOffscreen();await chrome.runtime.sendMessage({target:"offscreen",type:"SIGNAL_STOP_GROQ_CAPTURE"});}catch(_){};
    await updateGroqCaptureState({status:"stopped",tabAudio:false,microphone:false,error:null}).catch(function(){});recordSignalDiagnostic("SIGNAL_GROQ_CAPTURE_STOPPED",{reason:reason||"manual"});broadcastSignalEvent({type:"signal.groq.status",sessionId:signalActiveSessionId,status:"stopped",reason:reason||"manual",timestamp:iso()});return{ok:true};
  }
  function broadcastSignalEvent(event){try{var p=chrome.runtime.sendMessage({type:"SIGNAL_INTERPRETER_EVENT",event:event});if(p&&p.catch)p.catch(function(){});}catch(_){}}
  function handleGroqAudioChunk(message){
    signalGroqQueue=signalGroqQueue.then(async function(){
      var data=await loadSignalSessions(),id=message.sessionId||data.activeSessionId,session=data.sessions.find(function(s){return s.id===id});if(!session)return;
      var seq=Number(message.sequence||0),key=id+"|"+String(message.source||"")+"|"+seq;if(signalGroqSeen.has(key))return;signalGroqSeen.set(key,Date.now());if(signalGroqSeen.size>500)signalGroqSeen.delete(signalGroqSeen.keys().next().value);
      if(!(await SignalGroqTranscriber.ready())){recordSignalDiagnostic("SIGNAL_GROQ_TRANSCRIPTION_ERROR",{sessionId:id,reason:"missing-api-key",source:message.source},"error");return;}
      var raw=atob(String(message.base64||"")),bytes=new Uint8Array(raw.length);for(var bi=0;bi<raw.length;bi++)bytes[bi]=raw.charCodeAt(bi);var blob=new Blob([bytes],{type:"audio/webm"}),speaker=message.source==="yo"?"YO":"CLIENTE",audioSource=message.source==="yo"?"microphone":"tab";
      var result=await SignalGroqTranscriber.transcribe(blob,{model:config.groqModel||GROQ_MODEL,language:"es",filename:"signal-"+audioSource+"-"+(seq||Date.now())+".webm",prompt:"Interpretación médica en español; conserva nombres propios y términos clínicos.",timeoutMs:30000});
      updateGroqUsage({ok:result.ok,speaker:speaker,audioSeconds:Math.max(0,(Number(message.endedAt||Date.now())-Number(message.startedAt||Date.now()))/1000),bytesSent:blob.size,latencyMs:result.latencyMs||0,characters:String(result.text||"").length,httpStatus:result.httpStatus||null,error:result.error});
      if(!result.ok){recordSignalDiagnostic("SIGNAL_GROQ_TRANSCRIPTION_ERROR",{sessionId:id,speaker:speaker,error:result.error,source:audioSource,sequence:seq},"error");return;}
      var parts=result.segments&&result.segments.length?result.segments:[{start:0,end:0,text:result.text}],emitted=0;
      for(var i=0;i<parts.length;i++){var text=String(parts[i].text||"").trim();if(!text)continue;var ts=Number(message.startedAt||Date.now())+Math.max(0,Number(parts[i].start||0))*1000;var seg={id:"groq-"+uid(),sessionId:id,text:text.slice(0,12000),timestamp:new Date(ts).toISOString(),reason:"groq-transcription",source:"groq",speaker:speaker,speakerId:speaker,audioSource:audioSource,model:result.model,chunkSequence:seq};var persisted=await persistSignalSegment(id,seg);if(persisted.ok){emitted++;broadcastSignalEvent({type:"signal.transcript.segment",sessionId:id,segment:seg,timestamp:seg.timestamp});}}
      await updateGroqCaptureState({status:"connected",lastChunkAt:iso(),error:null});await mutateState(async function(state){state.transcriptionMetrics=Object.assign({},state.transcriptionMetrics||{}, {segments:Number(state.transcriptionMetrics&&state.transcriptionMetrics.segments||0)+emitted,groqSegments:Number(state.transcriptionMetrics&&state.transcriptionMetrics.groqSegments||0)+emitted,localSegments:0,queueDepth:0,averageLatencyMs:result.latencyMs||0});state.groqTranscript=Object.assign({},state.groqTranscript||{}, {active:true,segments:Number(state.groqTranscript&&state.groqTranscript.segments||0)+emitted,lastTimestamp:emitted?iso():state.groqTranscript.lastTimestamp,model:result.model||GROQ_MODEL});});
    }).catch(function(error){recordSignalDiagnostic("SIGNAL_GROQ_CHUNK_ERROR",{error:String(error)},"error");});
  }
  async function activateSignalSession(sessionId,audioStreamId){
    var data=await loadSignalSessions(),session=data.sessions.find(function(s){return s.id===sessionId});if(!session)return{ok:false,error:"Sesión no encontrada"};
    session.lastActivatedAt=iso();session.activationCount=Number(session.activationCount||0)+1;await saveSignalSessions(data.sessions,session.id);recordSignalDiagnostic("SIGNAL_SESSION_ACTIVATED",{sessionId:session.id,sourceOrigin:session.sourceKey,segmentCount:Number(session.segmentCount||0),mode:session.mode,profile:session.profile});
    broadcastSignalEvent({type:"signal.session.active",sessionId:session.id,session:signalSessionCopy(session,true),timestamp:iso()});if(audioStreamId)return startGroqCapture(session.id,audioStreamId);return{ok:true,session:signalSessionCopy(session,true)};
  }
  function updateSignalSession(message,sendResponse){loadSignalSessions().then(function(data){var s=data.sessions.find(function(x){return x.id===message.sessionId});if(!s)throw new Error("Sesión no encontrada");var p=message.patch||{};if(["CLIENTE","YO"].indexOf(p.activeSpeaker)>=0)s.activeSpeaker=p.activeSpeaker;if(p.view==="timeline"||p.view==="triptych")s.view=p.view;if(p.fontSize!=null)s.fontSize=Math.max(14,Math.min(34,Number(p.fontSize)||20));if(typeof p.autoScroll==="boolean")s.autoScroll=p.autoScroll;if(typeof p.compactDensity==="boolean")s.compactDensity=p.compactDensity;return saveSignalSessions(data.sessions,data.activeSessionId).then(function(){return{ok:true,session:signalSessionCopy(s)}})}).then(function(r){broadcastSignalEvent({type:"signal.session.updated",sessionId:message.sessionId,session:r.session,timestamp:iso()});sendResponse(r)}).catch(function(e){sendResponse({ok:false,error:String(e)})});}
  async function deleteSignalSession(message,sendResponse){try{var data=await loadSignalSessions(),id=message.sessionId||data.activeSessionId,idx=data.sessions.findIndex(function(x){return x.id===id}),session=idx>=0?data.sessions[idx]:null;if(!session)throw new Error("Sesión no encontrada");if(data.activeSessionId===id)await stopGroqCapture("session-delete");await KhoraTelemetryDB.clearSignalSession(id);data.sessions.splice(idx,1);var nextId=data.sessions.length?data.sessions[Math.max(0,Math.min(idx-1,data.sessions.length-1))].id:null;await saveSignalSessions(data.sessions,nextId);recordSignalDiagnostic("SIGNAL_SESSION_DELETED",{deletedSessionId:id,remainingSessions:data.sessions.length,activeSessionId:nextId});broadcastSignalEvent({type:"signal.session.deleted",sessionId:id,activeSessionId:nextId,session:nextId?signalSessionCopy(data.sessions.find(function(x){return x.id===nextId}),true):null,timestamp:iso()});sendResponse({ok:true,deletedSessionId:id,activeSessionId:nextId});}catch(error){recordSignalDiagnostic("SIGNAL_SESSION_DELETE_ERROR",{sessionId:message.sessionId||signalActiveSessionId,error:String(error)},"error");sendResponse({ok:false,error:String(error)})}}
  function addSignalSessionSegment(message,sendResponse){loadSignalSessions().then(function(data){var id=message.sessionId||data.activeSessionId,s=data.sessions.find(function(x){return x.id===id});if(!s)throw new Error("Sesión no encontrada");var text=String(message.text||"").trim();if(!text)throw new Error("Texto vacío");var seg={id:"manual-"+uid(),text:text.slice(0,12000),timestamp:iso(),reason:"manual",source:"manual",speaker:message.speaker==="YO"?"YO":"CLIENTE"};return persistSignalSegment(id,seg).then(function(x){if(!x.ok)throw new Error(x.dbError||x.cacheError||"No se pudo persistir");return{ok:true,session:x.session,segment:seg}})}).then(function(r){broadcastSignalEvent({type:"signal.transcript.segment",sessionId:r.session.id,manual:true,segment:r.segment,timestamp:r.segment.timestamp});sendResponse(r)}).catch(function(e){sendResponse({ok:false,error:String(e)})});}
  async function openSignalLiveWindow(audioStreamId,tabId,sourceUrl,sourceTitle){var targetUrl=chrome.runtime.getURL("ui/live.html");try{var session=await ensureSignalSession({tabId:tabId,sourceUrl:sourceUrl,title:sourceTitle}),windows=await chrome.windows.getAll({populate:true,windowTypes:["popup"]}),existing=windows.find(function(w){return Array.isArray(w.tabs)&&w.tabs.some(function(t){return String(t.url||"").split("#")[0].split("?")[0]===targetUrl})}),windowId=null;if(existing&&existing.id!=null){windowId=existing.id;await chrome.windows.update(windowId,{focused:true,state:"normal"})}else{var stored=await chrome.storage.local.get(["signalLiveBounds"]),b=stored.signalLiveBounds||{},d={url:targetUrl,type:"popup",focused:true,width:Number.isFinite(b.width)?b.width:760,height:Number.isFinite(b.height)?b.height:760};if(Number.isFinite(b.left))d.left=b.left;if(Number.isFinite(b.top))d.top=b.top;var created=await chrome.windows.create(d);windowId=created&&created.id||null}var activation=await activateSignalSession(session.id,audioStreamId||null);return{ok:!!windowId,windowId:windowId,reused:!!existing,session:activation.session||signalSessionCopy(session,true),audio:null,capture:activation};}catch(error){return{ok:false,error:String(error)}}}
  signalGroqQueue=Promise.resolve();
  chrome.runtime.onConnect.addListener(function(port){if(!port||port.name!=="signal-live-console")return;signalLivePort=port;signalLiveConsoleOpen=true;port.onDisconnect.addListener(function(){if(signalLivePort===port){signalLivePort=null;signalLiveConsoleOpen=false;}});});





  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message) return false;
    if(message.type==="SIGNAL_OBSERVATION_SYNC_NOW"){try{SignalObservationSync.flush("manual").then(function(r){sendResponse(r)}).catch(function(e){sendResponse({ok:false,error:String(e)})})}catch(e){sendResponse({ok:false,error:String(e)})}return true;}
    if (message.target === "offscreen" && message.type === "SIGNAL_GROQ_AUDIO_CHUNK") { handleGroqAudioChunk(message); return false; }
    if (message.target === "offscreen" && message.type === "SIGNAL_GROQ_CAPTURE_STATUS") { updateGroqCaptureState({status:String(message.status||"idle"),tabAudio:!!message.tabAudio,microphone:!!message.microphone,error:message.error||null,lastChunkAt:message.status==="connected"?null:undefined}).catch(function(){}); broadcastSignalEvent({type:"signal.groq.status",sessionId:signalActiveSessionId,status:message.status||"idle",tabAudio:!!message.tabAudio,microphone:!!message.microphone,error:message.error||null,timestamp:message.timestamp||iso()}); return false; }
    if (message.type === "OPEN_SIGNAL_LIVE_WINDOW") { recordSignalDiagnostic("SIGNAL_CONSOLE_OPEN_REQUESTED",{tabId:message.tabId||null,sourceUrl:message.sourceUrl||"",hasSuppliedStream:!!message.audioStreamId}); openSignalLiveWindow(message.audioStreamId||null,message.tabId||null,message.sourceUrl||"",message.sourceTitle||"").then(function(response){if(response&&response.ok)recordSignalDiagnostic("SIGNAL_CONSOLE_OPENED",{tabId:message.tabId||null,sourceUrl:message.sourceUrl||"",windowId:response.windowId,reused:!!response.reused,sessionId:response.session&&response.session.id||null,audioOk:!!(response.audio&&response.audio.ok)});else recordSignalDiagnostic("SIGNAL_CONSOLE_OPEN_ERROR",{tabId:message.tabId||null,error:response&&response.error||"unknown"},"error");sendResponse(response)}).catch(function(error){recordSignalDiagnostic("SIGNAL_CONSOLE_OPEN_EXCEPTION",{tabId:message.tabId||null,error:String(error)},"error");sendResponse({ok:false,error:String(error)});});return true; }
    if (message.type === "ACTIVATE_SIGNAL_SESSION") { activateSignalSession(message.sessionId,null).then(sendResponse);return true; }
    if (message.type === "UPDATE_SIGNAL_SESSION") { updateSignalSession(message,sendResponse);return true; }
    if (message.type === "DELETE_SIGNAL_SESSION") { deleteSignalSession(message,sendResponse);return true; }
    if (message.type === "ADD_SIGNAL_SESSION_SEGMENT") { addSignalSessionSegment(message,sendResponse);return true; }
    if (message.type === "EFFECTIF_EVENT") {
      var event = Object.assign({
        timestamp: iso(), tabId: sender.tab ? sender.tab.id : null,
        source: "content", level: "info"
      }, message.event || {});
      appendEvent(event, function () { sendResponse({ ok: true }); });
      if (event.action === "PLATFORM_SESSION_STARTED" || event.action === "PLATFORM_SESSION_ENDED") handleSession(event);
      if (event.action === "AVAILABILITY_STATE") handleAvailability(event);
      if (event.action === "INCOMING_DIALOG_DETECTED") markIncoming(event);
      if (event.action === "CONNECT_CLICKED") alertOnConnect(event);
      if (event.action === "CALL_ROUTE_ENTERED") startCall(event);
      if (event.action === "CALL_END_CLICKED") {
        var clickedSeconds = event.payload && event.payload.platformSeconds;
        closeCall("end-button", typeof clickedSeconds === "number" ? clickedSeconds : NaN, null);
      }
      if (event.action === "CALL_ROUTE_ENDED") {
        var seconds = event.payload && event.payload.platformSeconds;
        closeCall("route", typeof seconds === "number" ? seconds : NaN, null);
      }
      return true;
    }
    if (message.type === "EFFECTIF_TELEMETRY_STATS") {
      KhoraTelemetryDB.stats().then(function (stats) { sendResponse({ ok: true, stats: stats }); })
        .catch(function (error) { sendResponse({ ok: false, error: String(error) }); });
      return true;
    }
    if (message.type === "EFFECTIF_REFRESH_EXCHANGE_RATE") {
      refreshExchangeRate("manual").then(function (rate) { sendResponse({ ok: true, rate: rate }); })
        .catch(function (error) { sendResponse({ ok: false, error: String(error) }); });
      return true;
    }
    if (message.type === "EFFECTIF_TEST_SOUND") {
      playSound(message.volume).then(function () {
        record("ALERT_SOUND_TESTED", {}, "info", "popup"); sendResponse({ ok: true });
      }).catch(function (error) { sendResponse({ ok: false, error: String(error) }); });
      return true;
    }
    if (message.type === "EFFECTIF_PLATFORM_SNAPSHOT") {
      savePlatformSnapshot(message, sender, sendResponse); return true;
    }
    if (message.type === "EFFECTIF_END_CALL") {
      closeCall("manual", NaN, sendResponse); return true;
    }
     if(message.type==="SIGNAL_LIVE_CONSOLE_OPEN"){signalLiveConsoleOpen=true;sendResponse({ok:true});return false;}
    if(message.type==="SIGNAL_LIVE_CONSOLE_CLOSE"){signalLiveConsoleOpen=false;sendResponse({ok:true});return false;}
    if(message.type==="GET_SIGNAL_INTERPRETER_STATE"){
      Promise.all([chrome.storage.local.get(["effectifState"]),loadSignalSessions()]).then(function(results){
        var state=Object.assign(baseState(),results[0].effectifState||{}),data=results[1],active=data.sessions.find(function(s){return s.id===data.activeSessionId})||null;
        sendResponse({ok:true,groq:state.groqCapture||null,transcription:state.groqTranscript||null,sessions:data.sessions.map(function(s){return signalSessionCopy(s,false)}),activeSessionId:data.activeSessionId,transcript:active?active.segments.slice(-100):[],diagnostics:{runtimeStartedAt:state.telemetryHealth&&state.telemetryHealth.lastWriteAt||null,signalLiveConsoleOpen:signalLiveConsoleOpen}})
      }).catch(function(error){sendResponse({ok:false,error:String(error)})});return true;
    }
    if(message.type==="CLEAR_SIGNAL_INTERPRETER_TRANSCRIPT"){loadSignalSessions().then(async function(data){var id=message.sessionId||data.activeSessionId,s=data.sessions.find(function(x){return x.id===id});if(!s)throw new Error("Sesión no encontrada");await KhoraTelemetryDB.clearSignalSession(id);s.segments=[];s.segmentCount=0;return saveSignalSessions(data.sessions,id).then(function(){broadcastSignalEvent({type:"signal.transcript.clear",sessionId:id,timestamp:iso()});return{ok:true,session:signalSessionCopy(s,true)}})}).then(sendResponse).catch(function(error){sendResponse({ok:false,error:String(error)})});return true;}
    if(message.type==="SIGNAL_GROQ_CAPTURE_START"){startGroqCapture(message.sessionId||signalActiveSessionId,message.audioStreamId).then(sendResponse);return true;}
    if(message.type==="SIGNAL_GROQ_CAPTURE_STOP"){stopGroqCapture("live-ui").then(sendResponse);return true;}
    if(message.type==="EFFECTIF_START_TRANSCRIPTION"){sendResponse({ok:true,engine:"groq-whisper",global:true});return false;}
    if(message.type==="EFFECTIF_STOP_TRANSCRIPTION"){stopGroqCapture("effectif-control").then(sendResponse);return true;}
    if (message.type === "EFFECTIF_WORKER_PROBE" || message.type === "EFFECTIF_TEST_TRANSCRIPTION") {
      SignalGroqTranscriber.ready().then(function (configured) {
        sendResponse({ ok: true, engine: "groq-whisper", configured: !!configured, model: GROQ_MODEL });
      }).catch(function () {
        sendResponse({ ok: true, engine: "groq-whisper", configured: false, model: GROQ_MODEL });
      });
      return true;
    }
    if (message.type === "EFFECTIF_OPEN_SIDE_PANEL") {
      sendResponse({ ok: false, error: "Módulo reservado: no disponible en esta versión" }); return false;
    }
    if (message.type === "EFFECTIF_GROQ_USAGE") {
      updateGroqUsage(message); sendResponse({ ok: true }); return false;
    }
    return false;
  });
  var networkRequests = new Map();
  chrome.runtime.onInstalled.addListener(function(details){
    chrome.offscreen.closeDocument().catch(function(){});
    initialize().then(function(){try{SignalObservationSync.start()}catch(_){}}).catch(function(error){console.error("[SIGNAL-INTERPRETER] INIT_ERROR",error);});
    chrome.alarms.create("effectif-exchange-rate",{delayInMinutes:0.1,periodInMinutes:60});
    chrome.alarms.create("effectif-telemetry-maintenance",{delayInMinutes:1,periodInMinutes:60});
    chrome.alarms.create("signal-observation-sync",{delayInMinutes:0.5,periodInMinutes:2});
    refreshExchangeRate("installed").catch(function(){});
    if(details&&details.reason==="update"&&/^0\.4\./.test(String(details.previousVersion||"")))record("V050_TRANSCRIPTION_MIGRATION_ENABLED",{previousVersion:details.previousVersion,platformAudioAccess:true}, "info","background");
  });
  chrome.runtime.onStartup.addListener(function(){record("EXTENSION_RUNTIME_STARTED",{manifestVersion:chrome.runtime.getManifest().version},"info","runtime");});
  chrome.runtime.onSuspend.addListener(function(){log("info","EXTENSION_RUNTIME_SUSPENDING",{pendingNetworkRequests:networkRequests?networkRequests.size:0});});
  initialize().then(function(){try{SignalObservationSync.start()}catch(_){}}).catch(function(error){console.error("[SIGNAL-INTERPRETER] INIT_ERROR",error);});
  chrome.alarms.create("effectif-exchange-rate",{delayInMinutes:0.1,periodInMinutes:60});
  chrome.alarms.create("effectif-telemetry-maintenance",{delayInMinutes:1,periodInMinutes:60});
  refreshExchangeRate("startup").catch(function(){});
  chrome.alarms.onAlarm.addListener(function(alarm){
    if(!alarm)return;
    if(alarm.name==="effectif-exchange-rate"){refreshExchangeRate("alarm").catch(function(){});return;}
    if(alarm.name==="effectif-telemetry-maintenance"){
      chrome.storage.local.get(["effectifConfig"],async function(stored){
        var config=Object.assign({},DEFAULT_CONFIG,stored.effectifConfig||{});
        try{var pruned=await KhoraTelemetryDB.prune({retentionDays:config.telemetryRetentionDays,maxEvents:config.telemetryMaxEvents}),stats=await KhoraTelemetryDB.stats(),health=Object.assign({},(await chrome.storage.local.get(["effectifTelemetryHealth"])).effectifTelemetryHealth||{},{lastMaintenanceAt:iso(),stats:stats});await chrome.storage.local.set({effectifTelemetryHealth:health});record("TELEMETRY_MAINTENANCE",{pruned:pruned,stats:stats},"info","background");}catch(error){record("TELEMETRY_MAINTENANCE_ERROR",{message:String(error)},"error","background");}
      });
      return;
    }
    if(alarm.name!=="effectif-pending-call")return;
    mutateState(async function(state){
      if(!state.pendingCall||state.callId)return;
      var clickedAt=state.pendingCall.clickedAt||(state.lastConnectAt&&Math.abs(Date.parse(state.lastConnectAt)-Date.parse(state.pendingCall.detectedAt))<=2000?state.lastConnectAt:null);
      var missed={id:state.pendingCall.id||uid(),detectedAt:state.pendingCall.detectedAt,clickedAt:clickedAt,classifiedAt:iso(),modality:state.pendingCall.modality||"OPI",reason:clickedAt?"connect_clicked_no_call_route":"dialog_expired_before_click"};
      state.missedCalls=Number(state.missedCalls||0)+1;state.dailyMissedCalls=Object.assign({},state.dailyMissedCalls||{});var day=localDay(missed.detectedAt||iso());state.dailyMissedCalls[day]=Number(state.dailyMissedCalls[day]||0)+1;state.missedCallRecords=(state.missedCallRecords||[]).concat(missed).slice(-1000);state.pendingCall=null;record("MISSED_CALL_CLASSIFIED",missed,"warn","alarm");
    });
  });
  function sanitizedRequestUrl(raw) {
    try {
      var url = new URL(raw);
      return url.origin + url.pathname
        .replace(/\/call\/[^/]+/g, "/call/<ID>")
        .replace(/\/profile\/[^/]+/g, "/profile/<ID>")
        .slice(0, 500);
    } catch (_) { return "[INVALID_URL]"; }
  }
  chrome.webRequest.onBeforeRequest.addListener(function (details) {
    if (!cachedConfig.observationEnabled || !cachedConfig.networkTelemetryEnabled) return;
    networkRequests.set(details.requestId, { at: Date.now(), method: details.method, type: details.type, url: sanitizedRequestUrl(details.url), tabId: details.tabId });
    if (networkRequests.size > 5000) networkRequests.delete(networkRequests.keys().next().value);
  }, { urls: ["https://app.cloudinterpreter.com/*"] });
  chrome.webRequest.onCompleted.addListener(function (details) {
    var started = networkRequests.get(details.requestId); networkRequests.delete(details.requestId);
    if (!started) return;
    record("NETWORK_REQUEST_COMPLETED", {
      method: started.method, type: started.type, url: started.url, tabId: started.tabId,
      statusCode: details.statusCode, fromCache: !!details.fromCache,
      durationMs: Math.max(0, Date.now() - started.at)
    }, details.statusCode >= 400 ? "warn" : "info", "webRequest");
  }, { urls: ["https://app.cloudinterpreter.com/*"] });
  chrome.webRequest.onErrorOccurred.addListener(function (details) {
    var started = networkRequests.get(details.requestId); networkRequests.delete(details.requestId);
    if (!started) return;
    record("NETWORK_REQUEST_ERROR", { method: started.method, type: started.type, url: started.url, tabId: started.tabId, error: details.error, durationMs: Math.max(0, Date.now() - started.at) }, "warn", "webRequest");
  }, { urls: ["https://app.cloudinterpreter.com/*"] });
  chrome.windows.onRemoved.addListener(function () {});
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "local" && changes.effectifConfig) {
      cachedConfig = Object.assign({}, DEFAULT_CONFIG, changes.effectifConfig.newValue || {});
    }
  });

  chrome.commands.onCommand.addListener(function (command) {
    if (command !== "toggle-auto-answer") return;
    chrome.storage.local.get(["effectifConfig"], function (stored) {
      var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {});
      config.autoAnswerEnabled = !config.autoAnswerEnabled;
      chrome.storage.local.set({ effectifConfig: config });
      record(config.autoAnswerEnabled ? "AUTO_ANSWER_ENABLED" : "AUTO_ANSWER_DISABLED", {}, "info", "keyboard");
    });
  });
  function routeShape(url) {
    try {
      return new URL(url).pathname
        .replace(/^\/call\/[^/]+/, "/call/<ID>")
        .replace(/^\/profile\/[^/]+/, "/profile/<ID>");
    } catch (_) { return ""; }
  }
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var url = changeInfo.url || tab.url || "";
    if (!/^https:\/\/app\.cloudinterpreter\.com\//.test(url)) return;
    if (changeInfo.url || changeInfo.status === "complete") {
      record("TAB_LIFECYCLE", {
        tabId: tabId, status: changeInfo.status || "url-change",
        route: routeShape(url), active: !!tab.active
      }, "info", "tabs");
    }
  });
  chrome.tabs.onRemoved.addListener(function(tabId){
    loadSignalSessions().then(function(data){var active=data.sessions.find(function(s){return s.id===data.activeSessionId});if(active&&Number(active.sourceTabId)===Number(tabId))stopGroqCapture("source-tab-closed").catch(function(){})}).catch(function(){});
  });
})();
