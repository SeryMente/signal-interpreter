import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {execFile} from "node:child_process";
import {fileURLToPath} from "node:url";
import {sha256,fileToken,semanticPlatformDelta} from "./platform-learning.mjs";

const REPO="SeryMente/signal-interpreter";
const ROOT=process.env.SIGNAL_INTERPRETER_REPO?path.resolve(process.env.SIGNAL_INTERPRETER_REPO):path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const BASE=path.dirname(ROOT);
const OBS=path.join(ROOT,"observations");
const BATCHES=path.join(OBS,"batches");
const LATEST=path.join(OBS,"latest");
const PLATFORM_SNAPSHOTS=path.join(OBS,"platform-snapshots");
const PLATFORM_DELTAS=path.join(OBS,"platform-deltas");
const PLATFORM_INDEX=path.join(OBS,"platform-index.json");
const PLATFORM_LATEST=path.join(OBS,"platform-latest.json");
const OBS_MANIFEST=path.join(OBS,"manifest.json");
const SPOOL=path.join(BASE,".signal-interpreter-observability-spool");
const PUBLISH_ROOT=path.join(BASE,".signal-interpreter-observability-publisher");
const STATE_DIR=path.join(BASE,".signal-interpreter-observability-state");
const STATE_FILE=path.join(STATE_DIR,"health.json");
const PLATFORM_STATE_FILE=path.join(STATE_DIR,"platform-state.json");
const LOG_FILE=path.join(STATE_DIR,"reporter.log");
const PORT=Number(process.env.SIGNAL_OBSERVATION_PORT||8788);
const MAX_BYTES=5*1024*1024;
const COMMIT_WINDOW_MS=Number(process.env.SIGNAL_OBSERVATION_COMMIT_WINDOW_MS||30000);
const PUBLISH_SWEEP_MS=Number(process.env.SIGNAL_OBSERVATION_SWEEP_MS||60000);
const PLATFORM_CHANGE_LIMIT=80;

let syncTimer=null,syncDueAt=0,syncRunning=false,dirty=false,forceNext=false;
let health=loadHealth();
let platformState=loadPlatformState();

function iso(){return new Date().toISOString()}
function dayKey(value){const d=new Date(value||Date.now());return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):new Date().toISOString().slice(0,10)}
function loadHealth(){
  const defaults={startedAt:iso(),lastAcceptedAt:null,lastGitSuccessAt:null,lastFallbackAt:null,lastGitError:null,lastPublishedSequence:0,lastBatchId:null,gitAttempts:0,fallbackPublishes:0,queued:false,platformSnapshots:0,platformDeltas:0,platformRoutes:0,platformLastObservationAt:null,platformLastDeltaAt:null};
  try{return Object.assign(defaults,JSON.parse(fs.readFileSync(STATE_FILE,"utf8")))}catch(_){return defaults}
}
function loadPlatformState(){
  const defaults={schema:"signal-interpreter-platform-learning-state/v1",generatedAt:null,lastUpdatedAt:null,observations:0,deltas:0,identities:{},seenHashes:[]};
  try{
    const parsed=JSON.parse(fs.readFileSync(PLATFORM_STATE_FILE,"utf8"));
    parsed.identities=parsed.identities&&typeof parsed.identities==="object"?parsed.identities:{};
    parsed.seenHashes=Array.isArray(parsed.seenHashes)?parsed.seenHashes.slice(-20000):[];
    return Object.assign(defaults,parsed);
  }catch(_){return defaults}
}
function log(message){
  const line="[observation-reporter] "+iso()+" "+message;
  try{fs.mkdirSync(STATE_DIR,{recursive:true});fs.appendFileSync(LOG_FILE,line+"\\n")}catch(_){}
  console.error(line);
}
function saveHealth(){try{fs.mkdirSync(STATE_DIR,{recursive:true});fs.writeFileSync(STATE_FILE,JSON.stringify(health,null,2)+"\\n")}catch(_){}}
function savePlatformState(){try{fs.mkdirSync(STATE_DIR,{recursive:true});platformState.generatedAt=iso();platformState.lastUpdatedAt=platformState.generatedAt;fs.writeFileSync(PLATFORM_STATE_FILE,JSON.stringify(platformState,null,2)+"\\n")}catch(error){log("platform state save failed: "+String(error))}}
function durableWrite(file,data){
  const dir=path.dirname(file),tmp=file+".tmp-"+process.pid+"-"+Date.now()+"-"+Math.random().toString(16).slice(2);
  fs.mkdirSync(dir,{recursive:true});
  const fd=fs.openSync(tmp,"w");
  try{fs.writeSync(fd,data);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
  try{fs.rmSync(file,{force:true})}catch(_){}
  fs.renameSync(tmp,file);
}
function run(file,args,cwd,timeoutMs=60000){
  return new Promise((resolve,reject)=>execFile(file,args,{cwd,windowsHide:true,maxBuffer:32*1024*1024,timeout:timeoutMs},(error,stdout,stderr)=>error?reject(new Error((stderr||stdout||error.message).trim())):resolve((stdout||"").trim())));
}
function git(args){return run("git.exe",args,PUBLISH_ROOT)}
function gh(args){return run("gh.exe",args,ROOT)}
function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function spoolFiles(){
  if(!fs.existsSync(SPOOL))return[];
  return fs.readdirSync(SPOOL).filter(name=>name.endsWith(".json")).sort().map(name=>path.join(SPOOL,name));
}
function removeSpoolBatch(batchId){try{fs.rmSync(path.join(SPOOL,batchId+".json"),{force:true})}catch(_){}}
function scheduleGitSync(force=false){
  dirty=true;health.queued=true;forceNext=forceNext||force;saveHealth();
  const delayMs=force?5000:COMMIT_WINDOW_MS,due=Date.now()+delayMs;
  if(syncTimer&&syncDueAt<=due)return;
  clearTimeout(syncTimer);syncDueAt=due;
  syncTimer=setTimeout(()=>{syncTimer=null;syncDueAt=0;runGitSync().catch(()=>{})},delayMs);
}
function publishSweep(){
  if(syncRunning)return;
  const pending=spoolFiles();
  if(dirty||pending.length){scheduleGitSync(false)}
  processUnpublishedPlatformBatches().catch(error=>log("platform sweep failed: "+String(error)));
}
function ensurePublisherSyncRoot(){
  fs.mkdirSync(OBS,{recursive:true});
  fs.mkdirSync(BATCHES,{recursive:true});
  fs.mkdirSync(LATEST,{recursive:true});
  fs.mkdirSync(PLATFORM_SNAPSHOTS,{recursive:true});
  fs.mkdirSync(PLATFORM_DELTAS,{recursive:true});
}
async function ensurePublisher(){
  if(fs.existsSync(path.join(PUBLISH_ROOT,".git"))){
    await git(["remote","set-url","origin","https://github.com/"+REPO+".git"]);
    return;
  }
  fs.rmSync(PUBLISH_ROOT,{recursive:true,force:true});
  fs.mkdirSync(BASE,{recursive:true});
  log("creating isolated sparse publisher repository");
  await run("gh",["repo","clone",REPO,PUBLISH_ROOT,"--","--filter=blob:none","--sparse","--no-checkout"],ROOT,120000);
  await git(["sparse-checkout","init","--cone"]);
  await git(["sparse-checkout","set","observations"]);
  await git(["checkout","main"]);
  await git(["config","user.name","Signal Interpreter Observability"]);
  await git(["config","user.email","observability@users.noreply.github.com"]);
}
function scrubValue(value,key="",depth=0){
  if(depth>8)return"[MAX_DEPTH]";
  const k=String(key||"");
  if(/api.?key|authorization|cookie|password|secret|token|credential/i.test(k))return"[REDACTED]";
  if(/rawAudio|rawTranscript|transcriptText|captionText|utterance|innerText|textContent|outerHTML|innerHTML|inputValue|requestBody|responseBody|bodyText|htmlText|cssText|javascriptSource|audioBlob|base64|requestTextSafe|dialogText/i.test(k))return"[OMITTED]";
  if(typeof value==="string"){
    return value
      .replace(/\\bBearer\\s+[A-Za-z0-9._~+/=-]+/gi,"Bearer [REDACTED]")
      .replace(/\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b/gi,"[EMAIL]")
      .replace(/\\b(?:\\+?\\d[\\d\\s().-]{7,}\\d)\\b/g,"[PHONE]")
      .slice(0,1600);
  }
  if(value===null||typeof value!=="object")return value;
  if(Array.isArray(value))return value.slice(0,240).map(v=>scrubValue(v,k,depth+1));
  const out={};let keys=Object.keys(value);
  if(keys.length>240)keys=keys.slice(0,240);
  for(const k2 of keys)out[k2]=scrubValue(value[k2],k2,depth+1);
  return out;
}
function sanitizeBatch(input){
  if(!input||input.schema!=="signal-interpreter-observation-batch/v1")throw new Error("Schema de batch no soportado");
  const events=Array.isArray(input.events)?input.events.slice(0,200):[];
  const safeEvents=events.map(e=>{
    const out={};
    for(const k of ["schema","id","sequence","timestamp","ingestedAt","level","category","component","phase","action","outcome","traceId","operationId","parentEventId","attempt","durationMs","session","environment","expected","observed","reasonCode","error","metrics","context","privacy","payload","tabId","url","host","extensionVersion"]){
      if(Object.hasOwn(e,k))out[k]=scrubValue(e[k],k,0);
    }
    return out;
  });
  return{
    schema:input.schema,
    batchId:String(input.batchId||""),
    createdAt:String(input.createdAt||iso()),
    trigger:String(input.trigger||"scheduled"),
    extensionVersion:String(input.extensionVersion||"unknown"),
    summary:scrubValue(input.summary&&typeof input.summary==="object"?input.summary:{}, "summary",0),
    events:safeEvents
  };
}
function normalizePlatformSnapshot(event,batch){
  const payload=event&&event.payload||{};
  const surface=payload.platformSurface||payload.platformObservation||payload.portal||null;
  if(!surface||surface.schema!=="signal-interpreter-platform-surface/v1")return null;
  const page=surface.page||{};
  if(String(page.origin||"")!=="https://app.cloudinterpreter.com")return null;
  const searchKeys=Array.isArray(page.searchKeys)?page.searchKeys.slice(0,40).map(String).sort():[];
  const identityKey=String(page.origin)+"|"+String(page.route||page.path||"")+"|"+searchKeys.join(",");
  const snapshotHash=String(payload.snapshotHash||sha256(surface)).slice(0,64);
  const snapshotId=String(event.id||sha256([batch.batchId,event.sequence,snapshotHash].join("|"))).slice(0,100);
  return{
    schema:"signal-interpreter-platform-observation/v1",
    snapshotId,batchId:batch.batchId,eventId:event.id||null,sequence:Number(event.sequence)||0,
    tabId:event.tabId==null?null:Number(event.tabId),capturedAt:String(surface.capturedAt||event.timestamp||iso()),
    identityKey,snapshotHash,surface:scrubValue(surface,"platformSurface",0),
    route:String(page.route||page.path||""),
    url:String(page.url||page.path||"")
  };
}
function writePlatformIndexes(){
  const identities=platformState.identities||{};
  const latestByIdentity={};
  for(const [key,value] of Object.entries(identities)){
    latestByIdentity[key]={
      snapshotId:value.snapshotId,capturedAt:value.capturedAt,route:value.route,url:value.url,
      snapshotHash:value.snapshotHash,snapshotPath:value.snapshotPath,lastDeltaPath:value.lastDeltaPath||null,observations:value.observations||1
    };
  }
  const routes=Array.from(new Set(Object.values(identities).map(x=>x.route).filter(Boolean))).sort();
  const payload={
    schema:"signal-interpreter-platform-index/v1",generatedAt:iso(),
    observations:Number(platformState.observations||0),deltas:Number(platformState.deltas||0),
    identityCount:Object.keys(identities).length,routeCount:routes.length,routes,latestByIdentity
  };
  durableWrite(PLATFORM_INDEX,JSON.stringify(payload,null,2)+"\\n");
  durableWrite(PLATFORM_LATEST,JSON.stringify(payload,null,2)+"\\n");
}
function writeObservabilityManifest(batch){
  const summary=batch&&batch.summary||{};
  const manifest={
    schema:"signal-interpreter-observability-package/v1",
    generatedAt:iso(),
    lastBatchId:batch&&batch.batchId||health.lastBatchId||null,
    lastSequence:Number(summary.lastSequence||health.lastPublishedSequence||0),
    extensionVersion:batch&&batch.extensionVersion||"unknown",
    eventCount:Number(summary.eventsTotal||0),
    platform:{observations:Number(platformState.observations||0),deltas:Number(platformState.deltas||0),identities:Object.keys(platformState.identities||{}).length}
  };
  durableWrite(OBS_MANIFEST,JSON.stringify(manifest,null,2)+"\\n");
}
function persistPlatformSnapshot(snapshot){
  const day=dayKey(snapshot.capturedAt);
  const dir=path.join(PLATFORM_SNAPSHOTS,day);
  const snapshotPath=path.join(dir,fileToken(snapshot.route||"root")+"--"+snapshot.snapshotHash+".json");
  durableWrite(snapshotPath,JSON.stringify(snapshot,null,2)+"\\n");
  const previous=platformState.identities[snapshot.identityKey]||null;
  let deltaPath=null,delta=null;
  if(!previous||previous.snapshotHash!==snapshot.snapshotHash){
    const previousSnapshot=previous&&previous.surface?previous:null;
    delta=semanticPlatformDelta(previousSnapshot,snapshot);
    const deltaFile=path.join(PLATFORM_DELTAS,day,fileToken(snapshot.route||"root")+"--"+snapshot.snapshotHash+".json");
    durableWrite(deltaFile,JSON.stringify(delta,null,2)+"\\n");
    deltaPath=path.relative(OBS,deltaFile).replace(/\\\\/g,"/");
    platformState.deltas=Number(platformState.deltas||0)+1;
    health.platformDeltas=platformState.deltas;
    health.platformLastDeltaAt=snapshot.capturedAt;
  }
  const existingCount=previous?Number(previous.observations||1):0;
  platformState.identities[snapshot.identityKey]={
    snapshotId:snapshot.snapshotId,capturedAt:snapshot.capturedAt,route:snapshot.route,url:snapshot.url,
    snapshotHash:snapshot.snapshotHash,snapshotPath:path.relative(OBS,snapshotPath).replace(/\\\\/g,"/"),
    lastDeltaPath:deltaPath||previous&&previous.lastDeltaPath||null,observations:existingCount+1,surface:snapshot.surface
  };
  platformState.observations=Number(platformState.observations||0)+(previous&&previous.snapshotHash===snapshot.snapshotHash?0:1);
  platformState.seenHashes=(platformState.seenHashes||[]).concat(snapshot.snapshotHash).slice(-20000);
  health.platformSnapshots=platformState.observations;
  health.platformRoutes=Object.keys(platformState.identities).length;
  health.platformLastObservationAt=snapshot.capturedAt;
  savePlatformState();saveHealth();writePlatformIndexes();
  return{snapshotPath:path.relative(OBS,snapshotPath).replace(/\\\\/g,"/"),delta,deltaPath};
}
function processBatchPlatformArtifacts(batch){
  let processed=0;
  for(const event of Array.isArray(batch&&batch.events)?batch.events:[]){
    if(String(event.action||"")!=="PLATFORM_SURFACE_SNAPSHOT")continue;
    const snapshot=normalizePlatformSnapshot(event,batch);
    if(!snapshot||platformState.seenHashes.includes(snapshot.snapshotHash))continue;
    persistPlatformSnapshot(snapshot);processed++;
  }
  if(processed)writeObservabilityManifest(batch);
  return processed;
}
async function processUnpublishedPlatformBatches(){
  if(!fs.existsSync(BATCHES))return;
  const files=fs.readdirSync(BATCHES).filter(x=>x.endsWith(".json")).sort().slice(-200);
  for(const file of files){
    try{
      const batch=JSON.parse(fs.readFileSync(path.join(BATCHES,file),"utf8"));
      processBatchPlatformArtifacts(batch);
    }catch(error){log("platform batch repair failed "+file+": "+String(error))}
  }
}
function findPlatformDerivedGitFiles(){
  const result=[];
  try{
    const out=fs.existsSync(path.join(PUBLISH_ROOT,".git"))?fs.readFileSync("/dev/null"):"";
  }catch(_){}
  return result;
}
async function ghPut(repoPath,filePath,message){
  const content=fs.readFileSync(filePath).toString("base64");let sha=null;
  try{sha=(await gh(["api","repos/"+REPO+"/contents/"+repoPath+"?ref=main","--jq",".sha"])).trim()||null}catch(error){if(!/404|Not Found/i.test(String(error)))throw error}
  const request={message,content,branch:"main"};if(sha)request.sha=sha;
  const temp=path.join(os.tmpdir(),"signal-observability-gh-"+Math.random().toString(16).slice(2)+".json");
  try{
    durableWrite(temp,JSON.stringify(request));
    try{return await gh(["api","repos/"+REPO+"/contents/"+repoPath,"--method","PUT","--input",temp])}
    catch(error){
      if(!/409|422|sha/i.test(String(error)))throw error;
      const refreshed=(await gh(["api","repos/"+REPO+"/contents/"+repoPath+"?ref=main","--jq",".sha"])).trim();
      request.sha=refreshed;durableWrite(temp,JSON.stringify(request));
      return await gh(["api","repos/"+REPO+"/contents/"+repoPath,"--method","PUT","--input",temp]);
    }
  }finally{try{fs.rmSync(temp,{force:true})}catch(_){}}
}
async function fallbackPublishObservations(pending){
  await ensurePublisher();
  const names=new Set();
  try{const tracked=await git(["diff","--name-only","origin/main","--","observations"]);for(const line of tracked.split(/\\r?\\n/).filter(Boolean))names.add(line.trim())}catch(_){}
  try{const untracked=await git(["ls-files","--others","--exclude-standard","--","observations"]);for(const line of untracked.split(/\\r?\\n/).filter(Boolean))names.add(line.trim())}catch(_){}
  for(const name of Array.from(names).sort()){
    const local=path.join(PUBLISH_ROOT,name);
    if(!fs.existsSync(local)||fs.statSync(local).isDirectory())continue;
    await ghPut(name,local,"diagnostic: fallback publish observability artifact");
  }
  for(const file of pending){
    const id=path.basename(file,".json");
    const remotePath="observations/batches/"+id+".json";
    if(!names.has(remotePath)&&fs.existsSync(file))await ghPut(remotePath,file,"diagnostic: fallback publish observation batch");
    removeSpoolBatch(id);
  }
  health.fallbackPublishes+=pending.length;health.lastFallbackAt=iso();health.lastGitError=null;saveHealth();
  log("github-api fallback published observability artifacts");
}
async function runGitSync(){
  if(syncRunning||!dirty)return;
  syncRunning=true;dirty=false;health.queued=false;const force=forceNext;forceNext=false;saveHealth();
  try{
    await ensurePublisher();ensurePublisherSyncRoot();
    const pending=spoolFiles(),lastPending=pending.slice();
    let lastError=null;
    for(let attempt=1;attempt<=4;attempt++){
      health.gitAttempts+=1;saveHealth();
      try{
        await git(["fetch","origin","main"]);await git(["reset","--hard","origin/main"]);
        fs.rmSync(path.join(PUBLISH_ROOT,"observations"),{recursive:true,force:true});
        if(fs.existsSync(OBS))fs.cpSync(OBS,path.join(PUBLISH_ROOT,"observations"),{recursive:true});
        await git(["add","observations"]);
        const status=await git(["status","--porcelain","--","observations"]);
        if(!status){
          health.lastGitSuccessAt=iso();health.lastGitError=null;saveHealth();
          for(const file of pending)removeSpoolBatch(path.basename(file,".json"));
          log("git-sync clean");return;
        }
        await git(["commit","-m",force?"diagnostic: publish critical observation batch":"diagnostic: publish observation batch"]);
        await git(["push","origin","HEAD:main"]);
        health.lastGitSuccessAt=iso();health.lastGitError=null;saveHealth();
        for(const file of pending)removeSpoolBatch(path.basename(file,".json"));
        log("git-sync ok");return;
      }catch(error){
        lastError=error;health.lastGitError=String(error);saveHealth();
        log("git-sync attempt "+attempt+" failed: "+String(error));
        if(attempt<4)await delay(1500*attempt);
      }
    }
    if(lastPending.length)await fallbackPublishObservations(lastPending);
    else throw lastError||new Error("git-sync failed");
    if(lastPending.length)removeSpoolBatch(path.basename(lastPending[lastPending.length-1],".json"));
    return;
  }catch(error){
    dirty=true;health.queued=true;health.lastGitError=String(error);saveHealth();
    syncTimer=null;syncDueAt=0;scheduleGitSync(false);
  }finally{syncRunning=false}
}
const server=http.createServer((req,res)=>{
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Content-Type,X-Signal-Observation");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS,GET");
  if(req.method==="OPTIONS"){res.writeHead(204);return res.end()}
  if(req.method==="GET"&&(req.url==="/health"||req.url==="/status")){
    const spool=spoolFiles();
    res.writeHead(200,{"Content-Type":"application/json"});
    return res.end(JSON.stringify({ok:true,service:"signal-observation-reporter",port:PORT,repo:ROOT,publishRepo:PUBLISH_ROOT,spool:SPOOL,dirty,syncRunning,health:Object.assign({},health,{spoolCount:spool.length,spoolBytes:spool.reduce((n,f)=>n+(fs.statSync(f).size||0),0),platformIdentityCount:Object.keys(platformState.identities||{}).length})}));
  }
  if(req.method!=="POST"||req.url!=="/v1/observation-batch"){res.writeHead(404);return res.end("Not found")}
  let size=0,chunks=[];
  req.on("data",chunk=>{
    size+=chunk.length;
    if(size>MAX_BYTES){
      res.writeHead(413,{"Content-Type":"application/json"});
      res.end(JSON.stringify({ok:false,error:"Batch demasiado grande"}));req.destroy();return;
    }
    chunks.push(chunk);
  });
  req.on("end",()=>{
    try{
      const batch=sanitizeBatch(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      if(!batch.batchId)throw new Error("batchId requerido");
      ensurePublisherSyncRoot();
      const receivedAt=iso(),latest=Object.assign({},batch,{receivedAt}),s=batch.summary||{},isSelfTest=batch.trigger==="observability-self-test";
      durableWrite(path.join(SPOOL,batch.batchId+".json"),JSON.stringify(batch,null,2)+"\\n");
      durableWrite(path.join(BATCHES,batch.batchId+".json"),JSON.stringify(batch,null,2)+"\\n");
      if(!isSelfTest){
        durableWrite(path.join(LATEST,"latest.json"),JSON.stringify(latest,null,2)+"\\n");
        const manifestText=["# Signal Interpreter · latest observation","","- Batch: "+batch.batchId,"- Recibido: "+receivedAt,"- Trigger: "+batch.trigger,"- Extensión: "+batch.extensionVersion,"- Eventos: "+Number(s.eventsTotal||batch.events.length),"- Errores: "+Number(s.errors||0),"- Warnings: "+Number(s.warnings||0),"- Secuencia: "+Number(s.firstSequence||0)+" → "+Number(s.lastSequence||0),"- Observaciones de plataforma: "+Number(platformState.observations||0),"- Deltas de plataforma: "+Number(platformState.deltas||0),"","## Categorías","",JSON.stringify(s.categories||{},null,2),"","","## Acciones","",JSON.stringify(s.actions||{},null,2),""].join("\\n");
        durableWrite(path.join(LATEST,"latest-summary.md"),manifestText);
      }
      const processed=processBatchPlatformArtifacts(batch);
      health.lastAcceptedAt=receivedAt;health.lastBatchId=batch.batchId;
      health.lastPublishedSequence=Math.max(Number(health.lastPublishedSequence)||0,Number(s.lastSequence)||0);
      saveHealth();
      writeObservabilityManifest(batch);
      scheduleGitSync(Boolean(s.critical||Number(s.errors||0)>0||processed>0));
      res.writeHead(202,{"Content-Type":"application/json","Connection":"close"});
      res.end(JSON.stringify({ok:true,accepted:true,batchId:batch.batchId,lastSequence:s.lastSequence||null,platformArtifactsProcessed:processed,gitSync:"queued",durableLocal:true}));
    }catch(error){
      res.writeHead(400,{"Content-Type":"application/json"});
      res.end(JSON.stringify({ok:false,error:String(error)}));
    }
  });
});
server.requestTimeout=15000;server.headersTimeout=10000;
server.on("error",error=>{log("server error: "+String(error));process.exitCode=1;setTimeout(()=>process.exit(1),100)});
process.on("uncaughtException",error=>{log("uncaughtException: "+String(error));process.exit(1)});
process.on("unhandledRejection",error=>{log("unhandledRejection: "+String(error));process.exit(1)});
server.listen(PORT,"127.0.0.1",()=>{
  ensurePublisherSyncRoot();
  health.startedAt=iso();saveHealth();processUnpublishedPlatformBatches();
  log("listening on http://127.0.0.1:"+PORT+" repo="+ROOT);
  scheduleGitSync(true);
  setInterval(publishSweep,PUBLISH_SWEEP_MS).unref();
});