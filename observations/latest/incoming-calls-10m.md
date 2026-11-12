# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-12T19:06:44.641Z → 2026-11-12T19:16:44.641Z
- Generado: 2026-11-12T19:16:44.641Z
- Eventos: 348 · lotes fuente: 35
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 348

## Resumen
- Intentos observados: 1
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 1 / 1
- Bloqueos de autocontestación: 1 · clics: 0

## Intentos

### 970c262d-0d06-417f-8b68-39029d4b5989 — missed
- Detectada: 2026-11-12T19:09:53.209Z · modalidad: VRI
- Tab: 220927959 · eventos: 16
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-12T19:09:53.209Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-12T19:09:53.210Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-12T19:09:53.210Z · AUTO_ANSWER_BLOCKED · warn
  - 2026-11-12T19:09:53.210Z · AUTO_ANSWER_SKIPPED_UNVERIFIED_MODALITY · warn · only-verified-OPI
  - 2026-11-12T19:09:53.491Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:09:53.530Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-12T19:09:53.790Z · AUTO_ANSWER_BOOTSTRAP_INJECTION_ERROR · warn
  - 2026-11-12T19:09:54.028Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-12T19:09:54.439Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:09:54.591Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:09:54.591Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-12T19:09:55.368Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-12T19:09:56.198Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-12T19:09:56.215Z · PAGE_LIFECYCLE · info
  - 2026-11-12T19:09:57.087Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-12T19:09:59.033Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
