(function(){
  "use strict";
  var host=null,root=null,button=null,statusNode=null;
  var capture=null,policy=null,refreshTimer=null,routeTimer=null,disposed=false;
  var LABELS={
    "call-not-active":"La llamada no está activa o no fue reconocida",
    "interpreter-channel-disabled":"Activa el canal Whisper en la configuración",
    "zdr-not-confirmed":"Confirma ZDR después de verificarlo en la consola de Groq",
    "groq-key-missing":"No hay una clave Groq local disponible",
    "permission-denied":"No se concedió el permiso de micrófono o pestaña",
    "tab-audio-missing":"La pestaña compartida no entregó audio",
    "tab-selection-invalid":"Selecciona la pestaña del navegador con la llamada",
    "capture-failed":"No se pudo iniciar la captura",
    "transcription-backlog":"Groq no está procesando al ritmo de captura; se detuvo para no perder audio",
    "groq-rate-limited":"Groq limitó temporalmente las peticiones; captura detenida para evitar pérdida",
    "groq-authentication-failed":"La credencial local de Groq no fue aceptada",
    "groq-transcription-failed":"Falló la transcripción en Groq; diálogo incompleto",
    "audio-sample-rate-unsupported":"El navegador no pudo abrir audio a 16 kHz",
    "audio-wav-format-invalid":"El segmento WAV no pasó la validación de integridad",
    "overlay-unavailable":"No se pudo entregar el texto al diálogo visible",
    "source-track-ended":"Una de las fuentes de audio terminó; captura detenida",
    "policy-check-failed":"No se pudo verificar que la llamada siga activa"
  };
  function callId(){var m=location.pathname.match(/^\/call\/([^/?#]+)\/?$/);return m?m[1]:null;}
  function send(message){return chrome.runtime.sendMessage(message).catch(function(){return{ok:false,reasonCode:"background-unavailable"};});}
  function setStatus(value,error){
    if(statusNode){statusNode.textContent=String(value||"");statusNode.style.color=error?"#ffb4a8":"#cbd5e1";}
    if(button)button.textContent=capture?"Detener diálogo Groq":"Iniciar diálogo Groq";
  }
  function showReason(reason){return LABELS[reason]||String(reason||"No disponible").replace(/-/g," ");}
  function mount(){
    if(host&&host.isConnected)return;
    host=document.createElement("div");host.id="signal-groq-dialogue-control";
    host.style.cssText="all:initial;position:fixed;right:14px;top:92px;z-index:2147483646";
    root=host.attachShadow({mode:"closed"});
    var style=document.createElement("style");
    style.textContent="section{font:12px/1.4 system-ui,sans-serif;color:#f8fafc;background:#111827;border:1px solid #475569;border-radius:12px;padding:9px 10px;box-shadow:0 8px 28px #0008;width:220px}button{width:100%;border:0;border-radius:8px;background:#2563eb;color:white;font:600 12px system-ui;padding:9px;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}p{margin:7px 2px 0;color:#cbd5e1;min-height:18px}small{display:block;color:#94a3b8;margin:5px 2px 0}";
    var section=document.createElement("section");
    var title=document.createElement("small");title.textContent="TRANSCRIPCIÓN · GROQ WHISPER LARGE V3";
    button=document.createElement("button");button.type="button";button.textContent="Iniciar diálogo Groq";
    statusNode=document.createElement("p");statusNode.setAttribute("aria-live","polite");statusNode.textContent="Comprobando disponibilidad…";
    var note=document.createElement("small");note.textContent="Selecciona esta pestaña y comparte su audio. Micrófono propio y audio remoto se procesan por separado.";
    section.append(title,button,statusNode,note);root.append(style,section);
    (document.documentElement||document.body).appendChild(host);
    button.addEventListener("click",function(){if(capture)return stop("operator-stop");return start();});
    refreshPolicy();
  }
  async function refreshPolicy(){
    if(!callId()||disposed)return;
    var checked=await send({type:"SIGNAL_GROQ_DIALOGUE_POLICY_GET",callId:callId()});
    if(capture){
      if(!checked||checked.canCapture!==true){
        setStatus(showReason(checked&&checked.reasonCode||"policy-check-failed"),true);
        await stop(checked&&checked.reasonCode||"policy-check-failed");
        return;
      }
      policy=checked;
      return;
    }
    policy=checked;
    if(!button)return;
    button.disabled=!(policy&&policy.canCapture===true);
    setStatus(policy&&policy.canCapture?"Lista · dos fuentes independientes":showReason(policy&&policy.reasonCode),!(policy&&policy.canCapture));
  }
  function base64(buffer){
    var bytes=new Uint8Array(buffer),parts=[],chunk=0x8000;
    for(var i=0;i<bytes.length;i+=chunk)parts.push(String.fromCharCode.apply(null,bytes.subarray(i,Math.min(bytes.length,i+chunk))));
    return btoa(parts.join(""));
  }
  function buildLane(source,stream,context,originFrame,captureId,call,startedAt){
    var audio=context.createMediaStreamSource(stream);
    var node=new AudioWorkletNode(context,"signal-whisper-window",{
      numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],
      processorOptions:{windowSeconds:6}
    });
    node.port.onmessage=function(event){
      var message=event&&event.data||{},packet=message.packet;
      if(message.type!=="window"||!packet||!packet.buffer)return;
      var offsetMs=Math.max(0,(Number(packet.startFrame)-originFrame)/context.sampleRate*1000);
      var durationMs=Math.max(0,(Number(packet.endFrame)-Number(packet.startFrame))/context.sampleRate*1000);
      deliver(source,packet.buffer,offsetMs,durationMs,context.sampleRate,captureId,call,startedAt);
    };
    audio.connect(node);node.connect(context.destination);
    return {source:audio,node:node};
  }
  async function deliver(source,buffer,offsetMs,durationMs,sampleRate,captureId,call,startedAt){
    if(!capture||capture.captureId!==captureId)return;
    if(capture.pending[source]>=2){
      setStatus("Cola de "+source+" saturada; deteniendo para conservar integridad",true);
      await stop("transcription-backlog");return;
    }
    var sequence=++capture.sequence[source];capture.pending[source]++;
    var message={
      type:"SIGNAL_GROQ_DIALOGUE_CHUNK",captureId:captureId,callId:call,source:source,
      sequence:sequence,chunkStartOffsetMs:offsetMs,durationMs:durationMs,sampleRate:sampleRate,
      startedAt:startedAt,mimeType:"audio/wav",base64:base64(buffer)
    };
    var result=await send(message);
    if(!capture||capture.captureId!==captureId)return;
    capture.pending[source]=Math.max(0,capture.pending[source]-1);
    if(!result||result.ok!==true){
      var failureReason=result&&result.reasonCode||"groq-transcription-failed";
      setStatus(showReason(failureReason),true);
      if(capture&&!capture.stopping)await stop(failureReason);
      return;
    }
    capture.delivered[source]+=Number(result.segments||0);
    setStatus("Activo · intérprete "+capture.delivered["groq-interpreter"]+" · remoto "+capture.delivered["groq-remote"]);
  }
  async function start(){
    if(capture||!callId())return;
    if(!policy||policy.canCapture!==true){await refreshPolicy();if(!policy||policy.canCapture!==true)return;}
    var call=callId(),tabStream=null,micStream=null,context=null,captureId="groq-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
    button.disabled=true;setStatus("Selecciona la pestaña de Cloud Interpreter y comparte audio…");
    try{
      // Must be invoked synchronously from this button's user gesture.
      tabStream=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:"browser"},audio:true,preferCurrentTab:true,selfBrowserSurface:"include",surfaceSwitching:"exclude"});
      var displaySurface=tabStream.getVideoTracks()[0]&&tabStream.getVideoTracks()[0].getSettings().displaySurface;
      if(displaySurface&&displaySurface!=="browser")throw Object.assign(Error("tab-selection-invalid"),{reasonCode:"tab-selection-invalid"});
      var tabAudio=tabStream.getAudioTracks();
      if(!tabAudio.length)throw Object.assign(Error("tab-audio-missing"),{reasonCode:"tab-audio-missing"});
      var latestPolicy=await send({type:"SIGNAL_GROQ_DIALOGUE_POLICY_GET",callId:call});
      if(!latestPolicy||latestPolicy.canCapture!==true)
        throw Object.assign(Error(showReason(latestPolicy&&latestPolicy.reasonCode)),{reasonCode:latestPolicy&&latestPolicy.reasonCode||"policy-unavailable"});
      setStatus("Solicitando micrófono propio…");
      micStream=await navigator.mediaDevices.getUserMedia({
        audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false
      });
      if(!micStream.getAudioTracks().some(function(t){return t.readyState==="live";}))
        throw Object.assign(Error("permission-denied"),{reasonCode:"permission-denied"});
      tabStream.getVideoTracks().forEach(function(track){try{track.stop();}catch(_){}});
      context=new AudioContext({sampleRate:16000,latencyHint:"interactive"});
      if(context.sampleRate!==16000)throw Object.assign(Error("audio-sample-rate-unsupported"),{reasonCode:"audio-sample-rate-unsupported"});
      await context.audioWorklet.addModule(chrome.runtime.getURL("whisper-window-processor.js"));
      await context.resume();
      var startedAt=Date.now(),originFrame=Math.round(context.currentTime*context.sampleRate);
      var ready=await send({type:"SIGNAL_GROQ_DIALOGUE_CAPTURE_START",captureId:captureId,callId:call,startedAt:startedAt});
      if(!ready||ready.ok!==true)throw Object.assign(Error(showReason(ready&&ready.reasonCode)),{reasonCode:ready&&ready.reasonCode||"capture-failed"});
      capture={
        captureId:captureId,callId:call,startedAt:startedAt,context:context,stopping:false,stopPromise:null,
        streams:[tabStream,micStream],lanes:[],
        sequence:{"groq-remote":0,"groq-interpreter":0},
        pending:{"groq-remote":0,"groq-interpreter":0},
        delivered:{"groq-remote":0,"groq-interpreter":0}
      };
      var remoteStream=new MediaStream(tabAudio);
      capture.lanes.push(buildLane("groq-remote",remoteStream,context,originFrame,captureId,call,startedAt));
      capture.lanes.push(buildLane("groq-interpreter",new MediaStream(micStream.getAudioTracks()),context,originFrame,captureId,call,startedAt));
      [tabStream,micStream].forEach(function(stream){
        stream.getAudioTracks().forEach(function(track){
          track.addEventListener("ended",function(){
            if(capture&&capture.captureId===captureId&&!capture.stopping)stop("source-track-ended");
          },{once:true});
        });
      });
      setStatus("Activo · dos fuentes separadas; enviando ventanas de 6 s");
      button.disabled=false;button.textContent="Detener diálogo Groq";
    }catch(error){
      if(context&&context.state!=="closed")await context.close().catch(function(){});
      [tabStream,micStream].filter(Boolean).forEach(function(stream){stream.getTracks().forEach(function(track){try{track.stop();}catch(_){} });});
      await send({type:"SIGNAL_GROQ_DIALOGUE_CAPTURE_STOP",captureId:captureId,callId:call,reason:String(error&&error.reasonCode||"capture-failed")});
      button.disabled=false;
      setStatus(showReason(error&&error.reasonCode||error&&error.message||"capture-failed"),true);
      await refreshPolicy();
    }
  }
  async function stop(reason){
    if(!capture)return;
    var current=capture;
    if(current.stopPromise)return current.stopPromise;
    current.stopping=true;
    current.stopPromise=(async function(){
      setStatus("Cerrando ventanas finales y drenando ambas colas…");
      current.lanes.forEach(function(lane){try{lane.node.port.postMessage({type:"flush"});}catch(_){}});
      await new Promise(function(resolve){setTimeout(resolve,120);});
      var deadline=Date.now()+25000;
      while(Date.now()<deadline&&(current.pending["groq-remote"]>0||current.pending["groq-interpreter"]>0))
        await new Promise(function(resolve){setTimeout(resolve,100);});
      if(capture&&capture.captureId===current.captureId)capture=null;
      current.lanes.forEach(function(lane){try{lane.source.disconnect();lane.node.disconnect();}catch(_){}});
      current.streams.forEach(function(stream){stream.getTracks().forEach(function(track){try{track.stop();}catch(_){} });});
      if(current.context&&current.context.state!=="closed")await current.context.close().catch(function(){});
      await send({type:"SIGNAL_GROQ_DIALOGUE_CAPTURE_STOP",captureId:current.captureId,callId:current.callId,reason:String(reason||"stopped")});
      if(button){button.disabled=false;button.textContent="Iniciar diálogo Groq";}
      setStatus("Captura detenida · segmentos remotos "+current.delivered["groq-remote"]+" · intérprete "+current.delivered["groq-interpreter"]);
      await refreshPolicy();
    })();
    return current.stopPromise;
  }
  chrome.runtime.onMessage.addListener(function(message){
    if(message&&message.type==="SIGNAL_GROQ_DIALOGUE_CAPTURE_STOP"&&capture&&message.captureId===capture.captureId)
      stop(message.reason||"background-stop");
  });
  function routeCheck(){
    if(disposed)return;
    if(!callId()){
      if(capture)stop("call-route-left");
      if(host){host.remove();host=null;root=null;button=null;statusNode=null;}
      return;
    }
    mount();
  }
  function dispose(){
    disposed=true;
    if(refreshTimer)clearInterval(refreshTimer);
    if(routeTimer)clearInterval(routeTimer);
    if(capture)stop("pagehide");
    if(host)host.remove();
  }
  window.addEventListener("pagehide",dispose,{once:true});
  window.addEventListener("popstate",routeCheck);
  window.addEventListener("hashchange",routeCheck);
  routeTimer=setInterval(routeCheck,1000);
  refreshTimer=setInterval(refreshPolicy,5000);
  routeCheck();
})();
