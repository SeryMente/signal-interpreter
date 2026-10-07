import fs from "node:fs";
import path from "node:path";

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8"))}
function assert(condition,message){if(!condition)throw new Error(message)}

export function auditObservabilityPackage(observationsRoot){
  const root=path.resolve(observationsRoot);
  const manifestFile=path.join(root,"manifest.json");
  const indexFile=path.join(root,"platform-index.json");
  const latestFile=path.join(root,"platform-latest.json");
  assert(fs.existsSync(root),"observations directory missing");
  assert(fs.existsSync(manifestFile),"observations/manifest.json missing");
  assert(fs.existsSync(indexFile),"observations/platform-index.json missing");
  assert(fs.existsSync(latestFile),"observations/platform-latest.json missing");

  const manifest=readJson(manifestFile),index=readJson(indexFile),latest=readJson(latestFile);
  assert(manifest.schema==="signal-interpreter-observability-package/v1","invalid observability manifest schema");
  assert(index.schema==="signal-interpreter-platform-index/v1","invalid platform index schema");
  assert(latest.schema==="signal-interpreter-platform-index/v1","invalid platform latest schema");

  for(const key of ["lastSequence","eventCount","platform.observations","platform.deltas","platform.identities"]){
    const value=key.split(".").reduce((object,part)=>object&&object[part],manifest);
    assert(Number.isFinite(Number(value)),"manifest numeric field invalid: "+key);
  }
  assert(Number(index.identityCount||0)>=0,"platform identity count invalid");
  assert(Number(index.routeCount||0)>=0,"platform route count invalid");
  assert(Array.isArray(index.routes),"platform routes must be an array");
  assert(index.latestByIdentity&&typeof index.latestByIdentity==="object","latestByIdentity missing");

  let checked=0,missing=0,deltasMissing=0;
  for(const [identity,value] of Object.entries(index.latestByIdentity)){
    checked+=1;
    assert(value&&value.snapshotPath,"identity missing snapshotPath: "+identity);
    const snapshotFile=path.join(root,value.snapshotPath);
    if(!fs.existsSync(snapshotFile)){missing+=1;continue}
    const snapshot=readJson(snapshotFile);
    assert(snapshot.schema==="signal-interpreter-platform-observation/v1","invalid platform observation schema: "+identity);
    assert(snapshot.identityKey===identity,"snapshot identity mismatch: "+identity);
    if(value.lastDeltaPath){
      const deltaFile=path.join(root,value.lastDeltaPath);
      if(!fs.existsSync(deltaFile)){deltasMissing+=1;continue}
      const delta=readJson(deltaFile);
      assert(delta.schema==="signal-interpreter-platform-delta/v1","invalid delta schema: "+identity);
      assert(delta.identityKey===identity,"delta identity mismatch: "+identity);
      assert(delta.toHash===snapshot.snapshotHash,"delta does not point to latest snapshot hash: "+identity);
    }
  }
  assert(missing===0,"missing platform snapshot files: "+missing);
  assert(deltasMissing===0,"missing referenced platform delta files: "+deltasMissing);
  assert(Number(index.identityCount||0)===checked,"platform identity count/index mismatch");

  return {ok:true,manifest,identityCount:checked,observations:Number(index.observations||0),deltas:Number(index.deltas||0),routeCount:Number(index.routeCount||0)};
}

if(import.meta.url==="file://"+process.argv[1].replace(/\\\\/g,"/")){
  const result=auditObservabilityPackage(process.argv[2]||"observations");
  console.log("OBSERVABILITY_PACKAGE_AUDIT=PASS");
  console.log(JSON.stringify({identityCount:result.identityCount,observations:result.observations,deltas:result.deltas,routeCount:result.routeCount}));
}
