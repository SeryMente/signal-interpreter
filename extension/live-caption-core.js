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
      " the ", " an ", " of ", " to ", " for ", " with ", " is ", " are ",
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

  // Local conservative language spans, NOT speaker diarization. No text leaves Chrome.
  var spanEnglish = new Set(("the you your we with and for is are was were this that can need have please thank thanks where how what yes hello goodbye appointment patient tomorrow today pickup pick up before beforehand return time times hour hours driver address help happy research members member date birth first last name repeat question questions calling waiting provide not do does did cannot know much than on file they their arrive arrival send text message my assistance medical transportation number area code from at of to ask may me would will then all right going scheduled am pm enjoy afternoon evening morning anything else welcome logged searching found showing makes soon says as it be being been assistance offer options self service sorry i english eight ten four one two three five six seven nine forty thirty fifteen twenty eight no wonderful available available" ).split(/\s+/));
  var spanSpanish = new Set(("el la los las que para por del es está esto este esta estas estos porque puedo necesito tiene usted ustedes nosotros gracias dónde cómo qué mire solo sólo quería quiero confirmar viaje pedí mañana siempre mandan correo ahí ahi horario todo pero no he recibido nada eso tengo duda si sí hizo hecho nombre mamá mama fecha nacimiento número numero área ocho diez cuatro dos tres uno una cinco seis siete nueve cuarenta treinta quince veinte cita creo verificar venida venir traer acuerdo dijeron muchacho dijo iban más mas cuarto entonces me pueden decirle algo tenemos estar listas desde digamos enseguida esperar gustaría gustaria mandaran dígale digale haga favor electrónico electronico también tambien tampoco mensaje pudiera mandar importante atender atenderme atendernos noche hasta luego bueno buenas buenos disculpe perdón perdon muchas muy bien mi mis su sus se al era en lo le y hay hacer favor español espanol ahora antes después despues minutos minuto horario hora horas quiero solicitud tengo pregunta preguntas ayuda ayudar transporte transporte" ).split(/\s+/));
  function wordLanguage(word) {
    var value = String(word || "").toLowerCase();
    var en = spanEnglish.has(value), es = spanSpanish.has(value);
    // Ambiguous words (a/no/me/...) must not be English evidence by themselves.
    if (en && es) return "unknown";
    if (es || /[áéíóúüñ¿¡]/i.test(value)) return "es";
    if (en) return "en";
    return "unknown";
  }
  function segmentCaptionText(value) {
    var text = normalizeText(value);
    if (!text) return [];
    var parts = text.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*|\d+(?:[.,:]\d+)*|[^\s]|\s+/gu) || [];
    var hints = parts.map(function (part) { return wordLanguage(part); });
    var present = new Set(hints.filter(function (hint) { return hint !== "unknown"; }));
    var labels = hints.slice();
    for (var i = 0; i < parts.length; i++) {
      if (hints[i] !== "unknown") continue;
      var left = i - 1, right = i + 1;
      while (left >= 0 && hints[left] === "unknown") left--;
      while (right < parts.length && hints[right] === "unknown") right++;
      var before = left >= 0 ? hints[left] : null;
      var after = right < parts.length ? hints[right] : null;
      if (before && before === after) labels[i] = before;
      else if (present.size === 1) labels[i] = before || after || "unknown";
      else if (/^[\s\p{P}]+$/u.test(parts[i])) labels[i] = before || after || "unknown";
      // Unknown words/numbers between different languages remain unassigned;
      // never erase or translate them just to make two apparently pure lanes.
    }
    // Resolve separators against final neighboring word labels, including unknown.
    for (var j = 0; j < parts.length; j++) {
      if (/[\p{L}\p{M}\p{N}]/u.test(parts[j])) continue;
      var prior = j - 1, following = j + 1;
      while (prior >= 0 && !/[\p{L}\p{M}\p{N}]/u.test(parts[prior])) prior--;
      while (following < parts.length && !/[\p{L}\p{M}\p{N}]/u.test(parts[following])) following++;
      var previousLabel = prior >= 0 ? labels[prior] : null;
      var nextLabel = following < parts.length ? labels[following] : null;
      labels[j] = previousLabel === nextLabel ? previousLabel || "unknown" : previousLabel || nextLabel || "unknown";
    }
    var result = [];
    parts.forEach(function (part, index) {
      var language = labels[index] || "unknown", previous = result[result.length - 1];
      if (previous && previous.language === language) previous.text += part;
      else result.push({ text: part, language: language, speakerVerified: false });
    });
    return result;
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
    if (source === "yo") return "INTÉRPRETE";
    if (source === "cliente" || source === "chrome-live-caption") return roleForLanguage(language); // Tab mix: language lane, not physical microphone or speaker verification.
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
    segmentCaptionText: segmentCaptionText,
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
