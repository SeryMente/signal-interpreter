import {createHash} from "node:crypto";

const WINDOW_MS = 10 * 60 * 1000;
const TERMINAL_ANSWER = new Set(["INCOMING_ATTEMPT_ANSWERED","ANSWER_FLOW_ROUTE_CONFIRMED","CALL_ROUTE_ENTERED"]);
const TERMINAL_CLICK_FAILURE = new Set(["CONNECT_FLOW_FAILED_NO_CALL_ROUTE","CONNECT_ROUTE_TIMEOUT","CONNECT_ERROR"]);
const CONTEXT_ACTIONS = new Set([
  "INCOMING_RING_SIGNAL","INCOMING_DIALOG_DETECTED","INCOMING_DIALOG_CLOSED","INCOMING_DIALOG_CLOSED_OBSERVED",
  "CONNECT_BUTTON_FOUND","CONNECT_BUTTON_NOT_FOUND","CONNECT_BUTTON_DISABLED","AUTO_ANSWER_READINESS",
  "AUTO_ANSWER_BLOCKED","AUTO_ANSWER_AUTHORIZATION_BLOCKED","AUTO_ANSWER_ELIGIBLE","AUTO_ANSWER_SKIPPED_UNVERIFIED_MODALITY",
  "CONNECT_CLICKED","CONNECT_ACCEPTED_PENDING","ANSWER_FLOW_ROUTE_CONFIRMED","CALL_ROUTE_ENTERED",
  "INCOMING_ATTEMPT_REGISTERED","INCOMING_ATTEMPT_ANSWERED","INCOMING_ATTEMPT_SUPERSEDED","MISSED_CALL_CLASSIFIED",
  "CONNECT_FLOW_FAILED_NO_CALL_ROUTE","CONNECT_ROUTE_TIMEOUT","CONNECT_ERROR","AVAILABILITY_STATE",
  "PLATFORM_SESSION_STARTED","PLATFORM_SESSION_ENDED","PLATFORM_ONLINE_RECONCILED_STARTED","PLATFORM_ONLINE_RECONCILED_ENDED",
  "PLATFORM_ONLINE_RECONCILE_ERROR","OBSERVER_STARTED","OBSERVER_STOPPED","AUTO_ANSWER_BOOTSTRAP_REQUESTED",
  "AUTO_ANSWER_BOOTSTRAP_INJECTED","AUTO_ANSWER_BOOTSTRAP_INJECTION_ERROR","PAGE_LIFECYCLE","PAGE_VISIBILITY_CHANGED",
  "PLATFORM_URL_CHANGED","PLATFORM_SCREENSHOT_CAPTURE_ERROR","PLATFORM_SCREENSHOT_UPLOAD_ERROR",
  "NETWORK_ACTIVITY_WINDOW","PERFORMANCE_HEARTBEAT","PLATFORM_TELEMETRY_RECONCILED","PLATFORM_SURFACE_SNAPSHOT"
]);

function payloadOf(event){return event&&event.payload&&typeof event.payload==="object"?event.payload:{};}
function hash(value){return createHash("sha256").update(String(value||"")).digest("hex").slice(0,24);}
function safeText(value,max=120){return String(value==null?"":value).replace(/[\r\n\t]+/g," ").replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi,"Bearer [REDACTED]").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[EMAIL]").replace(/(?:\+?\d[\d\s().-]{7,}\d)/g,"[PHONE]").slice(0,max);}
function tabOf(event){
  const p=payloadOf(event),context=event&&event.context||{};
  const value=event&&event.tabId!=null?event.tabId:(context.sourceTabId!=null?context.sourceTabId:(p.tabId!=null?p.tabId:null));
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}
function callIdOf(event){
  const p=payloadOf(event),finalCall=p.finalCall&&typeof p.finalCall==="object"?p.finalCall:{};
  return String(p.callId||finalCall.callId||event&&event.session&&event.session.callId||event&&event.context&&event.context.callId||"").trim();
}
function explicitAttemptId(event){
  const p=payloadOf(event);
  return String(p.attemptId||p.incomingAttemptId||p.pendingId||"").trim();
}
function safeDetails(event){
  const p=payloadOf(event),out={};
  const allowed=[
    "modality","connectFound","connectDisabled","blockedReasons","ready","availability","authorizedProfile",
    "configEnabled","labSafetyLock","presenceArmed","presenceReason","presenceGeneration","buttonFound","buttonDisabled",
    "reason","reasonCode","status","signal","statusCode","durationMs","clickLatencyMs","elapsedMs","decision",
    "routeConfirmation","confirmation","trigger","action","platformInteraction","dialogButtons","attempts","grantOk",
    "grantGeneration","currentPresenceGeneration"
  ];
  for(const key of allowed){
    const value=p[key];
    if(value===undefined||value===null)continue;
    if(typeof value==="boolean"||typeof value==="number")out[key]=value;
    else if(typeof value==="string")out[key]=safeText(value,120);
    else if(Array.isArray(value))out[key]=value.slice(0,12).map(x=>safeText(x,80));
  }
  if(event&&event.reasonCode)out.reasonCode=safeText(event.reasonCode,100);
  if(event&&event.error)out.error=safeText(event.error,160);
  return out;
}
function correctedTimestamp(event,batch){
  const eventMs=Date.parse(event&&event.timestamp||"");
  if(!Number.isFinite(eventMs))return{ms:null,basis:"invalid-event-timestamp",skewMs:null};
  const relayMs=Date.parse(batch&&batch.relayReceivedAt||"");
  const createdMs=Date.parse(batch&&batch.createdAt||"");
  if(Number.isFinite(relayMs)&&Number.isFinite(createdMs)){
    const skewMs=relayMs-createdMs;
    return{ms:eventMs+skewMs,basis:"relay-receipt-corrected",skewMs:skewMs};
  }
  return{ms:eventMs,basis:"client-clock-unverified",skewMs:null};
}
function summarizeAttempt(group){
  const ordered=group.events.sort((a,b)=>a.atMs-b.atMs);
  const actions=new Set(ordered.map(item=>item.action));
  const incoming=ordered.find(item=>item.action==="INCOMING_DIALOG_DETECTED")||null;
  const ring=ordered.filter(item=>item.action==="INCOMING_RING_SIGNAL");
  const clicked=ordered.find(item=>item.action==="CONNECT_CLICKED")||null;
  const answer=ordered.find(item=>TERMINAL_ANSWER.has(item.action))||null;
  const missed=ordered.find(item=>item.action==="MISSED_CALL_CLASSIFIED")||null;
  const failed=ordered.find(item=>TERMINAL_CLICK_FAILURE.has(item.action))||null;
  const closed=ordered.find(item=>item.action==="INCOMING_DIALOG_CLOSED"||item.action==="INCOMING_DIALOG_CLOSED_OBSERVED")||null;
  const readiness=ordered.filter(item=>item.action==="AUTO_ANSWER_READINESS");
  const blocked=ordered.filter(item=>item.action==="AUTO_ANSWER_BLOCKED"||item.action==="AUTO_ANSWER_AUTHORIZATION_BLOCKED");
  const buttonFound=ordered.some(item=>item.action==="CONNECT_BUTTON_FOUND");
  const buttonMissing=ordered.some(item=>item.action==="CONNECT_BUTTON_NOT_FOUND");
  const buttonDisabled=ordered.some(item=>item.action==="CONNECT_BUTTON_DISABLED");
  let status="incomplete";
  if(missed)status="missed";
  else if(answer)status="answered";
  else if(failed)status="connect_failed_no_route";
  else if(!incoming&&ring.length)status="ring_unmatched";
  else if(closed)status=clicked?"closed_after_click_unresolved":"closed_unclassified";
  else if(incoming)status="incoming_observed_pending";
  const missing=[];
  if(!incoming)missing.push("INCOMING_DIALOG_DETECTED");
  if(incoming&&!buttonFound&&!buttonMissing)missing.push("CONNECT_BUTTON_STATE");
  if(incoming&&!readiness.length)missing.push("AUTO_ANSWER_READINESS");
  if(incoming&&!blocked.length&&!readiness.some(item=>item.details.ready===true)&&!clicked)missing.push("AUTO_ANSWER_BLOCK_REASON");
  if(!answer&&!missed&&!failed)missing.push("TERMINAL_CALL_OUTCOME");
  const detectionAt=incoming?incoming.atMs:(ring.length?ring[0].atMs:ordered[0]?.atMs||null);
  const clickAt=clicked?clicked.atMs:null;
  const answerAt=answer?answer.atMs:null;
  const detectionToClickMs=detectionAt!=null&&clickAt!=null?Math.max(0,clickAt-detectionAt):null;
  const detectionToAnswerMs=detectionAt!=null&&answerAt!=null?Math.max(0,answerAt-detectionAt):null;
  const callIds=Array.from(new Set(ordered.map(item=>item.callId).filter(Boolean)));
  return{
    attemptId:group.attemptId,
    status:status,
    modality:incoming?incoming.details.modality:(ordered.find(item=>item.details.modality)?.details.modality||null),
    tabId:group.tabId,
    detectedAt:detectionAt==null?null:new Date(detectionAt).toISOString(),
    closedAt:closed?closed.at:null,
    clickedAt:clicked?clicked.at:null,
    answeredAt:answer?answer.at:null,
    missedAt:missed?missed.at:null,
    outcomeReason:missed?missed.details.reason:(failed?failed.details.reason:(blocked[0]?.details.blockedReasons||null)),
    button:{found:buttonFound,notFound:buttonMissing,disabled:buttonDisabled},
    readiness:{samples:readiness.length,last:readiness.length?readiness[readiness.length-1].details:null},
    blockedEvents:blocked.map(item=>({at:item.at,action:item.action,reasonCode:item.details.reasonCode||null,blockedReasons:item.details.blockedReasons||[]})),
    ringSignalCount:ring.length,
    clickToAnswerLatencyMs:detectionToClickMs,
    detectionToAnswerLatencyMs:detectionToAnswerMs,
    callRefs:callIds.map(id=>hash("signal-interpreter-call:"+id)),
    missingSignals:missing,
    eventCount:ordered.length,
    timeline:ordered.slice(0,100).map(item=>({
      at:item.at,action:item.action,level:item.level,reasonCode:item.reasonCode,
      details:item.details,eventId:item.eventId,sequence:item.sequence
    }))
  };
}
export function buildIncomingCallWindow(batches,generatedAt=new Date().toISOString(),windowMinutes=10){
  const endMs=Date.parse(generatedAt);
  if(!Number.isFinite(endMs))throw new Error("generatedAt must be a valid timestamp");
  const duration=Math.max(1,Math.min(60,Number(windowMinutes)||10))*60*1000;
  const startMs=endMs-duration;
  const rows=[],batchIds=new Set(),receivedBatches=new Set(),unverifiedBatches=new Set(),skews=[];
  for(const batch of Array.isArray(batches)?batches:[]){
    if(!batch||batch.schema!=="signal-interpreter-observation-batch/v1"||!Array.isArray(batch.events))continue;
    const relayReceivedAt=Date.parse(batch.relayReceivedAt||"");
    const batchCreatedAt=Date.parse(batch.createdAt||"");
    if(Number.isFinite(relayReceivedAt)&&Number.isFinite(batchCreatedAt)){
      receivedBatches.add(batch.batchId);
      skews.push(relayReceivedAt-batchCreatedAt);
    }else unverifiedBatches.add(batch.batchId);
    for(const event of batch.events){
      if(!CONTEXT_ACTIONS.has(String(event&&event.action||"")))continue;
      const corrected=correctedTimestamp(event,batch);
      if(corrected.ms===null||corrected.ms<startMs||corrected.ms>endMs)continue;
      const p=payloadOf(event);
      rows.push({
        batchId:String(batch.batchId||""),
        batchCreatedAt:batch.createdAt||null,
        relayReceivedAt:batch.relayReceivedAt||null,
        atMs:corrected.ms,at:new Date(corrected.ms).toISOString(),
        timeBasis:corrected.basis,clockSkewMs:corrected.skewMs,
        action:String(event.action||"UNKNOWN"),level:String(event.level||"info"),
        reasonCode:safeText(event.reasonCode||p.reasonCode||p.reason||"",100)||null,
        eventId:String(event.id||""),sequence:Number(event.sequence)||null,
        tabId:tabOf(event),callId:callIdOf(event)||null,
        attemptId:explicitAttemptId(event),details:safeDetails(event)
      });
    }
  }
  rows.sort((a,b)=>a.atMs-b.atMs);
  const groups=new Map();
  const makeGroup=(key,tabId)=>{
    if(!groups.has(key))groups.set(key,{attemptId:key,tabId:tabId,events:[]});
    const group=groups.get(key);
    if(group.tabId==null&&tabId!=null)group.tabId=tabId;
    return group;
  };
  for(const row of rows){
    if(row.action==="INCOMING_DIALOG_DETECTED"){
      const key=row.attemptId||("legacy-"+hash(row.eventId||row.batchId+row.at));
      const group=makeGroup(key,row.tabId);
      group.events.push(row);
      row._group=key;
    }
  }
  for(const row of rows){
    if(row.action==="INCOMING_DIALOG_DETECTED")continue;
    if(row.attemptId){
      const group=makeGroup(row.attemptId,row.tabId);
      group.events.push(row);
      row._group=row.attemptId;
    }
  }
  const ringRows=rows.filter(row=>row.action==="INCOMING_RING_SIGNAL");
  for(const ring of ringRows){
    let nearest=null,nearestDelta=Infinity;
    for(const group of groups.values()){
      if(!group.events.some(item=>item.action==="INCOMING_DIALOG_DETECTED"))continue;
      if(group.tabId!=null&&ring.tabId!=null&&group.tabId!==ring.tabId)continue;
      const detected=group.events.find(item=>item.action==="INCOMING_DIALOG_DETECTED");
      const delta=Math.abs(detected.atMs-ring.atMs);
      if(delta<=20000&&delta<nearestDelta){nearest=group;nearestDelta=delta;}
    }
    if(nearest){
      nearest.events.push(ring);
      ring._group=nearest.attemptId;
    }else{
      const key="ring-"+hash(ring.eventId||ring.batchId+ring.at);
      const group=makeGroup(key,ring.tabId);
      group.events.push(ring);
      ring._group=key;
    }
  }
  for(const row of rows){
    if(row._group)continue;
    const groupCandidates=Array.from(groups.values()).filter(group=>group.tabId!=null&&row.tabId===group.tabId);
    let nearest=null,nearestDelta=Infinity;
    for(const group of groupCandidates){
      const anchor=group.events.find(item=>item.action==="INCOMING_DIALOG_DETECTED")||group.events[0];
      const delta=Math.abs(anchor.atMs-row.atMs);
      if(delta<=5000&&delta<nearestDelta){nearest=group;nearestDelta=delta;}
    }
    if(nearest&&[
      "AVAILABILITY_STATE","PLATFORM_SESSION_STARTED","PLATFORM_SESSION_ENDED","PLATFORM_ONLINE_RECONCILED_STARTED",
      "PLATFORM_ONLINE_RECONCILED_ENDED","PLATFORM_ONLINE_RECONCILE_ERROR","OBSERVER_STARTED","OBSERVER_STOPPED",
      "AUTO_ANSWER_BOOTSTRAP_REQUESTED","AUTO_ANSWER_BOOTSTRAP_INJECTED","AUTO_ANSWER_BOOTSTRAP_INJECTION_ERROR",
      "PAGE_LIFECYCLE","PAGE_VISIBILITY_CHANGED","PLATFORM_URL_CHANGED","PLATFORM_SCREENSHOT_CAPTURE_ERROR",
      "PLATFORM_SCREENSHOT_UPLOAD_ERROR","NETWORK_ACTIVITY_WINDOW","PERFORMANCE_HEARTBEAT",
      "PLATFORM_TELEMETRY_RECONCILED","PLATFORM_SURFACE_SNAPSHOT"
    ].includes(row.action)){
      nearest.events.push(row);
      row._group=nearest.attemptId;
    }
  }
  const attempts=Array.from(groups.values()).map(summarizeAttempt).sort((a,b)=>
    (Date.parse(a.detectedAt||"")||0)-(Date.parse(b.detectedAt||"")||0));
  const summary={
    attempts:attempts.length,
    answered:attempts.filter(item=>item.status==="answered").length,
    missed:attempts.filter(item=>item.status==="missed").length,
    connectFailedNoRoute:attempts.filter(item=>item.status==="connect_failed_no_route").length,
    ringUnmatched:attempts.filter(item=>item.status==="ring_unmatched").length,
    unresolved:attempts.filter(item=>!["answered","missed","connect_failed_no_route"].includes(item.status)).length,
    ringSignals:ringRows.length,
    dialogsDetected:rows.filter(item=>item.action==="INCOMING_DIALOG_DETECTED").length,
    buttonsFound:rows.filter(item=>item.action==="CONNECT_BUTTON_FOUND").length,
    buttonsNotFound:rows.filter(item=>item.action==="CONNECT_BUTTON_NOT_FOUND").length,
    readinessSamples:rows.filter(item=>item.action==="AUTO_ANSWER_READINESS").length,
    blocked:rows.filter(item=>item.action==="AUTO_ANSWER_BLOCKED"||item.action==="AUTO_ANSWER_AUTHORIZATION_BLOCKED").length,
    clicks:rows.filter(item=>item.action==="CONNECT_CLICKED").length
  };
  const basisCount=rows.reduce((out,row)=>{out[row.timeBasis]=(out[row.timeBasis]||0)+1;return out;},{});
  const report={
    schema:"signal-interpreter-incoming-call-window/v1",
    generatedAt:new Date(endMs).toISOString(),
    windowStartAt:new Date(startMs).toISOString(),
    windowEndAt:new Date(endMs).toISOString(),
    windowMinutes:duration/60000,
    timeBasis:basisCount,
    sourceBatchCount:new Set(rows.map(row=>row.batchId)).size,
    receiptVerifiedBatchCount:receivedBatches.size,
    receiptUnverifiedBatchCount:unverifiedBatches.size,
    medianClientClockSkewMs:skews.length?skews.sort((a,b)=>a-b)[Math.floor(skews.length/2)]:null,
    eventCount:rows.length,
    summary:summary,
    attempts:attempts,
    privacy:{rawTranscriptIncluded:false,rawAudioIncluded:false,rawDialogTextIncluded:false,fullCallIdIncluded:false,callReferencesHashed:true}
  };
  return report;
}
export function incomingCallWindowMarkdown(report){
  const s=report&&report.summary||{};
  const lines=[
    "# Signal Interpreter — llamadas entrantes, últimos diez minutos","",
    "- Ventana UTC: "+String(report.windowStartAt)+" → "+String(report.windowEndAt),
    "- Generado: "+String(report.generatedAt),
    "- Eventos: "+String(report.eventCount)+" · lotes fuente: "+String(report.sourceBatchCount),
    "- Reloj cliente corregido con recibo relay: "+String(report.timeBasis&&report.timeBasis["relay-receipt-corrected"]||0),
    "- Reloj cliente sin verificación de recibo: "+String(report.timeBasis&&report.timeBasis["client-clock-unverified"]||0),
    "",
    "## Resumen",
    "- Intentos observados: "+String(s.attempts||0),
    "- Contestadas: "+String(s.answered||0)+" · perdidas confirmadas: "+String(s.missed||0),
    "- Clic sin ruta: "+String(s.connectFailedNoRoute||0)+" · timbrados sin diálogo correlacionado: "+String(s.ringUnmatched||0),
    "- Sin desenlace concluyente: "+String(s.unresolved||0),
    "- Detecciones de diálogo/botón: "+String(s.dialogsDetected||0)+" / "+String(s.buttonsFound||0),
    "- Bloqueos de autocontestación: "+String(s.blocked||0)+" · clics: "+String(s.clicks||0),
    "",
    "## Intentos"
  ];
  for(const attempt of report.attempts||[]){
    lines.push("","### "+attempt.attemptId+" — "+attempt.status);
    lines.push("- Detectada: "+String(attempt.detectedAt||"no observada")+" · modalidad: "+String(attempt.modality||"desconocida"));
    lines.push("- Tab: "+String(attempt.tabId==null?"no observado":attempt.tabId)+" · eventos: "+String(attempt.eventCount));
    lines.push("- Botón: "+JSON.stringify(attempt.button)+" · estado readiness: "+JSON.stringify(attempt.readiness.last||null));
    lines.push("- Desenlace/motivo: "+JSON.stringify(attempt.outcomeReason||null));
    lines.push("- Señales ausentes: "+(attempt.missingSignals.length?attempt.missingSignals.join(", "):"ninguna identificada"));
    for(const event of attempt.timeline)lines.push("  - "+String(event.at)+" · "+event.action+" · "+event.level+(event.reasonCode?" · "+event.reasonCode:""));
  }
  lines.push("","## Privacidad","- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.");
  return lines.join("\n")+"\n";
}
