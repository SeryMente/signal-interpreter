import fs from "node:fs";
import assert from "node:assert/strict";

const read=(p)=>fs.readFileSync(p,"utf8");
const exists=(p)=>fs.existsSync(p);
const manifest=JSON.parse(read("extension/manifest.json"));
const background=read("extension/background.js");
const content=read("extension/content.js");
const popup=read("extension/ui/popup.js");
const observationSync=read("extension/observation-sync.js");
const github=read("extension/github-observability.js");
const workflow=read(".github/workflows/observability-build.yml");
const packageAudit=read("tools/observability-package-audit.mjs");
const packageAuditTest=read("tools/observability-package-audit-test.mjs");
const cycleDelta=read("tools/observability-cycle-delta.mjs");
const cycleDeltaTest=read("tools/observability-cycle-delta-test.mjs");
const githubPipeline=read("tools/observability-github-pipeline.mjs");
const githubPipelineTest=read("tools/observability-github-pipeline-test.mjs");
const platformLearning=read("tools/observability/platform-learning.mjs");
const platformLearningTest=read("tools/observability/platform-learning-test.mjs");

assert.equal(manifest.version,"0.10.0");
assert.equal(manifest.permissions.includes("nativeMessaging"),false);
assert.ok(manifest.permissions.includes("storage"));
assert.ok(manifest.permissions.includes("alarms"));
assert.ok(manifest.permissions.includes("unlimitedStorage"));
assert.ok(manifest.permissions.includes("scripting"));
assert.ok(manifest.host_permissions.includes("https://app.cloudinterpreter.com/*"));
assert.ok(manifest.host_permissions.includes("https://api.github.com/*"));
assert.ok(manifest.host_permissions.includes("https://github.com/login/*"));
assert.match(manifest.content_security_policy.extension_pages,/https:\/\/api\.github\.com/);
assert.match(manifest.content_security_policy.extension_pages,/https:\/\/github\.com/);

assert.ok(background.includes('importScripts("dialogue-engine.js","telemetry-db.js","github-observability.js","observation-sync.js","groq-transcriber.js")'));
assert.ok(background.includes('alarm.name==="signal-observation-sync"'));
assert.ok(background.includes('alarm.name==="signal-observation-sync-retry"'));
assert.ok(background.includes("SignalObservationSync.flush("startup""));
assert.ok(background.includes("SignalObservationSync.flush("alarm""));
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
assert.ok(content.includes("installNavigationObservers"));

assert.ok(observationSync.includes("SignalGithubObservability.uploadBatch"));
assert.ok(observationSync.includes("signal-observation-sync-retry"));
assert.ok(observationSync.includes("EVENT_THRESHOLD"));
assert.ok(observationSync.includes("safeEventUrl"));
assert.equal(/127\.0\.0\.1:\d+/.test(observationSync),false);
assert.equal(observationSync.includes("sendNativeMessage"),false);
assert.ok(observationSync.includes("lastGithubAcceptedAt"));

assert.ok(github.includes("https://api.github.com"));
assert.ok(github.includes("LOGIN_BASE") && github.includes("/login/device/code"));
assert.ok(github.includes("urn:ietf:params:oauth:grant-type:device_code"));
assert.ok(github.includes("repository_id"));
assert.ok(github.includes("refresh_token"));
assert.ok(github.includes("LOGIN_BASE") && github.includes("/login/oauth/access_token"));
assert.ok(github.includes("observations/inbox"));
assert.ok(github.includes("signalGithubObservabilityConfig"));
assert.ok(github.includes("beginDeviceFlow"));
assert.ok(github.includes("pollDeviceFlow"));
assert.ok(github.includes("uploadBatch"));
assert.equal(/client_secret/i.test(github),false);
assert.equal(/127\.0\.0\.1/.test(github),false);

assert.equal(popup.includes("sendNativeMessage"),false);
assert.equal(popup.includes("native messaging"),false);
assert.ok(popup.includes("SignalGithubObservability"));
assert.ok(popup.includes("githubClientId"));
assert.ok(popup.includes("githubConnect"));
assert.ok(popup.includes("Publicando observabilidad pendiente en GitHub"));

assert.ok(workflow.includes("observations/inbox/**"));
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
assert.ok(githubPipeline.includes("observations/inbox"));
assert.ok(githubPipeline.includes("semanticPlatformDelta"));
assert.ok(githubPipeline.includes("observability-build-health/v1"));
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

for(const value of [background,content,popup,observationSync,github]){
  assert.equal(value.includes("127.0.0.1:8788"),false,"Local observability endpoint remains.");
  assert.equal(value.includes("sendNativeMessage"),false,"Native messaging observability path remains.");
}

console.log("OBSERVABILITY_STATIC_AUDIT=PASS");
