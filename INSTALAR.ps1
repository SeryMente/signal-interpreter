[CmdletBinding()]
param([switch]$SkipSample)
$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$native=Join-Path $root 'extension\native'
$manifest=Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $root 'manifest.json') | ConvertFrom-Json
if($manifest.name -ne 'Signal Interpreter' -or $manifest.version -ne '0.10.37'){throw 'Paquete inesperado; no se modificó el registro.'}
$sha=[Security.Cryptography.SHA256]::Create()
try{$digest=$sha.ComputeHash([Convert]::FromBase64String([string]$manifest.key))}finally{$sha.Dispose()}
$id=-join($digest[0..15] | ForEach-Object{[char](97+($_ -shr 4));[char](97+($_ -band 15))})
if($id -ne 'ldpbjhobnfgmhdoehehdmnbhhjckebmj'){throw 'Identidad de extensión incorrecta.'}
$entries=ConvertFrom-Json -InputObject (Get-Content -Raw -LiteralPath (Join-Path $root 'payload-sha256.json'))
$registry='HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.signalinterpreter.captionhost'
$registered=if(Test-Path -LiteralPath $registry){[string](Get-Item -LiteralPath $registry).GetValue('')}else{$null}
$expected=Join-Path $native 'com.signalinterpreter.captionhost.json'
foreach($entry in $entries){
 $relative=[string]$entry.path
 if([IO.Path]::IsPathRooted($relative) -or $relative -match '(^|[/\\])\.\.([/\\]|$)'){throw 'Ruta de payload insegura.'}
 $file=Join-Path $root $relative
 if($registered -eq $expected -and $relative -eq 'extension/native/com.signalinterpreter.captionhost.json'){
  $hostConfig=Get-Content -Raw -LiteralPath $file | ConvertFrom-Json
  if($hostConfig.allowed_origins -notcontains "chrome-extension://$id/" -or [IO.Path]::GetFullPath($hostConfig.path) -ne [IO.Path]::GetFullPath((Join-Path $native 'SignalInterpreter.CaptionHost.exe'))){throw 'Registro existente no coincide con la identidad esperada.'}
  continue
 }
 if(-not(Test-Path -LiteralPath $file) -or (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $entry.sha256){throw "Archivo no verificado: $relative"}
}
# SkipSample is retained for older callers; the bundled sample is always verified, never synthesized.
$sampleInfo=& (Join-Path $root 'tools\materialize-lab-sample.ps1') -Root $root
if(Get-Process -Name 'SignalInterpreter.CaptionHost' -ErrorAction SilentlyContinue){throw 'Hay un puente en uso. Finaliza la llamada/prueba antes de instalar; no se cerró ningún proceso.'}
$browser=Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object {$_.CommandLine -and $_.CommandLine -notmatch '--type='} | Select-Object -First 1
if($browser){$owner=Invoke-CimMethod -InputObject $browser -MethodName GetOwnerSid;if($owner.ReturnValue -ne 0 -or $owner.Sid -ne [Security.Principal.WindowsIdentity]::GetCurrent().User.Value){throw 'El usuario de Chrome es distinto; no se cambió el registro.'}}
$backup=Join-Path ([IO.Path]::GetTempPath()) ('signal-install-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $backup | Out-Null
Copy-Item -LiteralPath $expected -Destination (Join-Path $backup 'host-manifest.json')
try{
 & (Join-Path $native 'register-caption-host.ps1') | Out-Null
 if((Get-Item -LiteralPath $registry).GetValue('') -ne $expected){throw 'Registro del host no verificado.'}
 $probe=(& (Join-Path $root 'tools\probe-caption-host.ps1') -ExtensionRoot $root) | ConvertFrom-Json
 if($probe.Protocol -ne 'PASS'){throw 'Protocolo nativo no verificado.'}
}catch{
 Copy-Item -LiteralPath (Join-Path $backup 'host-manifest.json') -Destination $expected -Force
 if($registered){New-Item -Path $registry -Force|Out-Null;New-ItemProperty -Path $registry -Name '(default)' -PropertyType String -Value $registered -Force|Out-Null}else{Remove-Item -LiteralPath $registry -Recurse -Force -ErrorAction SilentlyContinue}
 throw
}
$sampleState='BUNDLED_VERIFIED'
$result=[ordered]@{Version=$manifest.version;Root=$root;Identity=$id;Hashes='PASS';NativeProtocol=$probe.Protocol;Sample=$sampleState;SampleSha256=$sampleInfo.Sha256;SampleDurationSeconds=$sampleInfo.DurationSeconds;ChromeLoaded='NO_VERIFICADO';RealCall='NO_VERIFICADA';ChromeRestarted=$false}
[IO.File]::WriteAllText((Join-Path $root 'INSTALACION-RESULTADO.json'),($result|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
Write-Output "INSTALACION_PREPARADA=VERIFICADA | $root"
Write-Output 'Carga esta MISMA carpeta desde Chrome como extension descomprimida. Luego usa Probar sin llamadas en el popup o PROBAR.cmd. Preparacion no equivale a captions en vivo.'
