importScripts("telemetry-db.js");
(function () {
  "use strict";

  /* Paquete preliminar privado por instrucción expresa del operador. */
  var GROQ_API_KEY = ""; /* Nunca incrustar credenciales en el paquete. */
  var GROQ_MODEL = "whisper-large-v3-turbo";
  var GROQ_USD_PER_AUDIO_HOUR = 0.04;
  var TRANSCRIPTION_MODULE_AVAILABLE = false;
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
    transcriptionAvailable: false,
    transcriptionEnabled: false,
    transcriptionMode: "auto",
    localWhisperModel: "large-v3-turbo",
    selectedMicrophoneId: "",
    selectedSpeakerId: "",
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
    groqApiKey: "",
    groqModel: GROQ_MODEL,
    groqEstimatedUsdPerAudioHour: GROQ_USD_PER_AUDIO_HOUR
  };
  var offscreenCreation = null;
  var eventQueue = Promise.resolve();
  var stateQueue = Promise.resolve();
  var cachedConfig = Object.assign({}, DEFAULT_CONFIG);

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
      signalInterpreterBridge:{status:"disconnected",url:"ws://127.0.0.1:8787/",connectedAt:null,lastHeartbeat:null,captionActive:false,error:null},
      signalInterpreterTranscript:{active:false,segments:0,lastTimestamp:null},
      eventSequence:0,
      telemetryHealth: { dbWrites: 0, dbErrors: 0, lastWriteAt: null, lastMaintenanceAt: null }
    };
  }
  function log(level, action, payload) {
    try {
      console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
        "[SIGNAL-INTERPRETER]", iso(), action, payload || {}
      );
    } catch (_) {}
  }
  function appendEvent(input, callback) {
    eventQueue = eventQueue.then(async function () {
      var stored = await chrome.storage.local.get(["effectifEvents", "effectifEventSequence", "effectifTelemetryHealth"]);
      var sequence = Number(stored.effectifEventSequence || 0) + 1;
      var event = Object.assign({
        schema: "khora-effectif-event/v3", id: uid(), sequence: sequence,
        timestamp: iso(), level: "info", source: "background",
        extensionVersion: chrome.runtime.getManifest().version
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
      if (callback) callback(event);
    }).catch(function (error) {
      console.error("[SIGNAL-INTERPRETER] EVENT_LOG_ERROR", String(error));
    });
  }
  function record(action, payload, level, source) {
    appendEvent({ action: action, payload: payload || {}, level: level || "info", source: source || "background" });
  }
  function mutateState(mutator) {
    stateQueue = stateQueue.then(async function () {
      var stored = await chrome.storage.local.get(["effectifState", "effectifConfig"]);
      var state = Object.assign(baseState(), stored.effectifState || {});
      var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {});
      await mutator(state, config);
      await chrome.storage.local.set({ effectifState: state });
      return state;
    }).catch(function (error) {
      record("STATE_MUTATION_ERROR", { message: String(error) }, "error", "background");
    });
    return stateQueue;
  }
  async function initialize() {
    var stored = await chrome.storage.local.get(["effectifConfig", "effectifState", "effectifEvents", "effectifTelemetryMigrated"]);
    var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {}, { transcriptionAvailable: false, transcriptionEnabled: false });
    cachedConfig = config;
    var state = Object.assign(baseState(), stored.effectifState || {}, {
      transcriptionActive: false,
      transcriptionTabId: null,
      transcriptionStatus: { phase: "dormant", connected: false, engine: null }
    });
    await chrome.storage.local.set({ effectifConfig: config, effectifState: state });
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
        justification:"Reproducir alertas y analizar localmente el audio de una pestaña para estimar número de voces."
      }).finally(function(){offscreenCreation=null});
    }
    await offscreenCreation;
  }
  async function startSignalAudioAnalysis(streamId,tabId){
    if(!streamId)return{ok:false,error:"Falta streamId"};
    try{
      await ensureOffscreen();
      var response=await chrome.runtime.sendMessage({target:"offscreen",type:"SIGNAL_START_AUDIO_ANALYSIS",streamId:streamId,tabId:tabId||null});
      return response||{ok:false,error:"Sin respuesta del analizador"};
    }catch(error){return{ok:false,error:String(error)}}
  }
  async function stopSignalAudioAnalysis(){
    try{await chrome.runtime.sendMessage({target:"offscreen",type:"SIGNAL_STOP_AUDIO_ANALYSIS"});return{ok:true}}
    catch(error){return{ok:false,error:String(error)}}
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
        record("TRANSCRIPTION_MODULE_DORMANT", { callId: callId, availableInCurrentVersion: false }, "info", "background");
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
        chrome.runtime.sendMessage({ target: "offscreen", type: "EFFECTIF_STOP_LOCAL_TRANSCRIPTION", reason: "call-ended" }).catch(function () {});
        state.transcriptionActive = false;
        state.transcriptionTabId = null;
        state.transcriptionStatus = { phase: "stopped", connected: true, engine: null };
        chrome.runtime.sendMessage({ type: "EFFECTIF_TRANSCRIPT_CLEAR" }).catch(function () {});
      }
      state.callStartedAt = null; state.callId = null; state.callModality = null;
      record("CALL_TIMER_STOPPED", call, "info", source);
      if (sendResponse) sendResponse({ ok: true, call: call });
    });
  }
  async function startTranscription(tabId, callId, sendResponse) {
    try {
      var stored = await chrome.storage.local.get(["effectifConfig"]);
      var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {});
      if (!config.transcriptionAvailable || !config.transcriptionEnabled) {
        if (sendResponse) sendResponse({ ok: false, error: "Módulo reservado: no disponible en esta versión" });
        return;
      }
      await ensureOffscreen();
      var response = await chrome.runtime.sendMessage({
        target: "offscreen", type: "EFFECTIF_START_LOCAL_TRANSCRIPTION",
        tabId: tabId, callId: callId,
        apiKey: config.groqApiKey || GROQ_API_KEY,
        mode: config.transcriptionMode || "auto",
        localModel: config.localWhisperModel || "large-v3-turbo",
        groqModel: config.groqModel || GROQ_MODEL,
        microphoneId: config.selectedMicrophoneId || "",
        speakerId: config.selectedSpeakerId || ""
      });
      if (!response || !response.ok) throw new Error(response && response.error || "Motor no iniciado");
      await mutateState(async function (state) {
        state.transcriptionActive = true;
        state.transcriptionTabId = tabId;
        state.transcriptionStatus = {
          phase: "starting", connected: true, engine: null,
          platformAudioModified: false
        };
      });
      record("TRANSCRIPTION_STARTED", {
        tabId: tabId, callId: callId, mode: config.transcriptionMode,
        platformAudioAccess: false, platformAudioModified: false
      }, "info", "background");
      if (sendResponse) sendResponse({ ok: true });
    } catch (error) {
      record("TRANSCRIPTION_START_ERROR", {
        tabId: tabId, callId: callId, message: String(error),
        platformAudioModified: false
      }, "error", "background");
      if (sendResponse) sendResponse({ ok: false, error: String(error) });
    }
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


  var SIGNAL_BRIDGE_URL="ws://127.0.0.1:8787/";
  var signalBridgeSocket=null,signalBridgeReconnectTimer=null,signalBridgeReconnectDelay=500;
  var signalActiveSessionId=null,signalLastSpeakerId=null,signalLastSpeakerAt=0,signalLastActivityLogAt=0,signalLiveConsoleOpen=false;
  function recordSignalDiagnostic(action,payload,level,source){record(action,Object.assign({sessionId:signalActiveSessionId},payload||{}),level||"info",source||"signal-bridge");}

  function normalizeSignalSessionUrl(rawUrl){
    try{var u=new URL(String(rawUrl||""));u.hash="";return u.toString()}catch(_){return String(rawUrl||"")}
  }
  function normalizeSignalSession(s){
    s=Object.assign({id:uid(),sourceKey:"",sourceUrl:"",title:"Sesión",sourceTabId:null,createdAt:iso(),lastActivatedAt:null,segments:[],segmentCount:0,activeSpeaker:"CLIENTE",view:"timeline",fontSize:20,autoScroll:true,compactDensity:false,voiceMap:{A:"CLIENTE",B:"PROFESIONAL"}},s||{});
    s.sourceKey=String(s.sourceKey||normalizeSignalSessionUrl(s.sourceUrl));s.segments=Array.isArray(s.segments)?s.segments.slice(-100):[];s.segmentCount=Math.max(Number(s.segmentCount)||0,s.segments.length);
    return s
  }
  function signalSessionCopy(s,includeSegments){var copy=normalizeSignalSession(s);if(!includeSegments)copy.segments=[];return JSON.parse(JSON.stringify(copy))}
  async function loadSignalSessions(){
    var stored=await chrome.storage.local.get(["signalInterpreterSessions","signalInterpreterActiveSessionId"]);
    return{sessions:(Array.isArray(stored.signalInterpreterSessions)?stored.signalInterpreterSessions:[]).map(normalizeSignalSession),activeSessionId:stored.signalInterpreterActiveSessionId||null}
  }
  async function saveSignalSessions(sessions,activeSessionId){
    await chrome.storage.local.set({signalInterpreterSessions:sessions,signalInterpreterActiveSessionId:activeSessionId||null});
    signalActiveSessionId=activeSessionId||null;
  }
  async function ensureSignalSession(info){
    var sourceKey=normalizeSignalSessionUrl(info&&info.sourceUrl||"");
    var data=await loadSignalSessions(),session=data.sessions.find(function(s){return s.sourceKey===sourceKey});
    if(!session){
      session=normalizeSignalSession({sourceKey:sourceKey,sourceUrl:sourceKey,title:info&&info.title||"Sesión",sourceTabId:info&&info.tabId!=null?info.tabId:null,createdAt:iso(),lastActivatedAt:iso()});
      data.sessions.push(session);if(data.sessions.length>50)data.sessions=data.sessions.slice(-50)
    }else{
      if(info&&info.tabId!=null)session.sourceTabId=info.tabId;
      if(info&&String(info.title||"").trim())session.title=String(info.title).trim().slice(0,140);
      session.lastActivatedAt=iso();
    }
    await saveSignalSessions(data.sessions,session.id);return session
  }
  async function persistSignalSegment(sessionId,segment){
    var data=await loadSignalSessions(),session=data.sessions.find(function(s){return s.id===sessionId});if(!session){recordSignalDiagnostic("SIGNAL_SEGMENT_PERSIST_ERROR",{reason:"session-not-found",sessionId:sessionId},"error");return{ok:false,error:"Sesión no encontrada"}}
    var storedSegment=Object.assign({},segment,{sessionId:sessionId});
    var dbOk=false,cacheOk=false,dbError=null,cacheError=null;
    try{await KhoraTelemetryDB.putSignalSegment(storedSegment);dbOk=true;recordSignalDiagnostic("SIGNAL_SEGMENT_PERSISTED",{sessionId:sessionId,segmentId:segment.id,sequence:segment.sequence||null,characters:String(segment.text||"").length});}
    catch(error){dbError=String(error);recordSignalDiagnostic("SIGNAL_SEGMENT_PERSIST_ERROR",{sessionId:sessionId,segmentId:segment.id,error:dbError},"error")}
    session.segments=(session.segments||[]).concat(segment).slice(-100);session.segmentCount=Math.max(0,Number(session.segmentCount||0))+(dbOk?1:0);
    try{await saveSignalSessions(data.sessions,data.activeSessionId||sessionId);cacheOk=true}
    catch(error){cacheError=String(error);recordSignalDiagnostic("SIGNAL_SESSION_CACHE_ERROR",{sessionId:sessionId,error:cacheError},"error")}
    return{ok:dbOk||cacheOk,dbOk:dbOk,cacheOk:cacheOk,dbError:dbError,cacheError:cacheError,session:signalSessionCopy(session,true)}
  }
  async function activateSignalSession(sessionId,audioStreamId){
    var data=await loadSignalSessions(),session=data.sessions.find(function(s){return s.id===sessionId});if(!session)return{ok:false,error:"Sesión no encontrada"};
    recordSignalDiagnostic("SIGNAL_SESSION_ACTIVATION_REQUESTED",{sessionId:sessionId,sourceTabId:session.sourceTabId,hasSuppliedStream:!!audioStreamId});
    session.lastActivatedAt=iso();session.activationCount=Number(session.activationCount||0)+1;await saveSignalSessions(data.sessions,session.id);signalLastSpeakerId=null;signalLastSpeakerAt=0;
    try{var persisted=await KhoraTelemetryDB.getSignalSegments(session.id,200);if(persisted.length){session.segments=persisted.slice(-100);session.segmentCount=Math.max(Number(session.segmentCount||0),persisted.length);await saveSignalSessions(data.sessions,session.id)}recordSignalDiagnostic("SIGNAL_SESSION_HISTORY_LOADED",{sessionId:session.id,count:persisted.length});}catch(error){recordSignalDiagnostic("SIGNAL_SESSION_HISTORY_LOAD_ERROR",{sessionId:session.id,error:String(error)},"warn")}
    var audio={ok:false,error:null},streamId=audioStreamId||null;
    try{
      await stopSignalAudioAnalysis();recordSignalDiagnostic("SIGNAL_AUDIO_CAPTURE_PREPARED",{sessionId:session.id,sourceTabId:session.sourceTabId,hasSuppliedStream:!!streamId});
      if(!streamId&&session.sourceTabId!=null){recordSignalDiagnostic("SIGNAL_TAB_CAPTURE_REQUESTED",{sessionId:session.id,sourceTabId:session.sourceTabId});streamId=await chrome.tabCapture.getMediaStreamId({targetTabId:session.sourceTabId})}
      if(streamId){recordSignalDiagnostic("SIGNAL_AUDIO_CAPTURE_START_REQUESTED",{sessionId:session.id,sourceTabId:session.sourceTabId,streamIdPresent:true});audio=await startSignalAudioAnalysis(streamId,session.sourceTabId)}else audio={ok:false,error:"No hay pestaña origen disponible para captura acústica"}
    }catch(error){audio={ok:false,error:String(error)}}
    if(audio.ok)recordSignalDiagnostic("SIGNAL_AUDIO_CAPTURE_STARTED",{sessionId:session.id,sourceTabId:session.sourceTabId});else recordSignalDiagnostic("SIGNAL_AUDIO_CAPTURE_ERROR",{sessionId:session.id,sourceTabId:session.sourceTabId,error:audio.error||"unknown"},"error");
    recordSignalDiagnostic("SIGNAL_SESSION_ACTIVATED",{sessionId:session.id,segmentCount:Number(session.segmentCount||0),audioOk:!!audio.ok});
    broadcastSignalEvent({type:"signal.session.active",sessionId:session.id,session:signalSessionCopy(session,true),audio:audio,timestamp:iso()});
    return{ok:true,session:signalSessionCopy(session,true),audio:audio}
  }
  function updateSignalSession(message,sendResponse){
    loadSignalSessions().then(function(data){
      var s=data.sessions.find(function(x){return x.id===message.sessionId});if(!s)throw new Error("Sesión no encontrada");
      var p=message.patch||{};
      if(["CLIENTE","PROFESIONAL","YO"].indexOf(p.activeSpeaker)>=0)s.activeSpeaker=p.activeSpeaker;
      if(p.view==="timeline"||p.view==="triptych")s.view=p.view;
      if(p.fontSize!=null)s.fontSize=Math.max(14,Math.min(34,Number(p.fontSize)||20));
      if(typeof p.autoScroll==="boolean")s.autoScroll=p.autoScroll;
      if(typeof p.compactDensity==="boolean")s.compactDensity=p.compactDensity;
      if(p.voiceMap)s.voiceMap={A:p.voiceMap.A==="PROFESIONAL"?"PROFESIONAL":"CLIENTE",B:p.voiceMap.B==="CLIENTE"?"CLIENTE":"PROFESIONAL"};
      return saveSignalSessions(data.sessions,data.activeSessionId).then(function(){return{ok:true,session:signalSessionCopy(s)}})
    }).then(function(r){broadcastSignalEvent({type:"signal.session.updated",sessionId:message.sessionId,session:r.session,timestamp:iso()});sendResponse(r)}).catch(function(e){sendResponse({ok:false,error:String(e)})})
  }
  function addSignalSessionSegment(message,sendResponse){
    loadSignalSessions().then(function(data){
      var id=message.sessionId||data.activeSessionId,s=data.sessions.find(function(x){return x.id===id});if(!s)throw new Error("Sesión no encontrada");
      var text=String(message.text||"").trim();if(!text)throw new Error("Texto vacío");
      var seg={id:"manual-"+uid(),text:text.slice(0,12000),timestamp:iso(),reason:"manual",source:"manual",speaker:message.speaker==="YO"?"YO":"CLIENTE"};
      return persistSignalSegment(id,seg).then(function(persisted){
        if(!persisted.ok)throw new Error((persisted.dbError||persisted.cacheError)||"No se pudo persistir el segmento");
        return{ok:true,session:persisted.session,segment:seg}
      })
    }).then(function(r){broadcastSignalEvent({type:"caption.segment",sessionId:message.sessionId||r.session.id,manual:true,speaker:r.segment.speaker,segmentId:r.segment.id,text:r.segment.text,timestamp:r.segment.timestamp,reason:"manual",source:"manual"});sendResponse(r)}).catch(function(e){sendResponse({ok:false,error:String(e)})})
  }
  function updateSignalBridgeState(patch){chrome.storage.local.get(["effectifState"]).then(function(stored){var state=Object.assign(baseState(),stored.effectifState||{});state.signalInterpreterBridge=Object.assign({},state.signalInterpreterBridge||{},patch||{});return chrome.storage.local.set({effectifState:state})}).catch(function(error){recordSignalDiagnostic("SIGNAL_BRIDGE_STATE_ERROR",{message:String(error)},"warn")})}
  function broadcastSignalEvent(event){chrome.runtime.sendMessage({type:"SIGNAL_INTERPRETER_EVENT",event:event}).catch(function(error){if(signalLiveConsoleOpen)recordSignalDiagnostic("SIGNAL_LIVE_BROADCAST_ERROR",{eventType:event&&event.type,error:String(error)},"warn")})}
  function handleSignalBridgeEvent(event){
    if(!event||!event.type){recordSignalDiagnostic("SIGNAL_BRIDGE_EVENT_INVALID",{hasEvent:!!event},"warn");return}var sessionId=signalActiveSessionId,now=Date.now();
    var meta={eventType:event.type,sessionId:sessionId,sequence:event.sequence!=null?event.sequence:null,status:event.status||null,speakerId:event.speakerId||null,reason:event.reason||null,source:event.source||null,characters:typeof event.text==="string"?event.text.length:null};
    if(event.type!=="speaker.activity"||now-signalLastActivityLogAt>=1500){if(event.type==="speaker.activity")signalLastActivityLogAt=now;recordSignalDiagnostic("SIGNAL_BRIDGE_EVENT_RECEIVED",meta,event.type==="caption.status"&&event.status!=="found"?"warn":"info")}
    if(event.type==="speaker.activity"){signalLastSpeakerId=event.speakerId||null;signalLastSpeakerAt=now;broadcastSignalEvent(Object.assign({},event,{sessionId:sessionId}));return}
    if(event.type==="speaker.count"||event.type==="audio.status"){broadcastSignalEvent(Object.assign({},event,{sessionId:sessionId}));return}
    if(event.type==="bridge.connected"){signalBridgeReconnectDelay=500;updateSignalBridgeState({status:"connected",url:SIGNAL_BRIDGE_URL,connectedAt:event.timestamp||iso(),error:null})}
    else if(event.type==="bridge.heartbeat"){updateSignalBridgeState({status:"connected",lastHeartbeat:event.timestamp||iso(),error:null})}
    else if(event.type==="caption.status"){updateSignalBridgeState({status:"connected",captionActive:event.status==="found",error:null});recordSignalDiagnostic("SIGNAL_CAPTION_STATUS",{status:event.status||"unknown",sessionId:sessionId},event.status==="found"?"info":"warn")}
    else if(event.type==="caption.segment"&&typeof event.text==="string"){
      var text=event.text.trim();if(!text){recordSignalDiagnostic("SIGNAL_CAPTION_EMPTY",{sessionId:sessionId,sequence:event.sequence!=null?event.sequence:null},"warn");broadcastSignalEvent(Object.assign({},event,{sessionId:sessionId}));return}
      var captionEvent=Object.assign({},event,{sessionId:sessionId});if(signalLastSpeakerId&&now-signalLastSpeakerAt<=1600)captionEvent.speakerId=signalLastSpeakerId;
      var segment={id:"signal-"+sessionId+"-"+(event.sequence!=null?event.sequence:Date.now())+"-"+Date.now(),sequence:event.sequence!=null?event.sequence:null,text:text.slice(0,12000),timestamp:event.timestamp||iso(),reason:event.reason||"stable",source:event.source||"live-caption",speakerId:captionEvent.speakerId||null};
      recordSignalDiagnostic("SIGNAL_CAPTION_SEGMENT_RECEIVED",{sessionId:sessionId,segmentId:segment.id,sequence:segment.sequence,characters:segment.text.length,speakerId:segment.speakerId,reason:segment.reason,source:segment.source},"info");
      if(sessionId)persistSignalSegment(sessionId,segment).catch(function(error){recordSignalDiagnostic("SIGNAL_SEGMENT_PERSIST_UNHANDLED",{sessionId:sessionId,error:String(error)},"error")});
      else recordSignalDiagnostic("SIGNAL_CAPTION_DROPPED_NO_SESSION",{characters:segment.text.length},"error");
      broadcastSignalEvent(captionEvent);return
    }
    broadcastSignalEvent(Object.assign({},event,{sessionId:sessionId}))
  }
  function scheduleSignalBridgeReconnect(){var delay=signalBridgeReconnectDelay;clearTimeout(signalBridgeReconnectTimer);recordSignalDiagnostic("SIGNAL_BRIDGE_RECONNECT_SCHEDULED",{delayMs:delay},"warn");signalBridgeReconnectTimer=setTimeout(connectSignalBridge,delay);signalBridgeReconnectDelay=Math.min(signalBridgeReconnectDelay*2,15000);}
  function connectSignalBridge(){
    if(signalBridgeSocket&&(signalBridgeSocket.readyState===WebSocket.OPEN||signalBridgeSocket.readyState===WebSocket.CONNECTING))return;
    clearTimeout(signalBridgeReconnectTimer);updateSignalBridgeState({status:"connecting",url:SIGNAL_BRIDGE_URL,error:null});
    try{signalBridgeSocket=new WebSocket(SIGNAL_BRIDGE_URL);}catch(error){updateSignalBridgeState({status:"error",error:String(error)});scheduleSignalBridgeReconnect();return;}
    signalBridgeSocket.addEventListener("open",function(){signalBridgeReconnectDelay=500;updateSignalBridgeState({status:"connected",url:SIGNAL_BRIDGE_URL,connectedAt:iso(),error:null});recordSignalDiagnostic("SIGNAL_BRIDGE_CONNECTED",{url:SIGNAL_BRIDGE_URL});});
    signalBridgeSocket.addEventListener("message",function(message){try{var parsed=JSON.parse(message.data);handleSignalBridgeEvent(parsed);}catch(error){updateSignalBridgeState({status:"error",error:"JSON inválido del Signal Interpreter Bridge"});recordSignalDiagnostic("SIGNAL_BRIDGE_MESSAGE_ERROR",{message:String(error),dataType:typeof message.data,dataLength:typeof message.data==="string"?message.data.length:null},"error")}});
    signalBridgeSocket.addEventListener("error",function(){updateSignalBridgeState({status:"error",error:"No se pudo conectar con Signal Interpreter Bridge"});recordSignalDiagnostic("SIGNAL_BRIDGE_SOCKET_ERROR",{url:SIGNAL_BRIDGE_URL},"error");});
    signalBridgeSocket.addEventListener("close",function(event){signalBridgeSocket=null;updateSignalBridgeState({status:"disconnected",captionActive:false});recordSignalDiagnostic("SIGNAL_BRIDGE_CLOSED",{code:event&&event.code!=null?event.code:null,reason:event&&event.reason?String(event.reason).slice(0,200):null},"warn");scheduleSignalBridgeReconnect();});
  }
  chrome.runtime.onInstalled.addListener(function (details) {
    chrome.offscreen.closeDocument().catch(function () {});
    initialize().then(function(){connectSignalBridge();}).catch(function(error){console.error("[SIGNAL-INTERPRETER] INIT_ERROR",error);});
    chrome.alarms.create("effectif-exchange-rate", { delayInMinutes: 0.1, periodInMinutes: 60 });
    chrome.alarms.create("effectif-telemetry-maintenance", { delayInMinutes: 1, periodInMinutes: 60 });
    refreshExchangeRate("installed").catch(function () {});
    if (details && details.reason === "update" &&
        /^0\.4\./.test(String(details.previousVersion || ""))) {
      chrome.storage.local.get(["effectifConfig"], function (stored) {
        chrome.storage.local.set({
          effectifConfig: Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {}, {
            transcriptionAvailable: false,
            transcriptionEnabled: false
          })
        });
        record("V050_TRANSCRIPTION_MIGRATION_ENABLED", {
          previousVersion: details.previousVersion,
          platformAudioAccess: false
        }, "info", "background");
      });
    }
  });
  chrome.runtime.onStartup.addListener(function () { record("EXTENSION_RUNTIME_STARTED", { manifestVersion: chrome.runtime.getManifest().manifest_version }, "info", "runtime"); connectSignalBridge(); });
  chrome.runtime.onSuspend.addListener(function () {
    log("info", "EXTENSION_RUNTIME_SUSPENDING", { pendingNetworkRequests: networkRequests ? networkRequests.size : 0 });
  });
  initialize().then(function(){connectSignalBridge();}).catch(function(error){console.error("[SIGNAL-INTERPRETER] INIT_ERROR",error);});
  chrome.alarms.create("effectif-exchange-rate", { delayInMinutes: 0.1, periodInMinutes: 60 });
  chrome.alarms.create("effectif-telemetry-maintenance", { delayInMinutes: 1, periodInMinutes: 60 });
  refreshExchangeRate("startup").catch(function () {});
  chrome.alarms.onAlarm.addListener(function (alarm) {
    if (!alarm) return;
    if (alarm.name === "effectif-exchange-rate") { refreshExchangeRate("alarm").catch(function () {}); return; }
    if (alarm.name === "effectif-telemetry-maintenance") {
      chrome.storage.local.get(["effectifConfig"], async function (stored) {
        var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {});
        try {
          var pruned = await KhoraTelemetryDB.prune({ retentionDays: config.telemetryRetentionDays, maxEvents: config.telemetryMaxEvents });
          var stats = await KhoraTelemetryDB.stats();
          var health = Object.assign({}, (await chrome.storage.local.get(["effectifTelemetryHealth"])).effectifTelemetryHealth || {}, {
            lastMaintenanceAt: iso(), stats: stats
          });
          await chrome.storage.local.set({ effectifTelemetryHealth: health });
          record("TELEMETRY_MAINTENANCE", { pruned: pruned, stats: stats }, "info", "background");
        } catch (error) { record("TELEMETRY_MAINTENANCE_ERROR", { message: String(error) }, "error", "background"); }
      });
      return;
    }
    if (alarm.name !== "effectif-pending-call") return;
    mutateState(async function (state) {
      if (!state.pendingCall || state.callId) return;
      var clickedAt = state.pendingCall.clickedAt || (
        state.lastConnectAt &&
        Math.abs(Date.parse(state.lastConnectAt) - Date.parse(state.pendingCall.detectedAt)) <= 2000
          ? state.lastConnectAt : null
      );
      var missed = {
        id: state.pendingCall.id || uid(),
        detectedAt: state.pendingCall.detectedAt,
        clickedAt: clickedAt,
        classifiedAt: iso(),
        modality: state.pendingCall.modality || "OPI",
        reason: clickedAt ? "connect_clicked_no_call_route" : "dialog_expired_before_click"
      };
      state.missedCalls = Number(state.missedCalls || 0) + 1;
      state.dailyMissedCalls = Object.assign({}, state.dailyMissedCalls || {});
      var day = localDay(missed.detectedAt || iso());
      state.dailyMissedCalls[day] = Number(state.dailyMissedCalls[day] || 0) + 1;
      state.missedCallRecords = (state.missedCallRecords || []).concat(missed).slice(-1000);
      state.pendingCall = null;
      record("MISSED_CALL_CLASSIFIED", missed, "warn", "alarm");
    });
  });
  async function openSignalLiveWindow(audioStreamId,tabId,sourceUrl,sourceTitle){
    var targetUrl=chrome.runtime.getURL("ui/live.html");
    try{
      var session=await ensureSignalSession({tabId:tabId||null,sourceUrl:sourceUrl||"",title:sourceTitle||""});
      var windows=await chrome.windows.getAll({populate:true,windowTypes:["popup"]});
      var existing=windows.find(function(win){return Array.isArray(win.tabs)&&win.tabs.some(function(tab){return String(tab.url||"").split("#")[0].split("?")[0]===targetUrl})});
      var windowId=null;
      if(existing&&existing.id!=null){windowId=existing.id;await chrome.windows.update(windowId,{focused:true,state:"normal"})}
      else{
        var stored=await chrome.storage.local.get(["signalLiveBounds"]),bounds=stored.signalLiveBounds||{},createData={url:targetUrl,type:"popup",focused:true,width:Number.isFinite(bounds.width)?bounds.width:760,height:Number.isFinite(bounds.height)?bounds.height:760};
        if(Number.isFinite(bounds.left))createData.left=bounds.left;if(Number.isFinite(bounds.top))createData.top=bounds.top;var created=await chrome.windows.create(createData);windowId=created&&created.id||null
      }
      var activation=await activateSignalSession(session.id,audioStreamId||null);
      broadcastSignalEvent({type:"signal.session.updated",sessionId:session.id,session:activation.session||signalSessionCopy(session),timestamp:iso()});
      return{ok:!!windowId,windowId:windowId,reused:!!existing,session:activation.session||signalSessionCopy(session),audio:activation.audio||null}
    }catch(error){return{ok:false,error:String(error)}}
  }
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message) return false;
    if (message.target === "offscreen" && message.type === "SIGNAL_AUDIO_EVENT") {
      var audioEvent=message.event||{};
      if(audioEvent.type==="speaker.activity"){signalLastSpeakerId=audioEvent.speakerId||null;signalLastSpeakerAt=Date.now();}
      broadcastSignalEvent(Object.assign({},audioEvent,{sessionId:signalActiveSessionId}));return false;
    }
    if (message.type === "OPEN_SIGNAL_LIVE_WINDOW") { recordSignalDiagnostic("SIGNAL_CONSOLE_OPEN_REQUESTED",{tabId:message.tabId||null,sourceUrl:message.sourceUrl||"",hasSuppliedStream:!!message.audioStreamId}); openSignalLiveWindow(message.audioStreamId||null,message.tabId||null,message.sourceUrl||"",message.sourceTitle||"").then(function(response){if(response&&response.ok)recordSignalDiagnostic("SIGNAL_CONSOLE_OPENED",{tabId:message.tabId||null,sourceUrl:message.sourceUrl||"",windowId:response.windowId,reused:!!response.reused,sessionId:response.session&&response.session.id||null,audioOk:!!(response.audio&&response.audio.ok)});else recordSignalDiagnostic("SIGNAL_CONSOLE_OPEN_ERROR",{tabId:message.tabId||null,error:response&&response.error||"unknown"},"error");sendResponse(response)}).catch(function(error){recordSignalDiagnostic("SIGNAL_CONSOLE_OPEN_EXCEPTION",{tabId:message.tabId||null,error:String(error)},"error");sendResponse({ok:false,error:String(error)});});return true; }
    if (message.type === "ACTIVATE_SIGNAL_SESSION") { activateSignalSession(message.sessionId,null).then(sendResponse);return true; }
    if (message.type === "UPDATE_SIGNAL_SESSION") { updateSignalSession(message,sendResponse);return true; }
    if (message.type === "ADD_SIGNAL_SESSION_SEGMENT") { addSignalSessionSegment(message,sendResponse);return true; }
    if (message.type === "SIGNAL_START_AUDIO_ANALYSIS") { startSignalAudioAnalysis(message.streamId,message.tabId).then(sendResponse); return true; }
    if (message.type === "SIGNAL_STOP_AUDIO_ANALYSIS") { stopSignalAudioAnalysis().then(sendResponse); return true; }
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
    if(message.type==="SIGNAL_LIVE_CONSOLE_OPEN"){signalLiveConsoleOpen=true;recordSignalDiagnostic("SIGNAL_LIVE_CONSOLE_READY",{senderContext:"live-ui"});sendResponse({ok:true});return false;}
    if(message.type==="SIGNAL_LIVE_CONSOLE_CLOSE"){signalLiveConsoleOpen=false;recordSignalDiagnostic("SIGNAL_LIVE_CONSOLE_CLOSED",{senderContext:"live-ui"});sendResponse({ok:true});return false;}
    if(message.type==="SIGNAL_LIVE_UI_ERROR"){recordSignalDiagnostic("SIGNAL_LIVE_UI_ERROR",{phase:message.phase||"unknown",error:String(message.error||"unknown")},"error");sendResponse({ok:true});return false;}
    if(message.type==="GET_SIGNAL_INTERPRETER_STATE"){
      Promise.all([chrome.storage.local.get(["effectifState"]),loadSignalSessions()]).then(function(results){
        var state=Object.assign(baseState(),results[0].effectifState||{}),data=results[1],active=data.sessions.find(function(s){return s.id===data.activeSessionId})||null;
        sendResponse({ok:true,bridge:state.signalInterpreterBridge,sessions:data.sessions.map(function(s){return signalSessionCopy(s,false)}),activeSessionId:data.activeSessionId,transcript:active?active.segments.slice(-100):[],diagnostics:{runtimeStartedAt:state.telemetryHealth&&state.telemetryHealth.lastWriteAt||null,signalLiveConsoleOpen:signalLiveConsoleOpen}})
      }).catch(function(error){sendResponse({ok:false,error:String(error)})});return true;
    }
    if(message.type==="CLEAR_SIGNAL_INTERPRETER_TRANSCRIPT"){
      loadSignalSessions().then(async function(data){
        var id=message.sessionId||data.activeSessionId,s=data.sessions.find(function(x){return x.id===id});if(!s)throw new Error("Sesión no encontrada");
        try{await KhoraTelemetryDB.clearSignalSession(id);recordSignalDiagnostic("SIGNAL_SESSION_HISTORY_CLEARED",{sessionId:id})}catch(error){recordSignalDiagnostic("SIGNAL_SESSION_HISTORY_CLEAR_ERROR",{sessionId:id,error:String(error)},"error")}
        s.segments=[];s.segmentCount=0;return saveSignalSessions(data.sessions,id).then(function(){broadcastSignalEvent({type:"caption.clear",sessionId:id,timestamp:iso()});return{ok:true,session:signalSessionCopy(s,true)}})
      }).then(sendResponse).catch(function(error){sendResponse({ok:false,error:String(error)})});return true;
    }
    if(message.type==="EFFECTIF_START_TRANSCRIPTION"){connectSignalBridge();recordSignalDiagnostic("SIGNAL_TRANSCRIPTION_START_REQUESTED",{source:"effectif-control"});sendResponse({ok:true,engine:"signal-live-caption",global:true});return false;}
    if(message.type==="EFFECTIF_STOP_TRANSCRIPTION"){sendResponse({ok:true,engine:"signal-live-caption",global:true});return false;}
    if (TRANSCRIPTION_MODULE_AVAILABLE && message.type === "EFFECTIF_TRANSCRIPT_SEGMENT") {
      var segment = message.payload || {};
      record("TRANSCRIPT_SEGMENT_RENDERED", {
        speaker: segment.speaker, engine: segment.engine,
        latencyMs: segment.latencyMs, characters: String(segment.text || "").length,
        platformAudioModified: false
      }, "info", "worker");
      sendResponse({ ok: true }); return false;
    }
    if (TRANSCRIPTION_MODULE_AVAILABLE && message.type === "EFFECTIF_TRANSCRIPTION_STATUS") {
      var status = message.payload || {};
      mutateState(async function (state) {
        state.transcriptionStatus = Object.assign({}, state.transcriptionStatus || {}, status);
      });
      record("TRANSCRIPTION_STATUS", {
        phase: status.phase, connected: status.connected,
        engine: status.engine, error: status.error,
        platformAudioModified: false
      }, status.error ? "warn" : "info", "worker");
      sendResponse({ ok: true }); return false;
    }
    if (TRANSCRIPTION_MODULE_AVAILABLE && message.type === "EFFECTIF_TRANSCRIPTION_METRICS") {
      var workerMetrics = message.payload || {};
      mutateState(async function (state) {
        state.transcriptionMetrics = Object.assign({}, state.transcriptionMetrics || {}, workerMetrics);
      });
      record("TRANSCRIPTION_METRICS", {
        segments: workerMetrics.segments, localSegments: workerMetrics.localSegments,
        groqSegments: workerMetrics.groqSegments, queueDepth: workerMetrics.queueDepth,
        averageLatencyMs: workerMetrics.averageLatencyMs,
        groqEstimatedUsd: workerMetrics.groqEstimatedUsd,
        platformAudioModified: false
      }, "info", "worker");
      sendResponse({ ok: true }); return false;
    }
    if (message.type === "EFFECTIF_WORKER_PROBE") {
      sendResponse({ ok: false, error: "Módulo reservado: no disponible en esta versión" }); return false;
    }
    if (message.type === "EFFECTIF_TEST_TRANSCRIPTION") {
      sendResponse({ ok: false, error: "Módulo reservado: no disponible en esta versión" }); return false;
    }
    if (TRANSCRIPTION_MODULE_AVAILABLE && message.type === "EFFECTIF_TEST_TRANSCRIPTION_DORMANT") {
      chrome.storage.local.get(["effectifConfig"], function (stored) {
        var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {});
        ensureOffscreen().then(function () {
          return chrome.runtime.sendMessage({
            target: "offscreen", type: "EFFECTIF_TEST_LOCAL_TRANSCRIPTION",
            apiKey: config.groqApiKey || GROQ_API_KEY,
            mode: config.transcriptionMode || "auto",
            localModel: config.localWhisperModel || "large-v3-turbo",
            groqModel: config.groqModel || GROQ_MODEL,
            microphoneId: config.selectedMicrophoneId || "",
            speakerId: config.selectedSpeakerId || ""
          });
        }).then(sendResponse).catch(function (error) {
          sendResponse({ ok: false, error: String(error) });
        });
      });
      return true;
    }
    if (message.type === "EFFECTIF_OPEN_SIDE_PANEL") {
      sendResponse({ ok: false, error: "Módulo reservado: no disponible en esta versión" }); return false;
    }
    if (TRANSCRIPTION_MODULE_AVAILABLE && message.type === "EFFECTIF_GROQ_USAGE") {
      updateGroqUsage(message); sendResponse({ ok: true }); return false;
    }
    return false;
  });
  var networkRequests = new Map();
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
  chrome.tabs.onRemoved.addListener(function (tabId) {
    chrome.storage.local.get(["effectifState"], function (stored) {
      var state = Object.assign(baseState(), stored.effectifState || {});
      if (state.transcriptionTabId === tabId) {
        chrome.runtime.sendMessage({
          target: "offscreen", type: "EFFECTIF_STOP_LOCAL_TRANSCRIPTION", reason: "tab-closed"
        }).catch(function () {});
        state.transcriptionActive = false;
        state.transcriptionTabId = null;
        chrome.storage.local.set({ effectifState: state });
        record("TRANSCRIPTION_TAB_CLOSED", { tabId: tabId }, "warn", "tabs");
      }
    });
  });
})();