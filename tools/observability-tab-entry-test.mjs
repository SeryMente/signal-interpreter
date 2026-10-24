import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(resolve(repoRoot, "extension/background.js"), "utf8");
const start = source.indexOf("chrome.action.onClicked.addListener");
const end = source.indexOf("\n\n  function extensionResource", start);

assert.ok(start >= 0 && end > start, "Could not isolate the production toolbar-action handler.");
const handlerSource = source.slice(start, end);
const expectedUrl = "chrome-extension://test-extension/extension/ui/observability.html";

function runToolbarClick(tabsResult) {
  const calls = { queries: [], updates: [], windowUpdates: [], creates: [] };
  let clickHandler;
  const chrome = {
    action: { onClicked: { addListener(handler) { clickHandler = handler; } } },
    runtime: { getURL(resourcePath) { return "chrome-extension://test-extension/" + resourcePath; } },
    tabs: {
      query(queryInfo, callback) { calls.queries.push(queryInfo); callback(tabsResult); },
      update(tabId, properties) { calls.updates.push({ tabId, properties }); },
      create(properties) { calls.creates.push(properties); }
    },
    windows: { update(windowId, properties) { calls.windowUpdates.push({ windowId, properties }); } }
  };
  vm.runInNewContext(handlerSource, { chrome }, { filename: "extension/background.js#toolbar-action" });
  assert.equal(typeof clickHandler, "function", "The toolbar action must register a click handler.");
  clickHandler();
  return calls;
}

const existingTab = runToolbarClick([{ id: 17, windowId: 4 }]);
assert.equal(existingTab.queries.length, 1);
assert.equal(existingTab.queries[0].url, expectedUrl);
assert.equal(existingTab.updates.length, 1);
assert.equal(existingTab.updates[0].tabId, 17);
assert.equal(existingTab.updates[0].properties.active, true);
assert.equal(existingTab.windowUpdates.length, 1);
assert.equal(existingTab.windowUpdates[0].windowId, 4);
assert.equal(existingTab.windowUpdates[0].properties.focused, true);
assert.equal(existingTab.creates.length, 0);
console.log("TAB_ENTRY_EXISTING_TAB_FOCUS=PASS");

const missingTab = runToolbarClick([]);
assert.equal(missingTab.queries.length, 1);
assert.equal(missingTab.queries[0].url, expectedUrl);
assert.equal(missingTab.creates.length, 1);
assert.equal(missingTab.creates[0].url, expectedUrl);
assert.equal(missingTab.creates[0].active, true);
assert.equal(missingTab.updates.length, 0);
console.log("TAB_ENTRY_CREATE_ACTIVE_TAB=PASS");
console.log("TAB_ENTRY_DEDICATED_URL=PASS");
