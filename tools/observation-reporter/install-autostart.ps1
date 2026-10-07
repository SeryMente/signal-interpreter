[CmdletBinding()]
param()
$ErrorActionPreference="Stop"
$root=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$server=Join-Path $PSScriptRoot "server.mjs"
$watchdog=Join-Path $PSScriptRoot "watchdog.ps1"
$node=(Get-Command node -ErrorAction Stop).Source
if(-not(Test-Path -LiteralPath $server)){throw "Reporter missing: $server"}
if(-not(Test-Path -LiteralPath $watchdog)){throw "Watchdog missing: $watchdog"}

$interactiveUser=(Get-CimInstance Win32_ComputerSystem).UserName
if([string]::IsNullOrWhiteSpace($interactiveUser)){throw "No interactive Windows user detected."}
$interactiveName=($interactiveUser -split '\\')[-1]
if($interactiveName -ne "fila4"){throw "Refusing to install outside the active fila4 profile. Detected: $interactiveUser"}
$principal=New-ScheduledTaskPrincipal -UserId $interactiveUser -LogonType Interactive -RunLevel Highest

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

$listener=Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if($listener){
  try{Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop; Start-Sleep -Seconds 1; Write-Host "STALE_REPORTER_STOPPED" -ForegroundColor Yellow}catch{Write-Warning ("Could not stop stale reporter: "+$_.Exception.Message)}
}
Start-ScheduledTask -TaskName $reporterName
Start-ScheduledTask -TaskName $watchName
Start-Sleep -Seconds 3
try{$health=Invoke-RestMethod -Uri "http://127.0.0.1:8788/health" -TimeoutSec 5}catch{throw "Reporter health check failed: $($_.Exception.Message)"}
if(-not $health.ok){throw "Reporter did not become healthy."}
$listener=Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if(-not $listener){throw "Reporter did not bind port 8788."}
$p=Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
$o=Invoke-CimMethod -InputObject $p -MethodName GetOwner -ErrorAction Stop
$owner=if($o){$o.Domain+"\"+$o.User}else{$null}
if($owner -ne $interactiveUser){throw "Reporter owner mismatch. Expected $interactiveUser but found $owner."}
Write-Host "REPORTER_TASK=INSTALLED_AND_HEALTHY" -ForegroundColor Green
Write-Host "WATCHDOG_TASK=INSTALLED" -ForegroundColor Green
Write-Host "REPORTER_USER=$interactiveUser" -ForegroundColor Cyan
Write-Host "PORT=8788" -ForegroundColor Cyan
