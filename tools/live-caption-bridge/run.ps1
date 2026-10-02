$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$project = Join-Path $root "SignalLiveCaptionBridge.csproj"
if (-not (Test-Path -LiteralPath $project)) { throw "No se encontró el proyecto del bridge: $project" }

try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:8787/health" -TimeoutSec 1 -ErrorAction Stop
  if ($health.transport -eq "websocket" -and $health.url -eq "ws://127.0.0.1:8787/") {
    Write-Host "Bridge ya está activo en ws://127.0.0.1:8787/"
    exit 0
  }
} catch {}

$dotnet = $null
$command = Get-Command dotnet -ErrorAction SilentlyContinue
if ($command) {
  $dotnet = $command.Source
} else {
  $candidates = @(
    (Join-Path $HOME ".dotnet\dotnet.exe"),
    "C:\Users\fila4\.dotnet\dotnet.exe",
    "C:\Program Files\dotnet\dotnet.exe"
  )
  $dotnet = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $dotnet) { throw "No se encontró un runtime/SDK .NET utilizable. Se buscó dotnet en PATH, `$HOME\.dotnet y C:\Program Files\dotnet." }

Write-Host "Signal Live Caption Bridge"
Write-Host "WebSocket: ws://127.0.0.1:8787/"
Write-Host "Health:    http://127.0.0.1:8787/health"
Write-Host "Sondeo:    150 ms"
Write-Host "Estabilidad: 750 ms"
& $dotnet run --project $project -- --interval-ms 150 --stability-ms 750 --port 8787