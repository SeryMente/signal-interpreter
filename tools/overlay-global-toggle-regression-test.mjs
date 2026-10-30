import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const hash=(b)=>createHash("sha256").update(b).digest("hex").toUpperCase();
const manifest=JSON.parse(read("manifest.json")),inventory=JSON.parse(read("payload-sha256.json"));
assert.equal(manifest.version,"0.10.38");assert.equal(inventory.schema,"signal-interpreter-payload-sha256/v1");
assert.ok(Array.isArray(inventory.files)&&inventory.files.length>=50);
const seen=new Set();for(const e of inventory.files){assert.ok(e&&typeof e.path==="string"&&/^[A-Fa-f0-9]{64}$/.test(e.sha256));assert.ok(!path.isAbsolute(e.path)&&!e.path.split(/[\\/]/).includes(".."));assert.ok(!seen.has(e.path));seen.add(e.path);assert.equal(hash(fs.readFileSync(path.join(root,e.path))),e.sha256.toUpperCase(),"hash mismatch "+e.path);}
assert.equal(manifest.commands["toggle-global-overlays"].suggested_key.default,"Ctrl+Shift+8");
const ps=read("INSTALAR.ps1");assert.ok(ps.includes("$inventory.files")&&ps.includes("signal-interpreter-payload-sha256/v1")&&ps.includes("0.10.38"));
const bg=read("extension/background.js");assert.ok(bg.includes('command === "toggle-global-overlays"')&&bg.includes("config.overlaysGlobalEnabled = config.overlaysGlobalEnabled === false"));
const html=read("extension/ui/popup.html"),popup=read("extension/ui/popup.js");assert.ok(html.includes('id="overlaysGlobalEnabled"')&&html.includes('id="overlayShortcutStatus"')&&popup.includes("save({ overlaysGlobalEnabled: this.checked })"));
const earn=read("extension/content.js"),cap=read("extension/live-caption-overlay.js");assert.ok(earn.includes("function earningsOverlayEnabled()")&&earn.includes("dispose: deactivateForHotload")&&earn.includes("removeDuplicateEarningsOverlayHosts"));assert.ok(cap.includes("function overlayPreferenceEnabled()")&&cap.includes("previousOverlayRuntime.dispose"));
console.log("PASS: "+inventory.files.length+" payload hashes, manifest "+manifest.version+", installer schema, global toggle and runtime cleanup.");
