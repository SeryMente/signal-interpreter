(function(global){
"use strict";
var TARGET_ORIGIN="https://app.cloudinterpreter.com";
var ALARM_NAME="signal-platform-screenshot";
var PERIOD_MINUTES=0.5;
var MAX_RAW_BYTES=740000;
var QUALITY_STEPS=[45,35,25];
var queue=Promise.resolve(),configured={record:null,relay:null};

function iso(){return new Date().toISOString();}
function isTarget(url){try{return new URL(String(url||"")).origin===TARGET_ORIGIN;}catch(_){return false;}}
function routeOf(url){try{var u=new URL(String(url||""));return u.pathname.replace(/\/call\/[^/]+/g,"/call/<ID>").replace(/\/profile\/[^/]+/g,"/profile/<ID>");}catch(_){return "/unknown";}}
function identityOf(url){return TARGET_ORIGIN+"|"+routeOf(url);}
function routeToken(route){return String(route||"platform").replace(/[^A-Za-z0-9_-]+/g,"_").replace(/^_+|_+$/g,"").slice(0,90)||"platform";}
function bytesFromBase64(value){return Math.floor(String(value||"").length*3/4)-((String(value||"").endsWith("=="))?2:(String(value||"").endsWith("=")?1:0));}
function base64Bytes(value){var raw=atob(String(value||"")),out=new Uint8Array(raw.length);for(var i=0;i<raw.length;i+=1)out[i]=raw.charCodeAt(i);return out;}
async function sha256(value){var bytes=base64Bytes(value),digest=await crypto.subtle.digest("SHA-256",bytes),arr=new Uint8Array(digest),hex="";for(var i=0;i<arr.length;i+=1)hex+=("00"+arr[i].toString(16)).slice(-2);return hex;}
function rec(action,payload,level){
  try{if(typeof configured.record==="function")configured.record(action,payload||{},level||"info","platform-screenshot");else console.log("[SIGNAL-INTERPRETER]",action,payload||{});}catch(_){}
}
async function loadState(){
  var stored=await chrome.storage.local.get(["signalPlatformScreenshotState"]);
  return Object.assign({version:1,lastByIdentity:{},totalCaptures:0,totalUploads:0,lastCaptureAt:null,lastUploadAt:null,lastError:null},stored.signalPlatformScreenshotState||{});
}
async function saveState(state){await chrome.storage.local.set({signalPlatformScreenshotState:state});}
function extractBase64(dataUrl){var comma=String(dataUrl||"").indexOf(",");return comma>=0?String(dataUrl).slice(comma+1):"";}
async function captureOne(tab,reason){
  if(!tab||!isTarget(tab.url)||tab.active!==true)return{ok:false,skipped:"not-active-target"};
  var beforeUrl=String(tab.url||""),dataUrl="",qualityUsed=null,lastSize=0,overlayHidden=false;
  try{
    try{
      var prep=await chrome.tabs.sendMessage(Number(tab.id),{type:"EFFECTIF_SCREENSHOT_PREPARE"});
      overlayHidden=!!(prep&&prep.ok);
      if(overlayHidden)await new Promise(function(resolve){setTimeout(resolve,80);});
    }catch(_){}
    for(var i=0;i<QUALITY_STEPS.length;i+=1){
      dataUrl=await chrome.tabs.captureVisibleTab(Number(tab.windowId),{format:"jpeg",quality:QUALITY_STEPS[i]});
      var b64=extractBase64(dataUrl);lastSize=bytesFromBase64(b64);qualityUsed=QUALITY_STEPS[i];
      if(lastSize<=MAX_RAW_BYTES)break;
    }
    var current=await chrome.tabs.get(Number(tab.id));
    if(!current||current.active!==true||!isTarget(current.url)||String(current.url||"")!==beforeUrl){
      rec("PLATFORM_SCREENSHOT_DISCARDED_TAB_CHANGED",{tabId:Number(tab.id),windowId:Number(tab.windowId),reason:reason||"capture",beforeUrl:beforeUrl,afterUrl:String(current&&current.url||""),afterActive:!!(current&&current.active)},"warn");
      return{ok:false,skipped:"tab-changed"};
    }
    var b64=extractBase64(dataUrl);
    if(lastSize>MAX_RAW_BYTES){
      rec("PLATFORM_SCREENSHOT_TOO_LARGE",{tabId:Number(tab.id),route:routeOf(beforeUrl),bytes:lastSize,maxBytes:MAX_RAW_BYTES,quality:qualityUsed,reason:reason||"capture"},"warn");
      return{ok:false,error:"Screenshot exceeds upload size limit",bytes:lastSize};
    }
    var hash=await sha256(b64),route=routeOf(beforeUrl),identity=identityOf(beforeUrl),state=await loadState(),previous=state.lastByIdentity[identity]||null;
    state.totalCaptures=Number(state.totalCaptures||0)+1;state.lastCaptureAt=iso();
    if(previous&&previous.hash===hash){
      state.lastByIdentity[identity]=Object.assign({},previous,{lastCapturedAt:state.lastCaptureAt,lastReason:reason||"capture"});
      await saveState(state);
      rec("PLATFORM_SCREENSHOT_UNCHANGED",{tabId:Number(tab.id),windowId:Number(tab.windowId),route:route,hash:hash,bytes:lastSize,quality:qualityUsed,reason:reason||"capture"},"info");
      return{ok:true,changed:false,hash:hash,bytes:lastSize,route:route};
    }
    var screenshot={
      schema:"signal-interpreter-platform-screenshot/v1",
      screenshotId:"screen-"+crypto.randomUUID(),
      createdAt:state.lastCaptureAt,
      extensionVersion:chrome.runtime.getManifest().version,
      tabId:Number(tab.id),
      windowId:Number(tab.windowId),
      route:route,
      url:TARGET_ORIGIN+route,
      sha256:hash,
      mimeType:"image/jpeg",
      bytes:lastSize,
      quality:qualityUsed,
      captureReason:reason||"capture",
      imageBase64:b64,
      base64:b64
    };
    if(!configured.relay||typeof configured.relay.uploadScreenshot!=="function"){
      rec("PLATFORM_SCREENSHOT_UPLOAD_ERROR",{route:route,hash:hash,error:"Screenshot relay unavailable"},"error");
      return{ok:false,error:"Screenshot relay unavailable",hash:hash,route:route};
    }
    try{
      var uploaded=await configured.relay.uploadScreenshot(screenshot);
      state.lastByIdentity[identity]={hash:hash,route:route,uploadedAt:iso(),remotePath:uploaded&&uploaded.remotePath||null,bytes:lastSize,quality:qualityUsed};
      state.totalUploads=Number(state.totalUploads||0)+1;state.lastUploadAt=iso();state.lastError=null;
      await saveState(state);
      rec("PLATFORM_SCREENSHOT_CHANGED",{tabId:Number(tab.id),windowId:Number(tab.windowId),route:route,hash:hash,bytes:lastSize,quality:qualityUsed,remotePath:uploaded&&uploaded.remotePath||null,duplicate:!!(uploaded&&uploaded.duplicate),reason:reason||"capture"},"info");
      return{ok:true,changed:true,hash:hash,bytes:lastSize,route:route,remotePath:uploaded&&uploaded.remotePath||null,duplicate:!!(uploaded&&uploaded.duplicate)};
    }catch(error){
      state.lastError=String(error);await saveState(state);
      rec("PLATFORM_SCREENSHOT_UPLOAD_ERROR",{tabId:Number(tab.id),windowId:Number(tab.windowId),route:route,hash:hash,bytes:lastSize,error:String(error),reason:reason||"capture"},"error");
      return{ok:false,error:String(error),hash:hash,route:route};
    }
  }finally{
    if(overlayHidden){try{await chrome.tabs.sendMessage(Number(tab.id),{type:"EFFECTIF_SCREENSHOT_RESTORE"});}catch(_){}}
  }
}
async function captureActive(reason){
  var tabs=await chrome.tabs.query({active:true,url:[TARGET_ORIGIN+"/*"]});
  var results=[];
  for(var i=0;i<(tabs||[]).length;i+=1){
    try{results.push(await captureOne(tabs[i],reason||"alarm"));}catch(error){rec("PLATFORM_SCREENSHOT_CAPTURE_ERROR",{tabId:Number(tabs[i]&&tabs[i].id||0),windowId:Number(tabs[i]&&tabs[i].windowId||0),error:String(error),reason:reason||"alarm"},"error");}
  }
  return{ok:true,results:results};
}
function request(reason){
  queue=queue.then(function(){return captureActive(reason);},function(){return captureActive(reason);});
  return queue;
}
function start(){
  try{chrome.alarms.create(ALARM_NAME,{delayInMinutes:0.1,periodInMinutes:PERIOD_MINUTES});}catch(error){rec("PLATFORM_SCREENSHOT_ALARM_ERROR",{error:String(error)},"warn");}
}
function configure(options){configured=Object.assign(configured,options||{});return{ok:true,alarm:ALARM_NAME,periodMinutes:PERIOD_MINUTES,maxRawBytes:MAX_RAW_BYTES};}
global.SignalPlatformScreenshot={configure:configure,start:start,captureActive:captureActive,request:request,constants:{alarm:ALARM_NAME,periodMinutes:PERIOD_MINUTES,maxRawBytes:MAX_RAW_BYTES,targetOrigin:TARGET_ORIGIN}};
})(typeof self!=="undefined"?self:window);
