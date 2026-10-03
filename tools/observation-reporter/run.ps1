$ErrorActionPreference="Stop";
$root=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path;
$env:SIGNAL_INTERPRETER_REPO=$root;
$env:SIGNAL_OBSERVATION_PUBLISH_REPO=(Join-Path ($env:USERPROFILE) ".signal-interpreter\observation-publisher");
& (Get-Command node -ErrorAction Stop).Source "$root\tools\observation-reporter\server.mjs"