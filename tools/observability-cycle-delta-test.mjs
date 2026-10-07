import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {computeCycleDelta,checkpointFromPackage} from "./observability-cycle-delta.mjs";

const root=fs.mkdtempSync(path.join(os.tmpdir(),"signal-cycle-delta-"));
const obs=path.join(root,"observations");
fs.mkdirSync(path.join(obs,"batches"),{recursive:true});
fs.writeFileSync(path.join(obs,"batches","batch-1.json"),JSON.stringify({schema:"signal-interpreter-observation-batch/v1",batchId:"batch-1",events:[
  {sequence:1,action:"OBSERVER_STARTED",category:"RUNTIME",level:"info"},
  {sequence:2,action:"PLATFORM_URL_CHANGED",category:"PORTAL",level:"info"}
]}));
fs.writeFileSync(path.join(obs,"manifest.json"),JSON.stringify({
  schema:"signal-interpreter-observability-package/v1",generatedAt:"2026-10-07T15:00:00.000Z",
  lastBatchId:"batch-1",lastSequence:2,extensionVersion:"0.10.0",eventCount:2,
  platform:{observations:1,deltas:1,identities:1}
}));
fs.writeFileSync(path.join(obs,"platform-index.json"),JSON.stringify({
 schema:"signal-interpreter-platform-index/v1",generatedAt:"2026-10-07T15:00:00.000Z",
 observations:1,deltas:1,identityCount:1,routeCount:1,routes:["/profile/<ID>"],
 latestByIdentity:{"https://app.cloudinterpreter.com|/profile/<ID>|":{snapshotId:"snap-1"}}
}));
const first=computeCycleDelta(obs,{schema:"signal-interpreter-cycle-checkpoint/v1",lastSequence:0,platformObservations:0,platformDeltas:0,routes:[],identities:[],actions:[],categories:[]});
assert.equal(first.status,"ready");
assert.equal(first.summary.newEvents,2);
assert.ok(first.summary.newRoutes.includes("/profile/<ID>"));
assert.ok(first.summary.newActions.includes("OBSERVER_STARTED"));
const checkpoint=checkpointFromPackage(obs);
assert.equal(checkpoint.lastSequence,2);
assert.ok(checkpoint.actions.includes("OBSERVER_STARTED"));
const second=computeCycleDelta(obs,checkpoint);
assert.equal(second.summary.newEvents,0);
assert.equal(second.summary.newRoutes.length,0);
assert.equal(second.findings.regressionSignal,false);

const regression=computeCycleDelta(obs,Object.assign({},checkpoint,{routes:["/profile/<ID>","/obsolete"],identities:["https://app.cloudinterpreter.com|/profile/<ID>|","obsolete"],platformObservations:2,platformDeltas:2}));
assert.ok(regression.summary.removedRoutes.includes("/obsolete"));
assert.ok(regression.summary.removedIdentities.includes("obsolete"));
assert.equal(regression.findings.platformContractRegression,true);
assert.equal(regression.findings.regressionSignal,true);
fs.rmSync(root,{recursive:true,force:true});
console.log("OBSERVABILITY_CYCLE_DELTA_TEST=PASS");
