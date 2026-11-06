# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-06T21:36:00.928Z → 2026-11-06T21:46:00.928Z
- Generado: 2026-11-06T21:46:00.928Z
- Eventos: 258 · lotes fuente: 42
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 258

## Resumen
- Intentos observados: 5
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 2 · timbrados sin diálogo correlacionado: 1
- Sin desenlace concluyente: 2
- Detecciones de diálogo/botón: 4 / 4
- Bloqueos de autocontestación: 5 · clics: 1

## Intentos

### 40e255ed-f3fd-4d86-a2f6-3f5293a1942a — incoming_observed_pending
- Detectada: 2026-11-06T21:43:21.654Z · modalidad: OPI
- Tab: 220924849 · eventos: 9
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: AUTO_ANSWER_READINESS, TERMINAL_CALL_OUTCOME
  - 2026-11-06T21:43:21.654Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:43:21.655Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:43:21.674Z · OBSERVER_STOPPED · info · runtime-replaced
  - 2026-11-06T21:43:21.686Z · PERFORMANCE_HEARTBEAT · info · telemetry-start
  - 2026-11-06T21:43:21.687Z · PLATFORM_SESSION_STARTED · info
  - 2026-11-06T21:43:21.687Z · OBSERVER_STARTED · info
  - 2026-11-06T21:43:22.035Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · post-authorization-revalidation-failed
  - 2026-11-06T21:43:32.356Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:43:34.392Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-previous-attempt-terminal

### 13f001fa-1498-4c45-956f-1ce3b24d9197 — missed
- Detectada: 2026-11-06T21:43:21.721Z · modalidad: OPI
- Tab: 220924849 · eventos: 16
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-06T21:43:21.717Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-06T21:43:21.720Z · AVAILABILITY_STATE · info
  - 2026-11-06T21:43:21.721Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:43:21.722Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:43:21.724Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:43:21.727Z · AUTO_ANSWER_READINESS · info · config
  - 2026-11-06T21:43:21.777Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:43:21.779Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:43:21.965Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:43:21.965Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-06T21:43:22.086Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-06T21:43:25.286Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-06T21:43:33.732Z · INCOMING_RING_SIGNAL · info
  - 2026-11-06T21:43:34.771Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:43:35.129Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-06T21:43:37.127Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

### 7b2fd0ee-5fd[PHONE]cd-60a23a0aec3d — connect_failed_no_route
- Detectada: 2026-11-06T21:44:46.556Z · modalidad: OPI
- Tab: 220924849 · eventos: 10
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: AUTO_ANSWER_READINESS
  - 2026-11-06T21:44:46.556Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:44:46.556Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:44:46.577Z · OBSERVER_STOPPED · info · runtime-replaced
  - 2026-11-06T21:44:46.589Z · PERFORMANCE_HEARTBEAT · info · telemetry-start
  - 2026-11-06T21:44:47.002Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-06T21:44:47.006Z · CONNECT_CLICKED · info
  - 2026-11-06T21:44:54.895Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-06T21:44:59.215Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:45:07.157Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-previous-attempt-terminal
  - 2026-11-06T21:45:10.506Z · CONNECT_ACCEPTED_PENDING · info · await-call-route

### 19ea2ee6-a021-4f80-a317-c5f431ea0e3e — connect_failed_no_route
- Detectada: 2026-11-06T21:44:46.622Z · modalidad: OPI
- Tab: 220924849 · eventos: 66
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-06T21:44:46.590Z · PLATFORM_SESSION_STARTED · info
  - 2026-11-06T21:44:46.590Z · OBSERVER_STARTED · info
  - 2026-11-06T21:44:46.620Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-06T21:44:46.622Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-06T21:44:46.622Z · AVAILABILITY_STATE · info
  - 2026-11-06T21:44:46.623Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-06T21:44:46.624Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:44:46.625Z · AUTO_ANSWER_READINESS · info · config
  - 2026-11-06T21:44:46.686Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:44:46.923Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:44:46.995Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:44:47.042Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:44:47.067Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-06T21:44:47.149Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · not-authorized
  - 2026-11-06T21:44:47.929Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-06T21:44:47.930Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-06T21:44:50.243Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:50.246Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:50.246Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:50.246Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:50.246Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:50.247Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:50.247Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:50.247Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:50.249Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:50.250Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:50.264Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:50.264Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:50.265Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:50.265Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:50.265Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:50.265Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:50.265Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:50.266Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:50.266Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:50.266Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:51.318Z · OBSERVER_STOPPED · info · runtime-replaced
  - 2026-11-06T21:44:51.327Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:51.327Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:51.327Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:51.328Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:51.328Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:51.328Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:51.328Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:51.329Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:51.329Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:51.329Z · PAGE_LIFECYCLE · info
  - 2026-11-06T21:44:51.331Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:51.331Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:51.331Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:51.331Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:51.331Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:51.332Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:51.332Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:51.332Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:51.332Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:51.332Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-06T21:44:51.411Z · PERFORMANCE_HEARTBEAT · info · telemetry-start
  - 2026-11-06T21:44:51.412Z · PLATFORM_SESSION_STARTED · info
  - 2026-11-06T21:44:51.412Z · OBSERVER_STARTED · info
  - 2026-11-06T21:44:51.452Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-06T21:44:51.454Z · AVAILABILITY_STATE · info
  - 2026-11-06T21:44:51.466Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-06T21:45:07.570Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:45:10.928Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-06T21:45:40.584Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

### ring-08883cbf9a15eb5cbb2d4535 — ring_unmatched
- Detectada: 2026-11-06T21:45:25.412Z · modalidad: desconocida
- Tab: 220924849 · eventos: 5
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED, TERMINAL_CALL_OUTCOME
  - 2026-11-06T21:45:21.898Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-06T21:45:24.291Z · PLATFORM_SCREENSHOT_CAPTURE_ERROR · error · tab-activated
  - 2026-11-06T21:45:25.412Z · INCOMING_RING_SIGNAL · info
  - 2026-11-06T21:45:26.065Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-06T21:45:29.761Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
