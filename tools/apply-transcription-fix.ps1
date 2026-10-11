[CmdletBinding()]
param([string]$TargetPath)
$ErrorActionPreference='Stop'
if($TargetPath){throw 'Ya no se copian archivos sobre otra instalacion. Usa la raiz del repositorio y INSTALAR.cmd.'}
& (Join-Path (Split-Path -Parent $PSScriptRoot) 'INSTALAR.ps1')
