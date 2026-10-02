import fs from "node:fs";
import assert from "node:assert/strict";

const read=p=>fs.readFileSync(p,"utf8");
const manifest=JSON.parse(read("extension/manifest.json"));
const background=read("extension/background.js");
const content=read("extension/content.js");
const popup=read("extension/ui/popup.js");
const host=read("tools/observability-native-host/SignalInterpreterObservabilityHost.cs");

assert.equal(manifest.version,"0.9.12");
assert.ok(manifest.permissions.includes("nativeMessaging"));
assert.deepEqual(manifest.content_scripts[0].matches,["https://app.cloudinterpreter.com/*"]);
assert.ok(popup.includes("getEventsAfter"));
assert.ok(popup.includes("sendNativeMessage"));
assert.ok(content.includes("extractPortalStructure"));
assert.ok(content.includes("PORTAL_STRUCTURE_SNAPSHOT"));
assert.ok(background.includes("NETWORK_ACTIVITY_WINDOW"));
assert.ok(host.includes('Repo = "SeryMente/signal-interpreter"'));
assert.ok(host.includes('Path = "diagnostics/latest.json"'));
assert.ok(host.includes('DiagnosticsBranch = "observability"'));

const forbidden=["CaptionBubbleLabel","AXVirtualView","SpeechRecognition","SignalLiveCaptionBridge","127.0.0.1:8787"];
for(const value of [background,content,popup]){
  for(const term of forbidden) assert.equal(value.includes(term),false,"Legacy runtime reference: "+term);
}
console.log("OBSERVABILITY_STATIC_AUDIT=PASS");
