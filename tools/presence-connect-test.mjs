import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const content=fs.readFileSync('extension/content.js','utf8');
const helper=content.slice(content.indexOf('  function autoAnswerBlockReasons()'),content.indexOf('  function isAutoAnswerReady()'));
const fn=helper+content.slice(content.indexOf('  function autoAnswer() {'),content.indexOf('  function emitAutoAnswerReadiness'));
let checks=0;
function harness({mode='Audio interpreting',grant=true,armed=true,labLock=false}={}){
 let clicks=0,release=null,route=false,visible=true;
 let emitted=[];
 const button={disabled:false,isConnected:true,textContent:'Connect',getAttribute:()=>null,click(){clicks++}};
 const dialog={innerText:'Caller is requesting interpretation '+mode,querySelectorAll:()=>[button],contains:el=>el===button};
 const ctx={Date,Promise,Set,WeakSet,Map,Array,Math,performance,crypto,chrome:{runtime:{sendMessage:()=>new Promise(r=>{release=r})}},document:{querySelectorAll:()=>[dialog]},config:{autoAnswerEnabled:true},labSafetyLock:labLock,presenceState:{armed:armed,generation:2,reason:armed?"explicit-availability":"worker-start-confirm-again"},clickedNodes:new WeakSet(),pendingConnect:new WeakSet(),fingerprints:new Map(),lastIncomingSignature:'',lastIncomingAttemptId:'',lastAutoAnswerBlockSignature:'',answerFlow:{},ANSWER_LEASE_MARKER:'lease',window:{},integrity:{permittedConnectClicks:0},answerWatchdog:null,RUNTIME_VERSION:'0.10.39',DIALOG:'dialog',syncPageFavicon(){},readAvailabilityState:()=> "online",isAuthorizedProfilePage:()=>true,isAutoAnswerReady(){return !ctx.labSafetyLock&&ctx.presenceState.armed&&ctx.config.autoAnswerEnabled},currentCallId:()=>route?'active':null,normalized:s=>String(s||''),safe:s=>String(s||''),visibleElement:()=>visible,emit(a,p){emitted.push({action:a,payload:p||{}})},emitIntegrity(){},iso:()=>new Date().toISOString(),cleanupFingerprints(){},setTimeout:()=>1,clearTimeout(){}};
 vm.createContext(ctx);vm.runInContext(fn+'\nthis.run=autoAnswer;',ctx);
 return {ctx,button,dialog,clicks:()=>clicks,events:()=>emitted,release:()=>{if(release)release(grant?{ok:true,generation:2,expiresAt:Date.now()+500}: {ok:false,error:"not-authorized"})},route:v=>route=v,visible:v=>visible=v};
}
async function run(h){h.ctx.run();h.release();await new Promise(r=>setImmediate(r));}
let h=harness();await run(h);assert.equal(h.clicks(),1);checks++;
h.ctx.run();assert.equal(h.clicks(),1);checks++;
for(const mode of ['Video interpreting','unidentified','Audio interpreting Video interpreting']) {h=harness({mode});await run(h);assert.equal(h.clicks(),0,mode);checks++;}
h=harness({grant:false});await run(h);assert.equal(h.clicks(),0);checks++;
h=harness({armed:false});await run(h);assert.equal(h.clicks(),0);assert(h.events().some(e=>e.action==="INCOMING_DIALOG_DETECTED"),"passive detection remains active while presence guard is disarmed");assert(h.events().some(e=>e.action==="AUTO_ANSWER_BLOCKED"&&e.payload.blockReasons.some(r=>r.includes("PRESENCE_NOT_ARMED"))),"block report names the presence gate");assert(h.events().some(e=>e.action==="CONNECT_BUTTON_FOUND"),"button remains observable while auto-answer is blocked");checks++;
h=harness({labLock:true});await run(h);assert.equal(h.clicks(),0);assert(h.events().some(e=>e.action==="AUTO_ANSWER_BLOCKED"&&e.payload.blockReasons.includes("LAB_SAFETY_LOCK_ACTIVE")),"lab lock remains fail-closed and observable");checks++;
for(const mutate of [h=>h.ctx.labSafetyLock=true,h=>h.ctx.presenceState.armed=false,h=>h.ctx.presenceState.generation=3,h=>h.ctx.config.autoAnswerEnabled=false,h=>h.route(true),h=>h.button.disabled=true,h=>h.button.isConnected=false,h=>h.visible(false),h=>h.dialog.innerText='Video interpreting']){
 h=harness();h.ctx.run();mutate(h);h.release();await new Promise(r=>setImmediate(r));assert.equal(h.clicks(),0,'post-await revalidation');checks++;
}
h=harness();h.ctx.run();h.ctx.run();h.release();await new Promise(r=>setImmediate(r));assert.equal(h.clicks(),1,'concurrent DOM triggers single click');checks++;
const worker=fs.readFileSync('extension/background.js','utf8'),popup=fs.readFileSync('extension/ui/popup.js','utf8');
for(const source of [content,worker,popup]){assert(source.includes('autoAnswerEnabled: false'));checks++;}
assert(worker.includes('SignalPresenceGuard.toggleFromKeyboard()'));checks++;
assert(!worker.includes('config.autoAnswerEnabled = !config.autoAnswerEnabled'));checks++;
assert(content.includes('next === "offline"'));checks++;
console.log(JSON.stringify({suite:'presence-connect',environment:'Node VM / actual content function with synthetic DOM',checks,result:'PASS',windowsAccepted:false}));
