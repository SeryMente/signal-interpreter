import fs from "node:fs";

export function auditObservabilityFreshness(health,nowMs=Date.now()){
  const failures=[];
  const freshness=health&&health.freshness||{};
  const receivedAt=Date.parse(freshness.latestRelayReceivedAt||health&&health.latestBatchRelayReceivedAt||"");
  if(!Number.isFinite(receivedAt)){
    failures.push({code:"RELAY_RECEIPT_UNAVAILABLE",message:"No existe hora de recepción confiable del último batch."});
  }else{
    const ageMs=nowMs-receivedAt;
    if(ageMs < -30000)failures.push({code:"RELAY_RECEIPT_IN_FUTURE",message:"La hora del relay aparece más de 30 s en el futuro.",ageMs:ageMs});
    else if(ageMs>300000)failures.push({code:"OBSERVABILITY_STALE",message:"No se recibió actividad de observabilidad en más de 5 minutos.",ageMs:ageMs});
    else if(ageMs>120000)failures.push({code:"OBSERVABILITY_DELAYED",message:"La última actividad recibida supera 2 minutos.",ageMs:ageMs});
  }
  if(Number(health&&health.inboxRemaining||0)>0)failures.push({code:"OBSERVABILITY_BACKLOG",message:"Hay batches pendientes sin procesar.",inboxRemaining:Number(health.inboxRemaining)});
  if(health&&health.runtimeVersionMismatch===true)failures.push({
    code:"EXTENSION_RUNTIME_VERSION_MISMATCH",
    message:"La versión observada de Chrome no coincide con la versión publicada.",
    observed:health.extensionVersion||null,expected:health.expectedExtensionVersion||null
  });
  return{
    ok:failures.length===0,
    checkedAt:new Date(nowMs).toISOString(),
    receivedAt:Number.isFinite(receivedAt)?new Date(receivedAt).toISOString():null,
    ageMs:Number.isFinite(receivedAt)?nowMs-receivedAt:null,
    failures:failures
  };
}
if(import.meta.url===new URL(process.argv[1]||"", "file://"+process.cwd()+"/").href){
  const file=process.argv[2]||"observations/health/github-build.json";
  let health;
  try{health=JSON.parse(fs.readFileSync(file,"utf8"));}
  catch(error){console.error("OBSERVABILITY_FRESHNESS_AUDIT=FAIL",String(error));process.exit(1);}
  const result=auditObservabilityFreshness(health);
  if(!result.ok){
    for(const failure of result.failures)console.error("::error title="+failure.code+"::"+failure.message);
    console.error("OBSERVABILITY_FRESHNESS_AUDIT=FAIL",JSON.stringify(result));
    process.exit(1);
  }
  console.log("OBSERVABILITY_FRESHNESS_AUDIT=PASS",JSON.stringify(result));
}
