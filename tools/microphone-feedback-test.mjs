import assert from "node:assert/strict";
import fs from "node:fs";
const manifest = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8"));
const offscreen = fs.readFileSync("extension/offscreen.js", "utf8");
const background = fs.readFileSync("extension/background.js", "utf8");
assert.equal(manifest.version, "0.10.16");
assert.ok(manifest.content_scripts.some((entry) =>
  entry.js && entry.js.includes("hotkey-fallback.js") &&
  entry.matches && entry.matches.includes("https://*/*") && entry.all_frames === true
));
assert.match(offscreen, /playTone\(Math\.max\(0,Math\.min\(1,Number\(message\.volume\)\|\|0\)\),String\(message\.cue\|\|"''\)\)/,
  "offscreen sound handler must forward the requested cue");
assert.ok(offscreen.includes('await tone(1046.5,start,.11);'));
assert.ok(offscreen.includes('await tone(880,start+.12,.13);'));
assert.ok(offscreen.includes('await tone(523.25,start,.11);'));
assert.ok(offscreen.includes('await tone(392,start+.12,.13);'));
assert.ok(background.includes('desired?"mute-on":"mute-off"'));
console.log("MICROPHONE_FEEDBACK_TEST=PASS");