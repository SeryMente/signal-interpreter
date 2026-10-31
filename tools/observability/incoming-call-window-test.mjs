import assert from "node:assert/strict";
import {buildIncomingCallWindow,incomingCallWindowMarkdown} from "./incoming-call-window.mjs";

const generatedAt="2026-10-30T22:10:00.000Z";
const attemptAnswered="incoming-attempt-answered-fixture";
const attemptMissed="incoming-attempt-missed-fixture";
const secretCallId="platform-call-secret-938475";
function event(id,action,attemptId,timestamp,payload={},level="info",extra={}){
  return Object.assign({
    id:id,sequence:1,timestamp:timestamp,ingestedAt:timestamp,action:action,level:level,
    tabId:42,session:{callId:payload.callId||null},context:{sourceTabId:42},
    payload:Object.assign({attemptId:attemptId},payload)
  },extra);
}
const events=[
  event("a1","INCOMING_DIALOG_DETECTED",attemptAnswered,"2026-10-30T22:09:10.000Z",{modality:"OPI",connectFound:true}),
  event("a2","CONNECT_BUTTON_FOUND",attemptAnswered,"2026-10-30T22:09:10.050Z",{modality:"OPI",disabled:false}),
  event("a3","AUTO_ANSWER_READINESS",attemptAnswered,"2026-10-30T22:09:10.060Z",{ready:true,availability:"online",authorizedProfile:true,configEnabled:true,presenceArmed:true}),
  event("a4","AUTO_ANSWER_ELIGIBLE",attemptAnswered,"2026-10-30T22:09:10.070Z",{modality:"OPI",decision:"click-connect"}),
  event("a5","CONNECT_CLICKED",attemptAnswered,"2026-10-30T22:09:10.080Z",{modality:"OPI",flowId:"flow-fixture"}),
  event("a6","ANSWER_FLOW_ROUTE_CONFIRMED",attemptAnswered,"2026-10-30T22:09:10.300Z",{callId:secretCallId,modality:"OPI"}),
  event("a7","INCOMING_ATTEMPT_ANSWERED",attemptAnswered,"2026-10-30T22:09:10.310Z",{callId:secretCallId,routeConfirmation:"auto-answer-flow-confirmed"}),
  event("m1","INCOMING_DIALOG_DETECTED",attemptMissed,"2026-10-30T22:05:00.000Z",{modality:"OPI",connectFound:true}),
  event("m2","CONNECT_BUTTON_FOUND",attemptMissed,"2026-10-30T22:05:00.050Z",{modality:"OPI",disabled:false}),
  event("m3","AUTO_ANSWER_READINESS",attemptMissed,"2026-10-30T22:05:00.100Z",{ready:false,availability:"online",authorizedProfile:true,configEnabled:true,presenceArmed:false,presenceReason:"worker-start-confirm-again"}),
  event("m4","AUTO_ANSWER_BLOCKED",attemptMissed,"2026-10-30T22:05:00.110Z",{blockedReasons:["WORKER_START_CONFIRM_AGAIN"]},"warn"),
  event("m5","INCOMING_DIALOG_CLOSED",attemptMissed,"2026-10-30T22:05:12.000Z",{reason:"dialog-removed"}),
  event("m6","MISSED_CALL_CLASSIFIED",attemptMissed,"2026-10-30T22:05:14.500Z",{status:"missed",reason:"dialog_closed_without_connect"},"warn"),
  event("r1","INCOMING_RING_SIGNAL",null,"2026-10-30T22:03:00.000Z",{tabId:99,signal:"ring.mp3",statusCode:206},"info",{tabId:99})
];
const batch={
  schema:"signal-interpreter-observation-batch/v1",batchId:"batch-fixture",createdAt:"2026-10-30T22:09:20.000Z",
  relayReceivedAt:"2026-10-30T22:09:21.000Z",extensionVersion:"0.10.39",events
};
const report=buildIncomingCallWindow([batch],generatedAt,10);
assert.equal(report.summary.attempts,3);
assert.equal(report.summary.answered,1);
assert.equal(report.summary.missed,1);
assert.equal(report.summary.ringUnmatched,1);
assert.equal(report.summary.blocked,1);
assert.equal(report.receiptVerifiedBatchCount,1);
assert.equal(report.timeBasis["relay-receipt-corrected"],events.length);
const answered=report.attempts.find(x=>x.attemptId===attemptAnswered);
const missed=report.attempts.find(x=>x.attemptId===attemptMissed);
const unmatched=report.attempts.find(x=>x.status==="ring_unmatched");
assert.equal(answered.status,"answered");
assert.equal(answered.detectionToAnswerLatencyMs,300);
assert.equal(missed.status,"missed");
assert.equal(missed.readiness.last.presenceArmed,false);
assert.ok(missed.missingSignals.includes("TERMINAL_CALL_OUTCOME")===false);
assert.equal(unmatched.status,"ring_unmatched");
const serialized=JSON.stringify(report);
assert.equal(serialized.includes(secretCallId),false);
assert.equal(serialized.includes("platform-call-secret"),false);
assert.equal(report.privacy.fullCallIdIncluded,false);
assert.ok(incomingCallWindowMarkdown(report).includes("perdidas confirmadas"));
console.log("INCOMING_CALL_WINDOW_TEST=PASS",JSON.stringify(report.summary));
