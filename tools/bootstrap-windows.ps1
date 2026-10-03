[CmdletBinding()]
param(
  [string]$RepoPath = (Join-Path $env:USERPROFILE "Desktop\signal-interpreter"),
  [string]$ExtensionPath = (Join-Path $env:USERPROFILE "Desktop\Signal-Interpreter-Extension"),
  [switch]$SkipGroqKey
)
$ErrorActionPreference = "Stop"

function Add-ToolPaths {
  $candidates = @(
    (Join-Path $env:ProgramFiles "Git\cmd"),
    (Join-Path $env:ProgramFiles "GitHub CLI"),
    (Join-Path $env:ProgramFiles "dotnet"),
    (Join-Path $env:ProgramFiles "nodejs"),
    (Join-Path $env:LOCALAPPDATA "Programs\Git\cmd"),
    (Join-Path $env:USERPROFILE ".dotnet")
  )
  foreach($path in $candidates){ if(Test-Path $path){ $env:Path = "$path;$env:Path" } }
}

function Ensure-WingetPackage([string]$CommandName,[string]$PackageId) {
  Add-ToolPaths
  if(Get-Command $CommandName -ErrorAction SilentlyContinue){ return }
  if(-not(Get-Command winget -ErrorAction SilentlyContinue)){
    throw "WinGet no está disponible. Instala App Installer de Windows y vuelve a ejecutar este bootstrap."
  }
  Write-Host "Instalando $PackageId..." -ForegroundColor Cyan
  & winget install --id $PackageId -e --accept-source-agreements --accept-package-agreements
  if($LASTEXITCODE -ne 0 -and -not(Get-Command $CommandName -ErrorAction SilentlyContinue)){
    throw "No se pudo instalar $PackageId (exit $LASTEXITCODE)."
  }
  Add-ToolPaths
}

Ensure-WingetPackage "git" "Git.Git"
Ensure-WingetPackage "gh" "GitHub.cli"
Ensure-WingetPackage "dotnet" "Microsoft.DotNet.SDK.8"
Ensure-WingetPackage "node" "OpenJS.NodeJS.LTS"

Add-ToolPaths
if(-not(Get-Command gh -ErrorAction SilentlyContinue)){ throw "GitHub CLI no disponible después de instalarlo." }

& gh auth status *> $null
if($LASTEXITCODE -ne 0){
  Write-Host "Se requiere autenticar GitHub una sola vez en este equipo..." -ForegroundColor Yellow
  & gh auth login --web --git-protocol https
  if($LASTEXITCODE -ne 0){ throw "No se completó la autenticación de GitHub." }
}
& gh auth setup-git *> $null
if(Test-Path (Join-Path $RepoPath ".git")){
  $dirty = (& git -C $RepoPath status --porcelain)
  if($dirty){ throw "El repositorio ya existe y tiene cambios locales. Bootstrap detenido para no destruir trabajo." }
  & git -C $RepoPath fetch origin
  if($LASTEXITCODE -ne 0){ throw "No se pudo actualizar origin." }
  & git -C $RepoPath checkout main
  & git -C $RepoPath pull --ff-only origin main
  if($LASTEXITCODE -ne 0){ throw "No se pudo actualizar main mediante fast-forward." }
}else{
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $RepoPath) | Out-Null
  & gh repo clone SeryMente/signal-interpreter $RepoPath
  if($LASTEXITCODE -ne 0){ throw "No se pudo clonar SeryMente/signal-interpreter." }
}

Set-Location $RepoPath
if(-not $SkipGroqKey){
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\setup-groq-key.ps1"
  if($LASTEXITCODE -ne 0){ throw "No se pudo preparar la clave Groq local." }
}

New-Item -ItemType Directory -Force -Path $ExtensionPath | Out-Null
& robocopy (Join-Path $RepoPath "extension") $ExtensionPath /E /XF "groq-secret.local.js" /NFL /NDL /NJH /NJS | Out-Null
if($LASTEXITCODE -gt 7){ throw "Robocopy falló con exit $LASTEXITCODE." }
$secret = Join-Path $RepoPath "extension\groq-secret.local.js"
if(Test-Path $secret){
  Copy-Item $secret (Join-Path $ExtensionPath "groq-secret.local.js") -Force
}

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\install-observability-host.ps1" -ExtensionPath $ExtensionPath
if($LASTEXITCODE -ne 0){ throw "No se pudo instalar el host de observabilidad." }

& node --check ".\extension\ui\popup.js"
if($LASTEXITCODE -ne 0){ throw "popup.js no supera el chequeo de sintaxis." }
& node ".\tools\observability-static-audit.mjs"
if($LASTEXITCODE -ne 0){ throw "La auditoría estática no pasó." }

$manifest = Get-Content (Join-Path $ExtensionPath "manifest.json") -Raw | ConvertFrom-Json
$hostExe = Join-Path $env:USERPROFILE ".signal-interpreter\observability-native\SignalInterpreterObservabilityHost.exe"
if(-not(Test-Path $hostExe)){ throw "No existe el host nativo instalado." }
Write-Host ""
Write-Host "SIGNAL INTERPRETER BOOTSTRAP = READY" -ForegroundColor Green
Write-Host ("VERSION=" + $manifest.version)
Write-Host ("REPO=" + $RepoPath)
Write-Host ("EXTENSION=" + $ExtensionPath)
Write-Host ("GROQ_LOCAL=" + (Test-Path $secret))
Write-Host ("OBSERVABILITY_HOST=" + $hostExe)
Write-Host "ACCION_FINAL=Chrome > chrome://extensions > Cargar sin empaquetar / Recargar la carpeta Signal-Interpreter-Extension"
