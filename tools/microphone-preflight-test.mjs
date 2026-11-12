import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const popup = fs.readFileSync("extension/ui/popup.html", "utf8");
const source = fs.readFileSync("extension/ui/microphone-preflight.js", "utf8");
assert.equal(manifest.version, "0.10.49");
assert.ok(popup.includes('id="micPreflightStart"'));
assert.ok(popup.includes('id="micPreflightStop"'));
assert.ok(popup.includes('id="micPreflightMeter"'));
assert.ok(popup.includes('src="microphone-preflight.js"'));
assert.ok(source.includes('getUserMedia({ audio: true, video: false })'));
assert.ok(source.includes("track.stop()"));
assert.ok(source.includes("MAX_TEST_DURATION_MS = 15000"));
assert.ok(!source.includes("chrome.runtime.sendMessage"), "preflight must not send audio or control messages");
function makeHarness(getUserMedia) {
  const elements = {};
  function element() {
    const handlers = {};
    return {
      disabled: false, textContent: "", value: 0, attrs: {},
      addEventListener(name, fn) { handlers[name] = fn; },
      click() { if (handlers.click) handlers.click(); },
      setAttribute(name, value) { this.attrs[name] = value; }
    };
  }
  elements.startButton=element(); elements.stopButton=element(); elements.status=element();
  elements.badge=element(); elements.meter=element(); elements.level=element();
  let nextFrameId=1, nextTimerId=1, closed=false, sourceTarget=null;
  const timers=new Map();
  const track={readyState:"live",stopCount:0,onended:null,stop(){this.stopCount+=1;this.readyState="ended";}};
  const analyser={fftSize:1024,smoothingTimeConstant:0,getByteTimeDomainData(buffer){buffer.fill(128);buffer[12]=190;buffer[13]=66;}};
  const context={state:"running",createAnalyser(){return analyser;},createMediaStreamSource(){return{connect(target){sourceTarget=target;},disconnect(){sourceTarget=null;}};},async close(){closed=true;this.state="closed";},async resume(){}};
  class FakeAudioContext { constructor(){return context;} }
  const scope={AudioContext:FakeAudioContext,navigator:{mediaDevices:{getUserMedia}},Uint8Array,Math,Promise,
    requestAnimationFrame(fn){return nextFrameId++;},cancelAnimationFrame(){},
    setTimeout(fn){const id=nextTimerId++;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);}};
  scope.window=scope;
  vm.runInNewContext(source,scope,{filename:"microphone-preflight.js"});
  const controller=scope.SignalMicrophonePreflight.create({mediaDevices:scope.navigator.mediaDevices,AudioContext:FakeAudioContext,
    requestAnimationFrame:scope.requestAnimationFrame,cancelAnimationFrame:scope.cancelAnimationFrame,
    setTimeout:scope.setTimeout,clearTimeout:scope.clearTimeout,elements});
  return {controller,elements,track,analyser,timers,context,get closed(){return closed;},get sourceTarget(){return sourceTarget;}};
}
let requests=0;
const success=makeHarness(async constraints=>{
  requests+=1;
  assert.deepEqual(JSON.parse(JSON.stringify(constraints)),{audio:true,video:false});
  return {getAudioTracks:()=>[success.track],getTracks:()=>[success.track]};
});
assert.equal(await success.controller.start(),true);
assert.equal(success.controller.getState(),"testing");
assert.equal(requests,1);
assert.equal(success.elements.stopButton.disabled,false);
assert.equal(success.sourceTarget,success.analyser,"test signal feeds only the local analyser");
assert.ok(success.elements.meter.value>0,"voice signal must move the local level meter");
assert.match(success.elements.level.textContent,/%/);
await success.controller.stop();
assert.equal(success.track.stopCount,1,"explicit stop releases the microphone track");
assert.equal(success.controller.getState(),"idle");
assert.equal(success.closed,true);
assert.equal(success.elements.meter.value,0);
const autoStop=makeHarness(async()=>({getAudioTracks:()=>[autoStop.track],getTracks:()=>[autoStop.track]}));
assert.equal(await autoStop.controller.start(),true);
const timeout=[...autoStop.timers.values()][0];
assert.equal(typeof timeout,"function");
timeout();
assert.equal(autoStop.track.stopCount,1,"15-second watchdog releases the microphone");
assert.equal(autoStop.controller.getState(),"idle");
const denied=makeHarness(async()=>{
  const error=new Error("permission denied");error.name="NotAllowedError";throw error;
});
assert.equal(await denied.controller.start(),false);
assert.equal(denied.controller.getState(),"failed");
assert.match(denied.elements.status.textContent,/Chrome bloqueó el permiso/);
assert.equal(denied.elements.startButton.disabled,false);

let resolvePending;
const pending = makeHarness(() => new Promise((resolve) => { resolvePending = resolve; }));
const pendingStart = pending.controller.start();
await Promise.resolve();
assert.equal(typeof resolvePending, "function", "permission request must be in flight");
await pending.controller.dispose();
assert.equal(pending.closed, true, "closing the popup must close a pending AudioContext");
resolvePending({ getAudioTracks: () => [pending.track], getTracks: () => [pending.track] });
assert.equal(await pendingStart, false, "late permission grant must not revive a closed preflight");
assert.equal(pending.track.stopCount, 1, "late permission grant must stop newly acquired tracks");
assert.equal(pending.controller.getState(), "idle");

console.log("MICROPHONE_PREFLIGHT_TEST=PASS");
