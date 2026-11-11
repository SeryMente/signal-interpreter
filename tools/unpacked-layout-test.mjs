import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=JSON.parse(fs.readFileSync("manifest.json","utf8"));
const nested=JSON.parse(fs.readFileSync("extension/manifest.json","utf8"));
function normalize(value){
  if(Array.isArray(value))return value.map(normalize);
  if(value&&typeof value==="object"){const out={};for(const [key,item] of Object.entries(value))out[key]=normalize(item);return out;}
  return typeof value==="string"&&value.startsWith("extension/")?value.slice("extension/".length):value;
}
assert.deepEqual(nested,normalize(root),"extension/manifest.json must be the path-normalized derivative of the canonical root manifest");
const refs=[nested.background&&nested.background.service_worker,nested.action&&nested.action.default_popup,...(nested.content_scripts||[]).flatMap(x=>x.js||[]),...Object.values(nested.icons||{}),...Object.values((nested.action||{}).default_icon||{})].filter(Boolean);
for(const ref of refs){assert(!ref.startsWith("/")&&!ref.split(/[\\/]/).includes(".."),"manifest path must remain relative");assert(fs.existsSync(path.join("extension",ref)), "missing unpacked payload: "+ref);}
const popup=fs.readFileSync("extension/ui/popup.js","utf8");
assert(popup.includes("function extensionPageUrl(path)"),"popup extension-page URLs must support both root and nested manifest layouts");
console.log(JSON.stringify({suite:"unpacked-layout",filesChecked:refs.length,version:nested.version,result:"PASS"}));
