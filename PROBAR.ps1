[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\')
$id='ldpbjhobnfgmhdoehehdmnbhhjckebmj'
$manifest=Get-Content -Raw -LiteralPath (Join-Path $root 'manifest.json') | ConvertFrom-Json
if($manifest.version -ne '0.10.38'){throw 'Manifiesto esperado no encontrado en esta carpeta.'}
$profiles=@()
$userData=Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data'
if(Test-Path -LiteralPath $userData){foreach($dir in Get-ChildItem -LiteralPath $userData -Directory){foreach($name in @('Secure Preferences','Preferences')){$file=Join-Path $dir.FullName $name;if(-not(Test-Path -LiteralPath $file)){continue};try{$prefs=Get-Content -Raw -LiteralPath $file|ConvertFrom-Json;$entry=$prefs.extensions.settings.PSObject.Properties[$id];if($entry -and $entry.Value.path -and [IO.Path]::GetFullPath([string]$entry.Value.path).TrimEnd('\') -eq $root){$profiles+=$dir.Name;break}}catch{}}}}
$profiles=@($profiles|Select-Object -Unique)
if($profiles.Count -ne 1){throw 'No se encontro un perfil unico con esta carpeta cargada. Carga la raiz en Chrome y usa Probar sin llamadas en el popup; no se abrio otra cuenta/perfil.'}
$chrome=$null
foreach($key in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe','HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe')){if(Test-Path -LiteralPath $key){$candidate=(Get-Item -LiteralPath $key).GetValue('');if(Test-Path -LiteralPath $candidate){$chrome=$candidate;break}}}
if(-not $chrome){$command=Get-Command chrome.exe -ErrorAction SilentlyContinue;if($command){$chrome=$command.Source}}
if(-not $chrome){throw 'Chrome no encontrado; usa Probar sin llamadas en la extension.'}
$url="chrome-extension://$id/extension/ui/lab.html"
Start-Process -FilePath $chrome -ArgumentList @('--profile-directory="'+$profiles[0]+'"',$url)
Write-Output 'LABORATORIO_ABIERTO=SOLICITADO; la pagina verifica aislamiento y texto nativo. No se afirma una prueba aprobada.'
