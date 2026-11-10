(function(root){
  "use strict";

  function normalize(text){
    return String(text||"").replace(/[\\u200B-\\u200D\\uFEFF]/g,"").replace(/\\s+/g," ").trim();
  }
  function sourceRank(source){
    if(source==="groq-interpreter")return 0;
    if(source==="groq-remote")return 1;
    return 2;
  }
  function stableSegmentId(captureId,source,sequence,segmentId){
    return [String(captureId||""),String(source||""),String(sequence||0),String(segmentId==null?0:segmentId)].join(":");
  }
  function normalizeSegment(value){
    var s=value||{},start=Number(s.startMs),end=Number(s.endMs),text=normalize(s.text);
    if(!text||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<start)return null;
    var source=s.source==="groq-interpreter"?"groq-interpreter":s.source==="groq-remote"?"groq-remote":String(s.source||"unknown");
    return {
      id:String(s.id||stableSegmentId(s.captureId,source,s.sequence,s.segmentId)),
      source:source,
      speaker:source==="groq-interpreter"?"INTÉRPRETE":source==="groq-remote"?"AUDIO REMOTO · HABLANTE NO VERIFICADO":"HABLANTE NO VERIFICADO",
      startMs:Math.round(start),endMs:Math.round(end),text:text,
      language:String(s.language||"unknown"),
      sequence:Number.isInteger(Number(s.sequence))?Number(s.sequence):0,
      segmentIndex:Number.isInteger(Number(s.segmentIndex))?Number(s.segmentIndex):0,
      overlap:false
    };
  }
  function compareSegments(a,b){
    return a.startMs-b.startMs||a.endMs-b.endMs||sourceRank(a.source)-sourceRank(b.source)||a.sequence-b.sequence||a.segmentIndex-b.segmentIndex||a.id.localeCompare(b.id);
  }
  function mergeSegments(groups){
    var byId=new Map();
    (Array.isArray(groups)?groups:[]).forEach(function(item){
      var s=normalizeSegment(item);if(!s)return;
      if(!byId.has(s.id))byId.set(s.id,s);
      else {
        var old=byId.get(s.id);
        if(s.text.length>=old.text.length)byId.set(s.id,Object.assign({},s,{startMs:Math.min(old.startMs,s.startMs),endMs:Math.max(old.endMs,s.endMs)}));
      }
    });
    var sorted=Array.from(byId.values()).sort(compareSegments);
    for(var i=0;i<sorted.length;i++){
      for(var j=i+1;j<sorted.length&&sorted[j].startMs<sorted[i].endMs;j++){
        if(sorted[i].source!==sorted[j].source&&sorted[j].endMs>sorted[i].startMs){
          sorted[i].overlap=true;sorted[j].overlap=true;
        }
      }
    }
    return sorted;
  }
  function sortSegments(items){
    return (Array.isArray(items)?items:[]).slice().sort(function(a,b){
      var ta=Number(a&&a.startMs);var tb=Number(b&&b.startMs);
      if(Number.isFinite(ta)&&Number.isFinite(tb))return ta-tb;
      ta=Date.parse(a&&a.timestamp||"")||0;tb=Date.parse(b&&b.timestamp||"")||0;
      return ta-tb;
    });
  }
  function speakerLabel(source){
    return source==="groq-interpreter"?"INTÉRPRETE":source==="groq-remote"?"AUDIO REMOTO · HABLANTE NO VERIFICADO":"HABLANTE NO VERIFICADO";
  }
  function formatDialogue(items){
    return mergeSegments(items).map(function(s){
      var t=new Date(s.startMs).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
      return "["+t+"] "+s.speaker+": "+s.text;
    }).join("\\n\\n");
  }
  root.SignalDialogue={
    normalize:normalize,sortSegments:sortSegments,stableSegmentId:stableSegmentId,
    normalizeSegment:normalizeSegment,mergeSegments:mergeSegments,speakerLabel:speakerLabel,
    formatDialogue:formatDialogue
  };
})(typeof globalThis!=="undefined"?globalThis:window);
