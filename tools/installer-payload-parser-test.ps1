$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$inventoryPath = Join-Path $root 'payload-sha256.json'
$inventoryJson = [IO.File]::ReadAllText($inventoryPath, [Text.Encoding]::UTF8)
$inventoryParsed = ConvertFrom-Json -InputObject $inventoryJson

# Windows PowerShell 5.1 can wrap the JSON array in an additional array.
$entries = New-Object 'System.Collections.Generic.List[object]'
foreach ($candidate in $inventoryParsed) {
    if ($candidate -is [System.Array]) {
        foreach ($nestedEntry in $candidate) { $entries.Add($nestedEntry) }
    } else {
        $entries.Add($candidate)
    }
}
if ($entries.Count -ne 53) { throw "Expected 53 payload entries, parsed $($entries.Count)." }

foreach ($entry in $entries) {
    if ($null -eq $entry -or [string]::IsNullOrWhiteSpace([string]$entry.path) -or [string]::IsNullOrWhiteSpace([string]$entry.sha256)) {
        throw 'Malformed payload inventory entry.'
    }
    $relative = [string]$entry.path
    if ([IO.Path]::IsPathRooted($relative) -or $relative -match '(^|[/\\])\.\.([/\\]|$)') {
        throw "Unsafe payload path: $relative"
    }
    $file = Join-Path $root $relative
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing payload file: $relative" }
    $actual = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
    if ($actual -ine [string]$entry.sha256) { throw "Payload hash mismatch: $relative expected=$($entry.sha256) actual=$actual" }
}
Write-Output "POWERSHELL_5_1_PAYLOAD_INTEGRITY=PASS | Entries=$($entries.Count)"
