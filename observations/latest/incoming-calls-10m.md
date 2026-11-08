# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-08T19:29:39.255Z → 2026-11-08T19:39:39.255Z
- Generado: 2026-11-08T19:39:39.255Z
- Eventos: 213 · lotes fuente: 27
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 213

## Resumen
- Intentos observados: 1
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 0
- Sin desenlace concluyente: 0
- Detecciones de diálogo/botón: 1 / 1
- Bloqueos de autocontestación: 2 · clics: 0

## Intentos

### 471263e4-f995-429c-9358-eed8ed6b94b6 — missed
- Detectada: 2026-11-08T19:33:37.927Z · modalidad: OPI
- Tab: 1680554836 · eventos: 14
- Botón: {"found":true,"notFound":false,"disabled":false} · estado readiness: {"blockedReasons":[],"ready":true,"availability":"online","authorizedProfile":true,"configEnabled":true,"labSafetyLock":false,"presenceArmed":true,"presenceReason":"explicit-availability","presenceGeneration":11,"reason":"availability","reasonCode":"availability"}
- Desenlace/motivo: "dialog_closed_without_connect"
- Señales ausentes: ninguna identificada
  - 2026-11-08T19:33:37.927Z · INCOMING_DIALOG_DETECTED · info
  - 2026-11-08T19:33:37.928Z · CONNECT_BUTTON_FOUND · info
  - 2026-11-08T19:33:38.078Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T19:33:38.179Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · sender-not-authorized
  - 2026-11-08T19:33:38.810Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T19:33:38.878Z · AUTO_ANSWER_AUTHORIZATION_BLOCKED · warn · sender-not-authorized
  - 2026-11-08T19:33:38.969Z · AUTO_ANSWER_READINESS · info · availability
  - 2026-11-08T19:33:38.971Z · INCOMING_DIALOG_CLOSED · info · dialog-removed
  - 2026-11-08T19:33:39.958Z · AUTO_ANSWER_BOOTSTRAP_REQUESTED · info
  - 2026-11-08T19:33:40.117Z · PAGE_LIFECYCLE · info
  - 2026-11-08T19:33:43.349Z · INCOMING_RING_SIGNAL · info
  - 2026-11-08T19:33:46.042Z · INCOMING_ATTEMPT_REGISTERED · info
  - 2026-11-08T19:33:51.289Z · INCOMING_DIALOG_CLOSED_OBSERVED · info · dialog-removed
  - 2026-11-08T19:33:53.940Z · MISSED_CALL_CLASSIFIED · warn · dialog_closed_without_connect

## Privacidad
- No se exportan audio, transcripciones, texto crudo del diálogo ni IDs de llamada completos.
