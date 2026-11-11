import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source=fs.readFileSync("extension/groq-transcriber.js","utf8");

const calls=[];
const ctx={
  console,
  URL,
  FormData,
  Blob,
  AbortController,
  setTimeout,
  clearTimeout,
  fetch:async(url,options)=>{
    calls.push({url,options});
    return {
      ok:true,status:200,
      text:async()=>JSON.stringify({
        text:" Hola doctor, buenos días. ",
        model:"whisper-large-v3",
        segments:[
          {id:0,start:0,end:1.2,text:" Hola doctor,"},
          {id:1,start:1.2,end:2.4,text:" buenos días.",avg_logprob:-0.12,no_speech_prob:0.01,compression_ratio:1.2},
          {id:2,start:3,end:2,text:" segmento inválido "}
        ],
      })
    };
  }
};
vm.createContext(ctx);
vm.runInContext(source,ctx);

const noZdr=await ctx.SignalGroqTranscriber.transcribe(new Blob(["audio"],{type:"audio/webm"}),{__testToken:"gsk_abcdefghijklmnopqrstuvwxyz"});
assert.equal(noZdr.ok,false);
assert.equal(noZdr.reasonCode,"zdr-required");
assert.equal(calls.length,0,"no audio leaves the client before ZDR confirmation");

const preAborted=new AbortController();
preAborted.abort();
const beforePreAbort=calls.length;
const preAbortResult=await ctx.SignalGroqTranscriber.transcribe(
  new Blob(["audio"],{type:"audio/wav"}),
  {__testToken:"gsk_abcdefghijklmnopqrstuvwxyz",zeroDataRetentionConfirmed:true,signal:preAborted.signal}
);
assert.equal(preAbortResult.ok,false);
assert.equal(preAbortResult.aborted,true);
assert.equal(calls.length,beforePreAbort,"pre-aborted capture must not send audio");

const noKey=await ctx.SignalGroqTranscriber.transcribe(new Blob(["audio"],{type:"audio/webm"}),{zeroDataRetentionConfirmed:true});
assert.equal(noKey.ok,false);
assert.match(noKey.error,/GROQ_API_KEY/);

const result=await ctx.SignalGroqTranscriber.transcribe(
  new Blob(["audio"],{type:"audio/webm"}),
  {__testToken:"gsk_abcdefghijklmnopqrstuvwxyz",zeroDataRetentionConfirmed:true,language:"es",prompt:"Interpretación médica"}
);
assert.equal(result.ok,true);
assert.equal(result.text,"Hola doctor, buenos días.");
assert.equal(result.segments.length,2,"invalid timestamp segments are discarded");
assert.equal(result.segments[1].avgLogprob,-0.12);
assert.equal(result.model,"whisper-large-v3");
assert.equal(ctx.SignalGroqTranscriber.model,"whisper-large-v3","highest-quality default model is selected");
assert.equal(calls.length,1);
assert.equal(calls[0].url,"https://api.groq.com/openai/v1/audio/transcriptions");
const sent=calls[0].options.body;
assert.equal(sent.get("model"),"whisper-large-v3");
assert.equal(sent.getAll("timestamp_granularities[]").join(","),"segment");
assert.equal(sent.getAll("timestamp_granularities[]").includes("word"),false,"word timestamps are excluded from the low-latency live path");
assert.equal(sent.get("language"),"es");
assert.equal(sent.get("temperature"),"0");
assert.equal(sent.get("response_format"),"verbose_json");
assert.equal(sent.get("prompt"),"Transcripción en español para interpretación médica. Interpretación médica");
const autoLanguage=await ctx.SignalGroqTranscriber.transcribe(
  new Blob(["audio"],{type:"audio/webm"}),
  {__testToken:"gsk_abcdefghijklmnopqrstuvwxyz",zeroDataRetentionConfirmed:true,prompt:"Interprete médico bilingüe"}
);
assert.equal(autoLanguage.ok,true);
assert.equal(calls.length,2);
assert.equal(calls[1].options.body.has("language"),false,"mixed Spanish/English audio leaves language autodetection enabled");

ctx.fetch=async()=>({
  ok:false,status:429,headers:{get:(name)=>name.toLowerCase()==="retry-after"?"2":null},
  text:async()=>JSON.stringify({error:{message:"rate limited"}})
});
const throttled=await ctx.SignalGroqTranscriber.transcribe(
  new Blob(["audio"],{type:"audio/wav"}),
  {__testToken:"gsk_abcdefghijklmnopqrstuvwxyz",zeroDataRetentionConfirmed:true}
);
assert.equal(throttled.ok,false);
assert.equal(throttled.httpStatus,429);
assert.equal(throttled.retryAfterMs,2000,"Retry-After seconds are exposed to the caller");

let observedAbortSignal=null;
ctx.fetch=async(_url,options)=>new Promise((_resolve,reject)=>{
  observedAbortSignal=options.signal;
  if(options.signal.aborted)reject(Object.assign(Error("aborted"),{name:"AbortError"}));
  else options.signal.addEventListener("abort",()=>reject(Object.assign(Error("aborted"),{name:"AbortError"})),{once:true});
});
const externalAbort=new AbortController();
const abortPromise=ctx.SignalGroqTranscriber.transcribe(
  new Blob(["audio"],{type:"audio/wav"}),
  {__testToken:"gsk_abcdefghijklmnopqrstuvwxyz",zeroDataRetentionConfirmed:true,signal:externalAbort.signal,timeoutMs:5000}
);
await Promise.resolve();
externalAbort.abort();
const aborted=await abortPromise;
assert.equal(aborted.ok,false);
assert.equal(aborted.aborted,true,"capture cancellation aborts an in-flight Groq request");
assert.equal(observedAbortSignal.aborted,true);

let bodyReadSignal=null;
ctx.fetch=async(_url,options)=>{
  bodyReadSignal=options.signal;
  return {
    ok:true,status:200,headers:{get:()=>null},
    text:()=>new Promise((_resolve,reject)=>{
      if(options.signal.aborted)reject(Object.assign(Error("body-aborted"),{name:"AbortError"}));
      else options.signal.addEventListener("abort",()=>reject(Object.assign(Error("body-aborted"),{name:"AbortError"})),{once:true});
    })
  };
};
const bodyAbort=new AbortController();
const bodyPromise=ctx.SignalGroqTranscriber.transcribe(
  new Blob(["audio"],{type:"audio/wav"}),
  {__testToken:"gsk_abcdefghijklmnopqrstuvwxyz",zeroDataRetentionConfirmed:true,signal:bodyAbort.signal,timeoutMs:5000}
);
await Promise.resolve();await Promise.resolve();
assert.ok(bodyReadSignal,"mock fetch returned response headers before body reading");
bodyAbort.abort();
const bodyAborted=await bodyPromise;
assert.equal(bodyAborted.ok,false);
assert.equal(bodyAborted.aborted,true,"external cancellation remains active during response-body reading");

ctx.fetch=async()=>({ok:false,status:401,text:async()=>JSON.stringify({error:{message:"invalid key gsk_abcdefghijklmnopqrstuvwxyz"}})});
const failed=await ctx.SignalGroqTranscriber.transcribe(new Blob(["audio"],{type:"audio/webm"}),{__testToken:"gsk_abcdefghijklmnopqrstuvwxyz",zeroDataRetentionConfirmed:true});
assert.equal(failed.ok,false);
assert.doesNotMatch(failed.error,/gsk_abcdefghijklmnopqrstuvwxyz/);
console.log("GROQ_TRANSCRIBER_TEST=PASS");
