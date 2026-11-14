# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-14T20:14:44.854Z → 2026-11-14T20:24:44.854Z
- Generado: 2026-11-14T20:24:44.854Z
- Eventos: 367 · lotes fuente: 36
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 367

## Resumen
- Intentos observados: 2
- Contestadas: 0 · perdidas confirmadas: 2
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 2 / 2
- Bloqueos de autocontestación: 2 · clics: 0

## Intentos

### eefe6946-6ba9-4120-8eb1-eb46577381ee — missed
- Detectada: 2026-11-14T20:16:08.770Z · modalidad: OPI
- Tab: 220929880 · eventos: 11
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":["IDLE_CONFIRM_AGAIN"],"ready":false,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":false,"presenceReason":"idle-confirm-again","presenceGeneration":16,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-14T20:16:08.770Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-14T20:16:08.771Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-14T20:16:08.772Z · AUTO_ANSWER_BLOCKED · warn
  - 2026-11-14T20:16:09.081Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-14T20:16:09.081Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-14T20:16:09.409Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-14T20:16:09.981Z · INCOMING_RING_SIGNAL · info
  - 2026-11-14T20:16:13.674Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-14T20:16:14.273Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-14T20:16:16.391Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-14T20:16:18.679Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

### [PHONE]c6-4923-bd3e-26aeb4a17e8c — missed
- Detectada: 2026-11-14T20:16:32.813Z · modalidad: OPI
- Tab: 220929880 · eventos: 13
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":["IDLE_CONFIRM_AGAIN"],"ready":false,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":false,"presenceReason":"idle-confirm-again","presenceGeneration":16,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-14T20:16:32.813Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-14T20:16:32.813Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-14T20:16:32.813Z · AUTO_ANSWER_BLOCKED · warn
  - 2026-11-14T20:16:33.032Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-14T20:16:33.135Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-14T20:16:33.456Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-14T20:16:33.608Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-14T20:16:33.608Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-14T20:16:34.283Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-14T20:16:34.311Z · PAGE_LIFECYCLE · info
  - 2026-11-14T20:16:38.048Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-14T20:16:44.768Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-14T20:16:47.850Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
