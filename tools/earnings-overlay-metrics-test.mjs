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
assert.equal(metrics.activeSecondsInPeriod("today", yesterday, now), 0, "live call is attributed to its start-date period");
assert.equal(metrics.activeSecondsInPeriod("today", todayStart, now), 43200);
assert.equal(metrics.activeSecondsInPeriod("previousMonth", yesterday, now), 0);

const monthBoundary = new Date(2026, 8, 30, 23, 30, 0, 0);
const afterMonthBoundary = new Date(2026, 9, 1, 0, 30, 0, 0);
assert.equal(metrics.callStartsInPeriod("currentMonth", monthBoundary, afterMonthBoundary), false);
assert.equal(metrics.activeSecondsInPeriod("currentMonth", monthBoundary, afterMonthBoundary), 0, "a call started in the prior month is not counted again in the current month");
assert.equal(metrics.callDurationSecondsInPeriod("currentMonth", monthBoundary, afterMonthBoundary, afterMonthBoundary), 0);

const yearBoundary = new Date(2025, 11, 31, 23, 30, 0, 0);
const newYear = new Date(2026, 0, 1, 0, 30, 0, 0);
assert.equal(metrics.callStartsInPeriod("year", yearBoundary, newYear), false);
assert.equal(metrics.activeSecondsInPeriod("year", yearBoundary, newYear), 0, "a call started last year is not included in current-year totals");

const finishedToday = new Date(2026, 9, 9, 11, 0, 0, 0);
assert.equal(metrics.callDurationSecondsInPeriod("today", yesterday, finishedToday, now), 0);
assert.equal(metrics.callDurationSecondsInPeriod("today", todayStart, finishedToday, now), 39600);

const sameDay = metrics.combinePeriodMetrics("today", {
  earnedUsd: 12.5, callCount: 8, minutes: 123.5, periodKey: "2026-10-09", source: "platform-page-context"
}, {
  earnedUsd: 3, callCount: 2, minutes: 10
}, new Date(2026, 9, 9, 11, 30, 0, 0), 0.2, now);
assert.equal(sameDay.baseEarnedUsd, 12.5);
assert.equal(sameDay.calls, 9);
assert.equal(sameDay.livePeriodSeconds, 1800);
assert.equal(sameDay.periodMinutes, 153.5);
assert.equal(sameDay.liveUsd, 6);
assert.equal(sameDay.totalUsd, 18.5);

const activeFromYesterday = metrics.combinePeriodMetrics("today", {
  earnedUsd: 5, callCount: 4, minutes: 60, periodKey: "2026-10-09", source: "platform-page-context"
}, {
  earnedUsd: 2, callCount: 3, minutes: 30
}, yesterday, 0.2, now);
assert.equal(activeFromYesterday.calls, 4, "a call started yesterday must not inflate today's call count");
assert.equal(activeFromYesterday.livePeriodSeconds, 0);
assert.equal(activeFromYesterday.periodMinutes, 60);
assert.equal(activeFromYesterday.liveUsd, 0);
assert.equal(activeFromYesterday.totalUsd, 5);

const priorMonth = metrics.combinePeriodMetrics("previousMonth", {
  earnedUsd: 25, callCount: 10, minutes: 180
}, { earnedUsd: 0, callCount: 0, minutes: 0 }, monthBoundary, 0.2, afterMonthBoundary);
assert.equal(priorMonth.liveSeconds, 0);
assert.equal(priorMonth.livePeriodSeconds, 0);
assert.equal(priorMonth.calls, 10);
assert.equal(priorMonth.periodMinutes, 180);
assert.equal(priorMonth.totalUsd, 25);

console.log("EARNINGS_OVERLAY_METRICS_TEST=PASS");
