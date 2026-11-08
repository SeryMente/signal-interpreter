# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-08T19:33:41.362Z → 2026-11-08T19:43:41.362Z
- Generado: 2026-11-08T19:43:41.362Z
- Eventos: 131 · lotes fuente: 21
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 131

## Resumen
- Intentos observados: 2
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 1
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 0 / 0
- Bloqueos de autocontestación: 0 · clics: 0

## Intentos

### ring-c240a577a499c09dc7d02df4 — ring_unmatched
- Detectada: 2026-11-08T19:33:43.349Z · modalidad: desconocida
- Tab: 1680554836 · eventos: 2
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED, TERMINAL_CALL_OUTCOME
  - 2026-11-08T19:33:43.349Z · INCOMING_RING_SIGNAL · info
  - 2026-11-08T19:33:44.076Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info

### 471263e4-f995-429c-9358-eed8ed6b94b6 — missed
- Detectada: 2026-11-08T19:33:45.323Z · modalidad: OPI
- Tab: 1680554836 · eventos: 6
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: INCOMING_DIALOG_DETECTED
  - 2026-11-08T19:33:45.323Z · PAGE_LIFECYCLE · info
  - 2026-11-08T19:33:45.325Z · PAGE_VISIBILITY_CHANGED · info
  - 2026-11-08T19:33:46.042Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-08T19:33:51.024Z · PERFORMANCE_HEARTBEAT · info · heartbeat
  - 2026-11-08T19:33:51.289Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-08T19:33:53.940Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
