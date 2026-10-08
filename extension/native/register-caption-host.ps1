$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$HostName = "com.signalinterpreter.captionhost"
$Manifest = Join-Path $Root "$HostName.json"
$Exe = Join-Path $Root "SignalInterpreter.CaptionHost.exe"

if (-not (Test-Path $Exe)) { throw "No existe $Exe" }
if (-not (Test-Path $Manifest)) { throw "No existe $Manifest" }

$RegistryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"
New-Item -Path $RegistryPath -Force | Out-Null
New-ItemProperty -Path $RegistryPath -Name "(default)" -PropertyType String -Value $Manifest -Force | Out-Null

Write-Output "Signal Interpreter Live Caption Host registrado para el usuario actual."
Write-Output "Manifest: $Manifest"
