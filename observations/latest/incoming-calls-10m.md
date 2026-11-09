# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-09T20:49:49.200Z → 2026-11-09T20:59:49.200Z
- Generado: 2026-11-09T20:59:49.200Z
- Eventos: 169 · lotes fuente: 31
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 169

## Resumen
- Intentos observados: 2
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 1 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 2 / 2
- Bloqueos de autocontestación: 1 · clics: 1

## Intentos

### a5dd0b96-cb2c-46e5-8bbf-e9e19dc40d34 — connect_failed_no_route
- Detectada: 2026-11-09T20:50:36.823Z · modalidad: OPI
- Tab: 1800213946 · eventos: 24
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":3,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: null
- Señales ausentes: ninguna identificada
  - 2026-11-09T20:50:36.823Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-09T20:50:36.824Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-09T20:50:37.300Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-09T20:50:37.301Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-09T20:50:37.301Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-09T20:50:37.302Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-09T20:50:37.303Z · CONNECT_CLICKED · info
  - 2026-11-09T20:50:37.308Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:50:37.333Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:50:37.410Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-09T20:50:37.490Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:50:37.491Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-09T20:50:37.812Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-09T20:50:38.050Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-09T20:50:38.059Z · PAGE_LIFECYCLE · info
  - 2026-11-09T20:50:40.079Z · INCOMING_RING_SIGNAL · info
  - 2026-11-09T20:50:40.515Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-09T20:50:40.985Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-09T20:50:41.445Z · PAGE_LIFECYCLE · info
  - 2026-11-09T20:50:41.446Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-09T20:50:44.304Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-09T20:50:48.012Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-09T20:50:49.026Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-09T20:50:53.538Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

### 35ff25b0-3ad6-4748-9e01-f714ea9bd67c — missed
- Detectada: 2026-11-09T20:50:58.254Z · modalidad: OPI
- Tab: 1800213946 · eventos: 18
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":3,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-09T20:50:53.366Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-09T20:50:58.254Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-09T20:50:58.254Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-09T20:50:58.413Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:50:58.415Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-09T20:50:58.732Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:50:58.885Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T20:50:58.885Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-09T20:50:58.898Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · post-authorization-revalidation-failed
  - 2026-11-09T20:50:59.620Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-09T20:50:59.629Z · PAGE_LIFECYCLE · info
  - 2026-11-09T20:50:59.737Z · PLATFORM_SCREENSHOT_CAPTURE_ERROR · error · tab-activated
  - 2026-11-09T20:51:01.646Z · AVAILABILITY_STATE · info
  - 2026-11-09T20:51:02.041Z · PAGE_LIFECYCLE · info
  - 2026-11-09T20:51:02.042Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-09T20:51:11.724Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-09T20:51:17.147Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-09T20:51:25.575Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
