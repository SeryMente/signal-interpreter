import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync("extension/whisper-window-processor.js","utf8");
let Processor;
const ctx={
  AudioWorkletProcessor:class{constructor(){this.port={messages:[],onmessage:null,postMessage(value){this.messages.push(value);}};}},
  registerProcessor:(name,ctor)=>{assert.equal(name,"signal-whisper-window");Processor=ctor;},
  sampleRate:16000,currentFrame:0,Float32Array,Int16Array,ArrayBuffer,DataView,Math,Number,String
};
vm.createContext(ctx);vm.runInContext(source,ctx);
const p=new Processor({processorOptions:{windowSeconds:1}});
const input=new Float32Array(128);input.fill(0.25);
for(let block=0;block<125;block++){
 ctx.currentFrame=block*128;
 p.process([[input]],[[new Float32Array(128)]]);
}
assert.equal(p.port.messages.length,1,"one complete one-second WAV window emitted");
const packet=p.port.messages[0].packet,view=new DataView(packet.buffer);
assert.equal(packet.sampleRate,16000);
assert.equal(packet.frames,16000);
assert.equal(view.getUint32(24,true),16000);
assert.equal(view.getUint16(22,true),1);
assert.equal(view.getUint16(34,true),16);
assert.equal(view.getUint32(40,true),32000);
assert.equal(view.getInt16(44,true),8192);
const micLike=new Processor({processorOptions:{windowSeconds:1}});
ctx.currentFrame=16000;micLike.process([[input]],[[new Float32Array(128)]]);
micLike.port.onmessage({data:{type:"flush"}});
assert.equal(micLike.port.messages.length,2,"partial final window is followed by an explicit flush acknowledgement");
assert.ok(micLike.port.messages[0].packet.frames>0);
assert.equal(micLike.port.messages[1].type,"flushed");
console.log("WHISPER_WINDOW_WAV_16K_MONO=PASS");
