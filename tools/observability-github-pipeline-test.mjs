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
fs.rmSync(root,{recursive:true,force:true});
console.log("OBSERVABILITY_GITHUB_PIPELINE_TEST=PASS");
