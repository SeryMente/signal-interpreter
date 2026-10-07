$ErrorActionPreference="SilentlyContinue"
$Port=8788
$Root=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Supervisor=Join-Path $Root "tools\observation-reporter\run-supervised.ps1"
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
$running=Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*run-supervised.ps1*" } | Select-Object -First 1
if(-not $running){
  try{Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoProfile","-WindowStyle","Hidden","-ExecutionPolicy","Bypass","-File",$Supervisor) -WorkingDirectory $Root -WindowStyle Hidden;Log "Supervised reporter restarted."}catch{Log ("Supervisor restart failed: "+$_.Exception.Message)}
}
