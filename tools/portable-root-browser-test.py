"""Developer-only Chrome for Testing fixture. No real platform/native Windows acceptance. Requires Python Playwright; end users do not need it."""
from pathlib import Path
import tempfile,json,shutil,re,wave,struct,math
from playwright.sync_api import sync_playwright,expect
root=Path.cwd();artifacts=Path(tempfile.mkdtemp(prefix='signal-browser-proof-'));profile=str(artifacts/'profile');errors=[]
audio=artifacts/'lab-tone-fixture.wav'
with wave.open(str(audio),'wb') as f:
 f.setnchannels(1);f.setsampwidth(2);f.setframerate(16000);f.writeframes(b''.join(struct.pack('<h',int(1200*math.sin(i*2*math.pi*440/16000))) for i in range(128000)))
with sync_playwright() as p:
 ctx=p.chromium.launch_persistent_context(profile,executable_path=shutil.which('chromium'),headless=True,ignore_default_args=['--disable-extensions'],args=['--no-sandbox','--disable-extensions-except='+str(root),'--load-extension='+str(root),'--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost'],accept_downloads=True,viewport={'width':1200,'height':900})
 try:
  ctx.route(re.compile(r'^https?://'),lambda route:route.fulfill(status=200,content_type='text/html',body='<html><body>Offline platform fixture. No account, no calls.</body></html>'))
  for pg in ctx.pages:pg.on('pageerror',lambda e:errors.append(str(e)))
  worker=ctx.service_workers[0] if ctx.service_workers else ctx.wait_for_event('serviceworker',timeout=20000)
  identifier=worker.url.split('/')[2];assert identifier=='ldpbjhobnfgmhdoehehdmnbhhjckebmj',identifier
  page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto('chrome-extension://'+identifier+'/extension/ui/popup.html');page.wait_for_timeout(1200)
  assert page.locator('#openLab').is_visible();assert page.locator('#openLab').bounding_box()['y']<150
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.screenshot(path=str(artifacts/'popup.png'),full_page=True)
  with ctx.expect_page() as info:page.click('#openLab')
  lab=info.value;lab.on('pageerror',lambda e:errors.append(str(e)));lab.wait_for_load_state();lab.wait_for_timeout(11500)
  for other in list(ctx.pages):
   if other.url.startswith('https://app.cloudinterpreter.com/'):other.close()
  inventory=worker.evaluate('chrome.tabs.query({})');print('FIXTURE_TABS',[(t['id'],t.get('url')) for t in inventory],flush=True)
  worker.evaluate('async()=>{const tabs=await chrome.tabs.query({url:["https://app.cloudinterpreter.com/*"]});await Promise.all(tabs.map(t=>chrome.tabs.remove(t.id)));}')
  assert lab.locator('#start').get_attribute('disabled') is not None
  assert lab.locator('#audioState').inner_text()=='No disponible'
  lab.locator('#file').set_input_files(str(audio));expect(lab.locator('#audioState')).to_contain_text('Disponible',timeout=10000)
  lab.click('#start');expect(lab.locator("#phase")).to_have_text("En prueba",timeout=10000)
  lab.wait_for_timeout(500)
  assert lab.locator('#end').get_attribute('disabled') is None;lab.screenshot(path=str(artifacts/'lab.png'),full_page=True)
  # Audio is a normal media element. No speech/native captions are fabricated in this Linux test.
  lab.click('#end')
  expect(lab.locator("#phase")).to_have_text("Finalizada",timeout=10000)
  assert lab.locator('#report').is_visible()
  with lab.expect_download() as pending:lab.click('#report')
  download=pending.value;target=str(artifacts/'lab-report.json');download.save_as(target);report=json.loads(Path(target).read_text());assert report['environment']=='lab';assert report['result']=='native-text-not-confirmed';assert report['nativeCaptionEvents']==0;assert report['spokenTextIncluded'] is False;assert report['productionExport'] is False;assert report['continuityVerified'] is False;assert report['captionAudioOriginVerified'] is False
  saved=worker.evaluate('chrome.storage.local.get(["signalLabLock","effectifConfig"])');assert saved['signalLabLock'] is False
  # Verify automatic export at media end using ordinary local tone playback; no native speech fabricated.
  lab.locator('#file').set_input_files(str(audio));expect(lab.locator('#audioState')).to_contain_text('Disponible',timeout=10000);lab.click('#start');expect(lab.locator("#phase")).to_have_text("En prueba",timeout=10000)
  expect(lab.locator("#signal-interpreter-live-caption-overlay")).to_be_visible(timeout=10000)
  lab.set_viewport_size({"width":390,"height":900});assert lab.evaluate('document.documentElement.scrollWidth <= innerWidth');lab.screenshot(path=str(artifacts/'lab-narrow.png'),full_page=True)
  with lab.expect_download() as automatic:
   expect(lab.locator('#phase')).to_have_text('Finalizada',timeout=15000)
  expect(lab.locator("#phase")).to_have_text("Finalizada",timeout=10000)
  automatic.value.save_as(str(artifacts/'lab-auto-report.json'));auto=json.loads(Path(str(artifacts/'lab-auto-report.json')).read_text());assert auto['endReason']=='media-ended';assert auto['audioSource']=='local-file';assert auto['nativeCaptionEvents']==0;assert auto['audioPlayedObserved'] is True;assert auto['playbackSeconds']>0
  # A platform tab blocks start before any native bridge or session can become active.
  platform=ctx.new_page();platform.goto('https://app.cloudinterpreter.com/profile/offline-fixture');lab.click('#start');expect(lab.locator("#status")).to_contain_text("Cierra las pestañas",timeout=10000);assert lab.locator('#end').get_attribute('disabled') is not None;platform.close()
  assert not errors,errors
  print('REAL_CHROME_ROOT_LOAD_POPUP_LAB_EXPORT_ISOLATION=PASS; native captions absent, not simulated')
  (artifacts/'proof.json').write_text(json.dumps({'extensionId':identifier,'rootLoaded':True,'popupLabActionVisible':True,'labLifecycle':True,'downloadedMetadataReport':True,'platformIsolation':True,'pageErrors':errors,'nativeWindowsCaptionsValidated':False},indent=2))
 finally:ctx.close()
