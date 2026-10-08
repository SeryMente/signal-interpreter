(function (root) {
  "use strict";

  function validDate(value) {
    var date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function localDateKey(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function clock(date) {
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  function formatMoment(value, emptyLabel, nowValue) {
    var date = validDate(value);
    if (!date) return emptyLabel || "No registrado";

    var now = validDate(nowValue) || new Date();
    var deltaMs = Math.max(0, now.getTime() - date.getTime());
    var deltaMinutes = Math.floor(deltaMs / 60000);
    var today = localDateKey(date) === localDateKey(now);

    if (today) {
      if (deltaMinutes <= 0) return "ahora";
      if (deltaMinutes < 60) return "hace " + deltaMinutes + " min";

      var hours = Math.floor(deltaMinutes / 60);
      var minutes = deltaMinutes % 60;
      return minutes ? "hace " + hours + " h " + minutes + " min" : "hace " + hours + " h";
    }

    var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (localDateKey(date) === localDateKey(yesterday)) {
      return "ayer · " + clock(date);
    }

    var dayDelta = Math.floor(
      (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
       new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86400000
    );

    if (dayDelta > 1 && dayDelta < 7) {
      var weekday = date.toLocaleDateString("es-MX", { weekday: "long" });
      return weekday.charAt(0).toUpperCase() + weekday.slice(1) + " · " + clock(date);
    }

    var sameYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleDateString("es-MX", sameYear
      ? { day: "numeric", month: "short" }
      : { day: "numeric", month: "short", year: "numeric" }) + " · " + clock(date);
  }

  root.SignalInterpreterTime = { formatMoment: formatMoment };
})(typeof globalThis !== "undefined" ? globalThis : self);
