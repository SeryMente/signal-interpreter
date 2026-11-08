import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync("extension/content.js", "utf8");
const origin = "https://app.cloudinterpreter.com";
const profilePath = "/profile/cmu2wuz1v0uwr07adbzb9djfz";
const start = source.indexOf("  function isAuthorizedProfilePage() {");
const end = source.indexOf("  function readAvailabilityState() {", start);
assert(start >= 0 && end > start, "authorized profile helper boundaries");
const helper = source.slice(start, end);
function authorized(pathname) {
  const context = {
    location: { origin, pathname },
    AUTHORIZED_PROFILE_ORIGIN: origin,
    AUTHORIZED_PROFILE_PATH: profilePath
  };
  vm.runInNewContext(helper + "\nthis.result = isAuthorizedProfilePage();", context);
  return context.result;
}
assert.equal(authorized(profilePath), true, "profile root is authorized");
assert.equal(authorized(profilePath + "/logs"), true, "Statistics route is authorized");
assert.equal(authorized(profilePath + "/logs/scheduled"), true, "scheduled Statistics route is authorized");
assert.equal(authorized(profilePath + "/appointments"), true, "appointments route remains inside the authorized profile");
assert.equal(authorized("/profile/another-user/logs"), false, "a different profile is rejected");
assert.equal(authorized(profilePath + "-suffix/logs"), false, "prefix lookalike is rejected");

const clickStart = source.indexOf("  function onPlatformAvailabilityClick(event) {");
const clickEnd = source.indexOf("  function installAvailabilityClickListener()", clickStart);
assert(clickStart >= 0 && clickEnd > clickStart, "platform click listener boundaries");
const clickHandler = source.slice(clickStart, clickEnd);
assert(clickHandler.includes("event.isTrusted === false"), "synthetic/scripted clicks cannot arm availability");
assert(clickHandler.includes("click\\s+to\\s+go\\s+online"), "only explicit platform Online control starts activation");
assert(clickHandler.includes("platformOnlineActivationPending = true"), "activation intent is held pending platform confirmation");

const detectStart = source.indexOf("  function detectAvailability(");
const detectEnd = source.indexOf("  function mediaSnapshot(", detectStart);
assert(detectStart >= 0 && detectEnd > detectStart, "availability transition boundaries");
const detection = source.slice(detectStart, detectEnd);
assert(detection.includes('next === "online" && platformOnlineActivationPending'), "arming waits for a confirmed Online DOM state after a trusted click");
assert(detection.includes('next === "offline"'), "platform Offline revokes presence");
assert(detection.includes('next === "unknown" && previous === "online"'), "loss of confirmed availability fails closed");

assert(source.includes('id = "signal-interpreter-autoanswer-status"'), "independent Auto-Answer status overlay exists");
assert(source.includes('setStatusText(".call-state", callId ? "LLAMADA ACTIVA" : "NO CALL")'), "overlay distinguishes no-call from active-call state");
assert(source.includes('isAuthorizedProfilePage() && !callId'), "pre-call status overlay is restricted to the profile route with no active call");
assert(source.includes('config.overlaysGlobalEnabled !== false'), "pre-call status overlay respects the global hide-all switch");
assert(!source.includes('isAuthorizedProfilePage() || !!callId'), "pre-call status overlay cannot remain mounted on a call route");
assert(source.includes("startAvailabilityMonitor()"), "status overlay/availability monitor starts on authorized profile routes");
assert(source.includes("stopAvailabilityMonitor()"), "monitor and overlay have a teardown path");

console.log(JSON.stringify({
  suite: "platform-availability-overlay",
  environment: "Node VM + source contract assertions",
  checks: 20,
  result: "PASS",
  windowsAccepted: false
}));
