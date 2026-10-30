import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {buildObservabilityPackage,normalizePlatformSnapshot} from "./observability-github-pipeline.mjs";

const root=fs.mkdtempSync(path.join(os.tmpdir(),"signal-github-observability-"));
const inbox=path.join(root,"observations","inbox");
fs.mkdirSync(inbox,{recursive:true});
const baseSurface={
  schema:"signal-interpreter-platform-surface/v1",
  page:{origin:"https://app.cloudinterpreter.com",route:"/profile/<ID>",path:"https://app.cloudinterpreter.com/profile/<ID>",searchKeys:[],title:"Profile",nodeCount:3},
  controls:{buttons:[],links:[],fields:[],headings:[]},
  dom:{tagCounts:{body:1},elements:[]},
  css:{stylesheets:[],inlineStyleCount:0,styleElementCount:0},
  javascript:{scripts:[],scriptCount:0},
  resources:{totalObserved:0,recent:[],uniqueRecent:0},
  metadata:[],frameworkHints:[],
  privacy:{rawTextStored:false,rawHtmlStored:false,rawCssStored:false,rawJavascriptStored:false,rawAudioStored:false}
};
function batch(id,trigger="event-window",surface=baseSurface){
  return{
    schema:"signal-interpreter-observation-batch/v1",
    batchId:id,createdAt:"2026-10-07T20:00:00.000Z",trigger,extensionVersion:"0.10.0",
    summary:{eventsTotal:1,errors:0,warnings:0,firstSequence:1,lastSequence:1,categories:{PORTAL:1},actions:{PLATFORM_SURFACE_SNAPSHOT:1}},
    events:[{
      schema:"khora-effectif-event/v4",id:"event-"+id,sequence:1,timestamp:"2026-10-07T20:00:00.000Z",
      level:"info",category:"PORTAL",action:"PLATFORM_SURFACE_SNAPSHOT",url:"https://app.cloudinterpreter.com/profile/<ID>",
      payload:{schema:"signal-interpreter-platform-surface-event/v1",platformSurface:surface}
    }]
  };
}
const b1=batch("b1");
const normalized=normalizePlatformSnapshot(b1.events[0],b1);
assert.ok(normalized.identityKey.startsWith("https://app.cloudinterpreter.com|/profile/<ID>|"));
fs.writeFileSync(path.join(inbox,"b1.json"),JSON.stringify(b1));
const first=buildObservabilityPackage(root);
assert.equal(first.health.processedInbox,1);
assert.equal(first.manifest.lastBatchId,"b1");
assert.equal(first.index.identityCount,1);
assert.equal(first.index.observations,1);
assert.equal(first.index.deltas,1);
assert.equal(first.health.lastAutomaticPublishAt,"2026-10-07T20:00:00.000Z");
assert.equal(first.health.lastAutomaticBatchId,"b1");
assert.equal(first.health.lastManualPublishAt,null);
assert.equal(fs.existsSync(path.join(inbox,"b1.json")),false);

const self=batch("self-test","observability-self-test");
fs.writeFileSync(path.join(inbox,"self.json"),JSON.stringify(self));
const second=buildObservabilityPackage(root);
assert.equal(second.manifest.lastBatchId,"b1");
assert.equal(second.health.processedInbox,1);
assert.equal(fs.existsSync(path.join(root,"observations","latest","latest.json")),true);
assert.equal(JSON.parse(fs.readFileSync(path.join(root,"observations","latest","latest.json"),"utf8")).batchId,"b1");

const changed=JSON.parse(JSON.stringify(baseSurface));
changed.controls.buttons.push({tag:"button",role:"button",label:"End call",disabled:false});
const b2=batch("b2","event-window",changed);
b2.createdAt="2026-10-07T20:01:00.000Z";b2.events[0].timestamp=b2.createdAt;b2.events[0].id="event-b2";
fs.writeFileSync(path.join(inbox,"b2.json"),JSON.stringify(b2));
const third=buildObservabilityPackage(root);
assert.equal(third.manifest.lastBatchId,"b2");
assert.equal(third.index.identityCount,1);
assert.ok(third.index.observations>=2);
assert.ok(third.index.deltas>=2);
assert.equal(third.health.lastAutomaticPublishAt,"2026-10-07T20:01:00.000Z");

const manual=batch("manual-1","manual");
manual.createdAt="2026-10-07T20:02:00.000Z";manual.events[0].timestamp=manual.createdAt;manual.events[0].id="event-manual-1";
fs.writeFileSync(path.join(inbox,"manual-1.json"),JSON.stringify(manual));
const fourth=buildObservabilityPackage(root);
assert.equal(fourth.health.lastAutomaticPublishAt,"2026-10-07T20:01:00.000Z");
assert.equal(fourth.health.lastManualPublishAt,"2026-10-07T20:02:00.000Z");
assert.equal(fourth.health.lastManualBatchId,"manual-1");
\
const incomingNow=Date.now()-1500;
const incomingEvent=(action,offset,payload,level="info")=>({
  schema:"khora-effectif-event/v4",id:"incoming-"+action+"-"+offset,
  sequence:100+offset,timestamp:new Date(incomingNow+offset).toISOString(),
  level:level,category:"RUNTIME",component:"content",action,
  tabId:42,ingestDelayMs:12,
  payload:payload
});
const incomingBatch=batch("incoming-window");
incomingBatch.createdAt=new Date(incomingNow+450).toISOString();
incomingBatch.trigger="call-event";
incomingBatch.extensionVersion="0.10.39";
incomingBatch.events=[
  incomingEvent("INCOMING_RING_SIGNAL",0,{ringSignalId:"ring-confirmed",tabId:42,statusCode:206,durationMs:45,signal:"ring.mp3"}),
  incomingEvent("INCOMING_DIALOG_DETECTED",80,{incomingAttemptId:"attempt-missed-1",ringSignalId:"ring-confirmed",modality:"OPI",connectFound:true,connectDisabled:false}),
  incomingEvent("CONNECT_BUTTON_FOUND",110,{incomingAttemptId:"attempt-missed-1",ringSignalId:"ring-confirmed",modality:"OPI",disabled:false,label:"Connect"}),
  incomingEvent("AUTO_ANSWER_BLOCKED",140,{incomingAttemptId:"attempt-missed-1",ringSignalId:"ring-confirmed",modality:"OPI",decision:"no-click",blockReasons:["PRESENCE_NOT_ARMED:worker-start-confirm-again"]},"warn"),
  incomingEvent("MISSED_CALL_CLASSIFIED",320,{id:"attempt-missed-1",incomingAttemptId:"attempt-missed-1",ringSignalId:"ring-confirmed",detectedAt:new Date(incomingNow+80).toISOString(),classifiedAt:new Date(incomingNow+320).toISOString(),modality:"OPI",status:"missed",reason:"dialog_closed_without_connect"},"warn"),
  incomingEvent("INCOMING_RING_SIGNAL",400,{ringSignalId:"ring-unlinked",tabId:42,statusCode:206,durationMs:38,signal:"ring.mp3"})
];
incomingBatch.summary={eventsTotal:incomingBatch.events.length,errors:0,warnings:2,firstSequence:100,lastSequence:500,categories:{RUNTIME:incomingBatch.events.length},actions:{}};
for(const item of incomingBatch.events)incomingBatch.summary.actions[item.action]=(incomingBatch.summary.actions[item.action]||0)+1;
fs.writeFileSync(path.join(inbox,"incoming-window.json"),JSON.stringify(incomingBatch));
const fifth=buildObservabilityPackage(root);
const incomingReport=fifth.incomingCallWindowReport;
assert.ok(incomingReport,"rolling incoming-call report is returned");
assert.equal(incomingReport.summary.ringSignals,2);
assert.equal(incomingReport.summary.missed,1,"only explicit MISSED_CALL_CLASSIFIED is counted as missed");
assert.equal(incomingReport.summary.unresolved,1,"unlinked ring signal remains unresolved, not a missed call");
assert.equal(incomingReport.attempts.length,2);
const missedAttempt=incomingReport.attempts.find(item=>item.incomingAttemptId==="attempt-missed-1");
assert.equal(missedAttempt.outcome,"missed");
assert(missedAttempt.ringSignalIds.includes("ring-confirmed"),"ring and dialog are correlated");
assert(missedAttempt.events.some(item=>item.action==="AUTO_ANSWER_BLOCKED"&&item.details.blockReasons[0].startsWith("PRESENCE_NOT_ARMED")));
assert.ok(incomingReport.freshness.maxEventToBatchCreatedMs>=0);
assert.ok(incomingReport.freshness.maxBatchCreatedToProcessingMs>=0);
assert.ok(incomingReport.freshness.maxEventToProcessingMs>=incomingReport.freshness.maxEventToBatchCreatedMs);
assert.ok(incomingReport.freshness.latestBatchProcessedAt,"pipeline records the first processing timestamp");
assert.ok(JSON.parse(fs.readFileSync(path.join(root,"observations","batches","incoming-window.json"),"utf8")).pipelineProcessedAt,"archive persists processing time once");
assert.equal(fifth.health.incomingCallWindowMissed,1);
assert.equal(fifth.manifest.incomingCalls.unresolved,1);
assert.equal(fs.existsSync(path.join(root,"observations","latest","latest-incoming-call-report.json")),true);
assert.equal(fs.existsSync(path.join(root,"observations","latest","latest-incoming-call-report.md")),true);
fs.rmSync(root,{recursive:true,force:true});
console.log("OBSERVABILITY_GITHUB_PIPELINE_TEST=PASS");
