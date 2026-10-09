(function(){
"use strict";
var K="__SIGNAL_INTERPRETER_MAIN_MIC_GUARD_V1__",CE="__SIGNAL_INTERPRETER_MIC_COMMAND_V1__",AE="__SIGNAL_INTERPRETER_MIC_ACK_V1__";
var old=window[K]&&window[K].version==="1.0"?window[K]:null;
var muted=old?!!old.muted:false;
var tracks=old&&old.tracks instanceof Map?old.tracks:new Map();
var senders=old&&old.senders instanceof Set?old.senders:new Set();
var patches=old&&old.patches?old.patches:{gum:false,addTrack:false,addTransceiver:false,replaceTrack:false,clone:false};
var timer=old&&old.timer?old.timer:null;if(timer)clearInterval(timer);
function now(){return new Date().toISOString()}
function ack(id,p){try{document.dispatchEvent(new CustomEvent(AE,{detail:JSON.stringify(Object.assign({version:"1.0",requestId:id||null,timestamp:now()},p||{}))}))}catch(_){}}
function audio(t){return!!t&&t.kind==="audio"&&typeof t.id==="string"}
function known(t){return audio(t)&&tracks.has(t.id)}
function remember(t){if(!audio(t))return;tracks.set(t.id,t);try{if(muted)t.enabled=false}catch(_){}}
function stream(s){try{s.getAudioTracks().forEach(remember)}catch(_){}return s}
function sender(s){if(!s)return;try{if(audio(s.track))remember(s.track);if(known(s.track))senders.add(s)}catch(_) {}}
function patchGum(){try{var md=navigator.mediaDevices;if(!md||typeof md.getUserMedia!=="function")return;var cur=md.getUserMedia;if(cur.__signalMicWrapped){patches.gum=true;return}var orig=cur.bind(md),wrap=function(c){return orig(c).then(function(s){if(c&&c.audio)stream(s);return s})};Object.defineProperty(wrap,"__signalMicWrapped",{value:true});Object.defineProperty(md,"getUserMedia",{value:wrap,configurable:true,writable:true});patches.gum=true}catch(_){}}
function patchPC(){try{var C=window.RTCPeerConnection;if(!C||!C.prototype)return;var p=C.prototype;
if(typeof p.getSenders==="function"&&!p.getSenders.__signalMicWrapped){var og=p.getSenders,gw=function(){var a=og.apply(this,arguments)||[];a.forEach(sender);return a};Object.defineProperty(gw,"__signalMicWrapped",{value:true});Object.defineProperty(p,"getSenders",{value:gw,configurable:true,writable:true})}
if(typeof p.addTrack==="function"&&!p.addTrack.__signalMicWrapped){var oa=p.addTrack,aw=function(t){var s=oa.apply(this,arguments);if(audio(t)){remember(t);sender(s);if(muted)try{t.enabled=false}catch(_){}}return s};Object.defineProperty(aw,"__signalMicWrapped",{value:true});Object.defineProperty(p,"addTrack",{value:aw,configurable:true,writable:true});patches.addTrack=true}
if(typeof p.addTransceiver==="function"&&!p.addTransceiver.__signalMicWrapped){var ot=p.addTransceiver,tw=function(t){var r=ot.apply(this,arguments);if(audio(t)){remember(t);sender(r&&r.sender);if(muted)try{t.enabled=false}catch(_) {}}return r};Object.defineProperty(tw,"__signalMicWrapped",{value:true});Object.defineProperty(p,"addTransceiver",{value:tw,configurable:true,writable:true});patches.addTransceiver=true}
}catch(_){}try{var sp=window.RTCRtpSender&&window.RTCRtpSender.prototype;if(sp&&typeof sp.replaceTrack==="function"&&!sp.replaceTrack.__signalMicWrapped){var or=sp.replaceTrack,rw=function(t){if(audio(t)){remember(t);if(muted)try{t.enabled=false}catch(_) {}}var r=or.apply(this,arguments);if(known(t))sender(this);return r};Object.defineProperty(rw,"__signalMicWrapped",{value:true});Object.defineProperty(sp,"replaceTrack",{value:rw,configurable:true,writable:true});patches.replaceTrack=true}}catch(_){}}
function patchClone(){try{var p=window.MediaStreamTrack&&window.MediaStreamTrack.prototype;if(!p||typeof p.clone!=="function"||p.clone.__signalMicWrapped)return;var oc=p.clone,cw=function(){var c=oc.apply(this,arguments);if(known(this)){remember(c);if(muted)try{c.enabled=false}catch(_) {}}return c};Object.defineProperty(cw,"__signalMicWrapped",{value:true});Object.defineProperty(p,"clone",{value:cw,configurable:true,writable:true});patches.clone=true}catch(_){}}
function patch(){patchGum();patchPC();patchClone()}
function report(){var live=Array.from(tracks.values()).filter(function(t){try{return t.readyState!=="ended"}catch(_){return false}});tracks.clear();live.forEach(function(t){tracks.set(t.id,t)});Array.from(senders).forEach(function(s){try{if(!s.track||s.track.readyState==="ended"||!known(s.track))senders.delete(s)}catch(_){}});
var tok=live.length>0&&live.every(function(t){try{return t.enabled===!muted}catch(_){return false}}),sok=senders.size===0||Array.from(senders).every(function(s){try{return!!s.track&&s.track.enabled===!muted}catch(_){return false}});return{trackCount:live.length,senderCount:senders.size,verified:tok&&sok}}
function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms)})}
async function stableReport(samples,gap){var first=null,last=null;for(var i=0;i<samples;i+=1){last=report();if(!last.verified)return Object.assign({},last,{stable:false,stableSamples:i+1});if(!first)first=last;else if(last.trackCount!==first.trackCount||last.senderCount!==first.senderCount)return Object.assign({},last,{verified:false,stable:false,unstable:true,stableSamples:i+1});if(i+1<samples)await wait(gap)}return Object.assign({},last,{stable:true,stableSamples:samples})}
async function forceMute(id){muted=true;state.muted=true;patch();tracks.forEach(function(t){try{if(t.readyState!=="ended")t.enabled=false}catch(_) {}});var r=await stableReport(3,20);ack(id,{ok:r.verified&&r.stable,muted:true,verified:r.verified&&r.stable,stable:!!r.stable,stableSamples:r.stableSamples||0,trackCount:r.trackCount,senderCount:r.senderCount,patches:patches,error:r.verified&&r.stable?null:"No se pudo verificar de forma estable la pista saliente del micrófono."})}
async function unmute(id){
patch();
var recoveredBaseline=false;
var before=await stableReport(2,15);
if(!before.verified||!before.stable){
  // A hotload or platform track transition can leave a live track briefly inconsistent.
  // Re-establish and verify a muted baseline, then continue this same explicit unmute request.
  muted=true;state.muted=true;
  tracks.forEach(function(t){try{if(t.readyState!=="ended")t.enabled=false}catch(_){}});
  var safe=await stableReport(3,25);
  if(!safe.verified||!safe.stable||Number(safe.trackCount||0)<1){
    ack(id,{ok:false,muted:true,verified:false,stable:!!safe.stable,stableSamples:safe.stableSamples||0,trackCount:safe.trackCount,senderCount:safe.senderCount,error:"No se libera el micrófono: no fue posible restablecer una pista saliente viva y estable.",recoveryBaselineAttempted:true});
    return;
  }
  recoveredBaseline=true;
}
muted=false;state.muted=false;
tracks.forEach(function(t){try{if(t.readyState!=="ended")t.enabled=true}catch(_){}});
var r=await stableReport(3,20);
if(!r.verified||!r.stable){
  muted=true;state.muted=true;
  tracks.forEach(function(t){try{if(t.readyState!=="ended")t.enabled=false}catch(_){}});
  r=await stableReport(3,20);
  ack(id,{ok:false,muted:true,verified:false,stable:!!r.stable,stableSamples:r.stableSamples||0,trackCount:r.trackCount,senderCount:r.senderCount,error:"El unmute no pudo verificarse de forma estable; el micrófono permanece silenciado.",recoveredBaseline:recoveredBaseline});
  return;
}
ack(id,{ok:true,muted:false,verified:true,stable:true,stableSamples:r.stableSamples||3,trackCount:r.trackCount,senderCount:r.senderCount,patches:patches,recoveredBaseline:recoveredBaseline});
}
document.addEventListener(CE,function(e){var m=null;try{m=JSON.parse(String(e&&e.detail||""))}catch(_){}if(!m||m.schema!=="signal-main-mic-command/v1")return;if(m.op==="set"){if(m.muted)forceMute(m.requestId);else unmute(m.requestId)}else if(m.op==="probe"){patch();stableReport(2,15).then(function(r){ack(m.requestId,{ok:true,muted:muted,verified:r.verified,stable:!!r.stable,stableSamples:r.stableSamples||0,trackCount:r.trackCount,senderCount:r.senderCount,patches:patches})}).catch(function(error){ack(m.requestId,{ok:false,muted:muted,verified:false,stable:false,error:String(error),patches:patches})})}},true);
var state=old||{version:"1.0",startedAt:now(),commandEvent:CE,ackEvent:AE,tracks:tracks,senders:senders,patches:patches,muted:muted,timer:null};
state.tracks=tracks;state.senders=senders;state.patches=patches;state.muted=muted;patch();
timer=setInterval(function(){patch();if(muted)tracks.forEach(function(t){try{if(t.readyState!=="ended")t.enabled=false}catch(_) {}})},50);
state.timer=timer;state.lastPatchedAt=now();window[K]=state;
})();