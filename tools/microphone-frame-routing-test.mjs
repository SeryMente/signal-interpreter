import assert from "node:assert/strict";
import fs from "node:fs";

const background = fs.readFileSync("extension/background.js", "utf8");
const guard = fs.readFileSync("extension/mic-guard-main.js", "utf8");

const ensureStart = background.indexOf("async function ensureMainMicrophoneGuards");
const executeStart = background.indexOf("async function executeMainMicrophoneCommand", ensureStart);
const probeStart = background.indexOf("async function probeMainClientMicrophone", executeStart);
assert.ok(ensureStart >= 0 && executeStart > ensureStart && probeStart > executeStart,
  "all-frame microphone routing functions must exist");

const ensureBlock = background.slice(ensureStart, executeStart);
const executeBlock = background.slice(executeStart, probeStart);
assert.match(ensureBlock, /target:\s*\{\s*tabId:\s*targetTabId,\s*allFrames:\s*true\s*\}/,
  "guard discovery must inspect every frame");
assert.match(ensureBlock, /frameIds:\s*missingFrameIds/,
  "only frames without an existing guard may receive a new injection");
assert.match(executeBlock, /target:\s*\{\s*tabId:\s*targetTabId,\s*allFrames:\s*true\s*\}/,
  "mute and unmute commands must reach every frame");
assert.match(executeBlock, /trackFrames/,
  "results must distinguish frames with real outgoing tracks from empty frames");
assert.match(executeBlock, /trackFrames\.length\s*===\s*0/,
  "active-call unmute must fail unless at least one real outgoing track is found");
assert.match(background, /await ensureMainMicrophoneGuards\(tabId\)/,
  "runtime hotload must reuse an existing guard rather than re-inject it");
assert.match(guard, /function isMuted\(\) \{ return state\.muted === true; \}/,
  "all wrapper closures must read the shared state object");
assert.match(guard, /EMERGENCY_MESSAGE/);
assert.match(guard, /emergencyRelease\("ctrl-alt-shift-m"\)/);
assert.match(guard, /restorePatches\(\)/);
assert.match(guard, /clearInterval\(timer\)/);

console.log("MICROPHONE_FRAME_ROUTING_TEST=PASS");
