# Signal Interpreter — informe de cierre de llamada

- Estado de recolección: **complete**
- Referencia opaca: 8ea080429a9f8b168fc75859
- Versión runtime: 0.10.36
- Modalidad/estado: OPI / completed
- Inicio: 2026-10-22T21:20:22.273Z
- Fin: 2026-10-22T21:20:47.929Z
- Duración observada / plataforma / facturable asumida (s): 25.656 / 0 / 25.656
- Ingreso estimado: 0.0855 USD
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
- Publicación del lote: 2026-10-22T21:22:05.954Z

## Diagnóstico de subtítulos
- Máximo de filas observado: 0
- Fragmentos nativos encaminados: 0
- Texto nativo fresco observado: false
- Preview de audio histórico (no permitido en 0.10.36): false
- Resultados de preview / con texto: 0 / 0
- Motivos registrados: ["spa-call-route-observed","target-changed","native-host-not-registered"]
- Montaje visible o ausencia de errores no prueban reconocimiento de voz.

## Cobertura y señales

- Eventos correlacionados: 157
- Warnings / errores / eventos fallidos-bloqueados: 4 / 0 / 3
- Muestras de rendimiento / media: 1 / 29
- Conteo por grupos: {"answerFlow":71,"other":6,"overlayActivation":15,"platformAndUi":12,"mediaAndCapture":30,"ratingAndClose":6,"performanceAndNetwork":1,"transcriptionAndCaptions":10,"billingAndEarnings":1,"observabilityPipeline":3,"microphoneAndSafety":1,"runtimeAndRecovery":1}

## Señales ausentes o incompletas


## Errores, advertencias y fallos

| Momento | Acción | Nivel | Categoría | Motivo |
|---|---|---|---|---|
| 2026-10-22T21:20:22.850Z | LIVE_CAPTION_OVERLAY_LOCAL_ROUTE_FALLBACK | warn | CAPTION | spa-call-route-observed |
| 2026-10-22T21:20:25.368Z | EARNINGS_OVERLAY_CHART_SYNC_ERROR | warn | RUNTIME |  |
| 2026-10-22T21:20:57.749Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:21:44.806Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |

## Privacidad

- Audio/transcripción crudos, texto de transcripción, HTML/CSS/JS completos y credenciales no forman parte del informe.
- Las estrellas indican visibilidad del prompt; no se infiere ni afirma un valor seleccionado ni un envío.
- Los IDs de llamada se sustituyen por una referencia opaca.
