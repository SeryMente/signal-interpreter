[CmdletBinding()]
param([switch]$Reset)
$ErrorActionPreference="Stop"
$storeDir=Join-Path $env:USERPROFILE ".signal-interpreter"
$store=Join-Path $storeDir "groq-token.dat"
$repoRoot=Split-Path -Parent $PSScriptRoot
$local=Join-Path $repoRoot "extension\groq-secret.local.js"
New-Item -ItemType Directory -Force -Path $storeDir | Out-Null
function Read-TokenText {
  if(-not (Test-Path -LiteralPath $store)){ return $null }
  try {
    $secure=Get-Content -Raw -LiteralPath $store | ConvertTo-SecureString
    return [System.Net.NetworkCredential]::new("",$secure).Password
  } catch { throw "No se pudo descifrar la credencial local con tu cuenta Windows." }
}
$token=Read-TokenText
if($Reset -or -not ($token -and $token -match "^gsk_[A-Za-z0-9_-]{20,}$")){
  $secure=Read-Host "Introduce tu Groq API Key (se guardará una sola vez en Windows)" -AsSecureString
  $token=[System.Net.NetworkCredential]::new("",$secure).Password
  if($token -notmatch "^gsk_[A-Za-z0-9_-]{20,}$"){ throw "La clave no tiene el formato esperado de Groq." }
  $secure | ConvertFrom-SecureString | Set-Content -LiteralPath $store -Encoding UTF8
}
$json=$token | ConvertTo-Json -Compress
$content="globalThis.__SIGNAL_GROQ_TOKEN=$json;"+[Environment]::NewLine
[System.IO.File]::WriteAllText($local,$content,[System.Text.UTF8Encoding]::new($false))
Remove-Variable token -ErrorAction SilentlyContinue
Write-Host "GROQ_KEY=READY (guardada localmente; no se muestra)" -ForegroundColor Green
Write-Host "LOCAL_SECRET=extension\groq-secret.local.js (no versionado)" -ForegroundColor Green
