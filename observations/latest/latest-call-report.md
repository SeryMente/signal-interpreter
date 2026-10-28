# Signal Interpreter — informe de cierre de llamada

- Estado de recolección: **complete**
- Referencia opaca: d6b7954e31282b3e6fcd3f8b
- Versión runtime: 0.10.36
- Modalidad/estado: OPI / completed
- Inicio: 2026-10-28T21:48:42.061Z
- Fin: 2026-10-28T21:49:08.878Z
- Duración observada / plataforma / facturable asumida (s): 26.817 / 25 / 25
- Ingreso estimado: 0.0833 USD
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
- Publicación del lote: 2026-10-28T21:50:59.671Z

## Diagnóstico de subtítulos
- Máximo de filas observado: 0
- Fragmentos nativos encaminados: 0
- Texto nativo fresco observado: false
- Preview de audio histórico (no permitido en 0.10.36): false
- Resultados de preview / con texto: 0 / 0
- Motivos registrados: ["spa-call-route-observed","target-changed","native-host-not-registered"]
- Montaje visible o ausencia de errores no prueban reconocimiento de voz.

## Cobertura y señales

- Eventos correlacionados: 170
- Warnings / errores / eventos fallidos-bloqueados: 5 / 0 / 3
- Muestras de rendimiento / media: 3 / 30
- Conteo por grupos: {"answerFlow":73,"other":12,"overlayActivation":15,"platformAndUi":14,"mediaAndCapture":31,"performanceAndNetwork":3,"ratingAndClose":6,"transcriptionAndCaptions":10,"billingAndEarnings":1,"observabilityPipeline":3,"microphoneAndSafety":1,"runtimeAndRecovery":1}

## Señales ausentes o incompletas


## Errores, advertencias y fallos

| Momento | Acción | Nivel | Categoría | Motivo |
|---|---|---|---|---|
| 2026-10-28T21:48:42.230Z | LIVE_CAPTION_OVERLAY_LOCAL_ROUTE_FALLBACK | warn | CAPTION | spa-call-route-observed |
| 2026-10-28T21:48:48.279Z | EARNINGS_OVERLAY_CHART_SYNC_ERROR | warn | RUNTIME |  |
| 2026-10-28T21:49:27.285Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-28T21:50:27.736Z | EXTENSION_MICROPHONE_OUTPUT_HEARTBEAT_VERIFY_DEFERRED | warn | RUNTIME |  |
| 2026-10-28T21:50:33.512Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |

## Privacidad

- Audio/transcripción crudos, texto de transcripción, HTML/CSS/JS completos y credenciales no forman parte del informe.
- Las estrellas indican visibilidad del prompt; no se infiere ni afirma un valor seleccionado ni un envío.
- Los IDs de llamada se sustituyen por una referencia opaca.
