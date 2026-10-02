(function(root){
  "use strict";
  function normalize(text){return String(text||"").replace(/\s+/g," ").trim();}
  function sortSegments(items){
    return (Array.isArray(items)?items:[]).slice(-200).sort(function(a,b){
      var ta=Date.parse(a&&a.timestamp||"")||0,tb=Date.parse(b&&b.timestamp||"")||0;
      return ta-tb;
    });
  }
  root.SignalDialogue={normalize:normalize,sortSegments:sortSegments};
})(typeof globalThis!=="undefined"?globalThis:window);
