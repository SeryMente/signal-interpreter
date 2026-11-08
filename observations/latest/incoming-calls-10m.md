# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-08T20:06:03.534Z → 2026-11-08T20:16:03.534Z
- Generado: 2026-11-08T20:16:03.534Z
- Eventos: 60 · lotes fuente: 19
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 60

## Resumen
- Intentos observados: 1
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 1 / 1
- Bloqueos de autocontestación: 1 · clics: 0

## Intentos

### 1b30ca67-04ce-4646-9b2c-9db35bc4228b — missed
- Detectada: 2026-11-08T20:06:11.194Z · modalidad: OPI
- Tab: 1680554836 · eventos: 17
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":["IDLE_OR_LOCKED_CONFIRM_AGAIN"],"ready":false,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":false,"presenceReason":"idle-or-locked-confirm-again","presenceGeneration":14,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-08T20:06:11.194Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-08T20:06:11.195Z · AUTO_ANSWER_BLOCKED · warn
  - 2026-11-08T20:06:11.195Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-08T20:06:11.781Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-08T20:06:11.783Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-08T20:06:11.784Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-08T20:06:11.818Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T20:06:11.955Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-08T20:06:12.165Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-08T20:06:12.247Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T20:06:12.363Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-08T20:06:12.401Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T20:06:12.402Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-08T20:06:15.967Z · INCOMING_RING_SIGNAL · info
  - 2026-11-08T20:06:17.387Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-08T20:06:23.988Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-08T20:06:27.946Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
