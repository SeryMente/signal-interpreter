import fs from "node:fs";
import assert from "node:assert/strict";

const background = fs.readFileSync("extension/background.js", "utf8");
const guard = fs.readFileSync("extension/mic-guard-main.js", "utf8");
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

console.log(JSON.stringify({
  suite: "microphone-call-lifecycle",
  checks: 15,
  result: "PASS",
  environment: "static source contract assertions",
  realCallAcceptance: false
}));
