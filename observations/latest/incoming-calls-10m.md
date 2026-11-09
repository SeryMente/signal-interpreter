# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-09T21:30:12.527Z → 2026-11-09T21:40:12.527Z
- Generado: 2026-11-09T21:40:12.527Z
- Eventos: 206 · lotes fuente: 29
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 206

## Resumen
- Intentos observados: 2
- Contestadas: 0 · perdidas confirmadas: 0
- Clic sin ruta: 2 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 1 / 1
- Bloqueos de autocontestación: 0 · clics: 1

## Intentos

### 0a03baf8-4e17-44e3-91fd-5ce8b73c0806 — connect_failed_no_route
- Detectada: 2026-11-09T21:30:18.320Z · modalidad: desconocida
- Tab: 1800213946 · eventos: 2
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: INCOMING_DIALOG_DETECTED
  - 2026-11-09T21:30:18.320Z · PLATFORM_SCREENSHOT_UPLOAD_ERROR · error · tab-activated
  - 2026-11-09T21:30:18.829Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

### cf7c04ae-17a6-41dc-8183-193ba4ddcbd0 — connect_failed_no_route
- Detectada: 2026-11-09T21:32:46.046Z · modalidad: OPI
- Tab: 1800213946 · eventos: 24
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":9,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: null
- Señales ausentes: ninguna identificada
  - 2026-11-09T21:32:45.464Z · PAGE_LIFECYCLE · info
  - 2026-11-09T21:32:45.465Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-09T21:32:46.046Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-09T21:32:46.046Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-09T21:32:46.066Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T21:32:46.083Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T21:32:46.151Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-09T21:32:46.196Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T21:32:46.399Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T21:32:46.604Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-09T21:32:46.605Z · CONNECT_CLICKED · info
  - 2026-11-09T21:32:46.609Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-09T21:32:46.610Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-09T21:32:48.171Z · AVAILABILITY_STATE · info
  - 2026-11-09T21:32:48.304Z · PLATFORM_SCREENSHOT_CAPTURE_ERROR · error · tab-activated
  - 2026-11-09T21:32:49.012Z · PAGE_LIFECYCLE · info
  - 2026-11-09T21:32:49.013Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-09T21:32:49.558Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-09T21:32:50.712Z · INCOMING_RING_SIGNAL · info
  - 2026-11-09T21:32:53.620Z · CONNECT_ROUTE_TIMEOUT · error
  - 2026-11-09T21:32:57.105Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-09T21:33:02.779Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-09T21:33:03.249Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-09T21:33:11.970Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
