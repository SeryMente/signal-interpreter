import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {buildObservabilityPackage} from "./observability-github-pipeline.mjs";
import {auditObservabilityPackage} from "./observability-package-audit.mjs";

const root=fs.mkdtempSync(path.join(os.tmpdir(),"signal-call-report-"));
const inbox=path.join(root,"observations","inbox");
fs.mkdirSync(inbox,{recursive:true});
const callId="call-sensitive-fixture-7fa92";
const startedAt="2026-10-10T16:00:00.000Z";
const starAt="2026-10-10T16:06:00.000Z";
const endedAt="2026-10-10T16:06:04.000Z";
function event(id,action,payload,timestamp,level="info",extra={}){
  return Object.assign({
    schema:"khora-effectif-event/v4",id:id,sequence:1,timestamp:timestamp,ingestedAt:timestamp,
    level:level,category:/PERFORMANCE|MEDIA/.test(action)?"RUNTIME":"SESSION",component:"fixture",
    action:action,source:"fixture",phase:"event",outcome:"observed",callId:callId,
    context:{callId:callId},payload:payload
  },extra);
}
function batch(id,createdAt,events){
  return {
    schema:"signal-interpreter-observation-batch/v1",batchId:id,createdAt:createdAt,
    trigger:"call-end-fixture",extensionVersion:"0.10.29",
    summary:{eventsTotal:events.length,errors:events.filter(e=>e.level==="error").length,
      warnings:events.filter(e=>e.level==="warn").length,firstSequence:events[0].sequence,
      lastSequence:events[events.length-1].sequence,categories:{SESSION:events.length},actions:{}},
    events:events.map((item,index)=>Object.assign({},item,{sequence:index+1}))
  };
}
const started=event("start","CALL_ROUTE_ENTERED",{callId:callId,evidence:{urlPattern:true}},startedAt);
const performanceEvent=event("perf","PERFORMANCE_HEARTBEAT",{
  callId:callId,uptimeMs:360000,document:{nodes:1200,online:true,visibility:"visible"},
  connection:{effectiveType:"4g",rttMs:38,downlinkMbps:12},
  memory:{usedBytes:1000,totalBytes:3000,limitBytes:10000},
  performance:{longTasks:2,longestTaskMs:88,longTaskTotalMs:100,layoutShifts:1,layoutShiftScore:0.04},
  resources:{newResources:4,totalDurationMs:720,transferBytes:8800,slowest:[{name:"https://app.cloudinterpreter.com/call/SECRETID",type:"fetch",durationMs:650,transferBytes:4000}]},
  mutations:{batches:3,addedNodes:8,removedNodes:2,attributes:11,textChanges:4},
  transcriptText:"THIS MUST NOT BE COPIED INTO THE REPORT"
}, "2026-10-10T16:01:00.000Z");
const mediaEvent=event("media","MEDIA_HEALTH",{
  callId:callId,mediaElementsFound:2,interpretation:"media-elements-present",
  media:[{index:0,tag:"audio",hasSrcObject:true,muted:false,paused:false,ended:false,tracks:[{kind:"audio"}]}]
},"2026-10-10T16:02:00.000Z");
const snapshot=event("surface","PLATFORM_SURFACE_SNAPSHOT",{
  callId:callId,schema:"signal-interpreter-platform-surface-event/v1",
  platformSurface:{schema:"signal-interpreter-platform-surface/v1",page:{origin:"https://app.cloudinterpreter.com",route:"/call/<ID>/rate",path:"/call/<ID>/rate",searchKeys:[]},controls:{buttons:[],links:[],fields:[],headings:[]},dom:{tagCounts:{body:1},elements:[]},css:{stylesheets:[]},javascript:{scripts:[]},resources:{recent:[]}}
},"2026-10-10T16:05:00.000Z");
const overlayContext=event("overlay-context","LIVE_CAPTION_OVERLAY_CONTEXT_APPLIED",{
  callId:callId,component:"live-caption-overlay",enabled:true,scope:"source-only",
  contextReady:true,pageAllowed:true,callActive:true,sourceTabMatched:true,sourceTabKnown:true,
  routeFallbackApplied:true,contextSyncAttempts:2,contextSyncFailures:1,historyRows:0
},"2026-10-10T16:00:00.250Z");
const overlayMounted=event("overlay-mounted","LIVE_CAPTION_OVERLAY_HOST_MOUNTED",{
  callId:callId,component:"live-caption-overlay",hostConnected:true,shadowRootReady:true,
  display:"block",rowCount:0,width:560,height:400
},"2026-10-10T16:00:00.500Z");
const overlayVisible=event("overlay-visible","LIVE_CAPTION_OVERLAY_VISIBILITY_CHANGED",{
  callId:callId,component:"live-caption-overlay",visible:true,hostConnected:true,
  contextReady:true,pageAllowed:true,callActive:true,sourceTabMatched:true,rowCount:0,display:"block"
},"2026-10-10T16:00:00.600Z");
const earningsOverlayVisible=event("earnings-overlay-visible","EARNINGS_OVERLAY_VISIBLE",{
  callId:callId,component:"earnings-overlay",visible:true,hostConnected:true,shadowRootReady:true,
  reasonCode:"render-confirmed",hostWidth:296,hostHeight:200,independentOfObserver:true
},"2026-10-10T16:00:00.700Z");
fs.writeFileSync(path.join(inbox,"start.json"),JSON.stringify(batch("start",startedAt,
  [started,performanceEvent,mediaEvent,overlayContext,overlayMounted,overlayVisible,earningsOverlayVisible,snapshot])));

const partial=buildObservabilityPackage(root);
assert.equal(partial.callReports.reportCount,0,"no per-call report should be made without a terminal trigger");

const rating=event("rating","CALL_RATING_STARS_CONFIRMED",{
  schema:"signal-interpreter-call-rating-confirmation/v1",callId:callId,confirmedAt:starAt,
  ratingPromptVisible:true,ratingValueObserved:false,ratingSubmissionObserved:false,
  evidence:{schema:"signal-interpreter-rating-star-evidence/v1",routeMatched:true,starsVisible:true,method:"accessible-label-or-test-id",candidateCount:5,namedStarCandidateCount:5,starLikeCandidateCount:5,visibleButtonCount:6,visibleRadioCount:0}
},starAt);
fs.writeFileSync(path.join(inbox,"rating.json"),JSON.stringify(batch("rating",starAt,[rating])));
const starOnly=buildObservabilityPackage(root);
assert.equal(starOnly.callReports.reportCount,1);
assert.equal(starOnly.callReports.partialCount,1,"star visibility creates a partial report until the final checkpoint arrives");
assert.equal(starOnly.latestCallReport.status,"partial");
assert.equal(starOnly.latestCallReport.endConfirmation.ratingStarsVisible,true);

const stop=event("stop","CALL_TIMER_STOPPED",{
  callId:callId,startedAt:startedAt,endedAt:endedAt,modality:"OPI",status:"completed",
  observedSeconds:364,platformSeconds:360,billableSecondsAssumed:360,ratePerMinute:0.2,
  estimatedRevenue:1.2,countedInEarnings:true,currency:"USD",billingRule:"pro_rata_by_second_assumed",endSource:"rating-route",
  runtimeVersion:"0.10.28"
},endedAt);
const checkpoint=event("checkpoint","CALL_OBSERVABILITY_CHECKPOINT",{
  schema:"signal-interpreter-call-checkpoint/v1",checkpoint:"call-ended",callId:callId,checkpointReason:"call-ended",
  callState:"closed",finalCall:{callId:callId,startedAt:startedAt,endedAt:endedAt,modality:"OPI",status:"completed",observedSeconds:364,platformSeconds:360,billableSecondsAssumed:360,ratePerMinute:0.2,estimatedRevenue:1.2,countedInEarnings:true,currency:"USD",billingRule:"pro_rata_by_second_assumed",endSource:"rating-route",runtimeVersion:"0.10.28"}
},endedAt);
const warning=event("warning","GROQ_TRANSCRIPTION_TIMEOUT",{callId:callId,reasonCode:"groq-timeout",transcriptText:"SENSITIVE UTTERANCE NOT FOR REPORT"}, "2026-10-10T16:03:00.000Z","warn");
fs.writeFileSync(path.join(inbox,"end.json"),JSON.stringify(batch("end",endedAt,[warning,stop,checkpoint])));

const built=buildObservabilityPackage(root);
assert.equal(built.callReports.reportCount,1);
assert.equal(built.callReports.completedCount,1);
assert.equal(built.latestCallReport.schema,"signal-interpreter-call-report/v1");
assert.equal(built.latestCallReport.status,"complete");
assert.equal(built.latestCallReport.call.duration.observedSeconds,364);
assert.equal(built.latestCallReport.call.duration.platformSeconds,360);
assert.equal(built.latestCallReport.call.earnings.estimatedRevenue,1.2);
assert.equal(built.latestCallReport.endConfirmation.ratingStarsVisible,true);
assert.equal(built.latestCallReport.endConfirmation.ratingValueObserved,false);
assert.equal(built.latestCallReport.endConfirmation.ratingSubmissionObserved,false);
assert.equal(built.latestCallReport.telemetry.performance.samples,1);
assert.equal(built.latestCallReport.telemetry.performance.latest.connection.effectiveType,"4g");
assert.equal(built.latestCallReport.telemetry.media.samples,1);
assert.equal(built.latestCallReport.telemetry.errors,0);
assert.equal(built.latestCallReport.telemetry.warnings,1);
assert.equal(built.latestCallReport.completeness.missingSignals.length,0,"complete fixture must contain all modeled lifecycle evidence");
assert.ok(built.latestCallReport.telemetry.eventTimeline.some(e=>e.action==="CALL_RATING_STARS_CONFIRMED"),"ordered diagnostic timeline must expose the star confirmation");
assert.ok(built.latestCallReport.telemetry.keySignals.some(e=>e.action==="CALL_TIMER_STOPPED"&&e.modality==="OPI"),"whitelisted key signals include call modality and timing close");
assert.ok(built.latestCallReport.telemetry.keySignals.some(e=>e.action==="LIVE_CAPTION_OVERLAY_HOST_MOUNTED"&&e.hostConnected===true&&e.shadowRootReady===true),
  "per-call key signals preserve proof the live caption panel mounted");
assert.ok(built.latestCallReport.telemetry.keySignals.some(e=>e.action==="LIVE_CAPTION_OVERLAY_VISIBILITY_CHANGED"&&e.visible===true),
  "per-call key signals distinguish panel visibility from text recognition");
assert.ok(built.latestCallReport.telemetry.keySignals.some(e=>e.action==="EARNINGS_OVERLAY_VISIBLE"&&e.independentOfObserver===true),
  "per-call key signals include earnings overlay health");
assert.ok(built.latestCallReport.telemetry.featureSignals.overlayActivation>=4,
  "all overlay lifecycle signals get their own feature group in reports");
assert.ok(built.latestCallReport.telemetry.errorTimeline.some(e=>e.reasonCode==="groq-timeout"));
assert.equal(built.manifest.calls.reportCount,1);
assert.equal(built.health.callReportCheckpointObserved,true);
const audited=auditObservabilityPackage(path.join(root,"observations"));
assert.equal(audited.callReportCount,1);
assert.equal(audited.callReportCompleteCount,1);
assert.equal(fs.existsSync(path.join(root,"observations","latest","latest-call-report.json")),true);
assert.equal(fs.existsSync(path.join(root,"observations","latest","latest-call-report.md")),true);
const reportPath=path.join(root,"observations",built.callReports.latestReportPath);
assert.equal(fs.existsSync(reportPath),true);
const serialized=fs.readFileSync(reportPath,"utf8");
assert.equal(serialized.includes(callId),false,"raw platform call ID must not be persisted in report");
assert.equal(serialized.includes("THIS MUST NOT BE COPIED"),false,"transcription text must never reach the report");
assert.equal(serialized.includes("SENSITIVE UTTERANCE"),false,"raw utterance must not reach the report");
assert.equal(serialized.includes("SECRETID"),false,"resource URL IDs must be normalized");

const ordinary=event("ordinary","PERFORMANCE_HEARTBEAT",{callId:callId,uptimeMs:400000},"2026-10-10T16:07:00.000Z");
fs.writeFileSync(path.join(inbox,"ordinary.json"),JSON.stringify(batch("ordinary","2026-10-10T16:07:00.000Z",[ordinary])));
const afterOrdinary=buildObservabilityPackage(root);
assert.equal(afterOrdinary.callReports.reportCount,1,"ordinary telemetry must not create duplicate call reports");
assert.equal(afterOrdinary.latestCallReport.callRef,built.latestCallReport.callRef);
fs.rmSync(root,{recursive:true,force:true});
console.log("CALL_OBSERVABILITY_REPORT_TEST=PASS");
