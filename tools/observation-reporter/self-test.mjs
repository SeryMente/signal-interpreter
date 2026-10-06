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
  events:[{schema:"khora-effectif-event/v4",id:crypto.randomUUID(),sequence:0,timestamp:new Date().toISOString(),level:"info",category:"OBSERVABILITY",component:"self-test",phase:"self-test",action:"OBSERVABILITY_PIPELINE_SELF_TEST",outcome:"success",privacy:{rawTranscript:false,rawAudio:false}}]
};

async function get(path){const r=await fetch(base+path,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status+" "+path);return await r.json()}
async function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
const accepted=await (await fetch(base+"/v1/observation-batch",{method:"POST",headers:{"Content-Type":"application/json","X-Signal-Observation":"self-test"},body:JSON.stringify(body)})).json();
if(!accepted.ok||!accepted.accepted)throw new Error("Reporter rejected self-test");
let health=null,verified=false,lastError=null;
for(let i=0;i<15;i++){
  try{health=await get("/health");if(health.health&&health.health.lastBatchId===batchId&&health.health.lastGitSuccessAt&&Number(health.health.spoolCount||0)===0){verified=true;break}}catch(e){lastError=e}
  await sleep(2000)
}
if(!verified)throw new Error("GitHub publication was not confirmed within 30s"+(lastError?" · "+lastError.message:""));
const out=execFileSync("gh",["api","repos/SeryMente/signal-interpreter/contents/observations/batches/"+batchId+".json?ref=main","--jq",".sha"],{encoding:"utf8"}).trim();
if(!out)throw new Error("GitHub object SHA was empty");
console.log("OBSERVABILITY SELF-TEST: PASS");
console.log("batch="+batchId);
console.log("githubSha="+out);
console.log("lastGitSuccessAt="+health.health.lastGitSuccessAt);
