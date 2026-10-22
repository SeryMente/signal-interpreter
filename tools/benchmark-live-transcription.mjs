#!/usr/bin/env node
/**
 * Real-provider batch control for a real audio file; this is NOT a live-stream benchmark.
 * Usage (PowerShell): $env:GROQ_API_KEY='...'; node tools/benchmark-live-transcription.mjs --audio call.wav --reference reference.txt --live-caption live-caption.txt --out results.json
 * Never commit audio, references, results containing clinical text, or API keys.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { performance } from "node:perf_hooks";

const MODELS = ["whisper-large-v3", "whisper-large-v3-turbo"];
const RATES = { "whisper-large-v3": 0.111, "whisper-large-v3-turbo": 0.04 };
const ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
function arg(k, fallback = null) { const i = process.argv.indexOf(k); return i < 0 ? fallback : process.argv[i + 1]; }
function fail(s) { console.error(s); process.exit(2); }
function words(s) { return String(s || "").normalize("NFKC").toLocaleLowerCase("en-US").replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}'-]+/gu, " ").trim().split(/\s+/u).filter(Boolean); }
function score(ref, hyp) {
  const a = words(ref), b = words(hyp), d = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  let i=a.length,j=b.length,s=0,del=0,ins=0;
  while(i||j){ if(i&&j&&a[i-1]===b[j-1]&&d[i][j]===d[i-1][j-1]){i--;j--;}
    else if(i&&j&&d[i][j]===d[i-1][j-1]+1){s++;i--;j--;}
    else if(i&&d[i][j]===d[i-1][j]+1){del++;i--;} else {ins++;j--;} }
  const ca=Array.from(String(ref||"").normalize("NFKC")), cb=Array.from(String(hyp||"").normalize("NFKC"));
  const cd=Array.from({length:ca.length+1},()=>Array(cb.length+1).fill(0));
  for(let x=0;x<=ca.length;x++)cd[x][0]=x;
  for(let y=0;y<=cb.length;y++)cd[0][y]=y;
  for(let x=1;x<=ca.length;x++)for(let y=1;y<=cb.length;y++)cd[x][y]=Math.min(cd[x-1][y]+1,cd[x][y-1]+1,cd[x-1][y-1]+(ca[x-1]===cb[y-1]?0:1));
  return {referenceWords:a.length,hypothesisWords:b.length,substitutions:s,deletions:del,insertions:ins,wer:a.length?(s+del+ins)/a.length:null,coverage:a.length?Math.max(0,(a.length-del-s)/a.length):null,referenceCharacters:ca.length,cer:ca.length?cd[ca.length][cb.length]/ca.length:null};
}
function sha(buf){return crypto.createHash("sha256").update(buf).digest("hex");}
function mime(f){return ({".wav":"audio/wav",".mp3":"audio/mpeg",".m4a":"audio/mp4",".mp4":"audio/mp4",".webm":"audio/webm",".ogg":"audio/ogg",".flac":"audio/flac"})[path.extname(f).toLowerCase()]||"application/octet-stream";}
async function callGroq(buf, file, model, key) {
  const form = new FormData();
  form.append("file", new Blob([buf],{type:mime(file)}),path.basename(file));
  form.append("model",model); form.append("temperature","0"); form.append("response_format","verbose_json");
  form.append("timestamp_granularities[]","segment");
  form.append("prompt","Transcribe verbatim for consecutive medical interpretation. Detect English and Spanish automatically. Preserve repetitions, false starts, names, numbers, negations and incomplete phrases. Do not translate or summarize.");
  const t=performance.now(),res=await fetch(ENDPOINT,{method:"POST",headers:{Authorization:"Bearer "+key},body:form,signal:AbortSignal.timeout(120000),cache:"no-store"});
  const ms=Math.round(performance.now()-t),raw=await res.text(); let data={}; try{data=JSON.parse(raw)}catch{}
  if(!res.ok)throw new Error("HTTP "+res.status+": "+String(data?.error?.message||res.statusText).replace(/gsk_[A-Za-z0-9_-]+/g,"[REDACTED_KEY]"));
  return {model:data.model||model,text:String(data.text||"").trim(),language:data.language||null,segments:Array.isArray(data.segments)?data.segments:[],requestLatencyMs:ms,status:res.status};
}
const audioPath=arg("--audio"),refPath=arg("--reference"),captionPath=arg("--live-caption"),out=arg("--out","benchmark-results.json");
if(!audioPath||!refPath)fail("Uso: node tools/benchmark-live-transcription.mjs --audio <audio-real> --reference <referencia-humana.txt> [--live-caption <texto-real-caption.txt>] [--out <resultados.json>]");
const key=String(process.env.GROQ_API_KEY||"").trim();
if(!/^gsk_[A-Za-z0-9_-]{20,}$/.test(key))fail("Define GROQ_API_KEY en el entorno; no incluyas la clave en argumentos ni en el repositorio.");
if(!fs.existsSync(audioPath)||!fs.statSync(audioPath).size)fail("No existe el audio o está vacío: "+audioPath);
if(!fs.existsSync(refPath))fail("No existe la referencia: "+refPath);
const audio=fs.readFileSync(audioPath),ref=fs.readFileSync(refPath,"utf8");
if(!ref.trim())fail("La referencia humana está vacía.");
const live=captionPath?fs.readFileSync(captionPath,"utf8"):null;
const result={schema:"signal-interpreter-real-audio-benchmark-v1",status:"real-provider-run",scope:"FULL_FILE_BATCH_CONTROL_NOT_LIVE_STREAM",startedAt:new Date().toISOString(),audio:{filename:path.basename(audioPath),bytes:audio.length,sha256:sha(audio),mime:mime(audioPath)},reference:{filename:path.basename(refPath),sha256:sha(Buffer.from(ref))},liveCaption:live===null?{supplied:false}:{supplied:true,filename:path.basename(captionPath),metrics:score(ref,live)},providerRuns:[],comparison:null,caveats:["This is a real provider request on the supplied audio; not simulated.","Full-file batch latency is not live first-word latency.","A Live Caption benefit claim requires the same real audio, a human-verified reference, and actual Live Caption output.","No clinical audio or transcript should be committed."]};
for(const model of MODELS){console.log("Real Groq request:",model,"audioBytes="+audio.length);try{const r=await callGroq(audio,audioPath,model,key);r.metrics=score(ref,r.text);r.minimumBillableFloorUsd=Number((RATES[model]*10/3600).toFixed(6));r.costNote="Minimum 10-second billing floor only, not total cost; real duration/billing data required.";result.providerRuns.push(r);console.log(model,"latencyMs="+r.requestLatencyMs,"WER="+r.metrics.wer);}catch(e){result.providerRuns.push({model,status:"failed",error:String(e.message||e).slice(0,500)});console.error(model,"FAILED",e.message||e);}}
const a=result.providerRuns.find(x=>x.model===MODELS[0]&&x.metrics),b=result.providerRuns.find(x=>x.model===MODELS[1]&&x.metrics);
if(a&&b)result.comparison={werDeltaTurboMinusLarge:Number((b.metrics.wer-a.metrics.wer).toFixed(6)),latencyDeltaMsTurboMinusLarge:b.requestLatencyMs-a.requestLatencyMs};
result.completedAt=new Date().toISOString();fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n","utf8");console.log("RESULTS_WRITTEN="+path.resolve(out));console.log("SCOPE=FULL_FILE_BATCH_CONTROL_NOT_LIVE_STREAM");
