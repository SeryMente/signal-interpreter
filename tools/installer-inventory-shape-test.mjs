import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const installer = fs.readFileSync("INSTALAR.ps1", "utf8");
const inventory = JSON.parse(fs.readFileSync("payload-sha256.json", "utf8"));
assert.equal(manifest.version, "0.10.39");
assert.equal(inventory.schema, "signal-interpreter-payload-sha256/v1");
assert.ok(Array.isArray(inventory.files) && inventory.files.length >= 50,
  "payload inventory must expose the full files[] list");
assert.equal(new Set(inventory.files.map((item) => item.path)).size, inventory.files.length,
  "payload paths must be unique");
for (const entry of inventory.files) {
  assert.ok(typeof entry.path === "string" && entry.path.length > 0, "every entry needs one path");
  assert.ok(/^[A-Fa-f0-9]{64}$/.test(entry.sha256), "every entry needs one SHA-256");
}
assert.ok(inventory.files.some((entry) => entry.path === "extension/presence-guard.js"),
  "the newly imported presence guard must be included in the integrity inventory");
assert.match(installer, /signal-interpreter-payload-sha256\/v1/);
assert.match(installer, /\$inventory\.PSObject\.Properties\['files'\]/);
assert.match(installer, /No native host or registry values were changed/);
assert.match(installer, /Payload SHA-256 mismatch/);
console.log("INSTALLER_PAYLOAD_INVENTORY_SHAPE=PASS");
