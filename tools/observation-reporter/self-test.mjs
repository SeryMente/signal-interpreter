import crypto from "node:crypto";
import {execFileSync} from "node:child_process";

const port=Number(process.env.SIGNAL_OBSERVATION_PORT||8788);
const base="http://127.0.0.1:"+port;
const batchId="batch-self-test-"+Date.now()+"-"+crypto.randomBytes(4).toString("hex");
const body={
  schema:"signal-interpreter-observation-batch/v1",
  batchId,
  createdAt:new Date().toISOString(),
  trigger:"observability-self-test",
  extensionVersion:"self-test",
  summary:{eventsTotal:1,errors:0,warnings:0,critical:true,firstSequence:0,lastSequence:0,actions:{OBSERVABILITY_PIPELINE_SELF_TEST:1},categories:{OBSERVABILITY:1}},
  events:[{schema:"khora-effectif-event/v4",id:crypto.randomUUID(),sequence:0,timestamp:new Date().toISOString(),level:"info",category:"OBSERVABILITY",component:"self-test",phase:"self-test",action:"OBSERVABILITY_PIPELINE_SELF_TEST",outcome:"success",tabId:0,url:"https://app.cloudinterpreter.com/profile/<ID>",payload:{
    schema:"signal-interpreter-platform-surface-event/v1",
    snapshotHash:"self-test-surface",
    platformSurface:{
      schema:"signal-interpreter-platform-surface/v1",
      page:{origin:"https://app.cloudinterpreter.com",route:"/profile/<ID>",path:"https://app.cloudinterpreter.com/profile/<ID>",searchKeys:[],title:"Self Test",nodeCount:3},
      controls:{buttons:[{tag:"button",role:"button",label:"You are Online",disabled:false}],links:[],fields:[],headings:["Self Test"]},
      dom:{tagCounts:{html:1,body:1,button:1},elements:[{selector:"body>button:nth-child(1)",tag:"button",attributes:{role:"button"},classes:["self-test"],text:"[TEXT:5:abc123]",textLength:0,textFingerprint:"abc123",visible:true,disabled:false,childCount:0,bbox:{width:10,height:10}}]},
      css:{stylesheets:[{href:"https://app.cloudinterpreter.com/assets/self-test.css",disabled:false,media:"",ownerTag:"link",ruleCount:1,selectorCount:1,atRuleCount:0,selectors:[".self-test"],sameOriginReadable:true}],inlineStyleCount:0,styleElementCount:0},
      javascript:{scripts:[{src:"https://app.cloudinterpreter.com/assets/self-test.js",type:"module",async:false,defer:true,noModule:false,integrityPresent:false,inlineLength:0}],scriptCount:1},
      resources:{totalObserved:1,recent:[{url:"https://app.cloudinterpreter.com/assets/self-test.js",initiatorType:"script",durationMs:1,transferBytes:1,encodedBytes:1,decodedBytes:1,protocol:"h2"}],uniqueRecent:1},
      metadata:[],frameworkHints:["react"],
      privacy:{rawTextStored:false,rawHtmlStored:false,rawCssStored:false,rawJavascriptStored:false,rawAudioStored:false}
    }
  },privacy:{rawTranscript:false,rawAudio:false}}]
};

async function get(path){const r=await fetch(base+path,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status+" "+path);return await r.json()}
async function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
const before=await get("/health");
const accepted=await (await fetch(base+"/v1/observation-batch",{method:"POST",headers:{"Content-Type":"application/json","X-Signal-Observation":"self-test"},body:JSON.stringify(body)})).json();
if(!accepted.ok||!accepted.accepted)throw new Error("Reporter rejected self-test");
let health=null,verified=false,lastError=null;
for(let i=0;i<15;i++){
  try{health=await get("/health");if(health.health&&health.health.lastBatchId===batchId&&health.health.lastGitSuccessAt&&Number(health.health.spoolCount||0)===0){verified=true;break}}catch(e){lastError=e}
  await sleep(2000)
}
if(!verified)throw new Error("GitHub publication was not confirmed within 30s"+(lastError?" · "+lastError.message:""));
const remoteJson=execFileSync("gh",["api","repos/SeryMente/signal-interpreter/contents/observations/batches/"+batchId+".json?ref=main","--jq",".content"],{encoding:"utf8"}).trim();
const remoteBuffer=Buffer.from(remoteJson,"base64");
const remoteBatch=JSON.parse(remoteBuffer.toString("utf8"));
const remotePayload=remoteBatch.events&&remoteBatch.events[0]&&remoteBatch.events[0].payload;
if(!remotePayload||!remotePayload.platformSurface||remotePayload.platformSurface.schema!=="signal-interpreter-platform-surface/v1")throw new Error("Platform payload was not preserved in GitHub batch");
if((Number(health.health.platformSnapshots)||0)!==(Number(before.health.platformSnapshots)||0)||(Number(health.health.platformDeltas)||0)!==(Number(before.health.platformDeltas)||0))throw new Error("Self-test contaminated platform learning counters");
const out=execFileSync("gh",["api","repos/SeryMente/signal-interpreter/contents/observations/batches/"+batchId+".json?ref=main","--jq",".sha"],{encoding:"utf8"}).trim();
if(!out)throw new Error("GitHub object SHA was empty");
console.log("OBSERVABILITY SELF-TEST: PASS");
console.log("batch="+batchId);
console.log("githubSha="+out);
console.log("lastGitSuccessAt="+health.health.lastGitSuccessAt);
