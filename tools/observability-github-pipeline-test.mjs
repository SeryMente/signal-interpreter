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

const nowMs=Date.now();
const createdAt=new Date(nowMs-3000).toISOString();
const relayReceivedAt=new Date(nowMs-2000).toISOString();
const attemptId="incoming-attempt-pipeline-fixture";
const incoming=batch("incoming-window","call-lifecycle");
incoming.createdAt=createdAt;
incoming.relayReceivedAt=relayReceivedAt;
incoming.extensionVersion="0.10.39";
incoming.events=[
  {schema:"khora-effectif-event/v4",id:"incoming-detected",sequence:10,timestamp:new Date(nowMs-9000).toISOString(),tabId:77,action:"INCOMING_DIALOG_DETECTED",level:"info",payload:{attemptId,modality:"OPI",connectFound:true}},
  {schema:"khora-effectif-event/v4",id:"incoming-blocked",sequence:11,timestamp:new Date(nowMs-8900).toISOString(),tabId:77,action:"AUTO_ANSWER_BLOCKED",level:"warn",payload:{attemptId,blockedReasons:["WORKER_START_CONFIRM_AGAIN"]}},
  {schema:"khora-effectif-event/v4",id:"incoming-closed",sequence:12,timestamp:new Date(nowMs-5000).toISOString(),tabId:77,action:"INCOMING_DIALOG_CLOSED",level:"info",payload:{attemptId,reason:"dialog-removed"}},
  {schema:"khora-effectif-event/v4",id:"incoming-missed",sequence:13,timestamp:new Date(nowMs-2500).toISOString(),tabId:77,action:"MISSED_CALL_CLASSIFIED",level:"warn",payload:{attemptId,status:"missed",reason:"dialog_closed_without_connect"}}
];
incoming.summary={eventsTotal:4,errors:0,warnings:2,firstSequence:10,lastSequence:13,categories:{SESSION:4},actions:{INCOMING_DIALOG_DETECTED:1,AUTO_ANSWER_BLOCKED:1,INCOMING_DIALOG_CLOSED:1,MISSED_CALL_CLASSIFIED:1}};
fs.writeFileSync(path.join(inbox,"incoming-window.json"),JSON.stringify(incoming));
const fifth=buildObservabilityPackage(root);
assert.equal(fifth.health.freshness.status,"fresh");
assert.equal(fifth.health.status,"ok");
assert.equal(fifth.health.incomingCallWindow.missed,1);
const incomingReport=JSON.parse(fs.readFileSync(path.join(root,"observations","latest","incoming-calls-10m.json"),"utf8"));
assert.equal(incomingReport.schema,"signal-interpreter-incoming-call-window/v1");
assert.equal(incomingReport.summary.missed,1);
assert.equal(incomingReport.attempts[0].status,"missed");
assert.equal(fs.existsSync(path.join(root,"observations","latest","incoming-calls-10m.md")),true);
fs.rmSync(root,{recursive:true,force:true});
console.log("OBSERVABILITY_GITHUB_PIPELINE_TEST=PASS");
