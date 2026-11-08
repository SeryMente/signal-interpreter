import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync('extension/presence-guard.js','utf8');
const PROFILE='https://app.cloudinterpreter.com/profile/cmu2wuz1v0uwr07adbzb9djfz';
let checks=0;
function eq(a,b,label){assert.equal(a,b,label);checks++;}
function harness(seed={}){
 let now=100000,idle='active',hold=null;
 const events=()=>({listeners:[],addListener(f){this.listeners.push(f)},emit(...args){this.listeners.forEach(f=>f(...args))}});
 const data={effectifConfig:{autoAnswerEnabled:true,presenceIdleSeconds:60},...seed};
 const changed=events(),stateChanged=events(),messages=events(),intervals=[];
 const chrome={runtime:{id:'id',getURL:p=>'chrome-extension://id/'+p,onMessage:messages,lastError:null},idle:{onStateChanged:stateChanged,queryState:(s,cb)=>{if(hold)hold(cb);else cb(idle)},setDetectionInterval:s=>{}},storage:{onChanged:changed,local:{get:async keys=>Object.fromEntries(keys.map(k=>[k,data[k]])),set:async patch=>{let c={};for(let k in patch){c[k]={oldValue:data[k],newValue:patch[k]};data[k]=patch[k]}changed.emit(c,'local')}}},tabs:{get:async()=>({url:PROFILE}),query:async()=>[]}};
 const ctx={chrome,Date:class extends Date{static now(){return now}},setInterval:f=>intervals.push(f),setTimeout,clearTimeout,self:{}};
 ctx.self=ctx;ctx.URL=URL;vm.createContext(ctx);vm.runInContext(code,ctx);
 const sender={id:'id',frameId:0,url:PROFILE,tab:{id:7,url:PROFILE}};
 return {guard:ctx.SignalPresenceGuard,chrome,data,sender,stateChanged,intervals,setIdle:v=>idle=v,setNow:v=>now=v,hold:f=>hold=f,message:(m,s)=>new Promise(resolve=>messages.listeners[0](m,s,resolve))};
}
const h=harness();
eq(h.guard.snapshot().armed,false,'upgraded stored enabled does not arm');
eq((await h.guard.authorize({modality:'OPI',requestId:'a'},h.sender)).ok,false,'unarmed blocks');
eq((await h.guard.arm(150)).ok,false,'revoked 150s never implicit policy');
eq((await h.message({type:'SIGNAL_PRESENCE_ARM',idleSeconds:60},h.sender)).ok,false,'web content cannot arm');
eq((await h.guard.arm(60)).ok,true,'explicit valid selection arms');
eq((await h.guard.authorize({modality:'VRI',requestId:'v'},h.sender)).ok,false,'video manual only');
eq((await h.guard.authorize({modality:'UNKNOWN',requestId:'u'},h.sender)).ok,false,'unknown modality blocks');
eq((await h.guard.authorize({modality:'OPI',requestId:'f'},{...h.sender,frameId:1})).ok,false,'subframe blocks');
eq((await h.guard.authorize({modality:'OPI',requestId:'o'},{...h.sender,url:'https://example.org'})).ok,false,'wrong origin blocks');
const trailingSlash=harness();
await trailingSlash.guard.arm(60);
const slashSender={...trailingSlash.sender,url:PROFILE+'/',tab:{id:7,url:PROFILE+'/'}};
eq((await trailingSlash.guard.authorize({modality:'OPI',requestId:'slash'},slashSender)).ok,true,'profile trailing slash normalizes consistently with content-page readiness');
const querySender={...trailingSlash.sender,url:PROFILE+'/?view=logs#history',tab:{id:7,url:PROFILE+'/?view=logs#history'}};
eq((await trailingSlash.guard.authorize({modality:'OPI',requestId:'query'},querySender)).ok,false,'active authorization lease prevents a second overlapping request');
const badFrame=await h.guard.authorize({modality:'OPI',requestId:'bad-frame'},{...h.sender,frameId:1});
eq(badFrame.failedCheck,'mainFrame','diagnostics identify a subframe sender');
eq(badFrame.senderChecks.mainFrame,false,'diagnostics return booleans only');
const badTabUrl=await h.guard.authorize({modality:'OPI',requestId:'bad-tab-url'},{...h.sender,tab:{id:7,url:'https://example.org/'}});
eq(badTabUrl.failedCheck,'tabUrlAllowed','diagnostics identify an unauthorized tab URL');
const badFrameUrl=await h.guard.authorize({modality:'OPI',requestId:'bad-frame-url'},{...h.sender,url:'https://example.org/'});
eq(badFrameUrl.failedCheck,'frameUrlAllowed','diagnostics identify an unauthorized frame URL');
eq((await h.guard.authorize({modality:'OPI',requestId:'a'},h.sender)).ok,true,'verified phone gets short-lived grant');
eq((await h.guard.authorize({modality:'OPI',requestId:'a'},h.sender)).ok,false,'same grant request cannot replay');
eq((await h.guard.authorize({modality:'OPI',requestId:'other'}, {...h.sender,tab:{id:8,url:PROFILE}})).ok,false,'cross-tab reservation blocks double click');

const lease=harness();await lease.guard.arm(60);
const leaseGrant=await lease.guard.authorize({modality:'OPI',requestId:'lease-1'},lease.sender);
eq(leaseGrant.ok,true,'eligible OPI receives a single-use authorization lease');
eq((await lease.guard.authorize({modality:'OPI',requestId:'lease-2'},lease.sender)).error,'authorization-lease-active','active lease blocks overlapping answer attempts');
eq((await lease.message({type:'SIGNAL_PRESENCE_RELEASE',requestId:'wrong'},lease.sender)).error,'lease-mismatch','wrong release token cannot free another attempt');
eq((await lease.message({type:'SIGNAL_PRESENCE_RELEASE',requestId:'lease-1'},{...lease.sender,tab:{id:8,url:PROFILE}})).error,'lease-mismatch','another tab cannot release the lease');
const released=await lease.message({type:'SIGNAL_PRESENCE_RELEASE',requestId:'lease-1'},lease.sender);
eq(released.ok,true,'lease owner can release by exact request identity');
eq(released.released,true,'matching lease is released');
eq(lease.guard.snapshot().armed,true,'releasing a failed attempt does not disarm operator presence');
eq((await lease.guard.authorize({modality:'OPI',requestId:'lease-2'},lease.sender)).ok,true,'next eligible call can obtain a lease immediately after release');
const callUrl='https://app.cloudinterpreter.com/call/call-fixture';
const callSender={...lease.sender,url:callUrl,tab:{id:7,url:callUrl}};
eq((await lease.message({type:'SIGNAL_PRESENCE_RELEASE',requestId:'lease-2'},callSender)).released,true,'confirmed call route can release its own authorization lease');

eq((await lease.message({type:'SIGNAL_PRESENCE_RELEASE',requestId:'lease-2'},{...callSender,url:'https://example.org/call/call-fixture'})).error,'sender-not-authorized','foreign origin cannot release a lease');
eq((await lease.message({type:'SIGNAL_PRESENCE_RELEASE',requestId:'lease-2'},{...callSender,url:'https://app.cloudinterpreter.com/dashboard'})).error,'sender-not-authorized','unapproved platform route cannot release a lease');

eq((await lease.guard.authorize({modality:'OPI',requestId:'lease-1'},lease.sender)).error,'stale-or-used','released request id remains non-replayable');
const expired=harness();await expired.guard.arm(60);
await expired.guard.authorize({modality:'OPI',requestId:'lease-expired'},expired.sender);
expired.setNow(116000);
eq((await expired.guard.authorize({modality:'OPI',requestId:'after-expiry'},expired.sender)).ok,true,'lease self-expires if content runtime disappears');

h.setIdle('idle');h.stateChanged.emit('idle');eq(h.guard.snapshot().armed,false,'OS idle revokes');
h.setIdle('active');h.stateChanged.emit('active');eq(h.guard.snapshot().armed,false,'return never rearms');
await h.guard.arm(60);h.stateChanged.emit('locked');h.stateChanged.emit('active');eq(h.guard.snapshot().armed,false,'unlock never rearms');
await h.guard.arm(60);h.setNow(180001);eq((await h.guard.authorize({modality:'OPI',requestId:'s'},h.sender)).ok,false,'sleep/long observation gap revokes');
await h.guard.arm(60);await h.chrome.storage.local.set({signalLabLock:true});eq(h.guard.snapshot().armed,false,'lab immediately revokes');
eq((await h.guard.arm(60)).ok,false,'cannot arm in lab');
await h.chrome.storage.local.set({signalLabLock:false});await h.guard.arm(60);await h.chrome.storage.local.set({effectifConfig:{autoAnswerEnabled:false,presenceIdleSeconds:60}});eq(h.guard.snapshot().armed,false,'config off revokes');
h.data.effectifConfig={autoAnswerEnabled:true,presenceIdleSeconds:60};await h.guard.arm(60);
let release;h.hold(cb=>release=cb);const pending=h.guard.authorize({modality:'OPI',requestId:'race'},h.sender);
await new Promise(r=>setImmediate(r));h.guard.disarm('locked');release('active');eq((await pending).ok,false,'lock racing query invalidates grant');
h.hold(null);await h.guard.arm(60);h.chrome.tabs.get=async()=>({url:PROFILE+'/call/private'});eq((await h.guard.authorize({modality:'OPI',requestId:'route'},h.sender)).ok,false,'live route revalidated');
h.chrome.tabs.get=async()=>{throw Error('closed')};eq((await h.guard.authorize({modality:'OPI',requestId:'closed'},h.sender)).ok,false,'closed tab fails closed');
eq(h.guard.snapshot().armed,false,'verification error revokes');
const missing=harness();delete missing.chrome.idle;eq((await missing.guard.arm(60)).ok,false,'missing permission/API blocks');
const err=harness();err.chrome.runtime.lastError={message:'not allowed'};eq((await err.guard.arm(60)).ok,false,'API error blocks');
const restart=harness({signalPresenceGuard:{armed:true,generation:8}});eq(restart.guard.snapshot().armed,false,'stored arm never survives worker restart');
const duringCall=harness();await duringCall.guard.arm(60);duringCall.chrome.tabs.query=async()=>[{id:9}];eq((await duringCall.guard.authorize({modality:'OPI',requestId:'during-call'},duringCall.sender)).ok,false,'a call in another tab blocks new automatic answer');
const end=harness();await end.guard.arm(60);await end.message({type:'SIGNAL_PRESENCE_END'},end.sender);eq(end.guard.snapshot().armed,false,'ending work session revokes');
// Current media is untouched: the module has no call/hangup/audio mutation surface.
assert(!/\.click\(|hangup|\.pause\(|\.stop\(|getUserMedia|tabCapture/.test(code));checks++;
const platform = harness({ effectifConfig: { autoAnswerEnabled: false, presenceIdleSeconds: 180 } });
const logsUrl = PROFILE + "/logs";
platform.chrome.tabs.get = async () => ({ url: logsUrl });
const logsSender = { ...platform.sender, url: logsUrl, tab: { id: 7, url: logsUrl } };
const platformArm = await platform.message({
  type: "SIGNAL_PRESENCE_PLATFORM_ONLINE", availability: "online", userGesture: true
}, logsSender);
eq(platformArm.ok, true, "trusted Online button arms from the authorized Statistics subroute");
eq(platformArm.state.armed, true, "platform Online event creates ephemeral armed state");
eq(platform.data.effectifConfig.autoAnswerEnabled, true, "platform Online activates the Auto-Answer preference");
eq(platform.data.effectifConfig.presenceIdleSeconds, 180, "platform activation preserves the explicitly selected idle threshold");
eq((await platform.guard.authorize({ modality: "OPI", requestId: "platform-opi" }, logsSender)).ok, true, "OPI authorization accepts the same authorized profile subroute");

const untrustedPlatform = harness({ effectifConfig: { autoAnswerEnabled: false, presenceIdleSeconds: 60 } });
const untrustedResult = await untrustedPlatform.message({
  type: "SIGNAL_PRESENCE_PLATFORM_ONLINE", availability: "online", userGesture: false
}, untrustedPlatform.sender);
eq(untrustedResult.ok, false, "platform state without a trusted user gesture cannot arm");
eq(untrustedPlatform.guard.snapshot().armed, false, "untrusted Online state remains disarmed");

const noThreshold = harness({ effectifConfig: { autoAnswerEnabled: false, presenceIdleSeconds: null } });
const noThresholdResult = await noThreshold.message({
  type: "SIGNAL_PRESENCE_PLATFORM_ONLINE", availability: "online", userGesture: true
}, noThreshold.sender);
eq(noThresholdResult.error, "choose-idle-limit", "platform activation never invents an idle threshold");
eq(noThreshold.guard.snapshot().armed, false, "missing idle policy remains fail-closed");

const foreignProfile = harness({ effectifConfig: { autoAnswerEnabled: false, presenceIdleSeconds: 60 } });
const foreignSender = { ...foreignProfile.sender, url: "https://example.org/profile/logs", tab: { id: 7, url: "https://example.org/profile/logs" } };
eq((await foreignProfile.message({
  type: "SIGNAL_PRESENCE_PLATFORM_ONLINE", availability: "online", userGesture: true
}, foreignSender)).error, "sender-not-authorized", "foreign origin cannot arm from a lookalike route");

await platform.message({ type: "SIGNAL_PRESENCE_END" }, logsSender);
eq(platform.guard.snapshot().armed, false, "Offline/session end from Statistics subroute revokes presence");

console.log(JSON.stringify({suite:'presence-guard',environment:'Node VM / synthetic Chrome APIs',checks,result:'PASS',windowsAccepted:false}));
