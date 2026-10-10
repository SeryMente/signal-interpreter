[CmdletBinding()]
param([string]$TargetPath)
$ErrorActionPreference = 'Stop'
$package = $PSScriptRoot
$source = Join-Path $package 'extension'
$payloadManifest = Join-Path $package 'payload-sha256.json'
$extensionId = 'ldpbjhobnfgmhdoehehdmnbhhjckebmj'
function Get-ExtensionIdentity([string]$path) {
  $m = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $path 'manifest.json') | ConvertFrom-Json
  if ($m.name -ne 'Signal Interpreter') { throw 'Target is not Signal Interpreter.' }
  $sha = [Security.Cryptography.SHA256]::Create()
  try { $d = $sha.ComputeHash([Convert]::FromBase64String([string]$m.key)) } finally { $sha.Dispose() }
  return (-join ($d[0..15] | ForEach-Object { [char](97 + ($_ -shr 4)); [char](97 + ($_ -band 15)) }))
}
if (-not (Test-Path -LiteralPath $payloadManifest)) { throw 'Payload manifest missing; no files changed.' }
if ((Get-ExtensionIdentity $source) -ne $extensionId) { throw 'Package identity mismatch; no files changed.' }
$principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Use the normal Windows account that runs Chrome, not an elevated terminal.' }
if (Get-Process -Name chrome -ErrorAction SilentlyContinue) { throw 'Finish the call and close Chrome before applying. No files changed.' }
if (-not $TargetPath) {
  $candidates = @()
  $userData = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data'
  if (Test-Path -LiteralPath $userData) {
    foreach ($profile in (Get-ChildItem -LiteralPath $userData -Directory | Where-Object { $_.Name -eq 'Default' -or $_.Name -like 'Profile *' })) {
      foreach ($name in @('Secure Preferences','Preferences')) {
        $file = Join-Path $profile.FullName $name
        if (-not (Test-Path -LiteralPath $file)) { continue }
        try {
          $prefs = Get-Content -Raw -Encoding UTF8 -LiteralPath $file | ConvertFrom-Json
          $settings = $prefs.extensions.settings
          if (-not $settings) { continue }
          $property = $settings.PSObject.Properties[$extensionId]
          if ($property -and $property.Value.path -and [IO.Path]::IsPathRooted([string]$property.Value.path)) {
            $candidates += [IO.Path]::GetFullPath([string]$property.Value.path)
          }
        } catch { Write-Warning 'A Chrome preferences file could not be read; no target inferred from it.' }
      }
    }
  }
  $candidates = @($candidates | Select-Object -Unique | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'manifest.json') })
  if ($candidates.Count -eq 0) {
    $desktop = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Signal-Interpreter-Extension'
    if (Test-Path -LiteralPath (Join-Path $desktop 'manifest.json')) { $candidates = @($desktop) }
  }
  if ($candidates.Count -ne 1) { throw 'No unique existing installation found. No files changed. The installer accepts -TargetPath for an explicitly verified installation.' }
  $TargetPath = $candidates[0]
}
$TargetPath = [IO.Path]::GetFullPath($TargetPath)
if ((Get-ExtensionIdentity $TargetPath) -ne $extensionId) { throw 'Existing installation identity mismatch; no files changed.' }
$targetManifest = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $TargetPath 'manifest.json') | ConvertFrom-Json
if ([version]$targetManifest.version -gt [version]'0.10.30') { throw 'A newer extension is already installed; downgrade refused, no files changed.' }
if ($TargetPath -eq [IO.Path]::GetFullPath($source)) { throw 'The unpacked package is not the existing installation; no files changed.' }
$entries = @(Get-Content -Raw -Encoding UTF8 -LiteralPath $payloadManifest | ConvertFrom-Json)
foreach ($entry in $entries) {
  $relative = [string]$entry.path
  if ([IO.Path]::IsPathRooted($relative) -or $relative -match '(^|[/\\])\.\.([/\\]|$)') { throw 'Unsafe payload path; no files changed.' }
  $file = Join-Path $source $relative
  if (-not (Test-Path -LiteralPath $file) -or (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $entry.sha256) { throw 'Payload hash mismatch; no files changed.' }
}
$backup = Join-Path ([IO.Path]::GetTempPath()) ('signal-caption-backup-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $backup | Out-Null
Copy-Item -Path (Join-Path $TargetPath '*') -Destination $backup -Recurse -Force
$registryPath = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.signalinterpreter.captionhost'
$hadRegistry = Test-Path -LiteralPath $registryPath
$oldRegistry = if ($hadRegistry) { (Get-Item -LiteralPath $registryPath).GetValue('') } else { $null }
$createdFiles = @($entries | Where-Object { -not (Test-Path -LiteralPath (Join-Path $TargetPath $_.path)) } | ForEach-Object { $_.path })
try {
  # Only payload files are updated; local keys and Chrome profile storage are untouched.
  foreach ($entry in $entries) {
    $destination = Join-Path $TargetPath $entry.path
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
    Copy-Item -LiteralPath (Join-Path $source $entry.path) -Destination $destination -Force
    if ((Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash -ne $entry.sha256) { throw 'Copied file verification failed.' }
  }
  & (Join-Path $TargetPath 'native\prepare-caption-runtime.ps1')
  Write-Output 'INSTALLED_FILES=VERIFIED version=0.10.30'
  Write-Output "BACKUP=$backup"
  Write-Output 'Open Chrome again. If tab capture needs invocation, open the existing Signal Interpreter popup on the Cloud Interpreter tab.'
  Write-Output 'Real bilingual call acceptance remains pending; this installer does not certify a call.'
} catch {
  $failure = $_
  foreach ($relative in $createdFiles) { $file = Join-Path $TargetPath $relative; if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file -Force } }
  Copy-Item -Path (Join-Path $backup '*') -Destination $TargetPath -Recurse -Force
  if ($hadRegistry) { New-Item -Path $registryPath -Force | Out-Null; New-ItemProperty -Path $registryPath -Name '(default)' -PropertyType String -Value $oldRegistry -Force | Out-Null }
  elseif (Test-Path -LiteralPath $registryPath) { Remove-Item -LiteralPath $registryPath -Force }
  Write-Warning "Previous installation restored; backup retained at $backup"
  throw $failure
}
