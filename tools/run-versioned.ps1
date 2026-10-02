[CmdletBinding()]
param(
  [switch]$SkipTests
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$manifest = Join-Path $root "extension\manifest.json"
$deploy = "C:\Users\fila4\Desktop\Signal-Interpreter-Extension"
if (-not (Test-Path -LiteralPath $manifest)) { throw "No se encontró el manifest: $manifest" }

$text = [System.IO.File]::ReadAllText($manifest)
$m = [regex]::Match($text, '(?m)^\s*"version"\s*:\s*"(?<version>\d+\.\d+\.\d+)"\s*,')
if (-not $m.Success) { throw "No se encontró una versión semver x.y.z en manifest.json" }

[int]$major = $m.Groups["version"].Value.Split('.')[0]
[int]$minor = $m.Groups["version"].Value.Split('.')[1]
[int]$patch = $m.Groups["version"].Value.Split('.')[2]
$patch++
if ($patch -gt 65535) { $minor++; $patch = 0 }
if ($minor -gt 65535) { $major++; $minor = 0 }
if ($major -gt 65535) { throw "Se agotó el rango de versión admitido por Chrome." }
$version = "$major.$minor.$patch"

$newText = [regex]::Replace($text, '(?m)^(\s*"version"\s*:\s*")\d+\.\d+\.\d+("\s*,)', { param($m) $m.Groups[1].Value + $version + $m.Groups[2].Value }, 1)
[System.IO.File]::WriteAllText($manifest, $newText, [System.Text.UTF8Encoding]::new($false))

$parsed = Get-Content -Raw -LiteralPath $manifest | ConvertFrom-Json
if ([string]$parsed.version -ne $version) { throw "La versión no se pudo establecer correctamente." }

Copy-Item -Path (Join-Path $root "extension\*") -Destination $deploy -Recurse -Force
$deployManifest = Join-Path $deploy "manifest.json"
$deployParsed = Get-Content -Raw -LiteralPath $deployManifest | ConvertFrom-Json
if ([string]$deployParsed.version -ne $version) { throw "La copia desplegable no coincide: repo=$version deploy=$($deployParsed.version)" }

node --check (Join-Path $root "extension\background.js")
node --check (Join-Path $root "extension\content.js")
node --check (Join-Path $root "extension\offscreen.js")
node --check (Join-Path $root "extension\groq-transcriber.js")
node --check (Join-Path $root "extension\ui\popup.js")
node --check (Join-Path $root "extension\ui\live.js")
node --check (Join-Path $root "extension\dialogue-engine.js")
if (-not $SkipTests) {
  Push-Location $root
  try { node tools\groq-transcriber-tests.mjs }
  finally { Pop-Location }
}

Write-Host "SIGNAL_INTERPRETER_RUN_VERSION=$version" -ForegroundColor Cyan
Write-Host "DEPLOY_VERSION=$($deployParsed.version)" -ForegroundColor Green
Write-Host "RUN_VERSIONED=PASS" -ForegroundColor Green