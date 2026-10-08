const REPOSITORY = "SeryMente/signal-interpreter";
const BRANCH = "main";
const API_VERSION = "2022-11-28";
const MAX_BODY_BYTES = 1500000;
const MAX_EVENTS = 200;
const MODEL_CONTEXT_PATH = "observations/health/model-context-access.json";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}
function githubHeaders() {
  return { Accept:"application/vnd.github+json", Authorization:`Bearer ${process.env.GITHUB_TOKEN || ""}`, "Content-Type":"application/json", "X-GitHub-Api-Version":API_VERSION, "User-Agent":"signal-interpreter-observability-relay" };
}
function encodePath(path) { return path.split("/").map(encodeURIComponent).join("/"); }
async function githubRequest(path, init={}) {
  const response=await fetch(`https://api.github.com${path}`,{...init,headers:{...githubHeaders(),...(init.headers||{})}});
  const text=await response.text(); let data=null; try{data=text?JSON.parse(text):null;}catch(_){data=text;}
  if(!response.ok){const error=new Error(`GitHub HTTP ${response.status}`);error.status=response.status;error.data=data;throw error;}
  return data;
}
async function readBody(req) {
  if(req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve,reject)=>{let total=0;const chunks=[];req.on("data",chunk=>{total+=Buffer.byteLength(chunk);if(total>MAX_BODY_BYTES){reject(Object.assign(new Error("Payload too large"),{status:413}));req.destroy();return;}chunks.push(chunk);});req.on("end",()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));}catch(_){reject(Object.assign(new Error("Invalid JSON"),{status:400}));}});req.on("error",reject);});
}
function validateBatch(batch) {
  if(!batch || typeof batch !== "object") throw Object.assign(new Error("Batch must be an object"),{status:400});
  if(batch.schema !== "signal-interpreter-observation-batch/v1") throw Object.assign(new Error("Unsupported batch schema"),{status:400});
  const batchId=String(batch.batchId||"");
  if(!/^[A-Za-z0-9._-]{1,120}$/.test(batchId)) throw Object.assign(new Error("Invalid batchId"),{status:400});
  if(!Array.isArray(batch.events) || batch.events.length<1 || batch.events.length>MAX_EVENTS) throw Object.assign(new Error("Invalid events array"),{status:400});
  const serialized=JSON.stringify(batch);
  if(Buffer.byteLength(serialized,"utf8")>MAX_BODY_BYTES) throw Object.assign(new Error("Batch exceeds size limit"),{status:413});
  return {batchId,serialized};
}
async function getExisting(path){try{return await githubRequest(`/repos/${REPOSITORY}/contents/${encodePath(path)}?ref=${encodeURIComponent(BRANCH)}`);}catch(error){if(error.status===404)return null;throw error;}}
export default async function handler(req,res){
  cors(res);
  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method==="GET") {
    let modelContextAccess=null;
    let publishHistory={lastAutomaticPublishAt:null,lastAutomaticBatchId:null,lastManualPublishAt:null,lastManualBatchId:null};
    try {
      const marker=await getExisting(MODEL_CONTEXT_PATH);
      if(marker && marker.content) modelContextAccess=JSON.parse(Buffer.from(marker.content.replace(/\n/g,""),"base64").toString("utf8"));
    } catch(_) {}
    try {
      const health=await getExisting("observations/health/github-build.json");
      if(health && health.content){
        const parsed=JSON.parse(Buffer.from(health.content.replace(/\n/g,""),"base64").toString("utf8"));
        publishHistory={lastAutomaticPublishAt:parsed.lastAutomaticPublishAt||null,lastAutomaticBatchId:parsed.lastAutomaticBatchId||null,lastManualPublishAt:parsed.lastManualPublishAt||null,lastManualBatchId:parsed.lastManualBatchId||null};
      }
    } catch(_) {}
    return res.status(200).json({ok:true,service:"signal-interpreter-observability-relay",repository:REPOSITORY,branch:BRANCH,mode:"vercel-to-github",publishHistory,modelContextAccess:modelContextAccess});
  }
  if(req.method!=="POST") return res.status(405).json({ok:false,error:"Method not allowed"});
  if(!process.env.GITHUB_TOKEN) return res.status(503).json({ok:false,error:"Relay not configured"});
  try{
    const batch=validateBatch(await readBody(req));
    const remotePath=`observations/inbox/${batch.batchId}.json`;
    const existing=await getExisting(remotePath);
    if(existing) return res.status(200).json({accepted:true,duplicate:true,batchId:batch.batchId,remotePath,contentSha:existing.sha||null});
    const payload={message:`diagnostic: enqueue observation batch ${batch.batchId}`,content:Buffer.from(batch.serialized+"\n","utf8").toString("base64"),branch:BRANCH};
    let created;
    try{created=await githubRequest(`/repos/${REPOSITORY}/contents/${encodePath(remotePath)}`,{method:"PUT",body:JSON.stringify(payload)});}catch(error){if(error.status===409){const raced=await getExisting(remotePath);if(raced)return res.status(200).json({accepted:true,duplicate:true,batchId:batch.batchId,remotePath,contentSha:raced.sha||null});}throw error;}
    return res.status(200).json({accepted:true,duplicate:false,batchId:batch.batchId,remotePath,contentSha:created&&created.content&&created.content.sha||null,commitSha:created&&created.commit&&created.commit.sha||null});
  }catch(error){const status=Number(error&&error.status)||500;return res.status(status>=400&&status<600?status:500).json({ok:false,error:String(error&&error.message||error)});}
}
