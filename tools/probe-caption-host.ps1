[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$ExtensionRoot,
  [string]$ExecutablePath
)
$ErrorActionPreference='Stop'
$runtime=if(Test-Path -LiteralPath (Join-Path $ExtensionRoot 'extension\native')){Join-Path $ExtensionRoot 'extension'}else{$ExtensionRoot}
$exe=if(-not [string]::IsNullOrWhiteSpace($ExecutablePath)){[IO.Path]::GetFullPath($ExecutablePath)}else{Join-Path $runtime 'native\SignalInterpreter.CaptionHost.exe'}
if(-not(Test-Path -LiteralPath $exe -PathType Leaf)){throw "Native executable missing: $exe"}
$registration=Get-Content -Raw -LiteralPath (Join-Path $runtime 'native\register-caption-host.ps1')
$expected=[regex]::Match($registration,'ExpectedSha256\s*=\s*"([A-Fa-f0-9]{64})"').Groups[1].Value
if($expected.Length -ne 64 -or (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash -ne $expected){throw 'Native executable hash mismatch.'}
$start=New-Object Diagnostics.ProcessStartInfo
$start.FileName=$exe
$start.UseShellExecute=$false
$start.CreateNoWindow=$true
$start.RedirectStandardInput=$true
$start.RedirectStandardOutput=$true
$process=New-Object Diagnostics.Process
$process.StartInfo=$start
function Read-FrameBytes([int]$count,[int]$timeoutMs){
  $buffer=New-Object byte[] $count
  $offset=0
  $timer=[Diagnostics.Stopwatch]::StartNew()
  while($offset -lt $count){
    $remaining=$timeoutMs-[int]$timer.ElapsedMilliseconds
    if($remaining -le 0){return $null}
    $task=$process.StandardOutput.BaseStream.ReadAsync($buffer,$offset,$count-$offset)
    if(-not $task.Wait($remaining)){return $null}
    $n=$task.Result
    if($n -le 0){return $null}
    $offset+=$n
  }
  return ,$buffer
}
$frames=0;$captions=0;$active=$false;$visible=$false;$ready=$false;$started=$false
try{
  if(-not $process.Start()){throw 'Native process could not start.'}
  $started=$true
  $watch=[Diagnostics.Stopwatch]::StartNew()
  while($watch.ElapsedMilliseconds -lt 5000){
    $header=Read-FrameBytes 4 2500
    if($null -eq $header){break}
    $length=[BitConverter]::ToInt32($header,0)
    if($length -lt 1 -or $length -gt 1048576){throw 'Invalid Native Messaging frame length.'}
    $bytes=Read-FrameBytes $length 2500
    if($null -eq $bytes){throw 'Truncated Native Messaging frame.'}
    $message=[Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json
    $frames++
    if($message.type -eq 'ready'){$ready=$true}
    if($message.type -eq 'caption'){$captions++}
    if($message.active -eq $true){$active=$true}
    if($message.visible -eq $true){$visible=$true}
    # Spoken text stays in memory and is never printed or written to a report/file.
    $message=$null;$bytes=$null
  }
  $payload=[Text.Encoding]::UTF8.GetBytes('{"type":"stop"}')
  $stdin=$process.StandardInput.BaseStream
  $frame=[BitConverter]::GetBytes([int]$payload.Length)
  $stdin.Write($frame,0,$frame.Length);$stdin.Write($payload,0,$payload.Length);$stdin.Flush();$stdin.Close()
  if(-not $process.WaitForExit(5000)){throw 'Native probe did not stop in time.'}
  if(-not $ready -or $process.ExitCode -ne 0){throw 'Native protocol probe not verified.'}
  [pscustomobject]@{Protocol='PASS';Frames=$frames;CaptionEvents=$captions;NativeActiveObserved=$active;CaptionWindowVisibleObserved=$visible;RawTextExported=$false;CallOrChromeRestarted=$false;ExecutablePath=$exe} | ConvertTo-Json -Compress
}finally{
  # Only terminate the process started by this probe, never Chrome or other host instances.
  if($started -and -not $process.HasExited){$process.Kill()}
  $process.Dispose()
}
