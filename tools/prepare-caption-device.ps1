[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$StageRoot)
$ErrorActionPreference='Stop'
$result=[ordered]@{Version='0.10.34';Prepared=$false;NativeHostRegistered=$false;NormalChromeUserVerified=$false;ActiveExtensionFilesChanged=$false;ChromeRestartRequested=$false;RawSpokenTextSaved=$false;ErrorCode=$null}
$resultFile=Join-Path $StageRoot 'DEVICE-PREPARATION-RESULT.json'
try{
  $browser=Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object {$_.CommandLine -and $_.CommandLine -notmatch '--type='} | Select-Object -First 1
  if(-not $browser){throw 'CHROME_USER_NOT_VERIFIED'}
  $owner=Invoke-CimMethod -InputObject $browser -MethodName GetOwnerSid
  if($owner.ReturnValue -ne 0 -or $owner.Sid -ne [Security.Principal.WindowsIdentity]::GetCurrent().User.Value){throw 'CHROME_USER_NOT_VERIFIED'}
  $result.NormalChromeUserVerified=$true
  $extension=if(Test-Path -LiteralPath (Join-Path $StageRoot 'manifest.json')){$StageRoot}else{Join-Path $StageRoot 'extension'}
  $manifest=Get-Content -Raw -LiteralPath (Join-Path $extension 'manifest.json') | ConvertFrom-Json
  if($manifest.version -ne '0.10.34' -or $manifest.name -ne 'Signal Interpreter'){throw 'EXTENSION_VERSION_NOT_VERIFIED'}
  $hash=[Security.Cryptography.SHA256]::Create()
  try{$digest=$hash.ComputeHash([Convert]::FromBase64String([string]$manifest.key))}finally{$hash.Dispose()}
  $id=-join($digest[0..15] | ForEach-Object{[char](97+($_ -shr 4));[char](97+($_ -band 15))})
  if($id -ne 'ldpbjhobnfgmhdoehehdmnbhhjckebmj'){throw 'EXTENSION_IDENTITY_NOT_VERIFIED'}
  $entries=Get-Content -Raw -LiteralPath (Join-Path $StageRoot 'payload-sha256.json') | ConvertFrom-Json
  $registry='HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.signalinterpreter.captionhost'
  $expected=Join-Path $extension 'native\com.signalinterpreter.captionhost.json'
  $alreadyRegistered=(Test-Path -LiteralPath $registry)
  if($alreadyRegistered -and (Get-Item -LiteralPath $registry).GetValue('') -ne $expected){throw 'CONCURRENT_NATIVE_REGISTRATION'}
  foreach($entry in $entries){
    # The registered manifest intentionally contains this machine's executable path.
    if($alreadyRegistered -and $entry.path -eq 'native\com.signalinterpreter.captionhost.json'){continue}
    $path=Join-Path $extension $entry.path
    if((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ne $entry.sha256){throw 'PAYLOAD_HASH_NOT_VERIFIED'}
  }
  $registrationOutput=@(& (Join-Path $extension 'native\register-caption-host.ps1'))
  if((Get-Item -LiteralPath $registry).GetValue('') -ne $expected){throw 'NATIVE_REGISTRATION_NOT_VERIFIED'}
  $hostConfig=Get-Content -Raw -LiteralPath $expected | ConvertFrom-Json
  if($hostConfig.allowed_origins -notcontains "chrome-extension://$id/"){throw 'NATIVE_ORIGIN_NOT_VERIFIED'}
  $result.NativeHostRegistered=$true
  $probeJson=& (Join-Path $StageRoot 'tools\probe-caption-host.ps1') -ExtensionRoot $extension
  $result.NativeProbe=$probeJson | ConvertFrom-Json
  if($result.NativeProbe.Protocol -ne 'PASS'){throw 'NATIVE_PROTOCOL_NOT_VERIFIED'}
  $result.Prepared=$true
  $result.ChromeBrowserProcessStillPresent=[bool](Get-Process -Id $browser.ProcessId -ErrorAction SilentlyContinue)
}catch{
  $known=@('NORMAL_USER_REQUIRED','CHROME_USER_NOT_VERIFIED','EXTENSION_VERSION_NOT_VERIFIED','EXTENSION_IDENTITY_NOT_VERIFIED','CONCURRENT_NATIVE_REGISTRATION','PAYLOAD_HASH_NOT_VERIFIED','NATIVE_REGISTRATION_NOT_VERIFIED','NATIVE_ORIGIN_NOT_VERIFIED','NATIVE_PROTOCOL_NOT_VERIFIED')
  $message=[string]$_.Exception.Message
  $result.ErrorCode=if($known -contains $message){$message}else{'PREPARATION_OR_NATIVE_PROBE_NOT_VERIFIED'}
}finally{
  [IO.File]::WriteAllText($resultFile,($result | ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
}
$result | ConvertTo-Json -Depth 8 -Compress
if(-not $result.Prepared){exit 1}
