import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync("extension/live-caption-core.js", "utf8");
const sandbox = { globalThis: {} };
vm.runInNewContext(source, sandbox);
const core = sandbox.globalThis.SignalCaptionCore;

assert.ok(core);
assert.equal(core.normalizeText("  hello   world  "), "hello world");
assert.equal(core.detectLanguage("The patient needs the appointment today."), "en");
assert.equal(core.detectLanguage("Necesito verificar la cita con usted."), "es");
assert.equal(core.detectLanguage("yes"), "unknown", "los fragmentos demasiado cortos no deben asignar idioma categórico");
assert.equal(core.normalizeLanguage("English"), "en");
assert.equal(core.normalizeLanguage("EN-us"), "en");
assert.equal(core.normalizeLanguage("eng"), "en");
assert.equal(core.normalizeLanguage("Spanish"), "es");
assert.equal(core.normalizeLanguage("Español"), "es");
assert.equal(core.normalizeLanguage("es-MX"), "es");
assert.equal(core.normalizeLanguage("unknown"), "unknown");
assert.equal(core.resolveLanguage("en-US", "Necesito ayuda."), "en", "una etiqueta fiable prevalece sobre la heurística");
assert.equal(core.resolveLanguage("unknown", "Necesito verificar la cita con usted."), "es");
assert.equal(core.roleForLanguage("en"), "CLIENTE");
assert.equal(core.roleForLanguage("es"), "LEP");
assert.equal(core.languageLabel("en"), "ENGLISH");
assert.equal(core.languageLabel("es"), "ESPAÑOL");
assert.equal(core.roleForSource("chrome-live-caption", "en"), "CLIENTE");
assert.equal(core.roleForSource("cliente", "en"), "CLIENTE");
assert.equal(core.roleForSource("yo", "es"), "LEP");
assert.equal(core.captionRelation("I need the appointment", "I need the appointment tomorrow"), "progressive");
assert.equal(core.captionRelation("I need the appointment tomorrow", "I need the appointment"), "stale");
assert.equal(core.captionRelation("Please call me tomorrow", "call me tomorrow morning"), "overlap");
assert.equal(core.captionRelation("hello there", "hello there"), "duplicate");
assert.equal(core.mergeCaptionText("Please call me tomorrow", "call me tomorrow morning"), "Please call me tomorrow morning");
assert.equal(core.mergeCaptionText("I need the appointment tomorrow", "I need the appointment"), "I need the appointment tomorrow");

const started = [];
let releaseFirst;
const replacedSources = [];
const dispatcher = core.createLatestOnlyDispatcher((message) => {
  started.push(message.sequence);
  if (message.sequence === 1) {
    return new Promise((resolve) => { releaseFirst = resolve; });
  }
  return Promise.resolve();
}, (source, replaced) => replacedSources.push({ source, replaced }));

const first = dispatcher.enqueue({ source: "cliente", sequence: 1 });
await new Promise((resolve) => setImmediate(resolve));
assert.deepEqual(started, [1]);
await dispatcher.enqueue({ source: "cliente", sequence: 2 });
await dispatcher.enqueue({ source: "cliente", sequence: 3 });
assert.deepEqual(dispatcher.status().cliente, { running: true, pending: true, replaced: 1 });
assert.deepEqual(started, [1], "no debe iniciar peticiones concurrentes en la misma fuente");
await dispatcher.enqueue({ source: "yo", sequence: 90 });
assert.deepEqual(started, [1, 90], "las fuentes pueden avanzar independientemente");
releaseFirst();
await first;
await new Promise((resolve) => setImmediate(resolve));
assert.deepEqual(started, [1, 90, 3], "se conserva el fragmento pendiente más reciente, no una cola ilimitada");
assert.deepEqual(replacedSources, [{ source: "cliente", replaced: 1 }]);
assert.equal(dispatcher.status().cliente.pending, false);
assert.equal(dispatcher.status().cliente.running, false);

console.log("LIVE_CAPTION_CORE_TEST=PASS");
