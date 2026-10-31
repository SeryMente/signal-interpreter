# Crónica · agente único, persistencia provisional y retoma PC-14 · G6 · 2026-10-30

## Objetivo y autoridad

El operador instruyó que Signal Interpreter quede bajo una sola instancia responsable, sin reparto activo entre dos identidades ni prompts separados. También pidió verificar el medio provisional de persistencia de observabilidad en repositorio y proporcionó una nueva sesión RDC de PC-14, declarando perdido el trabajo local anterior y entorno fresco.

La instrucción se aplicó únicamente a Signal Interpreter. No se modificó el régimen de otros frentes. La aceptación real, la intervención de llamadas reales y la liberación siguen sujetas a evidencia y aprobación humana.

## Cambio metodológico

Se añadió M34 en §24 del DUG canónico de `SeryMente/metodologia`. DUG actualizado a **v372 · NX-372m**; Metacanon 1.26; GOW 2.14. Commit `77fa4ecbbfcef3db3887545aa9eb581265d2772d`; blob `28d0f255cdb3371a60310b0da45ca049dea05fdb`.

M34 fija una sola instancia responsable de todo Signal Interpreter y registra una excepción RDC temporal para la nueva sesión PC-14, solo CLI/headless, verificación de identidad/perfil, staging de la versión canónica y ejecución del instalador oficial condicionada a las compuertas del perfil Windows. La excepción caduca con el read-back de staging e informe del instalador. No autoriza GUI, Chrome visible, llamadas reales, otros equipos ni sesiones futuras.

Se actualizó `INICIO.md` a DUG v372 / NX-372m; commit `f225fc521b4c7ba77db7570dd3c3a035438ea9b9`; blob `dead96c5df3ed3224aa041f6cd9125cb43be68d2`.

## Titularidad de Signal Interpreter

Se mantuvo la generación 6 y su folio existente `SES-20261030-A8F4C291`; no se creó generación ni folio nuevo. El control se actualizó a `rol=agente_unico`, manteniendo G6 ACTIVA, UUIDv7 local `01a18f6d-79cd-7b7f-8138-083ae11becb4) y el historial previo. Evento de actualización: `SIGNAL-INTERPRETER-M34-AGENTE-UNICO-20261030-G6`.

Control: commit `95179923e0841cd86ade2d9d4ab072578aa85eec`; blob `54f216d0d3fd7f0c05906a42be47f7753edace43`. Read-back comprobó generación, titularidad, permiso acotado y evento.

Se creó un único prompt activo `PROMPT-SIGNAL-INTERPRETER.md`, commit `bcb9c67868c12485363378b6b8456dd81b6c3d43`, blob `14e143c93baf293c738fa535e923bca76e16b358`. README actualizado al prompt único, commit `23afb4a92149dc99c3304c4ac357551845e7c447`, blob `ed4195dc5b981f8ff8f5ac6d20c8f313c8f646f6`. Los prompts previos `PROMPT-CLAUDIA.md` y `PROMPT-SAMANTHA.md` se eliminaron del árbol activo; sus versiones previas permanecen en el historial Git como registro histórico, no como instrucciones activas.

## Persistencia provisional de observabilidad

Se confirmó que el medio provisional repo-backed está implementado y ha recibido/procesado batches reales. Flujo documentado:

`Chrome/extension → IndexedDB → Vercel relay (/api/batch) → GitHub observations/inbox → GitHub Actions → observations/batches, reportes, snapshots, deltas, índices y health`.

La función relay de GitHub `tools/observability-relay/api/batch.js` usa `GITHUB_TOKEN` desde el entorno de servidor de Vercel y escribe el batch en `observations/inbox`. El secreto no se incluye en la extensión ni en el repositorio. El workflow de GitHub procesa el inbox y lo drena; por eso que `observations/inbox` no exista o esté vacío después del procesamiento no significa pérdida.

Corte de evidencia leído desde `main`:

- `observations/manifest.json`: 10,384 archivos batch; 19 informes de llamada (16 completos, 3 parciales); 1,878 snapshots; 1,858 deltas; 14 identidades de superficie.
- `observations/health/github-build.json`: `status=ok`, `inboxRemaining=0`, un batch procesado automáticamente, mismo último batch en la publicación automática.
- Último batch registrado: 3 eventos, versión runtime **0.10.37**, creado `2026-10-31T00:41:50.519Z`. El objeto no contiene `relayReceivedAt` en su nivel superior.
- Último informe de llamada observado: `status=complete`, runtime anterior; no acredita una llamada o extensión 0.10.39.
- El código actual del pipeline incluye generación de `observations/latest/incoming-calls-10m.json` y `.md`, corrección de marcas temporales vía `relayReceivedAt` y auditoría de frescura. Los dos archivos de informe de diez minutos no aparecieron en la lectura efectuada.

Conclusión: **GitHub es un medio provisional real y durable para la observabilidad histórica**, con procesamiento automático demostrado. No se declara cerrada la verificación E2E de la versión 0.10.39: el runtime más reciente almacenado aún es 0.10.37, falta comprobar `relayReceivedAt`, el informe incoming de diez minutos y la frescura real de la nueva versión. La fecha `manifest.generatedAt` (00:40:36.645Z) precede a `lastInputCreatedAt` (00:41:50.519Z); queda anotada como inconsistencia temporal para analizar, sin inferir pérdida.

El API de administración/logs de Vercel devolvió 403 en esta conexión. No se leyó ni descifró `GITHUB_TOKEN`, no se alteraron variables ni despliegues. La entrega automática del batch a GitHub demuestra operación efectiva del relay en algún momento de este corte, pero no sustituye la inspección de logs/configuración del deployment vigente.

## Sesión remota PC-14 y compuerta de perfil

El inventario RDC confirmó un dispositivo PC-14 Online coincidente con la sesión reportada. Se ejecutó únicamente un preflight CLI de lectura. La asociación Windows observada en el entorno actual no coincide con el perfil previamente autorizado por P036; el SID/perfil esperado por esa regla no está presente en el equipo.

Por consecuencia, no se escribió en Desktop, temporales ni staging; no se descargó/extrajo el repositorio; no se ejecutó `INSTALAR.ps1`; no se modificó Chrome; no se realizó GUI ni llamada real. La autorización M34 sigue acotada, pero las escrituras dependientes del Escritorio quedan detenidas hasta conciliar/autorizarlas con la identidad Windows actual. No guardar en el repo público correo, identificador RDC, códigos de emparejamiento, SID, usuario Windows ni rutas privadas.

## Estado de producto y CI

Signal Interpreter 0.10.39 permanece integrado en main por PR #68. Auditoría de observabilidad y host nativo post-merge terminaron 2/2 SUCCESS en `8955c1cae996d150052483cdf0d5da37c4da41eb` (runs 41152132125 y 41152132134). No se creó release. No hay aceptación real Windows/Chrome/Cloud Interpreter ni confirmación de llamada contestada.

## Cierre de ciclo

Hecho: M34 publicado y leído de vuelta; DUG/INICIO actualizados; control G6 en modo único; prompt único creado y enlazado; prompts paralelos retirados del árbol activo; medio provisional repo-backed confirmado con métricas históricas; PC-14 verificado Online y preflight ejecutado.

No hecho: staging de escritorio, instalación Native Messaging, carga Chrome, emisión de telemetría 0.10.39, informe incoming de diez minutos, aceptación funcional y release.

Siguiente dependencia única para continuar staging: autorización/conciliación del nuevo perfil Windows descubierto en PC-14 conforme a P036.

## Adenda de cierre · confirmación M35 e instalación verificada · 2026-10-31

La declaración anterior de bloqueo correspondía al instante previo a la confirmación del operador. Posteriormente el operador autorizó expresamente la asociación de Windows observada en el preflight para **este PC-14 y esta instalación solamente**. La autorización quedó registrada en M35 de §24 del DUG; P036 general no cambió. La excepción se consumió y cerró tras la lectura de vuelta del instalador.

DUG actualizado a **v373 · NX-373m**, Metacanon 1.26, GOW 2.14. Commit `c79ddf6f862f97cafa61955eb15a17ffaea463d0`; blob `cac4525de77d4f47a8a59c25201968ecf2056b90`. `INICIO.md` actualizado a v373/NX-373m, commit `1dd4c4e35d5097d28485b86c0f37ec0faf096cb9`, blob `9b169fe76a229279134119d2fa7299e12ddf349c`.

### Staging del repositorio

Se descargó el ZIP público del repositorio desde commit exacto `f4ee70caa2f22b3fbc52493ef17d2f21837ab103`; SHA-256 del ZIP `C587E9F13661148FEDAE547B02B3FD05785952DEFE03D76FAEE98108D89E7782`. Destino relativo: `Desktop/Signal Interpreter/signal-interpreter`. El manifiesto releído indica Signal Interpreter 0.10.39; se verificaron los 59 archivos del inventario `payload-sha256.json` antes de mover la carpeta a su destino. El repositorio queda staged, con `manifest.json` en la raíz y por tanto seleccionable mediante “Cargar descomprimida”.

### Instalación oficial del puente Native Messaging

Se ejecutó `INSTALAR.ps1` directamente desde la raíz, en la identidad Windows autorizada por el operador, sin GUI/Chrome visible ni manipulación de ventanas. Proceso finalizó con exit code **0** y salida:
- `BRIDGE_PREPARADO=VERIFICADO`
- `HASHES=PASS`
- `NATIVE_MESSAGING_PROTOCOL=PASS`
- `CHROME_RESTARTED=NO`

Read-back de `INSTALACION-RESULTADO.json` confirmó:
- Version `0.10.39`; raíz del paquete correcta.
- Hashes `PASS`; NativeProtocol `PASS`; NativeHostRegistry `PASS`.
- Muestra integrada `BUNDLED_VERIFIED`, SHA-256 `DB8CAE8CE1599ABA06CB3D8AB7E456CB01B396FAA8E1ACA26880D1ACC3B7332C`, duración 281.6s.
- Registro HKCU apunta al manifiesto `com.signalinterpreter.captionhost.json` del host instalado.
- SHA-256 esperado y real del ejecutable Native Messaging coinciden: `313CCD3312A8C75131EC7C4ADFEBF883B028BCE8AEE8B1EA43BD4DDDBB202EFE`.
- `ChromeLoaded=NO_VERIFICADO`, `RealCall=NO_VERIFICADA`; Chrome no fue reiniciado.

No se guardaron en el repositorio público nombre de usuario Windows, SID, correo, device ID, código de emparejamiento ni rutas privadas.

### Cierre de permisos y control

Control G6 permanece ACTIVO como `agente_unico`; folio/UUID local se conservaron. El control final quedó releído: commit `c0ef30cde03d442475df9b6fc0d9e24b60de242c`, blob `b5fe40082ab8234865c56a1ba859d657dff037d7`. La titularidad vigente y el registro del titular nuevo están ambos en `agente_unico`; las titularidades previas aparecen como historia, sin distribución activa. M34/M35 están `CERRADAS_VERIFICADAS`; no queda permiso RDC para futuras tareas o sesiones.

El núcleo operativo quedó actualizado a revisión `SI-OBJ-v1.12-agente-unico-pc14-01`, commit `b9404785960066467a13a4f456350229f1c50ddf`, blob `92f04bbb52ccf2a98a98a42c8e6e6cebcfef98f2`. El prompt único actualizado quedó en blob `4bede3b3950f4f45d15fbcb44a129521af43704b`. Los dos prompts paralelos siguen retirados del árbol activo.

### Resultado y pendientes

**Ejecutado y verificado:** staging 0.10.39, 59 hashes, instalador, puente Native Messaging, registro HKCU, SHA de ejecutable y recibo.

**No ejecutado:** carga manual en `chrome://extensions`, recarga/uso Chrome, prueba de captions real, llamada OPI controlada, telemetría E2E 0.10.39 y aceptación funcional/release. No se afirma ninguno de esos resultados.

La persistencia provisional repo-backed permanece confirmada para el historial anterior. Su cierre E2E de 0.10.39 requiere que Chrome cargue/ejecute esta extensión y llegue un nuevo batch con runtime 0.10.39 y `relayReceivedAt`, seguido del informe `incoming-calls-10m.json/md` y health fresco. La última lectura previa seguía mostrando runtime 0.10.37; ese hecho no se reemplaza por la instalación local.
