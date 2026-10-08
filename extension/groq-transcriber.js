(function(root){
  "use strict";
  var ENDPOINT="https://api.groq.com/openai/v1/audio/transcriptions";
  var DEFAULT_MODEL="whisper-large-v3-turbo";
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
    return (base+" "+String(context||"")).trim().slice(0,900);
  }
  async function transcribe(blob,options){
    var opts=options||{},token=getToken(opts);
    var model=String(opts.model||DEFAULT_MODEL),language=opts.language===null||opts.language===undefined?"":String(opts.language).trim(),context=String(opts.prompt||""),timeoutMs=Number(opts.timeoutMs||30000);
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
      form.append("timestamp_granularities[]","segment");
      var prompt=buildPrompt(language,context);
      if(prompt)form.append("prompt",prompt);
      var controller=new AbortController();
      timer=setTimeout(function(){controller.abort()},timeoutMs);
      var response=await fetch(ENDPOINT,{method:"POST",headers:{Authorization:"Bearer "+token},body:form,signal:controller.signal,cache:"no-store"});
      if(timer)clearTimeout(timer);
      var raw=await response.text(),data=null;
      try{data=raw?JSON.parse(raw):null}catch(_){}
      if(!response.ok)return{ok:false,error:"Groq HTTP "+response.status+": "+cleanError(data&&data.error&&data.error.message||raw),httpStatus:response.status,latencyMs:Date.now()-started};
      var text=String(data&&data.text||"").trim();
      var segments=Array.isArray(data&&data.segments)?data.segments.map(function(s){return{id:s.id,start:Number(s.start||0),end:Number(s.end||0),text:String(s.text||"").trim()}}).filter(function(s){return s.text}):[];
      return{ok:true,text:text,segments:segments,language:String(data&&data.language||language||"unknown"),model:String(data&&data.model||model),latencyMs:Date.now()-started,bytes:blob.size};
    }catch(error){
      if(timer)clearTimeout(timer);
      return{ok:false,error:cleanError(error&&error.name==="AbortError"?"Tiempo agotado al consultar Groq":error),latencyMs:Date.now()-started};
    }
  }
  root.SignalGroqTranscriber={endpoint:ENDPOINT,model:DEFAULT_MODEL,ready:ready,transcribe:transcribe};
})(typeof globalThis!=="undefined"?globalThis:window);
