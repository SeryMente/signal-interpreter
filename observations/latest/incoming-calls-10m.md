# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-10T17:52:06.635Z → 2026-11-10T18:02:06.635Z
- Generado: 2026-11-10T18:02:06.635Z
- Eventos: 143 · lotes fuente: 24
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 143

## Resumen
- Intentos observados: 3
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 2 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 2 / 2
- Bloqueos de autocontestación: 2 · clics: 2

## Intentos

### 586b20b1-9e4d-4efa-ae7b-517c0fc8b528 — connect_failed_no_route
- Detectada: 2026-11-10T17:52:06.683Z · modalidad: OPI
- Tab: 220926751 · eventos: 15
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: INCOMING_DIALOG_DETECTED
  - 2026-11-10T17:52:06.683Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-10T17:52:06.685Z · CONNECT_CLICKED · info
  - 2026-11-10T17:52:06.710Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T17:52:06.863Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T17:52:06.864Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-10T17:52:07.574Z · PAGE_LIFECYCLE · info
  - 2026-11-10T17:52:07.574Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T17:52:08.194Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-10T17:52:08.771Z · PAGE_LIFECYCLE · info
  - 2026-11-10T17:52:08.773Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T17:52:09.921Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-10T17:52:10.700Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-10T17:52:10.936Z · PLATFORM_SCREENSHOT_UPLOAD_ERROR · error · tab-activated
  - 2026-11-10T17:52:12.711Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route
  - 2026-11-10T17:52:13.689Z · CONNECT_ROUTE_TIMEOUT · error

### bc6b7ba2-ffdb-4786-a7c8-29c816a62fd8 — connect_failed_no_route
- Detectada: 2026-11-10T17:52:39.470Z · modalidad: OPI
- Tab: 220926751 · eventos: 20
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: null
- Señales ausentes: ninguna identificada
  - 2026-11-10T17:52:35.945Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T17:52:35.962Z · PAGE_LIFECYCLE · info
  - 2026-11-10T17:52:37.796Z · PAGE_LIFECYCLE · info
  - 2026-11-10T17:52:37.798Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T17:52:39.470Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-10T17:52:39.471Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-10T17:52:39.781Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T17:52:39.888Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-10T17:52:39.927Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T17:52:39.930Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-10T17:52:39.931Z · CONNECT_CLICKED · info
  - 2026-11-10T17:52:40.113Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T17:52:40.114Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-10T17:52:40.628Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T17:52:40.646Z · PAGE_LIFECYCLE · info
  - 2026-11-10T17:52:41.351Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-10T17:52:44.338Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-10T17:52:44.783Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-10T17:52:46.943Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-10T17:52:48.368Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

### 7932af1d-1d97-40c9-9748-fdc4d3ab0b1e — missed
- Detectada: 2026-11-10T17:52:43.179Z · modalidad: OPI
- Tab: 220926751 · eventos: 19
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-10T17:52:42.449Z · PAGE_LIFECYCLE · info
  - 2026-11-10T17:52:42.450Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T17:52:43.179Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-10T17:52:43.179Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-10T17:52:43.209Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · authorization-lease-active
  - 2026-11-10T17:52:43.368Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T17:52:43.540Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · authorization-lease-active
  - 2026-11-10T17:52:43.763Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T17:52:43.888Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-10T17:52:43.914Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-10T17:52:43.915Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-10T17:52:44.957Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T17:52:44.975Z · PAGE_LIFECYCLE · info
  - 2026-11-10T17:52:47.398Z · PAGE_LIFECYCLE · info
  - 2026-11-10T17:52:47.400Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-10T17:52:47.402Z · PLATFORM_SCREENSHOT_UPLOAD_ERROR · error · tab-activated
  - 2026-11-10T17:52:50.749Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-10T17:52:52.570Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-10T17:52:54.754Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
