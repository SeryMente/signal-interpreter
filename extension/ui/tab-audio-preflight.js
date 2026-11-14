(function (root) {
  "use strict";
  var HOST = "app.cloudinterpreter.com";
  function create(options) {
    options = options || {};
    var api = options.chrome || root.chrome;
    var AudioContextCtor = options.AudioContext || root.AudioContext || root.webkitAudioContext;
    var raf = options.requestAnimationFrame || root.requestAnimationFrame || function (fn) { return root.setTimeout(fn, 16); };
    var caf = options.cancelAnimationFrame || root.cancelAnimationFrame || root.clearTimeout;
    var setTimer = options.setTimeout || root.setTimeout;
    var clearTimer = options.clearTimeout || root.clearTimeout;
    var el = options.elements || {};
    var state = "idle", ready = false, disposed = false, tab = null, callState = {};
    var stream = null, context = null, sourceNode = null, analyser = null, gain = null;
    var frame = null, timeout = null, peak = 0, maxRms = 0, signal = false, result = null;
    var generation = 0;

    function ui(next, message) {
      state = next;
      if (el.status) el.status.textContent = message || "";
      if (el.badge) {
        el.badge.textContent = ({idle:"LISTO",preparing:"PREPARANDO",testing:"PROBANDO",captured:"CAPTURA OK",passed:"CONFIRMADO",failed:"REVISAR"})[next] || "LISTO";
        el.badge.setAttribute("data-state", next);
      }
      if (el.startButton) el.startButton.disabled = !ready || disposed || next === "preparing" || next === "testing";
      if (el.stopButton) el.stopButton.disabled = next !== "preparing" && next !== "testing";
      if (el.heardButton) el.heardButton.disabled = next !== "captured";
      if (el.notHeardButton) el.notHeardButton.disabled = next !== "captured";
      var showLevel = next === "captured" || next === "passed" || (next === "failed" && result && result.captured);
      if (el.meter && next !== "testing") el.meter.value = showLevel ? Math.min(1, maxRms * 7) : 0;
      if (el.level && next !== "testing") el.level.textContent = showLevel ? Math.round(Math.min(1, maxRms * 7) * 100) + "%" : "0%";
    }

    function activeCall() {
      var path = "";
      try { path = new URL(String(tab && tab.url || "")).pathname; } catch (_) {}
      return !!(callState && callState.callStartedAt) || /^\/call\/[^/?#]+\/?$/i.test(path);
    }

    function validateTab(candidate) {
      if (!candidate || !Number.isInteger(Number(candidate.id))) return "No se pudo identificar la pestaña activa.";
      var url;
      try { url = new URL(String(candidate.url || "")); } catch (_) { return "Abre Cloud Interpreter en la pestaña activa."; }
      if (url.protocol !== "https:" || url.hostname !== HOST || !/^\/profile\/[^/]+\/?$/i.test(url.pathname)) {
        return "Abre My Profile o la pantalla de espera de Cloud Interpreter. La prueba se limita a esa pantalla.";
      }
      if (candidate.mutedInfo && candidate.mutedInfo.muted) return "La pestaña está silenciada en Chrome. Activa su sonido antes de probar.";
      if (callState && callState.callStartedAt) return "Prueba bloqueada: Signal Interpreter detecta una llamada activa.";
      if (!api || !api.tabCapture || typeof api.tabCapture.capture !== "function") return "Chrome no expone tabCapture. Revisa el permiso de captura de pestaña.";
      if (!api.scripting || typeof api.scripting.executeScript !== "function") return "Chrome no permite inyectar el tono de prueba en esta pestaña.";
      if (typeof AudioContextCtor !== "function") return "AudioContext no está disponible en este contexto.";
      return "";
    }

    async function initialize() {
      if (!api || !api.tabs || !api.storage || !api.storage.local) {
        ui("failed", "No se pudo consultar Chrome desde el popup de la extensión.");
        return false;
      }
      ui("preparing", "Comprobando pestaña activa y estado de llamada…");
      try {
        var values = await Promise.all([
          api.tabs.query({ active: true, lastFocusedWindow: true }),
          api.storage.local.get(["effectifState"])
        ]);
        tab = values[0] && values[0][0] || null;
        callState = values[1] && values[1].effectifState || {};
        var error = validateTab(tab) || (activeCall() ? "La prueba está bloqueada durante una llamada activa." : "");
        ready = !error;
        ui(ready ? "idle" : "failed", error || "Listo. Emitirá un tono sintético desde esta pestaña y lo devolverá a tus auriculares.");
        if (api.storage.onChanged && typeof api.storage.onChanged.addListener === "function") {
          api.storage.onChanged.addListener(function (changes, area) {
            if (area !== "local" || !changes.effectifState) return;
            callState = changes.effectifState.newValue || {};
            if (activeCall() && (state === "idle" || state === "captured")) {
              ready = false;
              ui("failed", "La prueba quedó bloqueada porque Signal Interpreter detectó una llamada activa.");
            }
          });
        }
        if (api.tabs.onUpdated && typeof api.tabs.onUpdated.addListener === "function") {
          api.tabs.onUpdated.addListener(function (tabId, changeInfo, updatedTab) {
            if (tab && Number(tabId) === Number(tab.id)) {
              tab = Object.assign({}, tab, updatedTab || {}, changeInfo || {});
              if (activeCall() && (state === "idle" || state === "captured")) {
                ready = false;
                ui("failed", "La prueba se bloqueó al cambiar la pestaña a una llamada.");
              }
            }
          });
        }
        return ready;
      } catch (error) {
        ready = false;
        ui("failed", "No se pudo validar la pestaña: " + String(error && error.message || error).slice(0, 120));
        return false;
      }
    }

    function release(target) {
      if (!target || typeof target.getTracks !== "function") return;
      target.getTracks().forEach(function (track) {
        try { track.onended = null; } catch (_) {}
        try { track.stop(); } catch (_) {}
      });
    }

    async function cleanup() {
      if (frame != null) caf(frame);
      if (timeout != null) clearTimer(timeout);
      frame = timeout = null;
      var oldStream = stream, oldContext = context, oldSource = sourceNode, oldAnalyser = analyser, oldGain = gain;
      stream = context = sourceNode = analyser = gain = null;
      release(oldStream);
      try { if (oldSource) oldSource.disconnect(); } catch (_) {}
      try { if (oldAnalyser) oldAnalyser.disconnect(); } catch (_) {}
      try { if (oldGain) oldGain.disconnect(); } catch (_) {}
      if (oldContext && oldContext.state !== "closed" && typeof oldContext.close === "function") {
        try { await oldContext.close(); } catch (_) {}
      }
    }

    function permissionText(error) {
      var message = String(error && error.message || error || "");
      if (/tabCapture|capture|permission|denied|not allowed/i.test(message)) {
        return "Chrome no permitió capturar el audio de la pestaña. Revisa el permiso «Capturar audio de pestañas» de Signal Interpreter.";
      }
      return "No se pudo iniciar la prueba: " + message.slice(0, 140);
    }

    function measure(token) {
      if (token !== generation || state !== "testing" || !analyser) return;
      var samples = new Float32Array(analyser.fftSize || 2048);
      if (typeof analyser.getFloatTimeDomainData === "function") {
        analyser.getFloatTimeDomainData(samples);
      } else {
        var bytes = new Uint8Array(samples.length);
        analyser.getByteTimeDomainData(bytes);
        for (var b = 0; b < bytes.length; b += 1) samples[b] = (bytes[b] - 128) / 128;
      }
      var sum = 0;
      for (var i = 0; i < samples.length; i += 1) {
        var value = samples[i], absolute = Math.abs(value);
        if (absolute > peak) peak = absolute;
        sum += value * value;
      }
      var rms = Math.sqrt(sum / Math.max(1, samples.length));
      if (rms > maxRms) maxRms = rms;
      if (peak >= 0.01 && maxRms >= 0.002) signal = true;
      if (el.meter) el.meter.value = Math.min(1, rms * 7);
      if (el.level) el.level.textContent = Math.round(Math.min(1, rms * 7) * 100) + "%";
      frame = raf(function () { measure(token); });
    }

    async function finish(token, reason) {
      if (token !== generation || state !== "testing") return false;
      await cleanup();
      result = {
        captured: signal,
        peak: Number(peak.toFixed(4)),
        rms: Number(maxRms.toFixed(4)),
        reason: reason || (signal ? "capture-ok" : "no-tab-audio")
      };
      if (signal) {
        ui("captured", "Chrome capturó el tono de la pestaña y lo reenvió a la salida. ¿Lo escuchaste en tus auriculares?");
      } else {
        ui("failed", "No se detectó el tono en la captura de la pestaña. No se puede confirmar la salida de audio.");
      }
      return true;
    }

    async function injectTone(token) {
      var response = await api.scripting.executeScript({
        target: { tabId: tab.id, frameIds: [0] },
        world: "ISOLATED",
        func: async function () {
          var Ctor = window.AudioContext || window.webkitAudioContext, ctx = null;
          if (!Ctor) return { ok: false, reason: "audio-context-unavailable" };
          try {
            ctx = new Ctor();
            if (ctx.state === "suspended") await ctx.resume();
            if (ctx.state !== "running") throw new Error("output-suspended");
            var oscillator = ctx.createOscillator(), envelope = ctx.createGain();
            var startAt = ctx.currentTime + 0.06;
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(660, startAt);
            oscillator.frequency.setValueAtTime(880, startAt + 0.52);
            oscillator.frequency.setValueAtTime(660, startAt + 1.02);
            envelope.gain.setValueAtTime(0.0001, startAt);
            envelope.gain.linearRampToValueAtTime(0.13, startAt + 0.04);
            envelope.gain.setValueAtTime(0.13, startAt + 1.18);
            envelope.gain.linearRampToValueAtTime(0.0001, startAt + 1.42);
            oscillator.connect(envelope);
            envelope.connect(ctx.destination);
            await new Promise(function (resolve, reject) {
              oscillator.onended = resolve;
              try { oscillator.start(startAt); oscillator.stop(startAt + 1.45); }
              catch (error) { reject(error); }
            });
            await ctx.close();
            return { ok: true, durationMs: 1450 };
          } catch (error) {
            try { if (ctx && ctx.state !== "closed") await ctx.close(); } catch (_) {}
            return { ok: false, reason: String(error && error.message || error).slice(0, 100) };
          }
        }
      });
      var first = response && response[0] && response[0].result;
      if (token !== generation || state !== "testing") return false;
      if (!first || first.ok !== true) throw new Error(first && first.reason || "test-tone-injection-failed");
      return true;
    }

    function start() {
      if (!ready || disposed || state === "preparing" || state === "testing") return Promise.resolve(false);
      var validation = validateTab(tab);
      if (validation || activeCall()) {
        ready = false;
        ui("failed", validation || "La prueba está bloqueada durante una llamada activa.");
        return Promise.resolve(false);
      }
      generation += 1;
      var token = generation;
      peak = 0; maxRms = 0; signal = false; result = null;
      ui("preparing", "Abriendo captura de audio de la pestaña…");
      var resumePromise;
      try {
        context = new AudioContextCtor();
        resumePromise = context.state === "suspended" && typeof context.resume === "function"
          ? context.resume()
          : Promise.resolve();
      } catch (error) {
        ready = true;
        ui("failed", permissionText(error));
        return Promise.resolve(false);
      }
      return new Promise(function (resolve) {
        try {
          // Must remain in the direct popup click path so Chrome recognizes the user's gesture.
          api.tabCapture.capture({ audio: true, video: false }, async function (capturedStream) {
            var lastError = api.runtime && api.runtime.lastError;
            if (token !== generation || disposed) {
              release(capturedStream);
              resolve(false);
              return;
            }
            if (lastError || !capturedStream) {
              ready = true;
              await cleanup();
              ui("failed", permissionText(lastError || "empty-capture-stream"));
              resolve(false);
              return;
            }
            var tracks = capturedStream.getAudioTracks ? capturedStream.getAudioTracks() : [];
            if (!tracks.length || tracks.every(function (track) { return track.readyState === "ended"; })) {
              release(capturedStream);
              await cleanup();
              ready = true;
              ui("failed", "Chrome abrió una captura vacía; no hay pista de audio de la pestaña.");
              resolve(false);
              return;
            }
            try {
              await resumePromise;
              if (context.state !== "running") throw new Error("audio-context-suspended");
              stream = capturedStream;
              sourceNode = context.createMediaStreamSource(capturedStream);
              analyser = context.createAnalyser();
              analyser.fftSize = 2048;
              analyser.smoothingTimeConstant = 0.12;
              gain = context.createGain();
              gain.gain.value = 0.82;
              sourceNode.connect(analyser);
              sourceNode.connect(gain);
              gain.connect(context.destination);
              tracks.forEach(function (track) {
                track.onended = function () {
                  if (token === generation && state === "testing") finish(token, "tab-capture-ended");
                };
              });
              ui("testing", "Captura activa. Emitiendo tono sintético de diagnóstico desde la pestaña…");
              measure(token);
              await injectTone(token);
              if (token !== generation || state !== "testing") {
                resolve(false);
                return;
              }
              timeout = setTimer(function () { finish(token, "capture-window-complete"); }, 650);
              resolve(true);
            } catch (error) {
              await cleanup();
              ready = true;
              ui("failed", permissionText(error));
              resolve(false);
            }
          });
        } catch (error) {
          cleanup().finally(function () {
            ready = true;
            ui("failed", permissionText(error));
            resolve(false);
          });
        }
      });
    }

    async function stop() {
      if (state !== "testing" && state !== "preparing") return false;
      generation += 1;
      await cleanup();
      ready = true;
      ui("idle", "Prueba detenida. La captura se cerró y no se guardó audio.");
      return true;
    }

    function confirmAudible(heard) {
      if (state !== "captured" || !result || result.captured !== true) return false;
      result.confirmedAudible = heard === true;
      ui(heard === true ? "passed" : "failed", heard === true
        ? "PASS: confirmaste que el tono de la pestaña llegó a tus auriculares."
        : "La captura de pestaña funcionó, pero no escuchaste el tono. La ruta de salida sigue fallando.");
      return true;
    }

    async function dispose() {
      disposed = true;
      generation += 1;
      await cleanup();
      ready = false;
    }

    var controller = {
      initialize: initialize,
      start: start,
      stop: stop,
      confirmAudible: confirmAudible,
      dispose: dispose,
      getState: function () { return state; },
      getResult: function () { return result && Object.assign({}, result); }
    };
    if (el.startButton && typeof el.startButton.addEventListener === "function") el.startButton.addEventListener("click", function () { start(); });
    if (el.stopButton && typeof el.stopButton.addEventListener === "function") el.stopButton.addEventListener("click", function () { stop(); });
    if (el.heardButton && typeof el.heardButton.addEventListener === "function") el.heardButton.addEventListener("click", function () { confirmAudible(true); });
    if (el.notHeardButton && typeof el.notHeardButton.addEventListener === "function") el.notHeardButton.addEventListener("click", function () { confirmAudible(false); });
    return controller;
  }

  function attachToPopup() {
    if (!root.document || !root.chrome) return;
    var startButton = root.document.getElementById("tabAudioPreflightStart");
    var stopButton = root.document.getElementById("tabAudioPreflightStop");
    var heardButton = root.document.getElementById("tabAudioPreflightHeard");
    var notHeardButton = root.document.getElementById("tabAudioPreflightNotHeard");
    if (!startButton || !stopButton || !heardButton || !notHeardButton) return;
    var controller = create({
      elements: {
        startButton: startButton, stopButton: stopButton,
        heardButton: heardButton, notHeardButton: notHeardButton,
        status: root.document.getElementById("tabAudioPreflightStatus"),
        badge: root.document.getElementById("tabAudioPreflightBadge"),
        meter: root.document.getElementById("tabAudioPreflightMeter"),
        level: root.document.getElementById("tabAudioPreflightLevel")
      }
    });
    controller.initialize();
    root.addEventListener("pagehide", function () { controller.dispose(); }, { once: true });
    root.addEventListener("beforeunload", function () { controller.dispose(); }, { once: true });
  }
  root.SignalTabAudioPreflight = { create: create };
  if (root.document) attachToPopup();
})(window);
