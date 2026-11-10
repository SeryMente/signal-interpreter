import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expectedVersion = "0.10.47";
const readText = (p) => readFileSync(resolve(root, p), "utf8");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const manifest = JSON.parse(readText("manifest.json"));
const installer = readText("INSTALAR.ps1");
const nestedManifest = JSON.parse(readText("extension/manifest.json"));
const prepareCommand = readText("PREPARAR-Y-CARGAR.cmd");
const probeScript = readText("PROBAR.ps1");
const inventory = JSON.parse(readText("payload-sha256.json"));
const entries = Array.isArray(inventory) ? inventory : inventory.files;

assert.equal(manifest.name, "Signal Interpreter");
assert.equal(manifest.version, expectedVersion, "manifest version is not the package version");
function normalizeManifestPaths(value) {
  if (Array.isArray(value)) return value.map(normalizeManifestPaths);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = normalizeManifestPaths(item);
    return out;
  }
  return typeof value === "string" && value.startsWith("extension/") ? value.slice("extension/".length) : value;
}
assert.deepEqual(nestedManifest, normalizeManifestPaths(manifest), "extension/manifest.json must be the path-normalized loadable workspace manifest");
assert.ok(prepareCommand.includes('explorer.exe "%~dp0extension"'), "one-step preparation must open the sole Chrome load folder");
assert.ok(prepareCommand.includes("subcarpeta extension"), "preparation must instruct the operator to load extension/");
assert.ok(probeScript.includes("Join-Path $root 'extension'"), "probe must target the extension subfolder");
assert.ok(probeScript.includes("Join-Path $loadRoot 'manifest.json'"), "probe must read the Chrome-loadable manifest");
assert.ok(probeScript.includes("$loadRoot"), "probe must match the Chrome extension path to extension/");

assert.ok(Array.isArray(entries) && entries.length >= 50, "payload inventory is empty or unexpectedly small");
assert.ok(installer.includes("'"+expectedVersion+"'"), "installer and manifest versions differ");

const keyDigest = createHash("sha256").update(Buffer.from(manifest.key, "base64")).digest().subarray(0, 16);
const extensionId = Array.from(keyDigest, (byte) =>
  String.fromCharCode(97 + (byte >> 4), 97 + (byte & 15))).join("");
assert.equal(extensionId, "ldpbjhobnfgmhdoehehdmnbhhjckebmj", "Chrome extension identity changed");

const seen = new Set();
const digestMismatches = [];
for (const entry of entries) {
  assert.ok(entry && typeof entry.path === "string" && typeof entry.sha256 === "string", "malformed inventory entry");
  assert.match(entry.sha256, /^[A-F0-9]{64}$/i, "malformed SHA-256: " + entry.path);
  assert.ok(!isAbsolute(entry.path) && !entry.path.split(/[\\/]/).includes(".."), "unsafe path: " + entry.path);
  const full = resolve(root, entry.path);
  const rel = relative(root, full);
  assert.ok(rel && rel !== ".." && !rel.startsWith(".." + sep), "path escapes package root: " + entry.path);
  assert.ok(!seen.has(entry.path.toLowerCase()), "duplicate inventory path: " + entry.path);
  seen.add(entry.path.toLowerCase());
  assert.ok(existsSync(full), "missing payload file: " + entry.path);
  const actualDigest = sha256(readFileSync(full));
  console.log("PAYLOAD_SHA256 " + entry.path + " actual=" + actualDigest + " expected=" + entry.sha256.toUpperCase());
  if (actualDigest !== entry.sha256.toUpperCase()) {
    digestMismatches.push({ path: entry.path, actual: actualDigest, expected: entry.sha256.toUpperCase() });
  }
}
assert.deepEqual(digestMismatches, [], "payload SHA-256 mismatches: " + JSON.stringify(digestMismatches));

const commands = manifest.commands || {};
assert.ok(commands["toggle-global-overlays"], "global overlays keyboard command is absent");
assert.equal(commands["toggle-global-overlays"].suggested_key.default, "Ctrl+Shift+8");
const popup = readText("extension/ui/popup.html");
const popupJs = readText("extension/ui/popup.js");
const background = readText("extension/background.js");
assert.ok(background.includes('var GROQ_MODEL = "whisper-large-v3";'), "both audio lanes must default to Groq Whisper Large V3");
assert.ok(background.includes("var GROQ_USD_PER_AUDIO_HOUR = 0.111;"), "Groq cost telemetry must match the configured Large V3 model");
assert.ok(background.includes("groqDialogueEnabled: false")&&popupJs.includes("groqDialogueEnabled: false"),
  "dual-source audio capture must remain disabled until the operator explicitly opts in");
assert.ok(manifest.host_permissions.includes("https://api.groq.com/*"), "Groq transcription endpoint permission is missing");
const cloudContentScript = manifest.content_scripts.find((item) =>
  (item.matches || []).includes("https://app.cloudinterpreter.com/*") &&
  item.world === "ISOLATED" && (item.js || []).includes("extension/groq-dialogue-capture.js"));
assert.ok(cloudContentScript, "dual-source capture must load only in the Cloud Interpreter isolated world");
assert.ok(cloudContentScript.js.includes("extension/dialogue-engine.js"), "dialogue merger is not loaded before the overlay");
assert.ok(manifest.content_security_policy.extension_pages.includes("https://api.groq.com"), "Groq connect-src is absent");
const capture = readText("extension/groq-dialogue-capture.js");
const windowProcessor = readText("extension/whisper-window-processor.js");
assert.ok(capture.includes("getDisplayMedia") && capture.includes("getUserMedia"), "remote tab and interpreter microphone capture lanes are not independent");
assert.ok(capture.includes('button.disabled=true;button.textContent="Iniciar diálogo Groq"'),
  "getDisplayMedia control must not be clickable before the asynchronous permission preflight is complete");
assert.ok(capture.includes('"groq-remote"') && capture.includes('"groq-interpreter"'), "stable source identifiers are missing");
assert.ok(capture.includes("context.sampleRate!==16000"), "capture must fail closed unless the WAV clock is exactly 16 kHz");
assert.ok(capture.includes("track.addEventListener(\"ended\"") && capture.includes("groq-dialogue-control"), "capture lifecycle/visible controls are incomplete");
assert.ok(windowProcessor.includes("registerProcessor(\"signal-whisper-window\"") && windowProcessor.includes('write(0,"RIFF")'), "self-contained WAV worklet is missing");
const dialoguePipeline = background.slice(background.indexOf("async function processGroqDialogueChunk"), background.indexOf("async function loadSignalSessions"));
assert.ok(dialoguePipeline.includes("createConcurrentSourceQueue") || background.includes("createConcurrentSourceQueue(2)"), "independent ordered source queues are missing");
assert.ok(dialoguePipeline.includes("globalThis.SignalGroqTranscriber.transcribe") && dialoguePipeline.includes("SignalDialogue.mergeSegments"), "Groq-to-dialogue fusion path is incomplete");
assert.ok(dialoguePipeline.includes("zeroDataRetentionConfirmed:true") && background.includes("groqZeroDataRetentionConfirmed!==true"), "ZDR preflight gate is missing");
assert.ok(!dialoguePipeline.includes("persistSignalSegment("), "dual-source clinical transcript must not use durable telemetry/session persistence");
const dialogueOverlay = readText("extension/live-caption-overlay.js");
assert.ok(dialogueOverlay.includes("groqDialogueMode") && dialogueOverlay.includes("SIGNAL_GROQ_DIALOGUE_SEGMENTS"), "unified Groq transcript overlay is missing");
const transcriptCore = readText("extension/live-caption-core.js");
assert.ok(transcriptCore.includes('source === "groq-interpreter") return "INTÉRPRETE"') &&
  transcriptCore.includes('source === "groq-remote") return "AUDIO REMOTO'), "source-based labels are missing");
const earnings = readText("extension/content.js");
const captions = readText("extension/live-caption-overlay.js");
assert.ok(popup.includes('id="overlaysGlobalEnabled"'), "global overlay switch is absent from popup");
assert.ok(popup.includes('id="overlayShortcutStatus"'), "global shortcut status is absent from popup");
assert.ok(popupJs.includes('save({ overlaysGlobalEnabled: this.checked })'), "global toggle is not persisted");
assert.ok(popupJs.includes('renderOverlayShortcut'), "global shortcut assignment is not surfaced");
assert.ok(background.includes('command === "toggle-global-overlays"'), "background does not handle overlay shortcut");
assert.ok(background.includes("config.overlaysGlobalEnabled = config.overlaysGlobalEnabled === false"), "shortcut does not invert global state");
assert.ok(earnings.includes("existingRuntimeMarker.dispose") && earnings.includes("if (!runtimeMarker.active) return;"), "earnings overlay hotload disposal guard is absent");
assert.ok(earnings.includes('document.querySelectorAll("#signal-interpreter-earnings-overlay")'), "stale earnings overlays are not removed");
assert.ok(captions.includes("previousOverlayRuntime.dispose") && captions.includes("function disposeOverlay"), "caption overlay hotload disposal is absent");
assert.ok(captions.includes("config.overlaysGlobalEnabled !== false"), "caption overlay does not honor the global visibility switch");
assert.ok(installer.includes("ConvertFrom-Json -InputObject $inventoryText"), "installer is not parsing inventory explicitly");
assert.ok(installer.includes("$inventory -is [System.Array]"), "installer does not support legacy array inventories");
assert.ok(installer.includes("signal-interpreter-payload-sha256/v1"), "installer does not validate the current inventory schema");
assert.ok(existsSync(resolve(root, "PREPARAR-Y-CARGAR.cmd")), "one-step preparation command is missing");
assert.ok(existsSync(resolve(root, "tools/probe-caption-host.ps1")), "native host protocol probe is missing");

const presenceGuard = readText("extension/presence-guard.js");
const contentRuntime = readText("extension/content.js");
const micGuard = readText("extension/mic-guard-main.js");
const liveReader = readText("extension/ui/live.js");
const liveHtml = readText("extension/ui/live.html");
const liveCss = readText("extension/ui/live.css");
assert.ok(background.includes('blue: "#3b82f6"'), "contextual blue indicator is absent");
assert.ok(background.includes("function aggregateCloudActionStatus"), "global Cloud status aggregator is absent");
assert.ok(background.includes('globalStatus==="active"?"blue":globalStatus'), "external blue icon is not gated by Cloud active status");
assert.ok(background.includes("fail-closed-on-unmute-verification-error"), "microphone unmute error is not fail-closed");
assert.ok(background.includes("EXTENSION_MICROPHONE_UNMUTE_BLOCKED_NO_ACTIVE_CALL"), "idle unmute guard is missing");
assert.ok(background.includes('setExtensionMicrophoneMuted(false, "call-accepted")'), "call-accepted unmute is missing");
assert.ok(background.includes('setMainClientMicrophoneMuted(state.callSourceTabId,true,"call-ended")'), "call-end mute is missing");
assert.ok(micGuard.includes("var muted=old?!!old.muted:true;"), "main-world microphone default is not muted");
assert.ok(presenceGuard.includes("signalPresenceGuardSession") && presenceGuard.includes("lastPresenceCheckAt") &&
  presenceGuard.includes("cachedAutoAnswerEnabled") && presenceGuard.includes("cachedLabLock") &&
  presenceGuard.includes('chrome.tabs.query({ url: "https://app.cloudinterpreter.com/call/*" })'),
  "presence continuity/cached fast authorization/active-call guard is missing");
assert.ok(contentRuntime.includes("postAuthorizationRevalidationFailureCodes") && contentRuntime.includes("revalidationFailureCodes.length > 0"), "pre-click authorization revalidation is missing");
assert.ok(background.includes("live-console-sender-required") && background.includes("captionHistory:captionHistory"), "protected native caption history hydration is missing");
assert.ok(background.includes('chrome.tabs.create({url:targetUrl,active:true})'), "live reader is not opened in a normal reusable tab");
assert.ok(liveReader.includes("reader-fullwidth") && liveReader.includes("captionHistory"), "full-width caption reader hydration is missing");
assert.ok(liveHtml.includes('id="toggleTools"') && liveCss.includes("body.reader-fullwidth main"), "full-width tools toggle is missing");

const registration = readText("extension/native/register-caption-host.ps1");
const match = registration.match(/ExpectedSha256\s*=\s*"([a-f0-9]{64})"/i);
assert.ok(match, "native host expected SHA-256 is missing");
const embeddedExe = Buffer.from(readText("extension/native/SignalInterpreter.CaptionHost.exe.b64").trim(), "base64");
assert.equal(sha256(embeddedExe), match[1].toUpperCase(), "embedded native host executable hash mismatch");

const safetyRegressionSuites = [
  "tools/microphone-guard-test.mjs",
  "tools/presence-connect-test.mjs",
  "tools/presence-guard-test.mjs",
  "tools/autoanswer-runtime-guard-test.mjs",
  "tools/groq-transcriber-tests.mjs",
  "tools/dialogue-engine-dual-source-tests.mjs",
  "tools/whisper-window-processor-tests.mjs",
  "tools/groq-dialogue-capture-tests.mjs"
];
for (const suite of safetyRegressionSuites) {
  const result = spawnSync(process.execPath, [resolve(root, suite)], {
    cwd: root,
    stdio: "inherit"
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, "critical safety regression failed: " + suite);
}
console.log("PASS: audio/Connect/presence regression gate (" + safetyRegressionSuites.length + " suites)");

console.log("PASS: package inventory and SHA-256 (" + entries.length + " files)");
console.log("PASS: manifest identity/version and native host binary hash");
console.log("PASS: global overlay switch/shortcut and hotload-disposal guards");
console.log("PASS: installer inventory schema compatibility (static contract)");
console.log("NOTE: this test does not exercise Chrome or a live call.");
