"""Synthetic messages and real Chromium DOM; not Windows/native acceptance."""
import ast,json,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
fixture=ast.parse(Path('tools/hotload-overlay-browser-test.py').read_text())
mock=next(ast.literal_eval(n.value) for n in fixture.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='mock' for t in n.targets))
core=Path('extension/live-caption-core.js').read_text();overlay=Path('extension/live-caption-overlay.js').read_text();errors=[]
setup="""window.syntheticRoots=new WeakMap();const originalAttach=Element.prototype.attachShadow;Element.prototype.attachShadow=function(options){const root=originalAttach.call(this,options);window.syntheticRoots.set(this,root);return root};window.fixtureHistory=[];const originalSend=chrome.runtime.sendMessage;chrome.runtime.getManifest=()=>({version:'0.10.37'});chrome.runtime.sendMessage=(m,cb)=>{if(m.type==='SIGNAL_CAPTION_OVERLAY_HELLO'){if(cb)setTimeout(()=>cb({ok:true,enabled:true,scope:'source-only',sourceTabId:7,callActive:true,pageAllowed:true,isSourceTab:true,history:window.fixtureHistory}),5);return Promise.resolve({ok:true})}return originalSend(m,cb)};window.injectCaption=(text,native=true)=>{for(const f of chrome.runtime.onMessage.listeners)f({type:'SIGNAL_CAPTION_UPDATE',caption:{text,language:'en',source:native?'chrome-live-caption':'yo',native,live:true,timestamp:Date.now()}},{},()=>{})};window.rendered=()=>Array.from(window.syntheticRoots.get(document.querySelector('#signal-interpreter-live-caption-overlay')).querySelectorAll('.row')).map(r=>({role:r.querySelector('.role').textContent,language:r.querySelector('.lang').textContent,text:r.querySelector('.text').textContent}));"""
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-background-networking'])
 try:
  page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.route('**/*',lambda r:r.fulfill(status=200,content_type='text/html',body='<html><body>Offline synthetic platform</body></html>'));page.goto('https://app.cloudinterpreter.com/call/synthetic-call');page.evaluate(mock);page.evaluate(setup+";void 0;");page.evaluate(core);page.evaluate(overlay)
  page.wait_for_function('window.probe()?.ready===true&&window.probe()?.hostMounted===true')
  text='Thank you for calling. Muchas gracias por esperar.';page.evaluate('text=>window.injectCaption(text)',text)
  page.wait_for_function('window.rendered().length===2')
  first=page.evaluate('window.rendered()');assert first[0]['language']=='ENGLISH' and first[0]['text'].strip()=='Thank you for calling.';assert first[1]['language']=='ESPAÑOL' and first[1]['text'].strip()=='Muchas gracias por esperar.'
  page.evaluate('text=>window.injectCaption(text)',text+' We can help you.');page.wait_for_function('window.rendered().length===3')
  rolling=page.evaluate('window.rendered()');assert ''.join(x['text'] for x in rolling)==text+' We can help you.';assert [x['language'] for x in rolling]==['ENGLISH','ESPAÑOL','ENGLISH']
  page.evaluate("window.injectCaption('ocho y diez. A ocho y cuatro.')");page.wait_for_function("window.rendered().some(x=>x.text.includes('ocho y diez'))");row=page.evaluate("window.rendered().find(x=>x.text.includes('ocho y diez'))");assert row['language']=='ESPAÑOL' and row['role']=='LEP'
  before=page.evaluate('JSON.stringify(window.rendered())');page.evaluate("window.injectCaption('Do not capture the microphone.',false)");assert page.evaluate('JSON.stringify(window.rendered())')==before
  routing=page.evaluate("window.events.filter(x=>x.action==='LIVE_CAPTION_LANGUAGE_ROUTING').map(x=>x.payload)");assert routing and all(x.get('speakerIdentityVerified') is False and x.get('microphoneCaptured') is False for x in routing);assert all(not any(k in x for k in ['text','caption','transcript']) for x in routing)
  assert page.evaluate('window.forbiddenAudio')==0;assert not errors,errors
  page.close()
 finally:browser.close()
print(json.dumps({'suite':'caption-language-browser','result':'PASS','environment':'sandbox Chromium / actual overlay and DOM / synthetic native messages','cases':['English-Spanish boundary','rolling English-Spanish-English without lost or duplicated text','Spanish numbers not assigned English','microphone/non-native source rejected','routing telemetry metadata only'],'pageErrors':errors,'windowsNativeAcceptance':False,'speakerDiarization':False}))
