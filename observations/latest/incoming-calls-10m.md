# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-08T20:39:31.083Z → 2026-11-08T20:49:31.083Z
- Generado: 2026-11-08T20:49:31.083Z
- Eventos: 341 · lotes fuente: 40
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 341

## Resumen
- Intentos observados: 3
- Contestadas: 0 · perdidas confirmadas: 0
- Clic sin ruta: 2 · timbrados sin diálogo correlacionado: 1
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 2 / 2
- Bloqueos de autocontestación: 0 · clics: 2

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

### 6d8a5ae4-42a1-4ca3-9e7b-798d92311709 — connect_failed_no_route
- Detectada: 2026-11-08T20:46:59.164Z · modalidad: OPI
- Tab: 1680555655 · eventos: 22
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":9,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: null
- Señales ausentes: ninguna identificada
  - 2026-11-08T20:46:59.164Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-08T20:46:59.164Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-08T20:46:59.472Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-08T20:46:59.473Z · CONNECT_CLICKED · info
  - 2026-11-08T20:46:59.477Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-08T20:46:59.478Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-08T20:46:59.480Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T20:46:59.502Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T20:46:59.505Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-08T20:46:59.655Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T20:46:59.656Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-08T20:47:00.452Z · PAGE_LIFECYCLE · info
  - 2026-11-08T20:47:00.454Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T20:47:01.481Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-08T20:47:01.848Z · INCOMING_RING_SIGNAL · info
  - 2026-11-08T20:47:02.226Z · PAGE_LIFECYCLE · info
  - 2026-11-08T20:47:02.227Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T20:47:02.236Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-08T20:47:05.582Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-08T20:47:06.474Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-08T20:47:06.750Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-08T20:47:09.921Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
