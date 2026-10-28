[CmdletBinding()]
param([switch]$SkipSample)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$native = Join-Path $root 'extension\native'
$manifestFile = Join-Path $root 'manifest.json'
$manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $manifestFile | ConvertFrom-Json

if ($manifest.name -ne 'Signal Interpreter' -or $manifest.version -ne '0.10.38') {
    throw 'Unexpected Signal Interpreter package version; nothing was registered.'
}
if (-not $env:LOCALAPPDATA) { throw 'LOCALAPPDATA is undefined; no host was installed.' }

$sha = [Security.Cryptography.SHA256]::Create()
try { $digest = $sha.ComputeHash([Convert]::FromBase64String([string]$manifest.key)) } finally { $sha.Dispose() }
$id = -join ($digest[0..15] | ForEach-Object { [char](97 + ($_ -shr 4)); [char](97 + ($_ -band 15)) })
if ($id -ne 'ldpbjhobnfgmhdoehehdmnbhhjckebmj') { throw 'Extension identity mismatch; no host was registered.' }

# Verify every payload file before materializing the native executable or touching the registry.
# Accept the current schema (object with files[]) and legacy top-level arrays. This
# prevents Windows PowerShell 5.1 from treating an inventory container as one path.
$inventoryPath = Join-Path $root 'payload-sha256.json'
try {
    $inventoryText = [IO.File]::ReadAllText($inventoryPath, [Text.Encoding]::UTF8)
    $inventory = ConvertFrom-Json -InputObject $inventoryText
} catch {
    throw "Invalid payload-sha256.json: $($_.Exception.Message)"
}

$entries = @()
if ($inventory -is [System.Array]) {
    $entries = @($inventory)
} elseif ($null -ne $inventory -and $inventory.PSObject.Properties['files'] -and $null -ne $inventory.files) {
    if ($inventory.schema -ne 'signal-interpreter-payload-sha256/v1') {
        throw 'Payload inventory schema is invalid; no native host or registry values were changed.'
    }
    $entries = @($inventory.files)
} elseif ($null -ne $inventory -and $inventory.PSObject.Properties['path'] -and $inventory.PSObject.Properties['sha256']) {
    # Compatibility with inventories that store parallel path/hash arrays.
    if ($inventory.path -is [System.Array] -or $inventory.sha256 -is [System.Array]) {
        $paths = @($inventory.path)
        $hashes = @($inventory.sha256)
        if ($paths.Count -lt 1 -or $paths.Count -ne $hashes.Count) {
            throw 'Legacy payload path/hash arrays are empty or have different lengths.'
        }
        for ($i = 0; $i -lt $paths.Count; $i++) {
            $entries += [pscustomobject]@{ path = $paths[$i]; sha256 = $hashes[$i] }
        }
    } else {
        $entries = @($inventory)
    }
} else {
    throw 'Payload inventory schema is invalid; expected files[] or a legacy list. No native host or registry values were changed.'
}

# Normalize a legacy single object whose path and sha256 properties are arrays.
if ($entries.Count -eq 1 -and $null -ne $entries[0] -and
    $entries[0].PSObject.Properties['path'] -and $entries[0].path -is [System.Array]) {
    $paths = @($entries[0].path)
    $hashes = @($entries[0].sha256)
    if ($paths.Count -lt 1 -or $paths.Count -ne $hashes.Count) {
        throw 'Legacy payload path/hash arrays are empty or have different lengths.'
    }
    $entries = @()
    for ($i = 0; $i -lt $paths.Count; $i++) {
        $entries += [pscustomobject]@{ path = $paths[$i]; sha256 = $hashes[$i] }
    }
}
if ($entries.Count -lt 1) { throw 'Payload inventory is empty; no native host or registry values were changed.' }

$seenPayloadPaths = @{}
foreach ($entry in $entries) {
    if ($null -eq $entry -or $entry.path -is [System.Array]) {
        throw 'Payload inventory entry has a non-scalar path; extract a fresh package and retry.'
    }
    $relative = [string]$entry.path
    $expectedHash = [string]$entry.sha256
    if ([string]::IsNullOrWhiteSpace($relative) -or $relative -match '\\s' -or $expectedHash -notmatch '^[A-Fa-f0-9]{64}$') {
        throw 'Payload inventory entry is malformed; each entry must contain one relative path and one SHA-256 hash.'
    }
    if ([IO.Path]::IsPathRooted($relative) -or $relative -match '(^|[/\\])\.\.([/\\]|$)') { throw "Unsafe payload path: $relative" }
    $pathKey = $relative.Replace('\\', '/').ToLowerInvariant()
    if ($seenPayloadPaths.ContainsKey($pathKey)) { throw "Duplicate payload path in inventory: $relative" }
    $seenPayloadPaths[$pathKey] = $true
    $file = Join-Path $root $relative
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing payload file: $relative" }
    $actual = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
    if ($actual -ine $expectedHash) { throw "Payload SHA-256 mismatch: $relative" }
}

$sampleOutput = @(& (Join-Path $root 'tools\materialize-lab-sample.ps1') -Root $root)
if ($sampleOutput.Count -lt 1) { throw 'Bundled laboratory sample could not be verified.' }
$sampleInfo = $sampleOutput[-1]
if (Get-Process -Name 'SignalInterpreter.CaptionHost' -ErrorAction SilentlyContinue) {
    throw 'Native caption host is running. End the current call/test before preparing the bridge; no process was stopped.'
}

$browser = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine -notmatch '--type=' } | Select-Object -First 1
if ($browser) {
    $owner = Invoke-CimMethod -InputObject $browser -MethodName GetOwnerSid
    if ($owner.ReturnValue -ne 0 -or $owner.Sid -ne [Security.Principal.WindowsIdentity]::GetCurrent().User.Value) {
        throw 'Chrome belongs to a different Windows user. Run the preparation as the same user that runs Chrome.'
    }
}

$registrationScript = Get-Content -Raw -LiteralPath (Join-Path $native 'register-caption-host.ps1')
$expectedMatch = [regex]::Match($registrationScript, 'ExpectedSha256\s*=\s*"([A-Fa-f0-9]{64})"')
if (-not $expectedMatch.Success) { throw 'Expected native executable hash was not found in the registration script.' }
$expectedExeHash = $expectedMatch.Groups[1].Value.ToUpperInvariant()
$payloadFile = Join-Path $native 'SignalInterpreter.CaptionHost.exe.b64'
$bytes = [Convert]::FromBase64String(([IO.File]::ReadAllText($payloadFile)).Trim())
$exeHasher = [Security.Cryptography.SHA256]::Create()
try { $actualExeHash = [BitConverter]::ToString($exeHasher.ComputeHash($bytes)).Replace('-', '') } finally { $exeHasher.Dispose() }
if ($actualExeHash -ne $expectedExeHash) { throw "Native executable SHA-256 mismatch. Expected=$expectedExeHash Actual=$actualExeHash" }

# First materialize and test the exact bytes bundled with this package.
$packageExe = Join-Path $native 'SignalInterpreter.CaptionHost.exe'
[IO.File]::WriteAllBytes($packageExe, $bytes)
$probeScript = Join-Path $root 'tools\probe-caption-host.ps1'
$packageProbe = (& $probeScript -ExtensionRoot $root -ExecutablePath $packageExe) | ConvertFrom-Json
if ($packageProbe.Protocol -ne 'PASS') { throw 'Bundled native executable failed the Native Messaging protocol probe; registry was not changed.' }

# Install the host at a stable user-profile path, independent of the extracted extension folder.
$hostName = 'com.signalinterpreter.captionhost'
$stableRoot = Join-Path $env:LOCALAPPDATA 'SignalInterpreter\NativeMessagingHost'
$stableExe = Join-Path $stableRoot 'SignalInterpreter.CaptionHost.exe'
$stableManifest = Join-Path $stableRoot ($hostName + '.json')
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$hostName"
$registryExisted = Test-Path -LiteralPath $registryPath
$oldRegistryValue = if ($registryExisted) { (Get-Item -LiteralPath $registryPath).GetValue('') } else { $null }
$backup = Join-Path ([IO.Path]::GetTempPath()) ('signal-native-host-' + [guid]::NewGuid().ToString('N'))
$stageExe = $null
$stageManifest = $null
$stableExeExisted = Test-Path -LiteralPath $stableExe
$stableManifestExisted = Test-Path -LiteralPath $stableManifest
New-Item -ItemType Directory -Path $backup -Force | Out-Null

try {
    if ($stableExeExisted) { Copy-Item -LiteralPath $stableExe -Destination (Join-Path $backup 'SignalInterpreter.CaptionHost.exe') -Force }
    if ($stableManifestExisted) { Copy-Item -LiteralPath $stableManifest -Destination (Join-Path $backup ($hostName + '.json')) -Force }

    New-Item -ItemType Directory -Path $stableRoot -Force | Out-Null
    $token = [guid]::NewGuid().ToString('N')
    $stageExe = Join-Path $stableRoot ('SignalInterpreter.CaptionHost.' + $token + '.tmp')
    $stageManifest = Join-Path $stableRoot ($hostName + '.' + $token + '.json.tmp')
    [IO.File]::WriteAllBytes($stageExe, $bytes)
    if ((Get-FileHash -LiteralPath $stageExe -Algorithm SHA256).Hash -ine $expectedExeHash) { throw 'Staged native executable verification failed.' }

    $hostConfig = [ordered]@{
        name = $hostName
        description = 'Signal Interpreter Live Caption bridge'
        path = [IO.Path]::GetFullPath($stableExe)
        type = 'stdio'
        allowed_origins = @("chrome-extension://$id/")
    }
    $hostJson = $hostConfig | ConvertTo-Json -Depth 5
    [IO.File]::WriteAllText($stageManifest, $hostJson, [Text.UTF8Encoding]::new($false))
    $stagedConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath $stageManifest | ConvertFrom-Json
    if ($stagedConfig.allowed_origins -notcontains "chrome-extension://$id/" -or [IO.Path]::GetFullPath([string]$stagedConfig.path) -ne [IO.Path]::GetFullPath($stableExe)) {
        throw 'Staged native host manifest failed identity/path verification.'
    }

    Move-Item -LiteralPath $stageExe -Destination $stableExe -Force
    $stageExe = $null
    Move-Item -LiteralPath $stageManifest -Destination $stableManifest -Force
    $stageManifest = $null

    New-Item -Path $registryPath -Force | Out-Null
    New-ItemProperty -Path $registryPath -Name '(default)' -PropertyType String -Value $stableManifest -Force | Out-Null

    $registered = [string](Get-Item -LiteralPath $registryPath).GetValue('')
    if ([IO.Path]::GetFullPath($registered) -ne [IO.Path]::GetFullPath($stableManifest)) { throw 'Native host registry value does not point to the stable manifest.' }
    $registeredConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath $registered | ConvertFrom-Json
    if ($registeredConfig.allowed_origins -notcontains "chrome-extension://$id/" -or [IO.Path]::GetFullPath([string]$registeredConfig.path) -ne [IO.Path]::GetFullPath($stableExe)) {
        throw 'Registered host manifest identity or executable path is incorrect.'
    }

    # Probe the exact executable path that Chrome will launch from the registered manifest.
    $probe = (& $probeScript -ExtensionRoot $root -ExecutablePath $stableExe) | ConvertFrom-Json
    if ($probe.Protocol -ne 'PASS') { throw 'Installed native executable failed its protocol probe.' }
} catch {
    try {
        if ($registryExisted) {
            New-Item -Path $registryPath -Force | Out-Null
            if ($null -ne $oldRegistryValue) {
                New-ItemProperty -Path $registryPath -Name '(default)' -PropertyType String -Value ([string]$oldRegistryValue) -Force | Out-Null
            } else {
                Remove-ItemProperty -LiteralPath $registryPath -Name '(default)' -ErrorAction SilentlyContinue
            }
        } else {
            Remove-Item -LiteralPath $registryPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    } catch {}
    try {
        if ($stableExeExisted -and (Test-Path -LiteralPath (Join-Path $backup 'SignalInterpreter.CaptionHost.exe'))) {
            Copy-Item -LiteralPath (Join-Path $backup 'SignalInterpreter.CaptionHost.exe') -Destination $stableExe -Force
        } elseif (Test-Path -LiteralPath $stableExe) {
            Remove-Item -LiteralPath $stableExe -Force -ErrorAction SilentlyContinue
        }
        if ($stableManifestExisted -and (Test-Path -LiteralPath (Join-Path $backup ($hostName + '.json')))) {
            Copy-Item -LiteralPath (Join-Path $backup ($hostName + '.json')) -Destination $stableManifest -Force
        } elseif (Test-Path -LiteralPath $stableManifest) {
            Remove-Item -LiteralPath $stableManifest -Force -ErrorAction SilentlyContinue
        }
    } catch {}
    throw
} finally {
    if ($stageExe -and (Test-Path -LiteralPath $stageExe)) { Remove-Item -LiteralPath $stageExe -Force -ErrorAction SilentlyContinue }
    if ($stageManifest -and (Test-Path -LiteralPath $stageManifest)) { Remove-Item -LiteralPath $stageManifest -Force -ErrorAction SilentlyContinue }
    Remove-Item -LiteralPath $backup -Recurse -Force -ErrorAction SilentlyContinue
}

$receipt = [ordered]@{
    Version = $manifest.version
    Root = $root
    Identity = $id
    Hashes = 'PASS'
    NativeProtocol = $probe.Protocol
    NativeHostRoot = $stableRoot
    NativeHostManifest = $stableManifest
    NativeHostRegistry = 'PASS'
    Sample = 'BUNDLED_VERIFIED'
    SampleSha256 = $sampleInfo.Sha256
    SampleDurationSeconds = $sampleInfo.DurationSeconds
    ChromeLoaded = 'NO_VERIFICADO'
    RealCall = 'NO_VERIFICADA'
    ChromeRestarted = $false
}
[IO.File]::WriteAllText((Join-Path $root 'INSTALACION-RESULTADO.json'), ($receipt | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
Write-Output "BRIDGE_PREPARADO=VERIFICADO | $stableRoot"
Write-Output 'HASHES=PASS | NATIVE_MESSAGING_PROTOCOL=PASS | CHROME_RESTARTED=NO'
Write-Output 'Ahora carga en chrome://extensions la carpeta raiz de este paquete (la que contiene manifest.json).'
Write-Output 'Preparar el puente no prueba una transcripcion en llamada real.';
