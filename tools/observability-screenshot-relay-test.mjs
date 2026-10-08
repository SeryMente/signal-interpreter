import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {validateScreenshot} from "./observability-relay/api/screenshot.js";

const bytes=Buffer.from([0xFF,0xD8,...Array(256).fill(17),0xFF,0xD9]);
const base64=bytes.toString("base64");
const sha256=createHash("sha256").update(bytes).digest("hex");
const input={
  schema:"signal-interpreter-platform-screenshot/v1",
  origin:"https://app.cloudinterpreter.com",
  route:"/call/abcdefghijklmnopqrstuvwxyz",
  capturedAt:"2026-10-08T16:00:00.000Z",
  mimeType:"image/jpeg",
  sha256,
  base64
};
const normalized=validateScreenshot(input);
assert.equal(normalized.route,"/call/<ID>");
assert.equal(normalized.sha256,sha256);
assert.equal(normalized.bytes.length,bytes.length);
assert.throws(()=>validateScreenshot({...input,sha256:"0".repeat(64)}),/does not match image bytes/);
assert.throws(()=>validateScreenshot({...input,base64:Buffer.from([0,1,2,3]).toString("base64")}),/Invalid JPEG screenshot bytes/);
assert.throws(()=>validateScreenshot({...input,origin:"https://example.com"}),/Screenshot origin rejected/);
console.log("OBSERVABILITY_SCREENSHOT_RELAY_TEST=PASS");
