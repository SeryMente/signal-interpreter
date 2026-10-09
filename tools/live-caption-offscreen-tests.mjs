import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync("extension/offscreen.js", "utf8");
const messages = [];
const recorders = [];
const streams = [];
let messageListener;
let streamIndex = 0;
let timerIndex = 0;

function makeStream(id) {
  const track = { enabled: true, stopped: false, stop() { this.stopped = true; } };
  return { id, track, getAudioTracks() { return [track]; }, getTracks() { return [track]; } };
}

class FakeMediaRecorder {
  constructor(stream) {
    this.stream = stream;
    this.state = "inactive";
    this.mimeType = "audio/webm;codecs=opus";
    this.startIntervals = [];
    this.ondataavailable = null;
    this.onstop = null;
    this.onerror = null;
    recorders.push(this);
  }
  start(interval) { this.state = "recording"; this.startIntervals.push(interval ?? null); }
  stop() {
    if (this.state === "inactive") return;
    this.state = "inactive";
    if (typeof this.onstop === "function") this.onstop();
  }
  emitData() {
    if (typeof this.ondataavailable === "function") this.ondataavailable({ data: { size: 12 } });
  }
}

class FakeFileReader {
  readAsDataURL() { this.result = "data:audio/webm;base64,QUJD"; if (this.onloadend) this.onloadend(); }
}

class FakeAudioContext {
  constructor() { this.state = "running"; this.currentTime = 0; this.destination = {}; }
  createMediaStreamSource(stream) { return { stream, connect() {} }; }
  async resume() { this.state = "running"; }
  async close() { this.state = "closed"; }
}

const chrome = {
  runtime: {
    onMessage: { addListener(fn) { messageListener = fn; } },
    sendMessage(message) { messages.push(message); return Promise.resolve({ ok: true }); }
  }
};
const navigator = { mediaDevices: { async getUserMedia(constraints) {
  streamIndex += 1;
  const stream = makeStream(streamIndex === 1 ? "tab-audio" : "microphone");
  streams.push({ constraints, stream });
  return stream;
} } };

const sandbox = {
  chrome, navigator, console, Date, Number, String, Object, Math, Promise, Blob,
  MediaRecorder: FakeMediaRecorder, FileReader: FakeFileReader, AudioContext: FakeAudioContext,
  setTimeout() { return ++timerIndex; }, clearTimeout() {},
  setInterval() { return ++timerIndex; }, clearInterval() {}
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

function send(message) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const respond = (value) => { if (!settled) { settled = true; resolve(value); } };
    try {
      const keepAlive = messageListener(message, {}, respond);
      if (keepAlive !== true && !settled) respond(undefined);
    } catch (error) { reject(error); }
  });
}

const started = await send({
  target: "offscreen", type: "SIGNAL_START_GROQ_CAPTURE", streamId: "chrome-stream-token",
  sessionId: "session-a", muted: false, captionPreview: true, tabId: 7
});
assert.equal(started.ok, true);
assert.equal(recorders.length, 3, "dos grabadores durables y un preview de pestaña");
assert.equal(recorders[0].stream.id, "tab-audio");
assert.equal(recorders[1].stream.id, "microphone");
assert.equal(recorders[2].stream.id, "tab-audio", "el preview debe usar el audio de la pestaña");
assert.deepEqual(recorders[2].startIntervals, [2800]);

const nativeFresh = await send({
  target: "offscreen", type: "SIGNAL_SET_CAPTION_PREVIEW", enabled: true, tabEnabled: false, micEnabled: false
});
assert.equal(nativeFresh.ok, true);
assert.equal(nativeFresh.tabEnabled, false);
assert.equal(nativeFresh.micEnabled, false);
assert.equal(recorders[2].state, "inactive", "el preview tab se detiene al volver texto nativo reciente");

const fallback = await send({
  target: "offscreen", type: "SIGNAL_SET_CAPTION_PREVIEW", enabled: true, tabEnabled: true, micEnabled: false
});
assert.equal(fallback.ok, true);
assert.equal(fallback.tabEnabled, true);
assert.equal(fallback.micEnabled, false, "el fallback no debe crear una segunda transcripción del micrófono");
assert.equal(recorders.length, 4);
assert.equal(recorders[3].stream.id, "tab-audio");
assert.deepEqual(recorders[3].startIntervals, [2800]);
recorders[3].emitData();
await new Promise((resolve) => setImmediate(resolve));
assert.ok(messages.some((m) => m.type === "SIGNAL_GROQ_CAPTION_PREVIEW_CHUNK" && m.sessionId === "session-a"));
assert.equal(messages.some((m) => m.type === "SIGNAL_GROQ_AUDIO_CHUNK" && m.source === "cliente"), false,
  "el preview no debe entrar en la ruta durable de segmentos");

const disabled = await send({ target: "offscreen", type: "SIGNAL_SET_CAPTION_PREVIEW", enabled: false });
assert.equal(disabled.ok, true);
assert.equal(disabled.tabEnabled, false);
assert.equal(recorders[3].state, "inactive");

const stopped = await send({ target: "offscreen", type: "SIGNAL_STOP_GROQ_CAPTURE" });
assert.equal(stopped.ok, true);
assert.equal(streams.every((item) => item.stream.track.stopped), true, "al cerrar se liberan ambas pistas");
const rejected = await send({
  target: "offscreen", type: "SIGNAL_SET_CAPTION_PREVIEW", enabled: true, tabEnabled: true, micEnabled: false
});
assert.equal(rejected.ok, false, "no se permite iniciar preview sin captura activa");
assert.equal(rejected.error, "audio-capture-not-running");

console.log("LIVE_CAPTION_OFFSCREEN_TEST=PASS");
