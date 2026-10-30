# Crónica de preparación de escritorio e instalación del puente · 2026-10-30 · generación 5

## Identidad y alcance

- Frente: Signal Interpreter.
- Titularidad previa y vigente: generación 5 ACTIVA, rol constructor; folio de sesión existente `SES-20261030-3B3868DF`. No se creó un nuevo ID nativo de conversación ni se modificó el control de responsabilidad.
- Evento de esta crónica: `C-SIGNAL-RDC-INSTALADOR-20261030-G5`.
- Encargo literal del operador: «Olvídate del binomio constructor asistente, simplemente deja todo listo en escritorio y tú mismo corre la instalación del puente.»
- Autorización literal posterior: «Si, autorizo, te loa cabo de decir, ya hazlo».
- El operador proporcionó el endpoint `https://mcp.desktopcommander.app/mcp`, nombre de dispositivo `PC-14` e ID `0ec103d6-0e8a-4d3f-986b-4114a52f7740`; indicó que no adjuntaba access_token ni refresh_token. No se solicitaron ni copiaron credenciales.

## Gobierno adquirido y excepción temporal

- Fuente metodológica: `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`.
- Estado final leído de vuelta: DUG `v364 · NX-364m`, Metacanon `1.26`, GOW `2.12`; blob final `e934de6d848042837032691674563a2a6e3a3382`; commit de la última reconciliación de §6/§24 `e90dd110720d4a43bcf7fe883d4ad1057ec74eca`.
- M33 incorpora una excepción temporal y de alcance único en §24, y §6 remite explícitamente a las excepciones válidas de §24. Esto elimina la contradicción que habría resultado de mantener la prohibición absoluta en §6 y §24 junto a la excepción M33.
- La excepción autoriza a este rol constructor en esta instancia a usar RDC solamente para preparar Signal Interpreter `0.10.38` en PC-14 e instalar el puente oficial incluido en ese paquete. Caduca al cerrar esta preparación y verificar el recibo.
- La regla de GUI compartida permanece intacta: no mouse, teclado sobre aplicaciones, navegación visible, ventanas, capturas ni lectura de pantalla. No se abrió Chrome ni Explorer. La carga de la extensión en Chrome queda para el operador.

## Conexión y preflight en PC-14

- RDC listó PC-14 como Online con el ID exacto `0ec103d6-0e8a-4d3f-986b-4114a52f7740`; los registros PC-8 consultados aparecieron Offline.
- `get_config` confirmó Windows 64-bit, PowerShell como shell, Desktop Commander 0.3.1 y Node.js 24.22.2. La identidad técnica del dispositivo coincidió con el ID entregado por el operador.
- El preflight obtuvo la ruta del Escritorio desde Windows y confirmó que la carpeta de proyecto aún no existía. Chrome estaba abierto en la misma cuenta Windows que el proceso remoto; el proceso `SignalInterpreter.CaptionHost` no estaba activo.
- Git no estaba disponible en PATH ni en las ubicaciones estándar consultadas. No se instaló Git ni se alteró el PATH.

## Preparación de la fuente

- Repositorio público: `SeryMente/signal-interpreter`, rama `main`.
- La revisión de `main` se fijó y volvió a comprobar antes de descargar: commit `f2c9da2e59be993341f313ac77d546ff8ba9c639`.
- Se descargó el archivo ZIP oficial de GitHub para ese commit y se materializó en `Escritorio/Signal Interpreter/signal-interpreter`.
- Resultado de staging: `SOURCE_SNAPSHOT_VERIFIED`; archivo ZIP de 1,224,170 bytes.
- Manifiesto: versión `0.10.38`, Git blob SHA `e4ffa2056971f19ce8275fc30a8cb97cf00f7415`; coincide con el objeto publicado.
- Instalador `INSTALAR.ps1`: Git blob SHA `29a18f9e22764b239391712d667ccacf6860da25`; coincide con el objeto publicado.
- La carpeta raíz se inspeccionó y contiene `manifest.json`, `INSTALAR.ps1`, `PREPARAR-Y-CARGAR.cmd`, `extension/`, `bridge/`, `docs/` y `tools/`.
- **Limitación de materialización:** es una instantánea oficial e inmutable de `main` fijada al commit indicado, no un clon Git, porque Git no está instalado. No se creó metadata `.git`.

## Instalación del puente Native Messaging

- Se ejecutó directamente el instalador `INSTALAR.ps1` con PowerShell `-NoProfile -ExecutionPolicy Bypass`. No se ejecutó `PREPARAR-Y-CARGAR.cmd`, porque este abre Chrome y el Explorador, acciones gráficas fuera del alcance autorizado.
- El proceso terminó con código de salida `0` (runtime informado: 13.83 s).
- Salida literal de cierre:
  - `BRIDGE_PREPARADO=VERIFICADO | ...\SignalInterpreter\NativeMessagingHost`
  - `HASHES=PASS | NATIVE_MESSAGING_PROTOCOL=PASS | CHROME_RESTARTED=NO`
  - `INSTALLER_EXIT_CODE=0`
- El recibo `INSTALACION-RESULTADO.json` fue leído desde el Escritorio:
  - `Version=0.10.38`
  - `Hashes=PASS`
  - `NativeProtocol=PASS`
  - `NativeHostRegistry=PASS`
  - `Sample=BUNDLED_VERIFIED`
  - `SampleSha256=DB8CAE8CE1599ABA06CB3D8AB7E456CB01B396FAA8E1ACA26880D1ACC3B7332C`
  - `ChromeLoaded=NO_VERIFICADO`
  - `RealCall=NO_VERIFICADA`
  - `ChromeRestarted=false`
- Verificación adicional por lectura de vuelta:
  - El ejecutable nativo instalado existe; SHA-256 `313CCD3312A8C75131EC7C4ADFEBF883B028BCE8AEE8B1EA43BD4DDDBB202EFE`.
  - El manifiesto Native Messaging instalado existe y su propiedad `path` coincide con el ejecutable.
  - `allowed_origins` incluye `chrome-extension://ldpbjhobnfgmhdoehehdmnbhhjckebmj/`.
  - El valor por defecto de la clave de registro HKCU `Google\NativeMessagingHosts\com.signalinterpreter.captionhost` coincide con la ruta del manifiesto instalado.
  - El manifiesto de extensión identifica `ldpbjhobnfgmhdoehehdmnbhhjckebmj`, versión `0.10.38`.
- Resultado técnico acotado: **puente instalado y verificado** mediante recibo del instalador y comprobación independiente de ejecutable, manifiesto, origen permitido y registro. No equivale a extensión cargada ni a prueba de transcripción real.

## Límites que permanecen

- No se abrió ni manipuló la GUI de Chrome o del Explorador; Chrome no fue reiniciado.
- `ChromeLoaded=NO_VERIFICADO`: el operador aún debe cargar manualmente la carpeta `Escritorio/Signal Interpreter/signal-interpreter` desde `chrome://extensions` mediante «Cargar descomprimida».
- `RealCall=NO_VERIFICADA`: no se ha probado Live Caption real, segmentos inglés/español, pérdidas/duplicados, presencia/idle, bloqueo/desbloqueo, suspensión, múltiples pestañas, reinicio, upgrade ni rollback.
- No se creó release ni se declaró aceptación del operador.
- No se accedió a texto ni audio de llamadas y no se activó micrófono, audio de pestaña, Groq ni replay.
- Una primera tentativa de staging no produjo paquete verificado; la ruta temporal devuelta por el perfil no existía. Se inspeccionó el directorio destino, se confirmó que estaba vacío y se repitió la preparación usando un directorio temporal dentro del Escritorio. Solo la segunda ejecución produjo `SOURCE_SNAPSHOT_VERIFIED`; no se ejecutó el instalador hasta esa verificación.
- Una primera preflight PowerShell tuvo un error de variable reservada (`$Host`) y una búsqueda secundaria de Git tuvo un error de sintaxis en la variable `ProgramFiles(x86)`; ambas operaciones fueron de lectura, corregidas y no alteraron el sistema.

## Estado final

- Preparación de fuente en Escritorio: **EJECUTADA Y VERIFICADA** como instantánea de commit (no clon Git).
- Instalación del puente: **EJECUTADA Y VERIFICADA**.
- Carga de extensión Chrome: **PENDIENTE DEL OPERADOR**.
- Prueba real Windows/Chrome/Live Caption y aceptación: **PENDIENTES**.
- La excepción M33 de RDC se agota con esta operación. La prohibición general permanece para cualquier otro alcance, dispositivo, tarea o sesión.
