import fs from "node:fs";
import assert from "node:assert/strict";

const read = (p) => fs.readFileSync(p, "utf8");
const manifest = JSON.parse(read("manifest.json"));
const background = read("extension/background.js");
const content = read("extension/content.js");
const caption = read("extension/live-caption-overlay.js");
const popupHtml = read("extension/ui/popup.html");
const popupJs = read("extension/ui/popup.js");

assert.equal(manifest.version, "0.10.38");
assert.equal(manifest.commands["toggle-call-overlays"]?.suggested_key?.default, "Ctrl+Shift+8");
assert.match(background, /command === "toggle-call-overlays"/);
const commandBlock = background.slice(background.indexOf('if (command === "toggle-call-overlays")'), background.indexOf('if (command !== "toggle-auto-answer")'));
assert.match(commandBlock, /config\.callOverlaysVisible = config\.callOverlaysVisible === false/);
assert.doesNotMatch(commandBlock, /config\.(liveCaptionOverlayEnabled|overlayEnabled|autoAnswerEnabled)\s*=/,
  "el atajo maestro no debe detener captions ni cambiar Auto-Answer");

assert.match(popupHtml, /id="allOverlaysEnabled"/);
assert.match(popupHtml, /Ctrl\+Shift\+8/);
assert.match(popupJs, /function renderOverlayShortcut/);
assert.match(popupJs, /name === "toggle-call-overlays"/);
assert.match(popupJs, /save\(\{ callOverlaysVisible: this\.checked \}\)/);

assert.match(content, /config\.callOverlaysVisible === false/);
assert.match(content, /runtimeMarker\.dispose = deactivateForHotload/);
assert.match(content, /prepareCloudRuntimeReplacement/);
assert.match(content, /staleEarningsOverlay = document\.getElementById\("signal-interpreter-earnings-overlay"\)/);
const recovery = background.slice(background.indexOf("async function recoverAfterRuntimeBoundary"), background.indexOf("async function scheduleSafeRuntimeReload"));
assert.ok(recovery.includes('prepareCloudRuntimeReplacement(callTabId'),
  "active-call recovery must clean the previous runtime before injecting the new one");

assert.match(caption, /config\.callOverlaysVisible === false/);
const actualPipelineGate = caption.indexOf('if (config.liveCaptionOverlayEnabled === false)');
const visualOnlyGate = caption.indexOf('if (config.callOverlaysVisible === false)');
assert.ok(actualPipelineGate >= 0 && visualOnlyGate > actualPipelineGate,
  "master hide is a separate visual gate after the transcription preference check");
assert.doesNotMatch(caption, /callOverlaysVisible\s*=\s*false[\s\S]{0,300}liveCaptionOverlayEnabled\s*=\s*false/,
  "hiding overlays must never disable caption pipeline");

console.log("OVERLAY_GLOBAL_CONTROL_AND_REINJECTION=PASS");
