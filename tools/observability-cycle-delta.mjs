import fs from "node:fs";
import path from "node:path";

const DELTA_SCHEMA="signal-interpreter-cycle-delta/v1";
const CHECKPOINT_SCHEMA="signal-interpreter-cycle-checkpoint/v1";

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8"))}
function writeJson(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+"\n")}
function readOptional(file,fallback){try{return fs.existsSync(file)?readJson(file):fallback}catch(_){return fallback}}
function arr(value){return Array.isArray(value)?value:[]}
function unique(values){return Array.from(new Set(values.filter(Boolean).map(String))).sort()}
function numberOr(value,fallback=0){return Number.isFinite(Number(value))?Number(value):fallback}

export function defaultCheckpoint(){
  return {
    schema:CHECKPOINT_SCHEMA,
    generatedAt:null,
    lastBatchId:null,
    lastSequence:0,
    platformObservations:0,
    platformDeltas:0,
    routes:[],
    identities:[],
    actions:[],
    categories:[]
  };
}

function loadBatches(observationsRoot){
  const dir=path.join(observationsRoot,"batches");
  if(!fs.existsSync(dir))return[];
  return fs.readdirSync(dir).filter(name=>name.endsWith(".json")).sort().map(name=>path.join(dir,name));
}

function eventsSince(observationsRoot,lastSequence){
  const events=[];
  for(const file of loadBatches(observationsRoot)){
    let batch;
    try{batch=readJson(file)}catch(_){continue}
    for(const event of arr(batch.events)){
      if(numberOr(event.sequence,0)>lastSequence)events.push(event)
    }
  }
  events.sort((a,b)=>numberOr(a.sequence)-numberOr(b.sequence));
  return events;
}

export function computeCycleDelta(observationsRoot,checkpointInput){
  const root=path.resolve(observationsRoot);
  const checkpoint=Object.assign(defaultCheckpoint(),checkpointInput||{});
  const manifestFile=path.join(root,"manifest.json");
  const indexFile=path.join(root,"platform-index.json");
  const missing=[];
  if(!fs.existsSync(manifestFile))missing.push("manifest.json");
  if(!fs.existsSync(indexFile))missing.push("platform-index.json");
  if(missing.length)return{
    schema:DELTA_SCHEMA,status:"uninitialized",generatedAt:new Date().toISOString(),
    missing,checkpoint,summary:{newEvents:0,newErrors:0,newWarnings:0,newActions:[],newCategories:[],newRoutes:[],newIdentities:[],newPlatformObservations:0,newPlatformDeltas:0}
  };

  const manifest=readJson(manifestFile);
  const index=readJson(indexFile);
  const events=eventsSince(root,numberOr(checkpoint.lastSequence,0));
  const currentRoutes=unique(index.routes);
  const currentIdentities=Object.keys(index.latestByIdentity&&typeof index.latestByIdentity==="object"?index.latestByIdentity:{});
  const actions=unique(events.map(e=>e.action));
  const categories=unique(events.map(e=>e.category));
  const knownActions=new Set(arr(checkpoint.actions).map(String));
  const knownCategories=new Set(arr(checkpoint.categories).map(String));
  const knownRoutes=new Set(arr(checkpoint.routes).map(String));
  const knownIdentities=new Set(arr(checkpoint.identities).map(String));
  const newActions=actions.filter(x=>!knownActions.has(x));
  const newCategories=categories.filter(x=>!knownCategories.has(x));
  const newRoutes=currentRoutes.filter(x=>!knownRoutes.has(x));
  const newIdentities=currentIdentities.filter(x=>!knownIdentities.has(x));
  const errors=events.filter(e=>e.level==="error");
  const warnings=events.filter(e=>e.level==="warn");
  const actionErrors={};
  for(const event of errors){
    const key=String(event.action||"UNKNOWN");
    actionErrors[key]=numberOr(actionErrors[key])+1;
  }
  const eventFirst=events[0]||null;
  const eventLast=events[events.length-1]||null;
  const currentObservations=numberOr(manifest.platform&&manifest.platform.observations);
  const currentDeltas=numberOr(manifest.platform&&manifest.platform.deltas);
  const result={
    schema:DELTA_SCHEMA,status:"ready",generatedAt:new Date().toISOString(),
    previous:checkpoint,
    current:{
      generatedAt:manifest.generatedAt||null,
      lastBatchId:manifest.lastBatchId||null,
      lastSequence:numberOr(manifest.lastSequence),
      extensionVersion:manifest.extensionVersion||null,
      eventCount:numberOr(manifest.eventCount),
      platformObservations:currentObservations,
      platformDeltas:currentDeltas,
      platformIdentities:numberOr(manifest.platform&&manifest.platform.identities),
      routeCount:numberOr(index.routeCount),
      identityCount:numberOr(index.identityCount)
    },
    summary:{
      newEvents:events.length,
      newErrors:errors.length,
      newWarnings:warnings.length,
      newActions,
      newCategories,
      newRoutes,
      newIdentities,
      newPlatformObservations:Math.max(0,currentObservations-numberOr(checkpoint.platformObservations)),
      newPlatformDeltas:Math.max(0,currentDeltas-numberOr(checkpoint.platformDeltas)),
      firstNewSequence:eventFirst?numberOr(eventFirst.sequence):null,
      lastNewSequence:eventLast?numberOr(eventLast.sequence):null
    },
    errorActionCounts:actionErrors,
    findings:{
      novelty:newActions.length>0||newRoutes.length>0||newIdentities.length>0||events.length>0,
      platformChanged:newRoutes.length>0||newIdentities.length>0||currentDeltas>numberOr(checkpoint.platformDeltas),
      regressionSignal:errors.length>0,
      warningSignal:warnings.length>0,
      unknowns:missing
    },
    recommendedFocus:[
      ...Object.entries(actionErrors).sort((a,b)=>b[1]-a[1]).map(([action,count])=>({type:"error-action",action,count})),
      ...newRoutes.map(route=>({type:"new-route",route})),
      ...newIdentities.map(identity=>({type:"new-platform-identity",identity})),
      ...newActions.map(action=>({type:"new-action",action}))
    ].slice(0,50)
  };
  return result;
}

export function checkpointFromPackage(observationsRoot){
  const root=path.resolve(observationsRoot);
  const manifest=readJson(path.join(root,"manifest.json"));
  const index=readJson(path.join(root,"platform-index.json"));
  return {
    schema:CHECKPOINT_SCHEMA,
    generatedAt:new Date().toISOString(),
    lastBatchId:manifest.lastBatchId||null,
    lastSequence:numberOr(manifest.lastSequence),
    platformObservations:numberOr(manifest.platform&&manifest.platform.observations),
    platformDeltas:numberOr(manifest.platform&&manifest.platform.deltas),
    routes:unique(index.routes),
    identities:unique(Object.keys(index.latestByIdentity&&typeof index.latestByIdentity==="object"?index.latestByIdentity:{})),
    actions:unique(loadBatches(root).flatMap(file=>{try{return arr(readJson(file).events).map(e=>e.action)}catch(_){return[]}})),
    categories:unique(loadBatches(root).flatMap(file=>{try{return arr(readJson(file).events).map(e=>e.category)}catch(_){return[]}}))
  };
}

if(import.meta.url==="file://"+process.argv[1].replace(/\\\\/g,"/")){
  const root=process.argv.includes("--root")?process.argv[process.argv.indexOf("--root")+1]:"observations";
  const checkpointFile=process.argv.includes("--checkpoint")?process.argv[process.argv.indexOf("--checkpoint")+1]:"observations/cycle-checkpoint.json";
  const reportFile=process.argv.includes("--report")?process.argv[process.argv.indexOf("--report")+1]:"observations/cycle-delta/latest.json";
  const advance=process.argv.includes("--advance");
  const checkpoint=readOptional(checkpointFile,defaultCheckpoint());
  const delta=computeCycleDelta(root,checkpoint);
  writeJson(reportFile,delta);
  if(advance&&delta.status==="ready")writeJson(checkpointFile,checkpointFromPackage(root));
  console.log("OBSERVABILITY_CYCLE_DELTA="+delta.status.toUpperCase());
  console.log(JSON.stringify(delta.summary));
}
