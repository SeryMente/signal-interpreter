[CmdletBinding()]
param()
$ErrorActionPreference="Stop"
$root=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$server=Join-Path $PSScriptRoot "server.mjs"
$watchdog=Join-Path $PSScriptRoot "watchdog.ps1"
$node=(Get-Command node -ErrorAction Stop).Source
if(-not(Test-Path -LiteralPath $server)){throw "Reporter missing: $server"}
if(-not(Test-Path -LiteralPath $watchdog)){throw "Watchdog missing: $watchdog"}

$principal=New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
$action=New-ScheduledTaskAction -Execute $node -Argument ('"' + $server + '"') -WorkingDirectory $root
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
$trigger=New-ScheduledTaskTrigger -AtLogOn
$reporterName="Signal Interpreter Observation Reporter"
Register-ScheduledTask -TaskName $reporterName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Persistent Signal Interpreter observability reporter with automatic restart." -Force | Out-Null

$watchAction=New-ScheduledTaskAction -Execute "powershell.exe" -Argument ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $watchdog + '"') -WorkingDirectory $root
$watchSettings=New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 2)
$watchTrigger=New-ScheduledTaskTrigger -Once -At (Get-Date).AddSeconds(10) -RepetitionInterval (New-TimeSpan -Minutes 2) -RepetitionDuration (New-TimeSpan -Days 3650)
$watchName="Signal Interpreter Observation Watchdog"
Register-ScheduledTask -TaskName $watchName -Action $watchAction -Trigger $watchTrigger -Principal $principal -Settings $watchSettings -Description "Restarts the Signal Interpreter observation reporter when its health endpoint is unavailable." -Force | Out-Null

Start-ScheduledTask -TaskName $reporterName
Start-ScheduledTask -TaskName $watchName
Start-Sleep -Seconds 3
try{$health=Invoke-RestMethod -Uri "http://127.0.0.1:8788/health" -TimeoutSec 5}catch{throw "Reporter health check failed: $($_.Exception.Message)"}
if(-not $health.ok){throw "Reporter did not become healthy."}
Write-Host "REPORTER_TASK=INSTALLED_AND_HEALTHY" -ForegroundColor Green
Write-Host "WATCHDOG_TASK=INSTALLED" -ForegroundColor Green
Write-Host "PORT=8788" -ForegroundColor Cyan
