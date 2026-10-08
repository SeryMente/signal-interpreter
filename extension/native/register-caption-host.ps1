$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$HostName = "com.signalinterpreter.captionhost"
$Manifest = Join-Path $Root "$HostName.json"
$Exe = Join-Path $Root "SignalInterpreter.CaptionHost.exe"
$Payload = Join-Path $Root "SignalInterpreter.CaptionHost.exe.b64"
$ExpectedSha256 = "551F2CCE3E6C2447C053573EBB97FD1C808FDB612C13876EFCA23D7FDEE0D2B5"

if (-not (Test-Path $Manifest)) { throw "No existe $Manifest" }

if (-not (Test-Path $Exe)) {
  if (-not (Test-Path $Payload)) { throw "No existe $Payload" }
  $base64 = ([IO.File]::ReadAllText($Payload)).Trim()
  if ([string]::IsNullOrWhiteSpace($base64)) { throw "El payload del host está vacío." }
  try { $bytes = [Convert]::FromBase64String($base64) } catch { throw "El payload del host no es Base64 válido: $($_.Exception.Message)" }
  [IO.File]::WriteAllBytes($Exe, $bytes)
}

$actualSha256 = (Get-FileHash -LiteralPath $Exe -Algorithm SHA256).Hash
if ($actualSha256 -ne $ExpectedSha256) {
  throw "SHA-256 del host no coincide. Esperado=$ExpectedSha256 Actual=$actualSha256"
}

$RegistryPath = "HKCU:SoftwareGoogleChromeNativeMessagingHosts$HostName"
New-Item -Path $RegistryPath -Force | Out-Null
New-ItemProperty -Path $RegistryPath -Name "(default)" -PropertyType String -Value $Manifest -Force | Out-Null

Write-Output "Signal Interpreter Live Caption Host registrado para el usuario actual."
Write-Output "Host: $Exe"
Write-Output "Manifest: $Manifest"
Write-Output "SHA256: $actualSha256"
