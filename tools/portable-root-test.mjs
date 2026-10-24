import fs from "node:fs";import assert from "node:assert/strict";import crypto from "node:crypto";
const m=JSON.parse(fs.readFileSync("manifest.json","utf8"));assert.equal(m.version,"0.10.36");assert.equal(fs.existsSync("extension/manifest.json"),false);assert.equal(m.background.service_worker,"extension/background.js");
assert.equal(m.action.default_popup,undefined,"The toolbar action must open the dedicated tab, not a popup");
const paths=[m.background.service_worker,...Object.values(m.icons),...Object.values(m.action.default_icon),...m.content_scripts.flatMap(x=>x.js)].filter(Boolean);for(const p of paths){assert.ok(fs.existsSync(p),p);assert.equal(p.includes(".."),false);}
const actionHandler=fs.readFileSync("extension/background.js","utf8");assert.ok(actionHandler.includes("chrome.action.onClicked.addListener"),"Toolbar click must open the observability workspace");assert.ok(actionHandler.includes("extension/ui/observability.html"),"Toolbar click target must be the observability workspace");
const d=crypto.createHash("sha256").update(Buffer.from(m.key,"base64")).digest().subarray(0,16);let id="";for(const b of d)id+=String.fromCharCode(97+(b>>4),97+(b&15));assert.equal(id,"ldpbjhobnfgmhdoehehdmnbhhjckebmj");
for(const p of ["INSTALAR.cmd","INSTALAR.ps1","PROBAR.cmd","PROBAR.ps1","extension/ui/lab.html"])assert.ok(fs.existsSync(p));
const bg=fs.readFileSync("extension/background.js","utf8");assert.ok(bg.includes("spec.files.map(extensionResource)"));assert.ok(bg.includes('chrome.runtime.getURL(extensionResource("offscreen.html"))'));
const installer=fs.readFileSync("INSTALAR.ps1","utf8");for(const bad of ["Invoke-WebRequest","npm ","Start-Service","RunAs","Stop-Process","chrome --load-extension"])assert.equal(installer.includes(bad),false);
const entries=JSON.parse(fs.readFileSync("payload-sha256.json","utf8"));for(const e of entries)assert.equal(crypto.createHash("sha256").update(fs.readFileSync(e.path)).digest("hex").toUpperCase(),e.sha256,e.path);
console.log("PORTABLE_ROOT_LAYOUT_AND_PAYLOAD=PASS");

assert.ok(fs.readFileSync(".gitattributes","utf8").split(/\r?\n/).includes("* -text"),"Windows archives must preserve hashed bytes");
