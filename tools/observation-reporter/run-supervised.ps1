[CmdletBinding()]
param()
$ErrorActionPreference="Continue"
$Root=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$State=Join-Path (Split-Path $Root) ".signal-interpreter-observability-state"
$Stage=Join-Path $State "runtime-main"
$Archive=Join-Path $State "runtime-main.zip"
$Log=Join-Path $State "supervisor.log"
$Node=(Get-Command node -ErrorAction Stop).Source
$Git=(Get-Command git -ErrorAction Stop).Source
New-Item -ItemType Directory -Force -Path $State | Out-Null

function Log($m){
  $line="{0} {1}" -f (Get-Date -Format o),$m
  try{Add-Content -LiteralPath $Log -Value $line}catch{}
}
function RemoteHead(){
  try{
    & $Git -C $Root fetch origin main --quiet 2>$null | Out-Null
    $sha=(& $Git -C $Root rev-parse origin/main 2>$null).Trim()
    if($sha){return $sha}
  }catch{}
  return $null
}
function StageReporter(){
  $target=Join-Path $Stage "tools\observation-reporter"
  if(Test-Path -LiteralPath $Archive){Remove-Item -LiteralPath $Archive -Force -ErrorAction SilentlyContinue}
  if(Test-Path -LiteralPath $Stage){Remove-Item -LiteralPath $Stage -Recurse -Force -ErrorAction SilentlyContinue}
  New-Item -ItemType Directory -Force -Path $Stage | Out-Null
  try{
    & $Git -C $Root archive --format=zip --output=$Archive origin/main tools/observation-reporter 2>$null
    if($LASTEXITCODE -ne 0){throw "git archive exit $LASTEXITCODE"}
    Expand-Archive -LiteralPath $Archive -DestinationPath $Stage -Force
    $server=Join-Path $target "server.mjs"
    if(-not(Test-Path -LiteralPath $server)){throw "staged reporter missing"}
    return $server
  }catch{
    Log ("Remote stage failed: "+$_.Exception.Message)
    $local=Join-Path $Root "tools\observation-reporter\server.mjs"
    if(Test-Path -LiteralPath $local){return $local}
    throw
  }
}
function StopListener(){
  $listener=Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if($listener){
    try{Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop;Log ("Stopped reporter PID "+$listener.OwningProcess)}catch{Log ("Could not stop listener: "+$_.Exception.Message)}
  }
}
$lastRemote=$null
while($true){
  try{
    $remote=RemoteHead
    if(-not $remote){Log "Remote main unavailable; supervisor will use local reporter if needed."}
    if($remote -and $remote -ne $lastRemote){$server=StageReporter;$lastRemote=$remote;StopListener;Log ("Reporter runtime staged from main "+$remote)}
    elseif(-not $server -or -not(Test-Path -LiteralPath $server)){$server=StageReporter}
    $env:SIGNAL_INTERPRETER_REPO=$Root
    $env:SIGNAL_OBSERVATION_PORT="8788"
    Log ("Starting reporter "+$server)
    $proc=Start-Process -FilePath $Node -ArgumentList @($server) -WorkingDirectory $Root -WindowStyle Hidden -PassThru
    while(-not $proc.HasExited){
      Start-Sleep -Seconds 30
      $remoteNow=RemoteHead
      if($remoteNow -and $lastRemote -and $remoteNow -ne $lastRemote){
        Log ("New main detected "+$remoteNow+"; restarting reporter runtime.")
        try{Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue}catch{}
        break
      }
    }
    Log ("Reporter process exited with code "+$proc.ExitCode+"; retrying.")
  }catch{
    Log ("Supervisor error: "+$_.Exception.Message)
  }
  Start-Sleep -Seconds 5
}
