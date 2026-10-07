(function () {
  "use strict";
  var DEFAULT_CONFIG = {
    targetHost: "app.cloudinterpreter.com",
    autoAnswerEnabled: true,
    observationEnabled: true,
    networkTelemetryEnabled: true,
    performanceTelemetryEnabled: true,
    interactionTelemetryEnabled: true,
    telemetryRetentionDays: 180,
    telemetryMaxEvents: 250000,
    telemetryHeartbeatSeconds: 30,
    soundEnabled: true,
    volume: 0.8,
    transcriptionAvailable: true,
    transcriptionEnabled: true,
    groqModel: "whisper-large-v3-turbo",
    opiRatePerMinute: 0.20,
    vriRatePerMinute: 0.25,
    currency: "USD",
    billingRule: "pro_rata_by_second_assumed",
    overlayEnabled: true,
    overlayCompact: true,
    usdMxnRate: null,
    exchangeRateDate: null,
    exchangeRateUpdatedAt: null
  };
  var config = Object.assign({}, DEFAULT_CONFIG);
  var state = {};
  var mirror = {};
  var $ = function (id) { return document.getElementById(id); };
  var BUILD_VERSION = chrome.runtime.getManifest().version;
  var BUILD_LABEL = "v" + BUILD_VERSION;
  function status(text, error) {
    $("status").textContent = text;
    $("status").style.color = error ? "#ff8b8b" : "#76d7a5";
  }
  function save(patch) {
    config = Object.assign({}, config, patch);
    chrome.storage.local.set({ effectifConfig: config }, function () {
      render();
      status("Configuración guardada");
    });
  }
  function localDay(value) {
    var date = value ? new Date(value) : new Date();
    if (!Number.isFinite(date.getTime())) date = new Date();
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }
  function duration(start) {
    if (!start) return "00:00:00";
    var parsed = Date.parse(start);
    if (!Number.isFinite(parsed)) return "00:00:00";
    var seconds = Math.max(0, Math.floor((Date.now() - parsed) / 1000));
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var rest = seconds % 60;
    return [hours, minutes, rest].map(function (value) { return String(value).padStart(2, "0"); }).join(":");
  }
  function render() {
    $("enabled").checked = !!config.autoAnswerEnabled;
    $("observation").checked = !!config.observationEnabled;
    $("networkTelemetryEnabled").checked = !!config.networkTelemetryEnabled;
    $("performanceTelemetryEnabled").checked = !!config.performanceTelemetryEnabled;
    $("interactionTelemetryEnabled").checked = !!config.interactionTelemetryEnabled;
    $("telemetryRetentionDays").value = String(config.telemetryRetentionDays || 180);
    $("telemetryMaxEvents").value = String(config.telemetryMaxEvents || 250000);
    $("telemetryHeartbeatSeconds").value = String(config.telemetryHeartbeatSeconds || 30);
    $("overlayEnabled").checked = !!config.overlayEnabled;
    $("volume").value = String(config.volume);
    $("volumeValue").textContent = Math.round(config.volume * 100) + "%";
    $("groqModel").value = config.groqModel || "whisper-large-v3-turbo";
    $("groqStatus").textContent = "Clave local ✓ · " + (config.groqModel || "whisper-large-v3-turbo");
    if ($("telemetryVersion")) $("telemetryVersion").textContent = BUILD_LABEL;
    $("sessionTimer").textContent = duration(state.sessionStartedAt);
    $("onlineTimer").textContent = duration(state.onlineStartedAt);
    $("callTimer").textContent = duration(state.callStartedAt);
    $("endCall").disabled = !state.callStartedAt;
    var today = localDay();
    var completed = Array.isArray(state.completedCalls) ? state.completedCalls.filter(function (call) {
      return localDay(call.startedAt || call.endedAt) === today;
    }) : [];
    $("callsToday").textContent = String(state.dailyCalls && state.dailyCalls[today] || 0);
    $("missedToday").textContent = String(state.dailyMissedCalls && state.dailyMissedCalls[today] || 0);
    var observedCompletedSeconds = completed.reduce(function (sum, call) {
      var seconds = Number(call.platformSeconds);
      if (!Number.isFinite(seconds) || seconds < 0) seconds = Number(call.observedSeconds || 0);
      return sum + Math.max(0, seconds);
    }, 0);
    var liveSecondsForMinutes = state.callStartedAt ? Math.max(0, (Date.now() - Date.parse(state.callStartedAt)) / 1000) : 0;
    $("minutesToday").textContent = ((observedCompletedSeconds + liveSecondsForMinutes) / 60).toFixed(1);
    var completedUsd = completed.reduce(function (sum, call) {
      return sum + Number(call.estimatedRevenue || call.estimatedAmount || 0);
    }, 0);
    var liveSeconds = state.callStartedAt ? Math.max(0, (Date.now() - Date.parse(state.callStartedAt)) / 1000) : 0;
    var liveRate = state.callModality === "VRI" ? Number(config.vriRatePerMinute || 0.25) : Number(config.opiRatePerMinute || 0.20);
    var officialStats = mirror.statistics && mirror.statistics.summary || {};
    var officialUsd = Number(officialStats.earnedUsd);
    if (!(officialUsd > 0)) {
      var officialMatch = String(officialStats.earned || "").match(/(?:US\$|\$)\s*([0-9]+(?:[.,][0-9]+)?)/);
      officialUsd = officialMatch ? Number(String(officialMatch[1]).replace(",", ".")) : null;
    }
    var localEarnedUsd = completedUsd + liveSeconds / 60 * liveRate;
    var hasOfficial = Number.isFinite(officialUsd) && officialUsd >= 0 && officialStats.earned != null;
    var earnedUsd = hasOfficial ? officialUsd : localEarnedUsd;
    var fx = Number(config.usdMxnRate || 0);
    var earnedUsdText = "US$" + earnedUsd.toFixed(4);
    var earnedMxnText = fx > 0 ? "MX$" + (earnedUsd * fx).toFixed(4) : "Sin tasa";
    if ($("earningSummary")) $("earningSummary").textContent = earnedUsdText + " · " + earnedMxnText;
    $("exchangeRate").textContent = fx > 0 ? "$" + fx.toFixed(4) : "No disponible";
    if ($("earningLabel")) $("earningLabel").textContent = hasOfficial ? "Ingreso oficial hoy" : "Ingreso estimado hoy";
    $("exchangeMeta").textContent = fx > 0
      ? "Fecha de referencia: " + (config.exchangeRateDate || "última disponible")
      : ((state.exchangeRateError || "Reintentando automáticamente").slice(0, 90));
    renderOfficial();
  }
  var openTranscript=$("openTranscript");
  if(openTranscript)openTranscript.addEventListener("click",function(){openTranscript.disabled=true;status("Preparando captura de audio…");chrome.tabs.query({active:true,currentWindow:true}).then(function(tabs){var tab=tabs&&tabs[0];if(!tab||tab.id==null)throw new Error("No hay pestaña activa.");return chrome.tabCapture.getMediaStreamId({targetTabId:tab.id}).then(function(streamId){return{tab:tab,streamId:streamId}})}).then(function(x){var payload={type:"OPEN_SIGNAL_LIVE_WINDOW",tabId:x.tab.id,audioStreamId:x.streamId,sourceUrl:x.tab.url||"",sourceTitle:x.tab.title||""};return chrome.runtime.sendMessage(payload)}).then(function(response){status(response&&response.ok?"Groq: consola abierta y captura iniciada":"No se pudo iniciar: "+String(response&&response.error||"desconocido"),!(response&&response.ok));}).catch(function(error){status("No se pudo iniciar la captura: "+String(error),true);}).finally(function(){openTranscript.disabled=false;});});
  $("groqModel").addEventListener("change",function(){save({groqModel:this.value});});
  $("enabled").addEventListener("change", function () {
    save({ autoAnswerEnabled: this.checked });
  });
  $("observation").addEventListener("change", function () { save({ observationEnabled: this.checked }); });
  $("networkTelemetryEnabled").addEventListener("change", function () { save({ networkTelemetryEnabled: this.checked }); });
  $("performanceTelemetryEnabled").addEventListener("change", function () { save({ performanceTelemetryEnabled: this.checked }); });
  $("interactionTelemetryEnabled").addEventListener("change", function () { save({ interactionTelemetryEnabled: this.checked }); });
  $("telemetryRetentionDays").addEventListener("change", function () { save({ telemetryRetentionDays: Math.max(7, Math.min(730, Number(this.value) || 180)) }); });
  $("telemetryMaxEvents").addEventListener("change", function () { save({ telemetryMaxEvents: Math.max(1000, Math.min(1000000, Number(this.value) || 250000)) }); });
  $("telemetryHeartbeatSeconds").addEventListener("change", function () { save({ telemetryHeartbeatSeconds: Math.max(10, Math.min(300, Number(this.value) || 30)) }); });
  $("overlayEnabled").addEventListener("change", function () { save({ overlayEnabled: this.checked }); });
  $("volume").addEventListener("input", function () {
    config.volume = Number(this.value);
    $("volumeValue").textContent = Math.round(config.volume * 100) + "%";
  });
  $("volume").addEventListener("change", function () { save({ volume: Number(this.value) }); });
  function renderOfficial() {
    var host = $("officialData");
    if (!host) return;
    var order = ["statistics", "pre-scheduled", "appointments", "finance", "profile"];
    var labels = {
      statistics: "Statistics · On-Demand",
      "pre-scheduled": "Statistics · Pre-Scheduled",
      appointments: "Appointments", finance: "Finance", profile: "Profile"
    };
    var cards = order.filter(function (key) { return mirror[key]; }).map(function (key) {
      var item = mirror[key];
      var summary = item.summary || {};
      var summaryText = [
        summary.earned ? "Ganado " + summary.earned : "",
        summary.callLength ? "Tiempo " + summary.callLength : "",
        summary.callCount ? "Llamadas " + summary.callCount : ""
      ].filter(Boolean).join(" · ");
      var rows = (item.tables || []).reduce(function (sum, table) {
        return sum + Math.max(0, (table.rows || []).length - 1);
      }, 0);
      var tables = (item.tables || []).map(function (table) {
        return '<div class="table-wrap"><table>' + (table.rows || []).map(function (row, rowIndex) {
          var tag = rowIndex === 0 ? "th" : "td";
          return "<tr>" + row.map(function (cell) {
            return "<" + tag + ">" + escapeHtml(cell) + "</" + tag + ">";
          }).join("") + "</tr>";
        }).join("") + "</table></div>";
      }).join("");
      var preview = (item.lines || []).slice(0, 8).join(" · ");
      return '<details><summary><b>' + labels[key] + '</b><span>' +
        new Date(item.capturedAt).toLocaleTimeString() + '</span></summary>' +
        (summaryText ? '<p class="official-summary">' + escapeHtml(summaryText) + '</p>' : '') +
        (rows ? '<small>' + rows + ' filas visibles sincronizadas.</small>' : '') +
        tables +
        '<p class="preview">' + escapeHtml(preview || "Sin contenido visible") + '</p></details>';
    });
    host.innerHTML = cards.length ? cards.join("") : "<small>Aún no hay pantallas sincronizadas.</small>";
    var stats = mirror.statistics || {};
    var summary = stats.summary || {};
    if (summary.earnedUsd == null) summary.earnedUsd = (String(summary.earned || "").match(/(?:US\$|\$)\s*([0-9]+(?:[.,][0-9]+)?)/) || [])[1] || null;
    var official = [summary.earned ? "Ganado " + summary.earned : "", summary.callCount ? summary.callCount + " llamadas" : "", summary.callLength ? summary.callLength : ""].filter(Boolean).join(" · ");
    if ($("officialSummary")) $("officialSummary").innerHTML = official ? "<strong>" + escapeHtml(official) + "</strong>" : "<small>Aún no hay datos oficiales sincronizados.</small>";
    if ($("officialMeta")) $("officialMeta").textContent = stats.capturedAt ? "Sincronizado " + new Date(stats.capturedAt).toLocaleTimeString() : "Cotejo con las pantallas de la plataforma";
  }
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  var syncOfficial = $("syncOfficial");
  if (syncOfficial) syncOfficial.addEventListener("click", function () {
    var button=this; button.disabled=true; status("Sincronizando Statistics…");
    chrome.runtime.sendMessage({type:"SYNC_OFFICIAL_PLATFORM_DATA"}, function(response){
      if(response&&response.ok){
        var earned=response.snapshot&&response.snapshot.summary&&response.snapshot.summary.earned;
        status(earned ? "Sincronizado · "+earned : "Sincronizado");
      } else {
        status("No se pudo sincronizar: "+String(response&&response.error||"desconocido"),true);
      }
      button.disabled=false;
    });
  });
  $("refresh").addEventListener("click", function () {
    chrome.tabs.query({ url: "https://app.cloudinterpreter.com/*" }, function (tabs) {
      var pending = tabs.length;
      if (!pending) { status("No hay pestañas de Effectif abiertas", true); return; }
      tabs.forEach(function (tab) {
        chrome.tabs.sendMessage(tab.id, { type: "EFFECTIF_REQUEST_PLATFORM_SNAPSHOT" }, function () {
          pending -= 1;
          if (!pending) status("Pantallas abiertas actualizadas");
        });
      });
    });
  });
  document.querySelectorAll("[data-open]").forEach(function (button) {
    button.addEventListener("click", function () {
      chrome.storage.local.get(["effectifState"], function (stored) {
        if (stored.effectifState && stored.effectifState.callStartedAt) {
          status("Durante una llamada no se abre Statistics ni se cambia de pestaña.", true);
          return;
        }
        chrome.tabs.query({ url: "https://app.cloudinterpreter.com/profile/*" }, function (tabs) {
        var profile = tabs.find(function (tab) { return /\/profile\/[^/]+/.test(tab.url || ""); });
        if (!profile) { status("Abre primero My Profile", true); return; }
        var match = profile.url.match(/^(https:\/\/app\.cloudinterpreter\.com\/profile\/[^/?#]+)/);
        if (!match) return;
        chrome.tabs.create({ url: match[1] + "/" + button.dataset.open });
        });
      });
    });
  });
  $("sound").addEventListener("click", function () {
    chrome.runtime.sendMessage({ type: "EFFECTIF_TEST_SOUND", volume: config.volume }, function (response) {
      status(response && response.ok ? "Sonido reproducido" : "No se pudo reproducir el sonido", !(response && response.ok));
    });
  });
  $("endCall").addEventListener("click", function () {
    chrome.runtime.sendMessage({ type: "EFFECTIF_END_CALL" }, function (response) {
      if (response && response.ok) status("Llamada guardada");
      else status((response && response.error) || "No se pudo cerrar", true);
    });
  });
  function formatBytes(bytes) {
    if (!Number(bytes)) return "0 B";
    var units = ["B", "KB", "MB", "GB"]; var index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0) + " " + units[index];
  }
  async function refreshTelemetryStats() {
    try {
      var stats = await KhoraTelemetryDB.stats();
      $("telemetryCount").textContent = stats.events.toLocaleString("es-MX") + " eventos";
      $("telemetryMeta").textContent = stats.snapshots.toLocaleString("es-MX") + " snapshots · " + Number(stats.signalSegments||0).toLocaleString("es-MX") + " segmentos Signal · " + formatBytes(stats.usageBytes) + " usados · desde " + (stats.oldestEventAt ? new Date(stats.oldestEventAt).toLocaleString() : "ahora");
    } catch (error) {
      $("telemetryCount").textContent = "Base no disponible";
      $("telemetryMeta").textContent = String(error);
    }
  }
  function scrubDiagnostic(value, depth) {
    if (depth > 8) return "[MAX_DEPTH]";
    if (typeof value === "string") return value
      .replace(/Bearer\\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
      .replace(/gsk_[A-Za-z0-9_-]+/gi, "[REDACTED_KEY]")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, "[EMAIL]")
      .replace(/\\b(?:\\+?52)?\\d{10,}\\b/g, "[PHONE]")
      .replace(/\\b\\d{7,}\\b/g, "[NUMBER]")
      .slice(0, 5000);
    if (Array.isArray(value)) return value.slice(0, 1000).map(function (x) { return scrubDiagnostic(x, depth + 1); });
    if (!value || typeof value !== "object") return value;
    var out = {};
    Object.keys(value).slice(0, 500).forEach(function (key) {
      if (/api.?key|authorization|cookie|password|secret|token/i.test(key)) out[key] = "[REDACTED]";
      else if (key === "text" && /signal|segment/i.test(String(value.source||""))) out.text = "[TRANSCRIPT_OMITTED]";
      else out[key] = scrubDiagnostic(value[key], depth + 1);
    });
    return out;
  }
  function compactSignalSegments(segments) {
    return (segments || []).map(function (s) {
      return {id:s.id||null,speaker:s.speaker||null,timestamp:s.timestamp||null,source:s.source||null,reason:s.reason||null,
        start:s.start==null?null:Number(s.start),end:s.end==null?null:Number(s.end),
        textLength:String(s.text||"").length};
    });
  }
  var githubPollTimer=null;
  async function renderGithubStatus() {
    try {
      var config=await SignalGithubObservability.getConfig();
      var statusInfo=await SignalGithubObservability.getStatus();
      var input=$("githubClientId");
      if(input && input.value!==String(config.clientId||"")) input.value=String(config.clientId||"");
      var statusLabel=statusInfo.connected ? "Conectado" : statusInfo.configured ? "Autorización pendiente/no conectada" : "No configurada";
      if($("githubSyncStatus")) $("githubSyncStatus").textContent=statusLabel;
      if($("githubDisconnect")) $("githubDisconnect").disabled=!statusInfo.connected;
      if($("githubAuthInfo")){
        if(statusInfo.connected){
          var expiry=statusInfo.tokenExpiresAt?new Date(statusInfo.tokenExpiresAt).toLocaleTimeString():"renovable";
          $("githubAuthInfo").textContent="Repositorio: "+statusInfo.repository+" · token válido hasta "+expiry+".";
        }else if(statusInfo.deviceFlow){
          $("githubAuthInfo").textContent="Escribe el código "+statusInfo.deviceFlow.userCode+" en GitHub para completar la autorización.";
        }else{
          $("githubAuthInfo").textContent=statusInfo.error||"La extensión publicará directamente en observations/inbox/ y GitHub Actions construirá el paquete derivado.";
        }
      }
    } catch(error) {
      if($("githubSyncStatus")) $("githubSyncStatus").textContent="Error";
      if($("githubAuthInfo")) $("githubAuthInfo").textContent=String(error);
    }
  }
  async function pollGithubAuthorization() {
    try {
      var result=await SignalGithubObservability.pollDeviceFlow();
      if(result.status==="connected"){
        status("GitHub conectado");
        await renderGithubStatus();
        return;
      }
      if(result.status==="expired"||result.status==="denied"||result.status==="error"){
        if(result.status!=="authorization_pending") status("Autorización GitHub: "+String(result.error||result.status),true);
        await renderGithubStatus();
        return;
      }
      await renderGithubStatus();
      clearTimeout(githubPollTimer);
      githubPollTimer=setTimeout(pollGithubAuthorization,Math.max(5000,Number(result.retryInMs)||5000));
    } catch(error) {
      status("No se pudo completar la autorización GitHub: "+String(error),true);
      await renderGithubStatus();
    }
  }
  $("githubClientId").addEventListener("change",async function(){
    await SignalGithubObservability.setConfig({clientId:this.value});
    await renderGithubStatus();
  });
  $("githubConnect").addEventListener("click",async function(){
    var button=this;button.disabled=true;status("Preparando autorización GitHub…");
    try{
      var result=await SignalGithubObservability.beginDeviceFlow();
      status("Código GitHub: "+result.userCode);
      await renderGithubStatus();
      clearTimeout(githubPollTimer);
      githubPollTimer=setTimeout(pollGithubAuthorization,Math.max(5000,Number(result.interval||5)*1000));
    }catch(error){
      status("No se pudo iniciar GitHub: "+String(error),true);
    }finally{button.disabled=false;}
  });
  $("githubDisconnect").addEventListener("click",async function(){
    await SignalGithubObservability.disconnect();
    status("GitHub desconectado");
    await renderGithubStatus();
  });
  $("export").addEventListener("click",async function(){
    var button=this;button.disabled=true;status("Publicando observabilidad pendiente en GitHub…");
    try{
      var response=await new Promise(function(resolve){
        chrome.runtime.sendMessage({type:"SIGNAL_OBSERVATION_SYNC_NOW"},function(result){
          if(chrome.runtime.lastError) resolve({ok:false,error:chrome.runtime.lastError.message});
          else resolve(result||{ok:false,error:"Sin respuesta del worker"});
        });
      });
      if(response&&response.ok){
        status("Observabilidad publicada · "+Number(response.summary&&response.summary.eventsTotal||0)+" eventos");
      }else{
        status("No se pudo publicar: "+String(response&&response.error||"GitHub no disponible"),true);
      }
    }catch(error){status("No se pudo publicar: "+String(error),true);}
    finally{button.disabled=false;}
  });
  renderGithubStatus();
  function renderEarningsOnly() {
    var today = localDay();
    var completed = Array.isArray(state.completedCalls) ? state.completedCalls.filter(function (call) { return localDay(call.startedAt || call.endedAt) === today; }) : [];
    var completedUsd = completed.reduce(function (sum, call) { return sum + Number(call.estimatedRevenue || call.estimatedAmount || 0); }, 0);
    var liveSeconds = state.callStartedAt ? Math.max(0, (Date.now() - Date.parse(state.callStartedAt)) / 1000) : 0;
    var liveRate = state.callModality === "VRI" ? Number(config.vriRatePerMinute || 0.25) : Number(config.opiRatePerMinute || 0.20);
    var localEarnedUsd = completedUsd + liveSeconds / 60 * liveRate;
    var officialStats = mirror.statistics && mirror.statistics.summary || {};
    var officialUsd = Number(officialStats.earnedUsd);
    if (!(officialUsd > 0)) {
      var officialMatch = String(officialStats.earned || "").match(/(?:US\$|\$)\s*([0-9]+(?:[.,][0-9]+)?)/);
      officialUsd = officialMatch ? Number(String(officialMatch[1]).replace(",", ".")) : null;
    }
    var hasOfficial = Number.isFinite(officialUsd) && officialUsd >= 0 && officialStats.earned != null;
    var earnedUsd = hasOfficial ? officialUsd : localEarnedUsd;
    var fx = Number(config.usdMxnRate || 0);
    var usdText = "US$" + earnedUsd.toFixed(4);
    var mxnText = fx > 0 ? "MX$" + (earnedUsd * fx).toFixed(4) : "Sin tasa";
    if ($("earningSummary")) $("earningSummary").textContent = usdText + " · " + mxnText;
    if ($("earningLabel")) $("earningLabel").textContent = hasOfficial ? "Ingreso oficial hoy" : "Ingreso estimado hoy";
  }
  var popupStateLoaded = false;
  function loadPopupState() {
    if (popupStateLoaded) return;
    popupStateLoaded = true;
    chrome.storage.local.get(["effectifConfig", "effectifState", "effectifLastEvent", "effectifPlatformMirror"], function (stored) {
      config = Object.assign({}, DEFAULT_CONFIG, stored.effectifConfig || {}); delete config.groqApiKey;
      state = stored.effectifState || {};
      mirror = stored.effectifPlatformMirror || {};
      var last = stored.effectifLastEvent;
      $("last").textContent = last ? new Date(last.timestamp).toLocaleTimeString() + " — " + last.action : "Sin eventos";
      render();
      refreshTelemetryStats();
    });
  }
  try {
    chrome.runtime.sendMessage({type:"RECONCILE_PLATFORM_TELEMETRY",trigger:"popup-open"}, function(){ loadPopupState(); });
  } catch (_) { loadPopupState(); }
  setTimeout(loadPopupState, 750);
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== "local") return;
    if (changes.effectifConfig) config = Object.assign({}, DEFAULT_CONFIG, changes.effectifConfig.newValue || {});
    if (changes.effectifState) state = changes.effectifState.newValue || {};
    if (changes.effectifPlatformMirror) mirror = changes.effectifPlatformMirror.newValue || {};
    if (changes.effectifLastEvent && changes.effectifLastEvent.newValue) {
      var last = changes.effectifLastEvent.newValue;
      $("last").textContent = new Date(last.timestamp).toLocaleTimeString() + " — " + last.action;
    }
    render();
  });
  setInterval(function () {
    $("sessionTimer").textContent = duration(state.sessionStartedAt); $("onlineTimer").textContent = duration(state.onlineStartedAt); $("callTimer").textContent = duration(state.callStartedAt); renderEarningsOnly();
  }, 1000);
  setInterval(refreshTelemetryStats, 30000);
})();
