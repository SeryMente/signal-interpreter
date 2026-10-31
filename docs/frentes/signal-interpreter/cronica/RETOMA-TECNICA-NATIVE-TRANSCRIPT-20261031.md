# Checkpoint técnico Signal Interpreter — captions nativos — 2026-10-31

## Alcance ejecutado

Se conectó el texto emitido por el host nativo de Live Caption con el historial local de la consola de lectura. No se reactivó captura del micrófono ni Groq.

- El ensamblador `extension/transcript-assembler.js` conserva el ID del segmento mientras actualiza parciales progresivos, descarta duplicados rápidos, ignora parciales regresivos y preserva repeticiones posteriores.
- `extension/background.js` acepta el caption solo si la llamada sigue activa y coinciden callId, tabId y contexto del bridge. La sesión se distingue por origen, pestaña y callId.
- Los segmentos se persisten mediante el almacenamiento local de sesiones y la store IndexedDB existente; se emiten a la consola por el evento `signal.transcript.segment`. Al cerrar la llamada se finaliza el último parcial.
- `extension/ui/live.js` actualiza por ID en vez de duplicar cada parcial y conserva la posición de lectura cuando el autoscroll está desactivado.
- La atribución se conserva como `HABLANTE NO IDENTIFICADO`, role `unverified`. El idioma es nativo si se entrega o heurístico si debe inferirse; el timestamp es local porque el host no ofrece uno fiable por caption.

## Evidencia de ejecución

- Commit de código que pasó los tres workflows: `e726e713710049576b2af9b04fb5ae1d83aa20e7`.
- Commit final de la rama al registrar este checkpoint: `95dea5d1ca3fb1f3a18f8bd4bf144d0284fa3a35`.
- Auditoría de observabilidad: run `41220863617`, SUCCESS. Incluye `OBSERVABILITY_STATIC_AUDIT=PASS`, `NATIVE_TRANSCRIPT_ASSEMBLER_TEST=PASS` y `PASS: 60 payload hashes`.
- Regresión longitudinal: run `41220863626`, SUCCESS. Incluye `verify-release-package.mjs`, `NATIVE_TRANSCRIPT_ASSEMBLER_TEST=PASS` y `LIVE_CAPTION_OFFSCREEN_NATIVE_ONLY_TEST=PASS`.
- Build/protocolo del host nativo: run `41220863571`, SUCCESS. `NATIVE_CAPTION_HOST_COMPILE=PASS` y `NATIVE_CAPTION_HOST_PROTOCOL=PASS`.
- Los ocho artefactos de código/workflow más el auditor y el inventario del paquete se leyeron de vuelta por SHA; ver el commit de rama `95dea5d`.

## Límites

SI-FB-02 sigue bloqueada: no hay captura ASR del micrófono propio, credencial Groq ni endpoint privado autenticado. SI-FB-03 solo avanza parcialmente: falta diarización real, entidades críticas y validación de calidad. La prueba E2E en Windows/Chrome/llamada y aceptación humana no se han ejecutado.

PR #69 permanece CLOSED / NOT MERGED. No se abrió otro PR, no se modificó `main`, no se publicó release y no se instaló la candidata. La rama debe conciliarse con `main` antes de integrar.

El original `ChatGPT-SI-20261031-0916.txt` sigue NO DISPONIBLE en el OCP público por el bloqueo de privacidad: no se ha publicado el contenido ni se ha creado un sustituto documental.
