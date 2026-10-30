import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const background = readFileSync("extension/background.js", "utf8");
const popup = readFileSync("extension/ui/popup.js", "utf8");

assert.match(background, /var\s+captionCaptureBlock\s*=\s*null\s*;/,
  "The service worker must declare captionCaptureBlock before message handlers assign it.");
assert.match(background,
  /message\.type\s*===\s*"SIGNAL_CAPTION_RETRY_ACTIVE_CALL"[\s\S]{0,100}captionCaptureBlock\s*=\s*null/,
  "Retry-active-call handler must reset the declared capture block without throwing.");
assert.match(background,
  /message\.type\s*===\s*"SIGNAL_CAPTION_PREPARE_DURABLE_CAPTURE"[\s\S]{0,120}captionCaptureBlock\s*=\s*null/,
  "Durable-capture preparation handler must reset the declared capture block without throwing.");
assert.match(popup, /SIGNAL_CAPTION_RETRY_ACTIVE_CALL/,
  "Popup startup must retain its active-call retry message.");

console.log("BACKGROUND_CAPTION_CAPTURE_STATE=PASS");
