# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-08T19:49:36.692Z → 2026-11-08T19:59:36.692Z
- Generado: 2026-11-08T19:59:36.692Z
- Eventos: 176 · lotes fuente: 23
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 176

## Resumen
- Intentos observados: 1
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 1 / 1
- Bloqueos de autocontestación: 1 · clics: 0

## Intentos

### f1d3029d-af0f-414d-9bd6-c85888aec69f — missed
- Detectada: 2026-11-08T19:52:05.247Z · modalidad: OPI
- Tab: 1680554836 · eventos: 17
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":13,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-08T19:51:55.719Z · INCOMING_RING_SIGNAL · info
  - 2026-11-08T19:52:05.247Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-08T19:52:05.248Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-08T19:52:05.402Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T19:52:05.419Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-08T19:52:05.420Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-08T19:52:05.594Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T19:52:05.595Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-08T19:52:05.733Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · post-authorization-revalidation-failed
  - 2026-11-08T19:52:05.935Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-08T19:52:07.566Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T19:52:07.586Z · PAGE_LIFECYCLE · info
  - 2026-11-08T19:52:10.085Z · PAGE_LIFECYCLE · info
  - 2026-11-08T19:52:10.087Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T19:52:10.107Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-08T19:52:13.605Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-08T19:52:17.633Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
