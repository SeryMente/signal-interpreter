$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$HostName = "com.signalinterpreter.captionhost"
$Manifest = Join-Path $Root "$HostName.json"
$Template = Join-Path $Root "$HostName.json"
$Exe = Join-Path $Root "SignalInterpreter.CaptionHost.exe"
$Payload = Join-Path $Root "SignalInterpreter.CaptionHost.exe.b64"
$ExpectedSha256 = "7526667D537E65840D3DDB68F25DCC7271C11CD5639B25C834ABEA15E4F56DB6"
$ExpectedSourceSha256 = "B6C9713E063CF1AAB24314810968954398D7A452B382CAD1012E3B91D67A1E33"

if (-not (Test-Path $Payload)) { throw "No existe $Payload" }
$base64 = ([IO.File]::ReadAllText($Payload)).Trim()
if ([string]::IsNullOrWhiteSpace($base64)) { throw "El payload del host está vacío." }
try { $bytes = [Convert]::FromBase64String($base64) } catch { throw "El payload del host no es Base64 válido: $($_.Exception.Message)" }
[IO.File]::WriteAllBytes($Exe, $bytes)

$actualSha256 = (Get-FileHash -LiteralPath $Exe -Algorithm SHA256).Hash
if ($actualSha256 -ne $ExpectedSha256) {
  throw "SHA-256 del host no coincide. Esperado=$ExpectedSha256 Actual=$actualSha256"
}

$escapedExe = $Exe.Replace("\","\\")
$escapedExeJson = $escapedExe.Replace('"','\"')
$manifestContent = @"
{
  "name": "$HostName",
  "description": "Signal Interpreter Live Caption bridge",
  "path": "$escapedExeJson",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://ldpbjhobnfgmhdoehehdmnbhhjckebmj/"
  ]
}
"@
[IO.File]::WriteAllText($Manifest,$manifestContent,[Text.UTF8Encoding]::new($false))

$RegistryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"
New-Item -Path $RegistryPath -Force | Out-Null
New-ItemProperty -Path $RegistryPath -Name "(default)" -PropertyType String -Value $Manifest -Force | Out-Null

Write-Output "Signal Interpreter Live Caption Host registrado para el usuario actual."
Write-Output "Host: $Exe"
Write-Output "Manifest: $Manifest"
Write-Output "SHA256: $actualSha256"
