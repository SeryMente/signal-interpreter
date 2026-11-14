import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const popup = fs.readFileSync("extension/ui/popup.html", "utf8");
const source = fs.readFileSync("extension/ui/tab-audio-preflight.js", "utf8");
assert.ok(manifest.permissions.includes("tabCapture"));
for (const id of ["tabAudioPreflightStart", "tabAudioPreflightStop", "tabAudioPreflightMeter", "tabAudioPreflightHeard", "tabAudioPreflightNotHeard"]) {
  assert.ok(popup.includes('id="' + id + '"'), "missing tab audio control: " + id);
}
assert.ok(popup.includes('src="tab-audio-preflight.js"'));
assert.ok(source.includes("api.tabCapture.capture({ audio: true, video: false }"));
assert.ok(source.includes("gain.connect(context.destination)"));
assert.ok(source.includes("getFloatTimeDomainData"));
assert.ok(source.includes("callState.callStartedAt"));
assert.ok(!source.includes("getUserMedia"), "tab output test must not request microphone access");
assert.ok(!source.includes("chrome.storage.local.set"), "tab audio must not be persisted");
assert.ok(!source.includes("fetch("), "tab audio must not be transmitted");

function element() {
  const handlers = {};
  return {
    disabled: false, textContent: "", value: 0, attrs: {},
    addEventListener(name, fn) { handlers[name] = fn; },
    click() { if (handlers.click) handlers.click(); },
    setAttribute(name, value) { this.attrs[name] = value; }
  };
}

function makeHarness({ url = "https://app.cloudinterpreter.com/profile/test", muted = false, activeCall = false, signalPresent = true, captureError = null, deferInjection = false } = {}) {
  const elements = {
    startButton: element(), stopButton: element(), heardButton: element(), notHeardButton: element(),
    status: element(), badge: element(), meter: element(), level: element()
  };
  let rafCallback = null, timerCallback = null, captureCalls = 0, closed = false, released = 0, storageChanged = null, tabUpdated = null, resolveInjection = null;
  const track = { readyState: "live", onended: null, stop() { released += 1; this.readyState = "ended"; } };
  const stream = { getAudioTracks: () => [track], getTracks: () => [track] };
  const analyser = {
    fftSize: 2048, smoothingTimeConstant: 0,
    getFloatTimeDomainData(buffer) { buffer.fill(signalPresent ? 0.12 : 0); }
  };
  const audioContext = {
    state: "running", destination: {},
    createMediaStreamSource() { return { connect() {}, disconnect() {} }; },
    createAnalyser() { return analyser; },
    createGain() { return { gain: { value: 0 }, connect() {}, disconnect() {} }; },
    async close() { closed = true; this.state = "closed"; },
    async resume() { this.state = "running"; }
  };
  class FakeAudioContext { constructor() { return audioContext; } }
  const api = {
    tabs: { async query() { return [{ id: 7, url, mutedInfo: { muted } }]; }, onUpdated: { addListener(fn) { tabUpdated = fn; } } },
    storage: { local: { async get() { return { effectifState: activeCall ? { callStartedAt: new Date().toISOString() } : {} }; } }, onChanged: { addListener(fn) { storageChanged = fn; } } },
    runtime: { lastError: null },
    tabCapture: {
      capture(options, callback) {
        captureCalls += 1;
        assert.equal(options.audio, true, "tab capture must request audio");
        assert.equal(options.video, false, "tab capture must not request video");
        if (captureError) api.runtime.lastError = { message: captureError };
        callback(captureError ? null : stream);
        api.runtime.lastError = null;
      }
    },
    scripting: { executeScript() { return deferInjection ? new Promise(resolve => { resolveInjection = resolve; }) : Promise.resolve([{ result: { ok: true, durationMs: 1450 } }]); } }
  };
  const scope = {
    chrome: api, AudioContext: FakeAudioContext, URL, Promise, Math, Number, String, Object, Array, Float32Array, Uint8Array
  };
  scope.window = scope;
  vm.runInNewContext(source, scope, { filename: "tab-audio-preflight.js" });
  const controller = scope.SignalTabAudioPreflight.create({
    chrome: api, AudioContext: FakeAudioContext,
    requestAnimationFrame(fn) { rafCallback = fn; return 1; },
    cancelAnimationFrame() { rafCallback = null; },
    setTimeout(fn) { timerCallback = fn; return 1; },
    clearTimeout() { timerCallback = null; },
    elements
  });
  return {
    controller, elements,
    initialize: () => controller.initialize(),
    start: () => controller.start(),
    sample() { if (rafCallback) rafCallback(); },
    finish() { if (timerCallback) timerCallback(); },
    get captureCalls() { return captureCalls; },
    get released() { return released; },
    get closed() { return closed; },
    triggerStoredActiveCall() { if (storageChanged) storageChanged({ effectifState: { newValue: { callStartedAt: new Date().toISOString() } } }, "local"); },
    triggerCallRoute() { if (tabUpdated) tabUpdated(7, { url: "https://app.cloudinterpreter.com/call/active-id" }, { url: "https://app.cloudinterpreter.com/call/active-id" }); },
    resolveInjection() { if (resolveInjection) resolveInjection([{ result: { ok: true, durationMs: 1450 } }]); }
  };
}

const success = makeHarness();
assert.equal(await success.initialize(), true);
assert.equal(await success.start(), true, "start failed: " + success.controller.getState() + " / " + success.elements.status.textContent);
assert.equal(success.captureCalls, 1);
success.sample();
success.finish();
await new Promise(resolve => setImmediate(resolve));
assert.equal(success.controller.getState(), "captured");
assert.ok(success.elements.meter.value > 0);
assert.equal(success.controller.confirmAudible(true), true);
assert.equal(success.controller.getState(), "passed");
assert.equal(success.released, 1);
assert.equal(success.closed, true);

const notHeard = makeHarness();
await notHeard.initialize();
await notHeard.start();
notHeard.sample();
notHeard.finish();
await new Promise(resolve => setImmediate(resolve));
assert.equal(notHeard.controller.confirmAudible(false), true);
assert.equal(notHeard.controller.getState(), "failed");
assert.equal(notHeard.controller.getResult().captured, true);
assert.equal(notHeard.controller.getResult().confirmedAudible, false);

const silent = makeHarness({ signalPresent: false });
await silent.initialize();
await silent.start();
silent.sample();
silent.finish();
await new Promise(resolve => setImmediate(resolve));
assert.equal(silent.controller.getState(), "failed");
assert.equal(silent.controller.getResult().captured, false);

const activeCall = makeHarness({ activeCall: true });
assert.equal(await activeCall.initialize(), false);
assert.equal(await activeCall.start(), false);
assert.equal(activeCall.captureCalls, 0);

const callRoute = makeHarness({ url: "https://app.cloudinterpreter.com/call/opaque-id" });
assert.equal(await callRoute.initialize(), false);
assert.equal(callRoute.captureCalls, 0);

const muted = makeHarness({ muted: true });
assert.equal(await muted.initialize(), false);
assert.equal(muted.captureCalls, 0);

const denied = makeHarness({ captureError: "Permission denied" });
await denied.initialize();
assert.equal(await denied.start(), false);
assert.equal(denied.controller.getState(), "failed");

const interruptedByState = makeHarness({ deferInjection: true });
await interruptedByState.initialize();
const interruptedStart = interruptedByState.start();
await new Promise(resolve => setImmediate(resolve));
assert.equal(typeof interruptedByState.resolveInjection, "function");
interruptedByState.triggerStoredActiveCall();
await new Promise(resolve => setImmediate(resolve));
assert.equal(interruptedByState.controller.getState(), "failed", "starting a call must cancel an active tab preflight");
assert.equal(interruptedByState.released, 1, "call-start cancellation must release the captured track");
assert.equal(interruptedByState.closed, true, "call-start cancellation must close the AudioContext");
interruptedByState.resolveInjection();
assert.equal(await interruptedStart, false, "late script completion must not revive a preflight cancelled by call start");

const interruptedByRoute = makeHarness({ deferInjection: true });
await interruptedByRoute.initialize();
const routeStart = interruptedByRoute.start();
await new Promise(resolve => setImmediate(resolve));
interruptedByRoute.triggerCallRoute();
await new Promise(resolve => setImmediate(resolve));
assert.equal(interruptedByRoute.controller.getState(), "failed", "navigating to /call must cancel the preflight");
assert.equal(interruptedByRoute.released, 1, "call-route cancellation must release the captured track");
assert.equal(interruptedByRoute.closed, true, "call-route cancellation must close the AudioContext");
interruptedByRoute.resolveInjection();
assert.equal(await routeStart, false);

const disposed = makeHarness();
await disposed.initialize();
await disposed.start();
await disposed.controller.dispose();
assert.equal(disposed.released, 1);
assert.equal(disposed.closed, true);

console.log("TAB_AUDIO_PREFLIGHT_TEST=PASS");
