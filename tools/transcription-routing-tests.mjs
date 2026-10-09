import fs from "node:fs";
import assert from "node:assert/strict";

const background = fs.readFileSync("extension/background.js", "utf8");
const core = fs.readFileSync("extension/live-caption-core.js", "utf8");
const overlay = fs.readFileSync("extension/live-caption-overlay.js", "utf8");

const durableStart = background.indexOf("function handleGroqAudioChunk(message){");
const durableEnd = background.indexOf("async function activateSignalSession", durableStart);
assert.ok(durableStart >= 0 && durableEnd > durableStart, "No se encontró la ruta durable de transcripción");
const durable = background.slice(durableStart, durableEnd);
assert.match(durable, /SignalGroqTranscriber\.transcribe\(blob,\{[^}]*language:""/s,
  "La ruta durable debe delegar la detección del idioma al motor, no forzar español");
assert.doesNotMatch(durable, /language:"es"/, "No se debe forzar español para el audio del cliente en inglés");
assert.match(durable, /Transcribe en el idioma original\. Detecta automáticamente inglés o español/);
assert.match(durable, /SignalCaptionCore\.normalizeLanguage\(result\.language\)/,
  "Las etiquetas de idioma devueltas por Groq se deben normalizar");
assert.match(durable, /language:transcriptLanguage/,
  "El idioma detectado debe persistirse en cada segmento durable");

const previewStart = background.indexOf("function handleGroqCaptionPreviewChunk(message){");
const previewEnd = background.indexOf("function handleGroqAudioChunk(message){", previewStart);
assert.ok(previewStart >= 0 && previewEnd > previewStart, "No se encontró la ruta de subtítulos en vivo");
const preview = background.slice(previewStart, previewEnd);
assert.match(preview, /SignalCaptionCore\.normalizeLanguage\(result\.language\)/,
  "La ruta de subtítulos en vivo también debe normalizar etiquetas de idioma");
assert.match(core, /function normalizeLanguage\(value\)/);
assert.match(overlay, /language = core\.normalizeLanguage\(language\)/,
  "El overlay debe aceptar nombres de idioma y etiquetas BCP-47");

console.log("TRANSCRIPTION_ROUTING_TEST=PASS");
