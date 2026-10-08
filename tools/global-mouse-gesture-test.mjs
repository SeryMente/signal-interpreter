import fs from "node:fs";import vm from "node:vm";
class E{constructor(){this.l=new Map()}addEventListener(t,f){let a=this.l.get(t)||[];a.push(f);this.l.set(t,a)}dispatchEvent(e){for(const f of(this.l.get(e.type)||[]).slice())f(e)}}
const document=new E(),sent=[];const timers=new Map();let n=0;
const sto=(f,m)=>{const id=++n;timers.set(id,setTimeout(f,m));return id},cl=id=>{clearTimeout(timers.get(id));timers.delete(id)};
const chrome={runtime:{lastError:null,sendMessage:(m,cb)=>{sent.push(m);if(cb)cb({ok:true,verified:true,muted:sent.length%2===1?true:false});}}};
const sb={document,chrome,setTimeout:sto,clearTimeout:cl,Date,console};sb.window=sb;vm.runInNewContext(fs.readFileSync("extension/global-mouse-gesture.js","utf8"),sb);
const ev=(type,button,buttons)=>({type,pointerType:"mouse",button,buttons,preventDefault(){},stopPropagation(){}});
async function chord(waitMs=350){document.dispatchEvent(ev("pointerdown",0,1));document.dispatchEvent(ev("pointerdown",2,3));await new Promise(r=>setTimeout(r,waitMs));document.dispatchEvent(ev("pointerup",2,1));document.dispatchEvent(ev("pointerup",0,0));}
await chord();
if(sent.length!==1||sent[0].type!=="SIGNAL_EXTENSION_MICROPHONE_TOGGLE"||sent[0].source!=="mouse-chord-global"||sent[0].muted!==undefined||sent[0].gesture!=="left+right-hold")throw Error("first reversible gesture must request toggle");
await chord();
if(sent.length!==2||sent[1].type!=="SIGNAL_EXTENSION_MICROPHONE_TOGGLE")throw Error("second gesture must toggle back");
const before=sent.length;await chord(100);if(sent.length!==before)throw Error("quick chord must not trigger");
console.log("GLOBAL_MOUSE_TOGGLE_TEST=PASS");
