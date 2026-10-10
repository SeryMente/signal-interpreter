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
assert.deepEqual(JSON.parse(JSON.stringify(core.findSmartTokens("Please call (555) 123-4567 at 123 Main Street, Austin, TX."))), [
  { type: "phone", text: "(555) 123-4567", start: 12, end: 26 },
  { type: "address", text: "123 Main Street, Austin, TX", start: 30, end: 57 }
], "teléfonos y direcciones en inglés se detectan por separado para copiarlos/verificarlos");
assert.deepEqual(JSON.parse(JSON.stringify(core.findSmartTokens("Vivo en Avenida Reforma 123, Colonia Juárez. Llámeme al +52 442 123 4567."))).map(x => ({type:x.type,text:x.text})), [
  { type: "address", text: "Avenida Reforma 123, Colonia Juárez" },
  { type: "phone", text: "+52 442 123 4567" }
], "direcciones mexicanas y teléfonos internacionales se detectan sin perder puntuación");
assert.equal(core.findSmartTokens("La cita es a las 10:30 y son 3 pacientes.").length, 0,
  "no se deben marcar horas o cifras cortas como teléfonos");

assert.equal(core.roleForSource("chrome-live-caption", "en"), "CLIENTE");
assert.equal(core.roleForSource("cliente", "en"), "CLIENTE");
assert.equal(core.roleForSource("yo", "es"), "LEP");
assert.equal(core.captionRelation("I need the appointment", "I need the appointment tomorrow"), "progressive");
assert.equal(core.captionRelation("I need the appointment tomorrow", "I need the appointment"), "stale");
assert.equal(core.captionRelation("Please call me tomorrow", "call me tomorrow morning"), "overlap");
assert.equal(core.captionRelation("hello there", "hello there"), "duplicate");
assert.equal(core.mergeCaptionText("Please call me tomorrow", "call me tomorrow morning"), "Please call me tomorrow morning");
const candidates = [
  { name: "bottom-left", left: 0, top: 70 },
  { name: "top-right", left: 100, top: 0 },
  { name: "bottom-right", left: 100, top: 70 }
];
const controls = [{ left: 0, top: 70, right: 25, bottom: 100, width: 25, height: 30 }];
assert.equal(core.choosePositionCandidate(candidates, controls, 100, 30).name, "top-right",
  "la posición debe evitar los controles funcionales cuando hay otra esquina libre");
assert.equal(core.choosePositionCandidate(candidates, [], 100, 30).name, "bottom-left",
  "los empates conservan la posición candidata inicial de forma determinista");
assert.equal(core.overlapRatio(
  { left: 0, top: 0, right: 100, bottom: 30, width: 100, height: 30 },
  { left: 0, top: 0, right: 100, bottom: 30, width: 100, height: 30 }
), 1);
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
assert.deepEqual(JSON.parse(JSON.stringify(dispatcher.status().cliente)), { running: true, pending: true, replaced: 2 });
assert.deepEqual(started, [1], "no debe iniciar peticiones concurrentes en la misma fuente");
await dispatcher.enqueue({ source: "yo", sequence: 90 });
assert.deepEqual(started, [1, 90], "las fuentes pueden avanzar independientemente");
releaseFirst();
await first;
await new Promise((resolve) => setImmediate(resolve));
assert.deepEqual(started, [1, 90, 3], "se conserva el fragmento pendiente más reciente, no una cola ilimitada");
assert.deepEqual(replacedSources, [{ source: "cliente", replaced: 1 }, { source: "cliente", replaced: 2 }]);
assert.equal(dispatcher.status().cliente.pending, false);
assert.equal(dispatcher.status().cliente.running, false);

console.log("LIVE_CAPTION_CORE_TEST=PASS");
