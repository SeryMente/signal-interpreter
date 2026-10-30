import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const content=fs.readFileSync('extension/content.js','utf8');
const fn=content.slice(
  content.indexOf('  function incomingReadinessBlockers() {'),
  content.indexOf('  function emitAutoAnswerReadiness(reason)')
);
assert(fn.includes('async function autoAnswer()'), 'the live incoming observer must be exercised');

let checks=0;
function harness({
  mode='Audio interpreting', grant=true, labSafetyLock=false,
  presenceArmed=true, autoAnswerEnabled=true, availability='online'
}={}) {
  let clicks=0, release=null, route=false, visible=true;
  const events=[];
  const button={
    disabled:false,isConnected:true,textContent:'Connect',
    getAttribute:()=>null,click(){clicks++;}
  };
  const dialog={
    innerText:'Caller is requesting interpretation '+mode,
    querySelectorAll:()=>[button],contains:el=>el===button
  };
  const ctx={
    Date,Promise,Set,WeakSet,Map,Array,Math,performance,crypto,String,
    chrome:{runtime:{sendMessage:()=>new Promise(resolve=>{release=resolve;})}},
    document:{querySelectorAll:()=>[dialog]},
    config:{autoAnswerEnabled},
    labSafetyLock,
    presenceState:{armed:presenceArmed,generation:2,reason:presenceArmed?'explicit-availability':'worker-start-confirm-again'},
    incomingAttemptId:null,lastIncomingSignature:'',lastIncomingBlockerSignature:'',
    activeCallIncomingAttemptId:null,
    clickedNodes:new WeakSet(),pendingConnect:new WeakSet(),fingerprints:new Map(),
    answerFlow:{},ANSWER_LEASE_MARKER:'lease',window:{},
    integrity:{permittedConnectClicks:0},answerWatchdog:null,
    RUNTIME_VERSION:'0.10.39',DIALOG:'dialog',
    syncPageFavicon(){},
    isAutoAnswerReady(){return !ctx.labSafetyLock&&ctx.presenceState.armed===true&&ctx.config.autoAnswerEnabled===true&&ctx.readAvailabilityState()==='online';},
    isAuthorizedProfilePage(){return true;},
    readAvailabilityState(){return availability;},
    currentCallId:()=>route?'active':null,
    normalized:value=>String(value||''),
    safe:value=>String(value||''),
    visibleElement:()=>visible,
    emit(action,payload,level){events.push({action,payload:payload||{},level:level||'info'});},
    emitIntegrity(){},
    iso:()=>new Date().toISOString(),
    cleanupFingerprints(){},
    setTimeout:()=>1,clearTimeout(){}
  };
  vm.createContext(ctx);
  vm.runInContext(fn+'\nthis.run=autoAnswer;',ctx);
  return {
    ctx,button,dialog,events,clicks:()=>clicks,
    release:()=>{if(release)release(grant?{ok:true,generation:2,expiresAt:Date.now()+500}:{ok:false,error:'not-authorized'});},
    route:value=>{route=value;},
    visible:value=>{visible=value;}
  };
}
async function run(h){
  const pending=h.ctx.run();
  h.release();
  await pending;
  await new Promise(resolve=>setImmediate(resolve));
}
function hasEvent(h,action){return h.events.some(event=>event.action===action);}

let h=harness();
await run(h);
assert.equal(h.clicks(),1,'authorized audio call should be clicked once');
assert(hasEvent(h,'INCOMING_DIALOG_DETECTED'),'incoming dialog must be recorded before action');
assert(hasEvent(h,'CONNECT_BUTTON_FOUND'),'Connect button evidence must be recorded');
assert(hasEvent(h,'AUTO_ANSWER_ELIGIBLE'),'authorized call must reach eligibility');
assert(hasEvent(h,'CONNECT_CLICKED'),'automatic click must be recorded');
checks+=5;

await run(h);
assert.equal(h.clicks(),1,'repeated observer passes must not click twice');
assert.equal(h.events.filter(event=>event.action==='INCOMING_DIALOG_DETECTED').length,1,'same dialog must not create duplicate attempts');
checks+=2;

for(const mode of ['Video interpreting','unidentified','Audio interpreting Video interpreting']){
  h=harness({mode});
  await run(h);
  assert.equal(h.clicks(),0,mode+' must not be auto-answered');
  assert(hasEvent(h,'INCOMING_DIALOG_DETECTED'),'non-OPI dialog still must be observed');
  checks+=2;
}

h=harness({grant:false});
await run(h);
assert.equal(h.clicks(),0,'rejected presence authorization must not click');
assert(hasEvent(h,'AUTO_ANSWER_BLOCKED'),'authorization rejection must be diagnosable');
checks+=2;

for(const state of [
  {labSafetyLock:true},
  {presenceArmed:false},
  {autoAnswerEnabled:false},
  {availability:'offline'}
]){
  h=harness(state);
  await run(h);
  assert.equal(h.clicks(),0,'safety/readiness gate must prevent a click');
  assert(hasEvent(h,'INCOMING_DIALOG_DETECTED'),'passive detection must not depend on auto-answer readiness');
  assert(hasEvent(h,'AUTO_ANSWER_BLOCKED'),'the exact blocking gate must be emitted');
  const blocked=h.events.find(event=>event.action==='AUTO_ANSWER_BLOCKED');
  assert(Array.isArray(blocked.payload.blockers)&&blocked.payload.blockers.length>0,'blocking reason must be explicit');
  checks+=4;
}

h=harness();
await run(h);
h.ctx.document.querySelectorAll=()=>[];
await h.ctx.run();
assert(hasEvent(h,'INCOMING_DIALOG_CLOSED'),'dialog closure must be observed');
checks++;

for(const mutate of [
  h=>{h.ctx.labSafetyLock=true;},
  h=>{h.ctx.presenceState.armed=false;},
  h=>{h.ctx.presenceState.generation=3;},
  h=>{h.ctx.config.autoAnswerEnabled=false;},
  h=>{h.route(true);},
  h=>{h.button.disabled=true;},
  h=>{h.button.isConnected=false;},
  h=>{h.visible(false);},
  h=>{h.dialog.innerText='Video interpreting';}
]){
  h=harness();
  const pending=h.ctx.run();
  mutate(h);
  h.release();
  await pending;
  assert.equal(h.clicks(),0,'post-await revalidation must prevent unsafe/stale click');
  checks++;
}

h=harness();
const first=h.ctx.run(),second=h.ctx.run();
h.release();
await Promise.all([first,second]);
assert.equal(h.clicks(),1,'concurrent DOM triggers must produce a single click');
checks++;

const worker=fs.readFileSync('extension/background.js','utf8');
const popup=fs.readFileSync('extension/ui/popup.js','utf8');
for(const source of [content,worker,popup]){
  assert(source.includes('autoAnswerEnabled: false'));
  checks++;
}
assert(worker.includes('SignalPresenceGuard.toggleFromKeyboard()'));checks++;
assert(!worker.includes('config.autoAnswerEnabled = !config.autoAnswerEnabled'));checks++;
assert(content.includes('next === "offline"'));checks++;
assert(content.includes('function incomingReadinessBlockers()'));checks++;
assert(content.includes('readinessTimer = setInterval(function ()'));checks++;
assert(content.includes('}, 15000);'));checks++;

console.log(JSON.stringify({
  suite:'presence-connect',
  environment:'Node VM / actual content function with synthetic DOM',
  checks,result:'PASS',windowsAccepted:false
}));
