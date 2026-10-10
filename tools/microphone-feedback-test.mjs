import assert from "node:assert/strict";
import fs from "node:fs";
const manifest = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8"));
const offscreen = fs.readFileSync("extension/offscreen.js", "utf8");
const background = fs.readFileSync("extension/background.js", "utf8");
assert.equal(manifest.version, "0.10.28");
assert.ok(manifest.content_scripts.some((entry) =>
  entry.js && entry.js.includes("hotkey-fallback.js") &&
  entry.matches && entry.matches.includes("https://*/*") && entry.all_frames === true
));
assert.ok(offscreen.includes('playTone(Math.max(0,Math.min(1,Number(message.volume)||0)),String(message.cue||""))'),
  "offscreen sound handler must forward the requested cue");
assert.ok(offscreen.includes('if(cue==="mute-on"){\n    await tone(523.25,start,.11);\n    await tone(392,start+.12,.13);'),
  "MIC OFF tone uses the confirmed low pitch pair");
assert.ok(offscreen.includes('}else if(cue==="mute-off"){\n    await tone(1046.5,start,.11);\n    await tone(880,start+.12,.13);'),
  "MIC ON tone uses the confirmed high pitch pair");
assert.ok(background.includes('desired?"mute-on":"mute-off"'));
assert.ok(background.includes("outputRecoveredBaseline:!!outputResult.recoveredBaseline"), "microphone error events must expose recovery verification details");
console.log("MICROPHONE_FEEDBACK_TEST=PASS");