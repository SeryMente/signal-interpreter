(function(root){
  "use strict";
  var ENDPOINT="https://api.groq.com/openai/v1/audio/transcriptions";
  function cleanError(value){
    return String(value||"")
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi,"Bearer [REDACTED]")
      .replace(/gsk_[A-Za-z0-9_-]+/gi,"[REDACTED_KEY]")
      .slice(0,500);
  }
  function buildPrompt(language,context){
    var base=language==="es"?"Transcripción en español para interpretación médica.":"Transcription for medical interpretation.";
    return (base+" "+String(context||"")).trim().slice(0,900);
  }
  async function transcribe(blob,options){
    var opts=options||{};
    var apiKey=String(opts.apiKey||"").trim();
    var model=String(opts.model||"whisper-large-v3-turbo");
    var language=String(opts.language||"es");
    var context=String(opts.prompt||"");
    var timeoutMs=Number(opts.timeoutMs||30000);
    if(!apiKey)return{ok:false,error:"Falta GROQ_API_KEY."};
    if(!blob||typeof blob.size!=="number"||blob.size<=0)return{ok:false,error:"Audio vacío."};
    var started=Date.now(),timer=null;
    try{
      var form=new FormData();
      form.append("file",blob,opts.filename||"signal-audio.webm");
      form.append("model",model);
      form.append("language",language);
      form.append("temperature","0");
      form.append("response_format","verbose_json");
      form.append("timestamp_granularities[]","segment");
      var prompt=buildPrompt(language,context);
      if(prompt)form.append("prompt",prompt);
      var controller=new AbortController();
      timer=setTimeout(function(){controller.abort();},timeoutMs);
      var response=await fetch(ENDPOINT,{method:"POST",headers:{Authorization:"Bearer "+apiKey},body:form,signal:controller.signal,cache:"no-store"});
      if(timer)clearTimeout(timer);
      var raw=await response.text(),data=null;
      try{data=raw?JSON.parse(raw):null}catch(_){}
      if(!response.ok){
        return{ok:false,error:"Groq HTTP "+response.status+": "+cleanError(data&&data.error&&data.error.message||raw),httpStatus:response.status,latencyMs:Date.now()-started};
      }
      var text=String(data&&data.text||"").trim();
      var segments=Array.isArray(data&&data.segments)?data.segments.map(function(s){
        return{id:s.id,start:Number(s.start||0),end:Number(s.end||0),text:String(s.text||"").trim()};
      }).filter(function(s){return s.text;}):[];
      return{ok:true,text:text,segments:segments,model:String(data&&data.model||model),latencyMs:Date.now()-started,bytes:blob.size};
    }catch(error){
      if(timer)clearTimeout(timer);
      return{ok:false,error:cleanError(error&&error.name==="AbortError"?"Tiempo agotado al consultar Groq":error),latencyMs:Date.now()-started};
    }
  }
  root.SignalGroqTranscriber={endpoint:ENDPOINT,transcribe:transcribe};
})(typeof globalThis!=="undefined"?globalThis:window);
