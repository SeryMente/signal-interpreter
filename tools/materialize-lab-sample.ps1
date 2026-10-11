[CmdletBinding()]
param([string]$Root=(Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference='Stop'
$ui=Join-Path $Root 'extension\ui'
$meta=Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $ui 'sample.json') | ConvertFrom-Json
if($meta.schema -ne 'signal-caption-lab-sample/v1' -or $meta.file -ne 'sample.ogg' -or $meta.encoding -ne 'ogg-opus' -or $meta.sha256 -notmatch '^[A-Fa-f0-9]{64}$' -or [Math]::Abs([double]$meta.durationSeconds-281.6) -gt 0.001){throw 'Bundled sample metadata invalid; no sample changed.'}
$encoded=[IO.File]::ReadAllText((Join-Path $ui 'sample.ogg.b64')).Trim()
$bytes=[Convert]::FromBase64String($encoded)
$sha=[Security.Cryptography.SHA256]::Create()
try{$actual=[BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-','')}finally{$sha.Dispose()}
if($actual -ne $meta.sha256 -or $bytes.Length -lt 64 -or [Text.Encoding]::ASCII.GetString($bytes,0,4) -ne 'OggS'){throw 'Bundled audio integrity invalid; no sample changed.'}
$target=Join-Path $ui 'sample.ogg'
if(Test-Path -LiteralPath $target){if((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $actual){throw 'Existing bundled sample differs; preserve it and prepare a clean package.'}}
else{
 $temporary=Join-Path $ui ('sample-'+[guid]::NewGuid().ToString('N')+'.tmp')
 try{[IO.File]::WriteAllBytes($temporary,$bytes);if((Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash -ne $actual){throw 'Written sample not verified.'};Move-Item -LiteralPath $temporary -Destination $target}
 finally{if(Test-Path -LiteralPath $temporary){Remove-Item -LiteralPath $temporary -Force}}
}
[pscustomobject]@{Status='BUNDLED_VERIFIED';Sha256=$actual;DurationSeconds=[double]$meta.durationSeconds;File=$target}
