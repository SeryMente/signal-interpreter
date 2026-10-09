(function(global){
"use strict";
var RELAY_BASE="https://signal-interpreter-observability-re.vercel.app";
var RELAY_ENDPOINT=RELAY_BASE+"/api/batch";
var SCREENSHOT_ENDPOINT=RELAY_BASE+"/api/screenshot";
var REPOSITORY="SeryMente/signal-interpreter";
var REQUEST_TIMEOUT_MS=15000;
async function request(init){
  init=init||{};
  var endpoint=init.endpoint||RELAY_ENDPOINT;
  if(init.endpoint)delete init.endpoint;
  var controller=new AbortController();
  var timer=setTimeout(function(){controller.abort();},REQUEST_TIMEOUT_MS);
  try{
    var response=await fetch(endpoint,Object.assign({method:"GET",cache:"no-store",signal:controller.signal},init));
    var text=await response.text(),data=null;
    try{data=text?JSON.parse(text):null;}catch(_){data=text;}
    if(!response.ok){var error=new Error("Relay HTTP "+response.status);error.status=response.status;error.data=data;throw error;}
    return data;
  }finally{clearTimeout(timer);}
}
async function getStatus(){
  try{
    var data=await request({method:"GET"});
    return{reachable:true,configured:!!(data&&data.configured===true),repository:data&&data.repository||REPOSITORY,branch:data&&data.branch||"main",mode:data&&data.mode||"vercel-to-github",batchContract:data&&data.batchContract||null,publishHistory:data&&data.publishHistory||null,modelContextAccess:data&&data.modelContextAccess||null,error:data&&data.configured===false?"Relay reachable but GitHub is not configured":null};
  }catch(error){
    return{reachable:false,configured:false,repository:REPOSITORY,error:String(error&&error.message||error)};
  }
}
async function uploadScreenshot(screenshot){
  if(!screenshot||screenshot.schema!=="signal-interpreter-platform-screenshot/v1")throw new Error("Schema de screenshot no soportado");
  if(!/^[a-f0-9]{64}$/i.test(String(screenshot.sha256||"")))throw new Error("Hash de screenshot inválido");
  if(String(screenshot.mimeType||"")!=="image/jpeg")throw new Error("Solo JPEG soportado");
  if(!String(screenshot.base64||""))throw new Error("Screenshot vacío");
  var result = await request({endpoint:SCREENSHOT_ENDPOINT,method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(screenshot)});
  if(!result || result.accepted!==true || String(result.sha256||"").toLowerCase()!==String(screenshot.sha256||"").toLowerCase() ||
      !String(result.remotePath||"").startsWith("observations/platform-screenshots/")) {
    throw new Error("Relay no confirmó la persistencia idempotente del screenshot");
  }
  return result;
}
async function uploadBatch(batch){
  if(!batch||batch.schema!=="signal-interpreter-observation-batch/v1")throw new Error("Schema de batch no soportado");
  var batchId=String(batch.batchId||"");
  if(!/^[A-Za-z0-9._-]{1,120}$/.test(batchId))throw new Error("batchId inválido");
  var result = await request({endpoint:RELAY_ENDPOINT,method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(batch)});
  var expectedPath = "observations/inbox/" + batchId + ".json";
  if(!result || result.accepted!==true || result.batchId!==batchId || result.remotePath!==expectedPath || !result.contentSha) {
    throw new Error("Relay no confirmó el batch exacto en la cola durable de GitHub");
  }
  return result;
}
global.SignalObservabilityRelay={getStatus:getStatus,uploadBatch:uploadBatch,uploadScreenshot:uploadScreenshot,repository:REPOSITORY,endpoint:RELAY_ENDPOINT,screenshotEndpoint:SCREENSHOT_ENDPOINT};
})(typeof self!=="undefined"?self:window);
