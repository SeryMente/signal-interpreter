# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-14T19:53:57.015Z → 2026-11-14T20:03:57.015Z
- Generado: 2026-11-14T20:03:57.015Z
- Eventos: 360 · lotes fuente: 40
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 360

## Resumen
- Intentos observados: 3
- Contestadas: 0 · perdidas confirmadas: 2
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 1
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 1 / 1
- Bloqueos de autocontestación: 1 · clics: 0

## Intentos

### 790d01a7-471f-47d3-9372-abbcfd26f6d3 — missed
- Detectada: 2026-11-14T19:53:57.171Z · modalidad: OPI
- Tab: 220929880 · eventos: 8
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: INCOMING_DIALOG_DETECTED
  - 2026-11-14T19:53:57.171Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-14T19:53:57.402Z · PAGE_LIFECYCLE · info
  - 2026-11-14T19:53:57.404Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-14T19:53:57.698Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-14T19:54:00.502Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-14T19:54:01.091Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-14T19:54:06.548Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-14T19:54:11.581Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

### ring-43696f437621b4e7ec88ac7d — ring_unmatched
- Detectada: 2026-11-14T19:54:01.648Z · modalidad: desconocida
- Tab: 220929880 · eventos: 1
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED, TERMINAL_CALL_OUTCOME
  - 2026-11-14T19:54:01.648Z · INCOMING_RING_SIGNAL · info

### c9dbaa6f-bbf6-40e0-a237-9e989b1d6a70 — missed
- Detectada: 2026-11-14T19:56:18.915Z · modalidad: OPI
- Tab: 220929880 · eventos: 12
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":["IDLE_CONFIRM_AGAIN"],"ready":false,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":false,"presenceReason":"idle-confirm-again","presenceGeneration":16,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-14T19:56:18.915Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-14T19:56:18.916Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-14T19:56:18.916Z · AUTO_ANSWER_BLOCKED · warn
  - 2026-11-14T19:56:19.030Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-14T19:56:19.702Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-14T19:56:20.058Z · AUTO_ANSWER_READINESS · info · heartbeat
  - 2026-11-14T19:56:20.093Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-14T19:56:20.094Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-14T19:56:23.950Z · INCOMING_RING_SIGNAL · info
  - 2026-11-14T19:56:26.650Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-14T19:56:30.456Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-14T19:56:33.810Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
