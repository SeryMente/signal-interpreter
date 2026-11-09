import fs from "node:fs";
import assert from "node:assert/strict";

const content = fs.readFileSync("extension/content.js", "utf8");
const popup = fs.readFileSync("extension/ui/popup.html", "utf8");
const popupJs = fs.readFileSync("extension/ui/popup.js", "utf8");
const captions = fs.readFileSync("extension/live-caption-overlay.js", "utf8");

assert(content.includes('isAuthorizedProfilePage() && !callId && config.overlaysGlobalEnabled !== false'),
  "the pre-call Auto-Answer status panel must be profile-only and absent during a call");
assert(content.includes('var shouldShow = isTarget() && !!callId && config.callOverlayControlVisible !== false;'),
  "the in-call controller must be visible on an active call route by default");
assert(content.includes('callOverlayControlVisible: true;') || content.includes('callOverlayControlVisible: true,'),
  "the in-call controller defaults to visible");
assert(content.includes('id = "signal-interpreter-call-overlay-control"'),
  "the persistent in-call controller has a dedicated host");
assert(content.includes("z-index:2147483647;top:12px;left:12px"),
  "the in-call controller remains above other extension overlays");
assert(content.includes('button.textContent = callOverlayToggleBusy ? "APLICANDO…" : (visible ? "OCULTAR OVERLAYS" : "MOSTRAR OVERLAYS")'),
  "the button reports the current global overlay state");
assert(content.includes("next.overlaysGlobalEnabled = next.overlaysGlobalEnabled === false"),
  "the call control toggles the persisted global overlay preference");
assert(content.includes('source: "in-call-control"'),
  "the global toggle action is attributable without collecting transcript content");
assert(content.includes('callOverlayControlVisible !== false'),
  "the button can be hidden using its explicit popup preference");
assert(popup.includes('id="callOverlayControlVisible"'),
  "the extension popup exposes the visibility preference");
assert(popupJs.includes("callOverlayControlVisible: true"),
  "the popup defaults the in-call controller to visible");
assert(popupJs.includes('save({ callOverlayControlVisible: this.checked })'),
  "the popup can hide or restore the in-call controller");
assert(content.includes("renderCallOverlayControl();\n    emitAutoAnswerReadiness(\"route:\" + reason)"),
  "SPA call-route changes synchronize the persistent controller");
assert(captions.includes("overlaysGlobalEnabled !== false"),
  "captions remain subject to the global overlay switch");

console.log(JSON.stringify({
  suite: "call-overlay-visibility-policy",
  checks: 14,
  result: "PASS",
  environment: "static source contract assertions",
  realChromeAcceptance: false
}));
