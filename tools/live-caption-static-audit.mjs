import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const exists=(p)=>fs.existsSync(path.join(root,p));
const manifest=JSON.parse(read("extension/manifest.json"));
const background=read("extension/background.js");
const offscreen=read("extension/offscreen.js");
const groq=read("extension/groq-transcriber.js");
const overlay=read("extension/live-caption-overlay.js");
const core=read("extension/live-caption-core.js");
const bridge=read("extension/live-caption-bridge.js");
const hostManifest=JSON.parse(read("extension/native/com.signalinterpreter.captionhost.json"));
const register=read("extension/native/register-caption-host.ps1");
const hostSource=read("extension/native/SignalInterpreter.CaptionHost.cs");
const payload=read("extension/native/SignalInterpreter.CaptionHost.exe.b64").trim();
const obsSync=read("extension/observation-sync.js");
const relay=read("extension/observability-relay.js");

assert.equal(manifest.version,"0.10.22");
assert.ok(manifest.key && manifest.key.length > 300);
assert.ok(manifest.key);
assert.equal(manifest.permissions.includes("nativeMessaging"),true);
assert.ok(manifest.content_scripts.some((e)=>e.matches?.includes("https://app.cloudinterpreter.com/*")&&Array.isArray(e.js)&&e.js[0]==="live-caption-core.js"&&e.js[1]==="live-caption-overlay.js"&&e.js[2]==="content.js"));
assert.equal(manifest.commands["toggle-extension-microphone"].suggested_key.default,"Ctrl+Shift+Period");

assert.ok(background.includes('importScripts("live-caption-core.js","live-caption-bridge.js"'));
assert.ok(background.includes("SignalCaptionBridge.start(state.callSourceTabId, callId)"));
assert.ok(background.includes("SignalCaptionBridge.stop()"));
assert.ok(background.includes("SIGNAL_GROQ_CAPTION_PREVIEW_CHUNK"));
assert.ok(background.includes("handleGroqCaptionPreviewChunk"));
assert.ok(background.includes("SignalCaptionBridge.isFresh(4500)"));
assert.ok(background.includes("SIGNAL_CAPTION_UPDATE"));
assert.ok(background.includes("createLatestOnlyDispatcher"));
assert.ok(background.includes('SignalCaptionBridge.start(state.callSourceTabId, callId)'));
const recoveryStart=background.indexOf("async function recoverAfterRuntimeBoundary(trigger)");
const recoveryEnd=background.indexOf("\n  function uid()", recoveryStart);
assert.ok(recoveryStart>=0 && recoveryEnd>recoveryStart);
const recoveryBlock=background.slice(recoveryStart,recoveryEnd);
assert.ok(recoveryBlock.includes("SignalCaptionBridge.start(callTabId, state.callId)"));
assert.ok(recoveryBlock.includes("setCaptionPreviewForActiveCall(!SignalCaptionBridge.isFresh(4500), \"runtime-boundary-recovery\")"));
assert.ok(bridge.includes('message.type === "status" || message.type === "heartbeat"'));
assert.ok(bridge.includes("RECONNECT_DELAYS"));
assert.ok(bridge.includes('message.active !== true) lastCaptionAt = 0'));
const previewStart=background.indexOf("async function processGroqCaptionPreviewChunk(message)");
const previewEnd=background.indexOf("function handleGroqAudioChunk(message)",previewStart);
assert.ok(previewStart>=0&&previewEnd>previewStart);
const previewBlock=background.slice(previewStart,previewEnd);
assert.equal(previewBlock.includes("persistSignalSegment"),false);
assert.equal(previewBlock.includes("broadcastSignalEvent"),false);
assert.equal(previewBlock.includes("KhoraTelemetryDB"),false);

assert.ok(offscreen.includes("previewTabRecorder"));
assert.ok(offscreen.includes("previewMicRecorder"));
assert.ok(offscreen.includes("startCaptionPreview"));
assert.ok(offscreen.includes("recorder.start(2800)"));
assert.ok(offscreen.includes("SIGNAL_GROQ_CAPTION_PREVIEW_CHUNK"));
assert.ok(offscreen.includes("captionPreview===true"));
assert.ok(offscreen.includes('startCaptionPreview({tab:true,mic:false})'));
assert.ok(offscreen.includes("SIGNAL_GET_GROQ_CAPTURE_STATE"));

assert.ok(groq.includes("language=opts.language===null||opts.language===undefined?\"\":String(opts.language).trim()"));
assert.ok(groq.includes("if(language)form.append(\"language\",language);"));
assert.ok(groq.includes("language:String(data&&data.language||language||\"unknown\")"));

assert.ok(overlay.includes("pointer-events:none"));
assert.ok(overlay.includes("attachShadow({ mode: \"closed\" })"));
assert.ok(overlay.includes("interactiveRects"));
assert.ok(overlay.includes("core.choosePositionCandidate(candidates, rects, w, h)"));
assert.ok(overlay.includes("createRowNode"));
assert.ok(overlay.includes("EFFECTIF_SCREENSHOT_PREPARE"));
assert.ok(overlay.includes("EFFECTIF_SCREENSHOT_RESTORE"));
assert.ok(core.includes("captionRelation"));
assert.ok(core.includes("mergeCaptionText"));
assert.ok(core.includes("createLatestOnlyDispatcher"));
assert.ok(core.includes("choosePositionCandidate"));
assert.ok(overlay.includes("core.choosePositionCandidate(candidates, rects, w, h)"));
assert.ok(core.includes("CLIENTE"));
assert.ok(core.includes("LEP"));
assert.ok(core.includes("ENGLISH"));
assert.ok(core.includes("ESPAÑOL"));
assert.ok(core.includes("roleForLanguage"));
assert.ok(core.includes("detectLanguage"));

assert.ok(bridge.includes('connectNative(HOST_NAME)'));
assert.ok(bridge.includes('HOST_NAME = "com.signalinterpreter.captionhost"'));
assert.ok(bridge.includes('type: "SIGNAL_CAPTION_UPDATE"')||bridge.includes('"SIGNAL_CAPTION_UPDATE"'));

assert.equal(hostManifest.name,"com.signalinterpreter.captionhost");
assert.equal(hostManifest.type,"stdio");
assert.equal(hostManifest.path,"__SIGNAL_CAPTION_HOST_EXE__");
assert.ok(Array.isArray(hostManifest.allowed_origins));
assert.equal(hostManifest.allowed_origins.length,1);
assert.ok(hostManifest.allowed_origins[0].startsWith("chrome-extension://"));
assert.equal(hostManifest.allowed_origins[0],"chrome-extension://ldpbjhobnfgmhdoehehdmnbhhjckebmj/");
assert.ok(hostManifest.allowed_origins[0].endsWith("/"));
assert.ok(register.includes("FromBase64String"));
assert.ok(register.includes("672A66DA5CF60EC4FBD148D55B54131508EAE773CDA96DBB72760B3CD149AD00"));
const expectedHostSourceSha256 = "AF6BAC92319D9175AE2A040885D829558FD333683E65FD55A674E5F663EE7088";
assert.ok(register.includes('$ExpectedSourceSha256 = "' + expectedHostSourceSha256 + '"'));
assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(root,"extension/native/SignalInterpreter.CaptionHost.cs"))).digest("hex").toUpperCase(), expectedHostSourceSha256);
assert.ok(register.includes("HKCU:\\Software\\Google\\Chrome\\NativeMessagingHosts"));
assert.ok(register.includes("SignalInterpreter.CaptionHost.exe"));
assert.ok(hostSource.includes("System.Windows.Automation"));
assert.ok(hostSource.includes("signal-caption-native/v1"));
assert.ok(hostSource.includes("Live Caption"));

assert.ok(payload.length>18000);
const decoded=Buffer.from(payload,"base64");
assert.ok(decoded.length>10000);
assert.equal(decoded.subarray(0,2).toString("ascii"),"MZ");
assert.equal(crypto.createHash("sha256").update(decoded).digest("hex").toUpperCase(),"672A66DA5CF60EC4FBD148D55B54131508EAE773CDA96DBB72760B3CD149AD00");

assert.equal(exists("extension/native/main.go"),false);
assert.equal(exists("extension/native/SignalInterpreter.CaptionHost.ps1"),false);

for(const value of [obsSync,relay]){
  assert.equal(value.includes("connectNative("),false);
  assert.equal(value.includes("sendNativeMessage"),false);
}
assert.equal(/127\\.0\\.0\\.1:\\d+/.test(obsSync),false);
assert.equal(/localhost:\\d+/.test(obsSync),false);

console.log("LIVE_CAPTION_STATIC_AUDIT=PASS");