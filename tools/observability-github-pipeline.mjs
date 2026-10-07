import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {sha256,fileToken,semanticPlatformDelta} from "./observability/platform-learning.mjs";

const HERE=path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT=path.resolve(HERE,"..");
export const PACKAGE_SCHEMA="signal-interpreter-observability-package/v1";
export const BATCH_SCHEMA="signal-interpreter-observation-batch/v1";
export const SURFACE_EVENT_SCHEMA="signal-interpreter-platform-surface-event/v1";

function now(){return new Date().toISOString();}
function readJson(file,fallback=null){
  try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch(_){return fallback;}
}
function writeJson(file,value){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(value,null,2)+"\n","utf8");
}
function listJson(dir){
  if(!fs.existsSync(dir))return[];
  return fs.readdirSync(dir).filter(x=>x.endsWith(".json")).sort().map(x=>path.join(dir,x));
}
function normalizeRoute(value){
  return String(value||"/")
    .replace(/^\/call\/[^/?#]+/,"/call/<ID>")
    .replace(/^\/profile\/[^/?#]+/,"/profile/<ID>")||"/";
}
function normalizeOrigin(value){
  try{return new URL(String(value||"")).origin;}catch(_){return"";}
}
function normalizeSearchKeys(value){
  return Array.from(new Set(Array.isArray(value)?value.map(x=>String(x)).filter(Boolean):[])).sort().slice(0,40);
}
export function normalizePlatformSnapshot(event,batch){
  const payload=event&&event.payload||{};
  const surface=payload.platformSurface;
  if(!surface||surface.schema!=="signal-interpreter-platform-surface/v1")return null;
  const page=surface.page&&typeof surface.page==="object"?surface.page:{};
  const origin=normalizeOrigin(page.origin||event.url);
  if(origin!=="https://app.cloudinterpreter.com")return null;
  const route=normalizeRoute(page.route||page.path);
  const searchKeys=normalizeSearchKeys(page.searchKeys);
  const identityKey=origin+"|"+route+"|"+searchKeys.join(",");
  const snapshotHash=sha256(surface);
  const eventId=String(event.id||"");
  const snapshotId="snap-"+(eventId||snapshotHash.slice(0,24));
  return {
    schema:"signal-interpreter-platform-observation/v1",
    snapshotId,
    batchId:String(batch.batchId||""),
    eventId:eventId||null,
    sequence:Number(event.sequence)||0,
    tabId:event.tabId==null?null:Number(event.tabId),
    capturedAt:event.timestamp||batch.createdAt||now(),
    identityKey,
    snapshotHash,
    route,
    url:origin+route+(searchKeys.length?"?"+searchKeys.map(k=>encodeURIComponent(k)+"=<VALUE>").join("&"):""),
    surface
  };
}
function baseIndex(){
  return{
    schema:"signal-interpreter-platform-index/v1",
    generatedAt:null,
    observations:0,
    deltas:0,
    identityCount:0,
    routeCount:0,
    routes:[],
    latestByIdentity:{}
  };
}
function loadPackageIndex(obs){
  return readJson(path.join(obs,"platform-index.json"),baseIndex());
}
function snapshotPathFor(obs,snapshot){
  const day=String(snapshot.capturedAt).slice(0,10)||now().slice(0,10);
  return path.join(obs,"platform-snapshots",day,fileToken(snapshot.route)+"--"+snapshot.snapshotHash+".json");
}
function deltaPathFor(obs,snapshot){
  const day=String(snapshot.capturedAt).slice(0,10)||now().slice(0,10);
  return path.join(obs,"platform-deltas",day,fileToken(snapshot.route)+"--"+snapshot.snapshotHash+".json");
}
function readPreviousSnapshot(obs,entry){
  if(!entry||!entry.snapshotPath)return null;
  return readJson(path.join(obs,entry.snapshotPath),null);
}
function applyBatchToIndex(obs,index,batch){
  let changedObservations=0;
  let changedDeltas=0;
  for(const event of Array.isArray(batch.events)?batch.events:[]){
    if(String(event.action||"")!=="PLATFORM_SURFACE_SNAPSHOT")continue;
    const snapshot=normalizePlatformSnapshot(event,batch);
    if(!snapshot)continue;
    const previousEntry=index.latestByIdentity&&index.latestByIdentity[snapshot.identityKey]||null;
    if(previousEntry&&previousEntry.snapshotHash===snapshot.snapshotHash)continue;
    const previous=readPreviousSnapshot(obs,previousEntry);
    const snapshotPath=snapshotPathFor(obs,snapshot);
    const deltaPath=deltaPathFor(obs,snapshot);
    const delta=semanticPlatformDelta(previous,snapshot);
    writeJson(snapshotPath,snapshot);
    writeJson(deltaPath,delta);
    changedObservations+=1;
    if(delta.type!=="unchanged")changedDeltas+=1;
    index.latestByIdentity[snapshot.identityKey]={
      snapshotId:snapshot.snapshotId,
      capturedAt:snapshot.capturedAt,
      route:snapshot.route,
      url:snapshot.url,
      snapshotHash:snapshot.snapshotHash,
      snapshotPath:path.relative(obs,snapshotPath).replaceAll("\\","/"),
      lastDeltaPath:path.relative(obs,deltaPath).replaceAll("\\","/"),
      observations:Number(previousEntry&&previousEntry.observations||0)+1
    };
  }
  return{changedObservations,changedDeltas};
}
function buildLatestSummary(latestBatch,index){
  const summary=latestBatch&&latestBatch.summary||{};
  const lines=[
    "# Signal Interpreter · latest observation",
    "",
    "- Batch: "+String(latestBatch&&latestBatch.batchId||"none"),
    "- Creado: "+String(latestBatch&&latestBatch.createdAt||"unknown"),
    "- Trigger: "+String(latestBatch&&latestBatch.trigger||"unknown"),
    "- Extensión: "+String(latestBatch&&latestBatch.extensionVersion||"unknown"),
    "- Eventos: "+Number(summary.eventsTotal||0),
    "- Errores: "+Number(summary.errors||0),
    "- Warnings: "+Number(summary.warnings||0),
    "- Secuencia: "+Number(summary.firstSequence||0)+" → "+Number(summary.lastSequence||0),
    "- Identidades de plataforma: "+Number(index.identityCount||0),
    "- Snapshots de plataforma: "+Number(index.observations||0),
    "- Deltas de plataforma: "+Number(index.deltas||0),
    "",
    "## Categorías",
    "",
    JSON.stringify(summary.categories||{},null,2),
    "",
    "## Acciones",
    "",
    JSON.stringify(summary.actions||{},null,2),
    ""
  ];
  return lines.join("\n");
}
function isRealBatch(batch){
  return !!batch&&batch.trigger!=="observability-self-test"&&batch.extensionVersion!=="self-test";
}
function batchTime(batch){
  const t=Date.parse(batch&&batch.createdAt||"");
  return Number.isFinite(t)?t:0;
}
function findLatestRealBatch(obs){
  const files=listJson(path.join(obs,"batches"));
  let latest=null;
  for(const file of files){
    const batch=readJson(file,null);
    if(!isRealBatch(batch))continue;
    if(!latest||batchTime(batch)>batchTime(latest))latest=batch;
  }
  return latest;
}
function rebuildFromBatches(obs,index){
  const next=baseIndex();
  const files=listJson(path.join(obs,"batches"));
  let observations=0,deltas=0;
  for(const file of files){
    const batch=readJson(file,null);
    if(!batch)continue;
    const result=applyBatchToIndex(obs,next,batch);
    observations+=result.changedObservations;
    deltas+=result.changedDeltas;
  }
  next.observations=observations;
  next.deltas=deltas;
  next.identityCount=Object.keys(next.latestByIdentity).length;
  next.routes=Array.from(new Set(Object.values(next.latestByIdentity).map(x=>x&&x.route).filter(Boolean))).sort();
  next.routeCount=next.routes.length;
  next.generatedAt=now();
  return next;
}
export function buildObservabilityPackage(root=DEFAULT_ROOT){
  const obs=path.join(root,"observations");
  const inbox=path.join(obs,"inbox");
  const batchesDir=path.join(obs,"batches");
  fs.mkdirSync(inbox,{recursive:true});
  fs.mkdirSync(batchesDir,{recursive:true});
  fs.mkdirSync(path.join(obs,"latest"),{recursive:true});

  let index=loadPackageIndex(obs);
  const indexValid=index&&index.schema==="signal-interpreter-platform-index/v1"&&index.latestByIdentity&&typeof index.latestByIdentity==="object";
  if(!indexValid||(!fs.existsSync(path.join(obs,"manifest.json"))&&Number(index.observations||0)===0)){
    index=rebuildFromBatches(obs,index);
  }
  const inboxFiles=listJson(inbox);
  let processedInbox=0,lastInput=null;
  for(const inboxFile of inboxFiles){
    const batch=readJson(inboxFile,null);
    if(!batch||batch.schema!==BATCH_SCHEMA||!batch.batchId)continue;
    const destination=path.join(batchesDir,fileToken(batch.batchId)+".json");
    if(!fs.existsSync(destination))fs.copyFileSync(inboxFile,destination);
    const result=applyBatchToIndex(obs,index,batch);
    index.observations=Number(index.observations||0)+result.changedObservations;
    index.deltas=Number(index.deltas||0)+result.changedDeltas;
    index.identityCount=Object.keys(index.latestByIdentity).length;
    index.routes=Array.from(new Set(Object.values(index.latestByIdentity).map(x=>x&&x.route).filter(Boolean))).sort();
    index.routeCount=index.routes.length;
    processedInbox+=1;
    if(!lastInput||batchTime(batch)>batchTime(lastInput))lastInput=batch;
    fs.rmSync(inboxFile,{force:true});
  }

  const latestReal=lastInput&&isRealBatch(lastInput)?lastInput:findLatestRealBatch(obs);
  const generatedAt=now();
  index.generatedAt=generatedAt;
  writeJson(path.join(obs,"platform-index.json"),index);
  writeJson(path.join(obs,"platform-latest.json"),{
    schema:"signal-interpreter-platform-latest/v1",
    generatedAt,
    observations:Number(index.observations||0),
    deltas:Number(index.deltas||0),
    identityCount:Number(index.identityCount||0),
    routeCount:Number(index.routeCount||0),
    routes:index.routes||[],
    latestByIdentity:index.latestByIdentity||{}
  });

  const manifest={
    schema:PACKAGE_SCHEMA,
    generatedAt,
    lastBatchId:latestReal&&latestReal.batchId||null,
    lastSequence:Number(latestReal&&latestReal.summary&&latestReal.summary.lastSequence||0),
    extensionVersion:String(latestReal&&latestReal.extensionVersion||"unknown"),
    eventCount:Number(latestReal&&latestReal.summary&&latestReal.summary.eventsTotal||0),
    totalBatchFiles:listJson(batchesDir).length,
    platform:{
      observations:Number(index.observations||0),
      deltas:Number(index.deltas||0),
      identities:Number(index.identityCount||0)
    }
  };
  writeJson(path.join(obs,"manifest.json"),manifest);

  if(latestReal){
    writeJson(path.join(obs,"latest","latest.json"),latestReal);
    fs.writeFileSync(path.join(obs,"latest","latest-summary.md"),buildLatestSummary(latestReal,index),"utf8");
  }

  const health={
    schema:"signal-interpreter-observability-build-health/v1",
    generatedAt,
    source:"github-actions",
    processedInbox,
    lastInputBatchId:lastInput&&lastInput.batchId||null,
    lastInputCreatedAt:lastInput&&lastInput.createdAt||null,
    latestRealBatchId:latestReal&&latestReal.batchId||null,
    batchFiles:manifest.totalBatchFiles,
    platformSnapshots:Number(index.observations||0),
    platformDeltas:Number(index.deltas||0),
    identities:Number(index.identityCount||0),
    inboxRemaining:listJson(inbox).length,
    status:"ok"
  };
  writeJson(path.join(obs,"health","github-build.json"),health);
  return{manifest,index,health};
}

if(import.meta.url===`file://${process.argv[1]?.replaceAll("\\\\","/")}`){
  const root=process.argv[2]?path.resolve(process.argv[2]):DEFAULT_ROOT;
  const result=buildObservabilityPackage(root);
  console.log("OBSERVABILITY_GITHUB_BUILD=PASS",JSON.stringify({
    processedInbox:result.health.processedInbox,
    batches:result.health.batchFiles,
    identities:result.health.identities,
    snapshots:result.health.platformSnapshots,
    deltas:result.health.platformDeltas
  }));
}
