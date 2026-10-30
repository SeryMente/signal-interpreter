import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const background = fs.readFileSync("extension/background.js", "utf8");
const popup = fs.readFileSync("extension/ui/popup.js", "utf8");
assert.equal(manifest.version, "0.10.38");
assert.equal(manifest.commands["toggle-global-overlays"].suggested_key.default, "Ctrl+Shift+8");
assert.equal(Object.hasOwn(manifest.commands, "toggle-call-overlays"), false,
  "do not keep the stale duplicate command from the 0.10.38 branch");
assert.match(background, /command === "toggle-global-overlays"/);
assert.match(background, /config\.overlaysGlobalEnabled = config\.overlaysGlobalEnabled === false/);
assert.match(popup, /command\.name === "toggle-global-overlays"/);
assert.doesNotMatch(background + popup, /Ctrl\+Shift\+Y|toggle-call-overlays/);
console.log("GLOBAL_OVERLAY_HOTKEY_CONSISTENCY=PASS");
