import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (file) => fs.readFileSync(file, "utf8");
const manifest = JSON.parse(read("extension/manifest.json"));
const coreSource = read("extension/live-caption-core.js");
const liveOverlay = read("extension/live-caption-overlay.js");
const background = read("extension/background.js");
const content = read("extension/content.js");
const workflow = read(".github/workflows/observability-audit.yml");

assert.equal(manifest.version, "0.10.29", "la versión debe ser la que contiene la corrección");
assert.ok(manifest.content_scripts.some((entry) =>
  entry.matches?.includes("https://app.cloudinterpreter.com/*") &&
  entry.run_at === "document_start" &&
  entry.js?.indexOf("live-caption-core.js") >= 0 &&
  entry.js?.indexOf("live-caption-overlay.js") > entry.js.indexOf("live-caption-core.js")
), "el núcleo debe cargarse antes del overlay en la ruta de Cloud Interpreter");

const sandbox = { globalThis: {} };
vm.runInNewContext(coreSource, sandbox);
const core = sandbox.globalThis.SignalCaptionCore;
assert.equal(core.isCloudInterpreterCallRoute("app.cloudinterpreter.com", "/call/call-fixture"), true);
assert.equal(core.isCloudInterpreterCallRoute("app.cloudinterpreter.com", "/call/call-fixture/"), true);
assert.equal(core.isCloudInterpreterCallRoute("app.cloudinterpreter.com", "/call/call-fixture/rate"), false);
assert.equal(core.isCloudInterpreterCallRoute("other.example", "/call/call-fixture"), false);

assert.ok(liveOverlay.includes("function activateLocalCallFallback(reasonCode)"),
  "una llamada activa puede levantar el panel aunque el estado del service worker tarde");
assert.ok(liveOverlay.includes("function scheduleContextRetry(reasonCode)"),
  "los fallos del primer saludo deben reintentarse");
assert.ok(liveOverlay.includes("contextRetryDelayMs = Math.min(15000, contextRetryDelayMs * 2)"),
  "la recuperación debe usar retroceso acotado");
assert.ok(liveOverlay.includes("LIVE_CAPTION_OVERLAY_CONTEXT_SYNC_FAILED"));
assert.ok(liveOverlay.includes("LIVE_CAPTION_OVERLAY_CONTEXT_APPLIED"));
assert.ok(liveOverlay.includes("LIVE_CAPTION_OVERLAY_HOST_MOUNTED"));
assert.ok(liveOverlay.includes("LIVE_CAPTION_OVERLAY_HOST_MOUNT_FAILED"));
assert.ok(liveOverlay.includes("LIVE_CAPTION_OVERLAY_VISIBILITY_CHANGED"));
assert.ok(liveOverlay.includes("LIVE_CAPTION_OVERLAY_HEALTH"));
assert.ok(liveOverlay.includes("LIVE_CAPTION_OVERLAY_RECOVERY_ATTEMPTED"));
assert.ok(liveOverlay.includes("sourceTabId = result.sourceTabId != null && Number.isFinite(Number(result.sourceTabId))"),
  "null no puede convertirse accidentalmente en tabId 0");

const contextBlock = background.slice(
  background.indexOf("async function getCaptionOverlayContext"),
  background.indexOf("async function setCaptionPreviewForActiveCall")
);
assert.ok(contextBlock.includes("cloudCallRoute"), "la ruta activa debe formar parte del contexto");
assert.ok(contextBlock.includes("routeEvidenceApplied"), "el contexto debe distinguir evidencia de ruta");
assert.ok(contextBlock.includes("sourceTabId = currentTabId"), "la pestaña real de llamada debe reconciliarse como fuente");
assert.ok(contextBlock.includes("activeCallRoute: cloudCallRoute"));

const watcherStart = content.indexOf("function startOverlayActivationWatchdog");
const watcherEnd = content.indexOf("function activateOverlayForCall", watcherStart);
assert.ok(watcherStart >= 0 && watcherEnd > watcherStart, "el vigilante del overlay de ingresos debe estar aislado");
const watcher = content.slice(watcherStart, watcherEnd);
assert.ok(watcher.includes("independentOfObserver: true"));
assert.ok(watcher.includes("trackRoute(\"overlay-route-watchdog\")"));
assert.ok(watcher.includes("renderOverlay()"));
assert.ok(content.includes("EARNINGS_OVERLAY_ACTIVATION_REQUESTED"));
assert.ok(content.includes("EARNINGS_OVERLAY_ACTIVATION_BLOCKED"));
assert.ok(content.includes("EARNINGS_OVERLAY_MOUNTED"));
assert.ok(content.includes("EARNINGS_OVERLAY_MOUNT_FAILED"));
assert.ok(content.includes("EARNINGS_OVERLAY_RENDER_BLOCKED"));
assert.ok(content.includes("EARNINGS_OVERLAY_VISIBLE"));
assert.ok(content.includes("EARNINGS_OVERLAY_RECOVERY_ATTEMPTED"));
assert.ok(content.includes('startOverlayActivationWatchdog("config-applied")'),
  "el watchdog no puede depender de observationEnabled/autoAnswerEnabled");
assert.ok(content.includes('stopOverlayActivationWatchdog("pagehide")'));
assert.ok(workflow.includes("overlay-activation-regression-test.mjs"),
  "CI debe ejecutar esta regresión");

const reporter = liveOverlay.slice(
  liveOverlay.indexOf("function reportLifecycle"),
  liveOverlay.indexOf("function currentBlockReason")
);
assert.equal(reporter.includes("transcriptText"), false, "los diagnósticos no deben copiar texto transcrito");
assert.equal(reporter.includes("audioBytes"), false, "los diagnósticos no deben copiar audio");
console.log("OVERLAY_ACTIVATION_REGRESSION_TEST=PASS");
