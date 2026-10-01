import fs from "node:fs";
import vm from "node:vm";
const engine=fs.readFileSync("extension/dialogue-engine.js","utf8");
const mic=fs.readFileSync("extension/ui/mic-controller.js","utf8");
const ctx={console,setTimeout,clearTimeout,Date};vm.createContext(ctx);vm.runInContext(engine,ctx);const D=ctx.SignalDialogue;let failures=0;
function test(name,ok){console.log(`${name}=${ok?"PASS":"FAIL"}`);if(!ok)failures++;}
test("caption-initial",D.captionDelta("",{snapshot:"Hola",text:"Hola"}).text==="Hola");
test("caption-append",D.captionDelta("Hola",{snapshot:"Hola mundo",text:"Hola mundo"}).text==="mundo");
test("caption-duplicate",!D.captionDelta("Hola mundo",{snapshot:"Hola mundo",text:"Hola mundo"}).emit);
test("caption-replay",!D.captionDelta("Hola mundo largo",{snapshot:"Hola",text:"Hola"}).emit);
test("caption-revision-tail",D.captionDelta("Necesito llamar al doctor",{snapshot:"Necesito llamar a un doctor",text:"Necesito llamar a un doctor"}).text==="a un doctor");
const sorted=D.sortSegments([{timestamp:"2026-10-01T00:00:02Z"},{timestamp:"2026-10-01T00:00:01Z"}]);test("chronological-sort",sorted[0].timestamp.endsWith("01Z"));
let FakeRecognition=class{constructor(){FakeRecognition.instances.push(this);}start(){this.started=true;this.onstart&&this.onstart();}stop(){this.stopped=true;this.onend&&this.onend();}};FakeRecognition.instances=[];ctx.webkitSpeechRecognition=FakeRecognition;let finals=[];let statuses=[];vm.runInContext(mic,ctx);let c=new ctx.SignalMicController({lang:"es-MX",onFinal:t=>finals.push(t),onStatus:s=>statuses.push(s)});await c.start();let r=FakeRecognition.instances[0];r.onresult({resultIndex:0,results:[{isFinal:false,0:{transcript:"interim"}},{isFinal:true,0:{transcript:"Hola"}}]});r.onresult({resultIndex:0,results:[{isFinal:true,0:{transcript:"Hola"}}]});test("mic-final-only",finals.length===1&&finals[0]==="Hola");r.onend();await new Promise(x=>setTimeout(x,400));test("mic-auto-restart",FakeRecognition.instances.length===2&&statuses.includes("restarting"));c.stop();test("mic-stop",c.blocked&&c.running===false);console.log(`FAILURES=${failures}`);console.log(failures===0?"RESULT=PASS":"RESULT=FAIL");process.exitCode=failures?1:0;
