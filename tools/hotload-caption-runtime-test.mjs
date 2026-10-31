import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const background=fs.readFileSync('extension/background.js','utf8');
const begin=background.indexOf('  async function hotloadExistingCloudTabs(trigger)');
const end=background.indexOf('  async function recoverAfterRuntimeBoundary',begin);
function harness(options={}){
 const injected=[],events=[],messages=[];let probes=0;
 const state={callId:'synthetic-call',callStartedAt:new Date().toISOString(),callSourceTabId:7,microphoneMuted:false};
 const chrome={runtime:{getManifest:()=>({version:'0.10.39'})},storage:{local:{get:async()=>({effectifState:state})}},tabs:{query:async()=>[{id:7,url:'https://app.cloudinterpreter.com/call/synthetic-call'}],async sendMessage(id,m){messages.push(m);if(m.type==='SIGNAL_CAPTION_OVERLAY_PROBE'){probes++;return{ok:true,ready:options.delayed?probes>1:true,runtimeVersion:options.stale?'0.10.31':'0.10.39',hostMounted:!options.missing,enabled:!options.disabled,rowCount:0};}return{ok:true};}},scripting:{async executeScript(spec){injected.push(spec);}}};
 const sandbox={chrome,console,Date,Number,Object,Promise,String,Map,setTimeout:fn=>{fn();return 1;},hotloadLastExistingTabScanAt:0,HOTLOAD_EXISTING_TAB_SCAN_MIN_MS:5000,AUTHORIZED_ORIGIN:'https://app.cloudinterpreter.com',isAuthorizedCloudUrl:()=>true,isCloudCallUrl:url=>url.includes('/call/'),normalizeHotloadState:x=>x,normalizeStateShape:x=>x,baseState:()=>({}),record:(action,payload)=>events.push({action,payload})};
 sandbox.runExtensionScript=spec=>sandbox.chrome.scripting.executeScript(spec); sandbox.SignalCaptionLab=sandbox.SignalCaptionLab||{active:()=>false}; vm.createContext(sandbox);vm.runInContext(background.slice(begin,end),sandbox);return{sandbox,injected,events,messages,probes:()=>probes};
}
const h=harness({delayed:true});let result=await h.sandbox.hotloadExistingCloudTabs('runtime-start');assert.equal(result.ok,true);assert.equal(h.probes(),2,'wait for asynchronous storage before considering mounted');
assert.ok(h.injected.some(s=>JSON.stringify(s.files)===JSON.stringify(['live-caption-core.js','live-caption-overlay.js'])));
assert.ok(h.events.some(e=>e.action==='HOTLOAD_CAPTION_OVERLAY_REHYDRATED'&&e.payload.runtimeVersion==='0.10.39'));
assert.ok(h.messages.some(m=>m.type==='EFFECTIF_HOTLOAD_REPLACE'));
for(const option of [{stale:true},{missing:true}]){const bad=harness(option);result=await bad.sandbox.hotloadExistingCloudTabs('runtime-start');assert.equal(result.ok,false);assert.equal(result.result.errors,1);assert.equal(bad.events.some(e=>e.action==='HOTLOAD_EXISTING_TAB_REHYDRATED'),false,'never report success for old/missing overlay');}
const disabled=harness({missing:true,disabled:true});assert.equal((await disabled.sandbox.hotloadExistingCloudTabs('runtime-start')).ok,true,'disabled preference must stay disabled');
assert.equal(h.injected.some(s=>s.func&&/location|reload|navigate/.test(String(s.func))),false,'no navigation of call page');
assert.ok(background.includes('captureExpected: false, captureStatus: "native-text-only"'));
console.log('HOTLOAD_CAPTION_RUNTIME_TEST=PASS');

function schedulerHarness(options={}){
 const state={callId:'synthetic-call',callStartedAt:new Date().toISOString(),callSourceTabId:7,hotLoadLease:{},hotLoadUpdate:{}};const log=[];
 const chrome={tabs:{get:async()=>({url:options.invalidTab?'https://other.example/':'https://app.cloudinterpreter.com/call/synthetic-call'})},runtime:{getManifest:()=>({version:'0.10.39'}),reload:()=>log.push('reload')},storage:{local:{get:async()=>({effectifState:state}),set:async()=>log.push('persist')}}};
 const sb={chrome,Date,Number,String,Object,Promise,setTimeout:fn=>fn(),hotloadReloadScheduled:false,hasActiveCall:s=>!!s.callId,normalizeHotloadState:x=>x,normalizeStateShape:x=>x,baseState:()=>({hotLoadLease:{},hotLoadUpdate:{}}),cloneStateForStorage:x=>x,isAuthorizedCloudUrl:u=>u.startsWith('https://app.cloudinterpreter.com/'),isCloudCallUrl:u=>u.includes('/call/'),SignalCaptionBridge:{isFresh:()=>!!options.nativeFresh},SignalGroqTranscriber:{ready:async()=>options.ready!==false},HOTLOAD_SCHEMA:'signal-hotload/v1',signalActiveSessionId:null,iso:()=>new Date().toISOString(),record:(action,payload)=>log.push({action,payload})};
 sb.runExtensionScript=spec=>sb.chrome.scripting.executeScript(spec); sb.SignalCaptionLab=sb.SignalCaptionLab||{active:()=>false}; vm.createContext(sb);vm.runInContext(background.slice(background.indexOf('  async function scheduleSafeRuntimeReload'),background.indexOf('  async function coordinateUpdateAvailability')),sb);return{sb,log};
}
for(const option of [{nativeFresh:false},{nativeFresh:true,invalidTab:true}]){const blocked=schedulerHarness(option);assert.equal(await blocked.sb.scheduleSafeRuntimeReload('test',true),false);assert.equal(blocked.log.includes('reload'),false);}
const valid=schedulerHarness({nativeFresh:true});assert.equal(await valid.sb.scheduleSafeRuntimeReload('test',true),true);assert.ok(valid.log.indexOf('persist')<valid.log.indexOf('reload'),'lease persisted before extension-only reload');
const optIn=schedulerHarness();assert.equal(await optIn.sb.scheduleSafeRuntimeReload('test',false),false);assert.equal(optIn.log.includes('reload'),false);
console.log('HOTLOAD_ACTIVE_CALL_PREFLIGHT=PASS');
