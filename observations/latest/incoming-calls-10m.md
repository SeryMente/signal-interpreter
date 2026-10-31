# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-10-31T01:21:09.391Z → 2026-10-31T01:31:09.391Z
- Generado: 2026-10-31T01:31:09.391Z
- Eventos: 1367 · lotes fuente: 77
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 1367

## Resumen
- Intentos observados: 2
- Contestadas: 1 · perdidas confirmadas: 0
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 2 / 2
- Bloqueos de autocontestación: 2 · clics: 1

## Intentos

### 31c[PHONE]b-4e85-b2f1-a8b5d61dccb6 — answered
- Detectada: 2026-10-31T01:22:14.559Z · modalidad: OPI
- Tab: 396051007 · eventos: 14
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":["SESSION_ENDED_CONFIRM_AGAIN","AVAILABILITY_UNKNOWN"],"ready":false,"availability":"unknown","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":false,"presenceReason":"session-ended-confirm-again","presenceGeneration":9,"reason":"route:navigation","reasonCode":"route:navigation"}
- Desenlace/motivo: null
- Señales ausentes: ninguna identificada
  - 2026-10-31T01:22:10.259Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-10-31T01:22:14.559Z · INCOMING_DIALOG_DETECTED · info
  - 2026-10-31T01:22:14.559Z · CONNECT_BUTTON_FOUND · info
  - 2026-10-31T01:22:14.576Z · OBSERVER_STOPPED · info · runtime-replaced
  - 2026-10-31T01:22:14.794Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-10-31T01:22:14.795Z · CONNECT_CLICKED · info
  - 2026-10-31T01:22:15.539Z · AUTO_ANSWER_READINESS · info · route:navigation
  - 2026-10-31T01:22:15.554Z · ANSWER_FLOW_ROUTE_CONFIRMED · info
  - 2026-10-31T01:22:21.026Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-10-31T01:22:22.537Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-previous-attempt-terminal
  - 2026-10-31T01:22:24.570Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-10-31T01:22:36.340Z · INCOMING_ATTEMPT_ANSWERED · info
  - 2026-10-31T01:26:24.752Z · AUTO_ANSWER_READINESS · info · route:navigation
  - 2026-10-31T01:26:26.489Z · AUTO_ANSWER_READINESS · info · route:navigation

### 8bb369d1-9b2f-4cf1-8c34-84d5537e9ee6 — closed_unclassified
- Detectada: 2026-10-31T01:22:14.602Z · modalidad: OPI
- Tab: 396051007 · eventos: 28
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":8,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: null
- Señales ausentes: TERMINAL_CALL_OUTCOME
  - 2026-10-31T01:22:14.583Z · PERFORMANCE_HEARTBEAT · info · telemetry-start
  - 2026-10-31T01:22:14.583Z · PLATFORM_SESSION_STARTED · info
  - 2026-10-31T01:22:14.584Z · OBSERVER_STARTED · info
  - 2026-10-31T01:22:14.601Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-10-31T01:22:14.602Z · INCOMING_DIALOG_DETECTED · info
  - 2026-10-31T01:22:14.602Z · CONNECT_BUTTON_FOUND · info
  - 2026-10-31T01:22:14.602Z · AVAILABILITY_STATE · info
  - 2026-10-31T01:22:14.603Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-10-31T01:22:14.604Z · AUTO_ANSWER_READINESS · info · config
  - 2026-10-31T01:22:14.635Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-10-31T01:22:14.811Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-10-31T01:22:14.827Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-10-31T01:22:14.872Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-10-31T01:22:15.005Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-10-31T01:22:15.005Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-10-31T01:22:15.479Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-10-31T01:22:15.481Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-10-31T01:22:15.487Z · PAGE_LIFECYCLE · info
  - 2026-10-31T01:22:15.487Z · PAGE_LIFECYCLE · info
  - 2026-10-31T01:22:15.498Z · AVAILABILITY_STATE · info
  - 2026-10-31T01:22:15.564Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-10-31T01:22:15.565Z · PLATFORM_URL_CHANGED · info · navigation
  - 2026-10-31T01:22:15.606Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-10-31T01:22:15.607Z · PLATFORM_URL_CHANGED · info · navigation
  - 2026-10-31T01:22:16.971Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-10-31T01:22:20.506Z · INCOMING_RING_SIGNAL · info
  - 2026-10-31T01:22:22.782Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-10-31T01:22:25.563Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
