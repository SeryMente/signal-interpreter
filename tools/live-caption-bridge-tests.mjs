import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync("extension/live-caption-bridge.js", "utf8");
let now = 1000;
class FakeDate extends Date {
  static now() { return now; }
}
const tabMessages = [];
const statusEvents = [];
const errors = [];
const timers = [];
const ports = [];
let lastError = null;

function makePort() {
  const port = {
    messageListeners: [],
    disconnectListeners: [],
    posted: [],
    onMessage: { addListener(fn) { port.messageListeners.push(fn); } },
    onDisconnect: { addListener(fn) { port.disconnectListeners.push(fn); } },
    postMessage(message) { port.posted.push(message); },
    disconnect() { port.disconnectListeners.forEach((fn) => fn()); },
    emit(message) { port.messageListeners.forEach((fn) => fn(message)); },
    emitDisconnect() { port.disconnectListeners.forEach((fn) => fn()); }
  };
  ports.push(port);
  return port;
}

const chrome = {
  runtime: {
    lastError: null,
    connectNative(name) {
      assert.equal(name, "com.signalinterpreter.captionhost");
      return makePort();
    }
  },
  tabs: {
    sendMessage(tabId, message) {
      tabMessages.push({ tabId, message });
      return Promise.resolve({ ok: true });
    }
  }
};
const sandbox = {
  chrome,
  Date: FakeDate,
  Number,
  String,
  Object,
  Math,
  Promise,
  setTimeout(fn, delay) {
    const timer = { fn, delay, cleared: false };
    timers.push(timer);
    return timer;
  },
  clearTimeout(timer) { if (timer) timer.cleared = true; },
  self: {}
};
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const bridge = sandbox.SignalCaptionBridge;
bridge.onStatus = (status) => statusEvents.push(JSON.parse(JSON.stringify(status)));
bridge.onError = (error) => errors.push(String(error));

assert.equal(bridge.start(7, "call-a"), true);
assert.equal(ports.length, 1);
assert.equal(ports[0].posted.length, 1);
assert.ok(tabMessages.some((item) => item.message.type === "SIGNAL_CAPTION_SESSION_RESET"));
assert.equal(bridge.isFresh(4500), false);

ports[0].emit({ type: "status", active: false, visible: true });
assert.equal(statusEvents.at(-1).active, false);
assert.equal(statusEvents.at(-1).visible, true);

ports[0].emit({ type: "caption", text: "The patient needs the appointment today.", language: "english" });
assert.equal(bridge.isFresh(4500), true);
assert.equal(statusEvents.at(-1).active, true);
assert.equal(tabMessages.filter((item) => item.message.type === "SIGNAL_CAPTION_UPDATE").length, 1);

now += 5000;
ports[0].emit({ type: "heartbeat", active: true, visible: true });
assert.equal(bridge.isFresh(4500), false);
assert.equal(statusEvents.at(-1).active, false, "un heartbeat debe reactivar el fallback cuando el texto nativo deja de actualizarse");
assert.equal(statusEvents.at(-1).visible, true, "la burbuja puede seguir visible aunque el texto esté obsoleto");

ports[0].emit({ type: "caption", text: "Necesito verificar la cita con usted.", language: "Español" });
assert.equal(statusEvents.at(-1).active, true, "el texto nativo nuevo recupera la prioridad");
assert.equal(bridge.isFresh(4500), true);

assert.equal(bridge.start(7, "call-b"), true);
assert.equal(bridge.isFresh(4500), false, "una llamada nueva no puede heredar la frescura de la anterior");
assert.ok(tabMessages.some((item) =>
  item.message.type === "SIGNAL_CAPTION_SESSION_RESET" && item.message.reason === "new-call"));

chrome.runtime.lastError = { message: "Native host has exited." };
ports[1].emitDisconnect();
chrome.runtime.lastError = null;
assert.equal(statusEvents.at(-1).active, false);
assert.ok(errors.length >= 1);
assert.ok(timers.some((timer) => !timer.cleared), "un host desconectado debe programar una reconexión acotada");

const firstRetry = timers[timers.length - 1];
assert.equal(firstRetry.delay, 1000, "el primer reintento empieza con una espera corta");
now += firstRetry.delay;
firstRetry.fn();
assert.equal(ports.length, 3, "se vuelve a intentar la conexión nativa");
assert.equal(ports[2].posted.length, 1);

chrome.runtime.lastError = { message: "Host exited again before becoming healthy." };
ports[2].emitDisconnect();
chrome.runtime.lastError = null;
const secondRetry = timers[timers.length - 1];
assert.equal(secondRetry.delay, 2500, "fallos repetidos usan retroceso progresivo");
now += secondRetry.delay;
secondRetry.fn();
assert.equal(ports.length, 4);

chrome.runtime.lastError = { message: "Host exited a third time." };
ports[3].emitDisconnect();
chrome.runtime.lastError = null;
const thirdRetry = timers[timers.length - 1];
assert.equal(thirdRetry.delay, 5000, "la espera sigue aumentando mientras no haya conexión estable");

bridge.stop();
assert.ok(tabMessages.some((item) => item.message.type === "SIGNAL_CAPTION_SESSION_END" && item.message.reason === "native-stopped"), "al detener el bridge se conserva el historial de la sesión terminada");
assert.equal(bridge.isFresh(4500), false);

console.log("LIVE_CAPTION_BRIDGE_TEST=PASS");
