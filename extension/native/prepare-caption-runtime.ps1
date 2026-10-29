[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifestFile = Join-Path $root 'manifest.json'
if (-not (Test-Path -LiteralPath $manifestFile)) { throw 'Extension manifest missing; no changes applied.' }
$manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $manifestFile | ConvertFrom-Json
if ($manifest.name -ne 'Signal Interpreter' -or $manifest.version -ne '0.10.38') { throw 'Expected Signal Interpreter 0.10.38; no changes applied.' }
$hash = [Security.Cryptography.SHA256]::Create()
try { $digest = $hash.ComputeHash([Convert]::FromBase64String([string]$manifest.key)) } finally { $hash.Dispose() }
$id = -join ($digest[0..15] | ForEach-Object { [char](97 + ($_ -shr 4)); [char](97 + ($_ -band 15)) })
if ($id -ne 'ldpbjhobnfgmhdoehehdmnbhhjckebmj') { throw 'Extension identity mismatch; no registration applied.' }
$browser = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine -notmatch '--type=' } | Select-Object -First 1
if ($browser) {
  $owner = Invoke-CimMethod -InputObject $browser -MethodName GetOwnerSid
  if ($owner.ReturnValue -ne 0 -or $owner.Sid -ne [Security.Principal.WindowsIdentity]::GetCurrent().User.Value) { throw 'Chrome Windows user mismatch; no registration applied.' }
}
# Existing registration validates the bundled executable hash before HKCU writes.
& (Join-Path $PSScriptRoot 'register-caption-host.ps1')
$hostName = 'com.signalinterpreter.captionhost'
$registered = (Get-Item -LiteralPath "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$hostName").GetValue('')
$expected = Join-Path $PSScriptRoot "$hostName.json"
if ([IO.Path]::GetFullPath($registered) -ne [IO.Path]::GetFullPath($expected)) { throw 'Native host registry verification failed.' }
$hostManifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $expected | ConvertFrom-Json
if ($hostManifest.allowed_origins -notcontains "chrome-extension://$id/") { throw 'Native host origin verification failed.' }
Write-Output 'CAPTION_HOST_REGISTRY=VERIFIED'
Write-Output 'CAPTION_MODE=NATIVE_TEXT_ONLY; no audio capture, playback or Groq credential required'
Write-Output 'PREPARATION=PASS; native host prepared. No tab capture activation or audio permission is needed. This is not proof of live text reception.'
