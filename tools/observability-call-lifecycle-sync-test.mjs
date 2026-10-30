import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {webcrypto} from "node:crypto";

const source=fs.readFileSync("extension/observation-sync.js","utf8");
const stored={signalObservationSyncState:{
  ackedSequence:0,pendingCount:0,lastAttemptAt:null,lastSuccessAt:null,lastBatchId:null,
  lastRelayAcceptedAt:null,lastAutomaticPublishAt:null,lastAutomaticBatchId:null,
  consecutiveFailures:0,lastError:null,pendingCheckpointTargetSequence:0
}};
const events=[];
const uploads=[];
const chrome={
  runtime:{getManifest:()=>({version:"0.10.39"})},
  storage:{local:{
    async get(){return {signalObservationSyncState:stored.signalObservationSyncState};},
    async set(value){Object.assign(stored,value);}
  }},
  alarms:{create(){},clear(){}}
};
const context={
  chrome,crypto:webcrypto,Date,Promise,URL,Map,Set,Array,Math,Number,String,Object,JSON,
  setTimeout,clearTimeout,console,
  KhoraTelemetryDB:{
    async getEventsAfter(after,limit){return events.filter(e=>Number(e.sequence)>Number(after)).slice(0,limit);},
    async getEvents(){return events.slice();}
  },
  SignalObservabilityRelay:{
    async uploadBatch(batch){
      uploads.push(batch);
      return {commitSha:"relay-commit-"+uploads.length,relayReceivedAt:new Date().toISOString()};
    }
  }
};
vm.createContext(context);
vm.runInContext(source,context,{filename:"extension/observation-sync.js"});
function makeEvent(sequence,action){
  const timestamp=new Date().toISOString();
  return {
    schema:"khora-effectif-event/v4",id:"event-"+sequence,sequence,timestamp,ingestedAt:timestamp,
    action,level:"info",source:"content",host:"app.cloudinterpreter.com",
    url:"https://app.cloudinterpreter.com/profile/<ID>",
    session:{sessionId:"session-fixture",callId:null},context:{route:"/profile/<ID>"},
    payload:{attemptId:"attempt-fixture"}
  };
}
async function waitFor(predicate,message){
  const deadline=Date.now()+3000;
  while(Date.now()<deadline){
    if(predicate())return;
    await new Promise(resolve=>setTimeout(resolve,10));
  }
  throw new Error(message);
}
const sync=context.SignalObservationSync;
events.push(makeEvent(1,"INCOMING_RING_SIGNAL"));
sync.noteEvent(events[0]);
await waitFor(()=>uploads.length===1,"first incoming ring event was not uploaded immediately");
assert.equal(uploads[0].trigger,"call-lifecycle");
assert.equal(stored.signalObservationSyncState.ackedSequence,1);

events.push(makeEvent(2,"INCOMING_DIALOG_DETECTED"));
sync.noteEvent(events[1]);
await waitFor(()=>uploads.length===2,"second lifecycle event was rate-limited inside the 10 second window");
assert.equal(uploads[1].trigger,"call-lifecycle");
assert.equal(stored.signalObservationSyncState.ackedSequence,2);
assert.ok(Date.parse(stored.signalObservationSyncState.lastRelayAcceptedAt)>0);
console.log("OBSERVABILITY_CALL_LIFECYCLE_SYNC_TEST=PASS",JSON.stringify({
  uploads:uploads.length,ackedSequence:stored.signalObservationSyncState.ackedSequence,
  gapMs:Date.parse(uploads[1].createdAt)-Date.parse(uploads[0].createdAt)
}));
