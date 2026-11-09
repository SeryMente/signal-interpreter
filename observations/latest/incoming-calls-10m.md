# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-09T17:55:51.922Z → 2026-11-09T18:05:51.922Z
- Generado: 2026-11-09T18:05:51.922Z
- Eventos: 147 · lotes fuente: 30
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 147

## Resumen
- Intentos observados: 3
- Contestadas: 0 · perdidas confirmadas: 2
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 1
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 2 / 2
- Bloqueos de autocontestación: 2 · clics: 0

## Intentos

### ring-f7e85388c50f92e43c681a73 — ring_unmatched
- Detectada: 2026-11-09T17:57:41.335Z · modalidad: desconocida
- Tab: 396052068 · eventos: 1
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED, TERMINAL_CALL_OUTCOME
  - 2026-11-09T17:57:41.335Z · INCOMING_RING_SIGNAL · info

### 7ddac554-7f[PHONE]a6-ddb26b7c2e0a — missed
- Detectada: 2026-11-09T18:00:08.466Z · modalidad: OPI
- Tab: 396052068 · eventos: 15
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: AUTO_ANSWER_READINESS
  - 2026-11-09T18:00:08.336Z · INCOMING_RING_SIGNAL · info
  - 2026-11-09T18:00:08.464Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-09T18:00:08.465Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-09T18:00:08.466Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-09T18:00:08.467Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-09T18:00:08.467Z · AUTO_ANSWER_BLOCKED · warn
  - 2026-11-09T18:00:09.043Z · PLATFORM_SURFACE_SNAPSHOT · info
  - 2026-11-09T18:00:09.394Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-09T18:00:09.410Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-09T18:00:09.417Z · PAGE_LIFECYCLE · info
  - 2026-11-09T18:00:09.424Z · PAGE_LIFECYCLE · info
  - 2026-11-09T18:00:10.962Z · PAGE_LIFECYCLE · info
  - 2026-11-09T18:00:11.028Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-09T18:00:13.379Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-09T18:00:14.953Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

### 8bf6affc-4abf-43fc-b73b-c[PHONE]c — missed
- Detectada: 2026-11-09T18:00:18.585Z · modalidad: OPI
- Tab: 396052068 · eventos: 13
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: AUTO_ANSWER_READINESS
  - 2026-11-09T18:00:13.885Z · PAGE_LIFECYCLE · info
  - 2026-11-09T18:00:13.886Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-09T18:00:14.176Z · PLATFORM_SCREENSHOT_UPLOAD_ERROR · error · tab-activated
  - 2026-11-09T18:00:18.585Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-09T18:00:18.585Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-09T18:00:18.585Z · AUTO_ANSWER_BLOCKED · warn
  - 2026-11-09T18:00:19.313Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-09T18:00:19.657Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-09T18:00:19.665Z · PAGE_LIFECYCLE · info
  - 2026-11-09T18:00:20.154Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-09T18:00:20.932Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-09T18:00:22.417Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect
  - 2026-11-09T18:00:23.500Z · PERFORMANCE_HEARTBEAT · info · heartbeat

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
