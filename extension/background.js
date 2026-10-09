try{importScripts("groq-secret.local.js");}catch(_){/* Se genera localmente; no se versiona. */}
importScripts("live-caption-core.js","live-caption-bridge.js","dialogue-engine.js","telemetry-db.js","observability-relay.js","observation-sync.js","groq-transcriber.js","platform-screenshot.js","auth-bootstrap.js");
(function () {
  "use strict";

  var GROQ_MODEL = "whisper-large-v3-turbo";
  var AUTHORIZED_ORIGIN = "https://app.cloudinterpreter.com";
  var AUTHORIZED_PROFILE_PATH = "/profile/cmu2wuz1v0uwr07adbzb9djfz";
  var OFFICIAL_STATS_URL = AUTHORIZED_ORIGIN + "/profile/cmu2wuz1v0uwr07adbzb9djfz/logs";
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
    liveCaptionOverlayEnabled: true,
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
  var earningsSyncQueue = Promise.resolve();
  var microphoneMuteQueue = Promise.resolve();
  var captionPreviewQueue = Promise.resolve();
  async function setCaptionPreviewForActiveCall(tabEnabled) {
    try {
      var stored = await chrome.storage.local.get(["effectifState", "effectifConfig"]);
      var state = normalizeHotloadState(normalizeStateShape(Object.assign(baseState(), stored.effectifState || {})));
      var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {});
      if (config.liveCaptionOverlayEnabled === false || !hasActiveCall(state)) return { ok: true, skipped: true };
      if (!state.callSourceTabId) return { ok: false, error: "No hay pestaña de llamada para Live Caption." };
      await ensureOffscreen();
      var response = await chrome.runtime.sendMessage({
        target: "offscreen",
        type: "SIGNAL_SET_CAPTION_PREVIEW",
        enabled: true,
        tabEnabled: !!tabEnabled,
        micEnabled: true
      });
      return response || { ok: false };
    } catch (error) {
      return { ok: false, error: String(error || "unknown") };
    }
  }

  try {
    SignalCaptionBridge.onStatus = function (status) {
      if (status && status.active) {
        setCaptionPreviewForActiveCall(false).catch(function () {});
      } else {
        setCaptionPreviewForActiveCall(true).catch(function () {});
      }
    };
    SignalCaptionBridge.onError = function (error) {
      record("SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR", { error: String(error || "unknown") }, "warn", "caption");
      setCaptionPreviewForActiveCall(true).catch(function () {});
    };
  } catch (_) {}
  var HOTLOAD_SCHEMA = "signal-hotload/v1";
  var HOTLOAD_HEARTBEAT_MIN_MS = 15000;
  var hotloadLastHeartbeatAt = 0;
  var hotloadLastRecoveryAt = 0;
  var hotloadReloadScheduled = false;
  var HOTLOAD_EXISTING_TAB_SCAN_MIN_MS = 5000;
  var hotloadLastExistingTabScanAt = 0;
  var tabAvailability = new Map();
  var tabReadiness = new Map();
  var actionIconCache = new Map();
  var READINESS_MAX_AGE_MS = 5000;

  function hasActiveCall(state) {
    return !!(state && state.callId && state.callStartedAt);
  }
  function enqueueEarningsSync(operation, task) {
    var run = earningsSyncQueue.then(task, task);
    earningsSyncQueue = run.catch(function (error) {
      record("EARNINGS_SYNC_QUEUE_ERROR", { operation: operation || "unknown", error: String(error) }, "warn", "background");
    });
    return run;
  }
  function normalizeHotloadState(state) {
    if (!state || typeof state !== "object") state = baseState();
    if (!state.hotLoadLease || typeof state.hotLoadLease !== "object" || Array.isArray(state.hotLoadLease)) {
      state.hotLoadLease = baseState().hotLoadLease;
    }
    if (!state.hotLoadUpdate || typeof state.hotLoadUpdate !== "object" || Array.isArray(state.hotLoadUpdate)) {
      state.hotLoadUpdate = baseState().hotLoadUpdate;
    }
    return state;
  }
  async function scheduleSafeRuntimeReload(trigger, allowActiveCall) {
    if (hotloadReloadScheduled) return false;
    var stored = await chrome.storage.local.get(["effectifState"]);
    var state = normalizeHotloadState(normalizeStateShape(Object.assign(baseState(), stored.effectifState || {})));
    var activeCall = hasActiveCall(state);
    if (activeCall && allowActiveCall !== true) {
      record("HOTLOAD_RELOAD_BLOCKED_ACTIVE_CALL", {
        trigger: trigger || "unknown", callId: state.callId, policy: "explicit-active-call-opt-in-required"
      }, "warn", "runtime");
      return false;
    }
    if (activeCall) {
      var priorLease = state.hotLoadLease || baseState().hotLoadLease;
      var captureConnected = !!(state.groqCapture && state.groqCapture.status === "connected");
      state.hotLoadLease = Object.assign({}, priorLease, {
        schema: HOTLOAD_SCHEMA, phase: "active-call", callId: state.callId,
        callStartedAt: state.callStartedAt,
        callSourceTabId: state.callSourceTabId || priorLease.callSourceTabId || null,
        modality: state.callModality || priorLease.modality || null,
        transcriptionSessionId: signalActiveSessionId || priorLease.transcriptionSessionId || state.transcriptionTabId || null,
        captureExpected: captureConnected || !!priorLease.captureExpected || !!state.transcriptionActive,
        captureStatus: state.groqCapture && state.groqCapture.status || priorLease.captureStatus || "unknown",
        runtimeVersion: chrome.runtime.getManifest().version, lastHeartbeatAt: iso(), closedAt: null
      });
    }
    hotloadReloadScheduled = true;
    state.hotLoadUpdate = Object.assign({}, state.hotLoadUpdate || baseState().hotLoadUpdate, {
      schema: HOTLOAD_SCHEMA, phase: activeCall ? "applying-active-call" : "applying",
      applyingAt: iso(), applyTrigger: trigger || "safe-boundary",
      deferredForCallId: null, currentVersion: chrome.runtime.getManifest().version
    });
    await chrome.storage.local.set({ effectifState: cloneStateForStorage(state) });
    record(activeCall ? "HOTLOAD_UPDATE_APPLYING_ACTIVE_CALL" : "HOTLOAD_UPDATE_APPLYING_SAFE", {
      trigger: trigger || "safe-boundary", callId: activeCall ? state.callId : null,
      callSourceTabId: activeCall ? state.callSourceTabId || null : null,
      captureExpected: activeCall && !!state.hotLoadLease.captureExpected,
      transcriptionSessionId: activeCall ? state.hotLoadLease.transcriptionSessionId || null : null,
      availableVersion: state.hotLoadUpdate.availableVersion || null,
      currentVersion: chrome.runtime.getManifest().version,
      policy: activeCall ? "persist-call-lease-reload-runtime-rehydrate-call-context" : "safe-boundary"
    }, "info", "runtime");
    setTimeout(function () {
      try { chrome.runtime.reload(); } catch (error) {
        hotloadReloadScheduled = false;
        record("HOTLOAD_RELOAD_ERROR", { trigger: trigger || "safe-boundary", error: String(error) }, "error", "runtime");
      }
    }, 75);
    return true;
  }
  async function coordinateUpdateAvailability(details) {
    var availableVersion = String(details && details.version || "");
    if (!availableVersion) return;
    try { await reconcilePlatformTelemetry("hotload-update-available"); } catch (_) {}
    var stored = await chrome.storage.local.get(["effectifState"]);
    var state = normalizeHotloadState(normalizeStateShape(Object.assign(baseState(), stored.effectifState || {})));
    var active = hasActiveCall(state);
    state.hotLoadUpdate = Object.assign({}, state.hotLoadUpdate, {
      schema: HOTLOAD_SCHEMA, availableVersion: availableVersion, detectedAt: iso(),
      phase: active ? "applying-active-call" : "ready-safe", deferredForCallId: null,
      currentVersion: chrome.runtime.getManifest().version
    });
    if (active) {
      var lease = state.hotLoadLease || baseState().hotLoadLease;
      state.hotLoadLease = Object.assign({}, lease, {
        schema: HOTLOAD_SCHEMA, phase: "active-call", callId: state.callId,
        callStartedAt: state.callStartedAt,
        callSourceTabId: state.callSourceTabId || lease.callSourceTabId || null,
        modality: state.callModality || lease.modality || null,
        transcriptionSessionId: signalActiveSessionId || lease.transcriptionSessionId || state.transcriptionTabId || null,
        captureExpected: !!(state.groqCapture && state.groqCapture.status === "connected") || !!lease.captureExpected || !!state.transcriptionActive,
        captureStatus: state.groqCapture && state.groqCapture.status || lease.captureStatus || "unknown",
        runtimeVersion: chrome.runtime.getManifest().version, lastHeartbeatAt: iso()
      });
    }
    await chrome.storage.local.set({ effectifState: cloneStateForStorage(state) });
    record(active ? "HOTLOAD_UPDATE_AVAILABLE_DURING_CALL" : "HOTLOAD_UPDATE_READY_SAFE", {
      availableVersion: availableVersion, currentVersion: chrome.runtime.getManifest().version,
      callId: active ? state.callId : null, callSourceTabId: active ? state.callSourceTabId || null : null,
      callActive: active, captureExpected: active && !!state.hotLoadLease.captureExpected,
      policy: active ? "save-call-lease-then-reload-and-rehydrate" : "apply-at-safe-boundary"
    }, "info", "runtime");
    if (active) await scheduleSafeRuntimeReload("update-available-active-call", true);
    else await scheduleSafeRuntimeReload("update-available-no-call");
  }
  async function executeMainMicrophoneCommand(tabId, op, muted, source) {
    var targetTabId=Number(tabId);
    if(!Number.isFinite(targetTabId))return{ok:false,verified:false,muted:!!muted,trackCount:0,senderCount:0,error:"No hay una pestaña de llamada controlable."};
    try{
      await chrome.scripting.executeScript({
        target:{tabId:targetTabId,frameIds:[0]},
        world:"MAIN",
        files:["mic-guard-main.js"],
        injectImmediately:true
      });
    }catch(error){
      return{ok:false,verified:false,muted:!!muted,trackCount:0,senderCount:0,error:"No se pudo inicializar el guard del micrófono: "+String(error)};
    }
    try{
      var executions=await chrome.scripting.executeScript({
        target:{tabId:targetTabId,frameIds:[0]},
        world:"MAIN",
        func:async function(input){
          var commandEvent="__SIGNAL_INTERPRETER_MIC_COMMAND_V1__";
          var ackEvent="__SIGNAL_INTERPRETER_MIC_ACK_V1__";
          var requestId=crypto.randomUUID();
          return await new Promise(function(resolve){
            var settled=false;
            var timeout=null;
            function finish(value){
              if(settled)return;
              settled=true;
              if(timeout)clearTimeout(timeout);
              window.removeEventListener(ackEvent,onAck,true);
              resolve(value);
            }
            function onAck(event){
              var ack=null;
              try{ack=JSON.parse(String(event&&event.detail||""));}catch(_){}
              if(!ack||ack.requestId!==requestId)return;
              finish(ack);
            }
            window.addEventListener(ackEvent,onAck,true);
            try{
              document.dispatchEvent(new CustomEvent(commandEvent,{detail:JSON.stringify({
                schema:"signal-main-mic-command/v1",
                op:input.op,
                requestId:requestId,
                muted:!!input.muted,
                reason:input.source||"background-direct"
              })}));
            }catch(error){
              finish({ok:false,verified:false,muted:!!input.muted,error:String(error)});
              return;
            }
            timeout=setTimeout(function(){
              finish({ok:false,verified:false,muted:!!input.muted,error:"MAIN microphone guard did not acknowledge the direct request."});
            },1500);
          });
        },
        args:[{op:op,muted:!!muted,source:source||"background-direct"}]
      });
      var result=executions&&executions[0]&&executions[0].result;
      return result||{ok:false,verified:false,muted:!!muted,trackCount:0,senderCount:0,error:"Direct microphone command returned no result."};
    }catch(error){
      return{ok:false,verified:false,muted:!!muted,trackCount:0,senderCount:0,error:String(error)};
    }
  }

  async function probeMainClientMicrophone(tabId, source) {
    var targetTabId=Number(tabId);
    if(!Number.isFinite(targetTabId))return{ok:false,verified:false,muted:false,trackCount:0,senderCount:0,error:"No hay una pestaña de llamada controlable."};
    var lastError=null;
    for(var attempt=1;attempt<=3;attempt+=1){
      try{
        var response=await chrome.tabs.sendMessage(targetTabId,{type:"SIGNAL_MAIN_MICROPHONE_PROBE",source:source||"heartbeat"});
        if(response&&response.verified===true)return Object.assign({},response,{ok:true,attempts:attempt,transport:"content"});
        lastError=response&&response.error||"La sonda del micrófono no pudo verificar la salida.";
      }catch(error){lastError=String(error);}
      var direct=await executeMainMicrophoneCommand(targetTabId,"probe",false,source||"background-direct");
      if(direct&&direct.verified===true)return Object.assign({},direct,{ok:true,attempts:attempt,transport:"direct-main"});
      lastError=direct&&direct.error||lastError;
    }
    return{ok:false,verified:false,muted:false,trackCount:0,senderCount:0,error:lastError||"probe-failed",attempts:3};
  }
  async function hotloadHeartbeat(trigger) {
    var now = Date.now();
    if (now - hotloadLastHeartbeatAt < HOTLOAD_HEARTBEAT_MIN_MS) return;
    hotloadLastHeartbeatAt = now;
    var stored = await chrome.storage.local.get(["effectifState"]);
    var state = normalizeHotloadState(normalizeStateShape(Object.assign(baseState(), stored.effectifState || {})));
    if (!hasActiveCall(state)) return;
    state.hotLoadLease = Object.assign({}, state.hotLoadLease || baseState().hotLoadLease, {
      schema: HOTLOAD_SCHEMA, phase: "active-call", lastHeartbeatAt: iso(), runtimeVersion: chrome.runtime.getManifest().version
    });
    var expectedMuted=!!state.microphoneMuted;
    var micProbe=await probeMainClientMicrophone(state.callSourceTabId,"hotload-heartbeat").catch(function(error){return{ok:false,verified:false,muted:false,trackCount:0,senderCount:0,error:String(error)}});
    state.microphoneOutputTrackCount=Number(micProbe&&micProbe.trackCount||0);
    state.microphoneOutputSenderCount=Number(micProbe&&micProbe.senderCount||0);
    var micProbeMatches=micProbe&&micProbe.verified===true&&!!micProbe.muted===expectedMuted;
    if(micProbeMatches){
      state.microphoneOutputMuted=expectedMuted;
      state.microphoneOutputStatus="applied";
      if(state.microphoneMuteStatus==="pending")state.microphoneMuteStatus="applied";
      state.groqCapture=Object.assign({},state.groqCapture||{},{microphoneMuted:expectedMuted});
      record("EXTENSION_MICROPHONE_OUTPUT_HEARTBEAT_VERIFIED",{callId:state.callId,tabId:state.callSourceTabId,muted:expectedMuted,trackCount:state.microphoneOutputTrackCount,senderCount:state.microphoneOutputSenderCount,attempts:Number(micProbe.attempts||1),trigger:trigger||"alarm"},"info","microphone");
    }else{
      state.microphoneOutputMuted=expectedMuted;
      state.microphoneOutputStatus="pending";
      if(state.microphoneMuteStatus!=="error")state.microphoneMuteStatus="pending";
      state.groqCapture=Object.assign({},state.groqCapture||{},{microphoneMuted:expectedMuted});
      record("EXTENSION_MICROPHONE_OUTPUT_HEARTBEAT_VERIFY_DEFERRED",{
        callId:state.callId,
        tabId:state.callSourceTabId,
        expectedMuted:expectedMuted,
        observedMuted:micProbe&&typeof micProbe.muted==="boolean"?micProbe.muted:null,
        verified:!!(micProbe&&micProbe.verified),
        trackCount:state.microphoneOutputTrackCount,
        senderCount:state.microphoneOutputSenderCount,
        error:micProbe&&micProbe.error||"verification-pending",
        trigger:trigger||"alarm",
        policy:"verify-only-no-state-change"
      },"warn","microphone");
      if(expectedMuted){
        var reaffirm=await setMainClientMicrophoneMuted(state.callSourceTabId,true,"heartbeat-reaffirm-muted").catch(function(error){return{ok:false,verified:false,error:String(error)}});
        if(reaffirm&&reaffirm.verified===true){
          state.microphoneOutputMuted=true;
          state.microphoneOutputStatus="applied";
          state.microphoneMuteStatus="applied";
          record("EXTENSION_MICROPHONE_OUTPUT_HEARTBEAT_REASSERTED",{callId:state.callId,tabId:state.callSourceTabId,muted:true,trackCount:Number(reaffirm.trackCount||0),senderCount:Number(reaffirm.senderCount||0)},"info","microphone");
        }
      }
    }
    await chrome.storage.local.set({ effectifState: cloneStateForStorage(state) });
    record("HOTLOAD_CALL_LEASE_HEARTBEAT", {
      callId: state.callId, leaseId: state.hotLoadLease.leaseId || null,
      trigger: trigger || "alarm", runtimeVersion: chrome.runtime.getManifest().version,
      transcriptionActive: !!state.transcriptionActive, captureStatus: state.groqCapture && state.groqCapture.status || "idle",
      microphoneMuted: !!state.microphoneMuted, microphoneOutputMuted: !!state.microphoneOutputMuted, microphoneOutputStatus: state.microphoneOutputStatus || "unknown",
      microphoneOutputTrackCount: Number(state.microphoneOutputTrackCount||0), microphoneOutputSenderCount: Number(state.microphoneOutputSenderCount||0),
      updatePhase: state.hotLoadUpdate && state.hotLoadUpdate.phase || "steady"
    }, "info", "runtime");
  }
  var hotloadLastExistingWebTabScanAt = 0;

  async function hotloadExistingWebTabs(trigger) {
    var now = Date.now();
    if (now - hotloadLastExistingWebTabScanAt < 5000) {
      record("HOTLOAD_EXISTING_WEB_TABS_SCAN_DEDUPED", { trigger: trigger || "runtime-start" }, "info", "runtime");
      return { ok: true, skipped: "recent-scan" };
    }
    hotloadLastExistingWebTabScanAt = now;
    var tabs;
    try {
      tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    } catch (error) {
      record("HOTLOAD_EXISTING_WEB_TABS_QUERY_ERROR", { trigger: trigger || "runtime-start", error: String(error) }, "error", "runtime");
      return { ok: false, error: String(error) };
    }
    var result = { scanned: tabs.length, injected: 0, errors: 0 };
    for (var i = 0; i < tabs.length; i += 1) {
      var tab = tabs[i];
      var tabId = Number(tab && tab.id);
      if (!Number.isFinite(tabId)) continue;
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId, allFrames: true },
          world: "ISOLATED",
          files: ["global-mouse-gesture.js"],
          injectImmediately: true
        });
        result.injected += 1;
      } catch (error) {
        result.errors += 1;
        record("HOTLOAD_EXISTING_WEB_TAB_GESTURE_ERROR", {
          trigger: trigger || "runtime-start",
          tabId: tabId,
          url: tab && tab.url ? safePlatformUrl(tab.url) : null,
          error: String(error)
        }, "warn", "microphone");
      }
    }
    record("HOTLOAD_EXISTING_WEB_TABS_SCAN_COMPLETED", Object.assign({ trigger: trigger || "runtime-start" }, result), result.errors ? "warn" : "info", "runtime");
    return { ok: result.errors === 0, result: result };
  }

  async function hotloadExistingCloudTabs(trigger) {
    var now = Date.now();
    if (now - hotloadLastExistingTabScanAt < HOTLOAD_EXISTING_TAB_SCAN_MIN_MS) {
      record("HOTLOAD_EXISTING_TABS_SCAN_DEDUPED", { trigger: trigger || "runtime-start", ageMs: now - hotloadLastExistingTabScanAt }, "info", "runtime");
      return { ok: true, skipped: "recent-scan" };
    }
    hotloadLastExistingTabScanAt = now;
    var tabs;
    try {
      tabs = await chrome.tabs.query({ url: [AUTHORIZED_ORIGIN + "/*"] });
    } catch (error) {
      record("HOTLOAD_EXISTING_TABS_QUERY_ERROR", { trigger: trigger || "runtime-start", error: String(error) }, "error", "runtime");
      return { ok: false, error: String(error) };
    }
    var hotloadState = null;
    var hotloadStateReady = false;
    try {
      var hotloadStored = await chrome.storage.local.get(["effectifState"]);
      hotloadState = normalizeHotloadState(normalizeStateShape(Object.assign(baseState(), hotloadStored.effectifState || {})));
      hotloadStateReady = true;
    } catch (stateError) {
      record("HOTLOAD_EXISTING_TAB_STATE_READ_ERROR", {
        trigger: trigger || "runtime-start", error: String(stateError)
      }, "error", "runtime");
    }
    var result = { scanned: tabs.length, eligible: 0, injected: 0, errors: 0 };
    for (var i = 0; i < tabs.length; i += 1) {
      var tab = tabs[i];
      var tabId = Number(tab && tab.id);
      if (!Number.isFinite(tabId) || !isAuthorizedCloudUrl(tab.url)) continue;
      result.eligible += 1;
      var success = false;
      var lastError = null;
      for (var attempt = 1; attempt <= 3 && !success; attempt += 1) {
        try {
          try {
            await chrome.tabs.sendMessage(tabId, { type: "EFFECTIF_HOTLOAD_REPLACE", reason: trigger || "runtime-start" });
          } catch (_) {}
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: "ISOLATED",
            func: function () {
              try { window.__SIGNAL_INTERPRETER_CLOUD_RUNTIME__ = null; } catch (_) {}
            }
          });
          await chrome.scripting.executeScript({ target: { tabId: tabId }, files: ["mic-guard-main.js"], world: "MAIN", injectImmediately: true });
          await chrome.scripting.executeScript({ target: { tabId: tabId }, files: ["content.js"], world: "ISOLATED", injectImmediately: true });
          if (hotloadStateReady && isCloudCallUrl(tab.url) && hotloadState.microphoneMuted === true && Number(hotloadState.callSourceTabId) === tabId) {
            try {
              var muteSync = await chrome.tabs.sendMessage(tabId, { type: "SIGNAL_MAIN_MICROPHONE_SET", muted: true, source: "hotload-sync" });
              record(muteSync && muteSync.verified === true ? "HOTLOAD_MICROPHONE_OUTPUT_VERIFIED" : "HOTLOAD_MICROPHONE_OUTPUT_VERIFY_ERROR", {
                tabId: tabId, callId: hotloadState.callId || null,
                trackCount: Number(muteSync && muteSync.trackCount || 0),
                senderCount: Number(muteSync && muteSync.senderCount || 0),
                error: muteSync && muteSync.error || null
              }, muteSync && muteSync.verified === true ? "info" : "error", "microphone");
            } catch (muteError) {
              record("HOTLOAD_MICROPHONE_OUTPUT_VERIFY_ERROR", { tabId: tabId, callId: hotloadState.callId || null, error: String(muteError) }, "error", "microphone");
            }
          }
          success = true;
          result.injected += 1;
          record("HOTLOAD_EXISTING_TAB_REHYDRATED", {
            trigger: trigger || "runtime-start", tabId: tabId, attempt: attempt,
            isCall: isCloudCallUrl(tab.url), route: isCloudCallUrl(tab.url) ? "/call/<ID>" : "/other"
          }, "info", "runtime");
        } catch (error) {
          lastError = String(error);
          if (attempt < 3) await new Promise(function (resolve) { setTimeout(resolve, 250); });
        }
      }
      if (!success) {
        result.errors += 1;
        record("HOTLOAD_EXISTING_TAB_REHYDRATE_ERROR", {
          trigger: trigger || "runtime-start", tabId: tabId,
          isCall: isCloudCallUrl(tab.url), error: lastError
        }, "error", "runtime");
      }
    }
    record("HOTLOAD_EXISTING_TABS_SCAN_COMPLETED", Object.assign({ trigger: trigger || "runtime-start" }, result), result.errors ? "warn" : "info", "runtime");
    return { ok: result.errors === 0, result: result };
  }
  async function recoverAfterRuntimeBoundary(trigger) {
    if (Date.now() - hotloadLastRecoveryAt < 5000) {
      record("HOTLOAD_RUNTIME_BOUNDARY_RECOVERY_DEDUPED", { trigger: trigger || "runtime-boundary" }, "info", "runtime");
      return;
    }
    hotloadLastRecoveryAt = Date.now();
    var stored = await chrome.storage.local.get(["effectifState"]);
    var state = normalizeHotloadState(normalizeStateShape(Object.assign(baseState(), stored.effectifState || {})));
    if (!hasActiveCall(state)) return;
    var callTabId = Number(state.callSourceTabId || state.hotLoadLease && state.hotLoadLease.callSourceTabId);
    record("HOTLOAD_RUNTIME_BOUNDARY_RECOVERY_STARTED", {
      trigger: trigger || "runtime-boundary", callId: state.callId, callSourceTabId: callTabId || null,
      captureExpected: !!(state.hotLoadLease && state.hotLoadLease.captureExpected),
      sessionId: state.hotLoadLease && state.hotLoadLease.transcriptionSessionId || null,
      runtimeVersion: chrome.runtime.getManifest().version
    }, "warn", "runtime");
    if (Number.isFinite(callTabId)) {
      try {
        var tab = await chrome.tabs.get(callTabId);
        if (tab && isAuthorizedCloudUrl(tab.url) && isCloudCallUrl(tab.url)) {
          await chrome.scripting.executeScript({ target: { tabId: callTabId }, files: ["mic-guard-main.js"], world: "MAIN", injectImmediately: true });
          await chrome.scripting.executeScript({ target: { tabId: callTabId }, files: ["content.js"], world: "ISOLATED", injectImmediately: true });
          record("HOTLOAD_CONTENT_RUNTIME_REHYDRATED", { callId: state.callId, tabId: callTabId }, "info", "runtime");
        }
      } catch (error) {
        record("HOTLOAD_CONTENT_RUNTIME_REHYDRATE_ERROR", { callId: state.callId, tabId: callTabId || null, error: String(error) }, "error", "runtime");
      }
    }
    var expectedCapture = !!(state.hotLoadLease && state.hotLoadLease.captureExpected && state.hotLoadLease.transcriptionSessionId);
    if (!expectedCapture || !Number.isFinite(callTabId)) return;
    try {
      await ensureOffscreen();
      var offscreenCapture = await chrome.runtime.sendMessage({
        target: "offscreen", type: "SIGNAL_GET_GROQ_CAPTURE_STATE"
      }).catch(function () { return null; });
      var expectedSessionId = String(state.hotLoadLease.transcriptionSessionId || "");
      if (offscreenCapture && offscreenCapture.ok === true && offscreenCapture.running === true &&
          String(offscreenCapture.sessionId || "") === expectedSessionId &&
          offscreenCapture.tabAudio === true && offscreenCapture.microphone === true) {
        record("HOTLOAD_CAPTURE_REUSE_EXISTING", {
          callId: state.callId, tabId: callTabId, sessionId: expectedSessionId,
          status: "offscreen-session-verified"
        }, "info", "runtime");
        return;
      }
      if (offscreenCapture && offscreenCapture.running === true) {
        record("HOTLOAD_CAPTURE_SESSION_MISMATCH", {
          callId: state.callId, tabId: callTabId, expectedSessionId: expectedSessionId || null,
          actualSessionId: offscreenCapture.sessionId || null, policy: "reacquire-expected-session"
        }, "warn", "runtime");
      }
      var captured = await chrome.tabCapture.getCapturedTabs();
      var existing = captured.find(function (entry) { return Number(entry.tabId) === callTabId && entry.status === "active"; });
      if (existing) {
        record("HOTLOAD_CAPTURE_ACTIVE_WITHOUT_VERIFIED_OFFSCREEN_SESSION", {
          callId: state.callId, tabId: callTabId, status: existing.status,
          expectedSessionId: expectedSessionId || null,
          policy: "do-not-assume-transcription-survived-runtime-boundary"
        }, "warn", "runtime");
      }
      var streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: callTabId });
      record("HOTLOAD_CAPTURE_STREAM_REACQUIRE_OK", { callId: state.callId, tabId: callTabId }, "info", "runtime");
      await startGroqCapture(state.hotLoadLease.transcriptionSessionId, streamId);
      record("HOTLOAD_CAPTURE_RECOVERY_COMPLETED", { callId: state.callId, tabId: callTabId, sessionId: state.hotLoadLease.transcriptionSessionId }, "info", "runtime");
    } catch (error) {
      await updateGroqCaptureState({ status: "degraded", tabAudio: false, microphone: false, error: "runtime-boundary: " + String(error) }).catch(function () {});
      record("HOTLOAD_CAPTURE_RECOVERY_ERROR", {
        callId: state.callId, tabId: callTabId, sessionId: state.hotLoadLease.transcriptionSessionId,
        error: String(error), policy: "never-create-second-call-or-navigate"
      }, "error", "runtime");
    }
  }

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
      { url: "https://api.exchangerate.fun/latest?base=USD", name: "ExchangeRate.fun / hourly snapshot", read: function (data) { return { rate: Number(data && data.rates && data.rates.MXN), date: data && data.timestamp ? new Date(Number(data.timestamp) * 1000).toISOString().slice(0, 10) : null, updatedAt: data && data.timestamp ? new Date(Number(data.timestamp) * 1000).toISOString() : null }; } },
      { url: "https://api.frankfurter.dev/v2/rate/usd/mxn", name: "Frankfurter / blended daily", read: function (data) { return { rate: Number(data && data.rate), date: data && data.date, updatedAt: data && data.date || null }; } },
      { url: "https://open.er-api.com/v6/latest/USD", name: "ExchangeRate-API / daily", read: function (data) { return { rate: Number(data && data.rates && data.rates.MXN), date: data && data.time_last_update_utc ? new Date(data.time_last_update_utc).toISOString().slice(0, 10) : null, updatedAt: data && data.time_last_update_utc || null }; } }
    ];
    var failures = [];
    for (var i = 0; i < sources.length; i += 1) {
      try {
        var data = await fetchJson(sources[i].url);
        var result = sources[i].read(data);
        if (!(result.rate > 0)) throw new Error("Respuesta sin tasa USD/MXN válida");
        if (result.date !== localDay()) throw new Error("La fuente no reporta una tasa USD/MXN de hoy.");
        var stored = await chrome.storage.local.get(["effectifConfig", "effectifState"]);
        var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {}, {
          usdMxnRate: result.rate, exchangeRateDate: result.date || localDay(),
          exchangeRateUpdatedAt: result.updatedAt || iso(), exchangeRateSource: sources[i].name
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
      sessionStartedAt: null, sessionSegments: [], sessionSourceTabId: null, sessionLastObservedAt: null,
      pendingCall: null, pendingCallEnd: null,
      onlineStartedAt: null, onlineSegments: [], onlineSourceTabId: null, onlineLastObservedAt: null,
      callStartedAt: null, callId: null, callModality: null, callSourceTabId: null, callLastObservedAt: null, callMissingSinceAt: null,
      completedCalls: [], unfinishedCalls: [], totalCalls: 0, dailyCalls: {},
      missedCalls: 0, dailyMissedCalls: {}, missedCallRecords: [], dailyUnfinishedCalls: {},
      transcriptionActive: false, transcriptionTabId: null,
      hotLoadLease: {
        schema: HOTLOAD_SCHEMA, phase: "idle", leaseId: null, callId: null, callStartedAt: null,
        callSourceTabId: null, modality: null, transcriptionSessionId: null, captureExpected: false,
        captureStatus: "idle", runtimeVersion: null, acquiredAt: null, lastHeartbeatAt: null, closedAt: null
      },
      hotLoadUpdate: {
        schema: HOTLOAD_SCHEMA, phase: "steady", availableVersion: null, detectedAt: null,
        deferredForCallId: null, applyingAt: null, applyTrigger: null, currentVersion: null
      },
      autoAnswerTelemetry: {
        detections: 0, connectFound: 0, clicks: 0, confirmations: 0,
        skipped: 0, disabled: 0, timeouts: 0, errors: 0,
        lastDetectedAt: null, lastClickedAt: null, lastConfirmedAt: null,
        lastError: null
      },
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
      microphoneMuted: false,
      microphoneMuteStatus: "unapplied",
      microphoneOutputMuted: false,
      microphoneOutputStatus: "unapplied",
      microphoneOutputTrackCount: 0,
      microphoneOutputSenderCount: 0,
      groqCapture:{status:"idle",tabAudio:false,microphone:false,microphoneMuted:false,startedAt:null,lastChunkAt:null,error:null},
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
    if (!Array.isArray(state.unfinishedCalls)) state.unfinishedCalls = [];
    if (!Array.isArray(state.missedCallRecords)) state.missedCallRecords = [];
    if (!state.dailyCalls || typeof state.dailyCalls !== "object" || Array.isArray(state.dailyCalls)) state.dailyCalls = {};
    if (!state.dailyMissedCalls || typeof state.dailyMissedCalls !== "object" || Array.isArray(state.dailyMissedCalls)) state.dailyMissedCalls = {};
    if (!state.dailyUnfinishedCalls || typeof state.dailyUnfinishedCalls !== "object" || Array.isArray(state.dailyUnfinishedCalls)) state.dailyUnfinishedCalls = {};
    if (!state.transcriptionStatus || typeof state.transcriptionStatus !== "object" || Array.isArray(state.transcriptionStatus)) state.transcriptionStatus = {phase:"idle",connected:false,engine:null};
    if (!state.transcriptionMetrics || typeof state.transcriptionMetrics !== "object" || Array.isArray(state.transcriptionMetrics)) state.transcriptionMetrics = {segments:0,localSegments:0,groqSegments:0,queueDepth:0,averageLatencyMs:0,groqEstimatedUsd:0};
    if (!state.autoAnswerTelemetry || typeof state.autoAnswerTelemetry !== "object" || Array.isArray(state.autoAnswerTelemetry)) state.autoAnswerTelemetry = baseState().autoAnswerTelemetry;
    normalizeHotloadState(state);
    if (typeof state.microphoneMuted !== "boolean") state.microphoneMuted = false;
    if (typeof state.microphoneMuteStatus !== "string") state.microphoneMuteStatus = "unapplied";
    if (typeof state.microphoneOutputMuted !== "boolean") state.microphoneOutputMuted = !!state.microphoneMuted;
    if (typeof state.microphoneOutputStatus !== "string") state.microphoneOutputStatus = "unapplied";
    if (!Number.isFinite(Number(state.microphoneOutputTrackCount))) state.microphoneOutputTrackCount = 0;
    if (!Number.isFinite(Number(state.microphoneOutputSenderCount))) state.microphoneOutputSenderCount = 0;
    if (!state.groqCapture || typeof state.groqCapture !== "object" || Array.isArray(state.groqCapture)) state.groqCapture = baseState().groqCapture;
    if (typeof state.groqCapture.microphoneMuted !== "boolean") state.groqCapture.microphoneMuted = !!state.microphoneMuted;
    if (!state.groqUsage || typeof state.groqUsage !== "object" || Array.isArray(state.groqUsage)) state.groqUsage = {requests:0,successes:0,errors:0,audioSeconds:0,bytesSent:0,charactersReturned:0,totalLatencyMs:0,estimatedUsd:0};
    return state;
  }
  function inferEventPhase(action){var a=String(action||"");if(/_REQUESTED$|_QUEUED$/.test(a))return"start";if(/_STARTED$|_CONNECTED$|_SENT$/.test(a))return"started";if(/_COMPLETED$|_UPDATED$|_PERSISTED$|_ACCEPTED$/.test(a))return"completed";if(/_ERROR$|_FAILED$/.test(a))return"error";if(/_REJECTED$|_BLOCKED$/.test(a))return"blocked";if(/_TIMEOUT$/.test(a))return"timeout";if(/_ABORTED$/.test(a))return"aborted";return"event"}
  function inferEventOutcome(action,level){var a=String(action||"");if(level==="error"||/_ERROR$|_FAILED$/.test(a))return"error";if(/_REJECTED$|_BLOCKED$/.test(a))return"blocked";if(/_TIMEOUT$/.test(a))return"timeout";if(/_ACCEPTED$|_COMPLETED$|_PERSISTED$|_UPDATED$|_STARTED$|_CONNECTED$/.test(a))return"success";return"observed"}
  function inferEventCategory(action){var a=String(action||"");if(/^SIGNAL_/.test(a)){if(/CAPTION/.test(a))return"LIVE_CAPTION";if(/UIA/.test(a))return"UIA";if(/BRIDGE/.test(a))return"BRIDGE";if(/SESSION/.test(a))return"SESSION";if(/DIALOGUE/.test(a))return"DIALOGUE";if(/AUDIO/.test(a))return"CAPTURE";if(/PERSIST|SEGMENT/.test(a))return"STORAGE";if(/CONSOLE|LIVE_/.test(a))return"UI";return"SIGNAL"}if(/NETWORK|PORTAL|PLATFORM_SURFACE|PLATFORM_URL|PLATFORM_OFFICIAL_SYNC|PLATFORM_MIRROR/.test(a))return"PORTAL";if(/EXCHANGE/.test(a))return"BILLING";if(/TRANSCRIPTION/.test(a))return"TRANSCRIPT";if(/CALL|MISSED/.test(a))return"SESSION";if(/SOUND/.test(a))return"SOUND";return"RUNTIME"}
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
  try { SignalPlatformScreenshot.configure({ record: record, relay: SignalObservabilityRelay }); } catch (error) { console.error("[SIGNAL-INTERPRETER] PLATFORM_SCREENSHOT_INIT_ERROR", String(error)); }
  function checkpointCallObservability(reason, callId, stateSnapshot) {
    var checkpoint = reason === "call-answered" ? "call-answered" : "call-ended";
    var payload = {
      checkpoint: checkpoint,
      callId: callId || null,
      extensionVersion: chrome.runtime.getManifest().version,
      dailyCallsToday: stateSnapshot && stateSnapshot.dailyCalls ? Number(stateSnapshot.dailyCalls[localDay()] || 0) : null,
      completedToday: stateSnapshot && stateSnapshot.completedCalls ? stateSnapshot.completedCalls.filter(function (call) { return localDay(call.startedAt || call.endedAt) === localDay(); }).length : null,
      unfinishedToday: stateSnapshot && stateSnapshot.unfinishedCalls ? stateSnapshot.unfinishedCalls.filter(function (call) { return localDay(call.startedAt || call.endedAt) === localDay(); }).length : null,
      callState: checkpoint === "call-answered" ? "active" : "closed"
    };
    appendEvent({ action: "CALL_OBSERVABILITY_CHECKPOINT", payload: payload, level: "info", source: "background" }, function () {
      try {
        SignalObservationSync.flush(checkpoint).catch(function (error) {
          record("CALL_OBSERVABILITY_CHECKPOINT_FLUSH_ERROR", { checkpoint: checkpoint, callId: callId || null, error: String(error) }, "warn", "background");
        });
      } catch (error) {
        record("CALL_OBSERVABILITY_CHECKPOINT_FLUSH_ERROR", { checkpoint: checkpoint, callId: callId || null, error: String(error) }, "warn", "background");
      }
    });
  }
  function requestCallOverlayRefresh(tabId, callId, reason) {
    if (!Number.isFinite(Number(tabId))) return;
    try {
      chrome.tabs.sendMessage(Number(tabId), { type: "EFFECTIF_REFRESH_OVERLAY", callId: callId || null, reason: reason || "call-answered" }, function () {
        if (chrome.runtime.lastError) {
          record("EARNINGS_OVERLAY_REFRESH_DELIVERY_ERROR", { callId: callId || null, tabId: Number(tabId), reason: reason || "call-answered", error: chrome.runtime.lastError.message }, "warn", "background");
        }
      });
    } catch (error) {
      record("EARNINGS_OVERLAY_REFRESH_DELIVERY_ERROR", { callId: callId || null, tabId: Number(tabId), reason: reason || "call-answered", error: String(error) }, "warn", "background");
    }
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
    var state = normalizeHotloadState(normalizeStateShape(Object.assign(baseState(), stored.effectifState || {})));
    var activeCall = hasActiveCall(state);
    var captureConnected = !!(state.groqCapture && state.groqCapture.status === "connected");
    if (activeCall) {
      state.hotLoadLease = Object.assign({}, state.hotLoadLease, {
        schema: HOTLOAD_SCHEMA, phase: "active-call", callId: state.callId,
        callStartedAt: state.callStartedAt, callSourceTabId: state.callSourceTabId,
        modality: state.callModality, runtimeVersion: chrome.runtime.getManifest().version,
        lastHeartbeatAt: iso()
      });
      state.transcriptionActive = captureConnected;
      state.transcriptionTabId = captureConnected ? (state.transcriptionTabId || state.hotLoadLease.transcriptionSessionId || null) : state.transcriptionTabId || null;
      state.transcriptionStatus = captureConnected
        ? { phase: "connected", connected: true, engine: "groq" }
        : Object.assign({}, state.transcriptionStatus || {}, { phase: "recovering", connected: false, engine: "groq" });
    } else {
      state.transcriptionActive = captureConnected;
      state.transcriptionTabId = captureConnected ? (state.transcriptionTabId || null) : null;
      if (!captureConnected) state.transcriptionStatus = { phase: "idle", connected: false, engine: "groq" };
        if (state.hotLoadLease && state.hotLoadLease.phase === "active-call") state.hotLoadLease.phase = "closed";
    }
    if (state.hotLoadUpdate && state.hotLoadUpdate.availableVersion === chrome.runtime.getManifest().version) {
      state.hotLoadUpdate = Object.assign({}, state.hotLoadUpdate, { phase: "steady", availableVersion: null, deferredForCallId: null, applyingAt: null, applyTrigger: null, currentVersion: chrome.runtime.getManifest().version });
    }
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
  async function playSound(volume, cue){
    await ensureOffscreen();
    var response=await chrome.runtime.sendMessage({
      target:"offscreen",
      type:"EFFECTIF_PLAY_SOUND",
      volume:Math.max(0,Math.min(1,Number(volume)||0)),
      cue:String(cue||"")
    });
    if(!response||!response.ok)throw new Error(response&&response.error||"No se pudo reproducir la alerta sonora");
    return response;
  }
  async function probeCloudTabTelemetry(tab) {
    try {
      var execution = await chrome.scripting.executeScript({
        target: { tabId: tab.id, frameIds: [0] },
        world: "ISOLATED",
        func: function () {
          function visible(element) {
            if (!element) return false;
            var style = getComputedStyle(element);
            var rect = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && !element.hidden &&
              rect.width > 0 && rect.height > 0;
          }
          function textOf(element) {
            return String(
              element && (
                element.getAttribute("aria-label") ||
                element.textContent ||
                ""
              ) || ""
            ).replace(/\s+/g, " ").trim();
          }
          var path = location.pathname;
          var body = String(document.body && document.body.innerText || "").replace(/\s+/g, " ").trim();
          var controls = Array.from(document.querySelectorAll("button,[role='button'],[aria-label]")).filter(visible);
          var controlText = controls.map(textOf).join(" ");
          var loginVisible = /(?:sign in|log in|login|forgot password|reset password|authentication required)/i.test(body);
          var authenticated = !loginVisible && (
            /^\/(?:profile|call|appointments|finance|selfcheck)(?:\/|$)/i.test(path) ||
            /Waiting for a call|You are (?:Online|Offline)|Click to go (?:Offline|Online)|My Profile|Statistics|End call/i.test(body)
          );
          var availability = /Click to go Offline|You are Online/i.test(controlText) ? "online" :
            /Click to go Online|You are Offline/i.test(controlText) ? "offline" : "unknown";
          var callMatch = path.match(/^\/call\/([^/?#]+)\/?$/);
          var endButton = controls.find(function (element) { return /^End call$/i.test(textOf(element)); }) || null;
          var modality = /Video interpreting|Video interpreting call|\bVRI\b/i.test(body) ? "VRI" :
            /Audio interpreting|Audio interpreting call|\bOPI\b|Telephonic/i.test(body) ? "OPI" : null;
          var mediaElementCount = document.querySelectorAll("audio,video").length;
          var timers = Array.from(document.querySelectorAll("body *")).filter(function (element) {
            if (!visible(element) || element.children.length > 2) return false;
            return /^\d{1,2}:\d{2}(?::\d{2})?$/.test(textOf(element));
          }).map(function (element) {
            var rect = element.getBoundingClientRect();
            var score = endButton ? Math.hypot(
              rect.left + rect.width / 2 - (endButton.getBoundingClientRect().left + endButton.getBoundingClientRect().width / 2),
              rect.top + rect.height / 2 - (endButton.getBoundingClientRect().top + endButton.getBoundingClientRect().height / 2)
            ) : Math.abs(rect.left + rect.width / 2 - innerWidth / 2) + rect.top;
            return { text: textOf(element), score: score };
          }).sort(function (a, b) { return a.score - b.score; });
          var timerText = timers.length ? timers[0].text : null;
          var timerParts = timerText ? timerText.split(":").map(Number) : [];
          var platformTimerSeconds = timerParts.length === 3
            ? timerParts[0] * 3600 + timerParts[1] * 60 + timerParts[2]
            : timerParts.length === 2
              ? timerParts[0] * 60 + timerParts[1]
              : null;
          return {
            authenticated: authenticated,
            availability: availability,
            route: path,
            callId: callMatch ? callMatch[1] : null,
            endCallVisible: !!endButton,
            platformTimerSeconds: Number.isFinite(platformTimerSeconds) ? platformTimerSeconds : null,
            modality: modality,
            mediaElementCount: mediaElementCount,
            pageTimeOrigin: Number.isFinite(performance.timeOrigin) ? performance.timeOrigin : null,
            title: String(document.title || "").slice(0, 180)
          };
        }
      });
      var result = execution && execution[0] && execution[0].result || {};
      return Object.assign({ tabId: tab.id, windowId: tab.windowId, url: tab.url || "", probeError: null }, result);
    } catch (error) {
      return { tabId: tab.id, windowId: tab.windowId, url: tab.url || "", probeError: String(error), authenticated: false, availability: "unknown", route: "", callId: null };
    }
  }

  async function reconcilePlatformTelemetry(trigger) {
    var observedAt = iso();
    var tabs = await chrome.tabs.query({ url: AUTHORIZED_ORIGIN + "/*" });
    var probes = await Promise.all(tabs.map(function (tab) { return probeCloudTabTelemetry(tab); }));
    var readable = probes.filter(function (probe) { return !probe.probeError; });
    var authenticated = readable.filter(function (probe) { return !!probe.authenticated; });
    var onlineTabs = authenticated.filter(function (probe) { return probe.availability === "online"; });
    var callTabs = authenticated.filter(function (probe) { return !!probe.callId; });
    var selectedCall = callTabs.find(function (probe) {
      return tabs.some(function (tab) { return tab.id === probe.tabId && !!tab.active; });
    }) || callTabs[0] || null;
    var stateBefore = (await chrome.storage.local.get(["effectifState"])).effectifState || {};
    var shouldStartCall = false;
    var shouldCloseCall = false;
    await mutateState(async function (state) {
      var now = observedAt;
      if (authenticated.length) {
        if (!state.sessionStartedAt) {
          var sessionOriginCandidates = authenticated
            .map(function (probe) { return Number(probe.pageTimeOrigin); })
            .filter(function (value) { return Number.isFinite(value) && value > 0 && value <= Date.now(); })
            .sort(function (a, b) { return a - b; });
          var inferredSessionStart = sessionOriginCandidates.length
            ? new Date(sessionOriginCandidates[0]).toISOString()
            : now;
          state.sessionStartedAt = inferredSessionStart;
          state.sessionSourceTabId = authenticated[0].tabId;
          record("PLATFORM_SESSION_RECONCILED_STARTED", {
            trigger: trigger || "reconcile", tabId: authenticated[0].tabId,
            route: authenticated[0].route || "/<ROOT>",
            startMeasurement: inferredSessionStart === now ? "first-authenticated-observation" : "page-time-origin",
            inferredStartAt: inferredSessionStart
          }, "info", "background");
        }
        state.sessionLastObservedAt = now;
      } else if (state.sessionStartedAt && (tabs.length === 0 || readable.length > 0)) {
        state.sessionSegments = (state.sessionSegments || []).concat({
          startedAt: state.sessionStartedAt, endedAt: now,
          durationSeconds: Math.max(0, (Date.parse(now) - Date.parse(state.sessionStartedAt)) / 1000),
          reason: tabs.length === 0 ? "no-cloud-tabs" : "no-authenticated-cloud-tab",
          sourceTabId: state.sessionSourceTabId || null
        }).slice(-1000);
        record("PLATFORM_SESSION_RECONCILED_ENDED", {
          trigger: trigger || "reconcile",
          reason: tabs.length === 0 ? "no-cloud-tabs" : "no-authenticated-cloud-tab",
          durationSeconds: Math.max(0, (Date.parse(now) - Date.parse(state.sessionStartedAt)) / 1000)
        }, "info", "background");
        state.sessionStartedAt = null;
        state.sessionSourceTabId = null;
        state.sessionLastObservedAt = now;
      }

      if (onlineTabs.length) {
        if (!state.onlineStartedAt) {
          state.onlineStartedAt = now;
          state.onlineSourceTabId = onlineTabs[0].tabId;
          record("PLATFORM_ONLINE_RECONCILED_STARTED", {
            trigger: trigger || "reconcile", tabId: onlineTabs[0].tabId,
            route: onlineTabs[0].route || "/<ROOT>"
          }, "info", "background");
        }
        state.onlineLastObservedAt = now;
        state.onlineSourceTabId = onlineTabs[0].tabId;
      } else if (state.onlineStartedAt && tabs.length === 0) {
        state.onlineSegments = (state.onlineSegments || []).concat({
          startedAt: state.onlineStartedAt, endedAt: now,
          durationSeconds: Math.max(0, (Date.parse(now) - Date.parse(state.onlineStartedAt)) / 1000),
          reason: "no-cloud-tabs",
          sourceTabId: state.onlineSourceTabId || null
        }).slice(-1000);
        record("PLATFORM_ONLINE_RECONCILED_ENDED", {
          trigger: trigger || "reconcile",
          reason: "no-cloud-tabs",
          durationSeconds: Math.max(0, (Date.parse(now) - Date.parse(state.onlineStartedAt)) / 1000)
        }, "info", "background");
        state.onlineStartedAt = null;
        state.onlineSourceTabId = null;
        state.onlineLastObservedAt = now;
      } else if (state.onlineStartedAt && authenticated.length > 0 &&
                 onlineTabs.length === 0 && probes.some(function (probe) { return probe.availability === "offline"; })) {
        state.onlineSegments = (state.onlineSegments || []).concat({
          startedAt: state.onlineStartedAt, endedAt: now,
          durationSeconds: Math.max(0, (Date.parse(now) - Date.parse(state.onlineStartedAt)) / 1000),
          reason: "explicit-offline-observation",
          sourceTabId: state.onlineSourceTabId || null
        }).slice(-1000);
        record("PLATFORM_ONLINE_RECONCILED_ENDED", {
          trigger: trigger || "reconcile",
          reason: "explicit-offline-observation",
          durationSeconds: Math.max(0, (Date.parse(now) - Date.parse(state.onlineStartedAt)) / 1000)
        }, "info", "background");
        state.onlineStartedAt = null;
        state.onlineSourceTabId = null;
        state.onlineLastObservedAt = now;
      }

      if (selectedCall) {
        state.callLastObservedAt = now;
        state.callMissingSinceAt = null;
        state.callSourceTabId = selectedCall.tabId;
        if (!state.callId || state.callId !== selectedCall.callId) shouldStartCall = true;
      } else if (state.callId && (tabs.length === 0 || readable.length > 0)) {
        if (!state.callMissingSinceAt) {
          state.callMissingSinceAt = now;
        } else if (Date.now() - Date.parse(state.callMissingSinceAt) > 15000) {
          shouldCloseCall = true;
        }
      }
    }, "reconcile-platform-telemetry");

    if (shouldStartCall && selectedCall) {
      startCall({
        timestamp: observedAt,
        callId: selectedCall.callId,
        payload: {
          route: selectedCall.route || "/call/<ID>",
          evidence: {
            endCallButtonVisible: !!selectedCall.endCallVisible,
            platformTimerSeconds: selectedCall.platformTimerSeconds,
            mediaElementCount: Number(selectedCall.mediaElementCount || 0)
          },
          modality: selectedCall.modality || null,
          reconciliation: true,
          tabId: selectedCall.tabId
        }
      });
    } else if (shouldCloseCall) {
      closeCall("reconcile-no-call-route", NaN, null);
    }

    var signature = JSON.stringify({
      tabs: tabs.length,
      authenticated: authenticated.length,
      online: onlineTabs.length,
      calls: callTabs.map(function (probe) { return { tabId: probe.tabId, callId: probe.callId }; }),
      probeErrors: probes.filter(function (probe) { return !!probe.probeError; }).map(function (probe) { return { tabId: probe.tabId, error: probe.probeError }; })
    });
    var prior = await chrome.storage.local.get(["effectifPlatformTelemetryProbe"]);
    if (!prior.effectifPlatformTelemetryProbe || prior.effectifPlatformTelemetryProbe.signature !== signature || trigger === "popup-open") {
      await chrome.storage.local.set({ effectifPlatformTelemetryProbe: { observedAt: observedAt, trigger: trigger || "reconcile", signature: signature } });
      record("PLATFORM_TELEMETRY_RECONCILED", {
        trigger: trigger || "reconcile",
        tabCount: tabs.length, authenticatedCount: authenticated.length,
        onlineCount: onlineTabs.length, callCount: callTabs.length,
        probeErrors: probes.filter(function (probe) { return !!probe.probeError; }).length
      }, "info", "background");
    }
  }

  function handleSession(event) {
    reconcilePlatformTelemetry("event:" + String(event.action || "session")).catch(function (error) {
      record("PLATFORM_SESSION_RECONCILE_ERROR", { trigger: event.action, error: String(error) }, "warn", "background");
    });
  }
  function handleAvailability(event) {
    reconcilePlatformTelemetry("event:availability:" + String(event.payload && event.payload.state || "unknown")).catch(function (error) {
      record("PLATFORM_ONLINE_RECONCILE_ERROR", { trigger: event.payload && event.payload.state || null, error: String(error) }, "warn", "background");
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
      state.autoAnswerTelemetry = Object.assign({}, state.autoAnswerTelemetry || {});
      state.autoAnswerTelemetry.detections = Number(state.autoAnswerTelemetry.detections || 0) + 1;
      state.autoAnswerTelemetry.connectFound = Number(state.autoAnswerTelemetry.connectFound || 0) + (event.payload && event.payload.connectFound ? 1 : 0);
      state.autoAnswerTelemetry.disabled = Number(state.autoAnswerTelemetry.disabled || 0) + (event.payload && event.payload.connectDisabled ? 1 : 0);
      state.autoAnswerTelemetry.lastDetectedAt = event.timestamp;
      chrome.alarms.create("effectif-pending-call", { when: Date.now() + 15000 });
    });
  }
  async function applyPendingHotloadAfterCall(trigger) {
    var stored = await chrome.storage.local.get(["effectifState"]);
    var state = normalizeHotloadState(normalizeStateShape(Object.assign(baseState(), stored.effectifState || {})));
    if (hasActiveCall(state)) return false;
    if (!state.hotLoadUpdate || !state.hotLoadUpdate.availableVersion) return false;
    var deferredCallId = state.hotLoadUpdate.deferredForCallId || null;
    state.hotLoadUpdate = Object.assign({}, state.hotLoadUpdate, { phase: "ready-safe", deferredForCallId: null });
    await chrome.storage.local.set({ effectifState: cloneStateForStorage(state) });
    record("HOTLOAD_UPDATE_RELEASED_AT_SAFE_BOUNDARY", {
      trigger: trigger || "call-ended", availableVersion: state.hotLoadUpdate.availableVersion,
      lastDeferredCallId: deferredCallId
    }, "info", "runtime");
    return scheduleSafeRuntimeReload(trigger || "call-ended");
  }
  function startCall(event) {
    var callId = event.callId || event.payload && event.payload.callId;
    mutateState(async function (state) {
      if (!callId || state.callId === callId ||
          (state.completedCalls || []).some(function (call) { return call.callId === callId; })) return;
      state.callId = callId;
      var measuredPlatformSeconds = Number(event.payload && event.payload.evidence && event.payload.evidence.platformTimerSeconds);
      var routeTimestampMs = Date.parse(event.timestamp);
      var measuredStartAt = Number.isFinite(measuredPlatformSeconds) && measuredPlatformSeconds >= 0 &&
        measuredPlatformSeconds <= 86400 && Number.isFinite(routeTimestampMs)
        ? new Date(routeTimestampMs - measuredPlatformSeconds * 1000).toISOString()
        : event.timestamp;
      state.callStartedAt = measuredStartAt;
      state.callSourceTabId = event.payload && event.payload.tabId != null ? Number(event.payload.tabId) : (event.tabId != null ? Number(event.tabId) : null);
      state.callLastObservedAt = event.timestamp;
      state.callMissingSinceAt = null;
      state.callModality = event.payload && event.payload.modality ||
        state.pendingCall && state.pendingCall.modality || "OPI";
      state.hotLoadLease = {
        schema: HOTLOAD_SCHEMA, phase: "active-call", leaseId: uid(), callId: callId,
        callStartedAt: measuredStartAt, callSourceTabId: state.callSourceTabId,
        modality: state.callModality, transcriptionSessionId: signalActiveSessionId || null,
        captureExpected: !!(state.groqCapture && state.groqCapture.status === "connected"),
        captureStatus: state.groqCapture && state.groqCapture.status || "idle",
        runtimeVersion: chrome.runtime.getManifest().version, acquiredAt: event.timestamp,
        lastHeartbeatAt: event.timestamp, closedAt: null
      };
      state.pendingCall = null;
      state.pendingCallEnd = null;
      chrome.alarms.clear("effectif-pending-call");
      state.totalCalls = Number(state.totalCalls || 0) + 1;
      var day = localDay(measuredStartAt);
      state.dailyCalls = Object.assign({}, state.dailyCalls || {});
      state.dailyCalls[day] = Number(state.dailyCalls[day] || 0) + 1;
      record("CALL_TIMER_STARTED", {
        callId: callId, modality: state.callModality,
        trigger: event.payload && event.payload.reconciliation ? "reconciliation" : "call-route-entered",
        route: event.payload && event.payload.route || "/call/<ID>",
        startMeasurement: Number.isFinite(measuredPlatformSeconds) ? "platform-timer-backdated" : "route-detection",
        startOffsetSeconds: Number.isFinite(measuredPlatformSeconds) ? measuredPlatformSeconds : null,
        evidence: event.payload && event.payload.evidence || null
      }, "info", "background");
    }).then(function (state) {
      if (!state || state.callId !== callId) return;
      return captureCallEarningsBaseline(callId, state.callStartedAt).catch(function (error) {
        record("CALL_EARNINGS_BASELINE_CAPTURE_ERROR", {
          callId: callId, startedAt: state.callStartedAt, error: String(error)
        }, "warn", "background");
      }).then(function () {
      checkpointCallObservability("call-answered", callId, state);
      requestCallOverlayRefresh(state.callSourceTabId, callId, "call-answered");
      record("CALL_ANSWERED_OVERLAY_REFRESH_REQUESTED", {
        callId: callId,
        tabId: state.callSourceTabId,
        dailyCallsToday: Number(state.dailyCalls && state.dailyCalls[localDay()] || 0)
      }, "info", "background");
      record("TRANSCRIPTION_MODULE_READY", { callId: callId, engine: "groq-whisper" }, "info", "background");
      requestCallAlert(callId, "call-route-confirmed");
      refreshExchangeRate("call-start").catch(function(error){
        record("CALL_START_EXCHANGE_RATE_ERROR",{callId:callId,error:String(error)},"warn","background");
      });
      return syncOfficialPlatformData().then(function(result){
          var summary=result&&result.snapshot&&result.snapshot.summary||{};
          record("CALL_START_EARNINGS_SYNC_COMPLETED",{
            callId:callId,method:result&&result.method||null,earned:summary.earned||null
          },"info","background");
        }).catch(function(error){
          record("CALL_START_EARNINGS_SYNC_ERROR",{callId:callId,error:String(error)},"warn","background");
        }).then(function(){
          return captureCallEarningsBaseline(callId, state.callStartedAt).catch(function(error){
            record("CALL_EARNINGS_BASELINE_RECONCILE_ERROR",{callId:callId,error:String(error)},"warn","background");
          }).then(function(){
            return syncOfficialEarningsRange("currentMonth").then(function(result){
              record("CALL_START_MONTH_SYNC_COMPLETED",{
                callId:callId,method:result&&result.method||null,period:"currentMonth"
              },"info","background");
            }).catch(function(error){
              record("CALL_START_MONTH_SYNC_ERROR",{callId:callId,error:String(error)},"warn","background");
            });
          });
        });
      });
    });
  }
  var callAlertInFlight = new Map();
  function requestCallAlert(callId, trigger) {
    if (!callId || callAlertInFlight.has(callId)) return;
    callAlertInFlight.set(callId, Date.now());
    chrome.storage.local.get(["effectifConfig", "effectifCallAlert", "effectifPageBeep"], function (stored) {
      var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {});
      if (!config.soundEnabled || !callId) {
        callAlertInFlight.delete(callId);
        return;
      }
      var now = Date.now();
      var previous = stored.effectifCallAlert || {};
      var pageBeep = stored.effectifPageBeep || {};
      if (pageBeep.callId === callId && pageBeep.playedAt && now - Number(pageBeep.playedAt) < 5000) {
        callAlertInFlight.delete(callId);
        record("CALL_ALERT_SOUND_SUPPRESSED_PAGE_BEEP", { callId: callId, trigger: trigger || "call-route-confirmed", pageBeepAt: pageBeep.playedAt }, "info", "runtime");
        return;
      }
      if (previous.callId === callId && previous.playedAt) {
        callAlertInFlight.delete(callId);
        return;
      }
      if (previous.callId === callId && previous.requestedAt && now - Number(previous.requestedAt) < 4000 && !previous.failedAt) {
        callAlertInFlight.delete(callId);
        return;
      }
      var marker = {
        callId: callId,
        requestedAt: now,
        playedAt: null,
        failedAt: null,
        attempts: 0,
        trigger: trigger || "call-route-confirmed"
      };
      chrome.storage.local.set({ effectifCallAlert: marker });
      record("CALL_ALERT_SOUND_REQUESTED", {
        callId: marker.callId, trigger: marker.trigger, requestedAt: now
      }, "info", "background");
      function attemptSound(attempt) {
        marker.attempts = attempt;
        playSound(Math.max(0.95, Number(config.volume || 0))).then(function () {
          var playedAt = Date.now();
          chrome.storage.local.set({
            effectifCallAlert: Object.assign({}, marker, { playedAt: playedAt, failedAt: null })
          });
          callAlertInFlight.delete(callId);
          record("CALL_ALERT_SOUND_PLAYED", {
            callId: marker.callId, trigger: marker.trigger,
            latencyMs: playedAt - now, attempts: attempt, prominent: true
          }, "info", "offscreen");
        }).catch(function (error) {
          if (attempt < 3) {
            setTimeout(function () { attemptSound(attempt + 1); }, attempt === 1 ? 250 : 600);
            return;
          }
          chrome.storage.local.set({
            effectifCallAlert: Object.assign({}, marker, { failedAt: Date.now(), error: String(error) })
          });
          callAlertInFlight.delete(callId);
          record("CALL_ALERT_SOUND_ERROR", {
            callId: marker.callId, trigger: marker.trigger,
            latencyMs: Date.now() - now, attempts: attempt, message: String(error)
          }, "error", "offscreen");
        });
      }
      attemptSound(1);
    });
  }

  function alertOnConnect(event) {
    mutateState(async function (state) {
      state.lastConnectAt = event.timestamp;
      state.autoAnswerTelemetry = Object.assign({}, state.autoAnswerTelemetry || {});
      state.autoAnswerTelemetry.clicks = Number(state.autoAnswerTelemetry.clicks || 0) + 1;
      state.autoAnswerTelemetry.lastClickedAt = event.timestamp;
      if (state.pendingCall) {
        state.pendingCall.clickedAt = event.timestamp;
      } else if (!state.callId) {
        state.pendingCall = {
          id: uid(), detectedAt: event.timestamp, clickedAt: event.timestamp,
          modality: event.payload && event.payload.modality || "OPI"
        };
      }
      chrome.alarms.create("effectif-pending-call", { when: Date.now() + 15000 });
      record("CONNECT_ACCEPTED_PENDING", {
        modality: event.payload && event.payload.modality || "OPI",
        flowId: event.payload && event.payload.flowId || null,
        reason: "await-call-route"
      }, "info", "background");
    });
  }
  function rememberCallEnd(event) {
    mutateState(async function (state) {
      if (!state.callId) return;
      var payload = event.payload || {};
      if (payload.callId && payload.callId !== state.callId) return;
      var platformSeconds = Number(payload.platformSeconds);
      state.pendingCallEnd = {
        callId: state.callId,
        clickedAt: event.timestamp,
        platformSeconds: Number.isFinite(platformSeconds) && platformSeconds >= 0 ? platformSeconds : null,
        signal: "end-button"
      };
      record("CALL_END_SIGNAL_PREPARED", {
        callId: state.callId, platformSeconds: state.pendingCallEnd.platformSeconds,
        trigger: "end-button", confirmation: "await-rating-route"
      }, "info", "background");
    });
  }
  function reconcileOfficialEarningsAfterCall(callId) {
    return syncOfficialPlatformData().catch(function(error){
      record("CALL_END_EARNINGS_SYNC_ERROR",{callId:callId,period:"today",error:String(error)},"warn","background");
    }).then(function(){
      return syncOfficialEarningsRange("currentMonth").catch(function(error){
        record("CALL_END_EARNINGS_SYNC_ERROR",{callId:callId,period:"currentMonth",error:String(error)},"warn","background");
      });
    }).then(function(){
      return chrome.storage.local.remove(["effectifCallEarnings"]).catch(function(error){
        record("CALL_EARNINGS_BASELINE_CLEAR_ERROR",{callId:callId,error:String(error)},"warn","background");
      });
    });
  }
  function closeCall(source, platformSeconds, sendResponse) {
    var closedCallId = null;
    mutateState(async function (state, config) {
      if (!state.callStartedAt || !state.callId) {
        if (sendResponse) sendResponse({ ok: false, error: "No hay llamada activa" });
        return;
      }
      var endedAt = iso();
      var observedSeconds = Math.max(0, (Date.parse(endedAt) - Date.parse(state.callStartedAt)) / 1000);
      var pendingEnd = state.pendingCallEnd && state.pendingCallEnd.callId === state.callId ? state.pendingCallEnd : null;
      var pendingSeconds = pendingEnd ? Number(pendingEnd.platformSeconds) : NaN;
      if (!Number.isFinite(platformSeconds) && Number.isFinite(pendingSeconds) && pendingSeconds >= 0) platformSeconds = pendingSeconds;
      var hasPlatformSeconds = Number.isFinite(platformSeconds) && platformSeconds >= 0;
      var billableSeconds = hasPlatformSeconds ? platformSeconds : observedSeconds;
      var modality = state.callModality || "OPI";
      var rate = modality === "VRI" ? config.vriRatePerMinute : config.opiRatePerMinute;
      var successfulCompletion = source === "rating-route";
      var call = {
        callId: state.callId, startedAt: state.callStartedAt, endedAt: endedAt,
        modality: modality, status: successfulCompletion ? "completed" : "unfinished",
        observedSeconds: Math.round(observedSeconds * 1000) / 1000,
        platformSeconds: hasPlatformSeconds ? platformSeconds : null,
        billableSecondsAssumed: Math.round(billableSeconds * 1000) / 1000,
        ratePerMinute: rate, estimatedRevenue: Math.round((billableSeconds / 60) * rate * 10000) / 10000,
        countedInEarnings: successfulCompletion, currency: config.currency, billingRule: config.billingRule, endSource: source
      };
      closedCallId = state.callId;
      if (successfulCompletion) {
        state.completedCalls = (state.completedCalls || []).concat(call).slice(-1000);
      } else {
        var unfinishedDay = localDay(call.startedAt || call.endedAt);
        state.unfinishedCalls = (state.unfinishedCalls || []).concat(call).slice(-1000);
        state.dailyUnfinishedCalls = Object.assign({}, state.dailyUnfinishedCalls || {});
        state.dailyUnfinishedCalls[unfinishedDay] = Number(state.dailyUnfinishedCalls[unfinishedDay] || 0) + 1;
      }
      state.hotLoadLease = Object.assign({}, state.hotLoadLease || {}, {
        schema: HOTLOAD_SCHEMA, phase: "closed", closedAt: endedAt, lastHeartbeatAt: endedAt
      });
      if (state.transcriptionActive) {
        stopGroqCapture("call-ended").catch(function () {});
        state.transcriptionActive = false;
        state.transcriptionTabId = null;
        state.transcriptionStatus = { phase: "stopped", connected: false, engine: "groq" };
      }
      state.callStartedAt = null; state.callId = null; state.callModality = null; state.callSourceTabId = null; state.pendingCallEnd = null;
      record("CALL_TIMER_STOPPED", Object.assign({}, call, {
        confirmation: source === "rating-route" ? "rating-route" : "fallback-route",
        observedVsPlatformDeltaSeconds: hasPlatformSeconds ? Math.round((observedSeconds - billableSeconds) * 1000) / 1000 : null
      }), "info", source);
      if (sendResponse) sendResponse({ ok: true, call: call });
    }).then(function (finalState) {
      checkpointCallObservability("call-ended", closedCallId, finalState);
      return reconcileOfficialEarningsAfterCall(closedCallId).catch(function(error){
        record("CALL_END_EARNINGS_RECONCILIATION_ERROR",{callId:closedCallId,error:String(error)},"warn","background");
      });
    }).then(function () { applyPendingHotloadAfterCall("call-ended").catch(function () {}); });
  }
  function savePlatformSnapshot(message, sender, sendResponse) {
    var snapshot = message.snapshot || {};
    if (!sender.tab || !/^https:\/\/app\.cloudinterpreter\.com\//.test(sender.tab.url || "")) {
      sendResponse({ ok: false, error: "Origen no autorizado" });
      return;
    }
    var key = String(snapshot.key || "other").slice(0, 80);
    enqueueEarningsSync("platform-snapshot:" + key, function () {
      return chrome.storage.local.get(["effectifPlatformMirror"]).then(function (stored) {
        var mirror = Object.assign({}, stored.effectifPlatformMirror || {});
        mirror[key] = Object.assign({}, snapshot, {          tabId: sender.tab.id,
          capturedAt: snapshot.capturedAt || iso()
        });
        KhoraTelemetryDB.putSnapshot(Object.assign({}, snapshot, { tabId: sender.tab ? sender.tab.id : null }))
          .catch(function (error) { record("TELEMETRY_SNAPSHOT_DB_ERROR", { message: String(error) }, "error", "background"); });
        return chrome.storage.local.set({ effectifPlatformMirror: mirror }).then(function () {
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
    }).catch(function (error) {
      record("PLATFORM_MIRROR_UPDATE_ERROR", { key: key, error: String(error) }, "warn", "background");
      sendResponse({ ok: false, error: String(error) });
    });
  }
  function isAuthorizedProfileUrl(raw) {
    try {
      var url = new URL(String(raw || ""));
      return url.origin === AUTHORIZED_ORIGIN &&
        (url.pathname === AUTHORIZED_PROFILE_PATH || url.pathname === AUTHORIZED_PROFILE_PATH + "/");
    } catch (_) { return false; }
  }
  function iconImageData(color, size) {
    var key = color + ":" + size;
    if (actionIconCache.has(key)) return actionIconCache.get(key);
    var canvas = new OffscreenCanvas(size, size);
    var ctx = canvas.getContext("2d");
    var center = size / 2;
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath(); ctx.arc(center, center, size * 0.47, 0, Math.PI * 2); ctx.fillStyle = "#111827"; ctx.fill();
    ctx.beginPath(); ctx.arc(center, center, size * 0.36, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    if (color === "#22c55e") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1.5, size * 0.11);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(size * 0.27, size * 0.51);
      ctx.lineTo(size * 0.44, size * 0.68);
      ctx.lineTo(size * 0.75, size * 0.34);
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(center, center, size * 0.14, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill();
    }
    var data = ctx.getImageData(0, 0, size, size);
    actionIconCache.set(key, data);
    return data;
  }
  async function setActionIndicator(tabId, status) {
    if (!Number.isFinite(Number(tabId))) return;
    var colors = { active: "#22c55e", waiting: "#f59e0b", offline: "#6b7280", disabled: "#ef4444" };
    var titles = {
      active: "Signal Interpreter · AUTO-ANSWER ACTIVO · Profile autorizado · You are Online",
      waiting: "Signal Interpreter · ESPERA · Profile autorizado, disponibilidad no confirmada",
      offline: "Signal Interpreter · BLOQUEADO · You are Offline",
      disabled: "Signal Interpreter · AUTO-ANSWER DESACTIVADO"
    };
    var statusKey = colors[status] ? status : "disabled";
    try {
      await chrome.action.setIcon({ tabId: Number(tabId), imageData: {
        16: iconImageData(colors[statusKey], 16),
        32: iconImageData(colors[statusKey], 32),
        48: iconImageData(colors[statusKey], 48)
      }});
      await chrome.action.setBadgeText({ tabId: Number(tabId), text: statusKey === "active" ? "ON" : "" });
      if (statusKey === "active") await chrome.action.setBadgeBackgroundColor({ tabId: Number(tabId), color: "#16a34a" });
      await chrome.action.setTitle({ tabId: Number(tabId), title: titles[statusKey] });
    } catch (error) {
      record("ACTION_INDICATOR_ERROR", { tabId: Number(tabId), status: statusKey, error: String(error) }, "warn", "action");
    }
  }
  async function refreshActionIndicator(tabId, url) {
    if (!Number.isFinite(Number(tabId))) return;
    var tab;
    try { tab = await chrome.tabs.get(Number(tabId)); } catch (_) { return; }
    var targetUrl = url || tab.url || "";
    var status = isAuthorizedCloudUrl(targetUrl) ? "waiting" : "disabled";
    if (isAuthorizedProfileUrl(targetUrl)) {
      var readiness = tabReadiness.get(Number(tabId));
      var availability = tabAvailability.get(Number(tabId)) || "unknown";
      var stored = await chrome.storage.local.get(["effectifConfig"]);
      var enabled = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {}).autoAnswerEnabled !== false;
      var fresh = readiness && Number.isFinite(Number(readiness.at)) && Date.now() - Number(readiness.at) <= READINESS_MAX_AGE_MS;
      var exactReady = !!(readiness && readiness.ready === true &&
        readiness.authorizedProfile === true &&
        readiness.exactUrl === AUTHORIZED_ORIGIN + AUTHORIZED_PROFILE_PATH &&
        readiness.runtimeVersion === chrome.runtime.getManifest().version &&
        fresh);
      if (!enabled) status = "disabled";
      else if (exactReady && availability === "online") status = "active";
      else if (availability === "offline") status = "offline";
      else status = "waiting";
    }
    await setActionIndicator(Number(tabId), status);
  }

  function isAuthorizedCloudUrl(raw){try{return new URL(String(raw||"")).origin===AUTHORIZED_ORIGIN}catch(_){return false;}}
  function readVisibleOfficialSummaryFromPage() {
    function normalize(value){return String(value||"").replace(/\s+/g," ").trim();}
    function parseMoney(value){
      var match=String(value||"").match(/(?:US\$|\$)\s*([0-9]+(?:[.,][0-9]+)?)/);
      return match?Number(String(match[1]).replace(/,/g,".")):null;
    }
    var text=normalize(document.body&&document.body.innerText);
    if(!text)return null;
    var result={};
    var earned=text.match(/(?:Totally earned|Total earned|Today's earnings|Earned today|Ganado hoy)[\s\S]{0,180}?(?:US\$|\$)\s*([0-9]+(?:[.,][0-9]+)?)/i);
    var length=text.match(/Total call length\s*[:\-]?\s*([0-9]{1,3}:[0-9]{2}(?::[0-9]{2})?)/i);
    var count=text.match(/Total number of calls\s*[:\-]?\s*([0-9]+)/i);
    if(earned){result.earned="$"+earned[1];result.earnedUsd=parseMoney(result.earned);}
    if(length)result.callLength=length[1];
    if(count)result.callCount=count[1];
    if(!result.earned){
      var nodes=Array.from(document.querySelectorAll("body *")).filter(function(el){return el.children.length<=2;});
      for(var i=0;i<nodes.length;i+=1){
        var label=normalize(nodes[i].textContent);
        if(!/^(Totally earned|Total earned|Today's earnings|Earned today|Ganado hoy)$/i.test(label))continue;
        var parent=nodes[i].parentElement;
        var values=parent?String(parent.innerText||"").split(/\n+/).map(normalize).filter(Boolean):[];
        for(var j=0;j<values.length;j+=1){
          var value=values[j].match(/(?:US\$|\$)\s*([0-9]+(?:[.,][0-9]+)?)/);
          if(value){result.earned="$"+value[1];result.earnedUsd=parseMoney(result.earned);break;}
        }
        if(result.earned)break;
      }
    }
    return result.earned?result:null;
  }
  async function readOfficialStatsInPage(tabId) {
    var results=await chrome.scripting.executeScript({
      target:{tabId:tabId},
      world:"MAIN",
      func:readVisibleOfficialSummaryFromPage
    });
    var result=results&&results[0]&&results[0].result;
    if(!result)throw new Error("Statistics aún no mostró el resumen oficial.");
    return {ok:true,method:"page-dom",summary:result};
  }
  async function readOfficialStatsViaTrpc(tabId, startIso, endIso) {
    var results=await chrome.scripting.executeScript({
      target:{tabId:tabId},
      world:"MAIN",
      func:async function(profileId,statsUrl,startIso,endIso) {
        function serializeDateInput(start,end,payload) {
          return {json:Object.assign({},payload,{dateSince:start.toISOString(),dateTill:end.toISOString()}),meta:{values:{dateSince:["Date"],dateTill:["Date"]}}};
        }
        function unwrap(body) {
          var data=body&&body.result&&body.result.data;
          return data&&data.json!=null?data.json:(data&&data.data!=null?data.data:null);
        }
        function normalizeSummary(data) {
          var summary=data&&data.summary||{};
          var earned=Number(summary.totalInterpreterPay);
          var callCount=Number(summary.totalNumberOfCalls);
          var callLength=summary.totalCallLengthInterpreter||null;
          return {earnedUsd:Number.isFinite(earned)?earned:null,earned:Number.isFinite(earned)?"$"+earned.toFixed(2):null,callCount:Number.isFinite(callCount)?String(callCount):null,callLength:callLength?String(callLength):null,source:"fetchInterpreterLogs"};
        }
        async function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
        async function readOnce(url,payload){
          var res=await fetch(url,{method:"POST",credentials:"include",cache:"no-store",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(payload)});
          var text=await res.text(),body=null;
          try{body=JSON.parse(text);}catch(_){}
          if(!res.ok){
            var detail=String(text||"").replace(/\s+/g," ").slice(0,240);
            throw new Error("fetchInterpreterLogs HTTP "+res.status+(detail?" · "+detail:""));
          }
          var data=unwrap(body),summary=normalizeSummary(data);
          if(!summary.earned)throw new Error("La respuesta autenticada no contiene totalInterpreterPay.");
          return summary;
        }
        var start=new Date(startIso),end=new Date(endIso);
        if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<start)throw new Error("Rango de ingresos inválido.");
        var payload={isScheduled:false,interpreterUserProfileId:String(profileId),outputTimeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,filter:{fields:[],tags:[]},pagination:{pageSize:100,pageNumber:1}};
        var input=serializeDateInput(start,end,payload),lastError=null,url=statsUrl.replace(/\/profile\/[^/]+\/logs.*$/,"")+"/api/trpc/logFetcher.fetchInterpreterLogs";
        for(var attempt=1;attempt<=3;attempt+=1){
          try{return await readOnce(url,input);}catch(error){lastError=error;if(attempt<3)await sleep(350*attempt);}
        }
        throw lastError||new Error("Cloud Interpreter no devolvió el resumen tRPC.");
      },
      args:[(String(OFFICIAL_STATS_URL).match(/\/profile\/([^/]+)\/logs/)||[])[1]||"",OFFICIAL_STATS_URL,startIso,endIso]
    });
    var result=results&&results[0]&&results[0].result;
    if(!result||result.error)throw new Error(result&&result.error||"Cloud Interpreter no devolvió el resumen tRPC.");
    return {ok:true,method:"page-trpc",summary:result};
  }
  function earningsWindow(period) {
    var now = new Date();
    var year = now.getFullYear(), month = now.getMonth(), day = now.getDate();
    if (period === "previousMonth") {
      return {
        period: period,
        start: new Date(year, month - 1, 1, 0, 0, 0, 0),
        end: new Date(year, month, 0, 23, 59, 59, 999)
      };
    }
    if (period === "currentMonth") {
      return {
        period: period,
        start: new Date(year, month, 1, 0, 0, 0, 0),
        end: now
      };
    }
    return {
      period: "today",
      start: new Date(year, month, day, 0, 0, 0, 0),
      end: now
    };
  }
  function rangeForIso(period) {
    var range = earningsWindow(period);
    return {
      period: range.period,
      startIso: range.start.toISOString(),
      endIso: range.end.toISOString()
    };
  }
  function dailyRange(date) {
    var day = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    return { start: day, end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999) };
  }
  function monthlyRange(year, month) {
    return {
      start: new Date(year, month, 1, 0, 0, 0, 0),
      end: new Date(year, month + 1, 0, 23, 59, 59, 999)
    };
  }
  function callLengthToMinutes(value) {
    if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
    var text = String(value || "").trim();
    var parts = text.split(":").map(function (part) { return Number(part); });
    if (parts.some(function (part) { return !Number.isFinite(part); })) return 0;
    if (parts.length === 3) return Math.max(0, parts[0] * 60 + parts[1] + parts[2] / 60);
    if (parts.length === 2) return Math.max(0, parts[0] + parts[1] / 60);
    var numeric = Number(text.replace(",", "."));
    return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
  }
  function buildOfficialChartItem(key, label, range, summary) {
    return {
      key: key,
      label: label,
      startIso: range.start.toISOString(),
      endIso: range.end.toISOString(),
      earnedUsd: Number(summary.earnedUsd) >= 0 ? Number(summary.earnedUsd) : 0,
      callCount: Number(summary.callCount) >= 0 ? Number(summary.callCount) : 0,
      minutes: callLengthToMinutes(summary.callLength),
      callLength: summary.callLength || null
    };
  }
  async function syncEarningsChart(period) {
    period = period === "year" ? "year" : "currentMonth";
    return enqueueEarningsSync("chart:" + period, async function () {
      var now = new Date();
      var jobs = [];
      if (period === "currentMonth") {
        for (var day = 1; day <= now.getDate(); day += 1) {
          var date = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0, 0);
          var range = dailyRange(date);
          if (day === now.getDate()) range.end = now;
          jobs.push({ key: localDay(date), label: String(day), range: range });
        }
      } else {
        for (var month = 0; month < 12; month += 1) {
          var monthly = monthlyRange(now.getFullYear(), month);
          if (month > now.getMonth()) {
            jobs.push({ key: String(now.getFullYear()) + "-" + String(month + 1).padStart(2, "0"), label: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][month], range: null });
          } else {
            if (month === now.getMonth()) monthly.end = now;
            jobs.push({ key: String(now.getFullYear()) + "-" + String(month + 1).padStart(2, "0"), label: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][month], range: monthly });
          }
        }
      }
      var items = [];
      for (var offset = 0; offset < jobs.length; offset += 4) {
        var batch = jobs.slice(offset, offset + 4);
        var loaded = await Promise.all(batch.map(async function (job) {
          if (!job.range) return { key: job.key, label: job.label, earnedUsd: 0, callCount: 0, minutes: 0, future: true };
          var trpc = await readOfficialStatsViaTrpc((String(OFFICIAL_STATS_URL).match(/\/profile\/([^/]+)\/logs/) || [])[1] || "", job.range.start.toISOString(), job.range.end.toISOString());
          return buildOfficialChartItem(job.key, job.label, job.range, trpc.summary || {});
        }));
        items = items.concat(loaded);
      }
      var stored = await chrome.storage.local.get(["effectifPlatformMirror"]);
      var mirror = Object.assign({}, stored.effectifPlatformMirror || {});
      var charts = Object.assign({}, mirror.earningsCharts || {});
      charts[period] = {
        schema: "signal-interpreter-earnings-chart/v1",
        period: period,
        year: now.getFullYear(),
        capturedAt: iso(),
        complete: true,
        source: "fetchInterpreterLogs",
        items: items
      };
      mirror.earningsCharts = charts;
      await chrome.storage.local.set({ effectifPlatformMirror: mirror });
      record("PLATFORM_EARNINGS_CHART_COMPLETED", { period: period, itemCount: items.length, source: "fetchInterpreterLogs" }, "info", "background");
      return { ok: true, period: period, chart: charts[period] };
    });
  }
  function mirrorEarningBaseline(mirror, period) {
    var item = period === "today"
      ? (mirror && mirror.earnings && mirror.earnings.today) || (mirror && mirror.statistics)
      : mirror && mirror.earnings && mirror.earnings[period];
    var summary = item && item.summary || {};
    if (summary.earnedUsd == null || summary.earnedUsd === "") return null;
    var earnedUsd = Number(summary.earnedUsd);
    if (!Number.isFinite(earnedUsd) || earnedUsd < 0) return null;
    return {
      earnedUsd: earnedUsd,
      earned: summary.earned || null,
      callCount: Number(summary.callCount) >= 0 ? Number(summary.callCount) : 0,
      minutes: callLengthToMinutes(summary.callLength),
      callLength: summary.callLength || null,
      capturedAt: item.capturedAt || null,
      source: item.source || "platform-page-context"
    };
  }
  async function captureCallEarningsBaseline(callId, startedAt) {
    var stored = await chrome.storage.local.get(["effectifState", "effectifPlatformMirror", "effectifCallEarnings", "effectifConfig"]);
    var state = Object.assign(baseState(), stored.effectifState || {});
    if (!callId || state.callId !== callId || !state.callStartedAt) return false;
    var existing = stored.effectifCallEarnings || {};
    var expectedStartMs = Date.parse(startedAt || state.callStartedAt);
    function isSafeExistingBaseline(value) {
      if (!value || value.earnedUsd == null || value.earnedUsd === "" ||
          !Number.isFinite(Number(value.earnedUsd)) || Number(value.earnedUsd) < 0) return false;
      if (value.source === "local-completed-calls" && value.earned == null) return true;
      var observedAt = Date.parse(value.capturedAt);
      return value.earned != null && Number.isFinite(expectedStartMs) &&
        Number.isFinite(observedAt) && observedAt <= expectedStartMs;
    }
    if (existing.callId === callId && existing.baselines &&
        isSafeExistingBaseline(existing.baselines.today) &&
        isSafeExistingBaseline(existing.baselines.currentMonth)) return true;
    var mirror = stored.effectifPlatformMirror || {};
    var config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {});
    function localFallback(period) {
      var reference = new Date(startedAt || state.callStartedAt);
      if (!Number.isFinite(reference.getTime())) reference = new Date();
      function inTargetPeriod(call) {
        var date = new Date(call.startedAt || call.endedAt);
        if (!Number.isFinite(date.getTime())) return false;
        if (period === "today") return localDay(date) === localDay(reference);
        return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
      }
      var completed = (Array.isArray(state.completedCalls) ? state.completedCalls : []).filter(inTargetPeriod);
      var unfinished = (Array.isArray(state.unfinishedCalls) ? state.unfinishedCalls : []).filter(inTargetPeriod);
      function callSeconds(call) {
        var candidates = [call.platformSeconds, call.billableSecondsAssumed, call.observedSeconds];
        for (var i = 0; i < candidates.length; i += 1) {
          if (candidates[i] == null || candidates[i] === "") continue;
          var value = Number(candidates[i]);
          if (Number.isFinite(value) && value >= 0) return value;
        }
        return 0;
      }
      return {
        earnedUsd: completed.reduce(function (sum, call) { return sum + Number(call.estimatedRevenue || 0); }, 0),
        earned: null,
        callCount: completed.length + unfinished.length,
        minutes: completed.concat(unfinished).reduce(function (sum, call) { return sum + callSeconds(call); }, 0) / 60,
        callLength: null,
        capturedAt: null,
        source: "local-completed-calls"
      };
    }
    function baseline(period) {
      var found = mirrorEarningBaseline(mirror, period);
      var startedMs = Date.parse(startedAt || state.callStartedAt);
      var capturedMs = found && Date.parse(found.capturedAt);
      if (found && found.earned != null && Number.isFinite(startedMs) &&
          Number.isFinite(capturedMs) && capturedMs <= startedMs) {
        return Object.assign({ callId: callId }, found, { source: "pre-call-platform-mirror" });
      }
      return Object.assign({ callId: callId }, localFallback(period));
    }
    var payload = {
      schema: "signal-interpreter-active-call-earnings/v1",
      callId: callId,
      startedAt: startedAt || state.callStartedAt,
      capturedAt: iso(),
      modality: state.callModality || "OPI",
      ratePerMinute: (state.callModality || "OPI") === "VRI" ? Number(config.vriRatePerMinute || 0.25) : Number(config.opiRatePerMinute || 0.20),
      baselines: {
        today: baseline("today"),
        currentMonth: baseline("currentMonth")
      }
    };
    await chrome.storage.local.set({ effectifCallEarnings: payload });
    record("CALL_EARNINGS_BASELINE_CAPTURED", {
      callId: callId,
      startedAt: payload.startedAt,
      todayBaselineUsd: payload.baselines.today && payload.baselines.today.earnedUsd != null ? payload.baselines.today.earnedUsd : null,
      currentMonthBaselineUsd: payload.baselines.currentMonth && payload.baselines.currentMonth.earnedUsd != null ? payload.baselines.currentMonth.earnedUsd : null,
      todayBaselineSource: payload.baselines.today && payload.baselines.today.source || "unknown",
      currentMonthBaselineSource: payload.baselines.currentMonth && payload.baselines.currentMonth.source || "unknown"
    }, "info", "background");
    return true;
  }
  async function persistOfficialStats(tab,readResult,method){
    var parsed=readResult.summary||{};
    var earningsState=await chrome.storage.local.get(["effectifPlatformMirror","effectifState","effectifConfig","effectifCallEarnings"]);
    var currentState=Object.assign(baseState(),earningsState.effectifState||{});
    var currentConfig=Object.assign({},DEFAULT_CONFIG,earningsState.effectifConfig||{});
    var today=localDay(),calls=Array.isArray(currentState.completedCalls)?currentState.completedCalls.filter(function(call){return localDay(call.startedAt||call.endedAt)===today;}):[];
    var localCompletedUsd=calls.reduce(function(sum,call){return sum+Number(call.estimatedRevenue||0);},0);
    var liveSeconds=currentState.callStartedAt?Math.max(0,(Date.now()-Date.parse(currentState.callStartedAt))/1000):0;
    var localRate=currentState.callModality==="VRI"?Number(currentConfig.vriRatePerMinute||0.25):Number(currentConfig.opiRatePerMinute||0.20);
    var localEstimateUsd=localCompletedUsd+liveSeconds/60*localRate;
    var officialUsd=Number(parsed.earnedUsd);
    var deltaUsd=Number.isFinite(officialUsd)?Math.round((officialUsd-localEstimateUsd)*10000)/10000:null;
    var storedMirror=earningsState.effectifPlatformMirror;
    var mirror=Object.assign({},storedMirror||{});
    var callEarnings=earningsState.effectifCallEarnings||{};
    var previousStatistics=mirror.statistics||{};
    var callBaseline=previousStatistics.callBaseline||null;
    var persistCallEarnings=null;
    if(currentState.callId && currentState.callStartedAt){
      if(callEarnings.callId===currentState.callId && callEarnings.baselines && callEarnings.baselines.today){
        callBaseline=callEarnings.baselines.today;
      } else if(!callBaseline || callBaseline.callId!==currentState.callId){
        callBaseline={callId:currentState.callId,capturedAt:iso(),earnedUsd:Number(parsed.earnedUsd),earned:parsed.earned,source:"official-sync-fallback"};
        callEarnings={
          schema:"signal-interpreter-active-call-earnings/v1",callId:currentState.callId,
          startedAt:currentState.callStartedAt,capturedAt:iso(),modality:currentState.callModality||"OPI",
          baselines:{today:callBaseline,currentMonth:null}
        };
        persistCallEarnings=callEarnings;
      }
    }
    mirror.statistics=Object.assign({},previousStatistics,{
      schema:"signal-interpreter-official-stats/v1",key:"statistics",route:"/profile/<ID>/logs",
      url:OFFICIAL_STATS_URL,capturedAt:iso(),reason:"background-page-context",
      summary:{earned:parsed.earned,earnedUsd:parsed.earnedUsd,callLength:parsed.callLength,callCount:parsed.callCount,localEstimateUsd:Math.round(localEstimateUsd*10000)/10000,deltaUsd:deltaUsd},
      callBaseline:callBaseline,
      source:"platform-page-context",tabId:tab.id
    });
    var todayEarnings=Object.assign({},mirror.earnings||{},{
      today:{
        schema:"signal-interpreter-earnings-range/v1",period:"today",
        startIso:new Date(new Date().setHours(0,0,0,0)).toISOString(),endIso:iso(),
        capturedAt:iso(),source:"platform-page-context",tabId:tab.id,
        summary:{earned:parsed.earned,earnedUsd:parsed.earnedUsd,callLength:parsed.callLength,callCount:parsed.callCount},
        callBaseline:callBaseline
      }
    });
    mirror.earnings=todayEarnings;
    var mirrorPersist={effectifPlatformMirror:mirror};
    if(persistCallEarnings) mirrorPersist.effectifCallEarnings=persistCallEarnings;
    await chrome.storage.local.set(mirrorPersist);
    record("PLATFORM_OFFICIAL_SYNC_COMPLETED",{method:method,url:OFFICIAL_STATS_URL,earned:parsed.earned,callLength:parsed.callLength,callCount:parsed.callCount,localEstimateUsd:Math.round(localEstimateUsd*10000)/10000,deltaUsd:deltaUsd},"info","popup");
    return {ok:true,method:method,snapshot:mirror.statistics};
  }
  function isCloudCallUrl(raw) {
    return /^https:\/\/app\.cloudinterpreter\.com\/call\/[^/?#]+(?:[?#].*)?$/.test(String(raw || ""));
  }
  function isCloudStatisticsUrl(raw) {
    return /^https:\/\/app\.cloudinterpreter\.com\/profile\/[^/]+\/logs\/?(?:[?#].*)?$/.test(String(raw || ""));
  }
  async function getOfficialSyncContext(){
    var storedState=await chrome.storage.local.get(["effectifState"]);
    var activeCallState=!!(storedState.effectifState && storedState.effectifState.callStartedAt);
    var tabs=await chrome.tabs.query({url:AUTHORIZED_ORIGIN+"/*"});
    var cloudTabs=tabs.filter(function(tab){return isAuthorizedCloudUrl(tab.url);});
    var callTab=cloudTabs.find(function(tab){return isCloudCallUrl(tab.url);});
    var statsTab=cloudTabs.find(function(tab){return isCloudStatisticsUrl(tab.url);});
    var callSafe=activeCallState||!!callTab;
    var targetTab=callSafe ? callTab : (statsTab||cloudTabs.find(function(tab){return !!tab.active;})||cloudTabs[0]||null);
    if(callSafe && !callTab){
      record("PLATFORM_OFFICIAL_SYNC_CALL_SAFE_BLOCKED",{reason:"active-call-without-call-tab"},"warn","background");
      throw new Error("No se pudo sincronizar sin afectar la llamada: no se identificó la pestaña activa de la llamada.");
    }
    if(!targetTab) throw new Error("No se pudo sincronizar sin afectar la llamada: abre Cloud Interpreter primero.");
    return {targetTab:targetTab,callSafe:callSafe};
  }
  async function syncOfficialPlatformDataUnsafe(){
    var range=rangeForIso("today");
    var context=await getOfficialSyncContext();
    var targetTab=context.targetTab,callSafe=context.callSafe;
    record("PLATFORM_OFFICIAL_SYNC_REQUESTED",{
      targetTabId:targetTab.id,
      route:String(targetTab.url||"").replace(/\/call\/[^/]+/,"/call/<ID>").replace(/\/profile\/[^/]+/,"/profile/<ID>"),
      callSafe:callSafe,
      policy:"page-context-authenticated-no-tab-create-no-navigation-no-reload"
    },"info","popup");

    try{
      var trpc=await readOfficialStatsViaTrpc(targetTab.id,range.startIso,range.endIso);
      if(trpc&&trpc.summary&&trpc.summary.earned){
        return await persistOfficialStats(targetTab,trpc,callSafe?"page-trpc-call-safe":"page-trpc-silent");
      }
      throw new Error("La sesión autenticada no devolvió el resumen oficial.");
    }catch(error){
      record("PLATFORM_OFFICIAL_PAGE_TRPC_ERROR",{
        url:OFFICIAL_STATS_URL,tabId:targetTab.id,
        route:String(targetTab.url||"").replace(/\/call\/[^/]+/,"/call/<ID>").replace(/\/profile\/[^/]+/,"/profile/<ID>"),
        callSafe:callSafe,error:String(error)
      },"warn","popup");
      if(callSafe){
        throw new Error("No se pudo sincronizar sin tocar la llamada: "+String(error));
      }
      throw new Error("No se pudo sincronizar silenciosamente: "+String(error));
    }
  }
  async function syncOfficialEarningsRangeUnsafe(period){
    var range=rangeForIso(period);
    var context=await getOfficialSyncContext();
    var targetTab=context.targetTab,callSafe=context.callSafe;
    record("PLATFORM_EARNINGS_RANGE_REQUESTED",{
      period:range.period,startIso:range.startIso,endIso:range.endIso,
      targetTabId:targetTab.id,
      route:String(targetTab.url||"").replace(/\/call\/[^/]+/,"/call/<ID>").replace(/\/profile\/[^/]+/,"/profile/<ID>"),
      callSafe:callSafe,
      policy:"page-context-authenticated-no-tab-create-no-navigation-no-reload"
    },"info","background");
    try{
      var trpc=await readOfficialStatsViaTrpc(targetTab.id,range.startIso,range.endIso);
      var parsed=trpc&&trpc.summary||null;
      if(!parsed||!parsed.earned) throw new Error("La sesión autenticada no devolvió ingresos para el rango solicitado.");
      var stored=await chrome.storage.local.get(["effectifPlatformMirror","effectifState","effectifCallEarnings"]);
      var mirror=Object.assign({},stored.effectifPlatformMirror||{});
      var storedState=Object.assign(baseState(),stored.effectifState||{});
      var earnings=Object.assign({},mirror.earnings||{});
      var previousItem=earnings[range.period]||{};
      var callEarnings=stored.effectifCallEarnings||{};
      var callBaseline=previousItem.callBaseline||null;
      var persistCallEarnings=null;
      if(range.period!=="previousMonth" && storedState.callId && storedState.callStartedAt){
        if(callEarnings.callId===storedState.callId && callEarnings.baselines && callEarnings.baselines[range.period]){
          callBaseline=callEarnings.baselines[range.period];
        } else if(!callBaseline || callBaseline.callId!==storedState.callId){
          callBaseline={callId:storedState.callId,capturedAt:iso(),earnedUsd:Number(parsed.earnedUsd),earned:parsed.earned,source:"official-sync-fallback"};
          callEarnings=Object.assign({},callEarnings,{
            schema:"signal-interpreter-active-call-earnings/v1",callId:storedState.callId,
            startedAt:callEarnings.startedAt||storedState.callStartedAt,capturedAt:callEarnings.capturedAt||iso(),modality:callEarnings.modality||storedState.callModality||"OPI",
            baselines:Object.assign({today:null,currentMonth:null},callEarnings.baselines||{})
          });
          callEarnings.baselines[range.period]=callBaseline;
          persistCallEarnings=callEarnings;
        }
      }
      var item={
        schema:"signal-interpreter-earnings-range/v1",
        period:range.period,startIso:range.startIso,endIso:range.endIso,
        capturedAt:iso(),source:"platform-page-context",tabId:targetTab.id,
        summary:{earned:parsed.earned,earnedUsd:parsed.earnedUsd,callLength:parsed.callLength,callCount:parsed.callCount},
        callBaseline:callBaseline
      };
      earnings[range.period]=item;
      mirror.earnings=earnings;
      if(range.period==="today"){
        mirror.statistics=Object.assign({},mirror.statistics||{},{
          schema:"signal-interpreter-official-stats/v1",key:"statistics",route:"/profile/<ID>/logs",
          url:OFFICIAL_STATS_URL,capturedAt:item.capturedAt,reason:"background-page-context",
          summary:item.summary,callBaseline:item.callBaseline,source:"platform-page-context",tabId:targetTab.id
        });
      }
      var rangePersist={effectifPlatformMirror:mirror};
      if(persistCallEarnings) rangePersist.effectifCallEarnings=persistCallEarnings;
      await chrome.storage.local.set(rangePersist);
      record("PLATFORM_EARNINGS_RANGE_COMPLETED",{
        period:range.period,method:"page-trpc",earned:parsed.earned,
        callLength:parsed.callLength,callCount:parsed.callCount
      },"info","background");
      return {ok:true,method:"page-trpc",period:range.period,snapshot:item};
    }catch(error){
      record("PLATFORM_EARNINGS_RANGE_ERROR",{
        period:range.period,startIso:range.startIso,endIso:range.endIso,
        tabId:targetTab.id,callSafe:callSafe,error:String(error)
      },"warn","background");
      throw new Error((callSafe?"No se pudo sincronizar sin tocar la llamada: ":"No se pudo sincronizar silenciosamente: ")+String(error));
    }
  }
  function syncOfficialPlatformData(){
    return enqueueEarningsSync("official-today", syncOfficialPlatformDataUnsafe);
  }
  function syncOfficialEarningsRange(period){
    return enqueueEarningsSync("official-range:" + String(period || "today"), function () {
      return syncOfficialEarningsRangeUnsafe(period);
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
    var stored=await chrome.storage.local.get(["effectifState"]),state=normalizeHotloadState(normalizeStateShape(Object.assign(baseState(),stored.effectifState||{})));state.groqCapture=Object.assign({},state.groqCapture||{},patch||{});
    state.transcriptionStatus={phase:state.groqCapture.status||"idle",connected:state.groqCapture.status==="connected",engine:"groq"};state.transcriptionActive=state.groqCapture.status==="connected";state.transcriptionTabId=state.transcriptionActive?(signalActiveSessionId||null):null;
    if(state.hotLoadLease&&state.hotLoadLease.phase==="active-call") state.hotLoadLease=Object.assign({},state.hotLoadLease,{captureExpected:state.groqCapture.status!=="idle"&&state.groqCapture.status!=="stopped",captureStatus:state.groqCapture.status,transcriptionSessionId:signalActiveSessionId||state.hotLoadLease.transcriptionSessionId||null,lastHeartbeatAt:iso()});
    await chrome.storage.local.set({effectifState:cloneStateForStorage(state)});
  }
  async function startGroqCapture(sessionId,audioStreamId,sendResponse){
    try{
      var data=await loadSignalSessions(),session=data.sessions.find(function(s){return s.id===sessionId||s.id===data.activeSessionId});var stored=await chrome.storage.local.get(["effectifConfig","effectifState"]),config=Object.assign({},DEFAULT_CONFIG,stored.effectifConfig||{}),state=normalizeHotloadState(normalizeStateShape(Object.assign(baseState(),stored.effectifState||{})));
      if(!session)throw new Error("Sesión no encontrada");if(!(await SignalGroqTranscriber.ready()))throw new Error("Configura la Groq API Key una sola vez en este equipo.");if(!audioStreamId)throw new Error("No se recibió el audio de la pestaña.");
      if(hasActiveCall(state)){
        state.hotLoadLease=Object.assign({},state.hotLoadLease||baseState().hotLoadLease,{schema:HOTLOAD_SCHEMA,phase:"active-call",leaseId:state.hotLoadLease&&state.hotLoadLease.leaseId||uid(),callId:state.callId,callStartedAt:state.callStartedAt,callSourceTabId:state.callSourceTabId,modality:state.callModality,transcriptionSessionId:session.id,captureExpected:true,captureStatus:"starting",runtimeVersion:chrome.runtime.getManifest().version,acquiredAt:state.hotLoadLease&&state.hotLoadLease.acquiredAt||iso(),lastHeartbeatAt:iso(),closedAt:null});
        await chrome.storage.local.set({effectifState:cloneStateForStorage(state)});
        record("HOTLOAD_CAPTURE_LEASE_PREPARED",{callId:state.callId,tabId:state.callSourceTabId||null,sessionId:session.id,runtimeVersion:chrome.runtime.getManifest().version}, "info","runtime");
      }
      await ensureOffscreen();var response=await chrome.runtime.sendMessage({target:"offscreen",type:"SIGNAL_START_GROQ_CAPTURE",streamId:audioStreamId,sessionId:session.id,muted:!!state.microphoneMuted,captionPreview:cachedConfig.liveCaptionOverlayEnabled !== false,tabId:state.callSourceTabId||session.tabId||session.sourceTabId||0});if(!response||!response.ok)throw new Error(response&&response.error||"No se pudo iniciar la captura de audio.");
      signalActiveSessionId=session.id;
      try { if (cachedConfig.liveCaptionOverlayEnabled !== false) SignalCaptionBridge.start(state.callSourceTabId); } catch (_) {}
      state.microphoneMuteStatus="pending";
      await updateGroqCaptureState({status:"connected",tabAudio:true,microphone:true,microphoneMuted:!!state.microphoneMuted,startedAt:iso(),lastChunkAt:null,error:null});
      if(hasActiveCall(state)){
        var callMuteResult=await setMainClientMicrophoneMuted(state.callSourceTabId,!!state.microphoneMuted,"capture-start");
        if(callMuteResult&&callMuteResult.verified===true&&!!callMuteResult.muted===!!state.microphoneMuted){
          state.microphoneOutputMuted=!!state.microphoneMuted;
          state.microphoneOutputStatus="applied";
          state.microphoneOutputTrackCount=Number(callMuteResult.trackCount||0);
          state.microphoneOutputSenderCount=Number(callMuteResult.senderCount||0);
          state.microphoneMuteStatus="applied";
          await chrome.storage.local.set({effectifState:cloneStateForStorage(state)});
        }else{
          state.microphoneMuted=true;
          state.microphoneMuteStatus="error";
          state.microphoneOutputMuted=true;
          state.microphoneOutputStatus="error";
          state.microphoneOutputTrackCount=Number(callMuteResult&&callMuteResult.trackCount||0);
          state.microphoneOutputSenderCount=Number(callMuteResult&&callMuteResult.senderCount||0);
          await chrome.storage.local.set({effectifState:cloneStateForStorage(state)});
          record("SIGNAL_GROQ_CAPTURE_MIC_OUTPUT_VERIFY_ERROR",{
            sessionId:session.id,callId:state.callId||null,
            error:callMuteResult&&callMuteResult.error||"verification-failed",
            policy:"fail-closed"
          },"error","microphone");
        }
      }else{
        state.microphoneMuteStatus="applied";
        await chrome.storage.local.set({effectifState:cloneStateForStorage(state)});
      }
      recordSignalDiagnostic("SIGNAL_GROQ_CAPTURE_STARTED",{sessionId:session.id,sourceTabId:session.sourceTabId,model:config.groqModel||GROQ_MODEL});broadcastSignalEvent({type:"signal.groq.status",sessionId:session.id,status:"connected",tabAudio:true,microphone:true,timestamp:iso()});
      if(sendResponse)sendResponse({ok:true,session:signalSessionCopy(session,true)});return{ok:true};
    }catch(error){await updateGroqCaptureState({status:"error",error:String(error)}).catch(function(){});recordSignalDiagnostic("SIGNAL_GROQ_CAPTURE_ERROR",{sessionId:sessionId,error:String(error)},"error");if(sendResponse)sendResponse({ok:false,error:String(error)});return{ok:false,error:String(error)}}
  }
  async function setMainClientMicrophoneMuted(tabId, muted, source) {
    var targetTabId=Number(tabId);
    if(!Number.isFinite(targetTabId))return{ok:false,muted:!!muted,verified:false,inactive:true,error:"No hay una pestaña de llamada controlable."};
    var lastError=null;
    for(var attempt=1;attempt<=3;attempt+=1){
      try{
        var response=await chrome.tabs.sendMessage(targetTabId,{type:"SIGNAL_MAIN_MICROPHONE_SET",muted:!!muted,source:source||"background"});
        if(response&&response.verified===true&&!!response.muted===!!muted){
          record("EXTENSION_MICROPHONE_OUTPUT_VERIFIED",{tabId:targetTabId,muted:!!muted,source:source||"background",trackCount:Number(response.trackCount||0),senderCount:Number(response.senderCount||0),recoveredBaseline:!!response.recoveredBaseline,attempts:attempt,transport:"content"},"info","microphone");
          return Object.assign({},response,{ok:true,inactive:false,attempts:attempt,transport:"content"});
        }
        lastError=response&&response.error||"La salida del micrófono no pudo verificarse.";
      }catch(error){lastError=String(error);}
      var direct=await executeMainMicrophoneCommand(targetTabId,"set",!!muted,source||"background-direct");
      if(direct&&direct.verified===true&&!!direct.muted===!!muted){
        record("EXTENSION_MICROPHONE_OUTPUT_VERIFIED",{tabId:targetTabId,muted:!!muted,source:source||"background",trackCount:Number(direct.trackCount||0),senderCount:Number(direct.senderCount||0),recoveredBaseline:!!direct.recoveredBaseline,attempts:attempt,transport:"direct-main"},"info","microphone");
        return Object.assign({},direct,{ok:true,inactive:false,attempts:attempt,transport:"direct-main"});
      }
      lastError=direct&&direct.error||lastError;
    }
    record("EXTENSION_MICROPHONE_OUTPUT_VERIFY_ERROR",{tabId:targetTabId,muted:!!muted,source:source||"background",error:lastError||"verification-failed",attempts:3},"error","microphone");
    return{ok:false,muted:!!muted,verified:false,inactive:false,error:lastError||"verification-failed",attempts:3};
  }

  async function setExtensionMicrophoneMutedInternal(muted, source) {
    var desired=!!muted;
    var stored=await chrome.storage.local.get(["effectifState"]);
    var state=normalizeHotloadState(normalizeStateShape(Object.assign(baseState(),stored.effectifState||{})));

    var previousMuted=!!state.microphoneMuted;
    var previousOutputMuted=!!state.microphoneOutputMuted;
    var previousMuteStatus=String(state.microphoneMuteStatus||"unapplied");
    var previousOutputStatus=String(state.microphoneOutputStatus||"unapplied");
    var captureActive=!!(state.groqCapture&&state.groqCapture.status==="connected");
    var outputRequired=hasActiveCall(state);
    state.microphoneMuted=desired;
    state.microphoneMuteRequested=desired;
    state.microphoneMuteStatus="pending";
    state.microphoneOutputMuted=desired;
    state.microphoneOutputStatus=outputRequired?"pending":"unapplied";
    state.groqCapture=Object.assign({},state.groqCapture||{},{microphoneMuted:desired});
    await chrome.storage.local.set({effectifState:cloneStateForStorage(state)});

    record("EXTENSION_MICROPHONE_MUTE_REQUESTED",{
      desired:desired,source:source||"unknown",activeCall:outputRequired,
      activeCapture:captureActive,
      callId:state.callId||null,policy:"preserve-user-intent-until-verified"
    },"info","microphone");
    var captureResult={ok:true,verified:!captureActive,muted:desired,inactive:!captureActive};
    if(captureActive){
      var captureError=null;
      for(var ca=1;ca<=3&&!captureResult.verified;ca+=1){
        try{
          await ensureOffscreen();
          var cr=await chrome.runtime.sendMessage({target:"offscreen",type:"SIGNAL_SET_MICROPHONE_MUTED",muted:desired});
          if(cr&&cr.verified===true&&!!cr.muted===desired)captureResult=Object.assign({},cr,{ok:true,inactive:false,attempts:ca});
          else captureError=cr&&cr.error||"No se verificó la captura del micrófono.";
        }catch(error){captureError=String(error);}
      }
      if(!captureResult.verified)captureResult.error=captureError||"verification-failed";
    }

    var outputResult=outputRequired
      ? await setMainClientMicrophoneMuted(state.callSourceTabId,desired,source||"background")
      : {ok:true,muted:desired,verified:true,inactive:true,trackCount:0,senderCount:0};
    var allVerified=captureResult.verified&&(!outputRequired||outputResult.verified===true);

    if(!allVerified){
      var recoveryMuted=desired ? true : false;
      var recoveryPolicy=desired
        ? "fail-closed-on-explicit-mute"
        : "never-reapply-stale-mute-on-unmute-failure";
      if(captureActive){
        try{
          await ensureOffscreen();
          await chrome.runtime.sendMessage({target:"offscreen",type:"SIGNAL_SET_MICROPHONE_MUTED",muted:recoveryMuted});
        }catch(_){}
      }
      if(outputRequired){
        try{
          await setMainClientMicrophoneMuted(
            state.callSourceTabId,
            recoveryMuted,
            desired ? "fail-closed-explicit-mute" : "unmute-recovery-no-remute"
          );
        }catch(_){}
      }
      state.microphoneMuted=recoveryMuted;
      state.microphoneMuteRequested=desired;
      state.microphoneMuteStatus="error";
      state.microphoneOutputMuted=desired ? true : (outputResult.verified===true ? false : previousOutputMuted);
      state.microphoneOutputStatus="error";
      state.microphoneOutputTrackCount=Number(outputResult.trackCount||0);
      state.microphoneOutputSenderCount=Number(outputResult.senderCount||0);
      state.groqCapture=Object.assign({},state.groqCapture||{},{microphoneMuted:recoveryMuted});
      await chrome.storage.local.set({effectifState:cloneStateForStorage(state)});
      record("EXTENSION_MICROPHONE_MUTE_ERROR",{
        desired:desired,previousMuted:previousMuted,recoveryMuted:recoveryMuted,
        source:source||"unknown",callId:state.callId||null,
        captureVerified:captureResult.verified,outputVerified:!!outputResult.verified,outputRecoveredBaseline:!!outputResult.recoveredBaseline,outputTrackCount:Number(outputResult.trackCount||0),outputSenderCount:Number(outputResult.senderCount||0),outputAttempts:Number(outputResult.attempts||0),
        error:captureResult.error||outputResult.error||"verification-failed",
        policy:recoveryPolicy,
        previousMuteStatus:previousMuteStatus,
        previousOutputStatus:previousOutputStatus,
        invariant:"unmute-errors-never-send-a-follow-up-mute"
      },"error","microphone");
      return{
        ok:false,muted:recoveryMuted,requestedMuted:desired,
        outputMuted:state.microphoneOutputMuted,verified:false,
        error:captureResult.error||outputResult.error||"verification-failed"
      };
    }

    state.microphoneMuted=desired;
    state.microphoneMuteStatus="applied";
    state.microphoneOutputMuted=desired;
    state.microphoneOutputStatus=outputRequired?"applied":"unapplied";
    state.microphoneOutputTrackCount=Number(outputResult.trackCount||0);
    state.microphoneOutputSenderCount=Number(outputResult.senderCount||0);
    state.groqCapture=Object.assign({},state.groqCapture||{},{microphoneMuted:desired});
    await chrome.storage.local.set({effectifState:cloneStateForStorage(state)});
    record("EXTENSION_MICROPHONE_MUTE_APPLIED",{desired:desired,source:source||"unknown",callId:state.callId||null,captureVerified:captureResult.verified,outputVerified:!!outputResult.verified,recoveredBaseline:!!outputResult.recoveredBaseline,trackCount:Number(outputResult.trackCount||0),senderCount:Number(outputResult.senderCount||0)},"info","microphone");
    if(cachedConfig.soundEnabled!==false){
      try{
        await playSound(Math.max(0.05,Number(cachedConfig.volume||0.8)),desired?"mute-on":"mute-off");
        record("EXTENSION_MICROPHONE_SOUND_PLAYED",{desired:desired,source:source||"unknown",cue:desired?"mute-on":"mute-off",volume:Number(cachedConfig.volume||0.8)},"info","microphone");
      }catch(soundError){
        record("EXTENSION_MICROPHONE_SOUND_ERROR",{desired:desired,source:source||"unknown",cue:desired?"mute-on":"mute-off",error:String(soundError)},"warn","microphone");
      }
    }
    return{ok:true,muted:desired,verified:true,captureVerified:captureResult.verified,outputVerified:!!outputResult.verified,trackCount:Number(outputResult.trackCount||0),senderCount:Number(outputResult.senderCount||0)};
  }
  function setExtensionMicrophoneMuted(muted, source) {
    var run = microphoneMuteQueue.then(function () {
      return setExtensionMicrophoneMutedInternal(muted, source);
    }, function () {
      return setExtensionMicrophoneMutedInternal(muted, source);
    });
    microphoneMuteQueue = run.catch(function (error) {
      record("EXTENSION_MICROPHONE_MUTE_QUEUE_ERROR", { error: String(error) }, "error", "microphone");
    });
    return run;
  }
  function toggleExtensionMicrophoneMuted(source) {
    var run = microphoneMuteQueue.then(async function () {
      var stored = await chrome.storage.local.get(["effectifState"]);
      var state = normalizeHotloadState(normalizeStateShape(Object.assign(baseState(), stored.effectifState || {})));
      var recovering = state.microphoneMuteStatus === "error" || state.microphoneOutputStatus === "error";
      var desired = recovering ? false : !state.microphoneMuted;
      if (recovering) record("EXTENSION_MICROPHONE_TOGGLE_RECOVERY_RETRY", {
        source: source || "toggle", desired: desired, previousMuted: !!state.microphoneMuted,
        policy: "error-state-prioritizes-unmute-to-avoid-stuck-muted"
      }, "warn", "microphone");
      return setExtensionMicrophoneMutedInternal(desired, source || "toggle");
    }, async function () {
      var stored = await chrome.storage.local.get(["effectifState"]);
      var state = normalizeHotloadState(normalizeStateShape(Object.assign(baseState(), stored.effectifState || {})));
      var recovering = state.microphoneMuteStatus === "error" || state.microphoneOutputStatus === "error";
      var desired = recovering ? false : !state.microphoneMuted;
      if (recovering) record("EXTENSION_MICROPHONE_TOGGLE_RECOVERY_RETRY", {
        source: source || "toggle", desired: desired, previousMuted: !!state.microphoneMuted,
        policy: "retry-last-request; legacy-error-defaults-to-unmute"
      }, "warn", "microphone");
      return setExtensionMicrophoneMutedInternal(desired, source || "toggle");
    });
    microphoneMuteQueue = run.catch(function (error) {
      record("EXTENSION_MICROPHONE_TOGGLE_QUEUE_ERROR", { error: String(error), source: source || "toggle" }, "error", "microphone");
    });
    return run;
  }
  async function stopGroqCapture(reason){
    try { SignalCaptionBridge.stop(); } catch (_) {}
    try{await ensureOffscreen();await chrome.runtime.sendMessage({target:"offscreen",type:"SIGNAL_STOP_GROQ_CAPTURE"});}catch(_){};
    await updateGroqCaptureState({status:"stopped",tabAudio:false,microphone:false,error:null}).catch(function(){});recordSignalDiagnostic("SIGNAL_GROQ_CAPTURE_STOPPED",{reason:reason||"manual"});broadcastSignalEvent({type:"signal.groq.status",sessionId:signalActiveSessionId,status:"stopped",reason:reason||"manual",timestamp:iso()});return{ok:true};
  }
  function broadcastSignalEvent(event){try{var p=chrome.runtime.sendMessage({type:"SIGNAL_INTERPRETER_EVENT",event:event});if(p&&p.catch)p.catch(function(){});}catch(_){}}
  async function handleGroqCaptionPreviewChunk(message){
    captionPreviewQueue=captionPreviewQueue.then(async function(){
      if(!message||!message.base64)return;
      var data=await loadSignalSessions(),id=message.sessionId||data.activeSessionId;
      var session=data.sessions.find(function(s){return s.id===id});
      if(!session)return;
      var stored=await chrome.storage.local.get(["effectifState"]);
      var currentState=normalizeHotloadState(normalizeStateShape(Object.assign(baseState(),stored.effectifState||{})));
      if(!hasActiveCall(currentState))return;
      if(String(currentState.callSourceTabId)!==String(message.tabId||currentState.callSourceTabId))return;
      if(message.source==="yo" && (currentState.microphoneMuted===true || currentState.microphoneMuteStatus!=="applied" || currentState.microphoneOutputStatus==="error"))return;
      if(message.source!=="yo" && SignalCaptionBridge.isFresh(4500))return;
      if(!(await SignalGroqTranscriber.ready()))return;
      var raw=atob(String(message.base64||"")),bytes=new Uint8Array(raw.length);
      for(var bi=0;bi<raw.length;bi++)bytes[bi]=raw.charCodeAt(bi);
      var blob=new Blob([bytes],{type:"audio/webm"});
      var seq=Number(message.sequence||0);
      var result=await SignalGroqTranscriber.transcribe(blob,{
        model:cachedConfig.groqModel||GROQ_MODEL,
        language:"",
        filename:"signal-caption-preview-"+(seq||Date.now())+".webm",
        prompt:"Transcripción breve para interpretación médica. Detecta automáticamente inglés o español. Conserva nombres propios y términos clínicos.",
        timeoutMs:12000
      });
      if(!result.ok||!String(result.text||"").trim())return;
      var text=String(result.text||"").trim(),language=String(result.language||"");
      if(language!=="en"&&language!=="es")language=SignalCaptionCore.detectLanguage(text);
      var tabId=Number(currentState.callSourceTabId);
      if(!Number.isFinite(tabId))return;
      try{
        await chrome.tabs.sendMessage(tabId,{type:"SIGNAL_CAPTION_UPDATE",caption:{
          text:text.slice(0,4000),language:language||"unknown",source:message.source||"cliente",live:false,native:false
        }});
      }catch(_){}
    }).catch(function(error){
      record("SIGNAL_CAPTION_PREVIEW_ERROR",{error:String(error||"unknown")},"warn","caption");
    });
    return captionPreviewQueue;
  }
  function handleGroqAudioChunk(message){
    signalGroqQueue=signalGroqQueue.then(async function(){
      var data=await loadSignalSessions(),id=message.sessionId||data.activeSessionId,session=data.sessions.find(function(s){return s.id===id});if(!session)return;
      if(message.source==="yo"){
        var micState=normalizeHotloadState(normalizeStateShape(Object.assign(baseState(),(await chrome.storage.local.get(["effectifState"])).effectifState||{})));
        if(micState.microphoneMuted===true || micState.microphoneMuteStatus!=="applied" || micState.microphoneOutputStatus==="error"){
          recordSignalDiagnostic("EXTENSION_MICROPHONE_AUDIO_CHUNK_SUPPRESSED_MUTED",{sessionId:id,sequence:Number(message.sequence||0),bytes:Number(message.bytes||0)}, "info","microphone");
          return;
        }
      }
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
  chrome.tabs.onActivated.addListener(function (activeInfo) {
    refreshActionIndicator(activeInfo.tabId).catch(function () {});
    try { SignalPlatformScreenshot.request("tab-activated").catch(function () {}); } catch (_) {}
  });
  async function refreshAllActionIndicators() {
    try {
      var tabs = await chrome.tabs.query({ url: ["https://app.cloudinterpreter.com/*"] });
      await Promise.all((tabs || []).map(function (tab) {
        return refreshActionIndicator(tab.id, tab.url).catch(function () {});
      }));
    } catch (error) {
      record("ACTION_INDICATOR_REFRESH_ALL_ERROR", { error: String(error) }, "warn", "action");
    }
  }
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.url || changeInfo.status === "loading" || changeInfo.status === "complete") {
      if (changeInfo.url && !isAuthorizedProfileUrl(changeInfo.url)) {
        tabAvailability.delete(Number(tabId));
        tabReadiness.delete(Number(tabId));
      }
      refreshActionIndicator(tabId, changeInfo.url || tab.url).catch(function () {});
      if (changeInfo.url || changeInfo.status === "complete") {
        try { SignalPlatformScreenshot.request(changeInfo.url ? "tab-url-changed" : "tab-loaded").catch(function () {}); } catch (_) {}
      }
    }
  });
  chrome.tabs.onRemoved.addListener(function (tabId) {
    tabAvailability.delete(Number(tabId));
  });

  chrome.runtime.onConnect.addListener(function(port){if(!port||port.name!=="signal-live-console")return;signalLivePort=port;signalLiveConsoleOpen=true;port.onDisconnect.addListener(function(){if(signalLivePort===port){signalLivePort=null;signalLiveConsoleOpen=false;}});});





  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message) return false;
    if(message.type==="SIGNAL_OBSERVATION_SYNC_NOW"){try{SignalObservationSync.flush("manual").then(function(r){sendResponse(r)}).catch(function(e){sendResponse({ok:false,error:String(e)})})}catch(e){sendResponse({ok:false,error:String(e)})}return true;}
    if (message.target === "offscreen" && message.type === "SIGNAL_GROQ_AUDIO_CHUNK") { handleGroqAudioChunk(message); return false; }
    if (message.target === "offscreen" && message.type === "SIGNAL_GROQ_CAPTION_PREVIEW_CHUNK") { handleGroqCaptionPreviewChunk(message); return false; }
    if (message.target === "offscreen" && message.type === "SIGNAL_GROQ_CAPTURE_STATUS") { updateGroqCaptureState({status:String(message.status||"idle"),tabAudio:!!message.tabAudio,microphone:!!message.microphone,microphoneMuted:!!message.microphoneMuted,error:message.error||null,lastChunkAt:message.status==="connected"?null:undefined}).catch(function(){}); broadcastSignalEvent({type:"signal.groq.status",sessionId:signalActiveSessionId,status:message.status||"idle",tabAudio:!!message.tabAudio,microphone:!!message.microphone,error:message.error||null,timestamp:message.timestamp||iso()}); return false; }
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
      if (sender.tab) {
        event.tabId = Number(sender.tab.id);
        event.windowId = Number(sender.tab.windowId);
        event.context = Object.assign({}, event.context || {}, {
          sourceTabId: Number(sender.tab.id),
          sourceWindowId: Number(sender.tab.windowId),
          observedTabStatus: sender.tab.status || null,
          observedTabActive: !!sender.tab.active,
          observedTabUrl: String(sender.tab.url || "").replace(/\?.*$/, "").slice(0, 500)
        });
      }
      appendEvent(event, function () { sendResponse({ ok: true }); });
      if (event.action === "PLATFORM_SESSION_STARTED" || event.action === "PLATFORM_SESSION_ENDED") handleSession(event);
      if (event.action === "AVAILABILITY_STATE") {
        var eventTabId = sender.tab && sender.tab.id;
        if (Number.isFinite(Number(eventTabId))) tabAvailability.set(Number(eventTabId), event.payload && event.payload.state || "unknown");
        handleAvailability(event);
        if (Number.isFinite(Number(eventTabId))) refreshActionIndicator(Number(eventTabId), sender.tab && sender.tab.url).catch(function () {});
      }
      if (event.action === "AUTO_ANSWER_READINESS") {
        var readinessTabId = sender.tab && sender.tab.id;
        if (Number.isFinite(Number(readinessTabId))) {
          tabReadiness.set(Number(readinessTabId), {
            ready: event.payload && event.payload.ready === true,
            authorizedProfile: event.payload && event.payload.authorizedProfile === true,
            exactUrl: String(event.payload && event.payload.exactUrl || ""),
            runtimeVersion: String(event.payload && event.payload.runtimeVersion || ""),
            at: Date.now()
          });
          if (event.payload && event.payload.availability) {
            tabAvailability.set(Number(readinessTabId), String(event.payload.availability));
          }
          refreshActionIndicator(Number(readinessTabId), sender.tab && sender.tab.url).catch(function () {});
        }
      }
      if (event.action === "INCOMING_DIALOG_DETECTED") markIncoming(event);
      if (event.action === "CONNECT_CLICKED") alertOnConnect(event);
      if (event.action === "ANSWER_FLOW_ROUTE_CONFIRMED") {
        mutateState(async function (state) {
          state.autoAnswerTelemetry = Object.assign({}, state.autoAnswerTelemetry || {});
          state.autoAnswerTelemetry.confirmations = Number(state.autoAnswerTelemetry.confirmations || 0) + 1;
          state.autoAnswerTelemetry.lastConfirmedAt = event.timestamp;
        }, "answer-flow-confirmed").catch(function () {});
        requestCallAlert(event.payload && event.payload.callId || null, "answer-flow-confirmed");
      }
      if (event.action === "CONNECT_ROUTE_TIMEOUT") {
        mutateState(async function (state) {
          state.autoAnswerTelemetry = Object.assign({}, state.autoAnswerTelemetry || {});
          state.autoAnswerTelemetry.timeouts = Number(state.autoAnswerTelemetry.timeouts || 0) + 1;
        }, "connect-route-timeout").catch(function () {});
      }
      if (event.action === "CONNECT_ERROR") {
        mutateState(async function (state) {
          state.autoAnswerTelemetry = Object.assign({}, state.autoAnswerTelemetry || {});
          state.autoAnswerTelemetry.errors = Number(state.autoAnswerTelemetry.errors || 0) + 1;
          state.autoAnswerTelemetry.lastError = event.payload && event.payload.message || "CONNECT_ERROR";
        }, "connect-error").catch(function () {});
      }
      if (event.action === "AUTO_ANSWER_SKIPPED_UNVERIFIED_MODALITY") {
        mutateState(async function (state) {
          state.autoAnswerTelemetry = Object.assign({}, state.autoAnswerTelemetry || {});
          state.autoAnswerTelemetry.skipped = Number(state.autoAnswerTelemetry.skipped || 0) + 1;
        }, "auto-answer-skipped").catch(function () {});
      }
      if (event.action === "CALL_ROUTE_ENTERED" || event.action === "ANSWER_FLOW_ROUTE_CONFIRMED") {
        startCall(event);
      }
      if (event.action === "ANSWER_FLOW_ROUTE_CONFIRMED") {
        hotloadHeartbeat("answer-route-confirmed").catch(function() {});
      }
      if (event.action === "CALL_END_CLICKED") rememberCallEnd(event);
      if (event.action === "CALL_ROUTE_ENDED") {
        var seconds = event.payload && event.payload.platformSeconds;
        var endSignal = event.payload && event.payload.endSignal;
        var source = endSignal === "rating-stars-route" || endSignal === "rating-stars-confirmed" ? "rating-route" :
          (endSignal === "pagehide-fallback" ? "pagehide" : "route");
        closeCall(source, typeof seconds === "number" ? seconds : NaN, null);
      }
      return true;
    }
    if(message.type==="INCOMING_DIALOG_CLOSED"){
      mutateState(async function(state){
        if(!state.pendingCall||state.callId)return;
        state.pendingCall.closedAt=message.timestamp||iso();
        if(!state.pendingCall.clickedAt){
          record("INCOMING_DIALOG_CLOSED_OBSERVED",{pendingId:state.pendingCall.id||null,detectedAt:state.pendingCall.detectedAt||null,closedAt:state.pendingCall.closedAt},"info","content");
        }
        chrome.alarms.create("effectif-pending-call",{when:Date.now()+2500});
      },"incoming-dialog-closed");
      return false;
    }
    if(message.type==="RECONCILE_PLATFORM_TELEMETRY"){
      reconcilePlatformTelemetry(message.trigger||"manual").then(function(){
        chrome.storage.local.get(["effectifState"],function(stored){
          sendResponse({ok:true,state:stored.effectifState||{}});
        });
      }).catch(function(error){sendResponse({ok:false,error:String(error)});});
      return true;
    }
    if (message.type === "EFFECTIF_TELEMETRY_STATS") {
      KhoraTelemetryDB.stats().then(function (stats) { sendResponse({ ok: true, stats: stats }); })
        .catch(function (error) { sendResponse({ ok: false, error: String(error) }); });
      return true;
    }
    if (message.type === "EFFECTIF_REFRESH_EXCHANGE_RATE") {
      refreshExchangeRate(message.reason || "manual").then(function (rate) { sendResponse({ ok: true, rate: rate }); })
        .catch(function (error) { sendResponse({ ok: false, error: String(error) }); });
      return true;
    }
    if (message.type === "EFFECTIF_EARNINGS_RANGE") {
      syncOfficialEarningsRange(message.period || "today").then(sendResponse)
        .catch(function (error) {
          record("PLATFORM_EARNINGS_RANGE_MESSAGE_ERROR",{period:message.period||"today",error:String(error)},"warn","popup");
          sendResponse({ ok: false, error: String(error) });
        });
      return true;
    }
    if (message.type === "EFFECTIF_EARNINGS_CHART") {
      syncEarningsChart(message.period || "currentMonth").then(sendResponse)
        .catch(function (error) {
          record("PLATFORM_EARNINGS_CHART_MESSAGE_ERROR",{period:message.period||"currentMonth",error:String(error)},"warn","popup");
          sendResponse({ ok: false, error: String(error) });
        });
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
    if (message.type === "SIGNAL_PLATFORM_SCREENSHOT_REQUEST") {
      if (!sender.tab || !isAuthorizedCloudUrl(sender.tab.url || "")) { sendResponse({ ok: false, error: "Origen no autorizado" }); return false; }
      try { SignalPlatformScreenshot.request(message.reason || "content-hint").then(sendResponse).catch(function (error) { sendResponse({ ok: false, error: String(error) }); }); } catch (error) { sendResponse({ ok: false, error: String(error) }); }
      return true;
    }
    if (message.type === "SYNC_OFFICIAL_PLATFORM_DATA") { syncOfficialPlatformData().then(sendResponse).catch(function(error){record("PLATFORM_OFFICIAL_SYNC_ERROR",{url:OFFICIAL_STATS_URL,error:String(error)},"error","popup");sendResponse({ok:false,error:String(error)});}); return true; }
    if (message.type === "SIGNAL_EXTENSION_MICROPHONE_SET") {
      setExtensionMicrophoneMuted(message.muted, message.source || "ui").then(sendResponse).catch(function (error) {
        sendResponse({ ok: false, error: String(error), muted: !!message.muted, verified: false });
      });
      return true;
    }
    if (message.type === "SIGNAL_EXTENSION_MICROPHONE_KEYBOARD_FALLBACK") {
      requestKeyboardMicrophoneToggle(message.source || "keyboard-content-fallback")
        .then(sendResponse)
        .catch(function (error) { sendResponse({ ok: false, error: String(error), verified: false }); });
      return true;
    }
    if (message.type === "SIGNAL_EXTENSION_MICROPHONE_TOGGLE") {
      if (message.gesture) record("EXTENSION_MICROPHONE_GESTURE_TRIGGERED", {
        source: message.source || "unknown", gesture: String(message.gesture),
        holdMs: Number(message.holdMs || 0), tabId: sender && sender.tab ? sender.tab.id : null
      }, "info", "microphone");
      toggleExtensionMicrophoneMuted(message.source || "ui").then(sendResponse).catch(function (error) {
        chrome.storage.local.get(["effectifState"]).then(function(stored){
          var current=stored.effectifState||{};
          sendResponse({
            ok:false, error:String(error), verified:false,
            muted:typeof current.microphoneMuted==="boolean"?current.microphoneMuted:false,
            requestedMuted:typeof current.microphoneMuteRequested==="boolean"?current.microphoneMuteRequested:false
          });
        }).catch(function(){sendResponse({ok:false,error:String(error),verified:false,muted:false,requestedMuted:false});});
      });
      return true;
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
    if(message.type==="GET_OBSERVABILITY_CHECKPOINT"){chrome.storage.local.get(["effectifObservabilityUpdate","effectifObservabilityExport"],function(s){sendResponse({ok:true,update:s.effectifObservabilityUpdate||null,lastExport:s.effectifObservabilityExport||null,currentSequence:Number(s.effectifEventSequence||0)});});return true;}
    if (message.type === "EFFECTIF_GROQ_USAGE") {
      updateGroqUsage(message); sendResponse({ ok: true }); return false;
    }
    return false;
  });
  var networkRequests = new Map();
  var networkWindow = new Map();
  function networkKey(item){return [item.method||"GET",item.type||"other",item.url||"",String(item.statusCode||0)].join("|");}
  function noteNetworkActivity(item){
    var key=networkKey(item),current=networkWindow.get(key)||{method:item.method||"GET",type:item.type||"other",url:item.url||"",statusCode:Number(item.statusCode||0),count:0,totalDurationMs:0,maxDurationMs:0};
    current.count+=1; current.totalDurationMs+=Number(item.durationMs||0); current.maxDurationMs=Math.max(current.maxDurationMs,Number(item.durationMs||0)); networkWindow.set(key,current);
  }
  function flushNetworkActivity(){
    if(!networkWindow.size)return;
    var entries=Array.from(networkWindow.values()).map(function(x){return Object.assign({},x,{avgDurationMs:x.count?Math.round(x.totalDurationMs/x.count):0});}).sort(function(a,b){return b.count-a.count||b.maxDurationMs-a.maxDurationMs;}).slice(0,120);
    networkWindow.clear();
    record("NETWORK_ACTIVITY_WINDOW",{windowSeconds:15,endpointCount:entries.length,endpoints:entries},"info","webRequest");
  }

  async function markObservabilityBuildCheckpoint(reason, previousVersion) {
    try {
      var files=["manifest.json","background.js","content.js","offscreen.js","groq-transcriber.js","ui/popup.js","ui/popup.html","ui/popup.css","ui/time-format.js"];
      var texts=await Promise.all(files.map(function(file){return fetch(chrome.runtime.getURL(file),{cache:"no-store"}).then(function(response){if(!response.ok)throw new Error("No se pudo leer "+file);return response.text();});}));
      var bytes=new TextEncoder().encode(texts.join("\n/* SIGNAL OBSERVABILITY BUILD BOUNDARY */\n"));
      var digest=await crypto.subtle.digest("SHA-256",bytes);
      var fingerprint=Array.from(new Uint8Array(digest)).map(function(x){return x.toString(16).padStart(2,"0");}).join("");
      var stored=await chrome.storage.local.get(["effectifObservabilityUpdate","effectifEventSequence"]),current=stored.effectifObservabilityUpdate||null;
      if(!current||current.codeFingerprint!==fingerprint||(reason==="update"&&current.updatedAt)){
        await chrome.storage.local.set({effectifObservabilityUpdate:{
          version:chrome.runtime.getManifest().version,updatedAt:iso(),previousVersion:previousVersion||current&&current.version||null,
          reason:reason||"code-fingerprint-change",eventSequence:Number(stored.effectifEventSequence||0),codeFingerprint:fingerprint
        }});
      }
    }catch(error){record("OBSERVABILITY_CHECKPOINT_ERROR",{message:String(error)},"warn","runtime");}
  }
  chrome.runtime.onUpdateAvailable.addListener(function(details){
    coordinateUpdateAvailability(details).catch(function(error){
      record("HOTLOAD_UPDATE_COORDINATOR_ERROR", { availableVersion: details && details.version || null, error: String(error) }, "error", "runtime");
    });
  });
  chrome.runtime.onInstalled.addListener(function(details){
    chrome.storage.local.get(["effectifState"]).then(function (stored) {
      var priorState = normalizeStateShape(Object.assign(baseState(), stored.effectifState || {}));
      var activeCall = hasActiveCall(priorState);
      record("EXTENSION_VERSION_BOUNDARY", Object.assign({
        currentVersion: chrome.runtime.getManifest().version,
        previousVersion: details && details.previousVersion || null,
        reason: details && details.reason || "installed",
        contract: "version-changes-with-development",
        hotLoadTransaction: activeCall ? "preserve-call-and-defer-destructive-runtime-boundary" : "safe-boundary"
      }, activeCall ? { activeCallId: priorState.callId, activeCallSourceTabId: priorState.callSourceTabId } : {}), "info", "runtime");
      if (activeCall) {
        priorState.hotLoadLease = Object.assign({}, priorState.hotLoadLease || {}, { schema: HOTLOAD_SCHEMA, phase: "active-call", callId: priorState.callId, runtimeVersion: chrome.runtime.getManifest().version, lastHeartbeatAt: iso() });
        priorState.hotLoadUpdate = Object.assign({}, priorState.hotLoadUpdate || {}, { schema: HOTLOAD_SCHEMA, phase: "post-install-active-call", currentVersion: chrome.runtime.getManifest().version });
        return chrome.storage.local.set({ effectifState: cloneStateForStorage(priorState) }).then(function () {
          record("HOTLOAD_INSTALL_BOUNDARY_ACTIVE_CALL", { callId: priorState.callId, currentVersion: chrome.runtime.getManifest().version, action: "no-offscreen-close-no-transcription-reset" }, "warn", "runtime");
          return initialize().then(function () { return recoverAfterRuntimeBoundary("onInstalled-active-call"); }).then(function () { return hotloadExistingCloudTabs("onInstalled-active-call"); }).then(function () { return hotloadExistingWebTabs("onInstalled-active-call"); });
        });
      }
      chrome.offscreen.closeDocument().catch(function(){});
      return initialize().then(function () { return hotloadExistingCloudTabs("onInstalled"); }).then(function () { return hotloadExistingWebTabs("onInstalled"); });
    }).then(function () {
      return refreshAllActionIndicators().catch(function(error){
        record("ACTION_INDICATOR_INSTALL_REFRESH_ERROR",{error:String(error)},"warn","action");
      }).then(function () {
      try { SignalObservationSync.start(); } catch (_) {}
      SignalObservationSync.flush("startup").catch(function(error){ record("OBSERVATION_SYNC_STARTUP_ERROR",{error:String(error)},"warn","background"); });
    });
    }).catch(function(error){console.error("[SIGNAL-INTERPRETER] INIT_ERROR",error);});
    checkMicrophoneCommandShortcut("onInstalled");
    markObservabilityBuildCheckpoint(details&&details.reason||"installed",details&&details.previousVersion).catch(function(){});
    chrome.alarms.create("effectif-exchange-rate",{delayInMinutes:0.1,periodInMinutes:60});
    chrome.alarms.create("effectif-official-sync",{delayInMinutes:5,periodInMinutes:60});
    chrome.alarms.create("effectif-telemetry-maintenance",{delayInMinutes:1,periodInMinutes:60});
    chrome.alarms.create("effectif-platform-reconcile",{delayInMinutes:0.1,periodInMinutes:0.5});
  try { SignalPlatformScreenshot.start(); } catch (error) { record("PLATFORM_SCREENSHOT_START_ERROR",{error:String(error)},"warn","platform-screenshot"); }
    chrome.alarms.create("signal-observation-sync",{delayInMinutes:1,periodInMinutes:1});
    chrome.alarms.create("signal-network-window",{delayInMinutes:0.25,periodInMinutes:0.25});
    refreshExchangeRate("installed").catch(function(){});
    if(details&&details.reason==="update"&&/^0\.4\./.test(String(details.previousVersion||"")))record("V050_TRANSCRIPTION_MIGRATION_ENABLED",{previousVersion:details.previousVersion,platformAudioAccess:true}, "info","background");
  });
  chrome.runtime.onStartup.addListener(function(){
    try { SignalPlatformScreenshot.start(); } catch (error) { record("PLATFORM_SCREENSHOT_START_ERROR",{error:String(error)},"warn","platform-screenshot"); }
    refreshAllActionIndicators().catch(function () {});
    record("EXTENSION_RUNTIME_STARTED",{manifestVersion:chrome.runtime.getManifest().version},"info","runtime");
    checkMicrophoneCommandShortcut("onStartup");
    hotloadExistingCloudTabs("onStartup").catch(function(error){ record("HOTLOAD_EXISTING_TABS_STARTUP_ERROR",{error:String(error)},"warn","runtime"); });
    markObservabilityBuildCheckpoint("startup").catch(function(){});
    reconcilePlatformTelemetry("runtime-startup").catch(function(error){
      record("PLATFORM_TELEMETRY_RECONCILE_ERROR",{trigger:"runtime-startup",error:String(error)},"warn","background");
    });
  });
  chrome.runtime.onSuspend.addListener(function(){log("info","EXTENSION_RUNTIME_SUSPENDING",{pendingNetworkRequests:networkRequests?networkRequests.size:0});});
  initialize().then(function(){
    return refreshAllActionIndicators().catch(function(error){
      record("ACTION_INDICATOR_STARTUP_REFRESH_ERROR",{error:String(error)},"warn","action");
    }).then(function(){
      try{SignalObservationSync.start()}catch(_){};
      SignalObservationSync.flush("startup").catch(function(error){ record("OBSERVATION_SYNC_STARTUP_ERROR",{error:String(error)},"warn","background"); });
      return recoverAfterRuntimeBoundary("runtime-start").catch(function(error){record("HOTLOAD_RUNTIME_RECOVERY_ERROR",{error:String(error)}, "warn","runtime");}).then(function(){ return hotloadExistingCloudTabs("runtime-start"); }).then(function(){ return hotloadExistingWebTabs("runtime-start"); }).catch(function(error){record("HOTLOAD_EXISTING_TABS_RUNTIME_ERROR",{error:String(error)},"warn","runtime");});
    });
  }).catch(function(error){console.error("[SIGNAL-INTERPRETER] INIT_ERROR",error);});
  checkMicrophoneCommandShortcut("runtime-start");
  markObservabilityBuildCheckpoint("runtime-start").catch(function(){});
  chrome.alarms.create("effectif-exchange-rate",{delayInMinutes:0.1,periodInMinutes:60});
  chrome.alarms.create("effectif-official-sync",{delayInMinutes:5,periodInMinutes:60});
  chrome.alarms.create("effectif-telemetry-maintenance",{delayInMinutes:1,periodInMinutes:60});
  chrome.alarms.create("effectif-platform-reconcile",{delayInMinutes:0.1,periodInMinutes:0.5});
  chrome.alarms.create("signal-network-window",{delayInMinutes:0.25,periodInMinutes:0.25});
  refreshExchangeRate("startup").catch(function(){});
  chrome.alarms.onAlarm.addListener(function(alarm){
    if(!alarm)return;
    if(alarm.name==="signal-network-window"){flushNetworkActivity();hotloadHeartbeat("alarm").catch(function(error){record("HOTLOAD_HEARTBEAT_ERROR",{error:String(error)}, "warn","runtime");});return;}
    if(alarm.name==="signal-observation-sync"||alarm.name==="signal-observation-sync-retry"){
      SignalObservationSync.flush("alarm").then(function(result){
        if(result && result.ok===false) record("OBSERVATION_SYNC_RETRY_SCHEDULED",{retryMs:result.retryMs||null,error:result.error||null,sequence:result.sequence||null},"warn","background");
      }).catch(function(error){record("OBSERVATION_SYNC_ALARM_ERROR",{error:String(error)},"warn","background");});
      return;
    }
    if(alarm.name==="effectif-exchange-rate"){refreshExchangeRate("alarm").catch(function(){});return;}
    if(alarm.name==="effectif-official-sync"){
      record("PLATFORM_OFFICIAL_HOURLY_SYNC_STARTED",{trigger:"hourly"}, "info","background");
      syncOfficialPlatformData().then(function(result){
        var summary=result&&result.snapshot&&result.snapshot.summary||{};
        record("PLATFORM_OFFICIAL_HOURLY_SYNC_COMPLETED",{
          trigger:"hourly",method:result&&result.method||null,earned:summary.earned||null,callCount:summary.callCount||null,callLength:summary.callLength||null
        },"info","background");
      }).catch(function(error){
        record("PLATFORM_OFFICIAL_HOURLY_SYNC_ERROR",{trigger:"hourly",error:String(error)},"warn","background");
      });
      return;
    }
    if(alarm.name==="effectif-platform-reconcile"){
      reconcilePlatformTelemetry("alarm").catch(function(error){
        record("PLATFORM_TELEMETRY_RECONCILE_ERROR",{trigger:"alarm",error:String(error)},"warn","background");
      });
      return;
    }
    if(alarm.name==="effectif-telemetry-maintenance"){
      chrome.storage.local.get(["effectifConfig"],async function(stored){
        var config=Object.assign({},DEFAULT_CONFIG,stored.effectifConfig||{});
        try{var pruned=await KhoraTelemetryDB.prune({retentionDays:config.telemetryRetentionDays,maxEvents:config.telemetryMaxEvents}),stats=await KhoraTelemetryDB.stats(),health=Object.assign({},(await chrome.storage.local.get(["effectifTelemetryHealth"])).effectifTelemetryHealth||{},{lastMaintenanceAt:iso(),stats:stats});await chrome.storage.local.set({effectifTelemetryHealth:health});record("TELEMETRY_MAINTENANCE",{pruned:pruned,stats:stats},"info","background");}catch(error){record("TELEMETRY_MAINTENANCE_ERROR",{message:String(error)},"error","background");}
      });
      return;
    }
    if(alarm.name!=="effectif-pending-call")return;
    mutateState(async function(state){
      if(!state.pendingCall||state.callId)return;      var clickedAt=state.pendingCall.clickedAt||(state.lastConnectAt&&Math.abs(Date.parse(state.lastConnectAt)-Date.parse(state.pendingCall.detectedAt))<=2000?state.lastConnectAt:null);
      if (state.pendingCall.clickedAt) {
        var failedConnect=state.pendingCall;
        state.pendingCall=null;
        record("CONNECT_FLOW_FAILED_NO_CALL_ROUTE", {
          pendingId:failedConnect.id||null, detectedAt:failedConnect.detectedAt||null,
          clickedAt:failedConnect.clickedAt||null, classifiedAt:iso(),
          reason:"connect_clicked_no_call_route"
        }, "warn", "alarm");
        return;
      }
      if (!state.pendingCall.closedAt && Date.now() - Date.parse(state.pendingCall.detectedAt || iso()) < 60000) {
        chrome.alarms.create("effectif-pending-call", { when: Date.now() + 5000 });
        return;
      }
      var missed={id:state.pendingCall.id||uid(),detectedAt:state.pendingCall.detectedAt,clickedAt:null,classifiedAt:iso(),modality:state.pendingCall.modality||"OPI",status:"missed",reason:state.pendingCall.closedAt?"dialog_closed_without_connect":"dialog_timeout"};
      state.missedCalls=Number(state.missedCalls||0)+1;state.totalCalls=Number(state.totalCalls||0)+1;state.dailyMissedCalls=Object.assign({},state.dailyMissedCalls||{});var day=localDay(missed.detectedAt||iso());state.dailyMissedCalls[day]=Number(state.dailyMissedCalls[day]||0)+1;state.missedCallRecords=(state.missedCallRecords||[]).concat(missed).slice(-1000);state.pendingCall=null;record("MISSED_CALL_CLASSIFIED",missed,"warn","alarm");
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
    var initiator = "";
    try { initiator = new URL(details.initiator || "").origin; } catch (_) {}
    networkRequests.set(details.requestId, {
      at: Date.now(),
      method: details.method,
      type: details.type,
      url: sanitizedRequestUrl(details.url),
      tabId: details.tabId,
      frameId: Number(details.frameId),
      parentFrameId: Number(details.parentFrameId),
      initiator: initiator,
      requestBodyObserved: false,
      privacy: "request-body-and-headers-not-captured"
    });
    if (networkRequests.size > 5000) networkRequests.delete(networkRequests.keys().next().value);
  }, { urls: ["https://app.cloudinterpreter.com/*"] });
  var autoAnswerBootstrapAt = new Map();
  function bootstrapAutoAnswerForTab(tabId, trigger) {
    if (!cachedConfig.autoAnswerEnabled || !Number.isInteger(tabId) || tabId < 0) return;
    var now = Date.now();
    var previous = Number(autoAnswerBootstrapAt.get(tabId) || 0);
    if (now - previous < 3000) return;
    autoAnswerBootstrapAt.set(tabId, now);
    record("AUTO_ANSWER_BOOTSTRAP_REQUESTED", { tabId: tabId, trigger: trigger || "unknown" }, "info", "background");
    chrome.scripting.executeScript({ target: { tabId: tabId }, files: ["content.js"], world: "ISOLATED" }).then(function () {
      record("AUTO_ANSWER_BOOTSTRAP_INJECTED", { tabId: tabId, trigger: trigger || "unknown" }, "info", "background");
    }).catch(function (error) {
      record("AUTO_ANSWER_BOOTSTRAP_INJECTION_ERROR", { tabId: tabId, trigger: trigger || "unknown", error: String(error) }, "warn", "background");
    });
  }
  chrome.webRequest.onBeforeRequest.addListener(function (details) {
    try {
      var ringPath = new URL(details.url).pathname;
      if (/\/ring\.mp3$/i.test(ringPath) && cachedConfig.autoAnswerEnabled) {
        bootstrapAutoAnswerForTab(Number(details.tabId), "ring.mp3-start");
      }
    } catch (_) {}
  }, { urls: ["https://app.cloudinterpreter.com/*"] });
  chrome.webRequest.onCompleted.addListener(function (details) {
    var started = networkRequests.get(details.requestId); networkRequests.delete(details.requestId);
    if (!started) return;
    var durationMs = Math.max(0, Date.now() - started.at);
    noteNetworkActivity({
      method:started.method,type:started.type,url:started.url,statusCode:details.statusCode,durationMs:durationMs,
      frameId:started.frameId,parentFrameId:started.parentFrameId,initiator:started.initiator
    });
    try {
      var requestPath = new URL(details.url).pathname;
      if (/\/ring\.mp3$/i.test(requestPath) && (details.statusCode === 200 || details.statusCode === 206)) {
        record("INCOMING_RING_SIGNAL", { tabId: started.tabId, statusCode: details.statusCode, durationMs: durationMs, signal: "ring.mp3" }, "info", "webRequest");
        bootstrapAutoAnswerForTab(Number(started.tabId), "ring.mp3-completed");
      }
    } catch (error) {
      record("INCOMING_RING_SIGNAL_ERROR", { error: String(error) }, "warn", "background");
    }
    if(details.statusCode>=400)record("NETWORK_REQUEST_ERROR",{method:started.method,type:started.type,url:started.url,tabId:started.tabId,statusCode:details.statusCode,durationMs:Math.max(0,Date.now()-started.at)},"warn","webRequest");
  }, { urls: ["https://app.cloudinterpreter.com/*"] });
  chrome.webRequest.onErrorOccurred.addListener(function (details) {
    var started = networkRequests.get(details.requestId); networkRequests.delete(details.requestId);
    if (!started) return;
    record("NETWORK_REQUEST_ERROR",{
      method:started.method,type:started.type,url:started.url,tabId:started.tabId,
      frameId:started.frameId,parentFrameId:started.parentFrameId,initiator:started.initiator,
      error:details.error,durationMs:Math.max(0,Date.now()-started.at),
      privacy:"request-body-and-headers-not-captured"
    },"warn","webRequest");
  }, { urls: ["https://app.cloudinterpreter.com/*"] });
  chrome.windows.onRemoved.addListener(function () {});
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "local" && changes.effectifConfig) {
      cachedConfig = Object.assign({}, DEFAULT_CONFIG, changes.effectifConfig.newValue || {});
    }
  });

  function checkMicrophoneCommandShortcut(trigger) {
    if (!chrome.commands || typeof chrome.commands.getAll !== "function") return;
    chrome.commands.getAll(function (commands) {
      var item = (commands || []).find(function (command) { return command.name === "toggle-extension-microphone"; });
      var shortcut = item && item.shortcut ? item.shortcut : "";
      chrome.storage.local.set({
        signalMicrophoneShortcutStatus: {
          expected: "Ctrl+Shift+Period",
          assigned: shortcut,
          available: !!shortcut,
          checkedAt: iso(),
          trigger: trigger || "runtime"
        }
      }).catch(function () {});
      record(shortcut ? "EXTENSION_MICROPHONE_SHORTCUT_AVAILABLE" : "EXTENSION_MICROPHONE_SHORTCUT_UNASSIGNED", {
        expected: "Ctrl+Shift+Period", assigned: shortcut || null, trigger: trigger || "runtime"
      }, shortcut ? "info" : "warn", "microphone");
    });
  }

  var lastKeyboardMicrophoneToggleAt = 0;
  function requestKeyboardMicrophoneToggle(source) {
    var now=Date.now();
    if(now-lastKeyboardMicrophoneToggleAt<450){
      record("EXTENSION_MICROPHONE_KEYBOARD_DUPLICATE_SUPPRESSED",{
        source:source||"keyboard",windowMs:450,policy:"one-toggle-per-physical-hotkey"
      },"info","microphone");
      return Promise.resolve({ok:true,verified:true,duplicateSuppressed:true,muted:null});
    }
    lastKeyboardMicrophoneToggleAt=now;
    return toggleExtensionMicrophoneMuted(source||"keyboard").then(function(result){
      record("EXTENSION_MICROPHONE_KEYBOARD_TOGGLE",{
        source:source||"keyboard",hotkey:"Ctrl+Shift+.",
        desired:result&&typeof result.muted==="boolean"?!!result.muted:null,
        verified:!!(result&&result.verified),ok:!!(result&&result.ok),
        error:result&&result.error||null
      },result&&result.ok&&result.verified?"info":"error","microphone");
      broadcastSignalEvent({type:"signal.extension.microphone",muted:!!(result&&result.muted),verified:!!(result&&result.verified),timestamp:iso()});
      return result;
    }).catch(function(error){
      record("EXTENSION_MICROPHONE_KEYBOARD_ERROR",{source:source||"keyboard",hotkey:"Ctrl+Shift+.",error:String(error)},"error","microphone");
      return{ok:false,verified:false,error:String(error),muted:false};
    });
  }

  chrome.commands.onCommand.addListener(function (command) {
    if (command === "toggle-extension-microphone") {
      requestKeyboardMicrophoneToggle("keyboard-command");
      return;
    }
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
      reconcilePlatformTelemetry(changeInfo.status === "complete" ? "tab-complete" : "tab-url-change")
        .catch(function (error) {
          record("PLATFORM_TELEMETRY_RECONCILE_ERROR", {
            trigger: "tab-update", tabId: tabId, error: String(error)
          }, "warn", "background");
        });
    }
  });
  chrome.tabs.onActivated.addListener(function(activeInfo){
    reconcilePlatformTelemetry("tab-activated").catch(function(error){
      record("PLATFORM_TELEMETRY_RECONCILE_ERROR",{trigger:"tab-activated",tabId:activeInfo&&activeInfo.tabId||null,error:String(error)},"warn","background");
    });
  });
  chrome.tabs.onRemoved.addListener(function(tabId){
    reconcilePlatformTelemetry("tab-removed").catch(function(error){
      record("PLATFORM_TELEMETRY_RECONCILE_ERROR",{trigger:"tab-removed",tabId:tabId,error:String(error)},"warn","background");
    });
    loadSignalSessions().then(function(data){var active=data.sessions.find(function(s){return s.id===data.activeSessionId});if(active&&Number(active.sourceTabId)===Number(tabId))stopGroqCapture("source-tab-closed").catch(function(){})}).catch(function(){});
  });
})();