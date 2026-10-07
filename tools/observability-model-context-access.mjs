import {execFileSync} from "node:child_process";

const REPO="SeryMente/signal-interpreter";
const MANIFEST="observations/manifest.json";
const MARKER="observations/health/model-context-access.json";

function gh(args){return execFileSync("gh",["api",...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();}
function decode(content){return Buffer.from(String(content||"").replace(/\n/g,""),"base64").toString("utf8");}

const manifestResponse=JSON.parse(gh([`repos/${REPO}/contents/${MANIFEST}?ref=main`]));
const manifest=JSON.parse(decode(manifestResponse.content));
let previousSha=null;
try{previousSha=JSON.parse(gh([`repos/${REPO}/contents/${MARKER}?ref=main`])).sha||null;}catch(_){}
const accessedAt=new Date().toISOString();
const marker={schema:"observability-model-context-access/v1",accessedAt,actor:"constructor-model",action:"context-enrichment",source:MANIFEST,sourceBatchId:manifest.lastBatchId||null,sourceGeneratedAt:manifest.generatedAt||null,sourceLastSequence:Number(manifest.lastSequence||0),sourceExtensionVersion:String(manifest.extensionVersion||"unknown"),note:"Package accessed through GitHub during constructor context enrichment."};
const content=Buffer.from(JSON.stringify(marker,null,2)+"\n","utf8").toString("base64");
const args=[`repos/${REPO}/contents/${MARKER}`,"--method","PUT","-f",`message=chore(observability): record constructor context access` ,"-f",`content=${content}` ,"-f","branch=main"];
if(previousSha)args.push("-f",`sha=${previousSha}`);
const result=JSON.parse(gh(args));
console.log("MODEL_CONTEXT_ACCESS_RECORDED",JSON.stringify({accessedAt,batchId:manifest.lastBatchId||null,sequence:Number(manifest.lastSequence||0),commitSha:result.commit&&result.commit.sha||null}));
