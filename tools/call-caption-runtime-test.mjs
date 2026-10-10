import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const background=fs.readFileSync("extension/background.js","utf8");
function harness(){
 const local={effectifState:{callId:"call-a",callSourceTabId:7},effectifConfig:{}};
 const events=[];let closed=0,starts=0,stops=0,context={};let forbidden=0;
 const poison=()=>{forbidden++;throw new Error("audio path forbidden");};
 const sb={Date,Number,String,Object,Promise,normalizeHotloadState:x=>x,normalizeStateShape:x=>x,baseState:()=>({}),hasActiveCall:s=>!!s.callId,record:(action,payload)=>events.push({action,payload}),
  chrome:{storage:{local:{get:async()=>structuredClone(local)}},offscreen:{hasDocument:async()=>true,closeDocument:async()=>{closed++;}},tabCapture:{getMediaStreamId:poison}},
  SignalGroqTranscriber:{ready:poison,transcribe:poison},SignalCaptionBridge:{getContext:()=>context,start(tabId,callId){context={tabId,callId};starts++;},stop(){context={};stops++;}}};
 vm.createContext(sb);vm.runInContext(background.slice(background.indexOf("  var captionControlQueue"),background.indexOf("\n  try {\n    SignalCaptionBridge.onCaption")),sb);
 return {sb,local,events,counts:()=>({closed,starts,stops,forbidden})};
}
const h=harness();await Promise.all([h.sb.setCaptionPreviewForActiveCall(true,"call-start"),h.sb.setCaptionPreviewForActiveCall(true,"native-recovery")]);
assert.deepEqual(h.counts(),{closed:1,starts:1,stops:0,forbidden:0});
assert.ok(h.events.some(e=>e.payload.captureScope==="native-text-only"&&e.payload.audioReplay===false));
h.local.effectifState.callId=null;assert.equal((await h.sb.setCaptionPreviewForActiveCall(false,"call-ended")).enabled,false);assert.equal(h.counts().stops,1);
h.local.effectifState.callId="call-b";await h.sb.setCaptionPreviewForActiveCall(true,"new-call");assert.equal(h.counts().starts,2);
h.local.effectifConfig.liveCaptionOverlayEnabled=false;await h.sb.setCaptionPreviewForActiveCall(true,"disabled");assert.equal(h.counts().stops,2);
assert.equal(h.counts().forbidden,0);
assert.ok(background.indexOf('checkpointCallObservability("call-ended", closedCallId, finalState).then')<background.indexOf('return reconcileOfficialEarningsAfterCall(closedCallId)'));
console.log("CALL_CAPTION_NATIVE_ONLY_RUNTIME_TEST=PASS");
