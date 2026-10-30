"""Optional local Chromium fixture; requires Python Playwright and system Chromium. Not a real Cloud Interpreter acceptance test."""
import json,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
core=Path('extension/live-caption-core.js').read_text();overlay=Path('extension/live-caption-overlay.js').read_text()
mock='''window.forbiddenAudio=0;navigator.mediaDevices.getUserMedia=()=>{window.forbiddenAudio++;throw new Error("Forbidden audio");};window.MediaRecorder=()=>{window.forbiddenAudio++;throw new Error("Forbidden recorder");};window.errors=[];window.events=[];window.invalidRuntime=false;
function eventBus(){const listeners=new Set();return{listeners,addListener:f=>listeners.add(f),removeListener:f=>listeners.delete(f)}}
window.chrome={runtime:{getManifest:()=>{if(window.invalidRuntime)throw new Error('Extension context invalidated');return{version:'0.10.38'}},onMessage:eventBus(),sendMessage:(m,cb)=>{if(m.type==='EFFECTIF_EVENT')window.events.push(m.event);if(cb)setTimeout(()=>cb(m.type==='SIGNAL_CAPTION_OVERLAY_HELLO'?{ok:true,enabled:true,scope:'source-only',sourceTabId:7,callActive:true,pageAllowed:true,isSourceTab:true,history:[{text:'Synthetic incoming audio only.',language:'en',source:'chrome-live-caption',native:true,timestamp:Date.now()}]}:{ok:true}),5);return Promise.resolve({ok:true})}},storage:{onChanged:eventBus(),local:{get:(keys,cb)=>setTimeout(()=>cb({effectifConfig:{liveCaptionOverlayEnabled:true}}),20),set:()=>Promise.resolve()}}};
window.probe=()=>{let result;for(const f of chrome.runtime.onMessage.listeners)f({type:'SIGNAL_CAPTION_OVERLAY_PROBE'},{},x=>result=x);return result};'''
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page();page.on('pageerror',lambda e:None)
  page.route('**/*',lambda route:route.fulfill(status=200,content_type='text/html',body='<html><body><button>Call keypad fixture</button></body></html>'))
  page.goto('https://app.cloudinterpreter.com/call/synthetic-call')
  page.evaluate(mock);page.evaluate(core);page.evaluate(overlay)
  page.wait_for_function('window.probe()?.ready===true&&window.probe()?.hostMounted===true&&window.probe()?.rowCount===1')
  assert page.evaluate('document.querySelectorAll("#signal-interpreter-live-caption-overlay").length')==1
  page.evaluate("for(const f of chrome.runtime.onMessage.listeners)f({type:'SIGNAL_CAPTION_UPDATE',caption:{text:'Rejected synthetic audio transcript',source:'cliente',native:false}},{},()=>{})")
  assert page.evaluate('window.probe().rowCount')==1
  assert page.evaluate('window.forbiddenAudio')==0
  page.evaluate(overlay)
  page.wait_for_function('window.probe()?.ready===true&&window.probe()?.hostMounted===true&&window.probe()?.rowCount===1')
  assert page.evaluate('chrome.runtime.onMessage.listeners.size')==1
  assert page.evaluate('chrome.storage.onChanged.listeners.size')==1
  assert page.evaluate('document.querySelectorAll("#signal-interpreter-live-caption-overlay").length')==1
  assert page.url.endswith('/call/synthetic-call')
  assert page.evaluate('document.querySelector("button").textContent')=='Call keypad fixture'
  page.evaluate("for(const f of [...chrome.runtime.onMessage.listeners])f({type:'EFFECTIF_HOTLOAD_REPLACE'},{},()=>{})")
  page.wait_for_timeout(1200)
  assert page.evaluate('document.querySelectorAll("#signal-interpreter-live-caption-overlay").length')==0
  assert page.evaluate('chrome.runtime.onMessage.listeners.size')==0
  page.evaluate(overlay);page.wait_for_function('window.probe()?.ready===true&&window.probe()?.hostMounted===true')
  page.evaluate('window.invalidRuntime=true');page.wait_for_timeout(1300)
  assert page.evaluate('document.querySelectorAll("#signal-interpreter-live-caption-overlay").length')==0
  assert page.evaluate('chrome.runtime.onMessage.listeners.size')==0
  page.close()
 finally:browser.close()
print('REAL_CHROMIUM_HOTLOAD_SINGLE_OVERLAY_CLEANUP_HYDRATION=PASS')
