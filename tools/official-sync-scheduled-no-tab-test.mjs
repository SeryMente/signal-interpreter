import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const background = fs.readFileSync("extension/background.js", "utf8");
const helper = background.match(/function syncOfficialPlatformDataScheduled\(\)\s*\{[\s\S]*?\n  \}/);
assert.ok(helper, "scheduled sync wrapper must exist");
assert.match(background, /syncOfficialPlatformDataScheduled\(\)\.then\(function\(result\)/);
assert.match(background, /PLATFORM_OFFICIAL_HOURLY_SYNC_SKIPPED/);
assert.match(helper[0], /no-authenticated-cloud-tab/);
assert.match(helper[0], /CLOUD_TAB_UNAVAILABLE/);
assert.doesNotMatch(helper[0], /chrome\.(tabs|windows)\.(create|update|reload)\(/,
  "scheduled sync must not open, navigate, or reload tabs");

async function exercise(errorMessage) {
  const sandbox = { __result: null, __rejection: null, __queueErrors: [] };
  const prelude = `
    var earningsSyncQueue = Promise.resolve();
    function enqueueEarningsSync(operation, task) {
      var run = earningsSyncQueue.then(task, task);
      earningsSyncQueue = run.catch(function (error) { globalThis.__queueErrors.push(String(error)); });
      return run;
    }
    function syncOfficialPlatformDataUnsafe() {
      return Promise.reject(new Error(${JSON.stringify(errorMessage)}));
    }
  `;
  const call = `
    ${helper[0]}
    syncOfficialPlatformDataScheduled().then(
      function (result) { globalThis.__result = result; },
      function (error) { globalThis.__rejection = String(error); }
    );
  `;
  vm.runInNewContext(prelude + call, sandbox);
  await new Promise((resolve) => setTimeout(resolve, 0));
  return sandbox;
}

const noTab = await exercise("No se pudo sincronizar sin afectar la llamada: abre Cloud Interpreter primero.");
assert.equal(noTab.__result?.skipped, "no-authenticated-cloud-tab");
assert.equal(noTab.__result?.reasonCode, "CLOUD_TAB_UNAVAILABLE");
assert.equal(noTab.__rejection, null);
assert.equal(noTab.__queueErrors.length, 0, "missing tab must not poison the earnings queue");

const genuineFailure = await exercise("network timeout");
assert.equal(genuineFailure.__result, null);
assert.match(genuineFailure.__rejection || "", /network timeout/);
assert.equal(genuineFailure.__queueErrors.length, 1, "real sync failures must remain visible");

console.log("OFFICIAL_SYNC_SCHEDULED_NO_TAB=PASS");
console.log("No-tab scheduled poll skips safely; genuine failures remain observable.");
