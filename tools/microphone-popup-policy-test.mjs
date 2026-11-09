import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const popup = fs.readFileSync("extension/ui/popup.js", "utf8");
const background = fs.readFileSync("extension/background.js", "utf8");
const start = popup.indexOf("  function renderMicrophone() {");
const end = popup.indexOf("\n\n  function render() {", start);
assert(start >= 0 && end > start, "renderMicrophone boundaries");

const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) {
    const classes = new Set();
    nodes.set(id, {
      textContent: "",
      title: "",
      attrs: {},
      classList: {
        add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)),
        contains: name => classes.has(name)
      },
      setAttribute: function (key, value) { this.attrs[key] = value; },
      _classes: classes
    });
  }
  return nodes.get(id);
}
function render(state, microphoneBlockedReason = null) {
  nodes.clear();
  const context = { state, microphoneBlockedReason, $: node };
  vm.runInNewContext(popup.slice(start, end), context);
  vm.runInNewContext("renderMicrophone()", context);
  return {
    label: node("micToggleLabel").textContent,
    meta: node("micToggleMeta").textContent,
    status: node("micStatus").textContent,
    isMuted: node("micToggle").classList.contains("is-muted"),
    isError: node("micToggle").classList.contains("is-error")
  };
}
const idle = render({
  callId: null, callStartedAt: null, callSourceTabId: null,
  microphoneMuted: true, microphoneMuteStatus: "unapplied",
  microphoneOutputStatus: "unapplied"
});
assert.equal(idle.label, "MIC OFF");
assert.equal(idle.meta, "Disponible durante una llamada aceptada");
assert.match(idle.status, /solo se activa durante una llamada aceptada/i);
assert.equal(idle.isMuted, true);
assert.equal(idle.isError, false);

const blockedRoute = render({
  callId: "opaque", callStartedAt: "2026-11-09T17:00:00.000Z", callSourceTabId: 7,
  microphoneMuted: true, microphoneMuteStatus: "unapplied",
  microphoneOutputStatus: "unapplied"
}, "call-route-not-active");
assert.equal(blockedRoute.label, "MIC OFF");
assert.match(blockedRoute.meta, /Llamada no reconocida/i);
assert.equal(blockedRoute.isError, false);

const realFailure = render({
  callId: "opaque", callStartedAt: "2026-11-09T17:00:00.000Z", callSourceTabId: 7,
  microphoneMuted: true, microphoneMuteStatus: "error",
  microphoneOutputStatus: "error", microphoneMuteRequested: false
});
assert.equal(realFailure.label, "MIC ERR");
assert.equal(realFailure.isError, true);

const activeOn = render({
  callId: "opaque", callStartedAt: "2026-11-09T17:00:00.000Z", callSourceTabId: 7,
  microphoneMuted: false, microphoneMuteStatus: "applied",
  microphoneOutputStatus: "applied"
});
assert.equal(activeOn.label, "MIC ON");
assert.equal(activeOn.isError, false);

assert(popup.includes('response.blocked===true&&response.verified===true&&response.muted===true'),
  "popup must distinguish verified policy denials from hardware errors");
assert(background.includes('if(/MICROPHONE/.test(a))return"MICROPHONE"'), "microphone incidents have a dedicated observability category");
assert(background.includes("activeCallDetected: outputRequired"));
assert(background.includes("outputControlAttempted: false"));
assert(background.includes("hardwarePermissionRequested: false"));
assert(background.includes("ok: false, blocked: true, applied: false"));
console.log(JSON.stringify({
  suite: "microphone-popup-policy",
  cases: 4,
  checks: 12,
  policyDenialIsNotHardwareError: true,
  realVerificationFailuresStillVisible: true,
  result: "PASS"
}, null, 2));