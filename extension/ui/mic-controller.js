(function(root){
  "use strict";
  function MicController(options){
    options=options||{};this.lang=options.lang||"es-MX";this.onFinal=options.onFinal||function(){};this.onStatus=options.onStatus||function(){};this.onError=options.onError||function(){};
    this.running=false;this.blocked=false;this.recognition=null;this.restartTimer=null;this.generation=0;this.lastFinal="";this.lastFinalAt=0;
  }
  MicController.prototype.available=function(){return !!(root.SpeechRecognition||root.webkitSpeechRecognition);};
  MicController.prototype.start=function(){
    var self=this;if(self.running)return Promise.resolve({ok:true,alreadyRunning:true});
    self.blocked=false;self.generation++;var generation=self.generation;
    if(!self.available()){self.onStatus("unsupported");return Promise.resolve({ok:false,error:"SpeechRecognition no disponible en este Chrome"});}
    try{
      var Ctor=root.SpeechRecognition||root.webkitSpeechRecognition,r=new Ctor();self.recognition=r;r.lang=self.lang;r.continuous=true;r.interimResults=false;r.maxAlternatives=1;
      r.onstart=function(){if(generation!==self.generation)return;self.running=true;self.onStatus("listening");};
      r.onresult=function(ev){if(generation!==self.generation)return;for(var i=ev.resultIndex;i<ev.results.length;i++){var result=ev.results[i];if(result&&result.isFinal){var text=String(result[0]&&result[0].transcript||"").trim(),now=Date.now();if(text&&(text!==self.lastFinal||now-self.lastFinalAt>1800)){self.lastFinal=text;self.lastFinalAt=now;self.onFinal(text);}}}};
      r.onerror=function(ev){if(generation!==self.generation)return;var code=String(ev&&ev.error||"unknown");self.onError(code);if(code==="not-allowed"||code==="service-not-allowed"||code==="audio-capture"){self.blocked=true;self.running=false;self.onStatus(code);return;}self.onStatus(code);};
      r.onend=function(){if(generation!==self.generation)return;self.running=false;if(self.blocked){self.onStatus("blocked");return;}self.onStatus("restarting");clearTimeout(self.restartTimer);self.restartTimer=setTimeout(function(){if(generation===self.generation&&!self.blocked)self.start();},350);};
      r.start();self.onStatus("starting");return Promise.resolve({ok:true});
    }catch(error){self.running=false;self.onError(String(error));self.onStatus("error");return Promise.resolve({ok:false,error:String(error)});}
  };
  MicController.prototype.stop=function(){this.generation++;this.running=false;this.blocked=true;clearTimeout(this.restartTimer);this.restartTimer=null;try{if(this.recognition)this.recognition.stop();}catch(_){}this.recognition=null;this.onStatus("stopped");return Promise.resolve({ok:true});};
  MicController.prototype.retry=function(){this.blocked=false;return this.start();};
  root.SignalMicController=MicController;
})(typeof globalThis!=="undefined"?globalThis:window);
