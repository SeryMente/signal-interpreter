(function(global){
"use strict";
var ENDPOINT="http://127.0.0.1:8788/v1/observation-batch";
var MAX_BATCH=200;
var EVENT_THRESHOLD=50;
var MIN_GAP_MS=10000;
var timer=null,lastTriggerAt=0,pendingEvents=0,alarmScheduled=false,flushQueue=Promise.resolve();
var PERIODIC_ALARM="signal-observation-sync";
var RETRY_ALARM="signal-observation-sync-retry";

function iso(){return new Date().toISOString()}
function uid(){return crypto.randomUUID()}
function sleep(n){return new Promise(function(r){setTimeout(r,n)})}
function scrub(value,key,depth){
  if(depth>6)return"[MAX_DEPTH]";
  var k=String(key||"");
  if(/text|caption|snapshot|transcript|dialog|utterance|content|html|body/i.test(k))return"[OMITTED]";
  if(/api.?key|authorization|cookie|password|secret|bearer|credential/i.test(k))return"[REDACTED]";
  if(typeof value==="string"){
    return String(value).replace(/Bearers+[A-Za-z0-9._~+/=-]+/gi,"Bearer [REDACTED]").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,}/gi,"[EMAIL]").slice(0,800);
  }
  if(value===null||typeof value!=="object")return value;
  if(Array.isArray(value))return value.slice(0,100).map(function(v){return scrub(v,"",depth+1)});
  var o={};Object.keys(value).slice(0,120).forEach(function(k2){o[k2]=scrub(value[k2],k2,depth+1)});return o;
}
function safeEvent(e){
  var out={
    schema:e.schema||"khora-effectif-event/v4",
    id:e.id||null,sequence:Number(e.sequence)||0,timestamp:e.timestamp||null,ingestedAt:e.ingestedAt||null,
    level:e.level||"info",category:e.category||"RUNTIME",component:e.component||e.source||"background",
    phase:e.phase||"event",action:e.action||"UNKNOWN",outcome:e.outcome||"observed",
    traceId:e.traceId||null,operationId:e.operationId||null,parentEventId:e.parentEventId||null,
    attempt:Number(e.attempt)||1,durationMs:e.durationMs==null?null:Number(e.durationMs),
    session:scrub(e.session||{},"session",0),environment:scrub(e.environment||{},"environment",0),
    expected:scrub(e.expected||null,"expected",0),observed:scrub(e.observed||null,"observed",0),
    reasonCode:e.reasonCode||null,error:scrub(e.error||null,"error",0),
    metrics:scrub(e.metrics||{},"metrics",0),context:scrub(e.context||{},"context",0),
    privacy:scrub(e.privacy||{},"privacy",0)
  };
  if(out.session&&out.session.sourceOrigin){try{out.session.sourceOrigin=new URL(out.session.sourceOrigin).origin}catch(_){}}
  return out;
}
async function getState(){var s=await chrome.storage.local.get(["signalObservationSyncState"]);return Object.assign({ackedSequence:0,pendingCount:0,lastAttemptAt:null,lastSuccessAt:null,lastBatchId:null,consecutiveFailures:0,lastError:null},s.signalObservationSyncState||{})}
async function setState(state){await chrome.storage.local.set({signalObservationSyncState:state})}
function scheduleRetry(delayMs){try{chrome.alarms.create(RETRY_ALARM,{when:Date.now()+Math.max(1000,delayMs)})}catch(_){}}
function mark(){pendingEvents+=1;if(!alarmScheduled){alarmScheduled=true;scheduleRetry(30000)}return{pendingCount:pendingEvents}}
async function collect(){
  var state=await getState();
  var events=KhoraTelemetryDB.getEventsAfter?await KhoraTelemetryDB.getEventsAfter(Number(state.ackedSequence)||0,MAX_BATCH): (await KhoraTelemetryDB.getEvents()).filter(function(e){return Number(e.sequence||0)>Number(state.ackedSequence||0)}).slice(0,MAX_BATCH);
  if(!events.length)return{state:state,events:[]};
  var critical=events.some(function(e){return e.level==="error"||/ERROR|FAILED|TIMEOUT|BLOCKED|REJECTED/i.test(String(e.action||""))});
  var summary={eventsTotal:events.length,errors:events.filter(function(e){return e.level==="error"}).length,warnings:events.filter(function(e){return e.level==="warn"}).length,critical:critical,scopeRejected:events.filter(function(e){return /SCOPE_REJECTED|DOMAIN_MISMATCH|SESSION_MISMATCH/.test(String(e.action||""))}).length,contextEvents:events.filter(function(e){return /CONTEXT/.test(String(e.action||""))}).length,invariantSignals:events.filter(function(e){return /INVARIANT|WITHOUT_VALID_SCOPE|AMBIGUOUS/.test(String(e.action||""))}).length,firstSequence:events[0].sequence,lastSequence:events[events.length-1].sequence,firstTimestamp:events[0].timestamp,lastTimestamp:events[events.length-1].timestamp,actions:{},categories:{}};
  events.forEach(function(e){summary.actions[e.action]=(summary.actions[e.action]||0)+1;summary.categories[e.category||"RUNTIME"]=(summary.categories[e.category||"RUNTIME"]||0)+1});
  return{state:state,events:events.map(safeEvent),summary:summary}
}
async function post(payload){
  var controller=new AbortController(),to=setTimeout(function(){controller.abort()},8000);
  try{
    var response=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","X-Signal-Observation":"v1"},body:JSON.stringify(payload),signal:controller.signal,cache:"no-store"});
    if(!response.ok)throw new Error("HTTP "+response.status);
    return await response.json().catch(function(){return{ok:true}});
  }finally{clearTimeout(to)}
}
async function flushInternal(reason){
  var now=Date.now();if(now-lastTriggerAt<MIN_GAP_MS&&reason!=="manual"&&reason!=="critical"&&reason!=="startup")return{ok:true,skipped:"rate-limited"};
  lastTriggerAt=now;var data=await collect();if(!data.events.length){alarmScheduled=false;pendingEvents=0;try{chrome.alarms.clear(RETRY_ALARM)}catch(_){};return{ok:true,skipped:"clean"}};
  var batchId="batch-"+uid(),payload={schema:"signal-interpreter-observation-batch/v1",batchId:batchId,createdAt:iso(),trigger:reason||"scheduled",extensionVersion:chrome.runtime.getManifest().version,events:data.events,summary:data.summary};
  var state=data.state;state.lastAttemptAt=iso();state.lastBatchId=batchId;state.pendingCount=data.events.length;await setState(state);
  try{
    var r=await post(payload);state.ackedSequence=Math.max(Number(state.ackedSequence)||0,Number(data.summary.lastSequence)||0);alarmScheduled=false;pendingEvents=0;state.pendingCount=0;state.lastSuccessAt=iso();state.consecutiveFailures=0;state.lastError=null;await setState(state);try{chrome.alarms.clear(RETRY_ALARM)}catch(_){};return{ok:true,batchId:batchId,accepted:r.accepted!==false,sequence:state.ackedSequence,summary:data.summary};
  }catch(error){
    state.consecutiveFailures=Number(state.consecutiveFailures||0)+1;state.lastError=String(error);await setState(state);
    var retryMs=Math.min(300000,15000*Math.pow(2,Math.min(4,state.consecutiveFailures-1)));scheduleRetry(retryMs);
    return{ok:false,batchId:batchId,error:String(error),retryMs:retryMs,summary:data.summary}
  }
}
function flush(reason){
  var run=flushQueue.then(function(){return flushInternal(reason)},function(){return flushInternal(reason)});
  flushQueue=run.catch(function(){});
  return run;
}
function noteEvent(event){
  mark();
  var critical=event&&(event.level==="error"||/ERROR|FAILED|TIMEOUT|BLOCKED|REJECTED/i.test(String(event.action||"")));
  if(critical){flush("critical").catch(function(){});return}
  if(pendingEvents>=EVENT_THRESHOLD){flush("event-threshold").catch(function(){});return}
  if(!timer)timer=setTimeout(function(){timer=null;flush("event-window").catch(function(){})},30000);
}
function start(){try{chrome.alarms.create(PERIODIC_ALARM,{delayInMinutes:1,periodInMinutes:1})}catch(_){}}
global.SignalObservationSync={noteEvent:noteEvent,flush:flush,start:start};
})(typeof self!=="undefined"?self:window);
