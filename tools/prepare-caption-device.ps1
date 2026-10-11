[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$StageRoot)
$ErrorActionPreference='Stop'
& (Join-Path $StageRoot 'INSTALAR.ps1')
