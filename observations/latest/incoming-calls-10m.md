# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-07T16:16:39.867Z → 2026-11-07T16:26:39.867Z
- Generado: 2026-11-07T16:26:39.867Z
- Eventos: 326 · lotes fuente: 45
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 326

## Resumen
- Intentos observados: 3
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 1 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 3 / 3
- Bloqueos de autocontestación: 2 · clics: 1

## Intentos

### 33ea55e9-eb30-4c5a-8dda-ec194e3de92b — incoming_observed_pending
- Detectada: 2026-11-07T16:24:54.412Z · modalidad: OPI
- Tab: 220925147 · eventos: 6
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: AUTO_ANSWER_READINESS, TERMINAL_CALL_OUTCOME
  - 2026-11-07T16:24:54.412Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-07T16:24:54.413Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-07T16:24:54.418Z · OBSERVER_STOPPED · info · runtime-replaced
  - 2026-11-07T16:24:55.143Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · post-authorization-revalidation-failed
  - 2026-11-07T16:25:01.580Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-07T16:25:13.017Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-previous-attempt-terminal

### 94fd1518-ad41-4f1a-b3d8-c21c93408a74 — missed
- Detectada: 2026-11-07T16:24:55.066Z · modalidad: OPI
- Tab: 220925147 · eventos: 19
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":3,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-07T16:24:55.063Z · PLATFORM_SESSION_STARTED · info
  - 2026-11-07T16:24:55.063Z · OBSERVER_STARTED · info
  - 2026-11-07T16:24:55.065Z · AVAILABILITY_STATE · info
  - 2026-11-07T16:24:55.066Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-07T16:24:55.066Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-07T16:24:55.067Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-07T16:24:55.068Z · AUTO_ANSWER_READINESS · info · config
  - 2026-11-07T16:24:55.076Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-07T16:24:55.077Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-07T16:24:55.142Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-07T16:24:56.904Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-07T16:24:56.906Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-07T16:24:56.908Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-07T16:24:56.924Z · PAGE_LIFECYCLE · info
  - 2026-11-07T16:24:56.925Z · PAGE_LIFECYCLE · info
  - 2026-11-07T16:24:56.925Z · PAGE_LIFECYCLE · info
  - 2026-11-07T16:25:13.590Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-07T16:25:14.238Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-07T16:25:20.788Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

### 15be0bf4-358d-4448-b252-d88437822d88 — connect_failed_no_route
- Detectada: 2026-11-07T16:25:21.697Z · modalidad: OPI
- Tab: 220925147 · eventos: 25
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":3,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-07T16:25:21.254Z · PLATFORM_SCREENSHOT_UPLOAD_ERROR · error · tab-activated
  - 2026-11-07T16:25:21.697Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-07T16:25:21.698Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-07T16:25:21.849Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-07T16:25:21.972Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-07T16:25:22.139Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-07T16:25:22.142Z · CONNECT_CLICKED · info
  - 2026-11-07T16:25:22.162Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-07T16:25:22.162Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-07T16:25:22.992Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-07T16:25:22.994Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-07T16:25:22.995Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-07T16:25:23.015Z · PAGE_LIFECYCLE · info
  - 2026-11-07T16:25:23.015Z · PAGE_LIFECYCLE · info
  - 2026-11-07T16:25:23.015Z · PAGE_LIFECYCLE · info
  - 2026-11-07T16:25:24.484Z · PAGE_LIFECYCLE · info
  - 2026-11-07T16:25:24.484Z · PAGE_LIFECYCLE · info
  - 2026-11-07T16:25:24.485Z · PAGE_LIFECYCLE · info
  - 2026-11-07T16:25:24.486Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-07T16:25:24.486Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-07T16:25:24.486Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-07T16:25:33.452Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-07T16:25:39.223Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-07T16:25:40.759Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-07T16:25:48.303Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
