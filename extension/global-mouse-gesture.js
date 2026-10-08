(function(){
"use strict";
var left=false,right=false,timer=null,start=0,fired=false;
function reset(){left=false;right=false;start=0;fired=false;if(timer){clearTimeout(timer);timer=null}}
function mouse(e){return!!e&&e.pointerType==="mouse"}
function arm(){if(!left||!right||timer||fired)return;start=Date.now();timer=setTimeout(function(){timer=null;if(!left||!right)return;fired=true;try{chrome.runtime.sendMessage({type:"SIGNAL_EXTENSION_MICROPHONE_SET",muted:true,source:"mouse-chord-global",gesture:"left+right-hold",holdMs:Date.now()-start})}catch(_){}},300)}
document.addEventListener("pointerdown",function(e){if(!mouse(e))return;if(e.button===0)left=true;if(e.button===2)right=true;if(left&&right&&e.buttons===3)arm()},true);
document.addEventListener("pointerup",function(e){if(!mouse(e))return;if(e.button===0)left=false;if(e.button===2)right=false;if(!left||!right){if(timer){clearTimeout(timer);timer=null}start=0}if(!left&&!right&&fired)fired=false},true);
document.addEventListener("pointercancel",reset,true);
document.addEventListener("contextmenu",function(e){if((left&&right)||fired){e.preventDefault();e.stopPropagation()}},true);
document.addEventListener("click",function(e){if(fired){e.preventDefault();e.stopPropagation();fired=false}},true);
document.addEventListener("auxclick",function(e){if(fired){e.preventDefault();e.stopPropagation();fired=false}},true);
})();