import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync("extension/groq-dialogue-capture.js","utf8");
const backgroundSource=fs.readFileSync("extension/background.js","utf8");
const contentSource=fs.readFileSync("extension/content.js","utf8");
const popupSource=fs.readFileSync("extension/ui/popup.js","utf8");
assert.match(source,/echoCancellation:false,noiseSuppression:false,autoGainControl:false/,
  "the ASR microphone copy must not request browser AEC, noise suppression, or automatic gain by default");
assert.match(source,/settings\[key\]===false[\s\S]*microphone-processing-unverified/,
  "capture must fail closed unless the browser confirms all three microphone processing controls are off");
assert.match(backgroundSource,/state\.microphoneMuted!==false[\s\S]*microphone-muted-or-unverified/,
  "Groq capture requires an explicitly enabled and verified outgoing microphone");
assert.match(backgroundSource,/stopAllSignalGroqDialogueCaptures\("microphone-muted"\)/,
  "MIC OFF must stop both Groq capture lanes");
assert.match(backgroundSource,/stopAllSignalGroqDialogueCaptures\("call-ended"\)/,
  "call end must stop both Groq capture lanes even when native caption capture is inactive");
assert.doesNotMatch(backgroundSource,/requestCallAlert\(/,
  "no extension-generated call alert may be injected into live call playback");
assert.match(backgroundSource,/soundEnabled!==false&&!outputRequired/,
  "mute tones must not be added to active call playback");
assert.match(backgroundSource,/EFFECTIF_TEST_SOUND[\s\S]*hasActiveCall\(testState\)/,
  "the service worker must reject manual test tones during active calls");
assert.doesNotMatch(contentSource,/playPageCallBeep\("confirmed-answer-route"/,
  "call confirmation beeps must not be mixed into original call playback");
assert.doesNotMatch(contentSource,/speakConfirmedAnswer\(callRouteId/,
  "call confirmation speech must not be mixed into original call playback");
assert.match(popupSource,/La prueba de sonido se bloquea durante una llamada activa/,
  "manual sound test must be blocked during active calls");

function createHarness(displaySurface="browser",options={}){
  const sent=[],elements=[],intervals=[],windowListeners={},tracks=[],audioNodes=[],pendingChunkResolvers=[];
  let policy=true,displayCalls=0,micCalls=0,contextClosed=false,fakeNow=Date.now(),monotonicNow=0;
  const FakeDate=class extends Date{static now(){return fakeNow;}};
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
        if(message.type==="SIGNAL_GROQ_DIALOGUE_CHUNK"){
          if(options.holdChunks===true)return new Promise(resolve=>pendingChunkResolvers.push(()=>resolve({ok:true,segments:1})));
          return{ok:true,segments:1,visibleSegments:1,visibleLatencyMs:120,latencyBasis:"capture-window-ready-to-visible-text"};
        }
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
        assert.equal(options.audio.suppressLocalAudioPlayback,false);
        return new Stream([new Track("video",displaySurface?{displaySurface}:{}),new Track("audio")]);
      },
      async getUserMedia(options){
        micCalls++;
        assert.equal(options.video,false);
        assert.equal(options.audio.echoCancellation,false);
        assert.equal(options.audio.noiseSuppression,false);
        assert.equal(options.audio.autoGainControl,false);
        return new Stream([new Track("audio",{echoCancellation:false,noiseSuppression:false,autoGainControl:false})]);
      }
    }},
    window:{addEventListener(name,fn){windowListeners[name]=fn;}},
    AudioContext:AudioContextFake,AudioWorkletNode:WorkletNode,MediaStream:Stream,
    performance:{timeOrigin:1700000000000,now(){monotonicNow+=17;return monotonicNow;}},
    setInterval(fn){intervals.push(fn);return intervals.length;},clearInterval(){},
    setTimeout(fn,ms){fakeNow+=Number(ms)||0;setImmediate(fn);return 1;},clearTimeout(){},
    btoa:(value)=>Buffer.from(value,"binary").toString("base64"),
    Uint8Array,ArrayBuffer,Math,Date:FakeDate,Number,String,Promise,Error,JSON
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
    status(){const node=elements.find(x=>x.tag==="p");return node?String(node.textContent||""):"";},
    releaseChunks(){pendingChunkResolvers.splice(0).forEach(resolve=>resolve());},
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
assert.equal(h.button().disabled,true,"capture control stays disabled until asynchronous preflight completes");
await h.flush();
assert.equal(h.button().disabled,false,"capture control enables only after policy preflight succeeds");
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
assert.ok(chunks.every(x=>Number.isFinite(x.windowReadyAtMs)&&Number.isFinite(x.windowReadyTimeOriginMs)),
  "every audio window records its monotonic ready timestamp without using HTTP completion time");
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
assert.match(h.status(),/Captura detenida/,"a fully drained stop is reported as complete");
assert.doesNotMatch(h.status(),/INCOMPLETA/,"a successful flush never raises the incomplete warning");
assert.match(h.status(),/latencia visible remoto p50 120 ms · p95 120 ms · max 120 ms \(n=2\)/,
  "remote visible latency percentiles use the overlay paint acknowledgement");
assert.match(h.status(),/· intérprete p50 120 ms · p95 120 ms · max 120 ms \(n=1\)/,
  "interpreter visible latency percentiles use the overlay paint acknowledgement");
console.log("GROQ_DUAL_CAPTURE_SYNTHETIC=PASS");

const incomplete=createHarness("browser",{holdChunks:true});
await incomplete.flush();
await incomplete.button().listeners.click();
await incomplete.flush();
incomplete.audioNodes[0].port.onmessage({data:{type:"window",source:"audio",packet:wavWindow(16000,7)}});
await incomplete.flush();
assert.equal(incomplete.sent.filter(x=>x.type==="SIGNAL_GROQ_DIALOGUE_CHUNK").length,1,"one remote transcription remains deliberately pending");
const incompleteStopPromise=incomplete.button().listeners.click();
await incomplete.flush();
assert.equal(incomplete.tracks.every(t=>t.stopped),true,"capture tracks are released before waiting for pending API work");
await incompleteStopPromise;
await incomplete.flush();
assert.match(incomplete.status(),/Captura INCOMPLETA/,"an undrained transcription is never presented as a complete stop");
assert.match(incomplete.status(),/pendientes remoto 1/,"the incomplete status identifies the source with pending work");
assert.equal(incomplete.tracks.every(t=>t.stopped),true,"incomplete shutdown still releases both audio sources");
assert.equal(incomplete.contextClosed,true,"incomplete shutdown still closes the shared audio context");
incomplete.releaseChunks();
await incomplete.flush();
console.log("GROQ_CAPTURE_INCOMPLETE_DRAIN_VISIBLE=PASS");

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

for (const surface of [null,"window"]) {
  const invalid=createHarness(surface);
  await invalid.flush();
  await invalid.button().listeners.click();
  await invalid.flush();
  assert.equal(invalid.micCalls,0,"the interpreter mic is not requested until the shared surface is verified as a browser tab");
  assert.ok(invalid.sent.some(x=>x.type==="SIGNAL_GROQ_DIALOGUE_CAPTURE_STOP"&&x.reason==="tab-selection-invalid"),"missing or non-browser displaySurface fails closed");
  assert.equal(invalid.tracks.every(t=>t.stopped),true,"rejected display streams are fully released");
}
console.log("GROQ_CAPTURE_REQUIRES_VERIFIED_BROWSER_SURFACE=PASS");
