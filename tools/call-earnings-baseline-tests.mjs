import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const background = fs.readFileSync("extension/background.js", "utf8");
const mirrorStart = background.indexOf("function mirrorEarningBaseline(mirror, period) {");
const captureStart = background.indexOf("async function captureCallEarningsBaseline(callId, startedAt) {");
const persistStart = background.indexOf("async function persistOfficialStats(tab,readResult,method)");
assert.ok(mirrorStart >= 0 && captureStart > mirrorStart && persistStart > captureStart,
  "No se encontraron los límites de las funciones de baseline");

const storedFns = background.slice(mirrorStart, captureStart) +
  "\n" + background.slice(captureStart, persistStart);
const now = "2026-10-09T18:01:00.000Z";
const startedAt = "2026-10-09T18:00:00.000Z";

function makeContext(initialStore) {
  const store = structuredClone(initialStore);
  const events = [];
  const context = {
    console,
    Date,
    Number,
    Object,
    Array,
    String,
    Math,
    JSON,
    DEFAULT_CONFIG: { opiRatePerMinute: 0.20, vriRatePerMinute: 0.25 },
    baseState: () => ({
      callId: null, callStartedAt: null, callModality: "OPI",
      completedCalls: [], unfinishedCalls: []
    }),
    localDay(value) {
      const date = value == null ? new Date(now) : new Date(value);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return y + "-" + m + "-" + d;
    },
    callLengthToMinutes(value) {
      if (value == null || value === "") return 0;
      const parts = String(value).split(":").map(Number);
      if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
      if (parts.length === 2) return parts[0] + parts[1] / 60;
      const numeric = Number(value);
      return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
    },
    iso: () => now,
    record: (action, payload) => events.push({ action, payload }),
    chrome: {
      storage: {
        local: {
          async get(keys) {
            return Object.fromEntries(keys.filter((key) => key in store).map((key) => [key, store[key]]));
          },
          async set(values) { Object.assign(store, values); }
        }
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(storedFns, context);
  return { context, store, events };
}

function activeState(overrides = {}) {
  return {
    callId: "call-123",
    callStartedAt: startedAt,
    callModality: "OPI",
    completedCalls: [{
      callId: "prior-completed", startedAt: "2026-10-09T17:10:00.000Z",
      estimatedRevenue: 1.75, platformSeconds: 60
    }],
    unfinishedCalls: [{
      callId: "prior-unfinished", startedAt: "2026-10-09T17:20:00.000Z",
      platformSeconds: 120
    }],
    ...overrides
  };
}

const preCallMirror = {
  earnings: {
    today: {
      capturedAt: "2026-10-09T17:59:59.000Z",
      source: "platform-page-context",
      summary: { earnedUsd: 12.34, earned: "$12.34", callCount: 17, callLength: "00:42:00" }
    },
    currentMonth: {
      capturedAt: "2026-10-09T17:59:58.000Z",
      source: "platform-page-context",
      summary: { earnedUsd: 123.45, earned: "$123.45", callCount: 87, callLength: "12:34:00" }
    }
  }
};

{
  const { context, store } = makeContext({
    effectifState: activeState(),
    effectifPlatformMirror: preCallMirror,
    effectifConfig: {}
  });
  assert.equal(await context.captureCallEarningsBaseline("call-123", startedAt), true);
  const captured = store.effectifCallEarnings;
  assert.equal(captured.baselines.today.source, "pre-call-platform-mirror");
  assert.equal(captured.baselines.today.earnedUsd, 12.34);
  assert.equal(captured.baselines.currentMonth.source, "pre-call-platform-mirror");
  assert.equal(captured.baselines.currentMonth.earnedUsd, 123.45);
}

{
  const postCallMirror = {
    earnings: {
      today: {
        capturedAt: "2026-10-09T18:00:10.000Z",
        source: "platform-page-context",
        summary: { earnedUsd: 12.40, earned: "$12.40", callCount: 18, callLength: "00:42:10" }
      },
      currentMonth: {
        capturedAt: "2026-10-09T18:00:11.000Z",
        source: "platform-page-context",
        summary: { earnedUsd: 123.51, earned: "$123.51", callCount: 88, callLength: "12:34:10" }
      }
    }
  };
  const { context, store } = makeContext({
    effectifState: activeState(),
    effectifPlatformMirror: postCallMirror,
    effectifConfig: {}
  });
  assert.equal(await context.captureCallEarningsBaseline("call-123", startedAt), true);
  let captured = store.effectifCallEarnings;
  assert.equal(captured.baselines.today.source, "local-completed-calls");
  assert.equal(captured.baselines.today.earned, null);
  assert.equal(captured.baselines.today.earnedUsd, 1.75);
  assert.equal(captured.baselines.today.callCount, 2);
  assert.equal(captured.baselines.today.minutes, 3);

  // Una segunda captura tras una sincronización no puede sustituir el baseline seguro.
  store.effectifPlatformMirror = postCallMirror;
  assert.equal(await context.captureCallEarningsBaseline("call-123", startedAt), true);
  captured = store.effectifCallEarnings;
  assert.equal(captured.baselines.today.source, "local-completed-calls");
  assert.equal(captured.baselines.today.earnedUsd, 1.75);
}

{
  const unsafeStoredBaseline = {
    callId: "call-123",
    baselines: {
      today: {
        earnedUsd: 88, earned: "$88.00",
        capturedAt: "2026-10-09T18:00:20.000Z", source: "official-sync-fallback"
      },
      currentMonth: {
        earnedUsd: 888, earned: "$888.00",
        capturedAt: "2026-10-09T18:00:20.000Z", source: "official-sync-fallback"
      }
    }
  };
  const { context, store } = makeContext({
    effectifState: activeState(),
    effectifPlatformMirror: {
      earnings: {
        today: {
          capturedAt: "2026-10-09T18:00:25.000Z",
          summary: { earnedUsd: 99, earned: "$99.00", callCount: 99, callLength: "01:00:00" }
        },
        currentMonth: {
          capturedAt: "2026-10-09T18:00:25.000Z",
          summary: { earnedUsd: 999, earned: "$999.00", callCount: 999, callLength: "20:00:00" }
        }
      }
    },
    effectifCallEarnings: unsafeStoredBaseline,
    effectifConfig: {}
  });
  assert.equal(await context.captureCallEarningsBaseline("call-123", startedAt), true);
  assert.equal(store.effectifCallEarnings.baselines.today.source, "local-completed-calls");
  assert.notEqual(store.effectifCallEarnings.baselines.today.earnedUsd, 88);
}

const startCallAt = background.indexOf("function startCall(event)");
const alertAt = background.indexOf("var callAlertInFlight", startCallAt);
assert.ok(startCallAt >= 0 && alertAt > startCallAt, "startCall no encontrado");
const startCall = background.slice(startCallAt, alertAt);
assert.ok(startCall.indexOf("captureCallEarningsBaseline(callId, state.callStartedAt)") <
  startCall.indexOf("syncOfficialPlatformData()"),
  "El baseline debe capturarse antes de la primera sincronización oficial");
assert.match(startCall, /var day = localDay\(measuredStartAt\)/,
  "El conteo diario debe usar el inicio medido de la llamada");

console.log("CALL_EARNINGS_BASELINE_TEST=PASS");
