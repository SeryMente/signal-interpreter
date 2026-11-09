# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-09T20:37:53.794Z → 2026-11-09T20:47:53.794Z
- Generado: 2026-11-09T20:47:53.794Z
- Eventos: 315 · lotes fuente: 41
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 315

## Resumen
- Intentos observados: 3
- Contestadas: 0 · perdidas confirmadas: 0
- Clic sin ruta: 2 · timbrados sin diálogo correlacionado: 1
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 2 / 2
- Bloqueos de autocontestación: 0 · clics: 2

## Intentos

### ring-da701b1c87c9dafa1596180b — ring_unmatched
- Detectada: 2026-11-09T20:42:08.305Z · modalidad: desconocida
- Tab: 1800213946 · eventos: 3
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED, TERMINAL_CALL_OUTCOME
  - 2026-11-09T20:42:07.640Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-09T20:42:08.003Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-09T20:42:08.305Z · INCOMING_RING_SIGNAL · info

### dd0fec9a-8ccf-4ae[PHONE]cbadb2add — connect_failed_no_route
- Detectada: 2026-11-09T20:42:56.236Z · modalidad: OPI
- Tab: 1800213946 · eventos: 22
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":3,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: null
- Señales ausentes: ninguna identificada
  - 2026-11-09T20:42:53.861Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-09T20:42:56.236Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-09T20:42:56.236Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-09T20:42:56.517Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-09T20:42:56.519Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:42:56.550Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-09T20:42:56.551Z · CONNECT_CLICKED · info
  - 2026-11-09T20:42:56.569Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:42:56.609Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-09T20:42:56.721Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:42:56.721Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-09T20:42:58.451Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-09T20:42:58.459Z · PAGE_LIFECYCLE · info
  - 2026-11-09T20:42:58.472Z · PAGE_LIFECYCLE · info
  - 2026-11-09T20:42:58.586Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-09T20:42:58.984Z · INCOMING_RING_SIGNAL · info
  - 2026-11-09T20:42:59.302Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-09T20:43:00.166Z · PAGE_LIFECYCLE · info
  - 2026-11-09T20:43:01.363Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-09T20:43:03.023Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-09T20:43:03.552Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-09T20:43:05.525Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

### 03502925-c0d3-4cc6-ba83-4cfd066e6320 — connect_failed_no_route
- Detectada: 2026-11-09T20:44:30.619Z · modalidad: OPI
- Tab: 1800213946 · eventos: 17
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":3,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-09T20:44:30.619Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-09T20:44:30.619Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-09T20:44:30.929Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:44:31.000Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-09T20:44:31.001Z · CONNECT_CLICKED · info
  - 2026-11-09T20:44:31.014Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:44:31.060Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-09T20:44:31.894Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:44:31.895Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-09T20:44:32.717Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-09T20:44:33.114Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-09T20:44:35.160Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-09T20:44:35.922Z · INCOMING_RING_SIGNAL · info
  - 2026-11-09T20:44:36.268Z · INCOMING_RING_SIGNAL · info
  - 2026-11-09T20:44:37.680Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-09T20:44:38.011Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route
  - 2026-11-09T20:44:38.860Z · CONNECT_ROUTE_TIMEOUT · error

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
