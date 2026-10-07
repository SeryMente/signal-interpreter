(function(global){
"use strict";

var API_BASE="https://api.github.com";
var LOGIN_BASE="https://github.com";
var REPOSITORY="SeryMente/signal-interpreter";
var REPOSITORY_ID="1388110981";
var API_VERSION="2026-03-10";
var CONFIG_KEY="signalGithubObservabilityConfig";
var AUTH_KEY="signalGithubObservabilityAuth";
var FLOW_KEY="signalGithubObservabilityDeviceFlow";
var INBOX_DIR="observations/inbox";
var PUBLISH_BRANCH="main";

function iso(){return new Date().toISOString();}
function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
function jsonHeaders(){return{"Accept":"application/vnd.github+json","Content-Type":"application/json","X-GitHub-Api-Version":API_VERSION};}
function formHeaders(){return{"Accept":"application/json","Content-Type":"application/x-www-form-urlencoded"};}
function base64Utf8(value){return btoa(unescape(encodeURIComponent(String(value))));}
function safeClientId(value){return /^[A-Za-z0-9_-]{6,120}$/.test(String(value||"").trim());}
async function readLocal(keys){return chrome.storage.local.get(keys);}
async function writeLocal(value){return chrome.storage.local.set(value);}

async function getConfig(){
  var stored=await readLocal([CONFIG_KEY]);
  return Object.assign({clientId:""},stored[CONFIG_KEY]||{});
}
async function setConfig(patch){
  var config=Object.assign({},await getConfig(),patch||{});
  config.clientId=String(config.clientId||"").trim();
  await writeLocal((function(){var o={};o[CONFIG_KEY]=config;return o;})());
  return config;
}
async function getAuth(){
  var stored=await readLocal([AUTH_KEY]);
  return stored[AUTH_KEY]||null;
}
async function setAuth(auth){
  var payload={};payload[AUTH_KEY]=auth;await writeLocal(payload);return auth;
}
async function clearAuth(){
  await chrome.storage.local.remove([AUTH_KEY,FLOW_KEY]);
}
async function request(url,init){
  var response=await fetch(url,Object.assign({cache:"no-store"},init||{}));
  var text=await response.text();
  var data=null;
  try{data=text?JSON.parse(text):null;}catch(_){data=text;}
  if(!response.ok){
    var error=new Error("GitHub HTTP "+response.status);
    error.status=response.status;
    error.data=data;
    throw error;
  }
  return data;
}
async function refreshAccessToken(auth){
  if(!auth||!auth.refreshToken)throw new Error("No hay refresh token");
  var config=await getConfig();
  if(!safeClientId(config.clientId))throw new Error("GitHub App Client ID no configurado");
  var body=new URLSearchParams();
  body.set("client_id",config.clientId);
  body.set("grant_type","refresh_token");
  body.set("refresh_token",auth.refreshToken);
  var data;
  try{
    data=await request(LOGIN_BASE+"/login/oauth/access_token",{method:"POST",headers:formHeaders(),body:body.toString()});
  }catch(error){
    await clearAuth();
    throw new Error("La autorización de GitHub expiró o fue revocada.");
  }
  if(!data||!data.access_token)throw new Error("GitHub no devolvió un nuevo access token");
  var next={
    accessToken:data.access_token,
    refreshToken:data.refresh_token||auth.refreshToken,
    accessTokenExpiresAt:data.expires_in?Date.now()+Number(data.expires_in)*1000:null,
    refreshTokenExpiresAt:data.refresh_token_expires_in?Date.now()+Number(data.refresh_token_expires_in)*1000:auth.refreshTokenExpiresAt||null,
    connectedAt:auth.connectedAt||iso(),
    repository:REPOSITORY
  };
  await setAuth(next);
  return next;
}
async function getValidAuth(){
  var auth=await getAuth();
  if(auth&&auth.accessToken&&(!auth.accessTokenExpiresAt||Date.now()<Number(auth.accessTokenExpiresAt)-60000))return auth;
  if(auth&&auth.refreshToken){
    return refreshAccessToken(auth);
  }
  return null;
}
async function githubApi(path,init,retried){
  var auth=await getValidAuth();
  if(!auth||!auth.accessToken)throw new Error("GitHub no está conectado.");
  var headers=Object.assign({},jsonHeaders(),(init&&init.headers)||{},{"Authorization":"Bearer "+auth.accessToken});
  try{
    return await request(API_BASE+path,Object.assign({},init||{},{headers:headers}));
  }catch(error){
    if(error.status===401&&!retried){
      await refreshAccessToken(auth).catch(function(){throw error;});
      return githubApi(path,init,true);
    }
    throw error;
  }
}
async function beginDeviceFlow(){
  var config=await getConfig();
  if(!safeClientId(config.clientId))throw new Error("Configura primero el Client ID de la GitHub App.");
  var body=new URLSearchParams();
  body.set("client_id",config.clientId);
  var data=await request(LOGIN_BASE+"/login/device/code",{method:"POST",headers:formHeaders(),body:body.toString()});
  if(!data||!data.device_code||!data.user_code)throw new Error("GitHub no devolvió un código de dispositivo válido.");
  var flow={
    deviceCode:data.device_code,
    userCode:data.user_code,
    verificationUri:data.verification_uri||LOGIN_BASE+"/login/device",
    interval:Math.max(5,Number(data.interval)||5),
    expiresAt:Date.now()+Math.max(60,Number(data.expires_in)||900)*1000,
    nextPollAt:Date.now()
  };
  var payload={};payload[FLOW_KEY]=flow;await writeLocal(payload);
  await chrome.tabs.create({url:flow.verificationUri});
  return{status:"authorization_pending",userCode:flow.userCode,verificationUri:flow.verificationUri,expiresAt:flow.expiresAt,interval:flow.interval};
}
async function pollDeviceFlow(){
  var stored=await readLocal([FLOW_KEY]);
  var flow=stored[FLOW_KEY];
  if(!flow)return{status:"idle"};
  if(Date.now()>=Number(flow.expiresAt||0)){
    await chrome.storage.local.remove([FLOW_KEY]);
    return{status:"expired"};
  }
  var now=Date.now();
  if(now<Number(flow.nextPollAt||0))return{status:"waiting",retryInMs:Number(flow.nextPollAt)-now,userCode:flow.userCode,verificationUri:flow.verificationUri};
  var config=await getConfig();
  if(!safeClientId(config.clientId))return{status:"error",error:"Client ID no configurado."};
  var body=new URLSearchParams();
  body.set("client_id",config.clientId);
  body.set("device_code",flow.deviceCode);
  body.set("grant_type","urn:ietf:params:oauth:grant-type:device_code");
  body.set("repository_id",REPOSITORY_ID);
  var response;
  try{
    response=await request(LOGIN_BASE+"/login/oauth/access_token",{method:"POST",headers:formHeaders(),body:body.toString()});
  }catch(error){
    var apiError=error&&error.data||{};
    var code=apiError.error||"";
    var interval=Math.max(5,Number(apiError.interval)||Number(flow.interval)||5);
    if(code==="authorization_pending"){
      flow.nextPollAt=Date.now()+interval*1000;
      var pendingPayload={};pendingPayload[FLOW_KEY]=flow;await writeLocal(pendingPayload);
      return{status:"authorization_pending",retryInMs:interval*1000,userCode:flow.userCode,verificationUri:flow.verificationUri};
    }
    if(code==="slow_down"){
      flow.interval=interval+5;
      flow.nextPollAt=Date.now()+flow.interval*1000;
      var slowPayload={};slowPayload[FLOW_KEY]=flow;await writeLocal(slowPayload);
      return{status:"authorization_pending",retryInMs:flow.interval*1000,userCode:flow.userCode,verificationUri:flow.verificationUri};
    }
    if(code==="expired_token"){
      await chrome.storage.local.remove([FLOW_KEY]);
      return{status:"expired"};
    }
    if(code==="access_denied"){
      await chrome.storage.local.remove([FLOW_KEY]);
      return{status:"denied"};
    }
    return{status:"error",error:code||String(error)};
  }
  if(!response||!response.access_token)throw new Error("GitHub no devolvió access token");
  var auth={
    accessToken:response.access_token,
    refreshToken:response.refresh_token||null,
    accessTokenExpiresAt:response.expires_in?Date.now()+Number(response.expires_in)*1000:null,
    refreshTokenExpiresAt:response.refresh_token_expires_in?Date.now()+Number(response.refresh_token_expires_in)*1000:null,
    connectedAt:iso(),
    repository:REPOSITORY
  };
  await setAuth(auth);
  await chrome.storage.local.remove([FLOW_KEY]);
  try{
    await githubApi("/repos/"+REPOSITORY, {method:"GET"});
  }catch(error){
    await clearAuth();
    return{status:"error",error:"La autorización se completó, pero la GitHub App no tiene acceso al repositorio Signal Interpreter."};
  }
  return{status:"connected",repository:REPOSITORY,connectedAt:auth.connectedAt};
}
async function getStatus(){
  var config=await getConfig();
  var auth=await getAuth();
  var connected=false,repository=REPOSITORY,error=null;
  if(auth&&auth.accessToken){
    try{
      var repo=await githubApi("/repos/"+REPOSITORY,{method:"GET"});
      connected=!!(repo&&repo.full_name===REPOSITORY);
    }catch(e){error=String(e&&e.message||e);}
  }
  var stored=await readLocal([FLOW_KEY]);
  var flow=stored[FLOW_KEY]||null;
  return{
    configured:safeClientId(config.clientId),
    connected:connected,
    repository:repository,
    tokenExpiresAt:auth&&auth.accessTokenExpiresAt||null,
    refreshTokenExpiresAt:auth&&auth.refreshTokenExpiresAt||null,
    deviceFlow:flow?{userCode:flow.userCode,verificationUri:flow.verificationUri,expiresAt:flow.expiresAt}:null,
    error:error
  };
}
async function disconnect(){
  await clearAuth();
  return{ok:true};
}
async function readRemoteSha(path){
  try{
    var data=await githubApi("/repos/"+REPOSITORY+"/contents/"+encodeURIComponent(path).replace(/%2F/g,"/")+"?ref="+encodeURIComponent(PUBLISH_BRANCH),{method:"GET"});
    return data&&data.sha||null;
  }catch(error){
    if(error.status===404)return null;
    throw error;
  }
}
async function uploadFile(path,content,message){
  var payload={
    message:message,
    content:base64Utf8(content),
    branch:PUBLISH_BRANCH
  };
  var existing=await readRemoteSha(path);
  if(existing)payload.sha=existing;
  for(var attempt=1;attempt<=4;attempt+=1){
    try{
      return await githubApi("/repos/"+REPOSITORY+"/contents/"+path.split("/").map(encodeURIComponent).join("/"),{method:"PUT",body:JSON.stringify(payload)});
    }catch(error){
      if(error.status!==409||attempt>=4)throw error;
      await sleep(500*attempt);
      var refreshed=await readRemoteSha(path);
      if(refreshed)payload.sha=refreshed;
    }
  }
  throw new Error("Publicación GitHub no completada");
}
async function uploadBatch(batch){
  if(!batch||batch.schema!=="signal-interpreter-observation-batch/v1")throw new Error("Schema de batch no soportado");
  var batchId=String(batch.batchId||"");
  if(!/^[A-Za-z0-9._-]{1,120}$/.test(batchId))throw new Error("batchId inválido");
  var serialized=JSON.stringify(batch,null,2)+"\n";
  var path=INBOX_DIR+"/"+batchId+".json";
  var result=await uploadFile(path,serialized,"diagnostic: enqueue observation batch "+batchId);
  return{accepted:true,batchId:batchId,remotePath:path,contentSha:result&&result.content&&result.content.sha||null,commitSha:result&&result.commit&&result.commit.sha||null};
}

global.SignalGithubObservability={
  beginDeviceFlow:beginDeviceFlow,
  pollDeviceFlow:pollDeviceFlow,
  getStatus:getStatus,
  setConfig:setConfig,
  getConfig:getConfig,
  disconnect:disconnect,
  uploadBatch:uploadBatch,
  repository:REPOSITORY
};
})(typeof self!=="undefined"?self:window);
