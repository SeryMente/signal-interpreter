# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-08T19:22:12.557Z → 2026-11-08T19:32:12.557Z
- Generado: 2026-11-08T19:32:12.557Z
- Eventos: 511 · lotes fuente: 40
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 511

## Resumen
- Intentos observados: 2
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 1
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 1 / 1
- Bloqueos de autocontestación: 1 · clics: 0

## Intentos

### 6e8edbca-d967-47f2-a624-f67f1ffa0a7f — missed
- Detectada: 2026-11-08T19:25:35.694Z · modalidad: OPI
- Tab: 1680554836 · eventos: 11
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":["PROFILE_NOT_AUTHORIZED"],"ready":false,"availability":"online","authorizedProfile":false,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":11,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-08T19:25:32.212Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-08T19:25:35.694Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-08T19:25:35.695Z · AUTO_ANSWER_BLOCKED · warn
  - 2026-11-08T19:25:35.695Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-08T19:25:36.223Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T19:25:36.652Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T19:25:37.241Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T19:25:37.241Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-08T19:25:37.879Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-08T19:25:40.330Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-08T19:25:40.617Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

### ring-56f6d1b1f131f3d576e0402a — ring_unmatched
- Detectada: 2026-11-08T19:26:13.576Z · modalidad: desconocida
- Tab: 1680554836 · eventos: 11
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED, TERMINAL_CALL_OUTCOME
  - 2026-11-08T19:26:08.821Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-08T19:26:09.320Z · PAGE_LIFECYCLE · info
  - 2026-11-08T19:26:10.159Z · PAGE_LIFECYCLE · info
  - 2026-11-08T19:26:11.551Z · PAGE_LIFECYCLE · info
  - 2026-11-08T19:26:12.312Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-08T19:26:12.559Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-08T19:26:13.576Z · INCOMING_RING_SIGNAL · info
  - 2026-11-08T19:26:14.527Z · PAGE_LIFECYCLE · info
  - 2026-11-08T19:26:16.508Z · PAGE_LIFECYCLE · info
  - 2026-11-08T19:26:17.907Z · PAGE_LIFECYCLE · info
  - 2026-11-08T19:26:18.458Z · PAGE_LIFECYCLE · info

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
