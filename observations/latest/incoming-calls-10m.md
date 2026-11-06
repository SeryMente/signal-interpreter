# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-06T21:08:29.429Z → 2026-11-06T21:18:29.429Z
- Generado: 2026-11-06T21:18:29.429Z
- Eventos: 525 · lotes fuente: 81
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 525

## Resumen
- Intentos observados: 8
- Contestadas: 0 · perdidas confirmadas: 0
- Clic sin ruta: 6 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 2
- Detecciones de diálogo/botón: 8 / 8
- Bloqueos de autocontestación: 9 · clics: 4

## Intentos

### c5e8e753-1f63-419e-a466-bc87243b7caa — connect_failed_no_route
- Detectada: 2026-11-06T21:09:41.746Z · modalidad: OPI
- Tab: 220924849 · eventos: 12
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: AUTO_ANSWER_READINESS
  - 2026-11-06T21:09:41.746Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:09:41.746Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:09:41.767Z · OBSERVER_STOPPED · info · runtime-replaced
  - 2026-11-06T21:09:41.778Z · PERFORMANCE_HEARTBEAT · info · telemetry-start
  - 2026-11-06T21:09:41.779Z · PLATFORM_SESSION_STARTED · info
  - 2026-11-06T21:09:41.779Z · OBSERVER_STARTED · info
  - 2026-11-06T21:09:42.194Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-06T21:09:42.196Z · CONNECT_CLICKED · info
  - 2026-11-06T21:09:49.198Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-06T21:09:54.446Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:09:59.737Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-previous-attempt-terminal
  - 2026-11-06T21:10:02.863Z · CONNECT_ACCEPTED_PENDING · info · await-call-route

### 5dd1ce[PHONE]d8-eb6a99c4cc0e — connect_failed_no_route
- Detectada: 2026-11-06T21:09:41.812Z · modalidad: OPI
- Tab: 220924849 · eventos: 28
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-06T21:09:41.809Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-06T21:09:41.812Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:09:41.812Z · AVAILABILITY_STATE · info
  - 2026-11-06T21:09:41.813Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:09:41.814Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:09:41.816Z · AUTO_ANSWER_READINESS · info · config
  - 2026-11-06T21:09:41.881Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:09:42.147Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:09:42.181Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:09:42.223Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:09:42.263Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-06T21:09:42.344Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:09:42.375Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:09:42.376Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-06T21:09:43.732Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:09:43.734Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:09:43.734Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:09:43.734Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:09:43.736Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:09:43.749Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:09:43.750Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:09:43.750Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:09:43.750Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:09:43.750Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:09:46.585Z · INCOMING_RING_SIGNAL · info
  - 2026-11-06T21:10:00.150Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:10:08.907Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-06T21:10:10.642Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

### f[PHONE]db-478d-ab74-cef62f876642 — connect_failed_no_route
- Detectada: 2026-11-06T21:11:16.614Z · modalidad: OPI
- Tab: 220924849 · eventos: 13
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: AUTO_ANSWER_READINESS
  - 2026-11-06T21:11:11.864Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-06T21:11:16.614Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:11:16.614Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:11:16.639Z · OBSERVER_STOPPED · info · runtime-replaced
  - 2026-11-06T21:11:16.653Z · PERFORMANCE_HEARTBEAT · info · telemetry-start
  - 2026-11-06T21:11:16.654Z · OBSERVER_STARTED · info
  - 2026-11-06T21:11:16.654Z · PLATFORM_SESSION_STARTED · info
  - 2026-11-06T21:11:17.160Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-06T21:11:17.162Z · CONNECT_CLICKED · info
  - 2026-11-06T21:11:24.163Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-06T21:11:30.290Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:11:36.071Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-previous-attempt-terminal
  - 2026-11-06T21:11:46.598Z · CONNECT_ACCEPTED_PENDING · info · await-call-route

### 0cfebf69-738b-4948-8e45-aaeff1c7c7b6 — connect_failed_no_route
- Detectada: 2026-11-06T21:11:16.698Z · modalidad: OPI
- Tab: 220924849 · eventos: 41
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-06T21:11:16.695Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-06T21:11:16.697Z · AVAILABILITY_STATE · info
  - 2026-11-06T21:11:16.698Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:11:16.698Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:11:16.699Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:11:16.700Z · AUTO_ANSWER_READINESS · info · config
  - 2026-11-06T21:11:16.777Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:11:16.868Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:11:17.153Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:11:17.199Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:11:17.251Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-06T21:11:17.352Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:11:17.353Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-06T21:11:17.730Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:17.731Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:17.732Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:17.732Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:17.732Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:17.733Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:17.749Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:17.750Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:17.750Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:17.750Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:17.750Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:17.750Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:19.072Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:19.072Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:19.072Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:19.072Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:19.072Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:19.072Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:11:19.074Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:19.075Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:19.075Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:19.075Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:19.075Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:19.075Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:11:22.178Z · INCOMING_RING_SIGNAL · info
  - 2026-11-06T21:11:36.520Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:11:46.989Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-06T21:11:52.416Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

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

### 49c783b8-b711-4afa-a1ec-80c2841a3ca0 — incoming_observed_pending
- Detectada: 2026-11-06T21:18:22.328Z · modalidad: OPI
- Tab: 220924849 · eventos: 5
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: AUTO_ANSWER_READINESS, TERMINAL_CALL_OUTCOME
  - 2026-11-06T21:18:22.328Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:18:22.328Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:18:22.360Z · OBSERVER_STOPPED · info · runtime-replaced
  - 2026-11-06T21:18:22.783Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-06T21:18:22.787Z · CONNECT_CLICKED · info

### 5407790b-4976-46b0-81c7-aadeedb19816 — closed_unclassified
- Detectada: 2026-11-06T21:18:22.408Z · modalidad: OPI
- Tab: 220924849 · eventos: 16
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: null
- Señales ausentes: TERMINAL_CALL_OUTCOME
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

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
