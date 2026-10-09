import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const manifest = JSON.parse(read("extension/manifest.json"));
const background = read("extension/background.js");
const bootstrap = read("extension/auth-bootstrap.js");
const assist = read("extension/auth-signin-assist.js");
const popupHtml = read("extension/ui/popup.html");
const popupJs = read("extension/ui/popup.js");

assert.equal(manifest.version, "0.10.16");
assert.ok(background.includes('"auth-bootstrap.js"'));
assert.ok(manifest.content_scripts.some((entry) =>
  entry.matches && entry.matches.includes("https://app.cloudinterpreter.com/auth/signin*") &&
  entry.js && entry.js.includes("auth-signin-assist.js")
));
assert.ok(bootstrap.includes('chrome.runtime.onInstalled.addListener'));
assert.ok(bootstrap.includes('chrome.runtime.onStartup.addListener'));
assert.ok(bootstrap.includes('chrome.tabs.create({ url: SIGNIN_URL, active: false })'));
assert.ok(bootstrap.includes('chrome.tabs.update(probeTab.id, { active: true })'));
assert.ok(bootstrap.includes('storeState("authenticated", reason)'));
assert.ok(assist.includes('cloudInterpreterLoginUsername'));
assert.ok(assist.includes("chrome.storage.onChanged.addListener"));
assert.ok(assist.includes('password.focus'));
assert.ok(!assist.includes('setInputValue(password'));
assert.ok(popupHtml.includes('id="cloudInterpreterUsername"'));
assert.ok(popupJs.includes('cloudInterpreterUsername'));
console.log("CLOUD_LOGIN_BOOTSTRAP_TEST=PASS");
