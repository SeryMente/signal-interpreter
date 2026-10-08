const REPOSITORY = "SeryMente/signal-interpreter";
const BRANCH = "main";
const API_VERSION = "2022-11-28";
const MAX_BODY_BYTES = 1300000;
const MAX_BASE64_BYTES = 1050000;

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}
function githubHeaders() {
  return { Accept:"application/vnd.github+json", Authorization:"Bearer "+(process.env.GITHUB_TOKEN||""), "Content-Type":"application/json", "X-GitHub-Api-Version":API_VERSION, "User-Agent":"signal-interpreter-observability-relay" };
}
function encodePath(path) { return path.split("/").map(encodeURIComponent).join("/"); }
async function githubRequest(path, init={}) {
  const response=await fetch("https://api.github.com"+path,{...init,headers:{...githubHeaders(),...(init.headers||{})}});
  const text=await response.text(); let data=null; try{data=text?JSON.parse(text):null;}catch(_){data=text;}
  if(!response.ok){const error=new Error("GitHub HTTP "+response.status);error.status=response.status;error.data=data;throw error;}
  return data;
}
async function getExisting(path){
  try{return await githubRequest("/repos/"+REPOSITORY+"/contents/"+encodePath(path)+"?ref="+encodeURIComponent(BRANCH));}
  catch(error){if(error.status===404)return null;throw error;}
}
function safeRoute(value){
  const route=String(value||"/").replace(/^\/call\/[^/?#]+/,"/call/<ID>").replace(/^\/profile\/[^/?#]+/,"/profile/<ID>");
  return route||"/";
}
function routeToken(route){
  return safeRoute(route).replace(/^\/+/,"").replace(/[^A-Za-z0-9._-]+/g,"_").replace(/^_+|_+$/g,"")||"root";
}
function validateScreenshot(screenshot){
  if(!screenshot||typeof screenshot!=="object")throw Object.assign(new Error("Screenshot must be an object"),{status:400});
  if(screenshot.schema!=="signal-interpreter-platform-screenshot/v1")throw Object.assign(new Error("Unsupported screenshot schema"),{status:400});
  const origin=String(screenshot.origin||"");
  if(origin!=="https://app.cloudinterpreter.com")throw Object.assign(new Error("Screenshot origin rejected"),{status:403});
  const hash=String(screenshot.sha256||"").toLowerCase();
  if(!/^[a-f0-9]{64}$/.test(hash))throw Object.assign(new Error("Invalid screenshot hash"),{status:400});
  const capturedAt=String(screenshot.capturedAt||"");
  if(!Number.isFinite(Date.parse(capturedAt)))throw Object.assign(new Error("Invalid capturedAt"),{status:400});
  const mime=String(screenshot.mimeType||"");
  if(mime!=="image/jpeg")throw Object.assign(new Error("Only JPEG screenshots are accepted"),{status:415});
  const base64=String(screenshot.base64||"").replace(/\s+/g,"");
  if(!base64||base64.length>MAX_BASE64_BYTES)throw Object.assign(new Error("Screenshot payload too large"),{status:413});
  const decodedBytes=Math.floor(base64.length*3/4)-(base64.endsWith("==")?2:base64.endsWith("=")?1:0);
  if(decodedBytes<1||decodedBytes>MAX_BODY_BYTES)throw Object.assign(new Error("Screenshot binary exceeds size limit"),{status:413});
  return {origin,hash,capturedAt,mime,base64,route:safeRoute(screenshot.route),reason:String(screenshot.reason||"scheduled").slice(0,120),extensionVersion:String(screenshot.extensionVersion||"unknown").slice(0,40),tabId:Number.isFinite(Number(screenshot.tabId))?Number(screenshot.tabId):null,windowId:Number.isFinite(Number(screenshot.windowId))?Number(screenshot.windowId):null};
}
export default async function handler(req,res){
  cors(res);
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({ok:false,error:"Method not allowed"});
  if(!process.env.GITHUB_TOKEN)return res.status(503).json({ok:false,error:"Relay not configured"});
  try{
    const shot=validateScreenshot(await new Promise((resolve,reject)=>{
      if(req.body&&typeof req.body==="object")return resolve(req.body);
      let total=0;const chunks=[];
      req.on("data",chunk=>{total+=Buffer.byteLength(chunk);if(total>MAX_BODY_BYTES+120000){reject(Object.assign(new Error("Payload too large"),{status:413}));req.destroy();return;}chunks.push(chunk);});
      req.on("end",()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));}catch(_){reject(Object.assign(new Error("Invalid JSON"),{status:400}));}});
      req.on("error",reject);
    }));
    const day=shot.capturedAt.slice(0,10);
    const remotePath="observations/platform-screenshots/"+day+"/"+routeToken(shot.route)+"--"+shot.hash+".jpg";
    const existing=await getExisting(remotePath);
    if(existing)return res.status(200).json({accepted:true,duplicate:true,sha256:shot.hash,remotePath,contentSha:existing.sha||null});
    const payload={message:"diagnostic: store platform screenshot "+shot.hash,content:shot.base64,branch:BRANCH};
    let created;
    try{created=await githubRequest("/repos/"+REPOSITORY+"/contents/"+encodePath(remotePath),{method:"PUT",body:JSON.stringify(payload)});}
    catch(error){
      if(error.status===409){const raced=await getExisting(remotePath);if(raced)return res.status(200).json({accepted:true,duplicate:true,sha256:shot.hash,remotePath,contentSha:raced.sha||null});}
      throw error;
    }
    return res.status(200).json({accepted:true,duplicate:false,sha256:shot.hash,remotePath,contentSha:created&&created.content&&created.content.sha||null,commitSha:created&&created.commit&&created.commit.sha||null,route:shot.route,capturedAt:shot.capturedAt,reason:shot.reason});
  }catch(error){
    const status=Number(error&&error.status)||500;
    return res.status(status>=400&&status<600?status:500).json({ok:false,error:String(error&&error.message||error)});
  }
}
