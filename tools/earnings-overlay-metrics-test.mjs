import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync("extension/earnings-overlay-metrics.js", "utf8");
const sandbox = { globalThis: {} };
vm.runInNewContext(source, sandbox);
const metrics = sandbox.globalThis.SignalInterpreterEarningsMetrics;
assert.ok(metrics, "earnings metrics API exported");

assert.equal(metrics.parseCallLengthMinutes("02:30:15"), 150.25);
assert.equal(metrics.parseCallLengthMinutes("12:45"), 12.75);
assert.equal(metrics.parseCallLengthMinutes("1h 30m"), 90);
assert.equal(metrics.parseCallLengthMinutes("45 seconds"), 0.75);
assert.equal(metrics.parseCallLengthMinutes("not a duration"), null);
assert.equal(metrics.parseCallLengthMinutes(null), null);

const now = new Date(2026, 9, 9, 12, 0, 0, 0);
const yesterday = new Date(2026, 9, 8, 23, 50, 0, 0);
const todayStart = new Date(2026, 9, 9, 0, 0, 0, 0);
assert.equal(metrics.periodKey("today", now), "2026-10-09");
assert.equal(metrics.periodKey("currentMonth", now), "2026-10");
assert.equal(metrics.periodKey("previousMonth", now), "2026-09");
assert.equal(metrics.periodKey("year", now), "2026");
assert.equal(metrics.callStartsInPeriod("today", yesterday, now), false);
assert.equal(metrics.activeSecondsInPeriod("today", yesterday, now), 43200);
assert.equal(metrics.activeSecondsInPeriod("today", todayStart, now), 43200);
assert.equal(metrics.activeSecondsInPeriod("previousMonth", yesterday, now), 0);

const monthBoundary = new Date(2026, 8, 30, 23, 30, 0, 0);
const afterMonthBoundary = new Date(2026, 9, 1, 0, 30, 0, 0);
assert.equal(metrics.callStartsInPeriod("currentMonth", monthBoundary, afterMonthBoundary), false);
assert.equal(metrics.activeSecondsInPeriod("currentMonth", monthBoundary, afterMonthBoundary), 1800);
assert.equal(metrics.intervalSecondsInPeriod("currentMonth", monthBoundary, afterMonthBoundary, afterMonthBoundary), 1800);

const yearBoundary = new Date(2025, 11, 31, 23, 30, 0, 0);
const newYear = new Date(2026, 0, 1, 0, 30, 0, 0);
assert.equal(metrics.callStartsInPeriod("year", yearBoundary, newYear), false);
assert.equal(metrics.activeSecondsInPeriod("year", yearBoundary, newYear), 1800);

const finishedToday = new Date(2026, 9, 9, 11, 0, 0, 0);
assert.equal(metrics.intervalSecondsInPeriod("today", yesterday, finishedToday, now), 39600);
console.log("EARNINGS_OVERLAY_METRICS_TEST=PASS");
