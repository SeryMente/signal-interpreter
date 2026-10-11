[CmdletBinding()]
param([switch]$SkipSample,[switch]$Interactive)
$ErrorActionPreference='Stop'
$phase='PACKAGE';$hashState='NO_VERIFICADO';$protocolState='NO_VERIFICADO';$rollbackState='NOT_REQUIRED'
function Step([string]$number,[string]$text){Write-Host "[$number/4] $text" -ForegroundColor Cyan}
try {
Step '1' 'Verificar paquete e identidad'
$root=$PSScriptRoot
$native=Join-Path $root 'extension\native'
$manifest=Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $root 'manifest.json') | ConvertFrom-Json
if($manifest.name -ne 'Signal Interpreter' -or $manifest.version -ne '0.10.36'){throw 'Paquete inesperado; no se modificó el registro.'}
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
$hashState='PASS';$phase='HOST_BUSY'
Step '2' 'Preparar y comprobar el puente nativo'
if(Get-Process -Name 'SignalInterpreter.CaptionHost' -ErrorAction SilentlyContinue){throw 'Hay un puente en uso. Finaliza la llamada/prueba antes de instalar; no se cerró ningún proceso.'}
$phase='USER_IDENTITY'
$browser=Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object {$_.CommandLine -and $_.CommandLine -notmatch '--type='} | Select-Object -First 1
if($browser){$owner=Invoke-CimMethod -InputObject $browser -MethodName GetOwnerSid;if($owner.ReturnValue -ne 0 -or $owner.Sid -ne [Security.Principal.WindowsIdentity]::GetCurrent().User.Value){throw 'El usuario de Chrome es distinto; no se cambió el registro.'}}
$phase='NATIVE_PROTOCOL'
$backup=Join-Path ([IO.Path]::GetTempPath()) ('signal-install-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $backup | Out-Null
Copy-Item -LiteralPath $expected -Destination (Join-Path $backup 'host-manifest.json')
try{
 & (Join-Path $native 'register-caption-host.ps1') | Out-Null
 if((Get-Item -LiteralPath $registry).GetValue('') -ne $expected){throw 'Registro del host no verificado.'}
 $probe=(& (Join-Path $root 'tools\probe-caption-host.ps1') -ExtensionRoot $root) | ConvertFrom-Json
 if($probe.Protocol -ne 'PASS'){throw 'Protocolo nativo no verificado.'}
}catch{
 $rollbackState='FAILED'
 Copy-Item -LiteralPath (Join-Path $backup 'host-manifest.json') -Destination $expected -Force
 if($registered){New-Item -Path $registry -Force|Out-Null;New-ItemProperty -Path $registry -Name '(default)' -PropertyType String -Value $registered -Force|Out-Null}else{Remove-Item -LiteralPath $registry -Recurse -Force -ErrorAction SilentlyContinue}
 $rollbackState='RESTORED'
 throw
}
$protocolState='PASS';$phase='SAMPLE'
Step '3' 'Preparar audio de prueba local'
$sample=Join-Path $root 'extension\ui\sample.wav'
$sampleState=if(Test-Path -LiteralPath $sample){'PRESENTE'}else{'NO_GENERADA'}
if(-not $SkipSample -and -not(Test-Path -LiteralPath $sample)){
 $voice=$null;$stream=$null
 try{
  $voice=New-Object -ComObject SAPI.SpVoice;$stream=New-Object -ComObject SAPI.SpFileStream
  $stream.Open($sample,3,$false);$voice.AudioOutputStream=$stream;$voice.Rate=-1
  $available=$voice.GetVoices();$english=$null;$spanish=$null
  for($v=0;$v -lt $available.Count;$v++){ $candidate=$available.Item($v);$languages=([string]$candidate.GetAttribute('Language')).Split(';');foreach($language in $languages){try{$primary=[Convert]::ToInt32($language,16) -band 0x3ff;if($primary -eq 9 -and -not $english){$english=$candidate};if($primary -eq 10 -and -not $spanish){$spanish=$candidate}}catch{}} }
  if(-not $english){throw 'Voz inglesa no disponible; usa un archivo local autorizado.'}
  $voice.Voice=$english
  $voice.Speak('Good morning. Please confirm your appointment for Tuesday at ten thirty. The address is one hundred twenty four Oak Street. Please repeat the phone number slowly.')|Out-Null
  if($spanish){$voice.Voice=$spanish;$voice.Speak('Buenos dias. Necesito confirmar mi cita del martes. Mi direccion es ciento veinticuatro, calle Roble. Puede repetir el numero de telefono, por favor.')|Out-Null}
  $stream.Close();$sampleState='GENERADA_LOCALMENTE'
 }catch{Write-Warning 'No se pudo generar voz local. En el laboratorio puedes elegir un archivo autorizado.';if($stream){try{$stream.Close()}catch{}};if(Test-Path -LiteralPath $sample){Remove-Item -LiteralPath $sample -Force};$sampleState='ARCHIVO_LOCAL_REQUERIDO'}
}
$phase='RESULT';Step '4' 'Guardar resultado y siguiente paso'
$result=[ordered]@{Ready=$true;State='prepared-not-caption-validated';NextAction='Load this root in Chrome; open Probar and verify native text';Version=$manifest.version;Root=$root;Identity=$id;Hashes='PASS';NativeProtocol=$probe.Protocol;Sample=$sampleState;ChromeLoaded='NO_VERIFICADO';RealCall='NO_VERIFICADA';ChromeRestarted=$false}
[IO.File]::WriteAllText((Join-Path $root 'INSTALACION-RESULTADO.json'),($result|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
Write-Output "INSTALACION_PREPARADA=VERIFICADA | $root"
Write-Host 'PAQUETE Y PUENTE PREPARADOS. Subtitulos en vivo: SIN COMPROBAR.' -ForegroundColor Green
Write-Output 'Carga esta MISMA carpeta desde Chrome como extension descomprimida. Luego usa Probar sin llamadas en el popup o PROBAR.cmd. Preparacion no equivale a captions en vivo.'

if($Interactive){
 Write-Host ''
 Write-Host 'Siguiente: Chrome > Extensiones > Modo desarrollador > Cargar descomprimida.'
 Write-Host ('Carpeta exacta: '+$root)
 Write-Host 'Despues: Live Caption encendido > Probar en el popup. No tomes llamadas para esta prueba.'
 do {
  $choice=(Read-Host '[C] Copiar carpeta  [P] Abrir prueba ya cargada  [Enter] Salir').ToUpperInvariant()
  if($choice -eq 'C'){try{Set-Clipboard -Value $root;Write-Host 'Carpeta copiada. Selecciona esta misma raiz en Chrome.'}catch{Write-Host ('No se pudo copiar; carpeta: '+$root)}}
  if($choice -eq 'P'){try{& (Join-Path $root 'PROBAR.ps1')}catch{Write-Host 'Aun no se identifico esta carpeta cargada. Cargala en Chrome y pulsa Probar en el popup.' -ForegroundColor Yellow}}
 }while($choice -eq 'C' -or $choice -eq 'P')
}
}catch{
 $detail=[string]$_.Exception.Message
 $next=switch($phase){
  'PACKAGE' {'Extrae de nuevo el ZIP verificado. No copies archivos sueltos sobre la instalacion anterior.'}
  'HOST_BUSY' {'Finaliza la llamada o prueba antes de instalar. Ningun proceso fue cerrado.'}
  'USER_IDENTITY' {'Abre el instalador con el mismo usuario Windows de Chrome, sin elevacion.'}
  'NATIVE_PROTOCOL' {if($rollbackState -eq 'RESTORED'){'La preparacion no se confirmo; se restauro el registro anterior. Comparte el codigo de fallo.'}else{'No se confirmo la preparacion ni la restauracion del registro. Comparte el resultado antes de reinstalar.'}}
  default {'La preparacion no se confirmo. Usa una carpeta estable y escribible y revisa el detalle.'}
 }
 $failed=[ordered]@{Version='0.10.36';Ready=$false;State='preparation-failed';Code=$phase;Rollback=$rollbackState;Detail=$detail;NextAction=$next;Hashes=$hashState;NativeProtocol=$protocolState;ChromeLoaded='NO_VERIFICADO';RealCall='NO_VERIFICADA';ChromeRestarted=$false}
 try{[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'INSTALACION-RESULTADO.json'),($failed|ConvertTo-Json),[Text.UTF8Encoding]::new($false))}catch{}
 Write-Host ('NO PREPARADO ['+$phase+']') -ForegroundColor Red
 Write-Host $detail
 Write-Host $next -ForegroundColor Yellow
 if($Interactive){Read-Host 'Enter para cerrar'|Out-Null}
 exit 1
}
