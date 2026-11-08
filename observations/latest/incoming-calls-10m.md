# Signal Interpreter — llamadas entrantes, últimos diez minutos

- Ventana UTC: 2026-11-08T19:26:07.941Z → 2026-11-08T19:36:07.941Z
- Generado: 2026-11-08T19:36:07.941Z
- Eventos: 404 · lotes fuente: 36
- Reloj cliente corregido con recibo relay: 0
- Reloj cliente sin verificación de recibo: 404

## Resumen
- Intentos observados: 2
- Contestadas: 0 · perdidas confirmadas: 1
- Clic sin ruta: 0 · timbrados sin diálogo correlacionado: 1
- Sin desenlace concluyente: 1
- Detecciones de diálogo/botón: 1 / 1
- Bloqueos de autocontestación: 2 · clics: 0

## Intentos

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
