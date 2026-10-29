# Signal Interpreter — informe de cierre de llamada

- Estado de recolección: **complete**
- Referencia opaca: ee5b2df05fa82e48c1c3ae39
- Versión runtime: 0.10.37
- Modalidad/estado: OPI / completed
- Inicio: 2026-10-29T16:42:41.340Z
- Fin: 2026-10-29T16:47:40.729Z
- Duración observada / plataforma / facturable asumida (s): 299.389 / 297 / 297
- Ingreso estimado: 0.99 USD
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
- Publicación del lote: 2026-10-29T17:00:17.198Z

## Diagnóstico de subtítulos
- Máximo de filas observado: 21
- Fragmentos nativos encaminados: 145
- Texto nativo fresco observado: true
- Preview de audio histórico (no permitido en 0.10.36): false
- Resultados de preview / con texto: 0 / 0
- Motivos registrados: ["spa-call-route-observed","target-changed","native-connected","native-text-not-exposed","native-caption-stale","native-caption"]
- Montaje visible o ausencia de errores no prueban reconocimiento de voz.

## Cobertura y señales

- Eventos correlacionados: 3956
- Warnings / errores / eventos fallidos-bloqueados: 4 / 0 / 2
- Muestras de rendimiento / media: 21 / 603
- Conteo por grupos: {"answerFlow":2899,"other":87,"overlayActivation":46,"platformAndUi":89,"mediaAndCapture":604,"performanceAndNetwork":21,"transcriptionAndCaptions":169,"ratingAndClose":10,"billingAndEarnings":2,"observabilityPipeline":5,"microphoneAndSafety":12,"runtimeAndRecovery":12}

## Señales ausentes o incompletas


## Errores, advertencias y fallos

| Momento | Acción | Nivel | Categoría | Motivo |
|---|---|---|---|---|
| 2026-10-29T16:42:41.898Z | LIVE_CAPTION_OVERLAY_LOCAL_ROUTE_FALLBACK | warn | CAPTION | spa-call-route-observed |
| 2026-10-29T16:42:44.513Z | EARNINGS_OVERLAY_CHART_SYNC_ERROR | warn | RUNTIME |  |
| 2026-10-29T16:42:47.014Z | EARNINGS_OVERLAY_CHART_SYNC_ERROR | warn | RUNTIME |  |
| 2026-10-29T16:42:53.017Z | EARNINGS_OVERLAY_RECOVERY_ATTEMPTED | warn | RUNTIME | call-lifecycle-not-active |

## Privacidad

- Audio/transcripción crudos, texto de transcripción, HTML/CSS/JS completos y credenciales no forman parte del informe.
- Las estrellas indican visibilidad del prompt; no se infiere ni afirma un valor seleccionado ni un envío.
- Los IDs de llamada se sustituyen por una referencia opaca.
