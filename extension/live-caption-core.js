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
    var normalized = language.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalized === "en" || normalized === "eng" || normalized === "english" || /^en(?:-|$)/.test(normalized)) {
      return "en";
    }
    if (normalized === "es" || normalized === "spa" || normalized === "spanish" ||
        normalized === "espanol" || normalized === "castellano" || /^es(?:-|$)/.test(normalized)) {
      return "es";
    }
    return "unknown";
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

  function overlapRatio(a, b) {
    var left = Math.max(a.left, b.left);
    var top = Math.max(a.top, b.top);
    var right = Math.min(a.right, b.right);
    var bottom = Math.min(a.bottom, b.bottom);
    if (right <= left || bottom <= top) return 0;
    var area = (right - left) * (bottom - top);
    return area / Math.max(1, a.width * a.height);
  }

  root.SignalCaptionCore = {
    normalizeText: normalizeText,
    detectLanguage: detectLanguage,
    normalizeLanguage: normalizeLanguage,
    roleForLanguage: roleForLanguage,
    roleForSource: roleForSource,
    languageLabel: languageLabel,
    overlapRatio: overlapRatio
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
