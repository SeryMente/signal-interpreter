import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {buildIncomingCallWindowReport} from "./incoming-call-window-report.mjs";

const root=fs.mkdtempSync(path.join(os.tmpdir(),"signal-incoming-call-window-"));
const batches=path.join(root,"batches");
fs.mkdirSync(batches,{recursive:true});
function event(action,at,payload={},id){
  return{
    id:id||"event-"+action+"-"+at,
    sequence:1,
    timestamp:at,
    ingestedAt:new Date(Date.parse(at)+5).toISOString(),
    level:action.includes("BLOCKED")||action.includes("MISSED")?"warn":"info",
    component:"test",
    action,
    payload
  };
}
function writeBatch(batchId,events,createdAt){
  const batch={
    schema:"signal-interpreter-observation-batch/v1",
    batchId,
    createdAt:createdAt||events[events.length-1].timestamp,
    trigger:"call-lifecycle",
    extensionVersion:"0.10.39",
    summary:{eventsTotal:events.length,errors:0,warnings:0},
    events:events.map((value,index)=>Object.assign({},value,{sequence:index+1}))
  };
  fs.writeFileSync(path.join(batches,batchId+".json"),JSON.stringify(batch));
}
const a="attempt-private-A";
const b="attempt-private-B";
writeBatch("batch-a1",[
  event("INCOMING_RING_REQUEST_STARTED","2026-10-30T16:59:59.000Z",{incomingAttemptId:a,signal:"ring.mp3"}),
  event("INCOMING_RING_SIGNAL","2026-10-30T17:00:00.000Z",{incomingAttemptId:a,statusCode:206,signal:"ring.mp3"}),
  event("INCOMING_DIALOG_DETECTED","2026-10-30T17:00:02.000Z",{incomingAttemptId:a,modality:"OPI",connectFound:true,connectDisabled:false}),
  event("AUTO_ANSWER_BLOCKED","2026-10-30T17:00:03.000Z",{incomingAttemptId:a,blockers:["presence-not-armed:worker-start-confirm-again"],presenceArmed:false}),
  event("INCOMING_DIALOG_CLOSED","2026-10-30T17:00:11.000Z",{incomingAttemptId:a,reason:"dialog-removed"}),
  event("MISSED_CALL_CLASSIFIED","2026-10-30T17:00:12.000Z",{incomingAttemptId:a,id:a,status:"missed",reason:"dialog_closed_without_connect"})
],"2026-10-30T17:00:13.000Z");
writeBatch("batch-b1",[
  event("INCOMING_RING_REQUEST_STARTED","2026-10-30T17:04:00.000Z",{incomingAttemptId:b}),
  event("INCOMING_RING_SIGNAL","2026-10-30T17:04:00.100Z",{incomingAttemptId:b,statusCode:206}),
  event("INCOMING_DIALOG_DETECTED","2026-10-30T17:04:01.000Z",{incomingAttemptId:b,modality:"OPI",connectFound:true}),
  event("CONNECT_BUTTON_FOUND","2026-10-30T17:04:01.050Z",{incomingAttemptId:b,disabled:false}),
  event("AUTO_ANSWER_ELIGIBLE","2026-10-30T17:04:01.100Z",{incomingAttemptId:b,modality:"OPI"}),
  event("CONNECT_CLICKED","2026-10-30T17:04:01.200Z",{incomingAttemptId:b,modality:"OPI"}),
  event("ANSWER_FLOW_ROUTE_CONFIRMED","2026-10-30T17:04:05.000Z",{incomingAttemptId:b,modality:"OPI"})
],"2026-10-30T17:04:05.500Z");
writeBatch("batch-legacy",[
  event("INCOMING_DIALOG_CLOSED_OBSERVED","2026-10-30T17:06:00.000Z",{pendingId:"legacy-1",reason:"dialog-removed"}),
  event("MISSED_CALL_CLASSIFIED","2026-10-30T17:06:02.000Z",{id:"legacy-1",status:"missed",reason:"dialog_timeout"})
],"2026-10-30T17:06:02.500Z");
writeBatch("batch-unlinked",[
  event("INCOMING_RING_SIGNAL","2026-10-30T17:07:00.000Z",{statusCode:206,signal:"ring.mp3"})
],"2026-10-30T17:07:00.100Z");
writeBatch("batch-heartbeat",[
  event("PERFORMANCE_HEARTBEAT","2026-10-30T17:09:59.000Z",{uptimeMs:1234})
],"2026-10-30T17:10:00.000Z");

const generatedAt="2026-10-30T17:10:00.000Z";
const report=buildIncomingCallWindowReport(root,generatedAt);
assert.equal(report.schema,"signal-interpreter-incoming-call-window/v1");
assert.equal(report.freshness,"fresh");
assert.equal(report.window.durationSeconds,600);
assert.equal(report.coverage.eventsInWindow,16);
assert.equal(report.attempts.total,4);
assert.equal(report.attempts.correlated,3);
assert.equal(report.attempts.unlinked,1);
assert.equal(report.attempts.answered,1);
assert.equal(report.attempts.missed,2);
assert.equal(report.attempts.unresolved,1);
assert.equal(report.coverage.noAttemptsObservedUnderFreshTelemetry,false);
const missed=report.items.find(item=>item.outcome==="missed"&&item.correlation==="correlated");
assert(missed,"correlated missed call must be reported");
assert(missed.stages.ringObserved&&missed.stages.dialogDetected&&missed.stages.autoAnswerBlocked&&missed.stages.missedClassified);
assert(missed.blockers.includes("presence-not-armed:worker-start-confirm-again"));
assert.equal(missed.firstObservedAt,"2026-10-30T16:59:59.000Z","an event just before the window is retained when its attempt has events inside the window");
const answered=report.items.find(item=>item.outcome==="answered");
assert(answered&&answered.stages.connectClicked&&answered.stages.answerConfirmed);
assert.equal(answered.timing.ringToDialogMs,1000);
const serialized=JSON.stringify(report);
assert(!/"incomingAttemptId"|"callId"|"dialogText"|"rawTranscript"|"rawAudio"/i.test(serialized),"report must not publish platform IDs or raw conversation payloads");
checks=0;
checks+=17;

const stale=buildIncomingCallWindowReport(root,"2026-10-30T17:20:00.000Z");
assert.equal(stale.freshness,"stale");
assert.equal(stale.coverage.noAttemptsObservedUnderFreshTelemetry,false);
checks+=2;

const emptyRoot=fs.mkdtempSync(path.join(os.tmpdir(),"signal-incoming-empty-"));
const empty=buildIncomingCallWindowReport(emptyRoot,"2026-10-30T17:10:00.000Z");
assert.equal(empty.freshness,"no-data");
assert.equal(empty.attempts.total,0);
assert.equal(empty.coverage.noAttemptsObservedUnderFreshTelemetry,false);
checks+=3;

const quietRoot=fs.mkdtempSync(path.join(os.tmpdir(),"signal-incoming-quiet-"));
fs.mkdirSync(path.join(quietRoot,"batches"),{recursive:true});
writeBatchForRoot(path.join(quietRoot,"batches"),"heartbeat-only",[
  event("PERFORMANCE_HEARTBEAT","2026-10-30T17:09:59.000Z",{uptimeMs:2000})
],"2026-10-30T17:10:00.000Z");
const quiet=buildIncomingCallWindowReport(quietRoot,"2026-10-30T17:10:00.000Z");
assert.equal(quiet.freshness,"fresh");
assert.equal(quiet.attempts.total,0);
assert.equal(quiet.coverage.noAttemptsObservedUnderFreshTelemetry,true);
checks+=3;

fs.rmSync(root,{recursive:true,force:true});
fs.rmSync(emptyRoot,{recursive:true,force:true});
fs.rmSync(quietRoot,{recursive:true,force:true});
console.log("INCOMING_CALL_WINDOW_TEST=PASS",JSON.stringify({checks,result:"PASS",freshness:report.freshness,attempts:report.attempts}));
function writeBatchForRoot(dir,batchId,events,createdAt){
  const batch={schema:"signal-interpreter-observation-batch/v1",batchId,createdAt,trigger:"call-lifecycle",extensionVersion:"0.10.39",events};
  fs.writeFileSync(path.join(dir,batchId+".json"),JSON.stringify(batch));
}
