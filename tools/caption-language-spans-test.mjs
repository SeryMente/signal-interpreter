import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const scope={globalThis:{}};vm.runInNewContext(fs.readFileSync('extension/live-caption-core.js','utf8'),scope);const core=scope.globalThis.SignalCaptionCore;let checks=0;
const cases=[
 {text:'Thank you for calling. Muchas gracias por esperar.',en:'Thank you for calling.',es:'Muchas gracias por esperar.'},
 {text:'Muchas gracias por esperar. We do not provide times.',es:'Muchas gracias por esperar.',en:'We do not provide times.'},
 {text:'ocho y diez. A ocho y cuatro.',es:'ocho y diez. A ocho y cuatro.',not:'en'},
 {text:'Your appointment is at eight forty five. Bueno entonces me pueden ayudar.',en:'Your appointment is at eight forty five.',es:'Bueno entonces me pueden ayudar.'},
 {text:'No, we cannot provide times.',en:'No, we cannot provide times.',not:'es'},
 {text:'No, no era todo lo que quería saber.',es:'No, no era todo lo que quería saber.',not:'en'},
 {text:'atenderme. Thank you so much for calling.',es:'atenderme.',en:'Thank you so much for calling.'},
 {text:'We can help you. zxqv 123 Muchas gracias.',unknown:'zxqv 123'},
 {text:'123 456 789',unknown:'123 456 789'},
 {text:'ZXQV',unknown:'ZXQV'}
];
for(const test of cases){
 const text=core.normalizeText(test.text),parts=core.segmentCaptionText(text);
 assert.equal(parts.map(p=>p.text).join(''),text,'all normalized source characters retained');checks++;
 for(const language of ['en','es','unknown'])if(test[language]){const lane=parts.filter(p=>p.language===language).map(p=>p.text).join('').trim();assert(lane.includes(test[language]),JSON.stringify({test:test.text,language,lane}));checks++;}
 if(test.not){assert(!parts.some(p=>p.language===test.not));checks++;}
 assert(parts.every(p=>p.speakerVerified===false));checks++;
}
let text='Thank you for calling.';
for(const incoming of ['Thank you for calling. Muchas gracias por esperar.','Thank you for calling. Muchas gracias por esperar. We can help you.']){
 text=core.mergeCaptionText(text,incoming);const parts=core.segmentCaptionText(text);assert.equal(parts.map(p=>p.text).join(''),incoming);assert(parts.some(p=>p.language==='en'));assert(parts.some(p=>p.language==='es'));checks+=3;
}
assert.equal(core.roleForSource('yo','en'),'INTÉRPRETE');assert.equal(core.roleForSource('yo','es'),'INTÉRPRETE');checks+=2;
// Existing short-fragment uncertainty must survive: no voice/source guessed.
assert.equal(core.segmentCaptionText('ZXQV')[0].language,'unknown');checks++;
console.log(JSON.stringify({suite:'caption-language-spans',checks,result:'PASS',environment:'Node / synthetic nonclinical phrases',speakerDiarization:false,windowsAcceptance:false}));
