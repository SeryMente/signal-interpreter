import assert from "node:assert/strict";
import fs from "node:fs";

const background = fs.readFileSync("extension/background.js", "utf8");
const content = fs.readFileSync("extension/content.js", "utf8");

assert.doesNotMatch(background, /requestCallAlert\s*\(/,
  "confirmed calls must not generate a post-answer alert tone");
assert.doesNotMatch(content, /CALL_BEEP_MARKER|playPageCallBeep|speakConfirmedAnswer/,
  "the call route must not inject local beep or speech into the interpreter output");

const callStartAt = background.indexOf("function startCall(event)");
const alertOnConnectAt = background.indexOf("function alertOnConnect(event)", callStartAt);
assert.ok(callStartAt >= 0 && alertOnConnectAt > callStartAt,
  "call start boundaries must remain identifiable");
const callStart = background.slice(callStartAt, alertOnConnectAt);
assert.doesNotMatch(callStart, /playSound\s*\(/,
  "the confirmed active-call transition must not play local audio");

const micStart = background.indexOf("async function setExtensionMicrophoneMutedInternal");
const micEnd = background.indexOf("  function setExtensionMicrophoneMuted(", micStart);
assert.ok(micStart >= 0 && micEnd > micStart, "microphone transition boundaries must exist");
const micTransition = background.slice(micStart, micEnd);
assert.match(micTransition,
  /if\s*\(\s*!hasActiveCall\(state\)\s*&&\s*cachedConfig\.soundEnabled!==false\s*\)/,
  "MIC feedback tones are allowed only when no call is active");
assert.match(micTransition, /setExtensionMicrophoneMutedInternal/,
  "the mute state transition remains in place");
assert.match(micTransition, /state\.microphoneMuted=desired/,
  "the logical microphone toggle remains unchanged");

const testAt = background.indexOf('if (message.type === "EFFECTIF_TEST_SOUND")');
const nextHandlerAt = background.indexOf('if (message.type === "EFFECTIF_PLATFORM_SNAPSHOT")', testAt);
assert.ok(testAt >= 0 && nextHandlerAt > testAt, "manual sound-test handler must remain present");
const testHandler = background.slice(testAt, nextHandlerAt);
const guardAt = testHandler.indexOf("if (hasActiveCall(currentState))");
const playAt = testHandler.indexOf("playSound(message.volume)");
assert.ok(guardAt >= 0 && playAt > guardAt,
  "manual test tone must be blocked before playback during an active call");
assert.match(testHandler, /ALERT_SOUND_TEST_BLOCKED_ACTIVE_CALL/,
  "blocked manual test attempts are observable without audio data");

console.log("CALL_AUDIO_ISOLATION=PASS");