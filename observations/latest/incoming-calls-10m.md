# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-08T17:06:29.634Z → 2026-11-08T17:16:29.634Z
- Generado: 2026-11-08T17:16:29.634Z
- Eventos: 418 · lotes fuente: 45
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 418

## Resumen
- Intentos observados: 2
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 1
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 1 / 1
- Bloqueos de autocontestación: 1 · clics: 0

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

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
