(function(){
"use strict";
var tabStream=null,micStream=null,tabRecorder=null,micRecorder=null,previewTabRecorder=null,previewMicRecorder=null,tabTimer=null,micTimer=null,audioContext=null,running=false,chunkSeq=0,previewSeq=0,captureSessionId=null,previewSessionId=null,previewTabId=null,captionPreviewTabEnabled=false,captionPreviewMicEnabled=false,micMuteWatchdog=null,micMuteDesired=false,youtubePreviewStream=null,youtubePreviewRecorder=null,youtubePreviewAudioContext=null,youtubePreviewSessionId=null,youtubePreviewTabId=null,youtubePreviewStartedAt=0,youtubePreviewSequence=0;
function send(message){try{var p=chrome.runtime.sendMessage(Object.assign({target:"offscreen"},message));if(p&&p.catch)p.catch(function(){});}catch(_){} }
async function playTone(volume, cue){
  if(!audioContext || audioContext.state==="closed") audioContext=new AudioContext();
  if(audioContext.state==="suspended") await audioContext.resume();
  var c=audioContext;
  var start=c.currentTime;
  var peak=Math.max(.0001,volume*.36);
  function tone(frequency, at, duration){
    return new Promise(function(resolve,reject){
      var o=c.createOscillator(),g=c.createGain();
      o.type="sine";
      o.frequency.setValueAtTime(frequency,at);
      g.gain.setValueAtTime(.0001,at);
      g.gain.exponentialRampToValueAtTime(peak,at+.012);
      g.gain.exponentialRampToValueAtTime(.0001,at+duration-.02);
      o.connect(g);g.connect(c.destination);
      o.onended=resolve;
      try{o.start(at);o.stop(at+duration)}catch(error){reject(error)}
    });
  }
  if(cue==="mute-on"){
    await tone(523.25,start,.11);
    await tone(392,start+.12,.13);
  }else if(cue==="mute-off"){
    await tone(1046.5,start,.11);
    await tone(880,start+.12,.13);
  }else{
    await tone(880,start,.11);
    await tone(1174.66,start+.12,.13);
  }
  return true;
}
function stopStream(s){try{if(s)s.getTracks().forEach(function(t){t.stop()})}catch(_){} }

async function stopYoutubeCaptionPreview(sessionId,tabId){
  if(sessionId&&youtubePreviewSessionId&&String(sessionId)!==String(youtubePreviewSessionId))return{ok:false,error:"youtube-session-mismatch"};
  if(tabId!=null&&youtubePreviewTabId!=null&&Number(tabId)!==Number(youtubePreviewTabId))return{ok:false,error:"youtube-tab-mismatch"};
  var recorder=youtubePreviewRecorder,stream=youtubePreviewStream,context=youtubePreviewAudioContext;
  youtubePreviewRecorder=null;youtubePreviewStream=null;youtubePreviewAudioContext=null;
  youtubePreviewSessionId=null;youtubePreviewTabId=null;youtubePreviewStartedAt=0;youtubePreviewSequence=0;
  try{if(recorder&&recorder.state!=="inactive")recorder.stop()}catch(_){}
  stopStream(stream);
  if(context){try{await context.close()}catch(_){}}
  send({type:"SIGNAL_YOUTUBE_CAPTION_PREVIEW_OFFSCREEN_STOPPED",tabId:tabId==null?null:Number(tabId),sessionId:sessionId||null});
  return{ok:true,active:false};
}
async function startYoutubeCaptionPreview(streamId,sessionId,tabId){
  if(running)return{ok:false,error:"active-groq-capture"};
  if(youtubePreviewRecorder)return{ok:false,error:"youtube-preview-already-running"};
  if(!streamId||!sessionId||!Number.isFinite(Number(tabId)))return{ok:false,error:"missing-youtube-capture-parameters"};
  var localSession=String(sessionId),localTabId=Number(tabId),stream=null,context=null,recorder=null;
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:{mandatory:{chromeMediaSource:"tab",chromeMediaSourceId:String(streamId)}}});
    var tracks=stream&&stream.getAudioTracks?stream.getAudioTracks():[];
    if(!tracks.length)throw new Error("La captura del video no produjo una pista de audio.");
    context=new AudioContext();
    var source=context.createMediaStreamSource(stream);source.connect(context.destination);
    await context.resume();
    try{recorder=new MediaRecorder(stream,{mimeType:"audio/webm;codecs=opus"});}
    catch(_){recorder=new MediaRecorder(stream);}
    youtubePreviewStream=stream;youtubePreviewAudioContext=context;youtubePreviewRecorder=recorder;
    youtubePreviewSessionId=localSession;youtubePreviewTabId=localTabId;youtubePreviewStartedAt=Date.now();youtubePreviewSequence=0;
    recorder.ondataavailable=function(e){
      if(!e.data||!e.data.size||youtubePreviewSessionId!==localSession||youtubePreviewTabId!==localTabId)return;
      var startedAt=youtubePreviewStartedAt;youtubePreviewStartedAt=Date.now();
      var sequence=++youtubePreviewSequence;
      try{
        var reader=new FileReader();
        reader.onloadend=function(){
          if(youtubePreviewSessionId!==localSession||youtubePreviewTabId!==localTabId)return;
          try{
            var dataUrl=String(reader.result||""),base64=dataUrl.split(",")[1]||"";
            if(base64)send({
              type:"SIGNAL_GROQ_CAPTION_PREVIEW_CHUNK",youtubePreview:true,
              sessionId:localSession,tabId:localTabId,source:"cliente",base64:base64,
              bytes:e.data.size,startedAt:startedAt,endedAt:Date.now(),sequence:sequence
            });
          }catch(error){send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:"youtube-caption-preview",error:String(error)});}
        };
        reader.readAsDataURL(e.data);
      }catch(error){send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:"youtube-caption-preview",error:String(error)});}
    };
    recorder.onerror=function(e){
      send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:"youtube-caption-preview",error:String(e&&e.error||e)});
      stopYoutubeCaptionPreview(localSession,localTabId).catch(function(){});
    };
    recorder.start(1800);
    send({type:"SIGNAL_YOUTUBE_CAPTION_PREVIEW_OFFSCREEN_STARTED",tabId:localTabId,sessionId:localSession});
    return{ok:true,active:true,tabId:localTabId,sessionId:localSession,intervalMs:1800};
  }catch(error){
    try{if(recorder&&recorder.state!=="inactive")recorder.stop()}catch(_){}
    stopStream(stream);
    if(context){try{await context.close()}catch(_){}}
    if(youtubePreviewSessionId===localSession){
      youtubePreviewRecorder=null;youtubePreviewStream=null;youtubePreviewAudioContext=null;
      youtubePreviewSessionId=null;youtubePreviewTabId=null;youtubePreviewStartedAt=0;youtubePreviewSequence=0;
    }
    return{ok:false,error:String(error&&error.message||error).slice(0,240)};
  }
}

function arm(source,stream){
  if(!stream)return null;
  var startedAt=Date.now(),seq=++chunkSeq,chunks=[],r,currentSessionId=captureSessionId;
  try{r=new MediaRecorder(stream,{mimeType:"audio/webm;codecs=opus"});}catch(_){try{r=new MediaRecorder(stream)}catch(error){send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:source,error:String(error)});return null}}
  r.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
  r.onerror=function(e){send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:source,error:String(e&&e.error||e)})};
  r.onstop=function(){var blob=chunks.length?new Blob(chunks,{type:"audio/webm"}):null;chunks=[];if(blob&&blob.size){var reader=new FileReader();reader.onloadend=function(){try{var dataUrl=String(reader.result||""),base64=dataUrl.split(",")[1]||"";send({type:"SIGNAL_GROQ_AUDIO_CHUNK",sessionId:currentSessionId,source:source,base64:base64,bytes:blob.size,startedAt:startedAt,endedAt:Date.now(),sequence:seq})}catch(error){send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:source,error:String(error)})}};reader.readAsDataURL(blob)}if(running)setTimeout(function(){var next=arm(source,stream);if(source==="cliente")tabRecorder=next;else micRecorder=next;},40)};
  r.start();setTimeout(function(){try{if(r&&r.state!=="inactive")r.stop()}catch(_){}},18000);return r;
}
function stopCaptionPreviewRecorder(source){
  var recorder=null;
  if(source==="cliente"){recorder=previewTabRecorder;previewTabRecorder=null;}
  else{recorder=previewMicRecorder;previewMicRecorder=null;}
  if(recorder){try{if(recorder.state!=="inactive")recorder.stop();}catch(_){}}
}
function stopCaptionPreview(){
  captionPreviewTabEnabled=false;captionPreviewMicEnabled=false;
  stopCaptionPreviewRecorder("cliente");stopCaptionPreviewRecorder("yo");
  previewSeq=0;previewSessionId=null;previewTabId=null;
}
function startCaptionPreviewRecorder(source,stream,sessionId,tabId){
  if(!stream||!sessionId)return null;
  var recorder=null,session=String(sessionId),targetTabId=Number(tabId||0),startedAt=Date.now();
  try{
    recorder=new MediaRecorder(stream,{mimeType:"audio/webm;codecs=opus"});
  }catch(_){
    try{recorder=new MediaRecorder(stream);}
    catch(error){
      send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:"caption-preview-"+source,error:String(error)});
      return null;
    }
  }
  recorder.ondataavailable=function(e){
    if(!running||e.data==null||!e.data.size)return;
    if(source==="cliente"&&!captionPreviewTabEnabled)return;
    if(source==="yo"&&!captionPreviewMicEnabled)return;
    var chunkStartedAt=startedAt;
    startedAt=Date.now();
    var sequence=++previewSeq;
    try{
      var reader=new FileReader();
      reader.onloadend=function(){
        try{
          var dataUrl=String(reader.result||""),base64=dataUrl.split(",")[1]||"";
          if(base64)send({
            type:"SIGNAL_GROQ_CAPTION_PREVIEW_CHUNK",sessionId:session,tabId:targetTabId,
            source:source,base64:base64,bytes:e.data.size,startedAt:chunkStartedAt,
            endedAt:Date.now(),sequence:sequence
          });
        }catch(error){
          send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:"caption-preview-"+source,error:String(error)});
        }
      };
      reader.readAsDataURL(e.data);
    }catch(error){
      send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:"caption-preview-"+source,error:String(error)});
    }
  };
  recorder.onerror=function(e){
    send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:"caption-preview-"+source,error:String(e&&e.error||e)});
  };
  try{recorder.start(1800);}
  catch(error){
    send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"error",source:"caption-preview-"+source,error:String(error)});
    return null;
  }
  return recorder;
}
function startCaptionPreview(mode){
  mode=mode||{};
  if(!running||!captureSessionId){stopCaptionPreview();return false;}
  var targetTab=Number(previewTabId||0);
  if(previewSessionId!==captureSessionId){
    stopCaptionPreview();
    previewSessionId=captureSessionId;previewTabId=targetTab;
  }
  var nextTab=!!mode.tab,nextMic=mode.mic!==false;
  captionPreviewTabEnabled=nextTab;captionPreviewMicEnabled=nextMic;
  if(nextTab){
    if(!previewTabRecorder||previewTabRecorder.state==="inactive"){
      previewTabRecorder=startCaptionPreviewRecorder("cliente",tabStream,captureSessionId,previewTabId);
    }
  }else if(previewTabRecorder){stopCaptionPreviewRecorder("cliente");}
  if(nextMic){
    if(!previewMicRecorder||previewMicRecorder.state==="inactive"){
      previewMicRecorder=startCaptionPreviewRecorder("yo",micStream,captureSessionId,previewTabId);
    }
  }else if(previewMicRecorder){stopCaptionPreviewRecorder("yo");}
  return !!((nextTab&&previewTabRecorder)||(nextMic&&previewMicRecorder));
}
function startTimer(source,rec){var timer=setTimeout(function(){try{if(rec&&rec.state!=="inactive")rec.stop()}catch(_){}},18000);if(source==="cliente")tabTimer=timer;else micTimer=timer;}
async function applyMicMute(muted){
  var desired=!!muted;
  var tracks=micStream&&typeof micStream.getAudioTracks==="function"?micStream.getAudioTracks():[];
  if(!tracks.length)return{ok:!running,muted:desired,verified:!running,trackCount:0,inactive:!running,error:running?"La pista del micrófono no está disponible.":null};
  micMuteDesired=desired;
  tracks.forEach(function(track){track.enabled=!desired;});
  var verified=tracks.every(function(track){return track.enabled===!desired;});
  return{ok:verified,muted:desired,verified:verified,trackCount:tracks.length,enabled:tracks.every(function(track){return track.enabled;})};
}
async function startCapture(streamId,sessionId,muted,captionPreview,tabId){
  if(youtubePreviewRecorder)await stopYoutubeCaptionPreview(youtubePreviewSessionId,youtubePreviewTabId);
  await stopCapture();
  captureSessionId=String(sessionId||""); previewTabId=Number(tabId||0);
  if(!streamId||!captureSessionId)return{ok:false,error:"Falta la sesión o el identificador de audio de la pestaña."};
  try{
    tabStream=await navigator.mediaDevices.getUserMedia({audio:{mandatory:{chromeMediaSource:"tab",chromeMediaSourceId:streamId}}});
    audioContext=new AudioContext();var input=audioContext.createMediaStreamSource(tabStream);input.connect(audioContext.destination);await audioContext.resume();
    micStream=await navigator.mediaDevices.getUserMedia({audio:true});running=true;chunkSeq=0;
    var initialMute=!!muted;
    var micApplied=await applyMicMute(initialMute);
    if(!micApplied.ok)throw new Error("No se pudo verificar el estado inicial del micrófono de la extensión.");
    tabRecorder=arm("cliente",tabStream);micRecorder=arm("yo",micStream);if(!tabRecorder||!micRecorder)throw new Error("No se pudieron iniciar los dos grabadores.");
    if(captionPreview===true){startCaptionPreview({tab:true,mic:false});}
    startTimer("cliente",tabRecorder);startTimer("yo",micRecorder);
    if(micMuteWatchdog)clearInterval(micMuteWatchdog);
    micMuteWatchdog=setInterval(function(){
      if(!running||!micStream)return;
      var watchdogTracks=micStream.getAudioTracks?micStream.getAudioTracks():[];
      watchdogTracks.forEach(function(track){try{track.enabled=!micMuteDesired}catch(_){}});
    },50);
    send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"connected",tabAudio:true,microphone:true,microphoneMuted:initialMute,timestamp:new Date().toISOString()});return{ok:true};
  }catch(error){await stopCapture();return{ok:false,error:String(error)}}
}
async function stopCapture(){running=false;stopCaptionPreview();try{if(tabTimer)clearTimeout(tabTimer);if(micTimer)clearTimeout(micTimer);if(micMuteWatchdog)clearInterval(micMuteWatchdog)}catch(_){}tabTimer=null;micTimer=null;micMuteWatchdog=null;try{if(tabRecorder&&tabRecorder.state!=="inactive")tabRecorder.stop()}catch(_){}try{if(micRecorder&&micRecorder.state!=="inactive")micRecorder.stop()}catch(_){}tabRecorder=null;micRecorder=null;stopStream(tabStream);stopStream(micStream);tabStream=null;micStream=null;captureSessionId=null;if(audioContext){try{await audioContext.close()}catch(_){}audioContext=null}send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:"stopped",timestamp:new Date().toISOString()});return{ok:true}}
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
  if(!message||message.target!=="offscreen")return false;
  if(message.type==="SIGNAL_START_YOUTUBE_CAPTION_PREVIEW"){
    startYoutubeCaptionPreview(message.streamId,message.sessionId,Number(message.tabId)).then(sendResponse).catch(function(error){sendResponse({ok:false,error:String(error)});});
    return true;
  }
  if(message.type==="SIGNAL_STOP_YOUTUBE_CAPTION_PREVIEW"){
    stopYoutubeCaptionPreview(message.sessionId,message.tabId).then(sendResponse).catch(function(error){sendResponse({ok:false,error:String(error)});});
    return true;
  }
  if(message.type==="SIGNAL_GET_GROQ_CAPTURE_STATE"){
    sendResponse({ok:true,running:!!running,sessionId:captureSessionId,tabAudio:!!tabStream,microphone:!!micStream,microphoneMuted:!!micMuteDesired});
    return false;
  }
  if(message.type==="EFFECTIF_PLAY_SOUND"){
    playTone(Math.max(0,Math.min(1,Number(message.volume)||0)),String(message.cue||"")).then(function(){sendResponse({ok:true})}).catch(function(error){sendResponse({ok:false,error:String(error)})});

    return true;
  }
  if(message.type==="SIGNAL_SET_MICROPHONE_MUTED"){
    applyMicMute(!!message.muted).then(function(result){
      if(result.verified){
        send({type:"SIGNAL_GROQ_CAPTURE_STATUS",status:running?"connected":"idle",tabAudio:!!tabStream,microphone:!!micStream,microphoneMuted:!!message.muted,timestamp:new Date().toISOString()});
      }
      sendResponse(result);
    }).catch(function(error){sendResponse({ok:false,muted:!!message.muted,verified:false,error:String(error)})});
    return true;
  }
  if(message.type==="SIGNAL_SET_CAPTION_PREVIEW"){
    if(message.enabled===true){
      if(!running||!captureSessionId){
        sendResponse({ok:false,enabled:true,started:false,tabEnabled:false,micEnabled:false,error:"audio-capture-not-running"});
        return true;
      }
      var previewTabRequested=message.tabEnabled===true,previewMicRequested=message.micEnabled!==false;
      var previewResult=startCaptionPreview({tab:previewTabRequested,mic:previewMicRequested});
      var noPreviewSourceRequested=!previewTabRequested&&!previewMicRequested;
      sendResponse({ok:!!previewResult||noPreviewSourceRequested,enabled:true,started:!!previewResult,tabEnabled:captionPreviewTabEnabled,micEnabled:captionPreviewMicEnabled,error:previewResult||noPreviewSourceRequested?null:"preview-recorder-unavailable"});
    }else{
      stopCaptionPreview();
      sendResponse({ok:true,enabled:false,started:false,tabEnabled:false,micEnabled:false});
    }
    return true;
  }
  if(message.type==="SIGNAL_START_GROQ_CAPTURE"){
    startCapture(message.streamId,message.sessionId,!!message.muted,!!message.captionPreview,Number(message.tabId||0)).then(sendResponse).catch(function(error){sendResponse({ok:false,error:String(error)})});
    return true;
  }
  if(message.type==="SIGNAL_STOP_GROQ_CAPTURE"){
    stopCapture().then(sendResponse).catch(function(error){sendResponse({ok:false,error:String(error)})});
    return true;
  }
  return false;
});
})();
