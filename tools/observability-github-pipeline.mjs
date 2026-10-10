import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {sha256,fileToken,semanticPlatformDelta} from "./observability/platform-learning.mjs";

const HERE=path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT=path.resolve(HERE,"..");
export const PACKAGE_SCHEMA="signal-interpreter-observability-package/v1";
export const BATCH_SCHEMA="signal-interpreter-observation-batch/v1";
export const SURFACE_EVENT_SCHEMA="signal-interpreter-platform-surface-event/v1";

function now(){return new Date().toISOString();}
function readJson(file,fallback=null){
  try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch(_){return fallback;}
}
function writeJson(file,value){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(value,null,2)+"\n","utf8");
}
function listJson(dir){
  if(!fs.existsSync(dir))return[];
  return fs.readdirSync(dir).filter(x=>x.endsWith(".json")).sort().map(x=>path.join(dir,x));
}
function derivePublishHistory(obs){
  const history={lastAutomaticPublishAt:null,lastAutomaticBatchId:null,lastManualPublishAt:null,lastManualBatchId:null};
  for(const file of listJson(path.join(obs,"batches"))){
    const batch=readJson(file,null);
    if(!batch||batch.schema!==BATCH_SCHEMA||!batch.batchId||!batch.createdAt)continue;
    if(batch.trigger==="observability-self-test"||batch.extensionVersion==="self-test")continue;
    const time=Date.parse(batch.createdAt);
    if(!Number.isFinite(time))continue;
    if(batch.trigger==="manual"){
      if(!history.lastManualPublishAt||time>Date.parse(history.lastManualPublishAt)){history.lastManualPublishAt=batch.createdAt;history.lastManualBatchId=batch.batchId;}
    }else if(!history.lastAutomaticPublishAt||time>Date.parse(history.lastAutomaticPublishAt)){
      history.lastAutomaticPublishAt=batch.createdAt;history.lastAutomaticBatchId=batch.batchId;
    }
  }
  return history;
}
function updatePublishHistory(history,batch){
  if(!batch||!batch.createdAt||batch.trigger==="observability-self-test"||batch.extensionVersion==="self-test")return;
  const time=Date.parse(batch.createdAt);if(!Number.isFinite(time))return;
  if(batch.trigger==="manual"){
    if(!history.lastManualPublishAt||time>Date.parse(history.lastManualPublishAt)){history.lastManualPublishAt=batch.createdAt;history.lastManualBatchId=batch.batchId;}
  }else if(!history.lastAutomaticPublishAt||time>Date.parse(history.lastAutomaticPublishAt)){
    history.lastAutomaticPublishAt=batch.createdAt;history.lastAutomaticBatchId=batch.batchId;
  }
}
function normalizeRoute(value){
  return String(value||"/")
    .replace(/^\/call\/[^/?#]+/,"/call/<ID>")
    .replace(/^\/profile\/[^/?#]+/,"/profile/<ID>")||"/";
}
function normalizeOrigin(value){
  try{return new URL(String(value||"")).origin;}catch(_){return"";}
}
function normalizeSearchKeys(value){
  return Array.from(new Set(Array.isArray(value)?value.map(x=>String(x)).filter(Boolean):[])).sort().slice(0,40);
}
export function normalizePlatformSnapshot(event,batch){
  const payload=event&&event.payload||{};
  const surface=payload.platformSurface;
  if(!surface||surface.schema!=="signal-interpreter-platform-surface/v1")return null;
  const page=surface.page&&typeof surface.page==="object"?surface.page:{};
  const origin=normalizeOrigin(page.origin||event.url);
  if(origin!=="https://app.cloudinterpreter.com")return null;
  const route=normalizeRoute(page.route||page.path);
  const searchKeys=normalizeSearchKeys(page.searchKeys);
  const identityKey=origin+"|"+route+"|"+searchKeys.join(",");
  const snapshotHash=sha256(surface);
  const eventId=String(event.id||"");
  const snapshotId="snap-"+(eventId||snapshotHash.slice(0,24));
  return {
    schema:"signal-interpreter-platform-observation/v1",
    snapshotId,
    batchId:String(batch.batchId||""),
    eventId:eventId||null,
    sequence:Number(event.sequence)||0,
    tabId:event.tabId==null?null:Number(event.tabId),
    capturedAt:event.timestamp||batch.createdAt||now(),
    identityKey,
    snapshotHash,
    route,
    url:origin+route+(searchKeys.length?"?"+searchKeys.map(k=>encodeURIComponent(k)+"=<VALUE>").join("&"):""),
    surface
  };
}
function baseIndex(){
  return{
    schema:"signal-interpreter-platform-index/v1",
    generatedAt:null,
    observations:0,
    deltas:0,
    identityCount:0,
    routeCount:0,
    routes:[],
    latestByIdentity:{}
  };
}
function loadPackageIndex(obs){
  return readJson(path.join(obs,"platform-index.json"),baseIndex());
}
function snapshotPathFor(obs,snapshot){
  const day=String(snapshot.capturedAt).slice(0,10)||now().slice(0,10);
  return path.join(obs,"platform-snapshots",day,fileToken(snapshot.route)+"--"+snapshot.snapshotHash+".json");
}
function deltaPathFor(obs,snapshot){
  const day=String(snapshot.capturedAt).slice(0,10)||now().slice(0,10);
  return path.join(obs,"platform-deltas",day,fileToken(snapshot.route)+"--"+snapshot.snapshotHash+".json");
}
function readPreviousSnapshot(obs,entry){
  if(!entry||!entry.snapshotPath)return null;
  return readJson(path.join(obs,entry.snapshotPath),null);
}
function applyBatchToIndex(obs,index,batch){
  let changedObservations=0;
  let changedDeltas=0;
  for(const event of Array.isArray(batch.events)?batch.events:[]){
    if(String(event.action||"")!=="PLATFORM_SURFACE_SNAPSHOT")continue;
    const snapshot=normalizePlatformSnapshot(event,batch);
    if(!snapshot)continue;
    const previousEntry=index.latestByIdentity&&index.latestByIdentity[snapshot.identityKey]||null;
    if(previousEntry&&previousEntry.snapshotHash===snapshot.snapshotHash)continue;
    const previous=readPreviousSnapshot(obs,previousEntry);
    const snapshotPath=snapshotPathFor(obs,snapshot);
    const deltaPath=deltaPathFor(obs,snapshot);
    const delta=semanticPlatformDelta(previous,snapshot);
    writeJson(snapshotPath,snapshot);
    writeJson(deltaPath,delta);
    changedObservations+=1;
    if(delta.type!=="unchanged")changedDeltas+=1;
    index.latestByIdentity[snapshot.identityKey]={
      snapshotId:snapshot.snapshotId,
      capturedAt:snapshot.capturedAt,
      route:snapshot.route,
      url:snapshot.url,
      snapshotHash:snapshot.snapshotHash,
      snapshotPath:path.relative(obs,snapshotPath).replaceAll("\\","/"),
      lastDeltaPath:path.relative(obs,deltaPath).replaceAll("\\","/"),
      observations:Number(previousEntry&&previousEntry.observations||0)+1
    };
  }
  return{changedObservations,changedDeltas};
}
function deriveScreenshotIndex(obs){
  const index={schema:"signal-interpreter-platform-screenshot-index/v1",generatedAt:null,totalEvents:0,changed:0,unchanged:0,errors:0,latestByRoute:{}};
  const files=listJson(path.join(obs,"batches"));
  for(const file of files){
    const batch=readJson(file,null);
    if(!batch||!Array.isArray(batch.events))continue;
    for(const event of batch.events){
      const action=String(event&&event.action||"");
      if(!/^PLATFORM_SCREENSHOT_(CHANGED|UNCHANGED|UPLOAD_ERROR|CAPTURE_ERROR|TOO_LARGE|DISCARDED)/.test(action))continue;
      index.totalEvents+=1;
      if(action==="PLATFORM_SCREENSHOT_CHANGED")index.changed+=1;
      else if(action==="PLATFORM_SCREENSHOT_UNCHANGED")index.unchanged+=1;
      else index.errors+=1;
      const payload=event&&event.payload||{};
      const route=String(payload.route||"/");
      if(action==="PLATFORM_SCREENSHOT_CHANGED"){
        index.latestByRoute[route]={
          hash:String(payload.hash||""),
          capturedAt:String(payload.capturedAt||event.timestamp||batch.createdAt||""),
          eventAt:String(event.timestamp||batch.createdAt||""),
          remotePath:payload.remotePath||null,
          tabId:payload.tabId==null?null:Number(payload.tabId),
          windowId:payload.windowId==null?null:Number(payload.windowId),
          bytes:Number(payload.bytes||0),
          quality:Number(payload.quality||0),
          reason:String(payload.reason||"capture")
        };
      }
    }
  }
  index.generatedAt=now();
  index.routeCount=Object.keys(index.latestByRoute).length;
  return index;
}
function buildLatestSummary(latestBatch,index){
  const summary=latestBatch&&latestBatch.summary||{};
  const lines=[
    "# Signal Interpreter · latest observation",
    "",
    "- Batch: "+String(latestBatch&&latestBatch.batchId||"none"),
    "- Creado: "+String(latestBatch&&latestBatch.createdAt||"unknown"),
    "- Trigger: "+String(latestBatch&&latestBatch.trigger||"unknown"),
    "- Extensión: "+String(latestBatch&&latestBatch.extensionVersion||"unknown"),
    "- Eventos: "+Number(summary.eventsTotal||0),
    "- Errores: "+Number(summary.errors||0),
    "- Warnings: "+Number(summary.warnings||0),
    "- Secuencia: "+Number(summary.firstSequence||0)+" → "+Number(summary.lastSequence||0),
    "- Identidades de plataforma: "+Number(index.identityCount||0),
    "- Snapshots de plataforma: "+Number(index.observations||0),
    "- Deltas de plataforma: "+Number(index.deltas||0),
    "",
    "## Categorías",
    "",
    JSON.stringify(summary.categories||{},null,2),
    "",
    "## Acciones",
    "",
    JSON.stringify(summary.actions||{},null,2),
    ""
  ];
  return lines.join("\n");
}
function isRealBatch(batch){
  return !!batch&&batch.trigger!=="observability-self-test"&&batch.extensionVersion!=="self-test";
}
function eventCallId(event){
  const p=event&&event.payload&&typeof event.payload==="object"?event.payload:{};
  const finalCall=p.finalCall&&typeof p.finalCall==="object"?p.finalCall:{};
  return String(p.callId||finalCall.callId||event&&event.session&&event.session.callId||event&&event.context&&event.context.callId||"").trim();
}
function isTerminalCallEvent(event){
  const action=String(event&&event.action||"");
  const p=event&&event.payload&&typeof event.payload==="object"?event.payload:{};
  return action==="CALL_RATING_STARS_CONFIRMED"||action==="CALL_TIMER_STOPPED"||
    (action==="CALL_OBSERVABILITY_CHECKPOINT"&&p.checkpoint==="call-ended");
}
function reportDate(value,fallback){
  const time=Date.parse(value||"");
  return Number.isFinite(time)?new Date(time).toISOString():fallback;
}
function reportNumber(value){
  const number=Number(value);
  return value!==null&&value!==undefined&&value!==""&&Number.isFinite(number)?number:null;
}
function reportSafeText(value,max=160){
  return String(value==null?"":value)
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi,"Bearer [REDACTED]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[EMAIL]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g,"[PHONE]")
    .replace(/[\r\n\t]+/g," ").slice(0,max);
}
function reportResourceName(value){
  try{
    const url=new URL(String(value||""),"https://app.cloudinterpreter.com");
    return url.origin+url.pathname.replace(/\/call\/[^/]+/g,"/call/<ID>").replace(/\/profile\/[^/]+/g,"/profile/<ID>");
  }catch(_){return "[RESOURCE]";}
}
function reportFeature(action){
  const a=String(action||"").toUpperCase();
  const groups=[
    ["overlayActivation",/OVERLAY|LIVE_CAPTION_OVERLAY|EARNINGS_OVERLAY/],
    ["answerFlow",/ANSWER|CONNECT|INCOMING|AUTO_ANSWER/],
    ["ratingAndClose",/RATING|CALL_ROUTE_ENDED|CALL_TIMER_STOPPED|CALL_OBSERVABILITY_CHECKPOINT/],
    ["microphoneAndSafety",/MICROPHONE|MIC_GUARD|MUTE|AUDIO_SAFETY/],
    ["mediaAndCapture",/MEDIA_HEALTH|MEDIA_|CAPTURE|GROQ_AUDIO|AUDIO_/],
    ["transcriptionAndCaptions",/TRANSCRIPTION|TRANSCRIPT|CAPTION|GROQ/],
    ["performanceAndNetwork",/PERFORMANCE|NETWORK|RESOURCE|LONG_TASK|LAYOUT_SHIFT/],
    ["platformAndUi",/PLATFORM_|PORTAL_|SCREEN_MAP|SCREENSHOT|MIRROR|UI_/],
    ["billingAndEarnings",/EARNINGS|BILLING|EXCHANGE|REVENUE/],
    ["runtimeAndRecovery",/HOTLOAD|RUNTIME|WORKER|RECOVERY|RECONNECT/],
    ["observabilityPipeline",/OBSERVATION|OBSERVABILITY|TELEMETRY|SYNC_|BATCH|RELAY/]
  ];
  for(const pair of groups)if(pair[1].test(a))return pair[0];
  return "other";
}
function callReportPayload(event){
  return event&&event.payload&&typeof event.payload==="object"?event.payload:{};
}
function callEventDigest(event){
  const p=callReportPayload(event);
  return {
    at:reportDate(event.timestamp,null),sequence:reportNumber(event.sequence),
    action:reportSafeText(event.action||"UNKNOWN",100),level:reportSafeText(event.level||"info",16),
    category:reportSafeText(event.category||"RUNTIME",40),component:reportSafeText(event.component||event.source||"unknown",40),
    phase:reportSafeText(event.phase||"event",24),outcome:reportSafeText(event.outcome||"observed",24),
    durationMs:reportNumber(event.durationMs),
    reasonCode:reportSafeText(event.reasonCode||p.reasonCode||"",80)||null
  };
}
function callKeySignal(event){
  const action=String(event&&event.action||"");
  if(!/ANSWER_FLOW|AUTO_ANSWER|CONNECT_|CALL_ROUTE_ENTERED|CALL_TIMER_STOPPED|EXTENSION_MICROPHONE|MICROPHONE|GROQ_CAPTURE|GROQ_TRANSCRIBER|TRANSCRIPTION|CAPTION_PREVIEW|SIGNAL_CAPTION|LIVE_CAPTION_OVERLAY|EARNINGS_OVERLAY|PLATFORM_INTEGRITY|CALL_END_EARNINGS|CALL_EARNINGS|EXCHANGE_RATE|HOTLOAD|SCREENSHOT/.test(action))return null;
  const payload=callReportPayload(event);
  const signal=callEventDigest(event);
  const allow=["status","phase","reasonCode","source","trigger","modality","engine","period","ready","authorizedProfile","verified","muted","desired","previousMuted","recoveryMuted","captureVerified","outputVerified","outputMuted","trackCount","senderCount","attempts","attempt","retryCount","latencyMs","durationMs","timeoutMs","routeConfirmation","confirmation","captureStatus","tabAudio","microphone","microphoneMuted","microphoneOutputMuted","effectiveType","rttMs","downlinkMbps","visible","hostConnected","shadowRootReady","pageAllowed","contextReady","callActive","sourceTabMatched","sourceTabKnown","routeFallbackApplied","activeCallRoute","routeEvidenceApplied","historyRows","rowCount","contextSyncAttempts","contextSyncFailures","active","sessionEnded","lastCaptionAgeMs","documentReadyState","visibilityState","documentElementPresent","controlsReady","timerActive","hostWidth","hostHeight","mountReason","independentOfObserver","observerActive"];
  allow.forEach(key=>{
    const value=payload[key];
    if(value===null||value===undefined)return;
    if(typeof value==="boolean"||typeof value==="number")signal[key]=value;
    else if(typeof value==="string")signal[key]=reportSafeText(value,80);
  });
  if(payload.metrics&&typeof payload.metrics==="object"){
    const metrics={};
    Object.keys(payload.metrics).slice(0,20).forEach(key=>{
      const value=payload.metrics[key];
      if(typeof value==="number"&&Number.isFinite(value))metrics[reportSafeText(key,60)]=value;
      else if(typeof value==="boolean")metrics[reportSafeText(key,60)]=value;
    });
    if(Object.keys(metrics).length)signal.metrics=metrics;
  }
  return signal;
}
function makeCallReport(callId,events,generatedAt){
  const related=events.filter(event=>eventCallId(event)===callId)
    .sort((a,b)=>(Date.parse(a.timestamp||"")||0)-(Date.parse(b.timestamp||"")||0));
  const starEvent=related.find(event=>event.action==="CALL_RATING_STARS_CONFIRMED")||null;
  const checkpointEvents=related.filter(event=>event.action==="CALL_OBSERVABILITY_CHECKPOINT"&&callReportPayload(event).checkpoint==="call-ended");
  const checkpoint=checkpointEvents.length?checkpointEvents[checkpointEvents.length-1]:null;
  const stopped=related.filter(event=>event.action==="CALL_TIMER_STOPPED");
  const timerStop=stopped.length?stopped[stopped.length-1]:null;
  const starts=related.filter(event=>/CALL_TIMER_STARTED|CALL_ROUTE_ENTERED|ANSWER_FLOW_ROUTE_CONFIRMED/.test(String(event.action||"")));
  const timerStart=starts.length?starts[0]:null;
  const checkpointPayload=callReportPayload(checkpoint);
  const stopPayload=callReportPayload(timerStop);
  const finalCall=checkpointPayload.finalCall&&typeof checkpointPayload.finalCall==="object"?checkpointPayload.finalCall:stopPayload;
  const starPayload=callReportPayload(starEvent);
  const starEvidence=starPayload.evidence&&typeof starPayload.evidence==="object"?starPayload.evidence:{};
  const callRef=sha256("signal-interpreter-call:"+callId).slice(0,24);
  const startAt=reportDate(finalCall.startedAt||timerStart&&timerStart.timestamp,null);
  const endAt=reportDate(finalCall.endedAt||timerStop&&timerStop.timestamp||checkpoint&&checkpoint.timestamp,null);
  const actions={},categories={},components={},levels={},featureSignals={};
  let warnings=0,errors=0,failed=0,sequenceMin=null,sequenceMax=null;
  const performanceEvents=[],mediaEvents=[],networkCount={total:0},errorTimeline=[];
  related.forEach(event=>{
    const action=String(event.action||"UNKNOWN").slice(0,100);
    const category=String(event.category||"RUNTIME").slice(0,60);
    const component=String(event.component||event.source||"unknown").slice(0,60);
    const level=String(event.level||"info").slice(0,20);
    actions[action]=(actions[action]||0)+1;categories[category]=(categories[category]||0)+1;
    components[component]=(components[component]||0)+1;levels[level]=(levels[level]||0)+1;
    const feature=reportFeature(action);featureSignals[feature]=(featureSignals[feature]||0)+1;
    if(level==="warn")warnings++;if(level==="error")errors++;
    if(/ERROR|FAILED|TIMEOUT|BLOCKED|REJECTED/.test(action))failed++;
    const seq=reportNumber(event.sequence);
    if(seq!==null){sequenceMin=sequenceMin===null?seq:Math.min(sequenceMin,seq);sequenceMax=sequenceMax===null?seq:Math.max(sequenceMax,seq);}
    const p=callReportPayload(event);
    if(action==="PERFORMANCE_HEARTBEAT")performanceEvents.push({event:event,payload:p});
    if(action==="MEDIA_HEALTH")mediaEvents.push({event:event,payload:p});
    if(/NETWORK|RESOURCE|FETCH|XHR/.test(action))networkCount.total++;
    if(level==="warn"||level==="error"||/ERROR|FAILED|TIMEOUT|BLOCKED|REJECTED/.test(action)){
      errorTimeline.push({
        at:reportDate(event.timestamp,null),action:action,level:level,category:category,component:component,
        phase:reportSafeText(event.phase||"event",30),outcome:reportSafeText(event.outcome||"observed",30),
        reasonCode:reportSafeText(event.reasonCode||p.reasonCode||"",100),
        errorType:reportSafeText(p.errorType||p.name||"",80)
      });
    }
  });
  const timelineSource=related.length<=160?related:related.slice(0,20).concat(related.slice(-140));
  const eventTimeline=timelineSource.map(callEventDigest);
  const keySignals=related.map(callKeySignal).filter(Boolean).slice(-100);
  const lastPerf=performanceEvents.length?performanceEvents[performanceEvents.length-1].payload:{};
  const peak=performanceEvents.reduce((out,item)=>{
    const p=item.payload.performance||{};
    out.longestTaskMs=Math.max(out.longestTaskMs,reportNumber(p.longestTaskMs)||0);
    out.longTaskTotalMs=Math.max(out.longTaskTotalMs,reportNumber(p.longTaskTotalMs)||0);
    out.layoutShiftScore=Math.max(out.layoutShiftScore,reportNumber(p.layoutShiftScore)||0);
    out.longTasks=Math.max(out.longTasks,reportNumber(p.longTasks)||0);
    out.layoutShifts=Math.max(out.layoutShifts,reportNumber(p.layoutShifts)||0);
    return out;
  },{longTasks:0,longestTaskMs:0,longTaskTotalMs:0,layoutShifts:0,layoutShiftScore:0});
  const slowest=(Array.isArray(lastPerf.resources&&lastPerf.resources.slowest)?lastPerf.resources.slowest:[]).slice(0,8).map(item=>({
    name:reportResourceName(item.name||item.url),type:reportSafeText(item.type||"other",40),
    durationMs:reportNumber(item.durationMs),transferBytes:reportNumber(item.transferBytes)
  }));
  const lastMedia=mediaEvents.length?mediaEvents[mediaEvents.length-1].payload:{};
  const media=Array.isArray(lastMedia.media)?lastMedia.media:[];
  const stars=!!starEvent&&starPayload.ratingPromptVisible===true&&starEvidence.starsVisible===true;
  const complete=!!checkpoint&&!!finalCall.callId&&!!endAt;
  const missing=[];
  if(!timerStart&&!startAt)missing.push("call-start-not-observed");
  if(!timerStop&&!endAt)missing.push("call-end-timestamp-not-observed");
  if(!stars)missing.push("rating-stars-confirmation-not-observed");
  if(!checkpoint)missing.push("final-observability-checkpoint-not-observed");
  if(!performanceEvents.length)missing.push("performance-samples-not-observed");
  if(!mediaEvents.length)missing.push("media-health-not-observed");
  if(!related.some(event=>event.action==="PLATFORM_SURFACE_SNAPSHOT"))missing.push("platform-surface-snapshot-not-observed");
  return {
    schema:"signal-interpreter-call-report/v1",generatedAt:generatedAt,updatedAt:generatedAt,
    callRef:callRef,status:complete?"complete":"partial",
    completeness:{complete:complete,missingSignals:missing},
    time:{firstObservedAt:related.length?reportDate(related[0].timestamp,null):null,lastObservedAt:related.length?reportDate(related[related.length-1].timestamp,null):null},
    call:{
      callRef:callRef,status:reportSafeText(finalCall.status||(complete?"closed":"unknown"),40),
      modality:reportSafeText(finalCall.modality||"",20)||null,startedAt:startAt,endedAt:endAt,
      duration:{
        observedSeconds:reportNumber(finalCall.observedSeconds),platformSeconds:reportNumber(finalCall.platformSeconds),
        billableSecondsAssumed:reportNumber(finalCall.billableSecondsAssumed),
        platformMinusObservedSeconds:(reportNumber(finalCall.platformSeconds)!==null&&reportNumber(finalCall.observedSeconds)!==null)
          ?Math.round((Number(finalCall.platformSeconds)-Number(finalCall.observedSeconds))*1000)/1000:null
      },
      earnings:{
        ratePerMinute:reportNumber(finalCall.ratePerMinute),estimatedRevenue:reportNumber(finalCall.estimatedRevenue),
        countedInEarnings:finalCall.countedInEarnings===true,currency:reportSafeText(finalCall.currency||"",12)||null,
        billingRule:reportSafeText(finalCall.billingRule||"",80)||null
      },
      endSource:reportSafeText(finalCall.endSource||"",60)||null,
      runtimeVersion:reportSafeText(finalCall.runtimeVersion||starPayload.extensionVersion||"",40)||null
    },
    endConfirmation:{
      ratingRouteObserved:!!starEvent||related.some(event=>event.action==="RATING_ROUTE_ENTERED"),
      ratingStarsVisible:stars,ratingMethod:reportSafeText(starEvidence.method||"",80)||null,
      candidateCount:reportNumber(starEvidence.candidateCount),namedStarCandidateCount:reportNumber(starEvidence.namedStarCandidateCount),
      starLikeCandidateCount:reportNumber(starEvidence.starLikeCandidateCount),visibleButtonCount:reportNumber(starEvidence.visibleButtonCount),
      visibleRadioCount:reportNumber(starEvidence.visibleRadioCount),ratingValueObserved:starPayload.ratingValueObserved===true,
      ratingSubmissionObserved:starPayload.ratingSubmissionObserved===true,
      confirmedAt:reportDate(starPayload.confirmedAt||starEvent&&starEvent.timestamp,null),
      finalCheckpointObserved:!!checkpoint,checkpointAt:reportDate(checkpoint&&checkpoint.timestamp,null),
      confirmationFallbacks:related.filter(event=>event.action==="RATING_ROUTE_FAILED").length
    },
    correlation:{
      eventCount:related.length,firstSequence:sequenceMin,lastSequence:sequenceMax,
      batches:Array.from(new Set(related.map(event=>String(event.batchId||"")).filter(Boolean))).slice(0,40),
      actionCount:Object.keys(actions).length,categoryCount:Object.keys(categories).length,
      sourceTabs:Array.from(new Set(related.map(event=>reportNumber(event.tabId)).filter(value=>value!==null))).slice(0,20)
    },
    telemetry:{
      eventLevels:levels,actions:actions,categories:categories,components:components,featureSignals:featureSignals,
      eventTimeline:eventTimeline,keySignals:keySignals,
      eventTimelineTruncated:related.length>eventTimeline.length,sourceEventCount:related.length,
      warnings:warnings,errors:errors,failedOrBlockedEvents:failed,errorTimeline:errorTimeline.slice(-60),
      performance:{
        samples:performanceEvents.length,lastAt:performanceEvents.length?reportDate(performanceEvents[performanceEvents.length-1].event.timestamp,null):null,
        latest:{
          uptimeMs:reportNumber(lastPerf.uptimeMs),nodeCount:reportNumber(lastPerf.document&&lastPerf.document.nodes),
          online:lastPerf.document&&typeof lastPerf.document.online==="boolean"?lastPerf.document.online:null,
          visibility:reportSafeText(lastPerf.document&&lastPerf.document.visibility||"",30)||null,
          connection:{
            effectiveType:reportSafeText(lastPerf.connection&&lastPerf.connection.effectiveType||"",20)||null,
            rttMs:reportNumber(lastPerf.connection&&lastPerf.connection.rttMs),downlinkMbps:reportNumber(lastPerf.connection&&lastPerf.connection.downlinkMbps)
          },
          memory:{
            usedBytes:reportNumber(lastPerf.memory&&lastPerf.memory.usedBytes),totalBytes:reportNumber(lastPerf.memory&&lastPerf.memory.totalBytes),
            limitBytes:reportNumber(lastPerf.memory&&lastPerf.memory.limitBytes)
          },
          resources:{
            newResources:reportNumber(lastPerf.resources&&lastPerf.resources.newResources),
            totalDurationMs:reportNumber(lastPerf.resources&&lastPerf.resources.totalDurationMs),
            transferBytes:reportNumber(lastPerf.resources&&lastPerf.resources.transferBytes),slowest:slowest
          },
          mutations:lastPerf.mutations&&typeof lastPerf.mutations==="object"?{
            batches:reportNumber(lastPerf.mutations.batches),addedNodes:reportNumber(lastPerf.mutations.addedNodes),
            removedNodes:reportNumber(lastPerf.mutations.removedNodes),attributes:reportNumber(lastPerf.mutations.attributes),
            textChanges:reportNumber(lastPerf.mutations.textChanges)
          }:null
        },
        peak:peak
      },
      media:{
        samples:mediaEvents.length,mediaElementsFound:reportNumber(lastMedia.mediaElementsFound),
        tracksObserved:media.reduce((sum,item)=>sum+(Array.isArray(item.tracks)?item.tracks.length:0),0),
        mutedElements:media.filter(item=>item.muted===true).length,pausedElements:media.filter(item=>item.paused===true).length,
        endedElements:media.filter(item=>item.ended===true).length,
        elementsWithoutStream:media.filter(item=>item.hasSrcObject!==true).length,
        interpretation:reportSafeText(lastMedia.interpretation||"",120)
      },
      networkEvents:networkCount.total
    },
    privacy:{
      rawAudioIncluded:false,rawTranscriptIncluded:false,rawTranscriptTextIncluded:false,fullCallIdIncluded:false,
      ratingValueIncluded:false,ratingSubmissionClaimed:false,rawHtmlIncluded:false,rawCssIncluded:false,
      rawJavascriptIncluded:false,credentialsIncluded:false,resourceNamesNormalized:true
    }
  };
}
function callReportMarkdown(report){
  const call=report.call||{},duration=call.duration||{},earnings=call.earnings||{},end=report.endConfirmation||{},telemetry=report.telemetry||{};
  const lines=[
    "# Signal Interpreter — informe de cierre de llamada","",
    "- Estado de recolección: **"+report.status+"**","- Referencia opaca: "+report.callRef,
    "- Versión runtime: "+String(call.runtimeVersion||"unknown"),
    "- Modalidad/estado: "+String(call.modality||"unknown")+" / "+String(call.status||"unknown"),
    "- Inicio: "+String(call.startedAt||"no observado"),"- Fin: "+String(call.endedAt||"no observado"),
    "- Duración observada / plataforma / facturable asumida (s): "+[duration.observedSeconds,duration.platformSeconds,duration.billableSecondsAssumed].map(v=>v==null?"unknown":String(v)).join(" / "),
    "- Ingreso estimado: "+(earnings.estimatedRevenue==null?"unknown":String(earnings.estimatedRevenue)+" "+String(earnings.currency||"unknown")),
    "- Fin por: "+String(call.endSource||"unknown"),"","## Confirmación de calificación","",
    "- Ruta de calificación observada: "+String(end.ratingRouteObserved),
    "- Estrellas visibles confirmadas: "+String(end.ratingStarsVisible),
    "- Método de detección: "+String(end.ratingMethod||"unknown"),
    "- Valor seleccionado observado: "+String(end.ratingValueObserved),
    "- Envío de valoración observado: "+String(end.ratingSubmissionObserved),
    "- Checkpoint final entregado al paquete: "+String(end.finalCheckpointObserved),"",
    "## Cobertura y señales","",
    "- Eventos correlacionados: "+String(report.correlation&&report.correlation.eventCount||0),
    "- Warnings / errores / eventos fallidos-bloqueados: "+String(telemetry.warnings||0)+" / "+String(telemetry.errors||0)+" / "+String(telemetry.failedOrBlockedEvents||0),
    "- Muestras de rendimiento / media: "+String(telemetry.performance&&telemetry.performance.samples||0)+" / "+String(telemetry.media&&telemetry.media.samples||0),
    "- Conteo por grupos: "+JSON.stringify(telemetry.featureSignals||{}),"","## Señales ausentes o incompletas","",
    ...(report.completeness&&report.completeness.missingSignals||[]).map(value=>"- "+value),"",
    "## Errores, advertencias y fallos","","| Momento | Acción | Nivel | Categoría | Motivo |","|---|---|---|---|---|",
    ...(telemetry.errorTimeline||[]).map(item=>"| "+String(item.at||"unknown")+" | "+String(item.action||"")+" | "+String(item.level||"")+" | "+String(item.category||"")+" | "+String(item.reasonCode||"")+" |"),"",
    "## Privacidad","",
    "- Audio/transcripción crudos, texto de transcripción, HTML/CSS/JS completos y credenciales no forman parte del informe.",
    "- Las estrellas indican visibilidad del prompt; no se infiere ni afirma un valor seleccionado ni un envío.",
    "- Los IDs de llamada se sustituyen por una referencia opaca."
  ];
  return lines.join("\n")+"\n";
}
function updateCallReports(obs,candidateCallIds,generatedAt){
  const reportsRoot=path.join(obs,"call-reports");
  const indexFile=path.join(reportsRoot,"index.json");
  const index=readJson(indexFile,{schema:"signal-interpreter-call-report-index/v1",generatedAt:null,reportCount:0,latestCallRef:null,reportsByCallRef:{}});
  index.schema="signal-interpreter-call-report-index/v1";
  index.reportsByCallRef=index.reportsByCallRef&&typeof index.reportsByCallRef==="object"?index.reportsByCallRef:{};
  const ids=Array.from(new Set(candidateCallIds||[])).filter(Boolean);
  if(ids.length){
    const relatedByCallId=new Map(ids.map(callId=>[String(callId),[]]));
    for(const batchFile of listJson(path.join(obs,"batches"))){
      const batch=readJson(batchFile,null);
      if(!batch||batch.schema!==BATCH_SCHEMA||!isRealBatch(batch)||!Array.isArray(batch.events))continue;
      batch.events.forEach(event=>{
        const callId=eventCallId(event);
        const related=relatedByCallId.get(String(callId||""));
        if(related)related.push(Object.assign({batchId:batch.batchId},event));
      });
    }
    for(const callId of ids){
      const callRef=sha256("signal-interpreter-call:"+callId).slice(0,24);
      const related=relatedByCallId.get(String(callId))||[];
      if(!related.length)continue;
      const report=makeCallReport(String(callId),related,generatedAt);
      const previous=index.reportsByCallRef[callRef]||{};
      let reportPath=previous.reportPath||null;
      if(!reportPath){
        const anchor=report.call.endedAt||report.endConfirmation.confirmedAt||report.time.firstObservedAt||generatedAt;
        const day=String(anchor).slice(0,10)||generatedAt.slice(0,10);
        reportPath="call-reports/"+day+"/call-"+callRef+".json";
      }
      report.reportPath=reportPath;
      writeJson(path.join(obs,reportPath),report);
      index.reportsByCallRef[callRef]={
        callRef:callRef,reportPath:reportPath,generatedAt:generatedAt,startedAt:report.call.startedAt,
        endedAt:report.call.endedAt,status:report.status,ratingStarsObserved:report.endConfirmation.ratingStarsVisible,
        eventCount:report.correlation.eventCount,missingSignalCount:report.completeness.missingSignals.length
      };
    }
  }
  const entries=Object.values(index.reportsByCallRef).filter(entry=>entry&&entry.reportPath);
  entries.sort((a,b)=>(Date.parse(a.endedAt||a.generatedAt||"")||0)-(Date.parse(b.endedAt||b.generatedAt||"")||0));
  index.generatedAt=generatedAt;index.reportCount=entries.length;
  index.completedCount=entries.filter(entry=>entry.status==="complete").length;
  index.partialCount=entries.filter(entry=>entry.status!=="complete").length;
  const latest=entries.length?entries[entries.length-1]:null;
  index.latestCallRef=latest?latest.callRef:null;index.latestReportPath=latest?latest.reportPath:null;
  if(latest){
    const report=readJson(path.join(obs,latest.reportPath),null);
    if(report){
      writeJson(path.join(obs,"latest","latest-call-report.json"),report);
      fs.writeFileSync(path.join(obs,"latest","latest-call-report.md"),callReportMarkdown(report),"utf8");
      index.latestStatus=report.status;
      index.latestRatingStarsObserved=report.endConfirmation&&report.endConfirmation.ratingStarsVisible===true;
      index.latestReportGeneratedAt=report.generatedAt;
    }
  }
  writeJson(indexFile,index);
  return index;
}

function batchTime(batch){
  const t=Date.parse(batch&&batch.createdAt||"");
  return Number.isFinite(t)?t:0;
}
function findLatestRealBatch(obs){
  const files=listJson(path.join(obs,"batches"));
  let latest=null;
  for(const file of files){
    const batch=readJson(file,null);
    if(!isRealBatch(batch))continue;
    if(!latest||batchTime(batch)>batchTime(latest))latest=batch;
  }
  return latest;
}
function rebuildFromBatches(obs,index){
  const next=baseIndex();
  const files=listJson(path.join(obs,"batches"));
  let observations=0,deltas=0;
  for(const file of files){
    const batch=readJson(file,null);
    if(!batch)continue;
    const result=applyBatchToIndex(obs,next,batch);
    observations+=result.changedObservations;
    deltas+=result.changedDeltas;
  }
  next.observations=observations;
  next.deltas=deltas;
  next.identityCount=Object.keys(next.latestByIdentity).length;
  next.routes=Array.from(new Set(Object.values(next.latestByIdentity).map(x=>x&&x.route).filter(Boolean))).sort();
  next.routeCount=next.routes.length;
  next.generatedAt=now();
  return next;
}
export function buildObservabilityPackage(root=DEFAULT_ROOT){
  const obs=path.join(root,"observations");
  const inbox=path.join(obs,"inbox");
  const batchesDir=path.join(obs,"batches");
  fs.mkdirSync(inbox,{recursive:true});
  fs.mkdirSync(batchesDir,{recursive:true});
  fs.mkdirSync(path.join(obs,"latest"),{recursive:true});

  let index=loadPackageIndex(obs);
  const indexValid=index&&index.schema==="signal-interpreter-platform-index/v1"&&index.latestByIdentity&&typeof index.latestByIdentity==="object";
  if(!indexValid||(!fs.existsSync(path.join(obs,"manifest.json"))&&Number(index.observations||0)===0)){
    index=rebuildFromBatches(obs,index);
  }
  const inboxFiles=listJson(inbox);
  const publishHistory=derivePublishHistory(obs);
  const terminalCallIds=new Set();
  let processedInbox=0,lastInput=null;
  for(const inboxFile of inboxFiles){
    const batch=readJson(inboxFile,null);
    if(!batch||batch.schema!==BATCH_SCHEMA||!batch.batchId)continue;
    const destination=path.join(batchesDir,fileToken(batch.batchId)+".json");
    if(!fs.existsSync(destination))fs.copyFileSync(inboxFile,destination);
    const result=applyBatchToIndex(obs,index,batch);
    index.observations=Number(index.observations||0)+result.changedObservations;
    index.deltas=Number(index.deltas||0)+result.changedDeltas;
    index.identityCount=Object.keys(index.latestByIdentity).length;
    index.routes=Array.from(new Set(Object.values(index.latestByIdentity).map(x=>x&&x.route).filter(Boolean))).sort();
    index.routeCount=index.routes.length;
    updatePublishHistory(publishHistory,batch);
    if(isRealBatch(batch)&&Array.isArray(batch.events)){
      for(const event of batch.events){
        if(isTerminalCallEvent(event)){
          const callId=eventCallId(event);
          if(callId)terminalCallIds.add(callId);
        }
      }
    }
    processedInbox+=1;
    if(!lastInput||batchTime(batch)>batchTime(lastInput))lastInput=batch;
    fs.rmSync(inboxFile,{force:true});
  }

  const latestReal=lastInput&&isRealBatch(lastInput)?lastInput:findLatestRealBatch(obs);
  const generatedAt=now();
  const callReportIndex=updateCallReports(obs,Array.from(terminalCallIds),generatedAt);
  const latestCallReport=callReportIndex.latestReportPath
    ?readJson(path.join(obs,callReportIndex.latestReportPath),null):null;
  index.generatedAt=generatedAt;
  const screenshotIndex=deriveScreenshotIndex(obs);
  writeJson(path.join(obs,"platform-index.json"),index);
  writeJson(path.join(obs,"screenshots-index.json"),screenshotIndex);
  writeJson(path.join(obs,"platform-latest.json"),{
    schema:"signal-interpreter-platform-latest/v1",
    generatedAt,
    observations:Number(index.observations||0),
    deltas:Number(index.deltas||0),
    identityCount:Number(index.identityCount||0),
    routeCount:Number(index.routeCount||0),
    routes:index.routes||[],
    latestByIdentity:index.latestByIdentity||{}
  });

  const manifest={
    schema:PACKAGE_SCHEMA,
    generatedAt,
    lastBatchId:latestReal&&latestReal.batchId||null,
    lastSequence:Number(latestReal&&latestReal.summary&&latestReal.summary.lastSequence||0),
    extensionVersion:String(latestReal&&latestReal.extensionVersion||"unknown"),
    eventCount:Number(latestReal&&latestReal.summary&&latestReal.summary.eventsTotal||0),
    totalBatchFiles:listJson(batchesDir).length,
    calls:{
      reportCount:Number(callReportIndex.reportCount||0),
      completedReports:Number(callReportIndex.completedCount||0),
      partialReports:Number(callReportIndex.partialCount||0),
      latestCallRef:callReportIndex.latestCallRef||null,
      latestReportPath:callReportIndex.latestReportPath||null,
      latestReportAt:callReportIndex.latestReportGeneratedAt||null,
      latestReportStatus:callReportIndex.latestStatus||null,
      latestRatingStarsObserved:callReportIndex.latestRatingStarsObserved===true
    },
    platform:{
      observations:Number(index.observations||0),
      deltas:Number(index.deltas||0),
      identities:Number(index.identityCount||0),
      screenshotsChanged:Number(screenshotIndex.changed||0),
      screenshotsUnchanged:Number(screenshotIndex.unchanged||0),
      screenshotErrors:Number(screenshotIndex.errors||0),
      screenshotRoutes:Number(screenshotIndex.routeCount||0)
    }
  };
  writeJson(path.join(obs,"manifest.json"),manifest);

  if(latestReal){
    writeJson(path.join(obs,"latest","latest.json"),latestReal);
    fs.writeFileSync(path.join(obs,"latest","latest-summary.md"),buildLatestSummary(latestReal,index),"utf8");
  }

  const health={
    schema:"signal-interpreter-observability-build-health/v1",
    generatedAt,
    source:"github-actions",
    processedInbox,
    lastInputBatchId:lastInput&&lastInput.batchId||null,
    lastInputCreatedAt:lastInput&&lastInput.createdAt||null,
    latestRealBatchId:latestReal&&latestReal.batchId||null,
    lastAutomaticPublishAt:publishHistory.lastAutomaticPublishAt,
    lastAutomaticBatchId:publishHistory.lastAutomaticBatchId,
    lastManualPublishAt:publishHistory.lastManualPublishAt,
    lastManualBatchId:publishHistory.lastManualBatchId,
    batchFiles:manifest.totalBatchFiles,
    platformSnapshots:Number(index.observations||0),
    platformDeltas:Number(index.deltas||0),
    identities:Number(index.identityCount||0),
    platformScreenshotsChanged:Number(screenshotIndex.changed||0),
    platformScreenshotsUnchanged:Number(screenshotIndex.unchanged||0),
    platformScreenshotErrors:Number(screenshotIndex.errors||0),
    platformScreenshotRoutes:Number(screenshotIndex.routeCount||0),
    callReportCount:Number(callReportIndex.reportCount||0),
    latestCallReportPath:callReportIndex.latestReportPath||null,
    latestCallReportAt:callReportIndex.latestReportGeneratedAt||null,
    latestCallReportStatus:callReportIndex.latestStatus||null,
    latestCallRatingStarsObserved:callReportIndex.latestRatingStarsObserved===true,
    callReportCheckpointObserved:!!(latestCallReport&&latestCallReport.endConfirmation&&latestCallReport.endConfirmation.finalCheckpointObserved),
    inboxRemaining:listJson(inbox).length,
    status:"ok"
  };
  writeJson(path.join(obs,"health","github-build.json"),health);
  return{manifest,index,health,callReports:callReportIndex,latestCallReport:latestCallReport};
}

if(import.meta.url===`file://${process.argv[1]?.replaceAll("\\\\","/")}`){
  const root=process.argv[2]?path.resolve(process.argv[2]):DEFAULT_ROOT;
  const result=buildObservabilityPackage(root);
  console.log("OBSERVABILITY_GITHUB_BUILD=PASS",JSON.stringify({
    processedInbox:result.health.processedInbox,
    batches:result.health.batchFiles,
    identities:result.health.identities,
    snapshots:result.health.platformSnapshots,
    deltas:result.health.platformDeltas
  }));
}
