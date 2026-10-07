import crypto from "node:crypto";

export const PLATFORM_CHANGE_LIMIT=80;

export function sha256(value){
  return crypto.createHash("sha256").update(typeof value==="string"?value:JSON.stringify(value)).digest("hex");
}

export function fileToken(value){
  return String(value||"unknown").replace(/[^a-zA-Z0-9._-]+/g,"_").slice(0,120)||"unknown";
}

function jsonEqual(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function arrayMap(values,keyFn){
  const out=new Map();
  for(const value of Array.isArray(values)?values:[]){
    const key=keyFn(value);
    if(!out.has(key))out.set(key,value);
  }
  return out;
}
function compareObject(previous,current,path,changes){
  const before=previous&&typeof previous==="object"?previous:{},after=current&&typeof current==="object"?current:{};
  const keys=new Set([...Object.keys(before),...Object.keys(after)]);
  for(const key of Array.from(keys).sort()){
    if(changes.length>=PLATFORM_CHANGE_LIMIT)return;
    const a=before[key],b=after[key];
    if(a===undefined&&b!==undefined)changes.push({kind:"added",path:path+"."+key,value:b});
    else if(a!==undefined&&b===undefined)changes.push({kind:"removed",path:path+"."+key,value:a});
    else if(!jsonEqual(a,b))changes.push({kind:"changed",path:path+"."+key,before:a,after:b});
  }
}
function compareArray(previous,current,path,keyFn,changes){
  const a=arrayMap(previous,keyFn),b=arrayMap(current,keyFn),keys=new Set([...a.keys(),...b.keys()]);
  for(const key of Array.from(keys).sort()){
    if(changes.length>=PLATFORM_CHANGE_LIMIT)return;
    if(!a.has(key))changes.push({kind:"added",path:path+"["+key+"]",value:b.get(key)});
    else if(!b.has(key))changes.push({kind:"removed",path:path+"["+key+"]",value:a.get(key)});
    else if(!jsonEqual(a.get(key),b.get(key)))changes.push({kind:"changed",path:path+"["+key+"]",before:a.get(key),after:b.get(key)});
  }
}

export function semanticPlatformDelta(previous,current){
  if(!previous)return{
    schema:"signal-interpreter-platform-delta/v1",type:"initial",
    identityKey:current.identityKey,fromSnapshotId:null,toSnapshotId:current.snapshotId,
    fromHash:null,toHash:current.snapshotHash,capturedAt:current.capturedAt,
    summary:{added:7,removed:0,changed:0,sections:["page","controls","dom","css","javascript","resources","frameworkHints"]},
    changes:[
      {kind:"initial",path:"page",value:current.surface.page},
      {kind:"initial",path:"controls",value:current.surface.controls},
      {kind:"initial",path:"dom",value:current.surface.dom},
      {kind:"initial",path:"css",value:current.surface.css},
      {kind:"initial",path:"javascript",value:current.surface.javascript},
      {kind:"initial",path:"resources",value:current.surface.resources},
      {kind:"initial",path:"frameworkHints",value:current.surface.frameworkHints}
    ]
  };
  const changes=[],p=previous.surface||{},c=current.surface||{};
  compareObject(p.page,c.page,"page",changes);
  compareObject(p.dom&&p.dom.tagCounts,c.dom&&c.dom.tagCounts,"dom.tagCounts",changes);
  compareArray(p.dom&&p.dom.elements,c.dom&&c.dom.elements,"dom.elements",x=>String(x.selector||"")+"|"+String(x.tag||""),changes);
  compareArray(p.controls&&p.controls.buttons,c.controls&&c.controls.buttons,"controls.buttons",x=>String(x.tag||"")+"|"+String(x.role||"")+"|"+String(x.label||""),changes);
  compareArray(p.controls&&p.controls.links,c.controls&&c.controls.links,"controls.links",x=>String(x.path||"")+"|"+String(x.label||""),changes);
  compareArray(p.controls&&p.controls.fields,c.controls&&c.controls.fields,"controls.fields",x=>JSON.stringify(x),changes);
  compareArray(p.css&&p.css.stylesheets,c.css&&c.css.stylesheets,"css.stylesheets",x=>String(x.href||"")+"|"+String(x.media||""),changes);
  compareArray(p.css&&p.css.inlineStyles,c.css&&c.css.inlineStyles,"css.inlineStyles",x=>String(x.index||0)+"|"+String(x.media||"")+"|"+String(x.inlineFingerprint||""),changes);
  compareArray(p.javascript&&p.javascript.scripts,c.javascript&&c.javascript.scripts,"javascript.scripts",x=>String(x.src||"")+"|"+String(x.type||"")+"|"+String(x.inlineLength||0)+"|"+String(x.inlineFingerprint||""),changes);
  compareArray(p.resources&&p.resources.recent,c.resources&&c.resources.recent,"resources.recent",x=>String(x.url||"")+"|"+String(x.initiatorType||""),changes);
  compareArray(p.frameworkHints,c.frameworkHints,"frameworkHints",x=>String(x),changes);
  compareArray(p.metadata,c.metadata,"metadata",x=>String(x.name||"")+"|"+String(x.contentLength||0),changes);
  const sections=Array.from(new Set(changes.map(x=>String(x.path||"").split(".")[0])));
  const summary={added:changes.filter(x=>x.kind==="added"||x.kind==="initial").length,removed:changes.filter(x=>x.kind==="removed").length,changed:changes.filter(x=>x.kind==="changed").length,sections};
  return{
    schema:"signal-interpreter-platform-delta/v1",
    type:changes.length?"changed":"unchanged",
    identityKey:current.identityKey,
    fromSnapshotId:previous.snapshotId,toSnapshotId:current.snapshotId,
    fromHash:previous.snapshotHash,toHash:current.snapshotHash,capturedAt:current.capturedAt,
    summary,changes:changes.slice(0,PLATFORM_CHANGE_LIMIT),
    truncated:changes.length>=PLATFORM_CHANGE_LIMIT
  };
}
