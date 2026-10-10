import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8"))}
function assert(condition,message){if(!condition)throw new Error(message)}

export function auditObservabilityPackage(observationsRoot){
  const root=path.resolve(observationsRoot);
  const manifestFile=path.join(root,"manifest.json");
  const indexFile=path.join(root,"platform-index.json");
  const latestFile=path.join(root,"platform-latest.json");
  const screenshotIndexFile=path.join(root,"screenshots-index.json");
  const latestObservationFile=path.join(root,"latest","latest.json");
  const latestSummaryFile=path.join(root,"latest","latest-summary.md");
  const callReportsIndexFile=path.join(root,"call-reports","index.json");
  const latestCallReportFile=path.join(root,"latest","latest-call-report.json");
  const latestCallReportMarkdown=path.join(root,"latest","latest-call-report.md");
  assert(fs.existsSync(root),"observations directory missing");
  const manifestExists=fs.existsSync(manifestFile),indexExists=fs.existsSync(indexFile),latestExists=fs.existsSync(latestFile);
  if(!manifestExists&&!indexExists&&!latestExists){
    return {ok:true,status:"uninitialized",manifest:null,identityCount:0,observations:0,deltas:0,routeCount:0};
  }
  assert(fs.existsSync(manifestFile),"observations/manifest.json missing");
  assert(fs.existsSync(indexFile),"observations/platform-index.json missing");
  assert(fs.existsSync(latestFile),"observations/platform-latest.json missing");
  assert(fs.existsSync(screenshotIndexFile),"observations/screenshots-index.json missing");

  const manifest=readJson(manifestFile),index=readJson(indexFile),latest=readJson(latestFile),screenshots=readJson(screenshotIndexFile);
  if(fs.existsSync(latestObservationFile)){
    const latestObservation=readJson(latestObservationFile);
    assert(latestObservation.schema==="signal-interpreter-observation-batch/v1","latest observation schema invalid");
    assert(latestObservation.trigger!=="observability-self-test","latest observation must never point to a self-test");
    assert(latestObservation.batchId===manifest.lastBatchId,"manifest lastBatchId must match latest observation");
    if(fs.existsSync(latestSummaryFile)){
      const summary=fs.readFileSync(latestSummaryFile,"utf8");
      const match=summary.match(/^- Batch:\s*(.+)$/m);
      assert(match&&match[1]===latestObservation.batchId,"latest summary must match latest observation batch");
      assert(!/^- Trigger:\s*observability-self-test$/m.test(summary),"latest summary must never be a self-test");
    }
  }
  assert(manifest.schema==="signal-interpreter-observability-package/v1","invalid observability manifest schema");
  assert(index.schema==="signal-interpreter-platform-index/v1","invalid platform index schema");
  assert(latest.schema==="signal-interpreter-platform-latest/v1" || latest.schema==="signal-interpreter-platform-index/v1","invalid platform latest schema");
  assert(screenshots.schema==="signal-interpreter-platform-screenshot-index/v1","invalid screenshot index schema");
  assert(Number.isFinite(Number(screenshots.changed)),"screenshot index changed count missing");
  assert(Number.isFinite(Number(screenshots.errors)),"screenshot index errors count missing");
  assert(Number.isFinite(Number(screenshots.routeCount)),"screenshot index routeCount missing");
  assert(Number(manifest.platform&&manifest.platform.screenshotsChanged||0)===Number(screenshots.changed||0),"manifest screenshot change count mismatch");
  assert(Number(manifest.platform&&manifest.platform.screenshotErrors||0)===Number(screenshots.errors||0),"manifest screenshot error count mismatch");

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

  let callReportCount=0,callReportPartialCount=0,callReportCompleteCount=0;
  if(fs.existsSync(callReportsIndexFile)){
    const reports=readJson(callReportsIndexFile);
    assert(reports.schema==="signal-interpreter-call-report-index/v1","invalid call report index schema");
    assert(reports.reportsByCallRef&&typeof reports.reportsByCallRef==="object","call report map missing");
    const entries=Object.entries(reports.reportsByCallRef);
    callReportCount=entries.length;
    assert(Number(reports.reportCount||0)===callReportCount,"call report index count mismatch");
    for(const [callRef,entry] of entries){
      assert(/^[a-f0-9]{24}$/.test(callRef),"call report reference must be opaque SHA-256 prefix");
      assert(entry&&typeof entry.reportPath==="string"&&entry.reportPath.startsWith("call-reports/"),"call report path missing or outside report root");
      assert(!entry.reportPath.includes("..")&&!path.isAbsolute(entry.reportPath),"unsafe call report path");
      const reportFile=path.join(root,entry.reportPath);
      assert(fs.existsSync(reportFile),"call report file missing: "+callRef);
      const report=readJson(reportFile);
      assert(report.schema==="signal-interpreter-call-report/v1","invalid call report schema: "+callRef);
      assert(report.callRef===callRef&&report.call&&report.call.callRef===callRef,"call report identity mismatch");
      assert(report.privacy&&report.privacy.rawAudioIncluded===false&&report.privacy.rawTranscriptIncluded===false,"call report privacy contract invalid");
      assert(report.privacy.fullCallIdIncluded===false&&report.privacy.credentialsIncluded===false,"call report contains forbidden identity/credential contract");
      assert(report.endConfirmation&&typeof report.endConfirmation.ratingStarsVisible==="boolean","call report rating evidence missing");
      assert(report.completeness&&Array.isArray(report.completeness.missingSignals),"call report completeness evidence missing");
      if(report.status==="complete")callReportCompleteCount+=1;else callReportPartialCount+=1;
    }
    assert(callReportCompleteCount===Number(reports.completedCount||0),"call report complete count mismatch");
    assert(callReportPartialCount===Number(reports.partialCount||0),"call report partial count mismatch");
    if(callReportCount){
      assert(reports.latestCallRef&&reports.reportsByCallRef[reports.latestCallRef],"latest call report index pointer invalid");
      assert(reports.latestReportPath===reports.reportsByCallRef[reports.latestCallRef].reportPath,"latest call report path mismatch");
      assert(fs.existsSync(latestCallReportFile),"latest call report JSON missing");
      assert(fs.existsSync(latestCallReportMarkdown),"latest call report Markdown missing");
      const latestReport=readJson(latestCallReportFile);
      assert(latestReport.schema==="signal-interpreter-call-report/v1","latest call report schema invalid");
      assert(latestReport.callRef===reports.latestCallRef,"latest call report pointer mismatch");
      assert(!fs.readFileSync(latestCallReportMarkdown,"utf8").includes("rawTranscriptIncluded: true"),"latest Markdown violates transcript privacy");
    }else{
      assert(reports.latestCallRef===null||reports.latestCallRef===undefined,"empty call report index must not have latest reference");
      assert(!fs.existsSync(latestCallReportFile),"empty call report index must not have a latest JSON");
    }
    if(manifest.calls)assert(Number(manifest.calls.reportCount||0)===callReportCount,"manifest call report count mismatch");
  }

  return {ok:true,manifest,identityCount:checked,observations:Number(index.observations||0),deltas:Number(index.deltas||0),routeCount:Number(index.routeCount||0),callReportCount:callReportCount,callReportCompleteCount:callReportCompleteCount,callReportPartialCount:callReportPartialCount};
}

if(import.meta.url==="file://"+process.argv[1].replace(/\\\\/g,"/")){
  const result=auditObservabilityPackage(process.argv[2]||"observations");
  console.log("OBSERVABILITY_PACKAGE_AUDIT=PASS");
  console.log(JSON.stringify({identityCount:result.identityCount,observations:result.observations,deltas:result.deltas,routeCount:result.routeCount}));
}
