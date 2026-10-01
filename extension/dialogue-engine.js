(function(root){
  "use strict";
  function normalize(text){return String(text||"").replace(/\s+/g," ").trim();}
  function commonPrefixBoundary(a,b){
    var aa=a.split(" "),bb=b.split(" "),i=0;
    while(i<aa.length&&i<bb.length&&aa[i]===bb[i])i++;
    return aa.slice(0,i).join(" ").length;
  }
  function captionDelta(previousSnapshot,event){
    var previous=normalize(previousSnapshot),snapshot=normalize(event&&event.snapshot),provided=normalize(event&&event.text);
    if(!snapshot){snapshot=provided;}
    if(!snapshot)return{emit:false,reason:"empty"};
    if(!previous)return{emit:true,text:provided||snapshot,mode:"initial"};
    if(snapshot===previous)return{emit:false,reason:"duplicate"};
    if(snapshot.indexOf(previous)===0){
      var append=snapshot.slice(previous.length).trim();
      return append?{emit:true,text:append,mode:"append"}:{emit:false,reason:"duplicate"};
    }
    if(previous.indexOf(snapshot)===0)return{emit:false,reason:"replay-prefix"};
    var at=commonPrefixBoundary(previous,snapshot),delta=snapshot.slice(at).trim();
    if(!delta&&provided)delta=provided;
    return delta?{emit:true,text:delta,mode:"revision"}:{emit:false,reason:"revision-empty"};
  }
  function sortSegments(items){
    return (Array.isArray(items)?items:[]).slice(-200).sort(function(a,b){
      var ta=Date.parse(a&&a.timestamp||"")||0,tb=Date.parse(b&&b.timestamp||"")||0;
      return ta-tb;
    });
  }
  root.SignalDialogue={normalize:normalize,captionDelta:captionDelta,sortSegments:sortSegments};
})(typeof globalThis!=="undefined"?globalThis:window);
