import fs from "node:fs";import vm from "node:vm";
const background=fs.readFileSync("extension/background.js","utf8"),content=fs.readFileSync("extension/content.js","utf8");
if(!background.includes("if(cachedConfig.soundEnabled!==false){"))throw Error("microphone-toggle-sound-config-regression");
if(background.includes("if(config.soundEnabled!==false){"))throw Error("microphone-toggle-undefined-config-regression");
if(!background.includes("function requestKeyboardMicrophoneToggle(source)"))throw Error("hotkey-command-and-fallback-dispatch-missing");
if(!background.includes("fail-closed-on-unmute-verification-error"))throw Error("fail-closed-unmute-recovery-missing");
if(background.includes("never-reapply-stale-mute-on-unmute-failure"))throw Error("unsafe-unmute-error-policy-regression");
if(!background.includes("EXTENSION_MICROPHONE_UNMUTE_BLOCKED_NO_ACTIVE_CALL"))throw Error("idle-unmute-guard-missing");
if(!background.includes("microphoneMuted: true,"))throw Error("idle-default-mute-missing");
const main=fs.readFileSync("extension/mic-guard-main.js","utf8");
if(!main.includes("var muted=old?!!old.muted:true;"))throw Error("main-world-default-mute-missing");
if(!main.includes("recoveryBaselineAttempted")||!main.includes("recoveredBaseline:recoveredBaseline"))throw Error("pre-unmute-baseline-recovery-missing");
if(background.includes("var recoveryMuted=previousMuted;"))throw Error("previous-muted-state-can-lock-an-unmute");
if(!content.includes("EXTENSION_MICROPHONE_KEYBOARD_FALLBACK_TRIGGERED"))throw Error("content-hotkey-fallback-missing");
const helperStart=background.indexOf("function pendingMicrophoneUnmuteEligible");
const helperEnd=background.indexOf("  async function hotloadHeartbeat",helperStart);
if(helperStart<0||helperEnd<=helperStart)throw Error("late-track-unmute-eligibility-helper-missing");
const lateTrackEligible=vm.runInNewContext(background.slice(helperStart,helperEnd)+"; pendingMicrophoneUnmuteEligible");
const pendingState={microphoneMuteRequested:false,microphoneMuted:true,microphoneMuteStatus:"error",microphoneOutputStatus:"error"};
if(!lateTrackEligible(pendingState,{verified:true,muted:true,trackCount:1},true))throw Error("explicit-unmute-intent-must-retry-after-live-track-appears");
for(const outputStatus of ["pending","applied"]){
  if(!lateTrackEligible({...pendingState,microphoneOutputStatus:outputStatus},{verified:true,muted:true,trackCount:1},true))throw Error("late-track-retry-must-survive-heartbeat-output-status-"+outputStatus);
}
if(lateTrackEligible({...pendingState,microphoneMuteStatus:"applied"},{verified:true,muted:true,trackCount:1},true))throw Error("verified-mute-state-must-not-override-completed-user-intent");
if(lateTrackEligible(pendingState,{verified:true,muted:true,trackCount:0},true))throw Error("no-track-must-remain-muted");
if(lateTrackEligible(pendingState,{verified:true,muted:true,trackCount:1},false))throw Error("late-track-retry-requires-active-call");
if(lateTrackEligible({...pendingState,microphoneMuteRequested:true},{verified:true,muted:true,trackCount:1},true))throw Error("late-track-retry-requires-explicit-unmute-intent");
if(!background.includes("EXTENSION_MICROPHONE_LATE_TRACK_UNMUTE_RECOVERED"))throw Error("late-track recovery must be observable without audio/transcript data");
if(!background.includes('state.microphoneOutputMuted=micProbe&&typeof micProbe.muted==="boolean"?!!micProbe.muted:expectedMuted;'))throw Error("heartbeat must report observed output mute state rather than desired state");
const internalStart=background.indexOf("async function setExtensionMicrophoneMutedInternal");
const internalEnd=background.indexOf("  function setExtensionMicrophoneMuted(muted, source)",internalStart);
if(internalStart<0||internalEnd<=internalStart)throw Error("background-microphone-guard-boundary-missing");
const noCallWrites=[],noCallEvents=[];
const noCallGuard=vm.runInNewContext(background.slice(internalStart,internalEnd)+";setExtensionMicrophoneMutedInternal",{
  chrome:{storage:{local:{get:async()=>({effectifState:{}}),set:async patch=>noCallWrites.push(patch)}}},
  baseState:()=>({}),normalizeStateShape:value=>value,normalizeHotloadState:value=>value,
  hasActiveCall:()=>false,cloneStateForStorage:value=>JSON.parse(JSON.stringify(value)),
  record:(...args)=>noCallEvents.push(args)
});
const noCallResult=await noCallGuard(false,"regression-no-active-call");
if(noCallResult.ok!==false||noCallResult.reasonCode!=="call-not-active"||noCallResult.muted!==true)throw Error("unmute-without-active-call-must-be-blocked");
const blockedState=noCallWrites.at(-1)?.effectifState;
if(!blockedState||blockedState.microphoneMuted!==true||blockedState.microphoneOutputMuted!==true||blockedState.microphoneMuteStatus!=="blocked"||blockedState.microphoneOutputStatus!=="idle-safe")throw Error("blocked-no-call-state-must-remain-muted");
if(!noCallEvents.some(event=>event[0]==="EXTENSION_MICROPHONE_UNMUTE_BLOCKED_NO_ACTIVE_CALL"))throw Error("blocked-no-call-unmute-event-must-be-recorded");
class E{constructor(){this.l=new Map()}addEventListener(t,f){let a=this.l.get(t)||[];a.push(f);this.l.set(t,a)}removeEventListener(t,f){this.l.set(t,(this.l.get(t)||[]).filter(x=>x!==f))}dispatchEvent(e){for(const f of(this.l.get(e.type)||[]).slice())f(e)}}
class T extends E{constructor(id){super();this.kind="audio";this.id=id;this.enabled=true;this.readyState="live"}clone(){return new T(this.id+"-clone")}}
class S{constructor(t){this.t=t}getAudioTracks(){return[this.t]}}
class Sender{constructor(t){this.track=t}replaceTrack(t){this.track=t;return Promise.resolve()}}
class PC{constructor(){this.s=[]}addTrack(t){const s=new Sender(t);this.s.push(s);return s}getSenders(){return this.s.slice()}}
class CE{constructor(type,i){this.type=type;this.detail=i&&i.detail}}
const document=new E(),ints=[],navigator={mediaDevices:{getUserMedia:async()=>new S(new T("mic"))}};
const preTrack=new T("preexisting"),prePc=new PC(),preSender=prePc.addTrack(preTrack,{});
const sb={console,Map,Set,Array,Object,Promise,Date,JSON,String,Number,Boolean,Math,navigator,document,CustomEvent:CE,setInterval:f=>(ints.push(f),ints.length-1),clearInterval:i=>{ints[i]=null},setTimeout};sb.window=sb;sb.RTCPeerConnection=PC;sb.RTCRtpSender=Sender;sb.MediaStreamTrack=T;vm.runInNewContext(main,sb);
const a=[];document.addEventListener("__SIGNAL_INTERPRETER_MIC_ACK_V1__",e=>a.push(JSON.parse(e.detail)));
async function cmd(m,id){document.dispatchEvent(new CE("__SIGNAL_INTERPRETER_MIC_COMMAND_V1__",{detail:JSON.stringify({schema:"signal-main-mic-command/v1",op:"set",requestId:id,muted:m})}));for(let i=0;i<50&&!a.some(x=>x.requestId===id);i++)await new Promise(r=>setTimeout(r,10));return a.findLast(x=>x.requestId===id)}
const st=await navigator.mediaDevices.getUserMedia({audio:true}),tr=st.getAudioTracks()[0],pc=new sb.RTCPeerConnection(),se=pc.addTrack(tr,st);prePc.getSenders();
let x=await cmd(true,"1");if(!(x.verified&&x.muted&&x.stable&&x.stableSamples===3&&!tr.enabled&&!preTrack.enabled&&x.senderCount===2&&x.trackCount===2))throw Error("mute");
tr.enabled=true;for(const f of ints)if(f)f();if(tr.enabled)throw Error("enforce");
tr.enabled=true;x=await cmd(false,"2");if(!(x.verified&&!x.muted&&x.stable&&tr.enabled&&se.track.enabled&&x.recoveredBaseline===true))throw Error("unmute-after-reestablishing-muted-baseline");
const cl=tr.clone();await se.replaceTrack(cl);x=await cmd(true,"3");if(!(x.verified&&x.muted&&x.stable&&!cl.enabled))throw Error("replace");
se.track=null;preSender.track=null;cl.readyState="ended";preTrack.readyState="ended";tr.readyState="ended";x=await cmd(false,"4");if(x.verified||!x.muted)throw Error("no-live-track-unmute");
console.log("MICROPHONE_MAIN_GUARD_TEST=PASS");