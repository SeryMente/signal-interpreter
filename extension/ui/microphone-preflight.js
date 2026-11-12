(function (root) {
  "use strict";
  var MAX_TEST_DURATION_MS = 15000;
  function create(options) {
    options = options || {};
    var mediaDevices = options.mediaDevices || (root.navigator && root.navigator.mediaDevices);
    var AudioContextCtor = options.AudioContext || root.AudioContext || root.webkitAudioContext;
    var raf = options.requestAnimationFrame || root.requestAnimationFrame || function (fn) { return root.setTimeout(fn, 16); };
    var caf = options.cancelAnimationFrame || root.cancelAnimationFrame || root.clearTimeout;
    var setTimer = options.setTimeout || root.setTimeout;
    var clearTimer = options.clearTimeout || root.clearTimeout;
    var elements = options.elements || {};
    var state = "idle", generation = 0, stream = null, audioContext = null;
    var sourceNode = null, analyser = null, frameId = null, timeoutId = null;
    function setUi(nextState, message) {
      state = nextState;
      if (elements.status) elements.status.textContent = message || "";
      if (elements.badge) {
        elements.badge.textContent = nextState === "testing" ? "PROBANDO" : nextState === "requesting" ? "SOLICITANDO" : nextState === "failed" ? "REVISAR" : "LISTO";
        elements.badge.setAttribute("data-state", nextState);
      }
      if (elements.startButton) elements.startButton.disabled = nextState === "requesting" || nextState === "testing";
      if (elements.stopButton) elements.stopButton.disabled = nextState !== "testing";
      if (elements.meter && nextState !== "testing") elements.meter.value = 0;
      if (elements.level && nextState !== "testing") elements.level.textContent = "0%";
    }
    function releaseTracks(targetStream) {
      if (!targetStream || typeof targetStream.getTracks !== "function") return;
      targetStream.getTracks().forEach(function (track) {
        try { track.onended = null; } catch (_) {}
        try { track.stop(); } catch (_) {}
      });
    }
    function permissionError(error) {
      var name = String(error && error.name || "");
      if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") return "Chrome bloqueó el permiso. Autoriza el micrófono para Signal Interpreter y vuelve a probar.";
      if (name === "NotFoundError" || name === "DevicesNotFoundError") return "Chrome no encontró un micrófono disponible. Revisa el dispositivo de entrada.";
      if (name === "NotReadableError" || name === "TrackStartError") return "El micrófono está ocupado o no puede abrirse. Cierra otras aplicaciones que lo estén usando.";
      if (!mediaDevices || typeof mediaDevices.getUserMedia !== "function") return "Este contexto de Chrome no permite acceder al micrófono. Abre la extensión desde Chrome.";
      return "No se pudo iniciar la prueba local del micrófono. Revisa el dispositivo y el permiso de Chrome.";
    }
    function updateLevel(token) {
      if (token !== generation || state !== "testing" || !analyser) return;
      var samples = new Uint8Array(analyser.fftSize || 1024), sum = 0;
      analyser.getByteTimeDomainData(samples);
      for (var i = 0; i < samples.length; i += 1) { var value = (samples[i] - 128) / 128; sum += value * value; }
      var rms = Math.sqrt(sum / Math.max(1, samples.length));
      var level = Math.max(0, Math.min(1, rms * 7));
      if (elements.meter) elements.meter.value = level;
      if (elements.level) elements.level.textContent = String(Math.round(level * 100)) + "%";
      if (elements.status) elements.status.textContent = rms > 0.008
        ? "Señal detectada. Audio local únicamente; no se envía a la llamada."
        : "Micrófono abierto en prueba local. Habla para comprobar el nivel.";
      frameId = raf(function () { updateLevel(token); });
    }
    function stop(reason) {
      generation += 1;
      if (timeoutId != null) clearTimer(timeoutId);
      timeoutId = null;
      if (frameId != null) caf(frameId);
      frameId = null;
      var oldStream = stream, oldContext = audioContext, oldSource = sourceNode;
      stream = null; audioContext = null; sourceNode = null; analyser = null;
      releaseTracks(oldStream);
      try { if (oldSource && typeof oldSource.disconnect === "function") oldSource.disconnect(); } catch (_) {}
      var message = reason === "timeout"
        ? "Prueba finalizada automáticamente. El micrófono quedó liberado."
        : reason === "device-ended"
          ? "El dispositivo se desconectó. El micrófono quedó liberado."
          : "Prueba detenida. El micrófono quedó liberado.";
      setUi("idle", message);
      if (oldContext && oldContext.state !== "closed" && typeof oldContext.close === "function") {
        try { return Promise.resolve(oldContext.close()).catch(function () {}); } catch (_) {}
      }
      return Promise.resolve();
    }
    async function start() {
      if (state === "requesting" || state === "testing") return false;
      if (!mediaDevices || typeof mediaDevices.getUserMedia !== "function") { setUi("failed", permissionError({ name: "UnsupportedError" })); return false; }
      if (typeof AudioContextCtor !== "function") { setUi("failed", "El navegador no ofrece un medidor de audio compatible."); return false; }
      generation += 1;
      var token = generation, acquiredStream = null, context = null, localSource = null;
      setUi("requesting", "Solicitando permiso de micrófono a Chrome…");
      try {
        context = new AudioContextCtor();
        audioContext = context;
        if (context.state === "suspended" && typeof context.resume === "function") await context.resume();
        if (token !== generation) {
          if (audioContext === context) audioContext = null;
          if (context.state !== "closed" && typeof context.close === "function") await context.close().catch(function () {});
          return false;
        }
        acquiredStream = await mediaDevices.getUserMedia({ audio: true, video: false });
        if (token !== generation) {
          releaseTracks(acquiredStream);
          if (audioContext === context) audioContext = null;
          if (context.state !== "closed" && typeof context.close === "function") await context.close().catch(function () {});
          return false;
        }
        var tracks = acquiredStream && typeof acquiredStream.getAudioTracks === "function" ? acquiredStream.getAudioTracks() : [];
        if (!tracks.length || tracks.every(function (track) { return track.readyState === "ended"; })) throw new Error("No se recibió una pista de audio activa.");
        if (token !== generation) {
          releaseTracks(acquiredStream);
          if (context && typeof context.close === "function") await context.close().catch(function () {});
          return false;
        }
        var localAnalyser = context.createAnalyser();
        localAnalyser.fftSize = 1024;
        localAnalyser.smoothingTimeConstant = 0.15;
        localSource = context.createMediaStreamSource(acquiredStream);
        localSource.connect(localAnalyser);
        stream = acquiredStream; audioContext = context; sourceNode = localSource; analyser = localAnalyser;
        tracks.forEach(function (track) { track.onended = function () { if (token === generation && state === "testing") stop("device-ended"); }; });
        setUi("testing", "Micrófono abierto en prueba local. Habla para comprobar el nivel.");
        timeoutId = setTimer(function () { stop("timeout"); }, MAX_TEST_DURATION_MS);
        updateLevel(token);
        return true;
      } catch (error) {
        releaseTracks(acquiredStream);
        try { if (localSource && typeof localSource.disconnect === "function") localSource.disconnect(); } catch (_) {}
        if (audioContext === context) audioContext = null;
        try { if (context && context.state !== "closed" && typeof context.close === "function") await context.close(); } catch (_) {}
        if (token === generation) setUi("failed", permissionError(error));
        return false;
      }
    }
    var controller = {
      start: start,
      stop: function () { return stop("user"); },
      dispose: function () { return stop("pagehide"); },
      getState: function () { return state; }
    };
    if (elements.startButton && typeof elements.startButton.addEventListener === "function") elements.startButton.addEventListener("click", function () { start(); });
    if (elements.stopButton && typeof elements.stopButton.addEventListener === "function") elements.stopButton.addEventListener("click", function () { controller.stop(); });
    return controller;
  }
  function attachToPopup() {
    if (!root.document || !root.navigator) return;
    var startButton = root.document.getElementById("micPreflightStart");
    var stopButton = root.document.getElementById("micPreflightStop");
    if (!startButton || !stopButton) return;
    var controller = create({
      elements: {
        startButton: startButton, stopButton: stopButton,
        status: root.document.getElementById("micPreflightStatus"),
        badge: root.document.getElementById("micPreflightBadge"),
        meter: root.document.getElementById("micPreflightMeter"),
        level: root.document.getElementById("micPreflightLevel")
      }
    });
    root.addEventListener("pagehide", function () { controller.dispose(); }, { once: true });
    root.addEventListener("beforeunload", function () { controller.dispose(); }, { once: true });
  }
  root.SignalMicrophonePreflight = { create: create, maxTestDurationMs: MAX_TEST_DURATION_MS };
  if (root.document) attachToPopup();
})(window);
