import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("extension/mic-guard-main.js", "utf8");
const KEY = "__SIGNAL_INTERPRETER_MAIN_MIC_GUARD_V1__";

class Track {
  constructor(id) { this.kind = "audio"; this.id = id; this.enabled = true; this.readyState = "live"; }
  clone() { return new Track(this.id + "-clone"); }
}
class Sender {
  constructor(track) { this.track = track; }
  replaceTrack(track) { this.track = track; return Promise.resolve(); }
}
class PeerConnection {
  constructor() { this.senders = []; }
  addTrack(track) { const sender = new Sender(track); this.senders.push(sender); return sender; }
  addTransceiver(track) { const sender = new Sender(track); this.senders.push(sender); return { sender }; }
  getSenders() { return this.senders.slice(); }
}
class CustomEventStub {
  constructor(type, init) { this.type = type; this.detail = init && init.detail; }
}
class EventTargetStub {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn) { const rows = this.listeners.get(type) || []; rows.push(fn); this.listeners.set(type, rows); }
  removeEventListener(type, fn) { this.listeners.set(type, (this.listeners.get(type) || []).filter((x) => x !== fn)); }
  dispatchEvent(event) { for (const fn of (this.listeners.get(event.type) || []).slice()) fn(event); }
}
function markLegacy(fn) {
  Object.defineProperty(fn, "__signalMicWrapped", { value: true });
  return fn;
}

const nativeMethods = {
  addTrack: PeerConnection.prototype.addTrack,
  addTransceiver: PeerConnection.prototype.addTransceiver,
  getSenders: PeerConnection.prototype.getSenders,
  replaceTrack: Sender.prototype.replaceTrack,
  clone: Track.prototype.clone
};
// Simulate the 0.10.52 MAIN-world wrappers: they carry __signalMicWrapped,
// but no original-method pointer, and their closed-over mute variable is stale.
let legacyMuted = true;
PeerConnection.prototype.addTrack = markLegacy(function (track) {
  const sender = nativeMethods.addTrack.call(this, track);
  if (track && track.kind === "audio" && legacyMuted) track.enabled = false;
  return sender;
});
PeerConnection.prototype.addTransceiver = markLegacy(function (track) {
  const result = nativeMethods.addTransceiver.call(this, track);
  if (track && track.kind === "audio" && legacyMuted) track.enabled = false;
  return result;
});
PeerConnection.prototype.getSenders = markLegacy(function () {
  const rows = nativeMethods.getSenders.call(this);
  rows.forEach((sender) => { if (sender.track && legacyMuted) sender.track.enabled = false; });
  return rows;
});
Sender.prototype.replaceTrack = markLegacy(function (track) {
  if (track && track.kind === "audio" && legacyMuted) track.enabled = false;
  return nativeMethods.replaceTrack.call(this, track);
});
Track.prototype.clone = markLegacy(function () {
  const clone = nativeMethods.clone.call(this);
  if (legacyMuted) clone.enabled = false;
  return clone;
});

const oldTimerId = 0;
const clearedIntervals = [];
const intervals = [];
const oldTracks = new Map();
const oldSenders = new Set();
const previousState = {
  version: "1.0", muted: true, tracks: oldTracks, senders: oldSenders,
  patches: { gum: true, addTrack: true, addTransceiver: true, replaceTrack: true, clone: true },
  timer: oldTimerId
};
const document = new EventTargetStub();
document.querySelectorAll = () => [];
const windowObject = new EventTargetStub();
Object.assign(windowObject, {
  [KEY]: previousState,
  RTCPeerConnection: PeerConnection,
  RTCRtpSender: Sender,
  MediaStreamTrack: Track,
  location: { origin: "https://app.cloudinterpreter.com" },
  postMessage() {},
  querySelectorAll() { return []; }
});
windowObject.window = windowObject;
windowObject.top = windowObject;
const navigator = { mediaDevices: { getUserMedia: async () => ({ getAudioTracks: () => [], getTracks: () => [] }) } };
const sandbox = {
  window: windowObject, navigator, document, CustomEvent: CustomEventStub,
  console, Map, Set, Array, Object, Promise, Date, JSON, String, Number, Boolean, Math,
  location: windowObject.location,
  setInterval(fn) { intervals.push(fn); return intervals.length - 1; },
  clearInterval(id) { clearedIntervals.push(id); intervals[id] = null; },
  setTimeout, clearTimeout
};

vm.runInNewContext(source, sandbox, { filename: "mic-guard-main.js" });
const state = windowObject[KEY];
assert.equal(state.version, "2.0", "hotload must migrate the shared state object");
assert.equal(state, previousState, "legacy tracks/senders and state identity must be retained");
assert.equal(state.legacyWrappers, true, "legacy wrapper migration must be recorded");
assert.ok(clearedIntervals.includes(oldTimerId), "the 0.10.52 watchdog must stop, including timer ID zero");

const pc = new windowObject.RTCPeerConnection();
const before = new Track("existing-call-track");
const sender = pc.addTrack(before);
assert.equal(before.enabled, false, "normal muted call policy still applies after migration");
assert.ok(state.tracks.has(before.id), "new outer wrapper must record tracks behind legacy wrappers");
assert.ok(state.senders.has(sender), "new outer wrapper must record senders behind legacy wrappers");

const release = windowObject.__SIGNAL_INTERPRETER_MIC_EMERGENCY_RELEASE__;
assert.equal(typeof release, "function", "independent emergency API must be published");
const result = release("legacy-migration-test");
assert.equal(result.ok, true);
assert.equal(result.released, true);
assert.equal(result.muted, false);
assert.equal(result.timerStopped, true);
assert.equal(result.restoredPatchCount, 0, "legacy native methods are not falsely reported as restored");
assert.equal(result.compatibilityShimActive, true, "legacy pass-through shim must remain for safety");
assert.equal(before.enabled, true, "an existing outgoing track must be released");

legacyMuted = true; // The old closure cannot be mutated from this new runtime.
const afterRelease = new Track("track-created-after-emergency");
const afterSender = pc.addTrack(afterRelease);
assert.equal(afterSender.track.enabled, true,
  "outer compatibility shim must override a stale legacy wrapper that re-mutes new tracks");
const transceiverTrack = new Track("transceiver-after-emergency");
pc.addTransceiver(transceiverTrack);
assert.equal(transceiverTrack.enabled, true,
  "transceiver shim must leave new audio tracks enabled after emergency release");
const replacement = new Track("replace-after-emergency");
await afterSender.replaceTrack(replacement);
assert.equal(replacement.enabled, true,
  "replaceTrack shim must leave replacement audio enabled after emergency release");
const cloned = replacement.clone();
assert.equal(cloned.enabled, true,
  "clone shim must leave cloned audio enabled after emergency release");
pc.getSenders().forEach((item) => assert.equal(item.track.enabled, true));

assert.equal(state.emergencyShimActive, true);
assert.equal(intervals.some((fn) => typeof fn === "function"), false,
  "the new watchdog must be stopped after emergency release");
assert.equal(PeerConnection.prototype.addTrack.__signalMicWrapped, true,
  "compatibility wrapper remains installed because the old native method was not retained");

console.log("MICROPHONE_LEGACY_HOTLOAD_TEST=PASS");
