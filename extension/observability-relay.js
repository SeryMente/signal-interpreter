(function(global){
"use strict";
var RELAY_BASE="https://signal-interpreter-observability-re.vercel.app";
var RELAY_ENDPOINT=RELAY_BASE+"/api/batch";
var SCREENSHOT_ENDPOINT=RELAY_BASE+"/api/screenshot";
var REPOSITORY="SeryMente/signal-interpreter";
var REQUEST_TIMEOUT_MS=15000;
async function request(init){
  var controller=new AbortController();
  var timer=setTimeout(function(){controller.abort();},REQUEST_TIMEOUT_MS);
  try{
    var response=await fetch(RELAY_ENDPOINT,Object.assign({method:"GET",cache:"no-store",signal:controller.signal},init||{}));
    var text=await response.text(); var data=null;
    try{data=text?JSON.parse(text):null;}catch(_){data=text;}
    if(!response.ok){var error=new Error("Relay HTTP "+response.status);error.status=response.status;error.data=data;throw error;}
    return data;
  }finally{clearTimeout(timer);}
}
async function getStatus(){
  try{
    var data=await request({method:"GET"});
    return{reachable:true,configured:true,repository:data&&data.repository||REPOSITORY,mode:data&&data.mode||"vercel-to-github",publishHistory:data&&data.publishHistory||null,modelContextAccess:data&&data.modelContextAccess||null,error:null};
  }catch(error){
    return{reachable:false,configured:true,repository:REPOSITORY,error:String(error&&error.message||error)};
  }
}
async function uploadScreenshot(screenshot){
  if(!screenshot||screenshot.schema!=="signal-interpreter-platform-screenshot/v1")throw new Error("Schema de captura de plataforma no soportado");
  var hash=String(screenshot.sha256||"");
  if(!/^[a-f0-9]{64}$/i.test(hash))throw new Error("Hash de captura inválido");
  return request({method:"POST",url:SCREENSHOT_ENDPOINT,headers:{"Content-Type":"application/json"},body:JSON.stringify(screenshot)});
}
async function uploadBatch(batch){
  if(!batch||batch.schema!=="signal-interpreter-observation-batch/v1")throw new Error("Schema de batch no soportado");
  var batchId=String(batch.batchId||"");
  if(!/^[A-Za-z0-9._-]{1,120}$/.test(batchId))throw new Error("batchId inválido");
  return request({method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(batch)});
}
global.SignalObservabilityRelay={getStatus:getStatus,uploadBatch:uploadBatch,uploadScreenshot:uploadScreenshot,repository:REPOSITORY,endpoint:RELAY_ENDPOINT,screenshotEndpoint:SCREENSHOT_ENDPOINT};
})(typeof self!=="undefined"?self:window);
