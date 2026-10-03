[CmdletBinding()]
param(
  [string]$ExtensionPath,
  [string]$ExtensionId
)
$ErrorActionPreference="Stop"
if(-not $ExtensionPath){
  $candidates=@(
    (Join-Path $env:USERPROFILE "Desktop\Signal Interpreter"),
    (Join-Path $env:USERPROFILE "Desktop\Signal-Interpreter-Extension"),
    (Join-Path (Split-Path $PSScriptRoot -Parent) "extension")
  )
  $ExtensionPath=$candidates | Where-Object { Test-Path -LiteralPath (Join-Path $_ "manifest.json") } | Select-Object -First 1
}
if(-not $ExtensionPath -or -not(Test-Path -LiteralPath (Join-Path $ExtensionPath "manifest.json"))){throw "No se encontró una extensión válida. Use -ExtensionPath con la carpeta que contiene manifest.json."}
$dotnet=(Get-Command dotnet -ErrorAction SilentlyContinue).Source
if(-not $dotnet -and (Test-Path "$env:USERPROFILE\.dotnet\dotnet.exe")){$dotnet="$env:USERPROFILE\.dotnet\dotnet.exe"}
if(-not $dotnet){throw "Se necesita .NET SDK (dotnet)."}
if(-not(Get-Command gh -ErrorAction SilentlyContinue)){throw "Se necesita GitHub CLI (gh)."}
$hostName="com.serymente.signal_interpreter.observability"
$sourceRoot=Join-Path $PSScriptRoot "observability-native-host"
$installRoot=Join-Path $env:USERPROFILE ".signal-interpreter\observability-native"
New-Item -ItemType Directory -Force -Path $installRoot | Out-Null
if(-not $ExtensionId){
  $p=[IO.Path]::GetFullPath($ExtensionPath).TrimEnd('\')
  if($p.Length -ge 2 -and $p[1] -eq ':'){$p=$p.Substring(0,1).ToUpperInvariant()+$p.Substring(1)}
  $bytes=[Text.Encoding]::Unicode.GetBytes($p)
  $hash=[Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
  $chars="abcdefghijklmnop"
  $ExtensionId=(-join ($hash[0..15] | ForEach-Object { $chars[$_ -shr 4]; $chars[$_ -band 15] }))
}
if($ExtensionId -notmatch '^[a-p]{32}$'){throw "ExtensionId inválido: $ExtensionId"}
Write-Host "EXTENSION_PATH=$ExtensionPath"
Write-Host "EXTENSION_ID=$ExtensionId"
& $dotnet publish (Join-Path $sourceRoot "SignalInterpreterObservabilityHost.csproj") -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o $installRoot | Out-Host
$binary=Join-Path $installRoot "SignalInterpreterObservabilityHost.exe"
if(-not(Test-Path -LiteralPath $binary)){throw "No se generó el host nativo."}
$manifestPath=Join-Path $installRoot "$hostName.json"
$manifest=@{name=$hostName;description="Signal Interpreter development observability publisher";path=$binary;type="stdio";allowed_origins=@("chrome-extension://$ExtensionId/")} | ConvertTo-Json -Depth 5
[IO.File]::WriteAllText($manifestPath,$manifest,(New-Object Text.UTF8Encoding($false)))
$reg="HKCU:\Software\Google\Chrome\NativeMessagingHosts\$hostName"
New-Item -Path $reg -Force | Out-Null
Set-ItemProperty -Path $reg -Name "(default)" -Value $manifestPath
gh auth status | Out-Host
Write-Host "OBSERVABILITY_HOST=INSTALLED" -ForegroundColor Green
Write-Host "MANIFEST=$manifestPath" -ForegroundColor Green
