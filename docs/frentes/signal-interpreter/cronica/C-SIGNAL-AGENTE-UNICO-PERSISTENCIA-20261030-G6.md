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