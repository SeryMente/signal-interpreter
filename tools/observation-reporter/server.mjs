import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {execFile} from "node:child_process";
import {fileURLToPath} from "node:url";

const REPO="SeryMente/signal-interpreter";
const ROOT=process.env.SIGNAL_INTERPRETER_REPO?path.resolve(process.env.SIGNAL_INTERPRETER_REPO):path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const BASE=path.dirname(ROOT);
const OBS=path.join(ROOT,"observations"),BATCHES=path.join(OBS,"batches"),LATEST=path.join(OBS,"latest");
const SPOOL=path.join(BASE,".signal-interpreter-observability-spool");
const PUBLISH_ROOT=path.join(BASE,".signal-interpreter-observability-publisher");
const STATE_DIR=path.join(BASE,".signal-interpreter-observability-state");
const STATE_FILE=path.join(STATE_DIR,"health.json"),LOG_FILE=path.join(STATE_DIR,"reporter.log");
const PORT=Number(process.env.SIGNAL_OBSERVATION_PORT||8788),MAX_BYTES=5*1024*1024,COMMIT_WINDOW_MS=Number(process.env.SIGNAL_OBSERVATION_COMMIT_WINDOW_MS||30000),PUBLISH_SWEEP_MS=Number(process.env.SIGNAL_OBSERVATION_SWEEP_MS||60000);
let syncTimer=null,syncDueAt=0,syncRunning=false,dirty=false,forceNext=false;
let health=loadHealth();
function iso(){return new Date().toISOString()}
function loadHealth(){try{return Object.assign({startedAt:iso(),lastAcceptedAt:null,lastGitSuccessAt:null,lastFallbackAt:null,lastGitError:null,lastPublishedSequence:0,lastBatchId:null,gitAttempts:0,fallbackPublishes:0,queued:false},JSON.parse(fs.readFileSync(STATE_FILE,"utf8")))}catch(_){return {startedAt:iso(),lastAcceptedAt:null,lastGitSuccessAt:null,lastFallbackAt:null,lastGitError:null,lastPublishedSequence:0,lastBatchId:null,gitAttempts:0,fallbackPublishes:0,queued:false}}}
function log(message){const line="[observation-reporter] "+iso()+" "+message;try{fs.mkdirSync(STATE_DIR,{recursive:true});fs.appendFileSync(LOG_FILE,line+"\n")}catch(_){};console.error(line)}
function saveHealth(){try{fs.mkdirSync(STATE_DIR,{recursive:true});fs.writeFileSync(STATE_FILE,JSON.stringify(health,null,2)+"\n")}catch(_){} }
function durableWrite(file,data){const dir=path.dirname(file),tmp=file+".tmp-"+process.pid+"-"+Date.now()+"-"+Math.random().toString(16).slice(2);fs.mkdirSync(dir,{recursive:true});const fd=fs.openSync(tmp,"w");try{fs.writeSync(fd,data);fs.fsyncSync(fd)}finally{fs.closeSync(fd)};try{fs.rmSync(file,{force:true})}catch(_){};fs.renameSync(tmp,file)}
function run(file,args,cwd,timeoutMs=60000){return new Promise((resolve,reject)=>execFile(file,args,{cwd,windowsHide:true,maxBuffer:16*1024*1024,timeout:timeoutMs},(error,stdout,stderr)=>error?reject(new Error((stderr||stdout||error.message).trim())):resolve((stdout||"").trim())))}
function git(args){return run("git.exe",args,PUBLISH_ROOT)}
function gh(args){return run("gh.exe",args,ROOT)}
function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function spoolFiles(){if(!fs.existsSync(SPOOL))return[];return fs.readdirSync(SPOOL).filter(name=>name.endsWith(".json")).sort().map(name=>path.join(SPOOL,name))}
function removeSpoolBatch(batchId){try{fs.rmSync(path.join(SPOOL,batchId+".json"),{force:true})}catch(_){} }
function scheduleGitSync(force=false){dirty=true;health.queued=true;forceNext=forceNext||force;saveHealth();const delayMs=force?5000:COMMIT_WINDOW_MS;const due=Date.now()+delayMs;if(syncTimer&&syncDueAt<=due)return;clearTimeout(syncTimer);syncDueAt=due;syncTimer=setTimeout(()=>{syncTimer=null;syncDueAt=0;runGitSync().catch(()=>{})},delayMs)}
function publishSweep(){if(syncRunning)return;const pending=spoolFiles();if(dirty||pending.length){scheduleGitSync(false)}}
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
function sanitizeBatch(input){
  if(!input||input.schema!=="signal-interpreter-observation-batch/v1")throw new Error("Schema de batch no soportado");
  const events=Array.isArray(input.events)?input.events.slice(0,200):[];
  const safeEvents=events.map(e=>{const out={};for(const k of ["schema","id","sequence","timestamp","ingestedAt","level","category","component","phase","action","outcome","traceId","operationId","parentEventId","attempt","durationMs","session","environment","expected","observed","reasonCode","error","metrics","context","privacy"])if(Object.hasOwn(e,k))out[k]=e[k];return out});
  return{schema:input.schema,batchId:String(input.batchId||""),createdAt:String(input.createdAt||iso()),trigger:String(input.trigger||"scheduled"),extensionVersion:String(input.extensionVersion||"unknown"),summary:input.summary&&typeof input.summary==="object"?input.summary:{},events:safeEvents}
}
async function ghPut(repoPath,filePath,message){
  const content=fs.readFileSync(filePath).toString("base64");let sha=null;
  try{sha=(await gh(["api","repos/"+REPO+"/contents/"+repoPath+"?ref=main","--jq",".sha"])).trim()||null}catch(error){if(!/404|Not Found/i.test(String(error)))throw error}
  const request={message:message,content:content,branch:"main"};if(sha)request.sha=sha;
  const temp=path.join(os.tmpdir(),"signal-observability-gh-"+Math.random().toString(16).slice(2)+".json");
  try{
    durableWrite(temp,JSON.stringify(request));
    try{return await gh(["api","repos/"+REPO+"/contents/"+repoPath,"--method","PUT","--input",temp])}
    catch(error){if(!/409|422|sha/i.test(String(error)))throw error;const refreshed=(await gh(["api","repos/"+REPO+"/contents/"+repoPath+"?ref=main","--jq",".sha"])).trim();request.sha=refreshed;durableWrite(temp,JSON.stringify(request));return await gh(["api","repos/"+REPO+"/contents/"+repoPath,"--method","PUT","--input",temp])}
  }finally{try{fs.rmSync(temp,{force:true})}catch(_){}}
}
async function fallbackPublishBatch(){
  try{
    const pending=spoolFiles();if(!pending.length)return false;
    for(const batchFile of pending){const batchId=path.basename(batchFile,".json");await ghPut("observations/batches/"+batchId+".json",batchFile,"diagnostic: fallback publish observation batch");removeSpoolBatch(batchId);}
    const latestFile=path.join(LATEST,"latest.json"),summaryFile=path.join(LATEST,"latest-summary.md");
    if(fs.existsSync(latestFile))await ghPut("observations/latest/latest.json",latestFile,"diagnostic: fallback publish latest observation");
    if(fs.existsSync(summaryFile))await ghPut("observations/latest/latest-summary.md",summaryFile,"diagnostic: fallback publish observation summary");
    health.fallbackPublishes+=pending.length;health.lastFallbackAt=iso();health.lastGitError=null;saveHealth();log("github-api fallback published "+pending.length+" batch(es)");return true;
  }catch(error){health.lastGitError=String(error);saveHealth();log("github-api fallback failed "+batchId+": "+String(error));return false}
}
async function runGitSync(){
  if(syncRunning||!dirty)return;syncRunning=true;dirty=false;health.queued=false;saveHealth();const force=forceNext;forceNext=false;
  try{
    await ensurePublisher();const pending=spoolFiles();let lastError=null;
    for(let attempt=1;attempt<=4;attempt++){
      health.gitAttempts+=1;saveHealth();
      try{
        await git(["fetch","origin","main"]);await git(["reset","--hard","origin/main"]);
        fs.rmSync(path.join(PUBLISH_ROOT,"observations"),{recursive:true,force:true});
        if(fs.existsSync(OBS))fs.cpSync(OBS,path.join(PUBLISH_ROOT,"observations"),{recursive:true});
        if(pending.length){for(const file of pending){const dest=path.join(PUBLISH_ROOT,"observations","batches",path.basename(file));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest)}}
        await git(["add","observations"]);const status=await git(["status","--porcelain","--","observations"]);
        if(!status){health.lastGitSuccessAt=iso();health.lastGitError=null;saveHealth();for(const file of pending){try{fs.rmSync(file,{force:true})}catch(_){}};log("git-sync clean");return}
        await git(["commit","-m",force?"diagnostic: publish critical observation batch":"diagnostic: publish observation batch"]);
        await git(["push","origin","HEAD:main"]);
        health.lastGitSuccessAt=iso();health.lastGitError=null;saveHealth();for(const file of pending){try{fs.rmSync(file,{force:true})}catch(_){}};log("git-sync ok");return
      }catch(error){lastError=error;health.lastGitError=String(error);saveHealth();log("git-sync attempt "+attempt+" failed: "+String(error));if(attempt<4)await delay(1500*attempt)}
    }
    if(pending.length)await fallbackPublishBatch();
    throw lastError||new Error("git-sync failed")
  }catch(error){dirty=true;health.queued=true;health.lastGitError=String(error);saveHealth();syncTimer=null;syncDueAt=0;scheduleGitSync(false)}finally{syncRunning=false}
}
const server=http.createServer((req,res)=>{
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Headers","Content-Type,X-Signal-Observation");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS,GET");
  if(req.method==="OPTIONS"){res.writeHead(204);return res.end()}
  if(req.method==="GET"&&(req.url==="/health"||req.url==="/status")){const spool=spoolFiles();res.writeHead(200,{"Content-Type":"application/json"});return res.end(JSON.stringify({ok:true,service:"signal-observation-reporter",port:PORT,repo:ROOT,publishRepo:PUBLISH_ROOT,spool:SPOOL,dirty,syncRunning,health:Object.assign({},health,{spoolCount:spool.length,spoolBytes:spool.reduce((n,f)=>n+(fs.statSync(f).size||0),0)})}))}
  if(req.method!=="POST"||req.url!=="/v1/observation-batch"){res.writeHead(404);return res.end("Not found")}
  let size=0,chunks=[];
  req.on("data",chunk=>{size+=chunk.length;if(size>MAX_BYTES){res.writeHead(413,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:false,error:"Batch demasiado grande"}));req.destroy();return}chunks.push(chunk)});
  req.on("end",()=>{try{
    const batch=sanitizeBatch(JSON.parse(Buffer.concat(chunks).toString("utf8")));if(!batch.batchId)throw new Error("batchId requerido");
    const receivedAt=iso(),latest={...batch,receivedAt},s=batch.summary||{};
    durableWrite(path.join(SPOOL,batch.batchId+".json"),JSON.stringify(batch,null,2)+"\n");
    durableWrite(path.join(BATCHES,batch.batchId+".json"),JSON.stringify(batch,null,2)+"\n");
    durableWrite(path.join(LATEST,"latest.json"),JSON.stringify(latest,null,2)+"\n");
    const md=["# Signal Interpreter · latest observation","","- Batch: "+batch.batchId,"- Recibido: "+receivedAt,"- Trigger: "+batch.trigger,"- Extensión: "+batch.extensionVersion,"- Eventos: "+Number(s.eventsTotal||batch.events.length),"- Errores: "+Number(s.errors||0),"- Warnings: "+Number(s.warnings||0),"- Secuencia: "+Number(s.firstSequence||0)+" → "+Number(s.lastSequence||0),"","## Categorías","",JSON.stringify(s.categories||{},null,2),"","","## Acciones","",JSON.stringify(s.actions||{},null,2),""];
    durableWrite(path.join(LATEST,"latest-summary.md"),md.join("\n"));
    health.lastAcceptedAt=receivedAt;health.lastBatchId=batch.batchId;health.lastPublishedSequence=Math.max(Number(health.lastPublishedSequence)||0,Number(s.lastSequence)||0);saveHealth();
    scheduleGitSync(Boolean(s.critical||Number(s.errors||0)>0));
    res.writeHead(202,{"Content-Type":"application/json","Connection":"close"});res.end(JSON.stringify({ok:true,accepted:true,batchId:batch.batchId,lastSequence:s.lastSequence||null,gitSync:"queued",durableLocal:true}));
  }catch(error){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:false,error:String(error)}))}})
});
server.requestTimeout=15000;server.headersTimeout=10000;
server.on("error",error=>{log("server error: "+String(error));process.exitCode=1;setTimeout(()=>process.exit(1),100)});
process.on("uncaughtException",error=>{log("uncaughtException: "+String(error));process.exit(1)});
process.on("unhandledRejection",error=>{log("unhandledRejection: "+String(error));process.exit(1)});
server.listen(PORT,"127.0.0.1",()=>{health.startedAt=iso();saveHealth();log("listening on http://127.0.0.1:"+PORT+" repo="+ROOT);scheduleGitSync(true);setInterval(publishSweep,PUBLISH_SWEEP_MS).unref()});