(function(){
"use strict";
var tabStream=null,micStream=null,tabRecorder=null,micRecorder=null,tabTimer=null,micTimer=null,audioContext=null,running=false,chunkSeq=0,captureSessionId=null;
function send(message){try{var p=chrome.runtime.sendMessage(Object.assign({target:"offscreen"},message));if(p&&p.catch)p.catch(function(){});}catch(_){} }
function playTone(volume){var c=new AudioContext(),o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.frequency.setValueAtTime(880,t);o.frequency.setValueAtTime(1174.66,t+.12);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,volume*.38),t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.35);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.37);o.onended=function(){c.close()};}
function stopStream(s){try{if(s)s.getTracks().forEach(function(t){t.stop()})}catch(_){} }
function arm(source,stream){
  if(!stream)return null;
  var startedAt=Date.now(),seq=++chunkSeq,chunks=[],r,currentSessionId=captureSessionId;
  try{r=new MediaRecorder(stream,{mimeType:"audio/webm;codecs=opus"});}catch(_){try{r=new MediaRecorder(stream)}catch(error){send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:source,error:String(error)});return null}}
  r.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
  r.onerror=function(e){send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:source,error:String(e&&e.error||e)})};
  r.onstop=function(){var blob=chunks.length?new Blob(chunks,{type:"audio/webm"}):null;chunks=[];if(blob&&blob.size){var reader=new FileReader();reader.onloadend=function(){try{var dataUrl=String(reader.result||""),base64=dataUrl.split(",")[1]||"";send({type:"SIGNAL_GROQ_AUDIO_CHUNK",sessionId:currentSessionId,source:source,base64:base64,bytes:blob.size,startedAt:startedAt,endedAt:Date.now(),sequence:seq})}catch(error){send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:source,error:String(error)})}};reader.readAsDataURL(blob)}if(running)setTimeout(function(){var next=arm(source,stream);if(source==="cliente")tabRecorder=next;else micRecorder=next;},40)};
  r.start();setTimeout(function(){try{if(r&&r.state!=="inactive")r.stop()}catch(_){}},18000);return r;
}
function startTimer(source,rec){var timer=setTimeout(function(){try{if(rec&&rec.state!=="inactive")rec.stop()}catch(_){}},18000);if(source==="cliente")tabTimer=timer;else micTimer=timer;}
async function startCapture(streamId,sessionId){
  await stopCapture();
  captureSessionId=String(sessionId||"");
  if(!streamId||!captureSessionId)return{ok:false,error:"Falta la sesión o el identificador de audio de la pestaña."};
  try{
    tabStream=await navigator.mediaDevices.getUserMedia({audio:{mandatory:{chromeMediaSource:"tab",chromeMediaSourceId:streamId}}});
    audioContext=new AudioContext();var input=audioContext.createMediaStreamSource(tabStream);input.connect(audioContext.destination);await audioContext.resume();
    micStream=await navigator.mediaDevices.getUserMedia({audio:true});running=true;chunkSeq=0;
    tabRecorder=arm("cliente",tabStream);micRecorder=arm("yo",micStream);if(!tabRecorder||!micRecorder)throw new Error("No se pudieron iniciar los dos grabadores.");
    startTimer("cliente",tabRecorder);startTimer("yo",micRecorder);
    send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"connected",tabAudio:true,microphone:true,timestamp:new Date().toISOString()});return{ok:true};
  }catch(error){await stopCapture();return{ok:false,error:String(error)}}
}
async function stopCapture(){running=false;try{if(tabTimer)clearTimeout(tabTimer);if(micTimer)clearTimeout(micTimer)}catch(_){}tabTimer=null;micTimer=null;try{if(tabRecorder&&tabRecorder.state!=="inactive")tabRecorder.stop()}catch(_){}try{if(micRecorder&&micRecorder.state!=="inactive")micRecorder.stop()}catch(_){}tabRecorder=null;micRecorder=null;stopStream(tabStream);stopStream(micStream);tabStream=null;micStream=null;captureSessionId=null;if(audioContext){try{await audioContext.close()}catch(_){}audioContext=null}send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"stopped",timestamp:new Date().toISOString()});return{ok:true}}
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
  if(!message||message.target!=="offscreen")return false;
  if(message.type==="EFFECTIF_PLAY_SOUND"){
    try{playTone(Math.max(0,Math.min(1,Number(message.volume)||0)));sendResponse({ok:true})}
    catch(error){sendResponse({ok:false,error:String(error)})}
    return false;
  }
  if(message.type==="SIGNAL_START_GROQ_CAPTURE"){
    startCapture(message.streamId,message.sessionId).then(sendResponse).catch(function(error){sendResponse({ok:false,error:String(error)})});
    return true;
  }
  if(message.type==="SIGNAL_STOP_GROQ_CAPTURE"){
    stopCapture().then(sendResponse).catch(function(error){sendResponse({ok:false,error:String(error)})});
    return true;
  }
  return false;
});
})();
