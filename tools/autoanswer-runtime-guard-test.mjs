import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync("extension/content.js", "utf8");
const markerStart = source.indexOf("  var RUNTIME_VERSION =");
const markerEnd = source.indexOf("  try { delete window.__SIGNAL_INTERPRETER_CLOUD_V0913__; }");
assert(markerStart >= 0 && markerEnd > markerStart, "runtime marker bootstrap boundaries");
const bootstrap = source.slice(markerStart, markerEnd);

function boot(version, existing) {
  let disposed = [];
  const window = { __SIGNAL_INTERPRETER_CLOUD_RUNTIME__: existing || null };
  const context = {
    window,
    chrome: { runtime: { id: "extension-id", getManifest: () => ({ version }) } },
    document: {
      querySelectorAll: () => [],
      getElementById: () => null
    },
    deactivateForHotload: reason => disposed.push(reason),
    Date
  };
  vm.runInNewContext("(function(){\n" + bootstrap + "\n}).call(this);", context);
  return { marker: window.__SIGNAL_INTERPRETER_CLOUD_RUNTIME__, disposed };
}

let disposed = 0;
const current = {
  extensionId: "extension-id",
  version: "0.10.39",
  active: true,
  dispose: () => { disposed++; }
};
const duplicate = boot("0.10.39", current);
assert.equal(disposed, 0, "same extension and version never disposes the live runtime");
assert.equal(duplicate.marker, current, "same-version injection keeps the existing runtime");
assert.equal(current.duplicateInjectionCount, 1, "duplicate injection is counted without starting another runtime");
assert.ok(current.lastDuplicateInjectionAt, "duplicate injection timestamp is retained");

let upgradeReason = null;
const oldRuntime = {
  extensionId: "extension-id",
  version: "0.10.39",
  active: true,
  dispose: reason => { upgradeReason = reason; }
};
const upgraded = boot("0.10.41", oldRuntime);
assert.equal(upgradeReason, "runtime-upgrade-replaced", "version upgrade disposes the previous runtime");
assert.equal(upgraded.marker.version, "0.10.41", "version upgrade starts the new runtime");

let replacedReason = null;
const otherExtension = {
  extensionId: "another-extension",
  version: "0.10.39",
  active: true,
  dispose: reason => { replacedReason = reason; }
};
boot("0.10.39", otherExtension);
assert.equal(replacedReason, "runtime-upgrade-replaced", "different extension identity is not suppressed");

const presenceStart = source.indexOf("  var presenceState = { armed: false };");
const presenceEnd = source.indexOf("  var route = location.pathname;", presenceStart);
assert(presenceStart >= 0 && presenceEnd > presenceStart, "presence hydration boundaries");
const presenceBootstrap = source.slice(presenceStart, presenceEnd);
async function presenceHarness(readPromise) {
  let stateListener = null;
  let answerChecks = 0;
  const context = {
    chrome: {
      storage: {
        local: { get: () => readPromise },
        onChanged: { addListener: listener => { stateListener = listener; } }
      }
    },
    runtimeMarker: { active: true },
    autoAnswer: () => { answerChecks++; }
  };
  vm.runInNewContext("(function(){\n" + presenceBootstrap + "\nthis.readPresence = () => presenceState;\n}).call(this);", context);
  return {
    context,
    changed: (changes, area = "local") => stateListener(changes, area),
    answerChecks: () => answerChecks
  };
}

let resolveStored;
const storedPromise = new Promise(resolve => { resolveStored = resolve; });
const presence = await presenceHarness(storedPromise);
resolveStored({ signalPresenceGuard: { armed: true, generation: 4, reason: "explicit-availability" } });
await Promise.resolve();
await Promise.resolve();
assert.equal(presence.context.readPresence().armed, true, "stored presence state hydrates before use");
assert.equal(presence.answerChecks(), 1, "hydration wakes the incoming-call detector");
presence.changed({ signalPresenceGuard: { newValue: { armed: false, generation: 5, reason: "manual-pause" } } });
assert.equal(presence.context.readPresence().armed, false, "presence revocation is immediately reflected");
assert.equal(presence.answerChecks(), 2, "presence changes re-run eligibility checks");

const failed = await presenceHarness(Promise.reject(new Error("storage unavailable")));
await new Promise(resolve => setImmediate(resolve));
assert.equal(failed.context.readPresence().armed, false, "storage failure remains fail-closed");
assert.equal(failed.answerChecks(), 0, "failed hydration never arms or runs answer flow");

console.log(JSON.stringify({
  suite: "autoanswer-runtime-guard",
  checks: 15,
  result: "PASS",
  environment: "Node VM / synthetic Chrome APIs"
}));
