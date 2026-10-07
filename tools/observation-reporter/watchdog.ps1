$ErrorActionPreference="SilentlyContinue"
$Port=8788
$Root=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Server=Join-Path $Root "tools\observation-reporter\server.mjs"
$Node=(Get-Command node -ErrorAction Stop).Source
$Base=Split-Path $Root
$State=Join-Path $Base ".signal-interpreter-observability-state"
$Log=Join-Path $State "watchdog.log"
New-Item -ItemType Directory -Force -Path $State | Out-Null
function Log($m){Add-Content -LiteralPath $Log -Value ("{0} {1}" -f (Get-Date -Format o),$m)}
$restart=$false
try{
  $h=Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 3
  if(-not $h.ok){$restart=$true}
  else{
    $lastAccepted=$null
    if($h.health.lastAcceptedAt){$lastAccepted=[DateTime]::Parse($h.health.lastAcceptedAt)}
    $lastGit=$null
    if($h.health.lastGitSuccessAt){$lastGit=[DateTime]::Parse($h.health.lastGitSuccessAt)}
    $spoolCount=[int]$h.health.spoolCount
    if($spoolCount -gt 0 -and (-not $lastGit -or -not $lastAccepted -or $lastAccepted -gt $lastGit.AddMinutes(5))){$restart=$true}
  }
}catch{$restart=$true}
if(-not $restart){return}
Log "Reporter unhealthy or backlog not reaching GitHub; recovery requested."
$listener=Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if($listener){try{Stop-Process -Id $listener.OwningProcess -Force}catch{}}
try{Start-Process -FilePath $Node -ArgumentList @('"' + $Server + '"') -WorkingDirectory $Root -WindowStyle Hidden;Log "Reporter restarted."}catch{Log ("Reporter restart failed: "+$_.Exception.Message)}
