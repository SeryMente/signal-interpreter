[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$installer = Join-Path $root 'INSTALAR.ps1'
if (-not (Test-Path -LiteralPath $installer -PathType Leaf)) {
    throw 'No se encontró INSTALAR.ps1 en la raíz portable; el puente no fue modificado.'
}
& $installer
if (-not $?) {
    throw 'El instalador raíz no confirmó la preparación del puente nativo.'
}
