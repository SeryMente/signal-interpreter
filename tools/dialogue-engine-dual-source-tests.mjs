import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync("extension/dialogue-engine.js","utf8");
const ctx={};vm.createContext(ctx);vm.runInContext(source,ctx);
const d=ctx.SignalDialogue;
assert.equal(d.stableSegmentId("c1","groq-interpreter",2,0),"c1:groq-interpreter:2:0");
assert.equal(d.speakerLabel("groq-interpreter"),"INTÉRPRETE");
assert.equal(d.speakerLabel("groq-remote"),"AUDIO REMOTO · HABLANTE NO VERIFICADO");
const merged=d.mergeSegments([
 {id:"remote-2",source:"groq-remote",startMs:6000,endMs:9000,text:"remote second",sequence:1},
 {id:"mic-1",source:"groq-interpreter",startMs:1000,endMs:7000,text:"my first",sequence:0},
 {id:"remote-1",source:"groq-remote",startMs:2000,endMs:5000,text:"remote first",sequence:0},
 {id:"bad",source:"groq-remote",startMs:10000,endMs:9000,text:"invalid"},
 {id:"remote-1",source:"groq-remote",startMs:2000,endMs:5000,text:"remote first",sequence:0}
]);
assert.deepEqual(merged.map(x=>x.id),["mic-1","remote-1","remote-2"]);
assert.equal(merged[0].overlap,true);
assert.equal(merged[1].overlap,true);
assert.equal(merged[2].overlap,true);
assert.equal(merged.length,3,"same stable segment id is reconciled once");
assert.equal(merged[0].speaker,"INTÉRPRETE");
assert.equal(merged[1].speaker,"AUDIO REMOTO · HABLANTE NO VERIFICADO");
const crossSourceRepeat=d.mergeSegments([
 {id:"a",source:"groq-interpreter",startMs:1000,endMs:2000,text:"Sí."},
 {id:"b",source:"groq-remote",startMs:1000,endMs:2000,text:"Sí."}
]);
assert.equal(crossSourceRepeat.length,2,"same spoken text from two sources is never deduplicated across sources");
assert.equal(d.mergeSegments([{id:"bad",source:"groq-interpreter",startMs:-1,endMs:4,text:"bad"}]).length,0);
console.log("DIALOGUE_ENGINE_DUAL_SOURCE=PASS");

const queue=d.createConcurrentSourceQueue(2);
let active=0,maxActive=0,order=[];
let releaseRemote;
const remoteGate=new Promise(resolve=>{releaseRemote=resolve;});
const remote1=queue.enqueue("groq-remote",async()=>{active++;maxActive=Math.max(maxActive,active);order.push("remote-1-start");await remoteGate;order.push("remote-1-end");active--;return{ok:true};});
const remote2=queue.enqueue("groq-remote",async()=>{active++;maxActive=Math.max(maxActive,active);order.push("remote-2");active--;return{ok:true};});
const interpreter=queue.enqueue("groq-interpreter",async()=>{active++;maxActive=Math.max(maxActive,active);order.push("interpreter");active--;return{ok:true};});
await Promise.resolve();await Promise.resolve();
assert.equal(maxActive,2,"interpreter lane executes while remote lane is busy");
assert.ok(order.includes("interpreter"));
assert.equal(order.includes("remote-2"),false,"a source's next chunk waits for its previous chunk");
releaseRemote();
await Promise.all([remote1,remote2,interpreter]);
assert.ok(order.indexOf("remote-1-end")<order.indexOf("remote-2"));
assert.equal(queue.setSequence("groq-remote",1),true);
assert.equal(queue.setSequence("groq-remote",1),false,"duplicate sequence is rejected");
assert.equal(queue.status("groq-remote").lastSequence,1);
console.log("DIALOGUE_ENGINE_PARALLEL_LANES=PASS");
