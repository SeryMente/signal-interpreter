import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('extension/observation-sync.js','utf8');
const events=Array.from({length:450},(_,i)=>({sequence:i+1,timestamp:'2026-10-10T20:39:38.065Z',action:i===449?'CALL_OBSERVABILITY_CHECKPOINT':'MEDIA_HEALTH',payload:{startedAt:'2026-10-10T20:25:07.643Z',endedAt:'2026-10-10T20:39:38.065Z',phone:'555-123-4567',captionText:'private'},session:{}}));
const local={},batches=[],alarms=[];let failing=true;
function boot(){const root={Date,Promise,Math,Number,String,Object,Array,URL,crypto,console,setTimeout(){},chrome:{runtime:{getManifest:()=>({version:'0.10.32'})},storage:{local:{async get(){return structuredClone(local);},async set(v){Object.assign(local,structuredClone(v));}}},alarms:{create(n,v){alarms.push({n,v});},clear(){}}},KhoraTelemetryDB:{getEventsAfter:async(seq,n)=>events.filter(e=>e.sequence>seq).slice(0,n)},SignalObservabilityRelay:{async uploadBatch(b){if(failing)throw new Error('fixture-network-unavailable');batches.push(b);return{commitSha:'fixture-commit'};}}};root.self=root;vm.runInNewContext(source,root);return root.SignalObservationSync;}
let sync=boot(),r=await sync.flushThrough(450,'call-ended');assert.equal(r.ok,false);assert.equal(local.signalObservationSyncState.pendingCheckpointTargetSequence,450);assert.ok(alarms.some(a=>a.n==='signal-observation-sync-retry'));
failing=false;sync=boot();r=await sync.flush('alarm');assert.equal(r.ok,true);assert.equal(r.ackedSequence,450,'worker restart resumes until terminal event accepted');assert.equal(batches.length,3);assert.ok(batches.every(b=>b.trigger==='call-ended'));
assert.equal(local.signalObservationSyncState.pendingCheckpointTargetSequence,0);
assert.equal(batches[0].events[0].payload.startedAt,'2026-10-10T20:25:07.643Z');assert.equal(batches[0].events[0].payload.endedAt,'2026-10-10T20:39:38.065Z');
assert.equal(batches[0].events[0].payload.phone,'[PHONE]');assert.equal(batches[0].events[0].payload.captionText,'[OMITTED]');
assert.equal(local.signalObservationSyncState.lastManualPublishAt,null);assert.ok(local.signalObservationSyncState.lastAutomaticPublishAt);
console.log('CALL_EXPORT_RUNTIME_TEST=PASS');
