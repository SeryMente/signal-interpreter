# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-10T19:40:39.732Z → 2026-11-10T19:50:39.732Z
- Generado: 2026-11-10T19:50:39.732Z
- Eventos: 494 · lotes fuente: 54
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 494

## Resumen
- Intentos observados: 6
- Contestadas: 0 · perdidas confirmadas: 0
- Clic sin ruta: 6 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 6 / 6
- Bloqueos de autocontestación: 0 · clics: 7

## Intentos

### 858b93c9-7e1d-469f-8fa2-79a5f952780f — connect_failed_no_route
- Detectada: 2026-11-10T19:41:27.710Z · modalidad: OPI
- Tab: 220926780 · eventos: 19
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":5,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-10T19:41:27.710Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-10T19:41:27.711Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-10T19:41:28.011Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-10T19:41:28.013Z · CONNECT_CLICKED · info
  - 2026-11-10T19:41:28.023Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:41:28.052Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:41:28.196Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-10T19:41:28.205Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:41:28.206Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-10T19:41:29.007Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:41:29.007Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:41:29.077Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-10T19:41:30.577Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:41:30.579Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:41:30.910Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-10T19:41:31.903Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-10T19:41:33.900Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route
  - 2026-11-10T19:41:35.016Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-10T19:42:53.079Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-call-route

### dc2756f3-558a-4903-94fa-dbc7f8e6262f — connect_failed_no_route
- Detectada: 2026-11-10T19:42:53.078Z · modalidad: OPI
- Tab: 220926780 · eventos: 14
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":5,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-10T19:42:53.078Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-10T19:42:53.078Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-10T19:42:53.293Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:42:53.359Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-10T19:42:53.361Z · CONNECT_CLICKED · info
  - 2026-11-10T19:42:53.385Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-10T19:42:54.074Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:42:54.075Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-10T19:42:54.795Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-10T19:42:55.471Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-10T19:42:56.841Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-10T19:42:57.598Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-10T19:42:58.053Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route
  - 2026-11-10T19:42:59.795Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-call-route

### 16073d8f-6a13-4a0a-86c3-d690e1f8d7d2 — connect_failed_no_route
- Detectada: 2026-11-10T19:42:59.795Z · modalidad: OPI
- Tab: 220926780 · eventos: 19
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":5,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: null
- Señales ausentes: ninguna identificada
  - 2026-11-10T19:42:59.795Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-10T19:42:59.795Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-10T19:43:00.029Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:43:00.117Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-10T19:43:00.119Z · CONNECT_CLICKED · info
  - 2026-11-10T19:43:00.158Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:43:00.198Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-10T19:43:00.310Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:43:00.310Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-10T19:43:01.057Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:43:01.057Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:43:01.945Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-10T19:43:02.704Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:43:02.704Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:43:04.141Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-10T19:43:04.779Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-10T19:43:07.122Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-10T19:43:07.859Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route
  - 2026-11-10T19:43:27.821Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-call-route

### [PHONE]b3-4a06-9ef8-1bc0ac688f1d — connect_failed_no_route
- Detectada: 2026-11-10T19:43:27.820Z · modalidad: OPI
- Tab: 220926780 · eventos: 15
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":5,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-10T19:43:27.820Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-10T19:43:27.821Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-10T19:43:27.971Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:43:28.119Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-10T19:43:28.121Z · CONNECT_CLICKED · info
  - 2026-11-10T19:43:28.154Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:43:28.199Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-10T19:43:28.305Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:43:28.306Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-10T19:43:29.722Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-10T19:43:31.846Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-10T19:43:32.540Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-10T19:43:33.011Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route
  - 2026-11-10T19:43:35.122Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-10T19:44:24.100Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-call-route

### d90a8de7-c15d-4de7-9c59-1746eae92478 — connect_failed_no_route
- Detectada: 2026-11-10T19:44:24.099Z · modalidad: OPI
- Tab: 220926780 · eventos: 17
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":5,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-10T19:44:24.099Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-10T19:44:24.100Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-10T19:44:24.442Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-10T19:44:24.446Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:44:24.479Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-10T19:44:24.481Z · CONNECT_CLICKED · info
  - 2026-11-10T19:44:24.512Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:44:24.523Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-10T19:44:24.665Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:44:24.666Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-10T19:44:25.224Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:44:25.245Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:27.230Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-10T19:44:27.532Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-call-route
  - 2026-11-10T19:44:29.992Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-10T19:44:30.912Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-10T19:44:35.737Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

### 1e076d16-af94-42be-be89-4111d98a9007 — connect_failed_no_route
- Detectada: 2026-11-10T19:44:27.532Z · modalidad: OPI
- Tab: 220926780 · eventos: 44
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":5,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: null
- Señales ausentes: ninguna identificada
  - 2026-11-10T19:44:26.424Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-10T19:44:27.532Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-10T19:44:27.532Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-10T19:44:27.582Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:27.584Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:44:27.682Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:44:27.845Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:44:27.860Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-10T19:44:27.860Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-10T19:44:27.862Z · CONNECT_CLICKED · info
  - 2026-11-10T19:44:27.862Z · CONNECT_CLICKED · info
  - 2026-11-10T19:44:27.997Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:44:27.997Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:44:27.998Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-10T19:44:27.998Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-10T19:44:28.657Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:44:28.657Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:44:28.674Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:28.674Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:30.386Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:30.386Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:30.388Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:44:30.388Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:44:31.276Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:44:31.276Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:44:31.296Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:31.296Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:31.451Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:31.451Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:31.492Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:31.492Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:31.882Z · PLATFORM_SCREENSHOT_CAPTURE_ERROR · error · tab-activated
  - 2026-11-10T19:44:32.408Z · AVAILABILITY_STATE · info
  - 2026-11-10T19:44:32.470Z · PAGE_LIFECYCLE · info
  - 2026-11-10T19:44:32.472Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:44:34.863Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-10T19:44:37.910Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-10T19:44:37.910Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-10T19:44:39.073Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-10T19:44:39.073Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-10T19:44:39.755Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-10T19:44:39.755Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-10T19:44:43.087Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route
  - 2026-11-10T19:44:43.087Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
