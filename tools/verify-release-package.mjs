import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expectedVersion = "0.10.39";
const readText = (p) => readFileSync(resolve(root, p), "utf8");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const manifest = JSON.parse(readText("manifest.json"));
const installer = readText("INSTALAR.ps1");
const inventory = JSON.parse(readText("payload-sha256.json"));
const entries = Array.isArray(inventory) ? inventory : inventory.files;

assert.equal(manifest.name, "Signal Interpreter");
assert.equal(manifest.version, expectedVersion, "manifest version is not the package version");
assert.ok(Array.isArray(entries) && entries.length >= 50, "payload inventory is empty or unexpectedly small");
assert.ok(installer.includes("'"+expectedVersion+"'"), "installer and manifest versions differ");

const keyDigest = createHash("sha256").update(Buffer.from(manifest.key, "base64")).digest().subarray(0, 16);
const extensionId = Array.from(keyDigest, (byte) =>
  String.fromCharCode(97 + (byte >> 4), 97 + (byte & 15))).join("");
assert.equal(extensionId, "ldpbjhobnfgmhdoehehdmnbhhjckebmj", "Chrome extension identity changed");

const seen = new Set();
for (const entry of entries) {
  assert.ok(entry && typeof entry.path === "string" && typeof entry.sha256 === "string", "malformed inventory entry");
  assert.match(entry.sha256, /^[A-F0-9]{64}$/i, "malformed SHA-256: " + entry.path);
  assert.ok(!isAbsolute(entry.path) && !entry.path.split(/[\\/]/).includes(".."), "unsafe path: " + entry.path);
  const full = resolve(root, entry.path);
  const rel = relative(root, full);
  assert.ok(rel && rel !== ".." && !rel.startsWith(".." + sep), "path escapes package root: " + entry.path);
  assert.ok(!seen.has(entry.path.toLowerCase()), "duplicate inventory path: " + entry.path);
  seen.add(entry.path.toLowerCase());
  assert.ok(existsSync(full), "missing payload file: " + entry.path);
  assert.equal(sha256(readFileSync(full)), entry.sha256.toUpperCase(), "SHA-256 mismatch: " + entry.path);
}

const commands = manifest.commands || {};
assert.ok(commands["toggle-global-overlays"], "global overlays keyboard command is absent");
assert.equal(commands["toggle-global-overlays"].suggested_key.default, "Ctrl+Shift+8");
const popup = readText("extension/ui/popup.html");
const popupJs = readText("extension/ui/popup.js");
const background = readText("extension/background.js");
const earnings = readText("extension/content.js");
const captions = readText("extension/live-caption-overlay.js");
assert.ok(popup.includes('id="overlaysGlobalEnabled"'), "global overlay switch is absent from popup");
assert.ok(popup.includes('id="overlayShortcutStatus"'), "global shortcut status is absent from popup");
assert.ok(popupJs.includes('save({ overlaysGlobalEnabled: this.checked })'), "global toggle is not persisted");
assert.ok(popupJs.includes('renderOverlayShortcut'), "global shortcut assignment is not surfaced");
assert.ok(background.includes('command === "toggle-global-overlays"'), "background does not handle overlay shortcut");
assert.ok(background.includes("config.overlaysGlobalEnabled = config.overlaysGlobalEnabled === false"), "shortcut does not invert global state");
assert.ok(earnings.includes("existingRuntimeMarker.dispose") && earnings.includes("if (!runtimeMarker.active) return;"), "earnings overlay hotload disposal guard is absent");
assert.ok(earnings.includes('document.querySelectorAll("#signal-interpreter-earnings-overlay")'), "stale earnings overlays are not removed");
assert.ok(captions.includes("previousOverlayRuntime.dispose") && captions.includes("function disposeOverlay"), "caption overlay hotload disposal is absent");
assert.ok(captions.includes("config.overlaysGlobalEnabled !== false"), "caption overlay does not honor the global visibility switch");
assert.ok(installer.includes("ConvertFrom-Json -InputObject $inventoryText"), "installer is not parsing inventory explicitly");
assert.ok(installer.includes("$inventory -is [System.Array]"), "installer does not support legacy array inventories");
assert.ok(installer.includes("signal-interpreter-payload-sha256/v1"), "installer does not validate the current inventory schema");
assert.ok(existsSync(resolve(root, "PREPARAR-Y-CARGAR.cmd")), "one-step preparation command is missing");
assert.ok(existsSync(resolve(root, "tools/probe-caption-host.ps1")), "native host protocol probe is missing");

const registration = readText("extension/native/register-caption-host.ps1");
const match = registration.match(/ExpectedSha256\s*=\s*"([a-f0-9]{64})"/i);
assert.ok(match, "native host expected SHA-256 is missing");
const embeddedExe = Buffer.from(readText("extension/native/SignalInterpreter.CaptionHost.exe.b64").trim(), "base64");
assert.equal(sha256(embeddedExe), match[1].toUpperCase(), "embedded native host executable hash mismatch");

console.log("PASS: package inventory and SHA-256 (" + entries.length + " files)");
console.log("PASS: manifest identity/version and native host binary hash");
console.log("PASS: global overlay switch/shortcut and hotload-disposal guards");
console.log("PASS: installer inventory schema compatibility (static contract)");
console.log("NOTE: this test does not exercise Chrome or a live call.");
