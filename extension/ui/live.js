(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var items=[],sessions=[],activeSessionId=null,currentSession=null,activeSpeaker="CLIENTE",view="timeline",autoScroll=true,lastSignal=null,focusMode=false,audioVoices=0,audioConfidence=0,voiceMap={A:"CLIENTE",B:"PROFESIONAL"},sessionSaveTimer=null;
var sizes={compact:{width:430,height:700},normal:{width:760,height:760},reading:{width:1200,height:820}};
var seen={CLIENTE:0,PROFESIONAL:0,YO:0};

function esc(v){return String(v||"").replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function time(v){try{return new Date(v).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}catch(_){return"—"}}
function speakerClass(s){return s==="PROFESIONAL"?"professional":s==="YO"?"me":"client"}
function mappedSpeaker(raw){return voiceMap[raw]||null}
function sessionParts(s){try{var u=new URL(String(s&&s.sourceUrl||"")),host=u.hostname.replace(/^www\./,""),path=(u.pathname||"/")+(u.search||"");return{title:(s&&s.title)||host||"Sesión",url:host+(path.length>48?path.slice(0,45)+"…":path)}}catch(_){return{title:(s&&s.title)||"Sesión",url:String(s&&s.sourceUrl||"")}}}
function normalizeSession(s){s=Object.assign({segments:[],activeSpeaker:"CLIENTE",view:"timeline",fontSize:20,autoScroll:true,compactDensity:false,voiceMap:{A:"CLIENTE",B:"PROFESIONAL"}},s||{});s.segments=Array.isArray(s.segments)?s.segments.slice(-200):[];return s}
function upsertSession(s){if(!s||!s.id)return;var n=normalizeSession(s),i=sessions.findIndex(function(x){return x.id===n.id});if(i<0)sessions.push(n);else sessions[i]=n}
function recomputeSeen(){seen={CLIENTE:0,PROFESIONAL:0,YO:0};items.forEach(function(x){seen[x.speaker]=(seen[x.speaker]||0)+1})}
function renderSessionTabs(){var host=$("sessionTabsList");if(!host)return;host.replaceChildren();if(!sessions.length){var e=document.createElement("span");e.className="session-empty";e.textContent="Abre la consola desde una pestaña para crear una sesión.";host.appendChild(e);return}sessions.forEach(function(s){var b=document.createElement("button"),p=sessionParts(s);b.type="button";b.className="session-tab"+(s.id===activeSessionId?" active":"");b.dataset.sessionId=s.id;b.title=s.sourceUrl||s.title||"Sesión";b.innerHTML="<span>"+esc(p.title)+"</span><small>"+esc(p.url)+"</small>";b.addEventListener("click",function(){activateSession(s.id)});host.appendChild(b)});var a=host.querySelector(".session-tab.active");if(a)a.scrollIntoView({block:"nearest",inline:"nearest"})}
function renderSource(){var el=$("sessionSource");if(!el)return;var p=sessionParts(currentSession||{});el.textContent=currentSession?p.url:"Sin URL de sesión";el.title=currentSession&&currentSession.sourceUrl||""}
function applySession(s){if(!s)return;currentSession=normalizeSession(s);activeSessionId=currentSession.id;items=currentSession.segments.slice(-200);activeSpeaker=currentSession.activeSpeaker||"CLIENTE";view=currentSession.view==="triptych"?"triptych":"timeline";autoScroll=currentSession.autoScroll!==false;voiceMap=Object.assign({A:"CLIENTE",B:"PROFESIONAL"},currentSession.voiceMap||{});audioVoices=0;audioConfidence=0;$("audioText").textContent="Esperando";recomputeSeen();lastSignal=items.length?items[items.length-1].timestamp:null;var f=Number(currentSession.fontSize)||20;$("fontSize").value=String(f);$("fontSizeValue").textContent=f+" px";$("autoScroll").checked=autoScroll;$("compactDensity").checked=!!currentSession.compactDensity;document.documentElement.style.setProperty("--font",f+"px");document.body.classList.toggle("compact",!!currentSession.compactDensity);$("timeline").classList.toggle("hidden",view!=="timeline");$("triptych").classList.toggle("hidden",view!=="triptych");document.querySelectorAll("[data-view]").forEach(function(b){b.classList.toggle("active",b.dataset.view===view)});syncSpeakerButtons();render()}
function persistSessionPatch(patch,immediate){if(!activeSessionId)return;if(currentSession)currentSession=Object.assign({},currentSession,patch);upsertSession(currentSession);renderSessionTabs();clearTimeout(sessionSaveTimer);var send=function(){chrome.runtime.sendMessage({type:"UPDATE_SIGNAL_SESSION",sessionId:activeSessionId,patch:patch}).catch(function(){})};if(immediate)send();else sessionSaveTimer=setTimeout(send,120)}
async function activateSession(id){if(!id)return;clearTimeout(sessionSaveTimer);var local=sessions.find(function(s){return s.id===id});if(local)applySession(local);try{var r=await chrome.runtime.sendMessage({type:"ACTIVATE_SIGNAL_SESSION",sessionId:id});if(!r||!r.ok)throw new Error(r&&r.error||"No se pudo activar la sesión");if(r.session){upsertSession(r.session);applySession(r.session)}if(r.audio&&r.audio.error){$("audioText").textContent="ERROR";$("participantDetection").textContent="Captura: "+String(r.audio.error).slice(0,150)}}catch(error){$("audioText").textContent="ERROR";$("participantDetection").textContent="Captura: "+String(error).slice(0,150)}}
function updateCounts(){
  $("clientCount").textContent=seen.CLIENTE;$("professionalCount").textContent=seen.PROFESIONAL;$("meCount").textContent=seen.YO;
  var external=(seen.CLIENTE>0?1:0)+(seen.PROFESIONAL>0?1:0);
  $("participantSummary").textContent=(external===2?"2 VOCES EXTERNAS":"1 VOZ EXTERNA")+" · "+(external+1)+" PARTICIPANTES OBSERVADOS";
  $("participantDetection").textContent=audioVoices?((audioVoices===2?"2 voces externas detectadas":"1 voz externa detectada")+" · confianza "+Math.round(audioConfidence*100)+"%"):("Asignación manual · "+(external===2?"2 voces externas observadas":"1 voz externa observada"));
}
function makeTurn(x){
  var node=document.createElement("article");node.className="turn "+speakerClass(x.speaker);
  node.innerHTML='<div class="turn-meta"><span class="name">'+esc(x.speaker)+'</span><span class="time">'+time(x.timestamp)+'</span></div><div class="text">'+esc(x.text)+'</div>';
  node.addEventListener("click",function(){activeSpeaker=x.speaker;syncSpeakerButtons()});
  return node;
}
function renderTimeline(){
  var host=$("timeline");host.replaceChildren();
  if(!items.length){var p=document.createElement("p");p.className="empty";p.textContent="Esperando señal externa…";host.appendChild(p);return}
  items.forEach(function(x){host.appendChild(makeTurn(x))});
  if(autoScroll)host.scrollTop=host.scrollHeight;
}
function renderTriptych(){
  ["clientLane","professionalLane","meLane"].forEach(function(id){$(id).replaceChildren()});
  items.forEach(function(x){
    var id=x.speaker==="CLIENTE"?"clientLane":x.speaker==="PROFESIONAL"?"professionalLane":"meLane";
    var p=document.createElement("div");p.className="lane-item";p.innerHTML="<time>"+time(x.timestamp)+"</time><p>"+esc(x.text)+"</p>";$(id).appendChild(p)
  });
  ["clientLane","professionalLane","meLane"].forEach(function(id){$(id).scrollTop=$(id).scrollHeight});
}
function render(){
  renderSessionTabs();renderSource();renderTimeline();renderTriptych();updateCounts();$("segmentCount").textContent=String(items.length);
  if(lastSignal)$("captionText").textContent="Activo · "+time(lastSignal);
  $("activeSpeakerTitle").textContent=activeSpeaker;
  if(focusMode)renderFocus();
}
function syncSpeakerButtons(){
  document.querySelectorAll("[data-speaker]").forEach(function(b){b.classList.toggle("active",b.dataset.speaker===activeSpeaker)});
  $("activeSpeakerTitle").textContent=activeSpeaker;
}
function addEventSegment(e){
  var id=e.sessionId||activeSessionId;if(!id)return;var sess=sessions.find(function(x){return x.id===id});if(!sess)return;
  var sid=e.segmentId||("signal-"+(e.sequence||Date.now())+"-"+String(e.timestamp||""));if((sess.segments||[]).some(function(x){return x.id===sid}))return;
  var text=String(e.text||"").trim();if(!text)return;var speaker=(e.manual&&e.speaker)?e.speaker:(mappedSpeaker(e.speakerId)||sess.activeSpeaker||"CLIENTE");
  var x={id:sid,speaker:speaker,text:text,timestamp:e.timestamp||new Date().toISOString(),reason:e.reason||"stable",source:e.source||"live-caption"};sess.segments=(sess.segments||[]).concat(x).slice(-200);upsertSession(sess);
  if(id===activeSessionId){currentSession=sess;items=sess.segments.slice(-200);recomputeSeen();lastSignal=x.timestamp;render()}
}
function submitYo(){
  var value=$("yo").value.trim();if(!value||!activeSessionId)return;
  chrome.runtime.sendMessage({type:"ADD_SIGNAL_SESSION_SEGMENT",sessionId:activeSessionId,text:value,speaker:"YO"}).then(function(r){if(r&&r.ok&&r.session){upsertSession(r.session);applySession(r.session);$("yo").value="";activeSpeaker="YO";syncSpeakerButtons();$("yo").focus()}else if(r&&!r.ok){$("audioText").textContent="ERROR";$("participantDetection").textContent=String(r.error||"No se pudo insertar YO")}}).catch(function(error){$("audioText").textContent="ERROR";$("participantDetection").textContent=String(error)})
}
function renderFocus(){
  var x=items[items.length-1];$("focusLabel").textContent=x?x.speaker:activeSpeaker;$("focusText").textContent=x?x.text:"Esperando señal…";
}
function setView(next){view=next;document.querySelectorAll("[data-view]").forEach(function(b){b.classList.toggle("active",b.dataset.view===view)});$("timeline").classList.toggle("hidden",view!=="timeline");$("triptych").classList.toggle("hidden",view!=="triptych");persistSessionPatch({view:view},true);render()}
function applySize(name){
  var s=sizes[name];if(!s)return;
  chrome.windows.getCurrent().then(function(w){var bounds={width:s.width,height:s.height};if(Number.isFinite(w.left))bounds.left=w.left;if(Number.isFinite(w.top))bounds.top=w.top;return chrome.windows.update(w.id,bounds)}).catch(function(){});
  localStorage.setItem("signalLiveSize",name);$("sizeMenuPanel").classList.add("hidden")
}
function saveBounds(){
  chrome.windows.getCurrent().then(function(w){localStorage.setItem("signalLiveBounds",JSON.stringify({left:w.left,top:w.top,width:w.width,height:w.height,state:w.state}))}).catch(function(){});
}
function restoreBounds(){
  try{
    var saved=JSON.parse(localStorage.getItem("signalLiveBounds")||"null");
    if(saved&&Number.isFinite(saved.width)&&Number.isFinite(saved.height))chrome.windows.getCurrent().then(function(w){chrome.windows.update(w.id,{left:saved.left,top:saved.top,width:saved.width,height:saved.height,state:saved.state==="normal"?"normal":undefined})}).catch(function(){});
    else {var name=localStorage.getItem("signalLiveSize")||"normal";applySize(name)}
  }catch(_){}
}
function toggleFocus(v){focusMode=typeof v==="boolean"?v:!focusMode;$("focusOverlay").classList.toggle("hidden",!focusMode);if(focusMode)renderFocus()}
function handle(e){
  if(!e||!e.type)return;
  if(e.type==="signal.session.active"||e.type==="signal.session.updated"){var existing=sessions.find(function(x){return x.id===e.sessionId}),incoming=normalizeSession(e.session||{});if(e.type==="signal.session.updated"&&!incoming.segments.length&&existing&&existing.segments.length)incoming.segments=existing.segments.slice(-100);upsertSession(incoming);activeSessionId=e.sessionId||activeSessionId;var active=sessions.find(function(x){return x.id===activeSessionId});if(active)applySession(active);return}
  if(e.type==="bridge.connected"){$("bridgeDot").classList.add("ok");$("bridgeStatus").textContent="CONECTADO";$("bridgeText").textContent="Conectado";return}
  if(e.type==="bridge.heartbeat")return;
  if(e.type==="caption.status"&&(!e.sessionId||e.sessionId===activeSessionId)){$("captionText").textContent=e.status==="found"?"Activo":"Esperando";return}
  if(e.type==="speaker.count"&&(!e.sessionId||e.sessionId===activeSessionId)){audioVoices=Number(e.externalVoices)||0;audioConfidence=Number(e.confidence)||0;$("audioText").textContent=audioVoices?(audioVoices+" voz"+(audioVoices===1?"":"es")+" · "+Math.round(audioConfidence*100)+"%"):"Esperando";updateCounts();return}
  if(e.type==="speaker.activity"&&(!e.sessionId||e.sessionId===activeSessionId)){var mapped=mappedSpeaker(e.speakerId);if(mapped){activeSpeaker=mapped;syncSpeakerButtons()}return}
  if(e.type==="audio.status"&&(!e.sessionId||e.sessionId===activeSessionId)){$("audioText").textContent=e.status==="connected"?"ACTIVO":e.status==="error"?"ERROR":"ESPERANDO";return}
  if(e.type==="caption.segment"){addEventSegment(e);return}
  if(e.type==="caption.clear"){var clearId=e.sessionId||activeSessionId,sess=sessions.find(function(x){return x.id===clearId});if(sess){sess.segments=[];upsertSession(sess);if(clearId===activeSessionId){items=[];recomputeSeen();lastSignal=null;render()}}return}
}
document.querySelectorAll("[data-speaker]").forEach(function(b){b.addEventListener("click",function(){activeSpeaker=b.dataset.speaker;syncSpeakerButtons();persistSessionPatch({activeSpeaker:activeSpeaker},true);if(activeSpeaker==="YO")$("yo").focus()})});
document.querySelectorAll("[data-map]").forEach(function(b){b.addEventListener("click",function(){var p=b.dataset.map.split(":");voiceMap[p[0]]=p[1];persistSessionPatch({voiceMap:Object.assign({},voiceMap)},true);updateCounts()})});
document.querySelectorAll("[data-view]").forEach(function(b){b.addEventListener("click",function(){setView(b.dataset.view)})});
$("exportDiagnostic").addEventListener("click",function(){exportDiagnosticBundle()});
$("sendYo").addEventListener("click",submitYo);$("yo").addEventListener("keydown",function(e){if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();submitYo()}});
$("clear").addEventListener("click",function(){if(activeSessionId)chrome.runtime.sendMessage({type:"CLEAR_SIGNAL_INTERPRETER_TRANSCRIPT",sessionId:activeSessionId}).catch(function(){})});
async function exportDiagnosticBundle(){
  try{
    var stored=await chrome.storage.local.get(["effectifConfig","effectifState","effectifPlatformMirror","signalInterpreterSessions","signalInterpreterActiveSessionId","effectifLastEvent","effectifTelemetryHealth"]);
    var results=await Promise.all([KhoraTelemetryDB.getEvents(),KhoraTelemetryDB.getSnapshots(),KhoraTelemetryDB.getAllSignalSegments(),KhoraTelemetryDB.stats()]);
    var summary={};results[0].forEach(function(e){var key=String(e.action||"UNKNOWN");summary[key]=(summary[key]||0)+1});
    var safeConfig=Object.assign({},stored.effectifConfig||{});if(safeConfig.groqApiKey)safeConfig.groqApiKey="[REDACTED]";
    var sessions=(Array.isArray(stored.signalInterpreterSessions)?stored.signalInterpreterSessions:[]).map(function(s){var copy=Object.assign({},s);delete copy.segments;return copy});
    var payload={schema:"signal-interpreter-diagnostic/v3",exportedAt:new Date().toISOString(),report:{purpose:"Diagnóstico reproducible de captura, bridge, Live Caption y persistencia por sesión",eventSummary:summary,eventsCount:results[0].length,signalSegmentsCount:results[2].length,snapshotCount:results[1].length},bridgeState:(stored.effectifState&&stored.effectifState.signalInterpreterBridge)||null,telemetryHealth:stored.effectifTelemetryHealth||null,lastEvent:stored.effectifLastEvent||null,config:safeConfig,state:stored.effectifState||{},activeSessionId:stored.signalInterpreterActiveSessionId||null,sessions:sessions,events:results[0],platformSnapshots:results[1],signalSegments:results[2]};
    var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="signal-interpreter-diagnostico-"+new Date().toISOString().replace(/[:.]/g,"-")+".json";document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},2000);
    $("audioText").textContent="LOG DESCARGADO";$("participantDetection").textContent="Diagnóstico: "+results[0].length.toLocaleString("es-MX")+" eventos · "+results[2].length.toLocaleString("es-MX")+" segmentos";
  }catch(error){$("audioText").textContent="ERROR";$("participantDetection").textContent="Exportación: "+String(error).slice(0,180);chrome.runtime.sendMessage({type:"SIGNAL_LIVE_UI_ERROR",error:String(error),phase:"export"}).catch(function(){})}
}

$("scrollLive").addEventListener("click",function(){autoScroll=true;$("autoScroll").checked=true;$("timeline").scrollTop=$("timeline").scrollHeight});
$("focusBtn").addEventListener("click",function(){toggleFocus()});$("focusExit").addEventListener("click",function(){toggleFocus(false)});
$("sizeMenu").addEventListener("click",function(){$("sizeMenuPanel").classList.toggle("hidden")});
document.querySelectorAll("[data-size]").forEach(function(b){b.addEventListener("click",function(){applySize(b.dataset.size)})});
$("fontSize").addEventListener("input",function(){document.documentElement.style.setProperty("--font",this.value+"px");$("fontSizeValue").textContent=this.value+" px";persistSessionPatch({fontSize:Number(this.value)},false)});
$("autoScroll").addEventListener("change",function(){autoScroll=this.checked;persistSessionPatch({autoScroll:autoScroll},true)});
$("compactDensity").addEventListener("change",function(){document.body.classList.toggle("compact",this.checked);persistSessionPatch({compactDensity:this.checked},true)});
$("timeline").addEventListener("scroll",function(){var el=$("timeline");autoScroll=(el.scrollHeight-el.scrollTop-el.clientHeight)<80;$("autoScroll").checked=autoScroll});
document.addEventListener("keydown",function(e){
 if(e.target&&/TEXTAREA|INPUT/.test(e.target.tagName))return;
 if(e.key==="1"){activeSpeaker="CLIENTE";syncSpeakerButtons();persistSessionPatch({activeSpeaker:activeSpeaker},true)}
 if(e.key==="2"){activeSpeaker="PROFESIONAL";syncSpeakerButtons();persistSessionPatch({activeSpeaker:activeSpeaker},true)}
 if(e.key==="3"){activeSpeaker="YO";syncSpeakerButtons();persistSessionPatch({activeSpeaker:activeSpeaker},true);$("yo").focus()}
 if(e.key.toLowerCase()==="f")toggleFocus(true);
 if(e.key==="Escape"&&focusMode)toggleFocus(false);
 if(e.key.toLowerCase()==="t")setView("timeline");
 if(e.key.toLowerCase()==="g")setView("triptych");
});
chrome.runtime.onMessage.addListener(function(m){if(m&&m.type==="SIGNAL_INTERPRETER_EVENT")handle(m.event)});
chrome.runtime.sendMessage({type:"SIGNAL_LIVE_CONSOLE_OPEN"}).catch(function(){});chrome.runtime.sendMessage({type:"GET_SIGNAL_INTERPRETER_STATE"}).then(function(r){
 if(!r||!r.ok)return;
 sessions=(Array.isArray(r.sessions)?r.sessions:[]).map(normalizeSession);activeSessionId=r.activeSessionId||null;
 var initial=activeSessionId?sessions.find(function(x){return x.id===activeSessionId}):sessions[sessions.length-1];
 if(initial)applySession(initial);else{items=[];render()}
 $("bridgeDot").classList.toggle("ok",r.bridge&&r.bridge.status==="connected");$("bridgeStatus").textContent=r.bridge&&r.bridge.status==="connected"?"CONECTADO":"DESCONECTADO";$("bridgeText").textContent=r.bridge&&r.bridge.status==="connected"?"Conectado":"Desconectado";$("captionText").textContent=r.bridge&&r.bridge.captionActive?"Activo":"Esperando";
 restoreBounds();renderSessionTabs();
}).catch(function(){restoreBounds();render()});
window.addEventListener("beforeunload",function(){saveBounds();chrome.runtime.sendMessage({type:"SIGNAL_LIVE_CONSOLE_CLOSE"}).catch(function(){})});render();syncSpeakerButtons()
})();