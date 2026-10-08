$ErrorActionPreference = "Stop"
$HostName = "com.signalinterpreter.captionhost"
$RegistryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"
if (Test-Path $RegistryPath) { Remove-Item -Path $RegistryPath -Recurse -Force }
Write-Output "Signal Interpreter Live Caption Host desregistrado."
