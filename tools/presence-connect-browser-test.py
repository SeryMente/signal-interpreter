import json, pathlib, shutil, threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from playwright.sync_api import sync_playwright
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(b'<!doctype html><title>Isolated synthetic calls</title>')
 def log_message(self,*args):pass
server=HTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
content=pathlib.Path('extension/content.js').read_text()
fn=content[content.index('  function autoAnswer() {'):content.index('  function emitAutoAnswerReadiness')]
evaluator="async({fn,test})=>{\n   let clicks=0,resolveGrant,call=false;\n   const button=document.querySelector('button');button.addEventListener('click',()=>clicks++);\n   if(test==='video')document.querySelector('#mode').textContent='Video interpreting';\n   if(test==='unknown')document.querySelector('#mode').textContent='unidentified';\n   if(test==='hidden-button')button.style.display='none';\n   // Execute the actual candidate content function against real browser DOM nodes.\n   const setup=`var config={autoAnswerEnabled:true},labSafetyLock=false,presenceState={armed:true,generation:3},clickedNodes=new WeakSet(),pendingConnect=new WeakSet(),fingerprints=new Map(),lastIncomingSignature='',answerFlow={},ANSWER_LEASE_MARKER='synthetic-lease',integrity={permittedConnectClicks:0},answerWatchdog=null,RUNTIME_VERSION='0.10.37',DIALOG='[role=dialog]';\n   function syncPageFavicon(){};function isAutoAnswerReady(){return !labSafetyLock&&presenceState.armed&&config.autoAnswerEnabled};function currentCallId(){return getCall()?'synthetic-call':null};function normalized(s){return String(s||'').replace(/\\\\s+/g,' ').trim()};function safe(s){return String(s||'')};function visibleElement(el){return !!(el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden')};function emit(){};function emitIntegrity(){};function iso(){return new Date().toISOString()};function cleanupFingerprints(){};`;\n   const api=Function('chrome','getCall',setup+fn+';return {run:autoAnswer,lock:()=>{labSafetyLock=true}}')({runtime:{sendMessage:()=>new Promise(r=>resolveGrant=r)}},()=>call);\n   api.run();\n   if(test==='duplicate-mutation')api.run();\n   if(test==='lock-before-grant')api.lock();\n   if(test==='call-started-before-grant')call=true;\n   if(test==='dialog-changed')document.querySelector('#mode').textContent='Video interpreting';\n   if(resolveGrant)resolveGrant({ok:true,generation:3,expiresAt:Date.now()+500});\n   await new Promise(r=>setTimeout(r,20));\n   return{test,clicks};\n  }"
results=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-background-networking'])
  page=browser.new_page()
  page.goto('http://127.0.0.1:'+str(server.server_port))
  page.route('**/*',lambda route:route.abort())
  for test in ['phone','video','unknown','lock-before-grant','call-started-before-grant','duplicate-mutation','hidden-button','dialog-changed']:
   page.set_content('<main><section role="dialog"><p>Caller is requesting interpretation <span id="mode">Audio interpreting</span></p><button>Connect</button></section></main>')
   result=page.evaluate(evaluator,{'fn':fn,'test':test})
   expected=1 if test in ['phone','duplicate-mutation'] else 0
   assert result['clicks']==expected,(test,result)
   results.append(result)
  page.close();browser.close()
 print(json.dumps({'suite':'presence-connect-browser','environment':'sandbox Chromium / real DOM / synthetic authorization','result':'PASS','cases':results,'windowsAccepted':False,'transcriptionAccepted':False}))
finally:server.shutdown()
