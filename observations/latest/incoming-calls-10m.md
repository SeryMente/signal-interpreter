# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-10T19:44:16.335Z → 2026-11-10T19:54:16.335Z
- Generado: 2026-11-10T19:54:16.335Z
- Eventos: 387 · lotes fuente: 31
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 387

## Resumen
- Intentos observados: 3
- Contestadas: 0 · perdidas confirmadas: 0
- Clic sin ruta: 2 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 2 / 2
- Bloqueos de autocontestación: 0 · clics: 3

## Intentos

### d90a8de7-c15d-4de7-9c59-1746eae92478 — connect_failed_no_route
- Detectada: 2026-11-10T19:44:24.099Z · modalidad: OPI
- Tab: 220926780 · eventos: 14
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
  - 2026-11-10T19:44:24.665Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T19:44:24.666Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-10T19:44:27.230Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-10T19:44:27.532Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-call-route
  - 2026-11-10T19:44:29.992Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-10T19:44:30.912Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-10T19:44:35.737Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

### [PHONE]b3-4a06-9ef8-1bc0ac688f1d — incomplete
- Detectada: 2026-11-10T19:44:24.100Z · modalidad: desconocida
- Tab: 220926780 · eventos: 4
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED, TERMINAL_CALL_OUTCOME
  - 2026-11-10T19:44:24.100Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-call-route
  - 2026-11-10T19:44:24.523Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-10T19:44:25.224Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T19:44:25.245Z · PAGE_LIFECYCLE · info

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
