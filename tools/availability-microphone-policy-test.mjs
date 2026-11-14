import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const background = fs.readFileSync("extension/background.js", "utf8");
const content = fs.readFileSync("extension/content.js", "utf8");
const policyStart = background.indexOf("function availabilityMicrophoneMuted");
const policyEnd = background.indexOf("function nextMicrophoneToggleMuted", policyStart);
assert.ok(policyStart >= 0 && policyEnd > policyStart, "availability microphone policy functions must exist");

let currentState = {
  microphoneMuted: true, microphoneOutputMuted: true,
  microphoneMuteStatus: "unapplied", microphoneOutputStatus: "unapplied",
  callId: null, callStartedAt: null
};
let activeCall = false;
const applied = [];
const policy = vm.runInNewContext(
  background.slice(policyStart, policyEnd) + ";({availabilityMicrophoneMuted,applyPlatformAvailabilityMicrophonePolicy})",
  {
    isAuthorizedProfileUrl: (url) => url === "https://app.cloudinterpreter.com/profile/cmu2wuz1v0uwr07adbzb9djfz",
    chrome: { storage: { local: { get: async () => ({ effectifState: currentState }) } } },
    baseState: () => ({ microphoneMuted: true, microphoneOutputMuted: true }),
    normalizeStateShape: (value) => value,
    normalizeHotloadState: (value) => value,
    hasActiveCall: () => activeCall,
    setExtensionMicrophoneMuted: async (muted, source, tabId) => {
      applied.push({ muted, source, tabId });
      currentState = Object.assign({}, currentState, {
        microphoneMuted: muted, microphoneOutputMuted: muted,
        microphoneMuteStatus: "applied", microphoneOutputStatus: "applied"
      });
      return { ok: true, verified: true, muted };
    },
    record: () => {}
  }
);
assert.equal(policy.availabilityMicrophoneMuted("online"), true, "ONLINE must map to microphone OFF");
assert.equal(policy.availabilityMicrophoneMuted("offline"), false, "OFFLINE must map to microphone ON");
assert.equal(policy.availabilityMicrophoneMuted("unknown"), null, "unknown presence must not change the microphone");

const profileTab = { id: 14, url: "https://app.cloudinterpreter.com/profile/cmu2wuz1v0uwr07adbzb9djfz" };
let result = await policy.applyPlatformAvailabilityMicrophonePolicy("online", profileTab);
assert.equal(result.verified, true);
assert.deepEqual(applied[0], { muted: true, source: "platform-availability-online", tabId: 14 });

result = await policy.applyPlatformAvailabilityMicrophonePolicy("offline", profileTab);
assert.equal(result.verified, true);
assert.deepEqual(applied[1], { muted: false, source: "platform-availability-offline", tabId: 14 });

result = await policy.applyPlatformAvailabilityMicrophonePolicy("offline", profileTab);
assert.equal(result.unchanged, true, "unchanged state must not issue another microphone command");
assert.equal(applied.length, 2);

result = await policy.applyPlatformAvailabilityMicrophonePolicy("offline", {
  id: 15, url: "https://app.cloudinterpreter.com/call/example"
});
assert.equal(result.skipped, true, "automatic state transitions are restricted to the authorized profile");

activeCall = true;
currentState = Object.assign({}, currentState, { callId: "call-1", callStartedAt: new Date().toISOString() });
result = await policy.applyPlatformAvailabilityMicrophonePolicy("offline", profileTab);
assert.equal(result.reason, "active-call-fail-closed", "OFFLINE must not unmute during an active call");
assert.equal(applied.length, 2);

const callStartAt = background.indexOf("function startCall(event)");
const closeCallAt = background.indexOf("function closeCall(", callStartAt);
assert.ok(callStartAt >= 0 && closeCallAt > callStartAt);
const callStart = background.slice(callStartAt, closeCallAt);
assert.match(callStart, /state\.microphoneMuted\s*=\s*true/, "every new call must start muted");
assert.match(callStart, /setExtensionMicrophoneMuted\(true,\s*"call-start-safe"\)/,
  "the call-start fail-closed mute must remain");

const closeCall = background.slice(closeCallAt, background.indexOf("function savePlatformSnapshot", closeCallAt));
assert.match(closeCall, /signalPlatformAvailability/, "call end must read the last platform availability");
assert.match(closeCall, /availabilityMicrophoneMuted\(platformAvailability\)/);
assert.match(closeCall, /restoreMuted===false/, "OFFLINE call end may unmute only through explicit verification");
assert.doesNotMatch(closeCall, /tabAvailability\.get\(Number\(state\.callSourceTabId\)\)/,
  "a stale call-tab indicator must not override the last confirmed profile state");
assert.ok(background.includes("sender.tab && isAuthorizedProfileUrl(sender.tab.url)"),
  "only the authorized profile may persist ONLINE/OFFLINE state");

assert.ok(content.includes("function syncCallMicrophoneReminder()"), "small call-start reminder must exist");
assert.ok(content.includes("top:12px;left:50%;transform:translateX(-50%)"),
  "reminder must be centered along the top edge");
assert.ok(content.includes('type: "SIGNAL_EXTENSION_MICROPHONE_SET", muted: false'),
  "reminder button must issue an explicit user-triggered unmute");
assert.ok(content.includes('state.microphoneOutputStatus === "applied"'),
  "reminder may disappear only after verified output state");
assert.ok(content.includes('removeCallMicrophoneReminder("microphone-output-verified-on")'));

console.log("AVAILABILITY_MICROPHONE_POLICY_TEST=PASS");
