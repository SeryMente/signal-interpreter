import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (file) => fs.readFileSync(file, "utf8");
const background = read("extension/background.js");
const popup = read("extension/ui/popup.js");
const popupCss = read("extension/ui/popup.css");
const content = read("extension/content.js");
const micGuard = read("extension/mic-guard-main.js");

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

let cloudState = { microphoneMuted: true, callSourceTabId: null, groqCapture: { microphoneMuted: true, status: "idle" } };
const cloudCalls = [];
const cloudEvents = [];
const setMicrophoneWithCloudTab = vm.runInNewContext(
  background.slice(internalStart, internalEnd) + ";setExtensionMicrophoneMutedInternal",
  {
    chrome: {
      storage: {
        local: {
          get: async () => ({ effectifState: cloudState }),
          set: async (patch) => { cloudState = patch.effectifState; }
        }
      },
      tabs: {
        query: async (query) => {
          assert.equal(query.url, "https://app.cloudinterpreter.com/*");
          return [{ id: 47, active: true, url: "https://app.cloudinterpreter.com/home" }];
        }
      }
    },
    AUTHORIZED_ORIGIN: "https://app.cloudinterpreter.com",
    isAuthorizedCloudUrl: (url) => String(url).startsWith("https://app.cloudinterpreter.com/"),
    baseState: () => ({ microphoneMuted: true, groqCapture: { microphoneMuted: true, status: "idle" } }),
    normalizeStateShape: (value) => value,
    normalizeHotloadState: (value) => value,
    hasActiveCall: () => false,
    cloneStateForStorage: (value) => JSON.parse(JSON.stringify(value)),
    applyPreCallMicrophoneIntent: policy.applyPreCallMicrophoneIntent,
    setMainClientMicrophoneMuted: async (tabId, muted, source, allowEmpty) => {
      cloudCalls.push({ tabId, muted, source, allowEmpty });
      return { ok: true, verified: true, muted, trackCount: 0, senderCount: 0 };
    },
    record: (...args) => cloudEvents.push(args)
  }
);

const cloudEnable = await setMicrophoneWithCloudTab(false, "test-any-screen-enable");
assert.equal(cloudEnable.ok, true, "manual enable must target an authorized Cloud Interpreter tab before a call");
assert.equal(cloudEnable.verified, true);
assert.equal(cloudEnable.prepared, false, "authorized page guard must accept the selected state instead of only storing a UI intent");
assert.equal(cloudEnable.muted, false);
assert.equal(cloudEnable.outputMuted, false);
assert.equal(cloudState.microphoneMuted, false);
assert.equal(cloudState.microphoneMuteStatus, "applied");
assert.equal(cloudState.microphoneOutputMuted, false);
assert.equal(cloudState.microphoneOutputStatus, "applied");
assert.equal(cloudState.microphoneOutputTrackCount, 0, "no call track may be fabricated or opened by the toggle");
assert.equal(cloudState.microphoneOutputSenderCount, 0, "no call sender may be fabricated by the toggle");
assert.equal(cloudState.groqCapture.microphoneMuted, true, "pre-call toggle must not start Groq capture");
assert.deepEqual(cloudCalls[0], {
  tabId: 47, muted: false, source: "test-any-screen-enable", allowEmpty: true
}, "pre-call enable must explicitly reach the MAIN-world guard with allowEmpty");

const cloudDisable = await setMicrophoneWithCloudTab(true, "test-any-screen-disable");
assert.equal(cloudDisable.ok, true, "second click must mute the microphone on the same page");
assert.equal(cloudDisable.muted, true);
assert.equal(cloudDisable.outputMuted, true);
assert.equal(cloudState.microphoneMuted, true);
assert.equal(cloudState.microphoneOutputMuted, true);
assert.deepEqual(cloudCalls[1], {
  tabId: 47, muted: true, source: "test-any-screen-disable", allowEmpty: true
});

assert.match(content, /allowEmpty:allowEmpty===true/,
  "content script must carry allowEmpty into the MAIN-world command");
assert.match(content, /message\.allowEmpty===true/,
  "content message handler must forward the requested mode");
assert.match(micGuard, /async function unmute\(id,allowEmpty\)/,
  "MAIN-world guard must accept the explicit pre-call mode");
assert.match(micGuard, /allowEmpty===true&&before\.verified&&before\.stable&&Number\(before\.trackCount\|\|0\)===0/,
  "MAIN-world guard may acknowledge an empty stable baseline only when explicitly allowed");
assert.match(micGuard, /unmute\(m\.requestId,m\.allowEmpty===true\)/,
  "MAIN-world listener must pass the explicit mode into unmute");

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

assert.ok(background.includes("function withMicrophoneTimeout(promise, timeoutMs, fallback)"));
assert.ok(background.includes("1000,"));
assert.ok(popup.includes("},12000);"), "popup must release a pending toggle within its watchdog");
assert.ok(popup.includes("preparedWithoutCall"));
assert.ok(popup.includes("Preparado · salida en mute"));
assert.ok(popupCss.includes(".mic-button {") && popupCss.includes("background: #183024;"),
  "prepared toggle must render green");
assert.ok(popupCss.includes(".mic-button.is-muted {") && popupCss.includes("background: #3a1d26;"),
  "muted toggle must render red");

console.log("MICROPHONE_GLOBAL_TOGGLE_TEST=PASS");
