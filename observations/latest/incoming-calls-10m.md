# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-09T21:33:00.621Z → 2026-11-09T21:43:00.621Z
- Generado: 2026-11-09T21:43:00.621Z
- Eventos: 51 · lotes fuente: 15
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 51

## Resumen
- Intentos observados: 1
- Contestadas: 0 · perdidas confirmadas: 0
- Clic sin ruta: 1 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 0 / 0
- Bloqueos de autocontestación: 0 · clics: 0

## Intentos

### cf7c04ae-17a6-41dc-8183-193ba4ddcbd0 — connect_failed_no_route
- Detectada: 2026-11-09T21:33:02.779Z · modalidad: OPI
- Tab: 0 · eventos: 5
- Botón: {"found":false,"notFound":false,"disabled":false} · estado readiness: null
- Desenlace/motivo: "connect_clicked_no_call_route"
- Señales ausentes: INCOMING_DIALOG_DETECTED
  - 2026-11-09T21:33:02.779Z · CONNECT_ACCEPTED_PENDING · info · await-call-route
  - 2026-11-09T21:33:03.249Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-09T21:33:06.505Z · PLATFORM_ONLINE_RECONCILED_ENDED · info · explicit-offline-observation
  - 2026-11-09T21:33:07.119Z · PLATFORM_TELEMETRY_RECONCILED · info
  - 2026-11-09T21:33:11.970Z · CONNECT_FLOW_FAILED_NO_CALL_ROUTE · warn · connect_clicked_no_call_route

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
