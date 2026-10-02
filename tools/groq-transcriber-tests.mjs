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
        model:"whisper-large-v3-turbo",
        segments:[
          {id:0,start:0,end:1.2,text:" Hola doctor,"},
          {id:1,start:1.2,end:2.4,text:" buenos días."}
        ]
      })
    };
  }
};
vm.createContext(ctx);
vm.runInContext(source,ctx);

const noKey=await ctx.SignalGroqTranscriber.transcribe(new Blob(["audio"],{type:"audio/webm"}),{});
assert.equal(noKey.ok,false);
assert.match(noKey.error,/GROQ_API_KEY/);

const result=await ctx.SignalGroqTranscriber.transcribe(
  new Blob(["audio"],{type:"audio/webm"}),
  {apiKey:"gsk_SECRET_TEST",model:"whisper-large-v3-turbo",language:"es",prompt:"Interpretación médica"}
);
assert.equal(result.ok,true);
assert.equal(result.text,"Hola doctor, buenos días.");
assert.equal(result.segments.length,2);
assert.equal(calls.length,1);
assert.equal(calls[0].url,"https://api.groq.com/openai/v1/audio/transcriptions");
const sent=calls[0].options.body;
assert.equal(sent.get("model"),"whisper-large-v3-turbo");
assert.equal(sent.get("language"),"es");
assert.equal(sent.get("temperature"),"0");
assert.equal(sent.get("response_format"),"verbose_json");
assert.equal(sent.get("prompt"),"Transcripción en español para interpretación médica. Interpretación médica");

ctx.fetch=async()=>({ok:false,status:401,text:async()=>JSON.stringify({error:{message:"invalid key gsk_SECRET_TEST"}})});
const failed=await ctx.SignalGroqTranscriber.transcribe(new Blob(["audio"],{type:"audio/webm"}),{apiKey:"gsk_SECRET_TEST"});
assert.equal(failed.ok,false);
assert.doesNotMatch(failed.error,/gsk_SECRET_TEST/);
console.log("GROQ_TRANSCRIBER_TEST=PASS");
