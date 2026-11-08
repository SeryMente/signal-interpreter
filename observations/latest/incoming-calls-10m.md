# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-08T20:36:55.882Z → 2026-11-08T20:46:55.882Z
- Generado: 2026-11-08T20:46:55.882Z
- Eventos: 374 · lotes fuente: 36
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 374

## Resumen
- Intentos observados: 2
- Contestadas: 0 · perdidas confirmadas: 0
- Clic sin ruta: 1 · timbrados sin diálogo correlacionado: 1
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 1 / 1
- Bloqueos de autocontestación: 0 · clics: 1

## Intentos

### ring-a8c46f721595afe2b1450a89 — ring_unmatched
- Detectada: 2026-11-08T20:43:24.596Z · modalidad: desconocida
- Tab: 1680555655 · eventos: 4
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED, TERMINAL_CALL_OUTCOME
  - 2026-11-08T20:43:23.849Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-08T20:43:24.216Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-08T20:43:24.596Z · INCOMING_RING_SIGNAL · info
  - 2026-11-08T20:43:27.212Z · PERFORMANCE_HEARTBEAT · info · heartbeat

### c5f51ad6-9da5-4a7a-8af8-c30785e57797 — connect_failed_no_route
- Detectada: 2026-11-08T20:45:29.842Z · modalidad: OPI
- Tab: 1680555655 · eventos: 21
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":9,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: null
- Señales ausentes: ninguna identificada
  - 2026-11-08T20:45:29.842Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-08T20:45:29.842Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-08T20:45:30.249Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-08T20:45:30.251Z · CONNECT_CLICKED · info
  - 2026-11-08T20:45:30.259Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-08T20:45:30.260Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-08T20:45:30.262Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T20:45:30.287Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T20:45:30.295Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-08T20:45:30.444Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T20:45:30.445Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-08T20:45:30.779Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-08T20:45:31.146Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T20:45:31.154Z · PAGE_LIFECYCLE · info
  - 2026-11-08T20:45:32.467Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-08T20:45:32.910Z · INCOMING_RING_SIGNAL · info
  - 2026-11-08T20:45:33.317Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-08T20:45:37.251Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-08T20:45:37.370Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-08T20:45:39.001Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-08T20:45:42.525Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
