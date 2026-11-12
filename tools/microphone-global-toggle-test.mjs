import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (file) => fs.readFileSync(file, "utf8");
const background = read("extension/background.js");
const popup = read("extension/ui/popup.js");
const popupCss = read("extension/ui/popup.css");

const policyStart = background.indexOf("function nextMicrophoneToggleMuted(state)");
const internalStart = background.indexOf("async function setExtensionMicrophoneMutedInternal");
const internalEnd = background.indexOf("  function setExtensionMicrophoneMuted(muted, source)", internalStart);
assert.ok(policyStart >= 0 && internalStart > policyStart && internalEnd > internalStart,
  "microphone policy and internal boundaries must exist");

const policy = vm.runInNewContext(
  background.slice(policyStart, internalStart) + ";({nextMicrophoneToggleMuted,applyPreCallMicrophoneIntent})"
);
assert.equal(policy.nextMicrophoneToggleMuted({ microphoneMuted: true }), false,
  "first click from safe default must prepare MIC ON");
assert.equal(policy.nextMicrophoneToggleMuted({ microphoneMuted: false }), true,
  "second click must toggle back to MIC OFF");
assert.equal((background.match(/var desired = nextMicrophoneToggleMuted\(state\);/g) || []).length, 2,
  "success and rejected-queue paths must share the same global toggle transition");

let storedState = { microphoneMuted: true, groqCapture: { microphoneMuted: true, status: "idle" } };
const events = [];
const setMicrophone = vm.runInNewContext(
  background.slice(internalStart, internalEnd) + ";setExtensionMicrophoneMutedInternal",
  {
    chrome: {
      storage: {
        local: {
          get: async () => ({ effectifState: storedState }),
          set: async (patch) => { storedState = patch.effectifState; }
        }
      }
    },
    baseState: () => ({ microphoneMuted: true, groqCapture: { microphoneMuted: true, status: "idle" } }),
    normalizeStateShape: (value) => value,
    normalizeHotloadState: (value) => value,
    hasActiveCall: () => false,
    cloneStateForStorage: (value) => JSON.parse(JSON.stringify(value)),
    applyPreCallMicrophoneIntent: policy.applyPreCallMicrophoneIntent,
    record: (...args) => events.push(args)
  }
);

const enable = await setMicrophone(false, "test-precall-enable");
assert.equal(enable.ok, true, "pre-call toggle must accept the manual click");
assert.equal(enable.verified, true, "pre-call intent persistence must be acknowledged");
assert.equal(enable.prepared, true, "pre-call state must be marked prepared");
assert.equal(enable.muted, false, "UI intent must turn on");
assert.equal(enable.outputMuted, true, "physical call output must remain muted without a call");
assert.equal(storedState.microphoneMuted, false);
assert.equal(storedState.microphoneMuteStatus, "prepared");
assert.equal(storedState.microphoneOutputMuted, true);
assert.equal(storedState.microphoneOutputStatus, "idle-safe");
assert.equal(storedState.groqCapture.microphoneMuted, true,
  "no-call intent must never enable capture");

const disable = await setMicrophone(true, "test-precall-disable");
assert.equal(disable.ok, true);
assert.equal(disable.muted, true);
assert.equal(disable.outputMuted, true);
assert.equal(storedState.microphoneMuted, true);
assert.equal(storedState.microphoneOutputMuted, true);
assert.ok(events.some(([name]) => name === "EXTENSION_MICROPHONE_PRECALL_INTENT_SAVED"),
  "pre-call state change must be observable without audio data");

const callStartAt = background.indexOf("function startCall(event)");
const closeCallAt = background.indexOf("function closeCall(", callStartAt);
assert.ok(callStartAt >= 0 && closeCallAt > callStartAt, "call lifecycle boundaries must exist");
const callStart = background.slice(callStartAt, closeCallAt);
assert.match(callStart, /state\.microphoneMuted\s*=\s*true/,
  "new call must reset the toggle to OFF");
assert.match(callStart, /setExtensionMicrophoneMuted\(true,\s*"call-start-safe"\)/,
  "new call must apply an explicit safe mute");
assert.doesNotMatch(callStart, /setExtensionMicrophoneMuted\(false,\s*"call-accepted"\)/,
  "call acceptance must not auto-unmute");

const closeCall = background.slice(closeCallAt, background.indexOf("function savePlatformSnapshot", closeCallAt));
assert.match(closeCall, /setMainClientMicrophoneMuted\(state\.callSourceTabId,true,"call-ended"\)/,
  "call end must remute the outgoing track");

assert.ok(popup.includes("preparedWithoutCall"));
assert.ok(popup.includes("Preparado · salida en mute"));
assert.ok(popupCss.includes(".mic-button {") && popupCss.includes("background: #183024;"),
  "prepared toggle must render green");
assert.ok(popupCss.includes(".mic-button.is-muted {") && popupCss.includes("background: #3a1d26;"),
  "muted toggle must render red");

console.log("MICROPHONE_GLOBAL_TOGGLE_TEST=PASS");
