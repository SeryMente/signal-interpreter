import fs from "node:fs";import assert from "node:assert/strict";
const html=fs.readFileSync("extension/ui/lab.html","utf8"),ui=fs.readFileSync("extension/ui/lab.js","utf8"),install=fs.readFileSync("INSTALAR.ps1","utf8"),m=JSON.parse(fs.readFileSync("manifest.json","utf8"));
for(const id of ["audioState","installation","received","visible","nextAction","resultCard","captionSettings"])assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(ui.includes("running||busy||!audioReady"));assert.ok(ui.includes("r.extensionVersion===chrome.runtime.getManifest().version"));assert.ok(ui.includes('type:"SIGNAL_LAB_PREFLIGHT"'));assert.ok(ui.includes('player.onended=()=>end("media-ended")'));assert.ok(ui.includes("descarga solicitada"));assert.ok(m.content_security_policy.extension_pages.includes("connect-src 'self'"));
for(const text of ["Step '1'","Step '2'","Step '3'","Step '4'","Ready=$false","ChromeLoaded='NO_VERIFICADO'","Set-Clipboard -Value $root","$rollbackState='RESTORED'"])assert.ok(install.includes(text),text);
assert.equal(fs.readFileSync("INSTALAR.ps1").subarray(0,3).toString("hex"),"efbbbf");console.log("INSTALLER_LAB_ACTIONABLE_NO_FALSE_SUCCESS=PASS");
