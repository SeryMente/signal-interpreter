import assert from "node:assert/strict";
import fs from "node:fs";

const installer = fs.readFileSync("INSTALAR.ps1", "utf8");
const inventory = JSON.parse(fs.readFileSync("payload-sha256.json", "utf8"));
assert.ok(inventory.length >= 50, "inventory must contain the complete extension payload");
assert.equal(new Set(inventory.map((item) => item.path)).size, inventory.length, "payload paths must be unique");
for (const entry of inventory) {
  assert.ok(typeof entry.path === "string" && entry.path.length > 0, "each payload entry needs one path");
  assert.ok(/^[A-Fa-f0-9]{64}$/.test(entry.sha256), "each payload entry needs one SHA-256");
}
assert.match(installer, /\$inventoryJson\s*=\s*\[IO\.File\]::ReadAllText/);
assert.match(installer, /function Add-PayloadInventoryItems/);
assert.match(installer, /\$script:payloadEntries\.Add\(\$Value\)/);
assert.match(installer, /Payload SHA-256 inventory is incomplete/);
assert.match(installer, /Payload SHA-256 inventory entry is malformed/);
console.log("INSTALLER_PAYLOAD_INVENTORY_SHAPE=PASS");
