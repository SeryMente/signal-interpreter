# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-06T22:50:06.614Z → 2026-11-06T23:00:06.614Z
- Generado: 2026-11-06T23:00:06.614Z
- Eventos: 169 · lotes fuente: 20
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 169

## Resumen
- Intentos observados: 2
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 0 / 0
- Bloqueos de autocontestación: 0 · clics: 0

## Intentos

### b122c361-aeb[PHONE]-d4eb6a54e95c — incomplete
- Detectada: 2026-11-06T22:50:51.745Z · modalidad: OPI
- Tab: 220924849 · eventos: 4
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: null
- Señales ausentes: INCOMING_DIALOG_DETECTED, TERMINAL_CALL_OUTCOME
  - 2026-11-06T22:50:51.745Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-06T22:50:55.083Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T22:50:58.454Z · AUTO_ANSWER_BOOTSTRAP_INJECTED · info
  - 2026-11-06T22:51:07.081Z · INCOMING_ATTEMPT_SUPERSEDED · warn · new-incoming-dialog-before-previous-attempt-terminal

### 378b0035-db3f-45d8-ab93-b72ca3bdc0c9 — missed
- Detectada: 2026-11-06T22:51:07.665Z · modalidad: OPI
- Tab: 220924849 · eventos: 3
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: INCOMING_DIALOG_DETECTED
  - 2026-11-06T22:51:07.665Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-06T22:51:08.196Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-06T22:51:11.380Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
