import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";

const SCHEMA="signal-interpreter-incoming-call-window/v1";
const WINDOW_MS=10*60*1000;
const FRESH_MS=90*1000;
const DELAYED_MS=5*60*1000;
const CALL_ACTIONS=new Set([
  "INCOMING_RING_REQUEST_STARTED","INCOMING_RING_SIGNAL","INCOMING_RING_REQUEST_FAILED",
  "INCOMING_RING_CONTEXT_LINKED","INCOMING_RING_CONTEXT_NOTIFIED","INCOMING_RING_CONTEXT_NOTIFY_ERROR",
  "INCOMING_DIALOG_DETECTED","INCOMING_DIALOG_CLOSED","INCOMING_DIALOG_CLOSED_OBSERVED",
  "INCOMING_ATTEMPT_CORRELATED","INCOMING_ATTEMPT_CORRELATION_RECONCILED",
  "CONNECT_BUTTON_FOUND","CONNECT_BUTTON_NOT_FOUND","CONNECT_BUTTON_DISABLED",
  "AUTO_ANSWER_BLOCKED","AUTO_ANSWER_ELIGIBLE","AUTO_ANSWER_SKIPPED_UNVERIFIED_MODALITY",
  "CONNECT_CLICKED","CONNECT_ACCEPTED_PENDING","ANSWER_FLOW_ROUTE_CONFIRMED",
  "CALL_ROUTE_ENTERED","CALL_TIMER_STARTED","CALL_ROUTE_ENDED",
  "CONNECT_ROUTE_TIMEOUT","CONNECT_ERROR","CONNECT_FLOW_FAILED_NO_CALL_ROUTE",
  "MISSED_CALL_CLASSIFIED","AUTO_ANSWER_BOOTSTRAP_REQUESTED",
  "AUTO_ANSWER_BOOTSTRAP_INJECTED","AUTO_ANSWER_BOOTSTRAP_INJECTION_ERROR"
]);
const PRESENCE_REASONS=new Set([
  "confirmation-required","worker-start-confirm-again","observation-gap-confirm-again",
  "presence-unavailable-confirm-again","explicit-availability","manual-pause",
  "idle-or-locked-confirm-again","verification-error-confirm-again",
  "settings-changed-confirm-again","laboratory","checking-presence"
]);
function readJson(file){
  try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch(_){return null;}
}
function hash(value){return createHash("sha256").update(String(value)).digest("hex").slice(0,24);}
function attemptIdOf(event){
  const payload=event&&event.payload||{};
  const direct=event&&(event.incomingAttemptId||event.session&&event.session.incomingAttemptId||event.context&&event.context.incomingAttemptId);
  const fromPayload=payload.incomingAttemptId;
  if(direct||fromPayload)return String(direct||fromPayload).slice(0,180);
  if(payload.pendingId)return "legacy-pending:"+String(payload.pendingId).slice(0,180);
  if(event&&event.action==="MISSED_CALL_CLASSIFIED"&&payload.id)return "legacy-pending:"+String(payload.id).slice(0,180);
  if(event&&event.action==="CONNECT_FLOW_FAILED_NO_CALL_ROUTE"&&payload.pendingId)return "legacy-pending:"+String(payload.pendingId).slice(0,180);
  return null;
}
function validBatch(batch){
  return !!batch&&batch.schema==="signal-interpreter-observation-batch/v1"&&
    !!batch.batchId&&batch.trigger!=="observability-self-test"&&
    batch.extensionVersion!=="self-test"&&Array.isArray(batch.events);
}
function safeReason(value){
  const text=String(value||"");
  if(PRESENCE_REASONS.has(text))return text;
  if(["lab-safety-lock","profile-not-authorized","auto-answer-disabled",
      "dialog_removed","dialog-removed","call-route-confirmed",
      "dialog_closed_without_connect","dialog_timeout","connect_clicked_no_call_route",
      "only-verified-OPI","dialog-or-button-changed-after-authorization"].includes(text))return text;
  if(["availability-online","availability-offline","availability-unknown"].includes(text))return text;
  if(/^presence-not-armed:/.test(text)){
    const reason=text.split(":")[1]||"unknown";
    return "presence-not-armed:"+(PRESENCE_REASONS.has(reason)?reason:"other");
  }
  if(/^presence-authorization-rejected:/.test(text))return "presence-authorization-rejected";
  return null;
}
function safeBlockers(value){
  if(!Array.isArray(value))return[];
  return Array.from(new Set(value.map(safeReason).filter(Boolean))).slice(0,20);
}
function safeModality(value){
  return ["OPI","VRI","UNKNOWN"].includes(String(value||""))?String(value):"unknown";
}
function eventSummary(event,batch){
  const p=event&&event.payload||{};
  const action=String(event&&event.action||"UNKNOWN");
  const summary={
    at:event.timestamp||null,
    ingestedAt:event.ingestedAt||null,
    sequence:Number(event.sequence)||null,
    action:action,
    level:["info","warn","error"].includes(event.level)?event.level:"info",
    component:String(event.component||event.source||"unknown").slice(0,40),
    batchId:String(batch.batchId||""),
    batchCreatedAt:batch.createdAt||null,
    ingestDelayMs:Number.isFinite(Number(event.ingestDelayMs))?Math.max(0,Number(event.ingestDelayMs)):null
  };
  const modality=safeModality(p.modality||event.modality);
  if(modality!=="unknown")summary.modality=modality;
  const boolFields=[
    "connectFound","connectDisabled","disabled","ready","labSafetyLock","presenceArmed",
    "autoAnswerEnabled","grantReceived","grantOk","buttonConnected","buttonDisabled"
  ];
  for(const key of boolFields)if(typeof p[key]==="boolean")summary[key]=p[key];
  if(Array.isArray(p.blockers))summary.blockers=safeBlockers(p.blockers);
  const reason=safeReason(p.reason||event.reasonCode||p.reasonCode);
  if(reason)summary.reason=reason;
  const presenceReason=safeReason(p.presenceReason);
  if(presenceReason)summary.presenceReason=presenceReason;
  for(const key of ["statusCode","durationMs","clickLatencyMs","elapsedMs","requestTextLength"]){
    const n=Number(p[key]??event[key]);
    if(Number.isFinite(n)&&n>=0)summary[key]=Math.min(n,86400000);
  }
  if(p.stage==="presence-authorization")summary.stage="presence-authorization";
  if(p.error||event.error)summary.errorObserved=true;
  return summary;
}
function minAt(events){
  return events.map(x=>Date.parse(x.timestamp||"")).filter(Number.isFinite).reduce((a,b)=>Math.min(a,b),Infinity);
}
function maxAt(events){
  return events.map(x=>Date.parse(x.timestamp||"")).filter(Number.isFinite).reduce((a,b)=>Math.max(a,b),0);
}
function eventTime(event){const t=Date.parse(event&&event.timestamp||"");return Number.isFinite(t)?t:0;}
function classify(events){
  const actions=new Set(events.map(x=>String(x.action||"")));
  if(actions.has("ANSWER_FLOW_ROUTE_CONFIRMED")||actions.has("CALL_ROUTE_ENTERED"))return"answered";
  if(actions.has("MISSED_CALL_CLASSIFIED"))return"missed";
  if(actions.has("CONNECT_FLOW_FAILED_NO_CALL_ROUTE")||actions.has("CONNECT_ROUTE_TIMEOUT")||actions.has("CONNECT_ERROR"))return"connect-failed";
  return"unresolved";
}
function buildAttempt(id,events,correlation){
  const ordered=events.slice().sort((a,b)=>eventTime(a)-eventTime(b));
  const actions=new Set(ordered.map(x=>String(x.action||"")));
  const ring=ordered.filter(x=>x.action==="INCOMING_RING_REQUEST_STARTED"||x.action==="INCOMING_RING_SIGNAL");
  const dialog=ordered.find(x=>x.action==="INCOMING_DIALOG_DETECTED");
  const button=ordered.find(x=>x.action==="CONNECT_BUTTON_FOUND");
  const click=ordered.find(x=>x.action==="CONNECT_CLICKED");
  const answered=ordered.find(x=>x.action==="ANSWER_FLOW_ROUTE_CONFIRMED"||x.action==="CALL_ROUTE_ENTERED");
  const closed=ordered.find(x=>x.action==="INCOMING_DIALOG_CLOSED"||x.action==="INCOMING_DIALOG_CLOSED_OBSERVED");
  const missed=ordered.find(x=>x.action==="MISSED_CALL_CLASSIFIED");
  const blockers=Array.from(new Set(ordered.flatMap(x=>safeBlockers(x.payload&&x.payload.blockers))));
  const first=minAt(ordered),last=maxAt(ordered);
  const at=(event)=>event?eventTime(event):0;
  const delta=(a,b)=>a&&b&&b>=a?b-a:null;
  const modalityEvent=dialog||ordered.find(x=>x.payload&&x.payload.modality);
  const sourceBatchIds=Array.from(new Set(ordered.map(x=>String(x.__batchId||"")).filter(Boolean))).slice(0,20);
  return{
    attemptRef:hash("signal-interpreter-incoming:"+id),
    correlation:correlation,
    outcome:classify(ordered),
    modality:safeModality(modalityEvent&&modalityEvent.payload&&modalityEvent.payload.modality),
    firstObservedAt:Number.isFinite(first)?new Date(first).toISOString():null,
    lastObservedAt:last?new Date(last).toISOString():null,
    eventCount:ordered.length,
    sourceBatchIds:sourceBatchIds,
    stages:{
      ringObserved:ring.length>0,
      dialogDetected:!!dialog,
      connectButtonFound:!!button||!!(dialog&&dialog.payload&&dialog.payload.connectFound),
      connectButtonNotFound:actions.has("CONNECT_BUTTON_NOT_FOUND"),
      connectButtonDisabled:actions.has("CONNECT_BUTTON_DISABLED")||!!(dialog&&dialog.payload&&dialog.payload.connectDisabled),
      autoAnswerBlocked:actions.has("AUTO_ANSWER_BLOCKED"),
      autoAnswerEligible:actions.has("AUTO_ANSWER_ELIGIBLE"),
      connectClicked:!!click,
      answerConfirmed:!!answered,
      dialogClosed:!!closed,
      missedClassified:!!missed,
      connectFlowFailed:actions.has("CONNECT_FLOW_FAILED_NO_CALL_ROUTE")||actions.has("CONNECT_ROUTE_TIMEOUT")||actions.has("CONNECT_ERROR")
    },
    blockers:blockers,
    timing:{
      ringToDialogMs:delta(at(ring[0]),at(dialog)),
      dialogToClickMs:delta(at(dialog),at(click)),
      clickToAnswerMs:delta(at(click),at(answered)),
      dialogToMissedMs:delta(at(dialog),at(missed)),
      firstToLastMs:delta(first,last)
    },
    timeline:ordered.slice(-80).map(event=>eventSummary(event,{batchId:event.__batchId,createdAt:event.__batchCreatedAt}))
  };
}
export function buildIncomingCallWindowReport(observationsRoot,generatedAt=new Date().toISOString()){
  const root=path.resolve(observationsRoot);
  const batchesDir=path.join(root,"batches");
  const endMs=Date.parse(generatedAt);
  const startMs=endMs-WINDOW_MS;
  const files=fs.existsSync(batchesDir)
    ?fs.readdirSync(batchesDir).filter(name=>name.endsWith(".json")).sort().map(name=>path.join(batchesDir,name))
    :[];
  const recentAttemptIds=new Set();
  const recentUnlinked=[];
  let eventsInWindow=0,callEventsInWindow=0,latestObservedMs=0,latestBatchMs=0;
  let latestBatchCreatedAt=null,latestBatchId=null,batchCount=0,maxPersistDelayMs=0,maxBatchDelayMs=0;
  for(const file of files){
    const batch=readJson(file);
    if(!validBatch(batch))continue;
    batchCount++;
    const batchMs=Date.parse(batch.createdAt||"");
    if(Number.isFinite(batchMs)&&batchMs>latestBatchMs){latestBatchMs=batchMs;latestBatchCreatedAt=batch.createdAt;latestBatchId=batch.batchId;}
    for(const event of batch.events){
      const t=eventTime(event);
      if(t<=endMs&&t>latestObservedMs)latestObservedMs=t;
      if(t<startMs||t>endMs||!t)continue;
      eventsInWindow++;
      if(CALL_ACTIONS.has(String(event.action||"")))callEventsInWindow++;
      const id=attemptIdOf(event);
      if(id)recentAttemptIds.add(id);
      else if(CALL_ACTIONS.has(String(event.action||""))){
        recentUnlinked.push({event:Object.assign({},event,{__batchId:batch.batchId,__batchCreatedAt:batch.createdAt})});
      }
      const ingested=Date.parse(event.ingestedAt||"");
      if(ingested&&t&&ingested>=t)maxPersistDelayMs=Math.max(maxPersistDelayMs,ingested-t);
      if(batchMs&&t&&batchMs>=t)maxBatchDelayMs=Math.max(maxBatchDelayMs,batchMs-t);
    }
  }
  const byAttempt=new Map(Array.from(recentAttemptIds,id=>[id,[]]));
  if(byAttempt.size){
    for(const file of files){
      const batch=readJson(file);
      if(!validBatch(batch))continue;
      for(const event of batch.events){
        const id=attemptIdOf(event);
        if(!id||!byAttempt.has(id))continue;
        byAttempt.get(id).push(Object.assign({},event,{__batchId:batch.batchId,__batchCreatedAt:batch.createdAt}));
      }
    }
  }
  const attempts=Array.from(byAttempt.entries())
    .map(([id,events])=>buildAttempt(id,events,id.startsWith("legacy-pending:")?"legacy-pending-id":"correlated"))
    .sort((a,b)=>String(a.firstObservedAt||"").localeCompare(String(b.firstObservedAt||"")));
  const unlinkedAttempts=recentUnlinked.map(({event})=>{
    const synthetic="unlinked:"+String(event.id||event.__batchId+":"+event.sequence||"event");
    const result=buildAttempt(synthetic,[event],"unlinked");
    result.correlationStatus="attempt-id-not-captured";
    result.sourceBatchIds=[String(event.__batchId||"")];
    return result;
  });
  const allAttempts=attempts.concat(unlinkedAttempts);
  const ageMs=latestObservedMs?Math.max(0,endMs-latestObservedMs):null;
  const freshness=!latestObservedMs?"no-data":ageMs<=FRESH_MS?"fresh":ageMs<=DELAYED_MS?"delayed":"stale";
  const count=(outcome)=>allAttempts.filter(x=>x.outcome===outcome).length;
  return{
    schema:SCHEMA,
    generatedAt:generatedAt,
    window:{start:new Date(startMs).toISOString(),end:new Date(endMs).toISOString(),durationSeconds:600},
    freshness:freshness,
    coverage:{
      latestObservedAt:latestObservedMs?new Date(latestObservedMs).toISOString():null,
      latestObservedAgeSeconds:ageMs===null?null:Math.round(ageMs/1000),
      latestBatchCreatedAt:latestBatchCreatedAt,
      latestBatchId:latestBatchId,
      latestBatchAgeSeconds:latestBatchMs?Math.max(0,Math.round((endMs-latestBatchMs)/1000)):null,
      batchCount:batchCount,
      eventsInWindow:eventsInWindow,
      callLifecycleEventsInWindow:callEventsInWindow,
      maxPersistDelayMs:maxPersistDelayMs,
      maxBatchDelayMs:maxBatchDelayMs,
      noAttemptsObservedUnderFreshTelemetry:freshness==="fresh"&&allAttempts.length===0
    },
    attempts:{
      total:allAttempts.length,
      correlated:attempts.length,
      unlinked:unlinkedAttempts.length,
      answered:count("answered"),
      missed:count("missed"),
      connectFailed:count("connect-failed"),
      unresolved:count("unresolved")
    },
    items:allAttempts
  };
}
export function renderIncomingCallWindowMarkdown(report){
  const coverage=report.coverage||{},counts=report.attempts||{};
  const lines=[
    "# Signal Interpreter — llamadas entrantes · últimos 10 minutos","",
    "- Generado: "+String(report.generatedAt||"unknown"),
    "- Ventana UTC: "+String(report.window&&report.window.start||"unknown")+" → "+String(report.window&&report.window.end||"unknown"),
    "- Frescura: **"+String(report.freshness||"unknown")+"**",
    "- Último evento observado: "+String(coverage.latestObservedAt||"sin datos"),
    "- Antigüedad del último evento (s): "+String(coverage.latestObservedAgeSeconds==null?"unknown":coverage.latestObservedAgeSeconds),
    "- Eventos totales de la ventana: "+String(coverage.eventsInWindow||0),
    "- Eventos del ciclo de llamadas: "+String(coverage.callLifecycleEventsInWindow||0),
    "- Intentos correlacionados / sin identificador correlacionable: "+String(counts.correlated||0)+" / "+String(counts.unlinked||0),
    "- Contestadas / perdidas / fallo al conectar / sin desenlace: "+[counts.answered||0,counts.missed||0,counts.connectFailed||0,counts.unresolved||0].join(" / "),
    "",
    "Un cero solo equivale a «sin intentos observados» cuando la frescura es fresh; con delayed, stale o no-data la ausencia de eventos no demuestra ausencia de llamadas.",
    "",
    "## Intentos",
    "",
    "| Referencia | Resultado | Modalidad | Detección | Botón | Clic | Confirmación | Bloqueos |",
    "|---|---|---|---|---|---|---|---|"
  ];
  for(const item of report.items||[]){
    const s=item.stages||{};
    lines.push("| "+item.attemptRef+" | "+item.outcome+" | "+item.modality+" | "+!!s.dialogDetected+" | "+(s.connectButtonFound?"sí":s.connectButtonNotFound?"no":"?")+" | "+!!s.connectClicked+" | "+!!s.answerConfirmed+" | "+(item.blockers||[]).join(", ")+" |");
  }
  lines.push("","## Tiempos de transporte","",
    "- Máxima latencia de persistencia local: "+String(coverage.maxPersistDelayMs||0)+" ms",
    "- Máximo tiempo evento→creación de batch: "+String(coverage.maxBatchDelayMs||0)+" ms",
    "- Edad del último batch: "+String(coverage.latestBatchAgeSeconds==null?"unknown":coverage.latestBatchAgeSeconds)+" s",
    "",
    "Los identificadores de intento se muestran como referencias SHA-256 opacas. No se incluyen IDs de llamada de la plataforma, texto del diálogo, audio, transcripciones ni credenciales.");
  return lines.join("\n")+"\n";
}
