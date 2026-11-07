import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const content=fs.readFileSync('extension/content.js','utf8');
const helper=content.slice(content.indexOf('  function releasePresenceAuthorization('),content.indexOf('  async function autoAnswer() {'));
const fn=helper+content.slice(content.indexOf('  async function autoAnswer() {'),content.indexOf('  function emitAutoAnswerReadiness'));
let checks=0;
function harness({mode='Audio interpreting',grant=true,labLocked=false,presenceArmed=true,autoEnabled=true,availability='online',buttonPresent=true}={}){
 let clicks=0,release=null,route=false,visible=true,events=[],releaseRequests=[],timers=[];
 const button={disabled:false,isConnected:true,textContent:'Connect',getAttribute:()=>null,click(){clicks++}};
 const dialog={innerText:'Caller is requesting interpretation '+mode,querySelectorAll:()=>buttonPresent?[button]:[],contains:el=>el===button};
 const ctx={
  Date,Promise,Set,WeakSet,Map,Array,Math,performance,crypto,
  chrome:{runtime:{sendMessage:(message)=>{
   if(message.type==='SIGNAL_PRESENCE_RELEASE'){releaseRequests.push(message);return Promise.resolve({ok:true,released:true});}
   return new Promise(r=>{release=r});
  }}},
  document:{querySelectorAll:()=>[dialog]},
  config:{autoAnswerEnabled:autoEnabled,observationEnabled:true},
  labSafetyLock:labLocked,presenceState:{armed:presenceArmed,generation:2,reason:presenceArmed?'explicit-availability':'worker-start-confirm-again'},
  clickedNodes:new WeakSet(),pendingConnect:new WeakSet(),fingerprints:new Map(),
  lastIncomingSignature:'',incomingAttemptId:null,lastIncomingBlockedSignature:'',
  answerFlow:{},ANSWER_LEASE_MARKER:'lease',window:{},integrity:{permittedConnectClicks:0},
  answerWatchdog:null,RUNTIME_VERSION:'0.10.39',DIALOG:'dialog',runtimeMarker:{active:true},
  syncPageFavicon(){},currentCallId:()=>route?'active':null,
  normalized:s=>String(s||''),safe:s=>String(s||''),visibleElement:()=>visible,
  emit(action,payload,level){events.push({action,payload:payload||{},level:level||'info'});},
  emitIntegrity(){},iso:()=>new Date().toISOString(),cleanupFingerprints(){},
  setTimeout:(fn,ms)=>{timers.push({fn,ms,cleared:false});return timers.length;},
  clearTimeout:id=>{if(timers[id-1])timers[id-1].cleared=true;}
 };
 ctx.autoAnswerReadiness=function(){
  const blockedReasons=[];
  if(ctx.labSafetyLock)blockedReasons.push('LAB_SAFETY_LOCK');
  if(ctx.presenceState.armed!==true)blockedReasons.push('WORKER_START_CONFIRM_AGAIN');
  if(ctx.config.autoAnswerEnabled!==true)blockedReasons.push('AUTO_ANSWER_DISABLED');
  if(ctx.availability!=='online')blockedReasons.push('AVAILABILITY_OFFLINE');
  return {ready:blockedReasons.length===0,blockedReasons,availability:ctx.availability||availability,
    authorizedProfile:true,configEnabled:ctx.config.autoAnswerEnabled,labSafetyLock:ctx.labSafetyLock,
    presenceArmed:ctx.presenceState.armed,presenceReason:ctx.presenceState.reason,presenceGeneration:ctx.presenceState.generation};
 };
 ctx.availability=availability;
 ctx.isAutoAnswerReady=()=>ctx.autoAnswerReadiness().ready;
 vm.createContext(ctx);vm.runInContext(fn+'\nthis.run=autoAnswer;',ctx);
 return {
  ctx,button,dialog,clicks:()=>clicks,events:()=>events,
  release:()=>{if(release)release(grant?{ok:true,generation:2,expiresAt:Date.now()+500}: {ok:false,error:'not-authorized'});},
  releaseRequests:()=>releaseRequests,timers:()=>timers,
  fireTimeouts:()=>timers.filter(t=>!t.cleared&&t.ms===7000).forEach(t=>t.fn()),
  route:v=>route=v,visible:v=>visible=v
 };
}
async function run(h){const pending=h.ctx.run();h.release();await pending;await new Promise(r=>setImmediate(r));}
let h=harness();await run(h);assert.equal(h.clicks(),1);checks++;
h.ctx.run();await new Promise(r=>setImmediate(r));assert.equal(h.clicks(),1);checks++;
for(const mode of ['Video interpreting','unidentified']){
 h=harness({mode});await run(h);assert.equal(h.clicks(),0,mode);
 assert(h.events().some(e=>e.action==='INCOMING_DIALOG_DETECTED'),'incoming dialog must be observed');
 assert(h.events().some(e=>e.action==='AUTO_ANSWER_BLOCKED'),'non-OPI modality must be logged as blocked');checks++;
}
h=harness({grant:false});await run(h);assert.equal(h.clicks(),0);
assert(h.events().some(e=>e.action==='AUTO_ANSWER_AUTHORIZATION_BLOCKED'));assert.equal(h.releaseRequests().length,0,'denied authorization has no lease to release');checks++;
for(const mutate of [
 h=>h.ctx.labSafetyLock=true,
 h=>h.ctx.presenceState.armed=false,
 h=>h.ctx.presenceState.generation=3,
 h=>h.ctx.config.autoAnswerEnabled=false,
 h=>h.route(true),
 h=>h.button.disabled=true,
 h=>h.button.isConnected=false,
 h=>h.visible(false),
 h=>h.dialog.innerText='Video interpreting'
]){
 h=harness();const pending=h.ctx.run();mutate(h);h.release();await pending;await new Promise(r=>setImmediate(r));
 assert.equal(h.clicks(),0,'post-await revalidation');
 assert.equal(h.releaseRequests().length,1,'successful grant is released when post-await validation fails');checks++;
}
h=harness();h.ctx.run();h.ctx.run();h.release();await new Promise(r=>setImmediate(r));assert.equal(h.clicks(),1,'concurrent DOM triggers single click');checks++;

h=harness();const timed=h.ctx.run();h.release();await timed;h.fireTimeouts();await new Promise(r=>setImmediate(r));
assert.equal(h.clicks(),1,'watchdog never issues a second platform click');
assert.equal(h.releaseRequests().length,1,'route timeout releases only the matching authorization lease');
assert(h.events().some(e=>e.action==='CONNECT_ROUTE_TIMEOUT'),'route timeout is observed');
assert(!JSON.stringify(h.events()).includes('requestId'),'authorization token is not included in telemetry');checks++;
h=harness();const upgraded=h.ctx.run();h.ctx.runtimeMarker.active=false;h.release();await upgraded;await new Promise(r=>setImmediate(r));
assert.equal(h.clicks(),0,'replaced runtime cannot click after grant returns');
assert.equal(h.releaseRequests().length,1,'replaced runtime releases its grant');checks++;

for(const options of [
 {labLocked:true},{presenceArmed:false},{autoEnabled:false},{availability:'offline'}
]){
 h=harness(options);await run(h);assert.equal(h.clicks(),0);
 assert(h.events().some(e=>e.action==='INCOMING_DIALOG_DETECTED'),'blocked call must still be observed');
 assert(h.events().some(e=>e.action==='AUTO_ANSWER_BLOCKED'),'block reason must be emitted');checks++;
}
h=harness({buttonPresent:false});await run(h);assert.equal(h.clicks(),0);
assert(h.events().some(e=>e.action==='CONNECT_BUTTON_NOT_FOUND'));checks++;
const worker=fs.readFileSync('extension/background.js','utf8'),popup=fs.readFileSync('extension/ui/popup.js','utf8');
for(const source of [content,worker,popup]){assert(source.includes('autoAnswerEnabled: false'));checks++;}
assert(worker.includes('SignalPresenceGuard.toggleFromKeyboard()'));checks++;
assert(!worker.includes('config.autoAnswerEnabled = !config.autoAnswerEnabled'));checks++;
assert(content.includes('next === "offline"'));checks++;
assert(content.includes('if (readinessTimer) { clearInterval(readinessTimer); readinessTimer = null; }'));checks++;
console.log(JSON.stringify({suite:'presence-connect',environment:'Node VM / actual content function with synthetic DOM',checks,result:'PASS',windowsAccepted:false}));
