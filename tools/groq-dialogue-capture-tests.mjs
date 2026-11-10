import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync("extension/groq-dialogue-capture.js","utf8");

function createHarness(){
  const sent=[],elements=[],intervals=[],windowListeners={},tracks=[],audioNodes=[];
  let policy=true,displayCalls=0,micCalls=0,contextClosed=false;
  function element(tag){
    const item={tag,style:{},children:[],listeners:{},isConnected:true,disabled:false,
      append(...children){this.children.push(...children);},
      addEventListener(name,fn){this.listeners[name]=fn;},
      setAttribute(){},
      attachShadow(){return element("shadow-root");},
      remove(){this.isConnected=false;}
    };
    elements.push(item);return item;
  }
  class Track{
    constructor(kind,settings){
      this.kind=kind;this.readyState="live";this.settings=settings||{};this.stopped=false;this.listeners={};tracks.push(this);
    }
    getSettings(){return this.settings;}
    addEventListener(name,fn){this.listeners[name]=fn;}
    stop(){this.stopped=true;this.readyState="ended";}
  }
  class Stream{
    constructor(items){this.items=items||[];}
    getTracks(){return this.items.slice();}
    getAudioTracks(){return this.items.filter(x=>x.kind==="audio");}
    getVideoTracks(){return this.items.filter(x=>x.kind==="video");}
  }
  class AudioContextFake{
    constructor(opts){this.sampleRate=16000;this.currentTime=1;this.state="running";this.destination={};this.audioWorklet={addModule:async()=>{}};this.opts=opts;}
    createMediaStreamSource(stream){return{stream,connect(){},disconnect(){}};}
    async resume(){}
    async close(){this.state="closed";contextClosed=true;}
  }
  class WorkletNode{
    constructor(context,name,opts){
      this.context=context;this.name=name;this.opts=opts;this.connected=false;
      this.port={onmessage:null,messages:[],postMessage:(v)=>{
        this.port.messages.push(v);
        if(v&&v.type==="flush")Promise.resolve().then(()=>{if(this.port.onmessage)this.port.onmessage({data:{type:"flushed"}});});
      }};
      audioNodes.push(this);
    }
    connect(){this.connected=true;}
    disconnect(){this.connected=false;}
  }
  const document={
    createElement:element,
    documentElement:{appendChild(node){node.isConnected=true;}},
    body:{appendChild(node){node.isConnected=true;}}
  };
  const chrome={
    runtime:{
      getURL:(path)=>"chrome-extension://test/"+path,
      onMessage:{addListener(fn){chrome.listener=fn;}},
      async sendMessage(message){
        sent.push(message);
        if(message.type==="SIGNAL_GROQ_DIALOGUE_POLICY_GET")
          return policy?{ok:true,canCapture:true,model:"whisper-large-v3"}:{ok:false,canCapture:false,reasonCode:"call-not-active"};
        if(message.type==="SIGNAL_GROQ_DIALOGUE_CAPTURE_START")return{ok:true,captureId:message.captureId};
        if(message.type==="SIGNAL_GROQ_DIALOGUE_CHUNK")return{ok:true,segments:1};
        if(message.type==="SIGNAL_GROQ_DIALOGUE_CAPTURE_STOP")return{ok:true};
        return{ok:true};
      }
    }
  };
  const ctx={
    console,document,chrome,location:{pathname:"/call/call-123"},
    navigator:{mediaDevices:{
      async getDisplayMedia(options){
        displayCalls++;
        assert.equal(options.audio,true);
        return new Stream([new Track("video",{displaySurface:"browser"}),new Track("audio")]);
      },
      async getUserMedia(options){
        micCalls++;
        assert.equal(options.video,false);
        assert.equal(options.audio.echoCancellation,true);
        return new Stream([new Track("audio")]);
      }
    }},
    window:{addEventListener(name,fn){windowListeners[name]=fn;}},
    AudioContext:AudioContextFake,AudioWorkletNode:WorkletNode,MediaStream:Stream,
    setInterval(fn){intervals.push(fn);return intervals.length;},clearInterval(){},
    setTimeout(fn){queueMicrotask(fn);return 1;},clearTimeout(){},
    btoa:(value)=>Buffer.from(value,"binary").toString("base64"),
    Uint8Array,ArrayBuffer,Math,Date,Number,String,Promise,Error,JSON
  };
  vm.createContext(ctx);
  vm.runInContext(source,ctx,{timeout:2000});
  return{
    sent,elements,intervals,tracks,audioNodes,windowListeners,
    setPolicy(value){policy=value;},
    get displayCalls(){return displayCalls;},
    get micCalls(){return micCalls;},
    get contextClosed(){return contextClosed;},
    button(){return elements.find(x=>x.tag==="button");},
    async flush(){for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));}
  };
}

function wavWindow(startFrame,sampleValue){
  const seconds=6.5,sampleRate=16000,frames=seconds*sampleRate;
  const buffer=new ArrayBuffer(44+frames*2),view=new DataView(buffer);
  const write=(offset,value)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
  write(0,"RIFF");view.setUint32(4,buffer.byteLength-8,true);write(8,"WAVE");write(12,"fmt ");
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
  view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);
  view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,"data");view.setUint32(40,frames*2,true);view.setInt16(44,Number(sampleValue)||0,true);
  return{buffer,startFrame,endFrame:startFrame+frames,sampleRate,frames};
}

const h=createHarness();
await h.flush();
const startHandler=h.button().listeners.click;
assert.equal(typeof startHandler,"function");
await startHandler();
await h.flush();
assert.equal(h.displayCalls,1,"remote browser-tab audio is requested once");
assert.equal(h.micCalls,1,"interpreter microphone is requested separately");
assert.equal(h.audioNodes.length,2,"two distinct worklet lanes are created");
assert.deepEqual(h.audioNodes.map(n=>n.opts.processorOptions.windowSeconds),[6.5,6.5]);
const startMessage=h.sent.find(x=>x.type==="SIGNAL_GROQ_DIALOGUE_CAPTURE_START");
assert.ok(startMessage&&startMessage.callId==="call-123","capture is bound to the active call ID");
const sources=["groq-remote","groq-interpreter"];
h.audioNodes[0].port.onmessage({data:{type:"window",source:"audio",packet:wavWindow(16000,1)}});
h.audioNodes[0].port.onmessage({data:{type:"window",source:"audio",packet:wavWindow(112000,3)}});
h.audioNodes[1].port.onmessage({data:{type:"window",source:"audio",packet:wavWindow(16000,2)}});
await h.flush();
const chunks=h.sent.filter(x=>x.type==="SIGNAL_GROQ_DIALOGUE_CHUNK");
assert.equal(chunks.length,3,"two remote windows and one interpreter window are uploaded independently");
assert.deepEqual(Array.from(chunks,x=>x.source).sort(),["groq-interpreter","groq-remote","groq-remote"]);
assert.ok(chunks.every(x=>x.mimeType==="audio/wav"&&x.sampleRate===16000&&x.durationMs===6500));
const remoteChunks=chunks.filter(x=>x.source==="groq-remote");
assert.deepEqual(Array.from(remoteChunks,x=>x.sequence),[1,2],"same-source uploads retain capture sequence");
assert.deepEqual(Array.from(remoteChunks,x=>x.chunkStartOffsetMs),[0,6000],"remote windows advance six seconds with 500 ms overlap");
assert.equal(chunks.find(x=>x.source==="groq-interpreter").sequence,1);
assert.equal(new Set(chunks.map(x=>x.base64)).size,3,"all chunks remain separate; no microphone/tab mixing");
const stopHandler=h.button().listeners.click;
await stopHandler();
await h.flush();
assert.ok(h.sent.some(x=>x.type==="SIGNAL_GROQ_DIALOGUE_CAPTURE_STOP"));
assert.equal(h.tracks.every(t=>t.stopped),true,"all acquired microphone and tab tracks are released");
assert.equal(h.contextClosed,true,"shared audio context is closed");
console.log("GROQ_DUAL_CAPTURE_SYNTHETIC=PASS");

const revoked=createHarness();
await revoked.flush();
await revoked.button().listeners.click();
await revoked.flush();
revoked.setPolicy(false);
const policyTimer=revoked.intervals.at(-1);
await policyTimer();
await revoked.flush();
assert.ok(revoked.sent.some(x=>x.type==="SIGNAL_GROQ_DIALOGUE_CAPTURE_STOP"&&x.reason==="call-not-active"));
assert.equal(revoked.tracks.every(t=>t.stopped),true,"call-policy revocation releases both sources");
console.log("GROQ_CAPTURE_POLICY_REVOCATION=PASS");
