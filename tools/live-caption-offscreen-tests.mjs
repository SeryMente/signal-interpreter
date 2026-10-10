import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const source=fs.readFileSync("extension/offscreen.js","utf8");
let listener;let forbidden=0;
const poison=()=>{forbidden++;throw new Error("audio acquisition forbidden");};
vm.runInNewContext(source,{chrome:{runtime:{onMessage:{addListener:f=>listener=f}}},navigator:{mediaDevices:{getUserMedia:poison}},MediaRecorder:poison,AudioContext:poison,Number,String,Math,Promise});
function send(type,extra={}){let result;listener({target:"offscreen",type,...extra},{},x=>result=x);return result;}
for(const type of ["SIGNAL_START_CALL_CAPTION_PREVIEW","SIGNAL_START_GROQ_CAPTURE","SIGNAL_START_YOUTUBE_CAPTION_PREVIEW","SIGNAL_SET_CAPTION_PREVIEW"]){assert.equal(send(type,{micEnabled:true,streamId:"stale"}).ok,false);}
assert.equal(send("SIGNAL_GET_GROQ_CAPTURE_STATE").running,false);
assert.equal(send("SIGNAL_GET_GROQ_CAPTURE_STATE").tabAudio,false);
assert.equal(send("SIGNAL_GET_GROQ_CAPTURE_STATE").microphone,false);
assert.equal(send("SIGNAL_SET_MICROPHONE_MUTED",{muted:true}).inactive,true);
assert.equal(send("SIGNAL_STOP_GROQ_CAPTURE").ok,true);
assert.equal(forbidden,0,"no audio API is touched even with stale privileged messages");
assert.equal(/getUserMedia|MediaRecorder|createMediaStreamSource/.test(source),false);
console.log("LIVE_CAPTION_OFFSCREEN_NATIVE_ONLY_TEST=PASS");
