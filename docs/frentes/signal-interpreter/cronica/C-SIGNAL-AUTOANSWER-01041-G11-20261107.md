# Crónica · Auto-Answer 0.10.41 · G11 · 2026-11-07

## Fuente y continuidad

Se leyó íntegramente por RDC el export `ChatGPT-SI-20261107-1310.txt`, desde el perfil operativo `C:\Users\fila4\Downloads`. El canal RDC estaba elevado como `CENTRAL\MantenimientoRCI`; el archivo pertenece al perfil de usuario `fila4`. El original no fue modificado ni trasladado al repositorio público. Su procedencia, tamaño y SHA-256 quedaron documentados en [el recibo saneado](../evidencias/RECIBO-EXPORT-CHATGPT-SI-20261107-1310.json).

## Diagnóstico operativo recuperado

La versión local activa tras la actualización anterior era 0.10.40. La telemetría que el export registra para los missed calls incluye `AUTO_ANSWER_AUTHORIZATION_BLOCKED`, `sender-not-authorized`, `presence-disarmed`, `PROFILE_NOT_AUTHORIZED` y `AVAILABILITY_UNKNOWN`.

La inspección del código identificó dos causas directas:
1. `presence-guard.js` llamaba a `disarm("worker-start-confirm-again")` cada vez que iniciaba el service worker. Manifest V3 puede suspender y volver a iniciar el worker durante la misma sesión de Chrome; la autorización explícita se perdía en esa transición.
2. La comprobación del perfil comparaba literalmente las URL del frame y de la pestaña con una cadena fija. Una barra final, query o fragmento de la misma ruta canónica bastaba para bloquear la autorización.

## Corrección implementada en 0.10.41

- Persistencia de la confirmación explícita exclusivamente en `chrome.storage.session`, no en preferencias persistentes.
- Restauración después de un reinicio del worker únicamente si coinciden la versión del estado, el ID de extensión, el umbral de inactividad permitido, Auto-Answer habilitado, ausencia de lock de laboratorio y `chrome.idle.queryState` igual a `active`.
- Revalidación de inactividad y configuración en cada autorización de llamada.
- Pausa manual, fin de sesión, bloqueo/inactividad, lock de laboratorio y desactivación de Auto-Answer eliminan la autorización de sesión.
- La recarga/actualización/deshabilitación de la extensión y el reinicio de Chrome exigen una nueva confirmación explícita; no se rearma automáticamente después de esos eventos.
- Normalización acotada de la ruta exacta del perfil: permite la barra final, query y fragmento; no admite subpaths, orígenes alternativos, credenciales URL ni subframes.
- Se conservaron OPI como único caso elegible y los bloqueos de VRI/modalidad desconocida. No se añadió ningún clic fuera de los guards.

## Validación

- `presence-guard`: 60/60 PASS.
- `presence-connect`: 33/33 PASS.
- `autoanswer-runtime-guard`: 15/15 PASS.
- Verificador del paquete: 59/59 hashes; identidad de extensión y hash del host nativo embebido PASS.
- Pruebas adicionales PASS: forma del inventario del instalador, overlay global, activación del overlay, layout portable, login bootstrap, earnings overlay, auditoría estática Live Caption, feedback de micrófono y consistencia del atajo global.
- Sintaxis JavaScript: 25/25 PASS. `git diff --check`: PASS.
- `observability-static-audit.mjs` no pudo ejecutarse en este worktree porque no contiene el archivo histórico `.github/workflows/observability-build.yml`; no se atribuye ese bloqueo a la corrección Auto-Answer.
- CI de PR #72 en el head `b48f65018a643605b5d795538688bdae59d05a7b`: `audit` y `package-integrity` SUCCESS; `compile-and-protocol-smoke-test` IN_PROGRESS al último corte consultado.

## Instalación local y custodia

Rama: `work/g11-presence-continuity`. Commit: `b48f65018a643605b5d795538688bdae59d05a7b`. PR: [#72](https://github.com/SeryMente/signal-interpreter/pull/72), abierta contra `main`; aún no fusionada.

La carpeta exacta registrada por Chrome, `C:\Users\fila4\Desktop\SeryMente\Signal Interpreter\extension`, recibió solo dos escrituras:
- `manifest.json` anidado: versión 0.10.40 → 0.10.41, manteniendo la misma clave/ID de extensión. SHA-256: `8D2CC6DB597A2429F25DC0192E2AF17F4457DE9E235135957FDBABC44B2B9773`.
- `presence-guard.js`: sustituido por el artefacto del commit candidato. SHA-256: `EE311D3A01ED62AB32C8FB7D50283C626F4119643F9F88367A58BCD9C4969912`, igual al origen candidato.

Respaldo previo: `Desktop/SI-backups/SI-0.10.40-before-0.10.41-20261107/extension`; 50/50 archivos cotejados por SHA-256. Recibo: `BACKUP-VERIFICATION.json`. El host Native Messaging no fue modificado. Chrome no fue recargado ni reiniciado.

## Estado de aceptación y siguiente acción

**0.10.41 está preparada en la ruta cargada por Chrome y lista para recarga manual/prueba del operador.** Después de recargar, el operador debe volver a confirmar disponibilidad/Auto-Answer porque Chrome limpia `storage.session` al recargar la extensión. La siguiente prueba debe medir la secuencia real de llamada elegible: detección → OPI verificada → autorización → Connect habilitado → clic → conexión confirmada. VRI, modalidad desconocida, perfil no autorizado, inactividad y laboratorio deben continuar bloqueados.

No se generó ni manipuló ninguna llamada real durante este ciclo. La aceptación funcional, E2E de observabilidad 0.10.41, fusión de PR #72 y release siguen pendientes.
