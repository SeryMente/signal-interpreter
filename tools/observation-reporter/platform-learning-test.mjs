import assert from "node:assert/strict";
import {sha256,fileToken,semanticPlatformDelta} from "./platform-learning.mjs";

const baseSurface={
  schema:"signal-interpreter-platform-surface/v1",
  page:{origin:"https://app.cloudinterpreter.com",route:"/profile/<ID>",searchKeys:[],title:"My Profile",nodeCount:120},
  controls:{buttons:[{tag:"button",role:"button",label:"You are Online",disabled:false}],links:[],fields:[],headings:["My Profile"]},
  dom:{tagCounts:{div:20,button:1},elements:[{selector:"main>button:nth-child(1)",tag:"button",classes:["status"],attributes:{role:"button"},text:"You are Online",visible:true,disabled:false,childCount:0,bbox:{width:100,height:40}}]},
  css:{stylesheets:[{href:"https://app.cloudinterpreter.com/assets/app.css",disabled:false,media:"",ownerTag:"link",ruleCount:12,sameOriginReadable:true}],inlineStyleCount:0,styleElementCount:0},
  javascript:{scripts:[{src:"https://app.cloudinterpreter.com/assets/app.js",type:"module",async:false,defer:true,noModule:false,integrityPresent:true,inlineLength:0}],scriptCount:1},
  resources:{totalObserved:2,recent:[{url:"https://app.cloudinterpreter.com/assets/app.js",initiatorType:"script",durationMs:20,transferBytes:10,encodedBytes:10,decodedBytes:20,protocol:"h2"}],uniqueRecent:1},
  metadata:[{name:"viewport",contentLength:25}],
  frameworkHints:["react"]
};

const previous={snapshotId:"snap-1",identityKey:"https://app.cloudinterpreter.com|/profile/<ID>|",snapshotHash:sha256(baseSurface).slice(0,64),capturedAt:"2026-10-07T15:00:00.000Z",surface:baseSurface};
const initial=semanticPlatformDelta(null,Object.assign({},previous,{snapshotId:"snap-0"}));
assert.equal(initial.type,"initial");
assert.equal(initial.summary.added,7);
const same=semanticPlatformDelta(previous,Object.assign({},previous,{snapshotId:"snap-2",capturedAt:"2026-10-07T15:01:00.000Z"}));
assert.equal(same.type,"unchanged");
assert.equal(same.changes.length,0);

const changedSurface=JSON.parse(JSON.stringify(baseSurface));
changedSurface.dom.tagCounts.button=2;
changedSurface.controls.buttons.push({tag:"button",role:"button",label:"End call",disabled:false});
changedSurface.css.stylesheets.push({href:"https://app.cloudinterpreter.com/assets/calls.css",disabled:false,media:"",ownerTag:"link",ruleCount:8,sameOriginReadable:true});
changedSurface.frameworkHints.push("nextjs-assets");
const changed=semanticPlatformDelta(previous,{
  snapshotId:"snap-3",
  identityKey:previous.identityKey,
  snapshotHash:sha256(changedSurface).slice(0,64),
  capturedAt:"2026-10-07T15:02:00.000Z",
  surface:changedSurface
});
assert.equal(changed.type,"changed");
assert.ok(changed.summary.added>=2);
assert.ok(changed.summary.changed>=1);
assert.ok(changed.summary.sections.includes("dom")||changed.summary.sections.includes("controls")||changed.summary.sections.includes("css"));

assert.equal(fileToken("Call / 123 ? foo"),"Call_123_foo");
assert.equal(sha256("abc").length,64);
console.log("PLATFORM_LEARNING_TEST=PASS");
