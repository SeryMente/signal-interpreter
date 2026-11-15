import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("extension/mic-guard-main.js", "utf8");
const KEY = "__SIGNAL_INTERPRETER_MAIN_MIC_GUARD_V1__";

class FakeTrack {
  constructor(id) { this.kind = "audio"; this.id = id; this.enabled = true; this.readyState = "live"; }
  clone() { return new FakeTrack(this.id + "-clone"); }
}
class FakeStream {
  constructor(track) { this.track = track; }
  getAudioTracks() { return [this.track]; }
}
class FakeMediaDevices {
  async getUserMedia() { return new FakeStream(new FakeTrack("local-preflight")); }
}
class FakeSender {
  constructor(track) { this.track = track; }
  replaceTrack(track) { this.track = track; return Promise.resolve(); }
}
class FakePeerConnection {
  constructor() { this.senders = []; }
  addTrack(track) { const sender = new FakeSender(track); this.senders.push(sender); return sender; }
  addTransceiver(track) { return { sender: new FakeSender(track) }; }
  getSenders() { return this.senders.slice(); }
}
class FakeCustomEvent {
  constructor(type, init) { this.type = type; this.detail = init && init.detail; }
}
const documentListeners = new Map();
const document = {
  addEventListener(type, listener) {
    const list = documentListeners.get(type) || [];
    list.push(listener);
    documentListeners.set(type, list);
  },
  dispatchEvent(event) {
    for (const listener of (documentListeners.get(event.type) || []).slice()) listener(event);
  }
};

const mediaDevices = new FakeMediaDevices();
const nativeGetUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
const legacyWrapper = function (constraints) {
  return nativeGetUserMedia(constraints).then((stream) => {
    if (constraints && constraints.audio) stream.getAudioTracks().forEach((track) => { track.enabled = false; });
    return stream;
  });
};
Object.defineProperty(legacyWrapper, "__signalMicWrapped", { value: true });
Object.defineProperty(mediaDevices, "getUserMedia", {
  value: legacyWrapper, configurable: true, writable: true
});

const oldTimer = 77;
const previousState = {
  version: "1.0", muted: true, tracks: new Map(), senders: new Set(),
  patches: { gum: true, addTrack: true, addTransceiver: true, replaceTrack: true, clone: true },
  timer: oldTimer
};
const clearedIntervals = [];
const intervals = [];
const windowObject = {
  [KEY]: previousState,
  navigator: { mediaDevices },
  RTCPeerConnection: FakePeerConnection,
  RTCRtpSender: FakeSender,
  MediaStreamTrack: FakeTrack
};
const sandbox = {
  window: windowObject,
  navigator: windowObject.navigator,
  document,
  CustomEvent: FakeCustomEvent,
  Map, Set, Array, Object, Promise, Date, JSON, String, Number, Boolean, Math,
  setInterval(fn) { intervals.push(fn); return intervals.length - 1; },
  clearInterval(id) { clearedIntervals.push(id); intervals[id] = null; },
  setTimeout
};

vm.runInNewContext(source, sandbox, { filename: "mic-guard-main.js" });

assert.equal(clearedIntervals.includes(oldTimer), true,
  "hotload must stop the previous guard heartbeat");
assert.equal(Object.prototype.hasOwnProperty.call(mediaDevices, "getUserMedia"), false,
  "hotload must remove the old getUserMedia wrapper that muted local preflight");
assert.equal(windowObject[KEY].muted, true,
  "the default outbound policy must remain fail-closed");

const localStream = await mediaDevices.getUserMedia({ audio: true, video: false });
const localTrack = localStream.getAudioTracks()[0];
assert.equal(localTrack.enabled, true,
  "local device preflight must receive an enabled audio track before any RTP sender exists");

const pc = new windowObject.RTCPeerConnection();
const sender = pc.addTrack(localTrack, localStream);
assert.equal(sender.track, localTrack);
assert.equal(localTrack.enabled, false,
  "the same track must be muted as soon as it becomes an outgoing WebRTC sender");
assert.equal(windowObject[KEY].tracks.has(localTrack.id), true,
  "only the sender-bound track belongs in the outbound mute ledger");
assert.equal(windowObject[KEY].senders.has(sender), true,
  "the outbound sender must remain tracked for mute verification");

console.log("MICROPHONE_LOCAL_PREFLIGHT_GUARD_TEST=PASS");
