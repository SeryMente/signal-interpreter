(function (root) {
  "use strict";

  function validDate(value) {
    var date = value && typeof value.getTime === "function" ? new Date(value.getTime()) : new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function parseCallLengthMinutes(value) {
    if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
    var text = String(value == null ? "" : value).trim();
    if (!text) return null;

    if (/^\d{1,3}:\d{2}(?::\d{2}(?:[.,]\d+)?)?$/.test(text)) {
      var parts = text.split(":").map(function (part) { return Number(part.replace(",", ".")); });
      if (parts.some(function (part) { return !Number.isFinite(part) || part < 0; })) return null;
      if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
      return parts[0] + parts[1] / 60;
    }

    var unitPattern = /(\d+(?:[.,]\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/gi;
    var unitMatch, unitTotal = 0, foundUnit = false;
    while ((unitMatch = unitPattern.exec(text)) !== null) {
      foundUnit = true;
      var amount = Number(unitMatch[1].replace(",", "."));
      var unit = unitMatch[2].toLowerCase();
      if (!Number.isFinite(amount) || amount < 0) return null;
      if (/^(h|hr|hrs|hour|hours)$/.test(unit)) unitTotal += amount * 60;
      else if (/^(s|sec|secs|second|seconds)$/.test(unit)) unitTotal += amount / 60;
      else unitTotal += amount;
    }
    if (foundUnit) return unitTotal;

    var numeric = Number(text.replace(",", "."));
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
  }

  function periodBounds(period, reference) {
    var now = validDate(reference == null ? Date.now() : reference);
    if (!now) return null;
    var year = now.getFullYear(), month = now.getMonth(), day = now.getDate();
    var start, end;
    if (period === "today") {
      start = new Date(year, month, day);
      end = new Date(year, month, day + 1);
    } else if (period === "currentMonth") {
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 1);
    } else if (period === "previousMonth") {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 1);
    } else if (period === "year") {
      start = new Date(year, 0, 1);
      end = new Date(year + 1, 0, 1);
    } else {
      return null;
    }
    return { startMs: start.getTime(), endMs: end.getTime(), nowMs: now.getTime() };
  }

  function periodKey(period, reference) {
    var now = validDate(reference == null ? Date.now() : reference);
    if (!now) return null;
    var year = String(now.getFullYear());
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    if (period === "today") return year + "-" + month + "-" + day;
    if (period === "currentMonth") return year + "-" + month;
    if (period === "previousMonth") {
      var previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return String(previous.getFullYear()) + "-" + String(previous.getMonth() + 1).padStart(2, "0");
    }
    if (period === "year") return year;
    return null;
  }

  function callStartsInPeriod(period, startedAt, reference) {
    var start = validDate(startedAt);
    var bounds = periodBounds(period, reference);
    return !!(start && bounds && start.getTime() >= bounds.startMs &&
      start.getTime() < bounds.endMs && start.getTime() <= bounds.nowMs);
  }

  function intervalSecondsInPeriod(period, startedAt, endedAt, reference) {
    var start = validDate(startedAt);
    var bounds = periodBounds(period, reference);
    if (!start || !bounds) return null;
    var end = validDate(endedAt);
    var endMs = end ? end.getTime() : bounds.nowMs;
    var periodEndLimit = period === "previousMonth" ? bounds.endMs : Math.min(bounds.endMs, bounds.nowMs);
    var from = Math.max(start.getTime(), bounds.startMs);
    var to = Math.min(endMs, periodEndLimit);
    return Math.max(0, (to - from) / 1000);
  }

  function activeSecondsInPeriod(period, startedAt, reference) {
    if (period === "previousMonth") return 0;
    return intervalSecondsInPeriod(period, startedAt, reference == null ? Date.now() : reference, reference);
  }

  function elapsedSeconds(startedAt, reference) {
    var start = validDate(startedAt);
    var now = validDate(reference == null ? Date.now() : reference);
    if (!start || !now) return 0;
    return Math.max(0, (now.getTime() - start.getTime()) / 1000);
  }

  function nonnegative(value) {
    if (value == null || value === "") return null;
    var number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function combinePeriodMetrics(period, baseline, fallback, startedAt, ratePerMinute, reference) {
    var now = validDate(reference == null ? Date.now() : reference) || new Date();
    var active = period !== "previousMonth" && !!validDate(startedAt);
    var elapsed = active ? elapsedSeconds(startedAt, now) : 0;
    var inPeriod = active ? activeSecondsInPeriod(period, startedAt, now) : 0;
    var baseMoney = nonnegative(baseline && baseline.earnedUsd);
    if (baseMoney == null) baseMoney = nonnegative(fallback && fallback.earnedUsd);
    if (baseMoney == null) baseMoney = 0;
    var baseCalls = nonnegative(baseline && baseline.callCount);
    if (baseCalls == null) baseCalls = nonnegative(fallback && fallback.callCount);
    if (baseCalls == null) baseCalls = 0;
    var baseMinutes = nonnegative(baseline && baseline.minutes);
    if (baseMinutes == null) baseMinutes = nonnegative(fallback && fallback.minutes);
    if (baseMinutes == null) baseMinutes = 0;
    var activeStartsInPeriod = active && callStartsInPeriod(period, startedAt, now);
    var rate = nonnegative(ratePerMinute);
    if (rate == null) rate = 0;
    var liveUsd = inPeriod / 60 * rate;
    return {
      baseEarnedUsd: baseMoney,
      baseCalls: baseCalls,
      baseMinutes: baseMinutes,
      liveSeconds: elapsed,
      livePeriodSeconds: inPeriod,
      liveUsd: liveUsd,
      activeStartsInPeriod: !!activeStartsInPeriod,
      calls: baseCalls + (activeStartsInPeriod ? 1 : 0),
      periodMinutes: baseMinutes + inPeriod / 60,
      totalUsd: baseMoney + liveUsd
    };
  }

  var api = {
    parseCallLengthMinutes: parseCallLengthMinutes,
    periodBounds: periodBounds,
    periodKey: periodKey,
    callStartsInPeriod: callStartsInPeriod,
    intervalSecondsInPeriod: intervalSecondsInPeriod,
    activeSecondsInPeriod: activeSecondsInPeriod,
    elapsedSeconds: elapsedSeconds
  };
  root.SignalInterpreterEarningsMetrics = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
