import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const offscreenSource=fs.readFileSync('extension/offscreen.js','utf8');
const background=fs.readFileSync('extension/background.js','utf8');
const tick=()=>new Promise(r=>setImmediate(r));
function offscreenHarness(){
 const messages=[],recorders=[],streams=[],timers=[],intervals=[];
 let listener,denyMic=false,lateMic=null;
 const local={effectifState:{callId:'call-a',callSourceTabId:7,microphoneMuted:false,microphoneMuteStatus:'applied',microphoneOutputStatus:'applied',microphoneOutputMuted:false},effectifConfig:{}};
 class Recorder {
  constructor(stream){this.stream=stream;this.state='inactive';this.parts=[];recorders.push(this);}
  start(interval){this.state='recording';this.interval=interval;}
  stop(){if(this.state==='inactive')return;this.state='inactive';this.ondataavailable?.({data:new Blob(['EBML-fixture'])});this.onstop?.();}
 }
 class Reader{readAsDataURL(){this.result='data:audio/webm;base64,RUJNTC1maXh0dXJl';this.onloadend?.();}}
 class Context{constructor(){this.destination={};}createMediaStreamSource(){return{connect(){}};}async resume(){}async close(){this.closed=true;}}
 const chrome={storage:{local:{async get(){return structuredClone(local);}}},runtime:{onMessage:{addListener(fn){listener=fn;}},sendMessage(m){messages.push(m);return Promise.resolve({ok:true});}}};
 const navigator={mediaDevices:{async getUserMedia(c){
  if(c.audio===true&&denyMic)throw new Error('denied');
  const ended=[];
  const track={stopped:false,stop(){this.stopped=true;},addEventListener(type,fn){if(type==='ended')ended.push(fn);},end(){ended.forEach(fn=>fn());}},s={getAudioTracks:()=>[track],getTracks:()=>[track],track};streams.push({constraints:c,stream:s});
  if(c.audio===true&&lateMic)await lateMic;return s;
 }}};
 vm.runInNewContext(offscreenSource,{chrome,navigator,MediaRecorder:Recorder,FileReader:Reader,AudioContext:Context,Blob,console,Date,Math,Number,String,Object,Promise,setTimeout(fn,delay){const t={fn,delay};timers.push(t);return t;},clearTimeout(t){if(t)t.clear=true;},setInterval(fn,delay){const t={fn,delay};intervals.push(t);return t;},clearInterval(t){if(t)t.clear=true;}});
 const send=m=>new Promise(resolve=>{const kept=listener({target:'offscreen',...m},{},resolve);if(kept!==true&&m.type!=='SIGNAL_GET_GROQ_CAPTURE_STATE'){};});
 return{send,messages,recorders,streams,timers,intervals,local,setDenyMic(v){denyMic=v;},setLateMic(v){lateMic=v;}};
}
const h=offscreenHarness();
let result=await h.send({type:'SIGNAL_START_CALL_CAPTION_PREVIEW',streamId:'token',callId:'call-a',tabId:7,micEnabled:false});
assert.equal(result.ok,true);assert.equal(h.streams.length,1,'independent preview captures tab only unless microphone verified');
assert.equal(h.recorders[0].interval,undefined,'new complete WebM for every request, no headerless timeslices');
h.timers.find(t=>t.delay===1800).fn();await tick();
assert.equal(h.recorders.length,2,'rotation recreates recorder for next independent file');
assert.equal(h.messages.filter(m=>m.type==='SIGNAL_GROQ_CAPTION_PREVIEW_CHUNK').length,1);
assert.equal(h.messages.some(m=>m.type==='SIGNAL_GROQ_AUDIO_CHUNK'),false,'never durable');
result=await h.send({type:'SIGNAL_START_CALL_CAPTION_PREVIEW',callId:'call-a',tabId:7,micEnabled:true});
await tick();
assert.equal(result.reused,true);assert.equal(h.streams.length,2);
assert.ok(h.messages.some(m=>m.type==='SIGNAL_CALL_CAPTION_PREVIEW_SOURCE_STARTED'&&m.source==='yo'));
await h.send({type:'SIGNAL_CALL_CAPTION_MIC_STOP'});
assert.equal(h.streams[1].stream.track.stopped,true,'mute immediately releases microphone');
h.local.effectifState.microphoneMuted=true;
result=await h.send({type:'SIGNAL_START_CALL_CAPTION_PREVIEW',callId:'call-a',tabId:7,micEnabled:true});
assert.equal(result.micEnabled,false,'offscreen rejects stale unmuted controller requests');
const count=h.messages.length,recorder=h.recorders.at(-1);
await h.send({type:'SIGNAL_STOP_CALL_CAPTION_PREVIEW'});recorder.onstop?.();
assert.equal(h.messages.length,count,'stop discards late frames, never contaminates next call');
assert.equal(h.streams.every(x=>x.stream.track.stopped),true);
h.local.effectifState.callId='call-b';
result=await h.send({type:'SIGNAL_START_CALL_CAPTION_PREVIEW',streamId:'token-b',callId:'call-b',tabId:7,micEnabled:false});assert.equal(result.ok,true);
h.local.effectifState.callId=null;await h.intervals.at(-1).fn();
assert.equal((await h.send({type:'SIGNAL_GET_GROQ_CAPTURE_STATE'})).callPreviewActive,false,'guard cleans preview on call end even without explicit stop');
const denied=offscreenHarness();denied.setDenyMic(true);
result=await denied.send({type:'SIGNAL_START_CALL_CAPTION_PREVIEW',streamId:'token',callId:'call-a',tabId:7,micEnabled:true});
await tick();
assert.equal(result.ok,true);assert.equal(result.micEnabled,false,'microphone denial cannot kill tab preview');
assert.ok(denied.messages.some(m=>m.reasonCode==='microphone-permission-or-device-unavailable'));
await denied.send({type:'SIGNAL_STOP_CALL_CAPTION_PREVIEW'});
const late=offscreenHarness();let release;late.setLateMic(new Promise(r=>release=r));
const pending=late.send({type:'SIGNAL_START_CALL_CAPTION_PREVIEW',streamId:'token',callId:'call-a',tabId:7,micEnabled:true});await tick();
result=await pending;
assert.equal(result.active,true);assert.equal(result.micPending,true,'pending microphone permission never stalls tab preview or the control queue');
await late.send({type:'SIGNAL_STOP_CALL_CAPTION_PREVIEW'});release();await tick();
assert.equal(late.streams.every(x=>x.stream.track.stopped),true,'async permission result cannot resurrect ended call');
const ended=offscreenHarness();
await ended.send({type:'SIGNAL_START_CALL_CAPTION_PREVIEW',streamId:'token',callId:'call-a',tabId:7,micEnabled:false});
ended.streams[0].stream.track.end();await tick();
assert.equal((await ended.send({type:'SIGNAL_GET_GROQ_CAPTURE_STATE'})).callPreviewActive,false);
assert.ok(ended.messages.some(m=>m.reasonCode==='preview-audio-track-ended'));
assert.equal((await ended.send({type:'SIGNAL_START_CALL_CAPTION_PREVIEW',streamId:'new-token',callId:'call-a',tabId:7,micEnabled:false})).ok,true,'ended tab capture is reacquirable, never falsely reused');
await ended.send({type:'SIGNAL_STOP_CALL_CAPTION_PREVIEW'});
// Execute actual controller functions: no durable session and concurrent native status callbacks.
function controllerHarness(){
 const local={effectifState:{callId:'call-a',callSourceTabId:7,microphoneMuted:true,microphoneMuteStatus:'applied',microphoneOutputStatus:'applied'},effectifConfig:{}};
 const events=[],messages=[];let acquisitions=0,ready=true,denied=false,capture={running:false};
 const sandbox={console,Date,Number,String,Object,Promise,DEFAULT_CONFIG:{liveCaptionOverlayEnabled:true,liveCaptionBilingualTabEnabled:true,liveCaptionInterpreterEnabled:true},
 normalizeHotloadState:x=>x,normalizeStateShape:x=>x,baseState:()=>({}),hasActiveCall:s=>!!s.callId,ensureOffscreen:async()=>{},record:(action,payload)=>events.push({action,payload}),
 SignalCaptionBridge:{stop(){}},SignalGroqTranscriber:{ready:async()=>ready},chrome:{storage:{local:{get:async()=>structuredClone(local)}},tabCapture:{async getMediaStreamId(){acquisitions++;if(denied)throw new Error('Extension has not been invoked, activeTab permission');return 'token';}},runtime:{async sendMessage(m){messages.push(m);if(m.type==='SIGNAL_GET_GROQ_CAPTURE_STATE')return capture;if(m.type==='SIGNAL_START_CALL_CAPTION_PREVIEW'){capture={running:false,callPreviewActive:true,callPreviewCallId:m.callId,callPreviewTabId:m.tabId};return{ok:true,reused:!m.streamId,micEnabled:m.micEnabled};}return{ok:true};}}}};
 vm.createContext(sandbox);vm.runInContext(background.slice(background.indexOf('  var captionControlQueue'),background.indexOf('\n  try {\n    SignalCaptionBridge.onCaption')),sandbox);
 return{sandbox,events,messages,local,acquisitions:()=>acquisitions,setReady(v){ready=v;},setDenied(v){denied=v;}};
}
const c=controllerHarness();await Promise.all([c.sandbox.setCaptionPreviewForActiveCall(true,'native-disconnect'),c.sandbox.setCaptionPreviewForActiveCall(true,'call-start')]);
assert.equal(c.acquisitions(),1,'concurrent callbacks cannot create overlapping tab captures');
assert.ok(c.messages.some(m=>m.type==='SIGNAL_START_CALL_CAPTION_PREVIEW'&&m.micEnabled===false));
const noKey=controllerHarness();noKey.setReady(false);result=await noKey.sandbox.setCaptionPreviewForActiveCall(true,'call-start');assert.equal(result.reasonCode,'missing-api-key');assert.equal(noKey.acquisitions(),0);
const noGesture=controllerHarness();noGesture.setDenied(true);result=await noGesture.sandbox.setCaptionPreviewForActiveCall(true,'call-start');assert.equal(result.reasonCode,'tab-capture-user-activation-required');
assert.ok(noGesture.events.some(e=>e.payload.callId==='call-a'&&e.payload.requiresUserActivation===true));
const reserved=controllerHarness();reserved.sandbox.captionDurableReservationUntil=Date.now()+30000;
result=await reserved.sandbox.setCaptionPreviewForActiveCall(true,'native-disconnect');
assert.equal(result.reason,'durable-capture-starting');assert.equal(reserved.acquisitions(),0,'preview must not steal the durable UI stream reservation');
assert.ok(background.indexOf('checkpointCallObservability("call-ended", closedCallId, finalState).then')<background.indexOf('return reconcileOfficialEarningsAfterCall(closedCallId)'),'export independent of slow earnings');
console.log('CALL_CAPTION_RUNTIME_TEST=PASS');
