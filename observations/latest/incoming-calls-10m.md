# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-06T21:12:27.120Z → 2026-11-06T21:22:27.120Z
- Generado: 2026-11-06T21:22:27.120Z
- Eventos: 462 · lotes fuente: 47
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 462

## Resumen
- Intentos observados: 4
- Contestadas: 0 · perdidas confirmadas: 0
- Clic sin ruta: 4 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 4 / 4
- Bloqueos de autocontestación: 3 · clics: 2

## Intentos

### f472fa[PHONE]f6c04d13e03 — connect_failed_no_route
- Detectada: 2026-11-06T21:12:59.013Z · modalidad: OPI
- Tab: 220924849 · eventos: 8
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: AUTO_ANSWER_READINESS
  - 2026-11-06T21:12:59.013Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:12:59.013Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:12:59.454Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-06T21:12:59.457Z · CONNECT_CLICKED · info
  - 2026-11-06T21:13:03.001Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:13:06.458Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-06T21:13:20.915Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-previous-attempt-terminal
  - 2026-11-06T21:13:21.806Z · CONNECT_ACCEPTED_PENDING · info · await-call-route

### f8dbca85-96ea-4055-9eaa-1888c685dee6 — connect_failed_no_route
- Detectada: 2026-11-06T21:12:59.448Z · modalidad: OPI
- Tab: 220924849 · eventos: 19
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-06T21:12:59.372Z · OBSERVER_STOPPED · info · runtime-replaced
  - 2026-11-06T21:12:59.401Z · PERFORMANCE_HEARTBEAT · info · telemetry-start
  - 2026-11-06T21:12:59.402Z · PLATFORM_SESSION_STARTED · info
  - 2026-11-06T21:12:59.402Z · OBSERVER_STARTED · info
  - 2026-11-06T21:12:59.443Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-06T21:12:59.446Z · AVAILABILITY_STATE · info
  - 2026-11-06T21:12:59.448Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:12:59.448Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:12:59.450Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:12:59.451Z · AUTO_ANSWER_READINESS · info · config
  - 2026-11-06T21:12:59.523Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:12:59.657Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:12:59.674Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:12:59.674Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-06T21:13:00.124Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-06T21:13:02.557Z · INCOMING_RING_SIGNAL · info
  - 2026-11-06T21:13:21.363Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:13:22.732Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-06T21:13:23.663Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

### 49c783b8-b711-4afa-a1ec-80c2841a3ca0 — connect_failed_no_route
- Detectada: 2026-11-06T21:18:22.328Z · modalidad: OPI
- Tab: 220924849 · eventos: 9
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: AUTO_ANSWER_READINESS
  - 2026-11-06T21:18:22.328Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:18:22.328Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:18:22.360Z · OBSERVER_STOPPED · info · runtime-replaced
  - 2026-11-06T21:18:22.783Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-06T21:18:22.787Z · CONNECT_CLICKED · info
  - 2026-11-06T21:18:29.871Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-06T21:18:34.337Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:18:40.923Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-previous-attempt-terminal
  - 2026-11-06T21:18:41.744Z · CONNECT_ACCEPTED_PENDING · info · await-call-route

### 5407790b-4976-46b0-81c7-aadeedb19816 — connect_failed_no_route
- Detectada: 2026-11-06T21:18:22.408Z · modalidad: OPI
- Tab: 220924849 · eventos: 21
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-06T21:18:22.371Z · PERFORMANCE_HEARTBEAT · info · telemetry-start
  - 2026-11-06T21:18:22.372Z · PLATFORM_SESSION_STARTED · info
  - 2026-11-06T21:18:22.372Z · OBSERVER_STARTED · info
  - 2026-11-06T21:18:22.404Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-06T21:18:22.406Z · AVAILABILITY_STATE · info
  - 2026-11-06T21:18:22.408Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:18:22.408Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:18:22.410Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:18:22.411Z · AUTO_ANSWER_READINESS · info · config
  - 2026-11-06T21:18:22.458Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:18:22.737Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:18:22.774Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:18:22.858Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-06T21:18:23.896Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:18:23.897Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-06T21:18:26.921Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-06T21:18:33.925Z · INCOMING_RING_SIGNAL · info
  - 2026-11-06T21:18:40.525Z · INCOMING_RING_SIGNAL · info
  - 2026-11-06T21:18:41.332Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:18:43.477Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-06T21:18:45.082Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
