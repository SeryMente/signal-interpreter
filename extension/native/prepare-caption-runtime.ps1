[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifestPath = Join-Path $root 'manifest.json'
$installerPath = Join-Path $root 'INSTALAR.ps1'
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw 'Extension manifest missing; no changes applied.' }
$manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $manifestPath | ConvertFrom-Json
if ($manifest.name -ne 'Signal Interpreter' -or $manifest.version -ne '0.10.38') { throw 'Expected Signal Interpreter 0.10.38; no changes applied.' }
if (-not (Test-Path -LiteralPath $installerPath -PathType Leaf)) { throw 'Root INSTALAR.ps1 missing; no bridge registration was attempted.' }
& $installerPath
