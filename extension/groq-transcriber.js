(function(root){
  "use strict";
  var ENDPOINT="https://api.groq.com/openai/v1/audio/transcriptions";
  var DEFAULT_MODEL="whisper-large-v3";
  function getToken(options){
    var opts=options||{};
    if(opts.__testToken)return String(opts.__testToken);
    return String(root.__SIGNAL_GROQ_TOKEN||"").trim();
  }
  async function ready(){return /^gsk_[A-Za-z0-9_-]{20,}$/.test(getToken({}))}
  function cleanError(value){
    return String(value||"")
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi,"Bearer [REDACTED]")
      .replace(/gsk_[A-Za-z0-9_-]+/gi,"[REDACTED_KEY]")
      .slice(0,500);
  }
  function buildPrompt(language,context){
    var base=language==="es"?"Transcripción en español para interpretación médica.":language==="en"?"Transcription in English for medical interpretation.":"Transcripción para interpretación médica; detecta automáticamente el idioma entre español e inglés.";
    return (base+" "+String(context||"")).trim().split(/\s+/).slice(0,180).join(" ");
  }
  async function transcribe(blob,options){
    var opts=options||{},token=getToken(opts);
    var model=String(opts.model||DEFAULT_MODEL),language=opts.language===null||opts.language===undefined?"":String(opts.language).trim(),context=String(opts.prompt||""),timeoutMs=Number(opts.timeoutMs||30000);
    if(opts.zeroDataRetentionConfirmed!==true)return{ok:false,reasonCode:"zdr-required",error:"Confirma Zero Data Retention antes de enviar audio a Groq."};
    if(!token)return{ok:false,error:"Falta GROQ_API_KEY."};
    if(!blob||typeof blob.size!=="number"||blob.size<=0)return{ok:false,error:"Audio vacío."};
    var started=Date.now(),timer=null;
    try{
      var form=new FormData();
      form.append("file",blob,opts.filename||"signal-audio.webm");
      form.append("model",model);
      if(language)form.append("language",language);
      form.append("temperature","0");
      form.append("response_format","verbose_json");
      // Segment timestamps keep live chronology without the extra word-timing latency.
      form.append("timestamp_granularities[]","segment");
      var prompt=buildPrompt(language,context);
      if(prompt)form.append("prompt",prompt);
      var controller=new AbortController(),externalSignal=opts.signal||null,externalAbort=null;
      if(externalSignal){
        if(externalSignal.aborted)controller.abort();
        else if(typeof externalSignal.addEventListener==="function"){
          externalAbort=function(){controller.abort();};
          externalSignal.addEventListener("abort",externalAbort,{once:true});
        }
      }
      timer=setTimeout(function(){controller.abort()},timeoutMs);
      var response=await fetch(ENDPOINT,{method:"POST",headers:{Authorization:"Bearer "+token},body:form,signal:controller.signal,cache:"no-store"});
      if(timer)clearTimeout(timer);
      if(externalSignal&&externalAbort&&typeof externalSignal.removeEventListener==="function")externalSignal.removeEventListener("abort",externalAbort);
      var raw=await response.text(),data=null;
      try{data=raw?JSON.parse(raw):null}catch(_){}
      if(!response.ok){
        var retryAfterMs=null;
        try{
          var retryHeader=response.headers&&response.headers.get("retry-after");
          if(retryHeader){
            var retrySeconds=Number(retryHeader);
            retryAfterMs=Number.isFinite(retrySeconds)?Math.max(0,retrySeconds*1000):Math.max(0,Date.parse(retryHeader)-Date.now());
          }
        }catch(_){}
        return{ok:false,error:"Groq HTTP "+response.status+": "+cleanError(data&&data.error&&data.error.message||raw),
          httpStatus:response.status,retryAfterMs:retryAfterMs,latencyMs:Date.now()-started};
      }
      var text=String(data&&data.text||"").trim();
      var segments=Array.isArray(data&&data.segments)?data.segments.map(function(s){
        return{id:s.id,start:Number(s.start),end:Number(s.end),text:String(s.text||"").trim(),
          avgLogprob:Number.isFinite(Number(s.avg_logprob))?Number(s.avg_logprob):null,
          noSpeechProb:Number.isFinite(Number(s.no_speech_prob))?Number(s.no_speech_prob):null,
          compressionRatio:Number.isFinite(Number(s.compression_ratio))?Number(s.compression_ratio):null};
      }).filter(function(s){return s.text&&Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.start>=0&&s.end>=s.start}):[];
      var words=Array.isArray(data&&data.words)?data.words.map(function(w){
        return{word:String(w.word||""),start:Number(w.start),end:Number(w.end)};
      }).filter(function(w){return w.word.trim()&&Number.isFinite(w.start)&&Number.isFinite(w.end)&&w.start>=0&&w.end>=w.start}):[];
      return{ok:true,text:text,segments:segments,words:words,language:String(data&&data.language||language||"unknown"),
        model:String(data&&data.model||model),latencyMs:Date.now()-started,bytes:blob.size};
    }catch(error){
      if(timer)clearTimeout(timer);
      return{ok:false,error:cleanError(error&&error.name==="AbortError"?"Consulta Groq cancelada o agotada":error),
        aborted:!!(opts.signal&&opts.signal.aborted),latencyMs:Date.now()-started};
    }
  }
  root.SignalGroqTranscriber={endpoint:ENDPOINT,model:DEFAULT_MODEL,ready:ready,transcribe:transcribe};
})(typeof globalThis!=="undefined"?globalThis:window);
