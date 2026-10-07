import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {auditObservabilityPackage} from "./observability-package-audit.mjs";

const root=fs.mkdtempSync(path.join(os.tmpdir(),"signal-observability-package-test-"));
const obs=path.join(root,"observations");
const snap="platform-snapshots/2026-10-07/profile--abc.json";
const delta="platform-deltas/2026-10-07/profile--def.json";
fs.mkdirSync(path.join(obs,"platform-snapshots/2026-10-07"),{recursive:true});
fs.mkdirSync(path.join(obs,"platform-deltas/2026-10-07"),{recursive:true});
const identity="https://app.cloudinterpreter.com|/profile/<ID>|";
const surface={
  schema:"signal-interpreter-platform-surface/v1",
  page:{origin:"https://app.cloudinterpreter.com",route:"/profile/<ID>",path:"https://app.cloudinterpreter.com/profile/<ID>",searchKeys:[],title:"Test",nodeCount:1},
  controls:{buttons:[],links:[],fields:[],headings:[]},
  dom:{tagCounts:{body:1},elements:[]},
  css:{stylesheets:[],inlineStyleCount:0,styleElementCount:0},
  javascript:{scripts:[],scriptCount:0},
  resources:{totalObserved:0,recent:[],uniqueRecent:0},
  metadata:[],frameworkHints:[],
  privacy:{rawTextStored:false,rawHtmlStored:false,rawCssStored:false,rawJavascriptStored:false,rawAudioStored:false}
};
const snapshot={schema:"signal-interpreter-platform-observation/v1",snapshotId:"snap-1",batchId:"batch-1",eventId:"event-1",sequence:1,tabId:1,capturedAt:"2026-10-07T15:00:00.000Z",identityKey:identity,snapshotHash:"hash-1",route:"/profile/<ID>",url:"https://app.cloudinterpreter.com/profile/<ID>",surface};
const deltaObj={schema:"signal-interpreter-platform-delta/v1",type:"initial",identityKey:identity,fromSnapshotId:null,toSnapshotId:"snap-1",fromHash:null,toHash:"hash-1",capturedAt:"2026-10-07T15:00:00.000Z",summary:{added:7,removed:0,changed:0,sections:["page"]},changes:[]};
fs.writeFileSync(path.join(obs,snap),JSON.stringify(snapshot));
fs.writeFileSync(path.join(obs,delta),JSON.stringify(deltaObj));
const index={schema:"signal-interpreter-platform-index/v1",generatedAt:"2026-10-07T15:00:00.000Z",observations:1,deltas:1,identityCount:1,routeCount:1,routes:["/profile/<ID>"],latestByIdentity:{[identity]:{snapshotId:"snap-1",capturedAt:snapshot.capturedAt,route:snapshot.route,url:snapshot.url,snapshotHash:"hash-1",snapshotPath:snap,lastDeltaPath:delta,observations:1}}};
const manifest={schema:"signal-interpreter-observability-package/v1",generatedAt:"2026-10-07T15:00:00.000Z",lastBatchId:"batch-1",lastSequence:1,extensionVersion:"0.10.0",eventCount:1,platform:{observations:1,deltas:1,identities:1}};
fs.writeFileSync(path.join(obs,"platform-index.json"),JSON.stringify(index));
fs.writeFileSync(path.join(obs,"platform-latest.json"),JSON.stringify(index));
fs.writeFileSync(path.join(obs,"manifest.json"),JSON.stringify(manifest));
const result=auditObservabilityPackage(obs);
assert.equal(result.ok,true);
assert.equal(result.identityCount,1);
assert.equal(result.deltas,1);
fs.rmSync(root,{recursive:true,force:true});
console.log("OBSERVABILITY_PACKAGE_AUDIT_TEST=PASS");
