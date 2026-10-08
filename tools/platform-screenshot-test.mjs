import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {webcrypto} from "node:crypto";

const state={signalPlatformScreenshotState:null};
const uploads=[];
let imageData="data:image/jpeg;base64,/9j/AA==";
const chrome={
  runtime:{getManifest:()=>({version:"test"})},
  storage:{local:{
    async get(){return{signalPlatformScreenshotState:state.signalPlatformScreenshotState};},
    async set(value){state.signalPlatformScreenshotState=value.signalPlatformScreenshotState;}
  }},
  tabs:{
    async query(){return[{id:7,windowId:3,active:true,url:"https://app.cloudinterpreter.com/call/abcdefghijklmnopqrstuvwxyz"}];},
    async get(){return{id:7,windowId:3,active:true,url:"https://app.cloudinterpreter.com/call/abcdefghijklmnopqrstuvwxyz"};},
    async captureVisibleTab(){return imageData;}
  },
  alarms:{create(){}}
};
const relay={async uploadScreenshot(s){uploads.push(s);return{accepted:true,duplicate:false,remotePath:"observations/screenshots/2026-10-08/_call_ID_--"+s.sha256+".jpg"};}};
const recorded=[];
const sandbox={chrome,crypto:webcrypto,atob,console,Promise,Date,Math,Uint8Array,Set,Map};
sandbox.window=sandbox;
vm.runInNewContext(fs.readFileSync("extension/platform-screenshot.js","utf8"),sandbox);
sandbox.SignalPlatformScreenshot.configure({record:(a,p,l,c)=>recorded.push({a,p,l,c}),relay});
const first=await sandbox.SignalPlatformScreenshot.captureActive("unit-test");
assert.equal(first.ok,true);
assert.equal(first.results[0].changed,true);
assert.equal(uploads.length,1);
assert.equal(uploads[0].route,"/call/<ID>");
assert.match(uploads[0].sha256,/^[a-f0-9]{64}$/);
const second=await sandbox.SignalPlatformScreenshot.captureActive("unit-test-duplicate");
assert.equal(second.results[0].changed,false);
assert.equal(uploads.length,1);
imageData="data:image/jpeg;base64,/9j/Ag==";
const third=await sandbox.SignalPlatformScreenshot.captureActive("unit-test-changed");
assert.equal(third.results[0].changed,true);
assert.equal(uploads.length,2);
assert.ok(recorded.some(x=>x.a==="PLATFORM_SCREENSHOT_CHANGED"));
assert.ok(recorded.some(x=>x.a==="PLATFORM_SCREENSHOT_UNCHANGED"));
console.log("PLATFORM_SCREENSHOT_TEST=PASS");
