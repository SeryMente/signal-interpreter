import fs from "node:fs";
import assert from "node:assert/strict";

const read=(p)=>fs.readFileSync(p,"utf8");
const exists=(p)=>fs.existsSync(p);
const manifest=JSON.parse(read("extension/manifest.json"));
const background=read("extension/background.js");
const offscreen=read("extension/offscreen.js");
const content=read("extension/content.js");
const popup=read("extension/ui/popup.js");
const observationSync=read("extension/observation-sync.js");
const relay=read("extension/observability-relay.js");
const workflow=read(".github/workflows/observability-build.yml");
const packageAudit=read("tools/observability-package-audit.mjs");
const packageAuditTest=read("tools/observability-package-audit-test.mjs");
const cycleDelta=read("tools/observability-cycle-delta.mjs");
const cycleDeltaTest=read("tools/observability-cycle-delta-test.mjs");
const githubPipeline=read("tools/observability-github-pipeline.mjs");
const githubPipelineTest=read("tools/observability-github-pipeline-test.mjs");
const platformLearning=read("tools/observability/platform-learning.mjs");
const platformLearningTest=read("tools/observability/platform-learning-test.mjs");

assert.equal(manifest.version,"0.10.7");
assert.equal(manifest.permissions.includes("nativeMessaging"),false);
assert.ok(manifest.permissions.includes("storage"));
assert.ok(manifest.permissions.includes("alarms"));
assert.ok(manifest.permissions.includes("unlimitedStorage"));
assert.ok(manifest.permissions.includes("scripting"));
assert.ok(manifest.host_permissions.includes("https://app.cloudinterpreter.com/*"));
assert.ok(manifest.host_permissions.includes("https://signal-interpreter-observability-re.vercel.app/*"));
assert.match(manifest.content_security_policy.extension_pages,/https:\/\/signal-interpreter-observability-re\.vercel\.app/);

assert.ok(background.includes('importScripts("dialogue-engine.js","telemetry-db.js","observability-relay.js","observation-sync.js","groq-transcriber.js")'));
assert.ok(background.includes('alarm.name==="signal-observation-sync"'));
assert.ok(background.includes('alarm.name==="signal-observation-sync-retry"'));
assert.ok(background.includes('SignalObservationSync.flush("startup"'));
assert.ok(background.includes('SignalObservationSync.flush("alarm"'));
assert.ok(content.includes("PLATFORM_INTEGRITY_CHECK"));
assert.ok(background.includes("readOfficialStatsViaTrpc"));
assert.ok(background.includes("no-tab-create-no-navigation-no-reload"));

assert.ok(content.includes("PLATFORM_SURFACE_SNAPSHOT"));
assert.ok(content.includes("PLATFORM_URL_CHANGED"));
assert.ok(content.includes("extractPortalStructure"));
assert.ok(content.includes("stylesheetSurface"));
assert.ok(content.includes("scriptSurface"));
assert.ok(content.includes("resourceSurface"));
assert.ok(content.includes("textFingerprint"));
assert.ok(content.includes("computedStyleSurface"));
assert.ok(content.includes("inlineFingerprint"));
assert.ok(content.includes("safePlatformUrl"));
assert.ok(content.includes("normalizePlatformPath"));
assert.ok(content.includes("CALL_END_CONTROL_INTERACTION"));
assert.ok(content.includes("EFFECTIF_REFRESH_OVERLAY"));
assert.ok(content.includes("requestOverlayEarnings(\"today\")"));
assert.ok(content.includes("requestOverlayEarnings(\"currentMonth\")"));
assert.ok(content.includes("requestOverlayChart(\"currentMonth\")"));
assert.ok(content.includes("installNavigationObservers"));
assert.ok(background.includes("checkpointCallObservability(\"call-answered\""));
assert.ok(background.includes("checkpointCallObservability(\"call-ended\""));
assert.ok(background.includes("SignalObservationSync.flush(checkpoint)"));
assert.ok(background.includes("CALL_ANSWERED_OVERLAY_REFRESH_REQUESTED"));
assert.ok(background.includes("event.action === \"CALL_ROUTE_ENTERED\" || event.action === \"ANSWER_FLOW_ROUTE_CONFIRMED\""));
assert.ok(background.includes("async function hotloadExistingCloudTabs"));
assert.ok(background.includes("chrome.tabs.query({ url: [AUTHORIZED_ORIGIN + \"/*\"]"));
assert.ok(background.includes("EFFECTIF_HOTLOAD_REPLACE"));
assert.ok(background.includes("window.__SIGNAL_INTERPRETER_CLOUD_RUNTIME__ = null"));
assert.ok(background.includes("HOTLOAD_EXISTING_TAB_REHYDRATED"));
assert.ok(background.includes("HOTLOAD_EXISTING_TABS_SCAN_COMPLETED"));
assert.ok(background.includes("attempt <= 3"));
assert.ok(background.includes("hotloadExistingCloudTabs(\"runtime-start\")"));
assert.ok(background.includes("hotloadExistingCloudTabs(\"onInstalled\")"));
assert.ok(background.includes("hotloadExistingCloudTabs(\"onStartup\")"));
assert.ok(content.includes("function deactivateForHotload"));
assert.ok(content.includes("EFFECTIF_HOTLOAD_REPLACE"));

assert.ok(observationSync.includes("SignalObservabilityRelay.uploadBatch"));
assert.ok(observationSync.includes("signal-observation-sync-retry"));
assert.ok(observationSync.includes("EVENT_THRESHOLD"));
assert.ok(observationSync.includes("checkpointReason"));
assert.ok(observationSync.includes("reason === \"call-answered\" || reason === \"call-ended\""));
assert.ok(observationSync.includes("safeEventUrl"));
assert.equal(/127\.0\.0\.1:\d+/.test(observationSync),false);
assert.equal(observationSync.includes("sendNativeMessage"),false);
assert.ok(observationSync.includes("lastRelayAcceptedAt"));

assert.ok(relay.includes("https://signal-interpreter-observability-re.vercel.app"));
assert.ok(relay.includes("uploadBatch"));
assert.ok(relay.includes("getStatus"));
assert.ok(relay.includes("publishHistory"));
assert.ok(relay.includes("modelContextAccess"));
assert.equal(/client_secret|device.?flow|githubApp/i.test(relay),false);
assert.equal(/127\.0\.0\.1/.test(relay),false);

assert.equal(popup.includes("sendNativeMessage"),false);
assert.equal(popup.includes("native messaging"),false);
assert.ok(popup.includes("SignalObservabilityRelay"));
assert.equal(popup.includes("githubClientId"),false);
assert.equal(popup.includes("githubConnect"),false);
assert.ok(popup.includes("Publicando observabilidad pendiente"));
assert.ok(popup.includes("lastAutomaticPublish"));
assert.ok(popup.includes("lastManualPublish"));
assert.ok(popup.includes("lastModelContextAccess"));

assert.ok(workflow.includes("observations/inbox/**"));
assert.ok(background.includes("SIGNAL_EXTENSION_MICROPHONE_TOGGLE"));
assert.ok(background.includes("setExtensionMicrophoneMuted"));
assert.ok(background.includes("toggleExtensionMicrophoneMuted"));
assert.ok(background.includes("toggle-extension-microphone"));
assert.ok(background.includes("EXTENSION_MICROPHONE_MUTE_APPLIED"));
assert.ok(background.includes("EXTENSION_MICROPHONE_MUTE_ERROR"));
assert.ok(background.includes("EXTENSION_MICROPHONE_AUDIO_CHUNK_SUPPRESSED_MUTED"));
assert.ok(background.includes("microphoneMuted:!!state.microphoneMuted"));
assert.ok(offscreen.includes('message.type==="SIGNAL_SET_MICROPHONE_MUTED"') || offscreen.includes('message.type === "SIGNAL_SET_MICROPHONE_MUTED"'));
assert.ok(content.includes("id=\"mic\""));
assert.ok(content.includes("SIGNAL_EXTENSION_MICROPHONE_TOGGLE"));
assert.ok(content.includes("state.microphoneMuted"));
assert.ok(offscreen.includes("track.enabled=!desired"));
assert.ok(offscreen.includes("verified:verified"));
assert.ok(background.includes("microphoneMuteQueue"));
assert.ok(background.includes("setExtensionMicrophoneMutedInternal"));
assert.ok(background.includes("EXTENSION_MICROPHONE_MUTE_QUEUE_ERROR"));
assert.ok(content.includes("MIC ERR"));
assert.ok(content.includes("state.groqCapture.microphoneMuted"));
assert.ok(offscreen.includes("SIGNAL_SET_MICROPHONE_MUTED"));
assert.equal(workflow.includes("workflow_run"),false);
assert.ok(workflow.includes("concurrency:\n  group: signal-observability-build-main"));
assert.ok(workflow.includes("node tools/observability-github-pipeline.mjs"));
assert.ok(workflow.includes("node tools/observability-package-audit.mjs observations"));
assert.ok(workflow.includes("node tools/observability-cycle-delta-test.mjs"));
assert.ok(workflow.includes("node tools/observability-github-pipeline-test.mjs"));
assert.ok(workflow.includes("git push origin HEAD:main"));
assert.equal(workflow.includes("setup-dotnet"),false);
assert.equal(workflow.includes("shell: pwsh"),false);

assert.ok(packageAudit.includes("signal-interpreter-observability-package/v1"));
assert.ok(packageAuditTest.includes("OBSERVABILITY_PACKAGE_AUDIT_TEST"));
assert.ok(cycleDelta.includes("signal-interpreter-cycle-delta/v1"));
assert.ok(cycleDeltaTest.includes("OBSERVABILITY_CYCLE_DELTA_TEST"));
assert.ok(githubPipeline.includes("buildObservabilityPackage"));
assert.ok(githubPipeline.includes("const inbox=path.join(obs,\"inbox\")"));
assert.ok(githubPipeline.includes("semanticPlatformDelta"));
assert.ok(githubPipeline.includes("observability-build-health/v1"));
assert.ok(githubPipeline.includes("derivePublishHistory"));
assert.ok(githubPipeline.includes("updatePublishHistory"));
assert.ok(githubPipelineTest.includes("OBSERVABILITY_GITHUB_PIPELINE_TEST"));
assert.ok(platformLearning.includes("semanticPlatformDelta"));
assert.ok(platformLearningTest.includes("PLATFORM_LEARNING_TEST=PASS"));

for(const forbidden of [
  "tools/observation-reporter/server.mjs",
  "tools/observation-reporter/install-autostart.ps1",
  "tools/observation-reporter/watchdog.ps1",
  "tools/observation-reporter/run-supervised.ps1",
  "tools/observability-native-host/SignalInterpreterObservabilityHost.cs",
  "tools/observability-native-host/SignalInterpreterObservabilityHost.csproj",
  "tools/install-observability-host.ps1"
]){
  assert.equal(exists(forbidden),false,"Windows/local observability artifact remains: "+forbidden);
}

for(const value of [background,content,popup,observationSync,relay]){
  assert.equal(value.includes("127.0.0.1:8788"),false,"Local observability endpoint remains.");
  assert.equal(value.includes("sendNativeMessage"),false,"Native messaging observability path remains.");
}

console.log("OBSERVABILITY_STATIC_AUDIT=PASS");
