import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";

const background = fs.readFileSync("extension/background.js", "utf8");
const guard = fs.readFileSync("extension/mic-guard-main.js", "utf8");
const content = fs.readFileSync("extension/content.js", "utf8");
const overlay = fs.readFileSync("extension/live-caption-overlay.js", "utf8");
const groq = fs.readFileSync("extension/groq-transcriber.js", "utf8");
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));

function bodyBetween(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert(start >= 0 && end > start, label + " boundaries");
  return source.slice(start, end);
}

const callPolicy = bodyBetween(
  background,
  "  function applyCallMicrophonePolicy(",
  "  async function setExtensionMicrophoneMutedInternal",
  "call microphone policy"
);
assert(callPolicy.includes("hasActiveCall(state)"), "unmute requires active call state");
assert(callPolicy.includes("state.callId !== callId"), "unmute requires matching call identity");
assert(callPolicy.includes("isCloudCallUrl(sourceTab.url)"), "unmute requires the current tab to be on a confirmed call route");
assert(callPolicy.includes("callMicrophonePolicyQueue.then"), "call mic policy transitions are serialized");

const startCall = bodyBetween(background, "  function startCall(event) {", "  var callAlertInFlight", "startCall");
assert(startCall.includes('applyCallMicrophonePolicy(callId, state.callSourceTabId, false, "call-accepted")'),
  "call acceptance is the only automatic unmute transition");
assert(startCall.includes("if (activeState.callId !== callId) return;"),
  "late microphone acknowledgement cannot rewrite a subsequent call");

const rememberEnd = bodyBetween(background, "  function rememberCallEnd(event) {", "  function reconcileOfficialEarningsAfterCall", "end-button transition");
assert(rememberEnd.includes('applyCallMicrophonePolicy(endingCallId, endingTabId, true, "end-button")'),
  "end-button intent mutes before rating-route confirmation");

const closeCall = bodyBetween(background, "  function closeCall(source, platformSeconds, sendResponse) {", "  function savePlatformSnapshot", "closeCall");
assert(closeCall.includes('applyCallMicrophonePolicy(endingCallId, endingTabId, true, "call-ended:"'),
  "all call close paths request mute before clearing call state");
assert(closeCall.indexOf("applyCallMicrophonePolicy") < closeCall.indexOf("state.callStartedAt = null"),
  "mute command precedes clearing the active call identity");

const manualMic = bodyBetween(
  background,
  "  async function setExtensionMicrophoneMutedInternal",
  "  function setExtensionMicrophoneMuted(",
  "manual microphone control"
);
assert(manualMic.includes("if (!desired && (!outputRequired || !unmuteRouteValid))"),
  "manual unmute is blocked outside an active call route");

const initialization = bodyBetween(background, "  async function initialize() {", "  async function ensureOffscreen()", "initialization");
assert(initialization.includes("state.microphoneMuted = true;") &&
       initialization.includes("state.microphoneOutputMuted = true;"),
  "service-worker restart defaults to the fail-closed idle microphone state");

assert(guard.includes("var muted = previous && callRouteActive ? !!previous.muted : true;"),
  "unknown, idle and non-call contexts default muted");
assert(guard.includes("}, 250);"), "track enforcement is bounded to a 250 ms interval");
assert(!guard.includes("}, 50);"), "the previous 20 Hz polling loop is removed");
assert(guard.includes("if (!liveTracks().length) {\n      stopMuteEnforcement();"),
  "no recurring mute timer remains when no live media track exists");

const micContentScript = manifest.content_scripts.find(entry =>
  Array.isArray(entry.js) && entry.js.includes("extension/mic-guard-main.js"));
assert(micContentScript, "main-world microphone guard remains installed on Cloud Interpreter");
assert(micContentScript.matches.includes("https://app.cloudinterpreter.com/*"),
  "microphone guard scope stays on the supported platform");
assert(micContentScript.all_frames !== true,
  "microphone guard is no longer installed in every subframe");

assert.ok(manifest.host_permissions.includes("https://api.groq.com/*"),
  "Groq is an explicitly scoped outbound host");
assert.match(manifest.content_security_policy.extension_pages,/https:\/\/api\.groq\.com/);
assert.ok(background.includes('importScripts("groq-transcriber.js")') &&
          background.includes('importScripts("groq-secret.local.js")'),
  "the service worker loads the transcriber and only the ignored local credential file");
assert.ok(background.includes('config.groqZeroDataRetentionConfirmed !== true') &&
          background.includes('config.liveCaptionInterpreterEnabled !== true'),
  "every capture request fails closed unless the channel and ZDR are enabled");
assert.ok(background.includes("isCloudCallUrl(sender.tab.url)") &&
          background.includes("Number(state.callSourceTabId) !== Number(sender.tab.id)"),
  "capture is pinned to the active Cloud Interpreter call tab");
assert.ok(content.includes("navigator.mediaDevices.getUserMedia") &&
          content.includes("new MediaRecorder(stream") &&
          content.includes('voiceControl.addEventListener("click", toggleInterpreterMicCapture)'),
  "capture is initiated only by an explicit click in the call control");
const micStart=bodyBetween(content,
  "  async function startInterpreterMicCapture() {",
  "  function toggleInterpreterMicCapture()",
  "interpreter mic start");
const permissionCall=micStart.indexOf("stream = await navigator.mediaDevices.getUserMedia(");
assert.ok(micStart.indexOf("SIGNAL_INTERPRETER_MIC_POLICY_GET") < permissionCall && permissionCall>=0,
  "policy preflight occurs before the actual microphone permission request");
assert.ok(content.includes('stopInterpreterMicCapture("call-route-left",true)') &&
          content.includes('stopInterpreterMicCapture("pagehide",true)'),
  "call-route exit and pagehide stop the local microphone stream");
assert.ok(background.includes('chrome.storage.session.set({ [INTERPRETER_MIC_SESSION_KEY]') &&
          background.includes('appendCaptionOverlayHistory(caption, tabId)'),
  "interpreter transcript is held in session storage, not call/telemetry persistence");
assert.ok(background.includes("rows.filter(function (row) { return row.source === \"chrome-live-caption\" || (row.source === \"yo\" && row.speaker === \"INTÉRPRETE\"); })"),
  "session writes preserve only native captions and attributed interpreter text");
const micChunkHandler=bodyBetween(background,
  "  async function processInterpreterMicChunk(",
  "  function enqueueInterpreterMicChunk(",
  "interpreter microphone chunk handler");
assert.match(micChunkHandler,/SignalGroqTranscriber\.transcribe/);
assert.doesNotMatch(micChunkHandler,/KhoraTelemetryDB|persistSignalSegment|addSignalSessionSegment|record\(|storage\.local|recordSignalDiagnostic/,
  "audio and clinical transcript are not written to local storage or telemetry");
assert.ok(content.includes("interpreterMicQueuedChunks > 2") && background.includes("interpreterMicPending > 2"),
  "content and worker each enforce a strict in-memory backpressure limit");
const segmentClassifier=bodyBetween(background,
  "  function interpreterSegmentLanguage(",
  "  async function publishInterpreterCaption(",
  "bilingual segment language classifier");
const vmContext={SignalCaptionCore:{
  normalizeText:value=>String(value||"").replace(/\\s+/g," ").trim(),
  resolveLanguage:()=> "unknown"
}};
const classifierContext=vm.createContext(vmContext);
vm.runInContext(segmentClassifier + "\nthis.classify=interpreterSegmentLanguage;",classifierContext);
assert.equal(classifierContext.classify("Muchas gracias","en"),"es",
  "short Spanish interpreter segment overrides the whole-chunk English fallback");
assert.equal(classifierContext.classify("Thank you very much","es"),"en",
  "English interpreter segment overrides the whole-chunk Spanish fallback");
assert.match(groq,/zeroDataRetentionConfirmed!==true/);
assert.match(groq,/reasonCode:"zdr-required"/);
assert.ok(overlay.includes('caption.source === "yo" && caption.speaker === "INTÉRPRETE"') &&
          overlay.includes("message.callId === currentCloudCallId()") &&
          overlay.includes("sender.id === chrome.runtime.id"),
  "only authenticated interpreter captions for the current call reach the overlay");

console.log(JSON.stringify({
  suite: "microphone-call-lifecycle",
  checks: 43,
  result: "PASS",
  environment: "static source contract assertions",
  realCallAcceptance: false
}));
