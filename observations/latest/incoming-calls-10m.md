# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-06T21:53:44.798Z → 2026-11-06T22:03:44.798Z
- Generado: 2026-11-06T22:03:44.798Z
- Eventos: 11 · lotes fuente: 9
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 11

## Resumen
- Intentos observados: 3
- Contestadas: 1 · perdidas confirmadas: 0
- Clic sin ruta: 1 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 0 / 0
- Bloqueos de autocontestación: 0 · clics: 0

## Intentos

### 479ad08e-d604-4c[PHONE]a2219832aff — incomplete
- Detectada: 2026-11-06T21:53:46.847Z · modalidad: OPI
- Tab: 0 · eventos: 1
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED, TERMINAL_CALL_OUTCOME
  - 2026-11-06T21:53:46.847Z · CONNECT_ACCEPTED_PENDING · info · await-call-route

### 8bfc1424-226a-479b-a693-8fa54f523966 — connect_failed_no_route
- Detectada: 2026-11-06T21:53:48.169Z · modalidad: desconocida
- Tab: 0 · eventos: 2
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: INCOMING_DIALOG_DETECTED
  - 2026-11-06T21:53:48.169Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-06T21:53:49.739Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

### 45a6a2bb-95b5-483c-9192-d4d01954c265 — answered
- Detectada: 2026-11-06T21:55:17.058Z · modalidad: OPI
- Tab: 220924849 · eventos: 4
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED
  - 2026-11-06T21:55:17.058Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T21:55:24.391Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-06T21:55:26.714Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-06T21:55:34.828Z · INCOMING_ATTEMPT_ANSWERED · info

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
