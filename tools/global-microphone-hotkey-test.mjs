import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const listeners = new Map();
const document = {
  addEventListener(type, fn, capture) {
    const key = type + ":" + String(!!capture);
    const list = listeners.get(key) || [];
    list.push(fn); listeners.set(key, list);
  },
  removeEventListener(type, fn, capture) {
    const key = type + ":" + String(!!capture);
    listeners.set(key, (listeners.get(key) || []).filter((item) => item !== fn));
  }
};
const sent = [];
const chrome = { runtime: { lastError: null, sendMessage(message, callback) {
  sent.push(message); if (callback) callback({ ok: true, verified: true, muted: true });
} } };
const scope = {
  document, chrome, console, window: null,
  addEventListener(type, fn, capture) {
    const key = type + ":" + String(!!capture);
    const list = listeners.get(key) || [];
    list.push(fn); listeners.set(key, list);
  },
  removeEventListener(type, fn, capture) {
    const key = type + ":" + String(!!capture);
    listeners.set(key, (listeners.get(key) || []).filter((item) => item !== fn));
  }
}; scope.window = scope;
vm.runInNewContext(fs.readFileSync("extension/hotkey-fallback.js", "utf8"), scope);
function event(overrides = {}) {
  return Object.assign({
    isTrusted: true, repeat: false, isComposing: false, ctrlKey: true, shiftKey: true,
    altKey: false, metaKey: false, code: "Period", key: ">",
    preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }
  }, overrides);
}
const listener = listeners.get("keydown:true")[0];
const good = event(); listener(good);
assert.equal(sent.length, 1);
assert.equal(sent[0].type, "SIGNAL_EXTENSION_MICROPHONE_KEYBOARD_FALLBACK");
assert.equal(sent[0].source, "global-content-hotkey-fallback");
assert.equal(good.prevented, true);
assert.equal(good.stopped, true);
const physicalKeyCodeFallback = event({ code: "Unidentified", key: ";", keyCode: 190, which: 190 });
listener(physicalKeyCodeFallback);
assert.equal(sent.length, 2, "physical period keyCode must work across keyboard layouts");
assert.equal(physicalKeyCodeFallback.prevented, true);
listener(event({ isTrusted: false }));
listener(event({ code: "KeyA", key: "a" }));
listener(event({ shiftKey: false }));
assert.equal(sent.length, 2);
console.log("GLOBAL_MICROPHONE_HOTKEY_TEST=PASS");