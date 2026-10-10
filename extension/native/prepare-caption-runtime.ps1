[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$manifestFile = Join-Path $root 'manifest.json'
if (-not (Test-Path -LiteralPath $manifestFile)) { throw 'Extension manifest missing; no changes applied.' }
$manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $manifestFile | ConvertFrom-Json
if ($manifest.name -ne 'Signal Interpreter' -or $manifest.version -ne '0.10.31') { throw 'Expected Signal Interpreter 0.10.31; no changes applied.' }
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Run under your normal Chrome account, not an elevated administrator terminal.' }
$hash = [Security.Cryptography.SHA256]::Create()
try { $digest = $hash.ComputeHash([Convert]::FromBase64String([string]$manifest.key)) } finally { $hash.Dispose() }
$id = -join ($digest[0..15] | ForEach-Object { [char](97 + ($_ -shr 4)); [char](97 + ($_ -band 15)) })
if ($id -ne 'ldpbjhobnfgmhdoehehdmnbhhjckebmj') { throw 'Extension identity mismatch; no registration applied.' }
$localSecret = Join-Path $root 'groq-secret.local.js'
$storeDir = Join-Path $env:USERPROFILE '.signal-interpreter'
$store = Join-Path $storeDir 'groq-token.dat'
$token = $null
if (-not (Test-Path -LiteralPath $localSecret)) {
  if (Test-Path -LiteralPath $store) {
    $secure = Get-Content -Raw -Encoding UTF8 -LiteralPath $store | ConvertTo-SecureString
    $token = [Net.NetworkCredential]::new('', $secure).Password
  } else {
    $secure = Read-Host 'Groq API Key (hidden; stored only under this Windows account)' -AsSecureString
    $token = [Net.NetworkCredential]::new('', $secure).Password
  }
  if ($token -notmatch '^gsk_[A-Za-z0-9_-]{20,}$') { throw 'Invalid Groq key format; existing settings preserved.' }
}
# Existing registration validates the bundled executable hash before HKCU writes.
& (Join-Path $PSScriptRoot 'register-caption-host.ps1')
$hostName = 'com.signalinterpreter.captionhost'
$registered = (Get-Item -LiteralPath "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$hostName").GetValue('')
$expected = Join-Path $PSScriptRoot "$hostName.json"
if ([IO.Path]::GetFullPath($registered) -ne [IO.Path]::GetFullPath($expected)) { throw 'Native host registry verification failed.' }
$hostManifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $expected | ConvertFrom-Json
if ($hostManifest.allowed_origins -notcontains "chrome-extension://$id/") { throw 'Native host origin verification failed.' }
if ($token) {
  New-Item -ItemType Directory -Force -Path $storeDir | Out-Null
  $secure | ConvertFrom-SecureString | Set-Content -LiteralPath $store -Encoding UTF8
  $json = $token | ConvertTo-Json -Compress
  [IO.File]::WriteAllText($localSecret, "globalThis.__SIGNAL_GROQ_TOKEN=$json;", [Text.UTF8Encoding]::new($false))
}
Remove-Variable token, secure, json -ErrorAction SilentlyContinue
Write-Output 'CAPTION_HOST_REGISTRY=VERIFIED'
Write-Output 'GROQ_LOCAL_SECRET=PRESENT (not printed; remote service not tested)'
Write-Output 'PREPARATION=PASS; reload the extension outside a call. Then open its existing popup on the Cloud Interpreter tab if Chrome requires tab capture activation.'
