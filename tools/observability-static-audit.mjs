import fs from "node:fs";
import assert from "node:assert/strict";

const read=p=>fs.readFileSync(p,"utf8");
const manifest=JSON.parse(read("extension/manifest.json"));
const background=read("extension/background.js");
const content=read("extension/content.js");
const popup=read("extension/ui/popup.js");
const host=read("tools/observability-native-host/SignalInterpreterObservabilityHost.cs");

assert.equal(manifest.version,"0.9.13");
assert.ok(manifest.permissions.includes("nativeMessaging"));
assert.ok(manifest.permissions.includes("scripting"));
assert.deepEqual(manifest.content_scripts[0].matches,["https://app.cloudinterpreter.com/*"]);
assert.ok(popup.includes("getEventsAfter"));
assert.ok(popup.includes("sendNativeMessage"));
assert.ok(content.includes("extractPortalStructure"));
assert.ok(content.includes("PORTAL_STRUCTURE_SNAPSHOT"));
assert.ok(background.includes("NETWORK_ACTIVITY_WINDOW"));
assert.ok(background.includes("readOfficialStatsViaTrpc"));
assert.ok(background.includes("/api/trpc/logFetcher.fetchInterpreterLogs"));
assert.ok(background.includes('world:"MAIN"'));
const syncStart=background.indexOf("async function syncOfficialPlatformData");
const syncEnd=background.indexOf("function updateGroqUsage",syncStart);
assert.ok(syncStart>0 && syncEnd>syncStart);
const syncBlock=background.slice(syncStart,syncEnd);
assert.ok(syncBlock.includes("no-tab-create-no-navigation-no-reload"));
assert.equal(syncBlock.includes("tabs.create"),false);
assert.equal(syncBlock.includes("tabs.update"),false);
assert.equal(syncBlock.includes("tabs.reload"),false);
assert.equal(syncBlock.includes("window.open"),false);
assert.equal(background.includes("readOfficialStatsInBackgroundTab"),false);
assert.equal(background.includes("chrome.tabs.create({url:OFFICIAL_STATS_URL"),false);
assert.equal(background.includes("chrome.tabs.reload("),false);
assert.equal(background.includes("fetch(OFFICIAL_STATS_URL"),false);
assert.ok(host.includes('Repo = "SeryMente/signal-interpreter"'));
assert.ok(host.includes('Path = "diagnostics/latest.json"'));
const csproj=read("tools/observability-native-host/SignalInterpreterObservabilityHost.csproj");
const installer=read("tools/install-observability-host.ps1");
assert.ok(csproj.includes("<SelfContained>true</SelfContained>"));
assert.ok(installer.includes("IncludeNativeLibrariesForSelfExtract=true"));
assert.ok(host.includes('DiagnosticsBranch = "observability"'));

const forbidden=["CaptionBubbleLabel","AXVirtualView","SpeechRecognition","SignalLiveCaptionBridge","127.0.0.1:8787"];
for(const value of [background,content,popup]){
  for(const term of forbidden) assert.equal(value.includes(term),false,"Legacy runtime reference: "+term);
}
console.log("OBSERVABILITY_STATIC_AUDIT=PASS");
