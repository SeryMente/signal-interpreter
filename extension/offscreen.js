(function(){
"use strict";
var audioContext=null;
async function playTone(volume, cue){
  if(!audioContext || audioContext.state==="closed") audioContext=new AudioContext();
  if(audioContext.state==="suspended") await audioContext.resume();
  var c=audioContext;
  var start=c.currentTime;
  var peak=Math.max(.0001,volume*.36);
  function tone(frequency, at, duration){
    return new Promise(function(resolve,reject){
      var o=c.createOscillator(),g=c.createGain();
      o.type="sine";
      o.frequency.setValueAtTime(frequency,at);
      g.gain.setValueAtTime(.0001,at);
      g.gain.exponentialRampToValueAtTime(peak,at+.012);
      g.gain.exponentialRampToValueAtTime(.0001,at+duration-.02);
      o.connect(g);g.connect(c.destination);
      o.onended=resolve;
      try{o.start(at);o.stop(at+duration)}catch(error){reject(error)}
    });
  }
  if(cue==="mute-on"){
    await tone(523.25,start,.11);
    await tone(392,start+.12,.13);
  }else if(cue==="mute-off"){
    await tone(1046.5,start,.11);
    await tone(880,start+.12,.13);
  }else{
    await tone(880,start,.11);
    await tone(1174.66,start+.12,.13);
  }
  return true;
}
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
  if(!message||message.target!=="offscreen")return false;
  if(message.type==="EFFECTIF_PLAY_SOUND"){
    playTone(Math.max(0,Math.min(1,Number(message.volume)||0)),String(message.cue||""))
      .then(function(){sendResponse({ok:true})}).catch(function(){sendResponse({ok:false,error:"control-tone-unavailable"})});return true;
  }
  if(message.type==="SIGNAL_GET_GROQ_CAPTURE_STATE"){
    sendResponse({ok:true,running:false,sessionId:null,tabAudio:false,microphone:false,callPreviewActive:false,captureScope:"native-text-only"});return false;
  }
  if(message.type==="SIGNAL_SET_MICROPHONE_MUTED"){
    sendResponse({ok:true,verified:true,inactive:true,trackCount:0,muted:!!message.muted,captureScope:"native-text-only"});return false;
  }
  if(/^SIGNAL_START_|^SIGNAL_SET_CAPTION_PREVIEW$/.test(message.type)){
    sendResponse({ok:false,reasonCode:"native-text-only",error:"La captura y reproducción de audio de conversación están deshabilitadas."});return false;
  }
  if(/^SIGNAL_STOP_|^SIGNAL_CALL_CAPTION_MIC_STOP$/.test(message.type)){
    sendResponse({ok:true,active:false,enabled:false,started:false,tabEnabled:false,micEnabled:false});return false;
  }
  return false;
});
})();
