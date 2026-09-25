(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var items=[],activeSpeaker="CLIENTE",view="timeline",autoScroll=true,lastSignal=null,focusMode=false;
var sizes={compact:{width:430,height:700},normal:{width:760,height:760},reading:{width:1200,height:820}};
var seen={CLIENTE:0,PROFESIONAL:0,YO:0};

function esc(v){return String(v||"").replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function time(v){try{return new Date(v).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}catch(_){return"—"}}
function speakerClass(s){return s==="PROFESIONAL"?"professional":s==="YO"?"me":"client"}
function updateCounts(){
  $("clientCount").textContent=seen.CLIENTE;$("professionalCount").textContent=seen.PROFESIONAL;$("meCount").textContent=seen.YO;
  var external=(seen.CLIENTE>0?1:0)+(seen.PROFESIONAL>0?1:0);
  $("participantSummary").textContent=(external===2?"2 VOCES EXTERNAS":"1 VOZ EXTERNA")+" · "+(external+1)+" PARTICIPANTES OBSERVADOS";
  $("participantDetection").textContent=external===2?"2 voces externas observadas · 3 participantes en la conversación":"1 voz externa observada · 2 participantes observados";
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
  renderTimeline();renderTriptych();updateCounts();$("segmentCount").textContent=String(items.length);
  if(lastSignal)$("captionText").textContent="Activo · "+time(lastSignal);
  $("activeSpeakerTitle").textContent=activeSpeaker;
  if(focusMode)renderFocus();
}
function syncSpeakerButtons(){
  document.querySelectorAll("[data-speaker]").forEach(function(b){b.classList.toggle("active",b.dataset.speaker===activeSpeaker)});
  $("activeSpeakerTitle").textContent=activeSpeaker;
}
function addItem(text,speaker,timestamp,reason){
  text=String(text||"").trim();if(!text)return;
  var x={id:"live-"+Date.now()+"-"+items.length,speaker:speaker||activeSpeaker,text:text,timestamp:timestamp||new Date().toISOString(),reason:reason||"stable"};
  items.push(x);seen[x.speaker]=(seen[x.speaker]||0)+1;lastSignal=x.timestamp;
  if(items.length>800)items=items.slice(-800);render();
}
function submitYo(){
  var value=$("yo").value.trim();if(!value)return;
  addItem(value,"YO",new Date().toISOString(),"manual");$("yo").value="";activeSpeaker="YO";syncSpeakerButtons();$("yo").focus();
}
function renderFocus(){
  var x=items[items.length-1];$("focusLabel").textContent=x?x.speaker:activeSpeaker;$("focusText").textContent=x?x.text:"Esperando señal…";
}
function setView(next){view=next;document.querySelectorAll("[data-view]").forEach(function(b){b.classList.toggle("active",b.dataset.view===view)});$("timeline").classList.toggle("hidden",view!=="timeline");$("triptych").classList.toggle("hidden",view!=="triptych");render()}
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
  if(e.type==="bridge.connected"){ $("bridgeDot").classList.add("ok");$("bridgeStatus").textContent="CONECTADO";$("bridgeText").textContent="Conectado";return}
  if(e.type==="bridge.heartbeat")return;
  if(e.type==="caption.status"){$("captionText").textContent=e.status==="found"?"Activo":"Esperando";return}
  if(e.type==="caption.segment"){addItem(e.text,activeSpeaker,e.timestamp,e.reason);return}
  if(e.type==="caption.clear"){return}
}
document.querySelectorAll("[data-speaker]").forEach(function(b){b.addEventListener("click",function(){activeSpeaker=b.dataset.speaker;syncSpeakerButtons();if(activeSpeaker==="YO")$("yo").focus()})});
document.querySelectorAll("[data-view]").forEach(function(b){b.addEventListener("click",function(){setView(b.dataset.view)})});
$("sendYo").addEventListener("click",submitYo);$("yo").addEventListener("keydown",function(e){if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();submitYo()}});
$("clear").addEventListener("click",function(){items=[];seen={CLIENTE:0,PROFESIONAL:0,YO:0};lastSignal=null;chrome.runtime.sendMessage({type:"CLEAR_SIGNAL_INTERPRETER_TRANSCRIPT"}).catch(function(){});render()});
$("scrollLive").addEventListener("click",function(){autoScroll=true;$("autoScroll").checked=true;$("timeline").scrollTop=$("timeline").scrollHeight});
$("focusBtn").addEventListener("click",function(){toggleFocus()});$("focusExit").addEventListener("click",function(){toggleFocus(false)});
$("sizeMenu").addEventListener("click",function(){$("sizeMenuPanel").classList.toggle("hidden")});
document.querySelectorAll("[data-size]").forEach(function(b){b.addEventListener("click",function(){applySize(b.dataset.size)})});
$("fontSize").addEventListener("input",function(){document.documentElement.style.setProperty("--font",this.value+"px");$("fontSizeValue").textContent=this.value+" px"});
$("autoScroll").addEventListener("change",function(){autoScroll=this.checked});
$("compactDensity").addEventListener("change",function(){document.body.classList.toggle("compact",this.checked)});
$("timeline").addEventListener("scroll",function(){var el=$("timeline");autoScroll=(el.scrollHeight-el.scrollTop-el.clientHeight)<80;$("autoScroll").checked=autoScroll});
document.addEventListener("keydown",function(e){
 if(e.target&&/TEXTAREA|INPUT/.test(e.target.tagName))return;
 if(e.key==="1"){activeSpeaker="CLIENTE";syncSpeakerButtons()}
 if(e.key==="2"){activeSpeaker="PROFESIONAL";syncSpeakerButtons()}
 if(e.key==="3"){activeSpeaker="YO";syncSpeakerButtons();$("yo").focus()}
 if(e.key.toLowerCase()==="f")toggleFocus(true);
 if(e.key==="Escape"&&focusMode)toggleFocus(false);
 if(e.key.toLowerCase()==="t")setView("timeline");
 if(e.key.toLowerCase()==="g")setView("triptych");
});
chrome.runtime.onMessage.addListener(function(m){if(m&&m.type==="SIGNAL_INTERPRETER_EVENT")handle(m.event)});
chrome.runtime.sendMessage({type:"GET_SIGNAL_INTERPRETER_STATE"}).then(function(r){
 if(!r||!r.ok)return;
 $("bridgeDot").classList.toggle("ok",r.bridge&&r.bridge.status==="connected");$("bridgeStatus").textContent=r.bridge&&r.bridge.status==="connected"?"CONECTADO":"DESCONECTADO";$("bridgeText").textContent=r.bridge&&r.bridge.status==="connected"?"Conectado":"Desconectado";$("captionText").textContent=r.bridge&&r.bridge.captionActive?"Activo":"Esperando";
 items=(Array.isArray(r.transcript)?r.transcript:[]).map(function(x){return Object.assign({},x,{speaker:"CLIENTE"})});seen.CLIENTE=items.length;lastSignal=items.length?items[items.length-1].timestamp:null;render();syncSpeakerButtons();restoreBounds()
}).catch(function(){restoreBounds();render()});
window.addEventListener("beforeunload",saveBounds);render();syncSpeakerButtons()
})();