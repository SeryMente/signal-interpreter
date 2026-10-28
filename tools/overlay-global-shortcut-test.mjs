import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const background = fs.readFileSync("extension/background.js", "utf8");
const content = fs.readFileSync("extension/content.js", "utf8");
const caption = fs.readFileSync("extension/live-caption-overlay.js", "utf8");
const popup = fs.readFileSync("extension/ui/popup.js", "utf8");
const html = fs.readFileSync("extension/ui/popup.html", "utf8");

assert.equal(manifest.version, "0.10.38");
assert.equal(manifest.commands["toggle-call-overlays"].suggested_key.default, "Ctrl+Shift+Y");
assert.match(background, /command === "toggle-call-overlays"/);
assert.match(background, /config\.overlaysVisible = config\.overlaysVisible === false/);
assert.match(content, /existingRuntimeMarker\.dispose\("runtime-replaced"\)/);
assert.match(content, /querySelectorAll\("#signal-interpreter-earnings-overlay"\)/);
assert.match(content, /function pruneDuplicateEarningsOverlays\(\)/);
assert.match(content, /config\.overlaysVisible === false/);
assert.match(caption, /previousOverlayRuntime\.dispose\("runtime-reinjected"\)/);
assert.match(caption, /querySelectorAll\("#signal-interpreter-live-caption-overlay"\)/);
assert.match(caption, /config\.overlaysVisible === false/);
assert.match(popup, /allOverlaysVisible/);
assert.match(popup, /save\(\{ overlaysVisible: this\.checked \}\)/);
assert.match(popup, /command\.name === "toggle-call-overlays"/);
assert.match(html, /id="allOverlaysVisible"/);
assert.match(html, /id="overlayShortcutStatus"/);
assert.match(background, /if \(command !== "toggle-auto-answer"\) return;/,
  "the global overlay shortcut must preserve Auto-Answer's existing command branch");
console.log("OVERLAY_GLOBAL_SHORTCUT_HOTLOAD_SINGLETON=PASS");
