# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-12T19:05:13.911Z → 2026-11-12T19:15:13.911Z
- Generado: 2026-11-12T19:15:13.911Z
- Eventos: 387 · lotes fuente: 50
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 387

## Resumen
- Intentos observados: 3
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 2 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 3 / 3
- Bloqueos de autocontestación: 1 · clics: 2

## Intentos

### f[PHONE]aa-436f-8d4a-148b3a2e2f34 — connect_failed_no_route
- Detectada: 2026-11-12T19:06:03.001Z · modalidad: OPI
- Tab: 220927959 · eventos: 15
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-12T19:06:03.001Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-12T19:06:03.002Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-12T19:06:03.263Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:06:03.308Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-12T19:06:03.370Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-12T19:06:03.372Z · CONNECT_CLICKED · info
  - 2026-11-12T19:06:03.415Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:06:03.567Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:06:03.568Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-12T19:06:04.673Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-12T19:06:04.890Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-12T19:06:06.562Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-12T19:06:07.197Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-12T19:06:07.798Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route
  - 2026-11-12T19:06:10.373Z · CONNECT_ROUTE_TIMEOUT · error

### b2b6a38e-c81f-4197-acf7-6a9e8b42f643 — connect_failed_no_route
- Detectada: 2026-11-12T19:06:31.616Z · modalidad: OPI
- Tab: 220927959 · eventos: 18
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: ninguna identificada
  - 2026-11-12T19:06:31.616Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-12T19:06:31.617Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-12T19:06:31.767Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:06:31.914Z · AUTO_ANSWER_ELIGIBLE · info
  - 2026-11-12T19:06:31.916Z · CONNECT_CLICKED · info
  - 2026-11-12T19:06:31.943Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:06:32.003Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-12T19:06:32.096Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:06:32.096Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-12T19:06:32.870Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-12T19:06:33.325Z · PAGE_LIFECYCLE · info
  - 2026-11-12T19:06:33.325Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-12T19:06:35.055Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-12T19:06:35.737Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-12T19:06:35.958Z · PAGE_LIFECYCLE · info
  - 2026-11-12T19:06:35.960Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-12T19:06:37.299Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route
  - 2026-11-12T19:06:38.917Z · CONNECT_ROUTE_TIMEOUT · error

### 970c262d-0d06-417f-8b68-39029d4b5989 — missed
- Detectada: 2026-11-12T19:09:53.209Z · modalidad: VRI
- Tab: 220927959 · eventos: 16
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":2,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-12T19:09:53.209Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-12T19:09:53.210Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-12T19:09:53.210Z · AUTO_ANSWER_BLOCKED · warn
  - 2026-11-12T19:09:53.210Z · AUTO_ANSWER_SKIPPED_UNVERIFIED_MODALITY · warn · only-verified-OPI
  - 2026-11-12T19:09:53.491Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:09:53.530Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-12T19:09:53.790Z · AUTO_ANSWER_BOOTSTRAP_INJECTION_ERROR · warn
  - 2026-11-12T19:09:54.028Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-12T19:09:54.439Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:09:54.591Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-12T19:09:54.591Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-12T19:09:55.368Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-12T19:09:56.198Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-12T19:09:56.215Z · PAGE_LIFECYCLE · info
  - 2026-11-12T19:09:57.087Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-12T19:09:59.033Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
