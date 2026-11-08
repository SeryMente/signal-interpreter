# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-08T17:10:39.110Z → 2026-11-08T17:20:39.110Z
- Generado: 2026-11-08T17:20:39.110Z
- Eventos: 380 · lotes fuente: 46
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 380

## Resumen
- Intentos observados: 3
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 1 · timbrados sin diálogo correlacionado: 1
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 2 / 2
- Bloqueos de autocontestación: 1 · clics: 1

## Intentos

### ring-b002e12edb33233518173a28 — ring_unmatched
- Detectada: 2026-11-08T17:11:32.287Z · modalidad: desconocida
- Tab: 1600161561 · eventos: 1
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED, TERMINAL_CALL_OUTCOME
  - 2026-11-08T17:11:32.287Z · INCOMING_RING_SIGNAL · info

### 1971ec[PHONE]b-a238-2e9ab15a4102 — missed
- Detectada: 2026-11-08T17:14:14.789Z · modalidad: OPI
- Tab: 1600161561 · eventos: 32
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":["SESSION_ENDED_CONFIRM_AGAIN","AUTO_ANSWER_DISABLED"],"ready":false,"availability":"online","authorizedProfile":true,"configEnabled":false,"labSafetyLock":false,"presenceArmed":false,"presenceReason":"session-ended-confirm-again","presenceGeneration":3,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-08T17:14:09.905Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T17:14:09.914Z · PAGE_LIFECYCLE · info
  - 2026-11-08T17:14:09.925Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-08T17:14:09.928Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-08T17:14:10.172Z · PAGE_LIFECYCLE · info
  - 2026-11-08T17:14:10.173Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T17:14:11.247Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-08T17:14:11.387Z · PLATFORM_SCREENSHOT_CAPTURE_ERROR · error · tab-activated
  - 2026-11-08T17:14:11.737Z · PLATFORM_SCREENSHOT_CAPTURE_ERROR · error · platform-surface-change
  - 2026-11-08T17:14:12.222Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T17:14:12.228Z · PAGE_LIFECYCLE · info
  - 2026-11-08T17:14:12.230Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-08T17:14:12.739Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-08T17:14:13.115Z · PAGE_LIFECYCLE · info
  - 2026-11-08T17:14:13.115Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T17:14:14.789Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-08T17:14:14.789Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-08T17:14:14.790Z · AUTO_ANSWER_BLOCKED · warn
  - 2026-11-08T17:14:15.019Z · PLATFORM_SCREENSHOT_CAPTURE_ERROR · error · tab-activated
  - 2026-11-08T17:14:15.097Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T17:14:15.249Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T17:14:15.250Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-08T17:14:15.991Z · PAGE_LIFECYCLE · info
  - 2026-11-08T17:14:15.992Z · PAGE_LIFECYCLE · info
  - 2026-11-08T17:14:15.992Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T17:14:16.418Z · PLATFORM_SCREENSHOT_CAPTURE_ERROR · error · platform-surface-change
  - 2026-11-08T17:14:17.864Z · PAGE_LIFECYCLE · info
  - 2026-11-08T17:14:18.108Z · PAGE_LIFECYCLE · info
  - 2026-11-08T17:14:21.347Z · INCOMING_RING_SIGNAL · info
  - 2026-11-08T17:14:21.683Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-08T17:14:23.992Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-08T17:14:29.661Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

### e4ab9e7d-ca95-4c0e-9bc7-d19df25a1e65 — connect_failed_no_route
- Detectada: 2026-11-08T17:19:33.750Z · modalidad: OPI
- Tab: 1600161561 · eventos: 20
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":9,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: null
- Señales ausentes: ninguna identificada
  - 2026-11-08T17:19:33.750Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-08T17:19:33.751Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-08T17:19:34.236Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T17:19:34.319Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-08T17:19:34.321Z · CONNECT_CLICKED · info
  - 2026-11-08T17:19:34.328Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-08T17:19:34.347Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T17:19:34.500Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T17:19:34.500Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-08T17:19:35.330Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T17:19:35.338Z · PAGE_LIFECYCLE · info
  - 2026-11-08T17:19:37.868Z · PAGE_LIFECYCLE · info
  - 2026-11-08T17:19:37.869Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T17:19:38.070Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-08T17:19:38.902Z · INCOMING_RING_SIGNAL · info
  - 2026-11-08T17:19:39.708Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-08T17:19:41.324Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-08T17:19:47.678Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-08T17:19:53.723Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-08T17:20:00.464Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
