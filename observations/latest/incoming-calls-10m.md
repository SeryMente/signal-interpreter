# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-06T21:16:51.817Z → 2026-11-06T21:26:51.817Z
- Generado: 2026-11-06T21:26:51.817Z
- Eventos: 527 · lotes fuente: 35
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 527

## Resumen
- Intentos observados: 2
- Contestadas: 0 · perdidas confirmadas: 0
- Clic sin ruta: 2 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 2 / 2
- Bloqueos de autocontestación: 2 · clics: 1

## Intentos

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
