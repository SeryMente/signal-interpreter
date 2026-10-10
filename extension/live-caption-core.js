(function (root) {
  "use strict";

  function normalizeText(value) {
    return String(value == null ? "" : value)
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
  }

  function detectLanguage(value) {
    var text = normalizeText(value).toLowerCase();
    if (!text) return "unknown";
    var wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount < 3) return "unknown";

    var spanishMarkers = [
      " el ", " la ", " los ", " las ", " de ", " del ", " que ", " para ",
      " por ", " con ", " una ", " un ", " es ", " está ", " esto ", " como ",
      " porque ", " puedo ", " necesito ", " tiene ", " usted ", " nosotros ",
      " gracias ", " dónde ", " cómo ", " qué "
    ];
    var englishMarkers = [
      " the ", " a ", " an ", " of ", " to ", " for ", " with ", " is ", " are ",
      " was ", " were ", " and ", " or ", " this ", " that ", " can ", " need ",
      " have ", " has ", " you ", " your ", " we ", " thank ", " where ", " how ",
      " what "
    ];

    var padded = " " + text + " ";
    var es = spanishMarkers.reduce(function (score, marker) {
      return score + (padded.indexOf(marker) >= 0 ? 1 : 0);
    }, 0);
    var en = englishMarkers.reduce(function (score, marker) {
      return score + (padded.indexOf(marker) >= 0 ? 1 : 0);
    }, 0);

    if (/[áéíóúüñ¿¡]/i.test(text)) es += 2;
    if (/\b(?:el|la|los|las|una|uno|usted|ustedes|necesito|puedo|tengo)\b/i.test(text)) es += 2;
    if (/\b(?:the|this|that|you|your|can|need|have|please|thank)\b/i.test(text)) en += 2;

    if (es === en) return "unknown";
    return es > en ? "es" : "en";
  }

  function normalizeLanguage(value) {
    var language = String(value == null ? "" : value).trim().toLowerCase().replace(/_/g, "-");
    if (!language) return "unknown";
    if (typeof language.normalize === "function") {
      language = language.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    if (/^(?:en|eng|english)(?:$|[-\\s(])/.test(language)) return "en";
    if (/^(?:es|spa|spanish|espanol|castellano)(?:$|[-\\s(])/.test(language)) return "es";
    return "unknown";
  }

  function resolveLanguage(language, text) {
    var normalized = normalizeLanguage(language);
    if (normalized === "en" || normalized === "es") return normalized;
    return detectLanguage(text);
  }

  function wordOverlap(previous, next) {
    var a = normalizeText(previous).toLowerCase().split(/\s+/).filter(Boolean);
    var b = normalizeText(next).toLowerCase().split(/\s+/).filter(Boolean);
    var limit = Math.min(a.length, b.length);
    for (var size = limit; size >= 2; size -= 1) {
      var matches = true;
      for (var i = 0; i < size; i += 1) {
        if (a[a.length - size + i] !== b[i]) { matches = false; break; }
      }
      if (matches) return size;
    }
    return 0;
  }

  function captionRelation(previous, next) {
    var a = normalizeText(previous);
    var b = normalizeText(next);
    if (!a || !b) return "new";
    var left = a.toLowerCase();
    var right = b.toLowerCase();
    if (left === right) return "duplicate";
    if (right.indexOf(left) === 0) return "progressive";
    if (left.indexOf(right) === 0) return "stale";
    if (wordOverlap(a, b) >= 2) return "overlap";
    var leftWords = left.split(/\s+/);
    var rightWords = right.split(/\s+/);
    var commonPrefix = 0;
    while (commonPrefix < leftWords.length && commonPrefix < rightWords.length &&
      leftWords[commonPrefix] === rightWords[commonPrefix]) commonPrefix += 1;
    if (commonPrefix >= 4) return b.length >= a.length ? "progressive" : "stale";
    return "new";
  }

  function mergeCaptionText(previous, next) {
    var a = normalizeText(previous);
    var b = normalizeText(next);
    var relation = captionRelation(a, b);
    if (relation === "duplicate" || relation === "stale") return a;
    if (relation === "progressive") return b;
    if (relation === "overlap") {
      var overlap = wordOverlap(a, b);
      var words = b.split(/\s+/);
      return normalizeText(a + " " + words.slice(overlap).join(" "));
    }
    return b;
  }

  function createLatestOnlyDispatcher(processor, onReplace) {
    var channels = Object.create(null);
    function getChannel(source) {
      var key = source === "yo" ? "yo" : "cliente";
      if (!channels[key]) channels[key] = { running: false, pending: null, replaced: 0 };
      return { key: key, value: channels[key] };
    }
    function drain(channel, message) {
      return Promise.resolve().then(function () { return processor(message); }).finally(function () {
        var next = channel.pending;
        channel.pending = null;
        if (next) return drain(channel, next);
        channel.running = false;
      });
    }
    function enqueue(message) {
      if (!message || typeof message !== "object") return Promise.resolve({ skipped: true });
      var channel = getChannel(message.source).value;
      if (channel.running) {
        channel.pending = message;
        channel.replaced += 1;
        if (typeof onReplace === "function") {
          try { onReplace(message.source === "yo" ? "yo" : "cliente", channel.replaced); } catch (_) {}
        }
        return Promise.resolve({ queued: true, replaced: true });
      }
      channel.running = true;
      return drain(channel, message);
    }
    function status() {
      var result = {};
      Object.keys(channels).forEach(function (key) {
        result[key] = {
          running: !!channels[key].running,
          pending: !!channels[key].pending,
          replaced: Number(channels[key].replaced || 0)
        };
      });
      return result;
    }
    return { enqueue: enqueue, status: status };
  }

  function roleForLanguage(language) {
    if (language === "en") return "CLIENTE";
    if (language === "es") return "LEP";
    return "INTERVENCIÓN";
  }

  function roleForSource(source, language) {
    if (source === "yo") return "LEP";
    if (source === "cliente" || source === "chrome-live-caption") return "CLIENTE";
    return roleForLanguage(language);
  }

  function languageLabel(language) {
    if (language === "en") return "ENGLISH";
    if (language === "es") return "ESPAÑOL";
    return "LIVE";
  }

  function findSmartTokens(value) {
    var text = normalizeText(value);
    var candidates = [];
    function collect(pattern, type) {
      pattern.lastIndex = 0;
      var match;
      while ((match = pattern.exec(text))) {
        var value = match[0].trim();
        if (!value) continue;
        if (type === "phone") {
          var digits = value.replace(/\D/g, "").length;
          if (digits < 7 || digits > 15) continue;
          if (/^\d{4}[-.]\d{1,2}[-.]\d{1,2}$/.test(value) ||
              /^\d{1,2}[-.]\d{1,2}[-.]\d{2,4}$/.test(value)) continue;
          if (!/[+().\s-]/.test(value) && digits !== 10 && digits !== 11) continue;
        }
        var start = match.index + match[0].indexOf(value);
        candidates.push({ type: type, text: value, start: start, end: start + value.length });
        if (match[0].length === 0) pattern.lastIndex += 1;
      }
    }
    collect(/(?<![\d().-])\b\d{1,6}\s+(?:[\p{L}\d.'#-]+\s+){1,5}(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|court|ct\.?|way|highway|hwy\.?|parkway|pkwy\.?|place|pl\.?|terrace|trail|circle|plaza)\b(?:\s*,?\s*(?:apt\.?|suite|unit|#)\s*[\p{L}\d-]+)?(?:\s*,\s*[\p{L}\d '-]{2,35}){0,2}/giu, "address");
    collect(/\b(?:calle|avenida|av\.?|carrera|cra\.?|calzada|boulevard|blvd\.?|paseo|privada|prolongación|prol\.?|circuito|carretera|camino|andador|cerrada|retorno|periférico|eje)\s+[\p{L}\d .'-]{2,45}?\s+(?:n[úu]m(?:ero)?\.?\s*|no\.?\s*|#\s*)?\d{1,6}(?:[A-Za-z]\d{0,4})?(?:\s*,\s*(?:col(?:onia)?\.?|fracc(?:ionamiento)?\.?|cp|c\.?p\.?)\s*[\p{L}\d '-]{2,35})?(?:\s*,\s*[\p{L}\d '-]{2,35}){0,2}/giu, "address");
    collect(/(?:\+\s*)?\(?\d(?:[\d().\s-]{5,}\d)\)?(?:\s*(?:ext\.?|x|anexo)\s*\d{1,6})?/giu, "phone");
    candidates.sort(function (a, b) {
      return a.start - b.start || (a.type === "address" ? -1 : 1) || b.end - a.end;
    });
    var result = [];
    candidates.forEach(function (candidate) {
      if (result.some(function (prior) {
        return candidate.start < prior.end && candidate.end > prior.start;
      })) return;
      result.push(candidate);
    });
    return result.sort(function (a, b) { return a.start - b.start; });
  }

  function isCloudInterpreterCallRoute(hostname, pathname) {
    var host = String(hostname == null ? "" : hostname).toLowerCase().replace(/\.$/, "");
    var path = String(pathname == null ? "" : pathname);
    return host === "app.cloudinterpreter.com" && /^\/call\/[^/?#]+\/?$/.test(path);
  }

  function overlapRatio(a, b) {
    var left = Math.max(a.left, b.left);
    var top = Math.max(a.top, b.top);
    var right = Math.min(a.right, b.right);
    var bottom = Math.min(a.bottom, b.bottom);
    if (right <= left || bottom <= top) return 0;
    var area = (right - left) * (bottom - top);
    return area / Math.max(1, a.width * a.height);
  }

  function choosePositionCandidate(candidates, controls, width, height) {
    var choices = Array.isArray(candidates) ? candidates : [];
    var rects = Array.isArray(controls) ? controls : [];
    var w = Math.max(1, Number(width) || 1);
    var h = Math.max(1, Number(height) || 1);
    if (!choices.length) return null;
    var best = null;
    var bestScore = Infinity;
    choices.forEach(function (candidate) {
      var left = Number(candidate.left) || 0;
      var top = Number(candidate.top) || 0;
      var rect = {
        left: left, top: top, right: left + w, bottom: top + h, width: w, height: h
      };
      var score = rects.reduce(function (sum, control) {
        var controlArea = Math.max(1, Number(control.width || (control.right - control.left)) *
          Number(control.height || (control.bottom - control.top)));
        var weight = controlArea < 1800 ? 1.5 : 1;
        return sum + overlapRatio(rect, control) * weight;
      }, 0);
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    });
    return best;
  }

  root.SignalCaptionCore = {
    normalizeText: normalizeText,
    detectLanguage: detectLanguage,
    normalizeLanguage: normalizeLanguage,
    resolveLanguage: resolveLanguage,
    captionRelation: captionRelation,
    mergeCaptionText: mergeCaptionText,
    createLatestOnlyDispatcher: createLatestOnlyDispatcher,
    roleForLanguage: roleForLanguage,
    roleForSource: roleForSource,
    languageLabel: languageLabel,
    findSmartTokens: findSmartTokens,
    overlapRatio: overlapRatio,
    choosePositionCandidate: choosePositionCandidate,
    isCloudInterpreterCallRoute: isCloudInterpreterCallRoute
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
