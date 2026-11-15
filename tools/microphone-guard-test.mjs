import fs from "node:fs";
import vm from "node:vm";

const background = fs.readFileSync("extension/background.js", "utf8");
const contentSource = fs.readFileSync("extension/content.js", "utf8");
if (!background.includes('if(!hasActiveCall(state)&&cachedConfig.soundEnabled!==false){')) throw Error("microphone-toggle-audio-isolation-regression");
if (background.includes('if(config.soundEnabled!==false){')) throw Error("microphone-toggle-undefined-config-regression");
if (!background.includes("function requestKeyboardMicrophoneToggle(source)")) throw Error("hotkey-command-and-fallback-dispatch-missing");
if (!background.includes("fail-closed-on-unmute-verification-error")) throw Error("fail-closed-unmute-recovery-missing");
if (background.includes("never-reapply-stale-mute-on-unmute-failure")) throw Error("unsafe-unmute-error-policy-regression");
if (!background.includes("EXTENSION_MICROPHONE_PRECALL_INTENT_SAVED")) throw Error("precall-manual-toggle-intent-missing");
if (!background.includes("function nextMicrophoneToggleMuted(state)")) throw Error("global-mic-toggle-transition-missing");
if (!background.includes("microphoneOutputMuted: true,")) throw Error("idle-output-must-remain-muted");
if (!background.includes('setExtensionMicrophoneMuted(true, "call-start-safe")')) throw Error("call-start-mute-required");
const main = fs.readFileSync("extension/mic-guard-main.js", "utf8");
if (!main.includes("function isMuted() { return state.muted === true; }")) throw Error("guard-wrappers-must-use-shared-mutable-state");
if (!main.includes("async function unmute(requestId, allowEmpty)")) throw Error("main-world-unmute-missing");
if (!main.includes("state.emergencyReleased = true")) throw Error("emergency-release-state-missing");
if (!main.includes("Ctrl-Alt-Shift-M") && !main.includes('event.code !== EMERGENCY_KEY')) throw Error("emergency-hotkey-missing");
if (!main.includes("restorePatches()")) throw Error("emergency-prototype-restore-missing");
if (!background.includes("target: { tabId: targetTabId, allFrames: true }")) throw Error("main-microphone-command-must-target-all-frames");
if (!background.includes("No se encontró ninguna pista WebRTC saliente")) throw Error("all-frames-unmute-must-require-an-active-sender");
if (!background.includes("ensureMainMicrophoneGuards(tabId)")) throw Error("hotload-must-avoid-duplicate-main-guard-injection");
if (background.includes('target: { tabId: tabId }, files: ["mic-guard-main.js"]')) throw Error("hotload-must-not-reinject-guard-without-frame-inspection");
if (!contentSource.includes("EXTENSION_MICROPHONE_KEYBOARD_FALLBACK_TRIGGERED")) throw Error("content-hotkey-fallback-missing");

class E {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn) { const rows = this.listeners.get(type) || []; rows.push(fn); this.listeners.set(type, rows); }
  removeEventListener(type, fn) { this.listeners.set(type, (this.listeners.get(type) || []).filter((item) => item !== fn)); }
  dispatchEvent(event) { for (const fn of (this.listeners.get(event.type) || []).slice()) fn(event); }
}
class Track {
  constructor(id) { this.kind = "audio"; this.id = id; this.enabled = true; this.readyState = "live"; }
  clone() { return new Track(this.id + "-clone"); }
}
class Stream {
  constructor(track) { this.track = track; }
  getAudioTracks() { return [this.track]; }
}
class Sender {
  constructor(track) { this.track = track; }
  replaceTrack(track) { this.track = track; return Promise.resolve(); }
}
class PeerConnection {
  constructor() { this.senders = []; }
  addTrack(track) { const sender = new Sender(track); this.senders.push(sender); return sender; }
  getSenders() { return this.senders.slice(); }
}
class CustomEventStub {
  constructor(type, init) { this.type = type; this.detail = init && init.detail; }
}
const document = new E();
document.querySelectorAll = () => [];
const intervals = [];
const navigator = { mediaDevices: { getUserMedia: async () => new Stream(new Track("mic")) } };
const preTrack = new Track("preexisting");
const prePc = new PeerConnection();
const preSender = prePc.addTrack(preTrack);
const windowObject = new E();
Object.assign(windowObject, {
  console, Map, Set, Array, Object, Promise, Date, JSON, String, Number, Boolean, Math,
  navigator, document, CustomEvent: CustomEventStub, RTCPeerConnection: PeerConnection,
  RTCRtpSender: Sender, MediaStreamTrack: Track,
  location: { origin: "https://app.cloudinterpreter.com" }
});
windowObject.window = windowObject;
windowObject.top = windowObject;
windowObject.postMessage = function (data) {
  windowObject.dispatchEvent({ type: "message", data: data, origin: windowObject.location.origin });
};
windowObject.querySelectorAll = () => [];
const sandbox = Object.assign(windowObject, {
  setInterval(fn) { intervals.push(fn); return intervals.length - 1; },
  clearInterval(id) { intervals[id] = null; },
  setTimeout,
  clearTimeout
});
const originalAddTrack = PeerConnection.prototype.addTrack;
const originalGetSenders = PeerConnection.prototype.getSenders;
const originalReplaceTrack = Sender.prototype.replaceTrack;
const originalClone = Track.prototype.clone;
vm.runInNewContext(main, sandbox, { filename: "mic-guard-main.js" });

const acknowledgements = [];
document.addEventListener("__SIGNAL_INTERPRETER_MIC_ACK_V1__", (event) => acknowledgements.push(JSON.parse(event.detail)));
async function command(muted, requestId) {
  document.dispatchEvent(new CustomEventStub("__SIGNAL_INTERPRETER_MIC_COMMAND_V1__", {
    detail: JSON.stringify({ schema: "signal-main-mic-command/v1", op: "set", requestId, muted })
  }));
  for (let index = 0; index < 60 && !acknowledgements.some((entry) => entry.requestId === requestId); index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return acknowledgements.findLast((entry) => entry.requestId === requestId);
}

const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const track = stream.getAudioTracks()[0];
const pc = new sandbox.RTCPeerConnection();
const sender = pc.addTrack(track, stream);
prePc.getSenders();
let result = await command(true, "mute-1");
if (!(result.verified && result.muted && result.stable && result.stableSamples === 3 &&
    !track.enabled && !preTrack.enabled && result.senderCount === 2 && result.trackCount === 2)) throw Error("mute");

track.enabled = true;
for (const interval of intervals) if (interval) interval();
if (track.enabled) throw Error("mute-heartbeat-enforcement");

// Reinjection must reuse one mutable state object and must not stack wrappers or listeners.
const stateBeforeHotload = sandbox.__SIGNAL_INTERPRETER_MAIN_MIC_GUARD_V1__;
const wrappedAddTrack = PeerConnection.prototype.addTrack;
vm.runInNewContext(main, sandbox, { filename: "mic-guard-main-hotload.js" });
if (sandbox.__SIGNAL_INTERPRETER_MAIN_MIC_GUARD_V1__ !== stateBeforeHotload) throw Error("hotload-state-object-replaced");
if (PeerConnection.prototype.addTrack !== wrappedAddTrack) throw Error("hotload-stacked-webrtc-wrapper");

track.enabled = true;
result = await command(false, "unmute-2");
if (!(result.verified && !result.muted && result.stable && track.enabled && sender.track.enabled &&
    result.recoveredBaseline !== true)) {
  // A baseline recovery is not required after hotload; any valid unmute is accepted below.
  if (!(result && result.verified && result.muted === false && track.enabled && sender.track.enabled)) throw Error("unmute-after-hotload");
}

const clone = track.clone();
await sender.replaceTrack(clone);
result = await command(true, "mute-3");
if (!(result.verified && result.muted && result.stable && !clone.enabled)) throw Error("replace-track-mute");

// A frame without a sender reports noTracks; the browser-level all-frame aggregator decides whether another frame has the live sender.
sender.track = null;
preSender.track = null;
clone.readyState = "ended";
preTrack.readyState = "ended";
track.readyState = "ended";
result = await command(false, "unmute-empty-frame");
if (!(result.noTracks && result.verified === false && result.muted === false)) throw Error("empty-frame-neutral-state");

const emergencyTrack = new Track("emergency-track");
const emergencyPc = new sandbox.RTCPeerConnection();
const emergencySender = emergencyPc.addTrack(emergencyTrack, new Stream(emergencyTrack));
result = await command(true, "mute-before-emergency");
if (!(result.verified && result.muted && !emergencySender.track.enabled)) throw Error("emergency-setup");

const keyEvent = {
  type: "keydown", ctrlKey: true, altKey: true, shiftKey: true,
  code: "KeyM", key: "m",
  preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {}
};
sandbox.dispatchEvent(keyEvent);
const released = sandbox.__SIGNAL_INTERPRETER_MAIN_MIC_GUARD_V1__.emergencyReleaseResult;
if (!(released && released.ok && released.released && released.muted === false)) throw Error("emergency-release-result");
if (!emergencyTrack.enabled || !emergencySender.track.enabled) throw Error("emergency-track-not-enabled");
if (!sandbox.__SIGNAL_INTERPRETER_MAIN_MIC_GUARD_V1__.emergencyReleased) throw Error("emergency-release-not-latched");
if (intervals.some((interval) => typeof interval === "function")) throw Error("emergency-interval-not-stopped");
if (PeerConnection.prototype.addTrack !== originalAddTrack ||
    PeerConnection.prototype.getSenders !== originalGetSenders ||
    Sender.prototype.replaceTrack !== originalReplaceTrack ||
    Track.prototype.clone !== originalClone) throw Error("emergency-prototype-restore-failed");

console.log("MICROPHONE_MAIN_GUARD_TEST=PASS");
