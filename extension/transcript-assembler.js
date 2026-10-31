(function(root){
"use strict";
var UPDATE_WINDOW_MS=2400,REPEAT_GAP_MS=1800;
function norm(v){var c=root.SignalCaptionCore;return c&&c.normalizeText?c.normalizeText(v):String(v==null?"":v).replace(/\\s+/g," ").trim().slice(0,4000)}
function lang(h,t){var c=root.SignalCaptionCore;return c&&c.resolveLanguage?c.resolveLanguage(h,t):"unknown"}
function rel(a,b){var c=root.SignalCaptionCore;return c&&c.captionRelation?c.captionRelation(a,b):(norm(a).toLowerCase()===norm(b).toLowerCase()?"duplicate":"new")}
function merge(a,b){var c=root.SignalCaptionCore;return c&&c.mergeCaptionText?c.mergeCaptionText(a,b):norm(b)}
function createState(seed){var s=seed&&seed.segment?Object.assign({},seed.segment):null;return{current:s?{segment:s,lastSeenMs:Number(seed.lastSeenMs||Date.parse(s.updatedAt||s.timestamp)||0)}:null}}
function ingest(state,caption,options){
 state=state&&typeof state==="object"?state:createState();var o=options||{},value=norm(caption&&caption.text);
 if(!value)return{state:state,action:"empty",segment:null,finalized:null,relation:"new"};
 var timestamp=String(o.timestamp||new Date().toISOString()),now=Date.parse(timestamp)||Date.now(),source=String(caption&&caption.source||"chrome-live-caption"),speaker=String(o.speaker||"HABLANTE NO IDENTIFICADO"),role=String(o.role||"unverified"),detected=lang(caption&&caption.language,value),cur=state.current&&state.current.segment?state.current:null,age=Infinity,kind="new";
 if(cur&&cur.segment.source===source&&cur.segment.speaker===speaker&&String(cur.segment.callId||"")===String(o.callId||"")){
  age=Math.max(0,now-Number(cur.lastSeenMs||Date.parse(cur.segment.updatedAt||cur.segment.timestamp)||0));kind=rel(cur.segment.text,value);
  if(age<=UPDATE_WINDOW_MS){
   if(kind==="stale")return{state:state,action:"stale",segment:null,finalized:null,relation:kind};
   if(kind==="duplicate"&&age<REPEAT_GAP_MS)return{state:state,action:"duplicate",segment:null,finalized:null,relation:kind};
   if(kind==="progressive"||kind==="overlap"){
    var combined=merge(cur.segment.text,value);if(combined===cur.segment.text)return{state:state,action:"duplicate",segment:null,finalized:null,relation:kind};
    var updated=Object.assign({},cur.segment,{text:combined,originalText:combined,language:detected==="unknown"?(cur.segment.language||"unknown"):detected,languageEvidence:detected==="unknown"?(cur.segment.languageEvidence||"unknown"):"text-heuristic",updatedAt:timestamp,partial:true});
    return{state:{current:{segment:updated,lastSeenMs:now}},action:"updated",segment:updated,finalized:null,relation:kind};
   }
  }
 }
 var finalized=cur&&cur.segment.partial===true?Object.assign({},cur.segment,{partial:false,updatedAt:timestamp,finalizedAt:timestamp}):null;
 var segment={id:String(o.id||("native-"+now)),callId:o.callId==null?null:String(o.callId),speaker:speaker,role:role,source:source,language:detected,languageEvidence:detected==="unknown"?"unknown":"text-heuristic",text:value,originalText:value,refinedText:null,confidence:null,timestamp:timestamp,updatedAt:timestamp,partial:true,reason:"native-caption-live"};
 return{state:{current:{segment:segment,lastSeenMs:now}},action:"new",segment:segment,finalized:finalized,relation:kind};
}
function finalize(state,timestamp){state=state&&typeof state==="object"?state:createState();var s=state.current&&state.current.segment?state.current.segment:null;if(!s||s.partial!==true)return{state:createState(),segment:null};var at=String(timestamp||new Date().toISOString());return{state:createState(),segment:Object.assign({},s,{partial:false,updatedAt:at,finalizedAt:at})}}
root.SignalTranscriptAssembler={createState:createState,ingest:ingest,finalize:finalize,updateWindowMs:UPDATE_WINDOW_MS,repeatGapMs:REPEAT_GAP_MS};
})(typeof globalThis!=="undefined"?globalThis:window);
