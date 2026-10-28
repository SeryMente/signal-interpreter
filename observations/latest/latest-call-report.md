# Signal Interpreter — informe de cierre de llamada

- Estado de recolección: **complete**
- Referencia opaca: c9bbd678bf00dbf7968b2fcf
- Versión runtime: 0.10.36
- Modalidad/estado: OPI / completed
- Inicio: 2026-10-28T21:39:34.784Z
- Fin: 2026-10-28T21:40:12.630Z
- Duración observada / plataforma / facturable asumida (s): 37.846 / 0 / 37.846
- Ingreso estimado: 0.1262 USD
- Fin por: rating-route

## Confirmación de calificación

- Ruta de calificación observada: true
- Estrellas visibles confirmadas: true
- Método de detección: star-class-or-title-heuristic
- Valor seleccionado observado: false
- Envío de valoración observado: false
- Checkpoint final entregado al paquete: true

## Entrega automática
- Checkpoint recibido: true
- Disparador del lote: call-ended
- Envío automático: true
- Publicación del lote: 2026-10-28T21:41:25.501Z

## Diagnóstico de subtítulos
- Máximo de filas observado: 0
- Fragmentos nativos encaminados: 0
- Texto nativo fresco observado: false
- Preview de audio histórico (no permitido en 0.10.36): false
- Resultados de preview / con texto: 0 / 0
- Motivos registrados: ["spa-call-route-observed","target-changed","native-host-not-registered"]
- Montaje visible o ausencia de errores no prueban reconocimiento de voz.

## Cobertura y señales

- Eventos correlacionados: 207
- Warnings / errores / eventos fallidos-bloqueados: 6 / 2 / 6
- Muestras de rendimiento / media: 2 / 41
- Conteo por grupos: {"answerFlow":92,"other":12,"overlayActivation":14,"platformAndUi":14,"mediaAndCapture":42,"performanceAndNetwork":2,"microphoneAndSafety":7,"transcriptionAndCaptions":12,"ratingAndClose":6,"billingAndEarnings":1,"observabilityPipeline":3,"runtimeAndRecovery":2}

## Señales ausentes o incompletas


## Errores, advertencias y fallos

| Momento | Acción | Nivel | Categoría | Motivo |
|---|---|---|---|---|
| 2026-10-28T21:39:35.234Z | LIVE_CAPTION_OVERLAY_LOCAL_ROUTE_FALLBACK | warn | CAPTION | spa-call-route-observed |
| 2026-10-28T21:39:38.311Z | EARNINGS_OVERLAY_CHART_SYNC_ERROR | warn | RUNTIME |  |
| 2026-10-28T21:39:58.173Z | EXTENSION_MICROPHONE_UI_ERROR | error | RUNTIME |  |
| 2026-10-28T21:39:59.437Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-28T21:40:37.348Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-28T21:40:43.923Z | EXTENSION_MICROPHONE_MUTE_ERROR | error | RUNTIME |  |
| 2026-10-28T21:40:49.259Z | EXTENSION_MICROPHONE_OUTPUT_HEARTBEAT_VERIFY_DEFERRED | warn | RUNTIME |  |
| 2026-10-28T21:40:53.975Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |

## Privacidad

- Audio/transcripción crudos, texto de transcripción, HTML/CSS/JS completos y credenciales no forman parte del informe.
- Las estrellas indican visibilidad del prompt; no se infiere ni afirma un valor seleccionado ni un envío.
- Los IDs de llamada se sustituyen por una referencia opaca.
