(function(){
"use strict";
var audioContext=null,stream=null,source=null,analyser=null,timer=null,timeData=null,freqData=null,running=false;
var clusterA=null,clusterB=null,framesA=0,framesB=0,challenger=0,externalVoices=0,confidence=0,lastCount=0,lastCountAt=0;
function playTone(volume){var context=new AudioContext(),osc=context.createOscillator(),gain=context.createGain(),start=context.currentTime;osc.frequency.setValueAtTime(880,start);osc.frequency.setValueAtTime(1174.66,start+.12);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume*.38),start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+.35);osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+.37);osc.onended=function(){context.close()}}
function send(event){chrome.runtime.sendMessage({target:"offscreen",type:"SIGNAL_AUDIO_EVENT",event:event}).catch(function(){})}
function dist(a,b){var sum=0;for(var i=0;i<a.length;i++){var d=a[i]-b[i];sum+=d*d}return Math.sqrt(sum/a.length)}
function blend(a,b,rate){for(var i=0;i<a.length;i++)a[i]=a[i]*(1-rate)+b[i]*rate}
function features(){
  analyser.getFloatTimeDomainData(timeData);var sum=0,z=0,last=0;
  for(var i=0;i<timeData.length;i++){var v=timeData[i];sum+=v*v;if(i&&((v>=0)!=(last>=0)))z++;last=v}
  var rms=Math.sqrt(sum/timeData.length);if(rms<.006)return null;
  analyser.getFloatFrequencyData(freqData);var bands=[80,160,280,450,700,1100,1800,3000,5000,8000],out=[Math.log10(rms+1e-5),z/timeData.length],ny=audioContext.sampleRate/2;
  for(var b=0;b<bands.length-1;b++){var lo=Math.floor(bands[b]/ny*freqData.length),hi=Math.max(lo+1,Math.floor(bands[b+1]/ny*freqData.length)),acc=0,n=0;for(var k=lo;k<Math.min(hi,freqData.length);k++){acc+=Math.max(-100,freqData[k]);n++}out.push(n?acc/n:-100)}
  var mean=out.reduce(function(a,v){return a+v},0)/out.length;var norm=Math.sqrt(out.reduce(function(a,v){var d=v-mean;return a+d*d},0)/out.length)||1;return out.map(function(v){return(v-mean)/norm})
}
function tick(){
  if(!running||!analyser)return;var f=features(),now=Date.now();if(!f)return;var id="A",dA=clusterA?dist(f,clusterA):0,dB=clusterB?dist(f,clusterB):Infinity;
  if(!clusterA){clusterA=f.slice();framesA=1}
  else if(!clusterB){if(dA>.62){challenger++;if(challenger>=5){clusterB=f.slice();framesB=1;externalVoices=2;challenger=0}else blend(clusterA,f,.025)}else{challenger=0;blend(clusterA,f,.045);framesA++}}
  else{if(dB<dA){id="B";blend(clusterB,f,.035);framesB++}else{blend(clusterA,f,.035);framesA++}externalVoices=2}
  if(!clusterB)externalVoices=1;
  confidence=Math.min(1,Math.max(.18,(framesA+framesB)/45));if(clusterB)confidence=Math.min(1,.45+(Math.min(framesA,framesB)/50)*.5);
  send({type:"speaker.activity",speakerId:id,externalVoices:externalVoices,confidence:confidence,timestamp:new Date().toISOString()});
  if(now-lastCountAt>1000&&externalVoices!==lastCount){lastCount=externalVoices;lastCountAt=now;send({type:"speaker.count",externalVoices:externalVoices,confidence:confidence,timestamp:new Date().toISOString()})}
}
async function stop(){running=false;if(timer){clearInterval(timer);timer=null}try{if(source)source.disconnect()}catch(_){}try{if(analyser)analyser.disconnect()}catch(_){}if(stream){stream.getTracks().forEach(function(t){t.stop()});stream=null}if(audioContext){try{await audioContext.close()}catch(_){}audioContext=null}source=null;analyser=null;clusterA=null;clusterB=null;framesA=framesB=challenger=0;externalVoices=0;confidence=0;lastCount=0;lastCountAt=0;send({type:"audio.status",status:"stopped",timestamp:new Date().toISOString()})}
async function start(streamId){await stop();try{stream=await navigator.mediaDevices.getUserMedia({audio:{mandatory:{chromeMediaSource:"tab",chromeMediaSourceId:streamId}}});audioContext=new AudioContext();await audioContext.resume();source=audioContext.createMediaStreamSource(stream);analyser=audioContext.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.15;timeData=new Float32Array(analyser.fftSize);freqData=new Float32Array(analyser.frequencyBinCount);source.connect(analyser);source.connect(audioContext.destination);running=true;timer=setInterval(tick,320);send({type:"audio.status",status:"connected",timestamp:new Date().toISOString()});return{ok:true}}catch(error){await stop();send({type:"audio.status",status:"error",error:String(error),timestamp:new Date().toISOString()});return{ok:false,error:String(error)}}}
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){if(!message||message.target!=="offscreen")return false;if(message.type==="EFFECTIF_PLAY_SOUND"){try{playTone(Math.max(0,Math.min(1,Number(message.volume)||0)));sendResponse({ok:true})}catch(error){sendResponse({ok:false,error:String(error)})}return false}if(message.type==="SIGNAL_START_AUDIO_ANALYSIS"){start(message.streamId).then(sendResponse).catch(function(error){sendResponse({ok:false,error:String(error)})});return true}if(message.type==="SIGNAL_STOP_AUDIO_ANALYSIS"){stop().then(function(){sendResponse({ok:true})}).catch(function(error){sendResponse({ok:false,error:String(error)})});return true}return false});
})();