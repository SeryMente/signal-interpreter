# Signal Interpreter — informe de cierre de llamada

- Estado de recolección: **partial**
- Referencia opaca: ce92e5f74717e118a530ee0a
- Versión runtime: unknown
- Modalidad/estado: unknown / unknown
- Inicio: 2026-10-10T22:03:31.668Z
- Fin: no observado
- Duración observada / plataforma / facturable asumida (s): unknown / unknown / unknown
- Ingreso estimado: unknown
- Fin por: unknown

## Confirmación de calificación

- Ruta de calificación observada: false
- Estrellas visibles confirmadas: false
- Método de detección: unknown
- Valor seleccionado observado: false
- Envío de valoración observado: false
- Checkpoint final entregado al paquete: false

## Entrega automática
- Checkpoint recibido: false
- Disparador del lote: no observado
- Envío automático: false
- Publicación del lote: no observada

## Diagnóstico de subtítulos
- Máximo de filas observado: 0
- Texto nativo fresco observado: false
- Respaldo independiente iniciado: false
- Resultados de preview / con texto: 0 / 0
- Motivos registrados: ["spa-call-route-observed","target-changed","native-disconnect","native-host-not-registered","missing-api-key"]
- Montaje visible o ausencia de errores no prueban reconocimiento de voz.

## Cobertura y señales

- Eventos correlacionados: 463
- Warnings / errores / eventos fallidos-bloqueados: 7 / 0 / 3
- Muestras de rendimiento / media: 5 / 133
- Conteo por grupos: {"answerFlow":236,"other":18,"overlayActivation":22,"platformAndUi":21,"mediaAndCapture":134,"performanceAndNetwork":5,"transcriptionAndCaptions":13,"ratingAndClose":1,"billingAndEarnings":1,"observabilityPipeline":2,"microphoneAndSafety":5,"runtimeAndRecovery":5}

## Señales ausentes o incompletas

- call-end-timestamp-not-observed
- rating-stars-confirmation-not-observed
- final-observability-checkpoint-not-observed

## Errores, advertencias y fallos

| Momento | Acción | Nivel | Categoría | Motivo |
|---|---|---|---|---|
| 2026-10-10T22:03:31.729Z | LIVE_CAPTION_OVERLAY_LOCAL_ROUTE_FALLBACK | warn | CAPTION | spa-call-route-observed |
| 2026-10-10T22:03:33.557Z | EARNINGS_OVERLAY_CHART_SYNC_ERROR | warn | RUNTIME |  |
| 2026-10-10T22:03:41.495Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-10T22:03:45.988Z | SIGNAL_CAPTION_PREVIEW_UNAVAILABLE | warn | LIVE_CAPTION | missing-api-key |
| 2026-10-10T22:04:06.542Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-10T22:04:44.991Z | SIGNAL_CAPTION_PREVIEW_UNAVAILABLE | warn | LIVE_CAPTION | missing-api-key |
| 2026-10-10T22:05:23.779Z | SIGNAL_CAPTION_PREVIEW_UNAVAILABLE | warn | LIVE_CAPTION | missing-api-key |

## Privacidad

- Audio/transcripción crudos, texto de transcripción, HTML/CSS/JS completos y credenciales no forman parte del informe.
- Las estrellas indican visibilidad del prompt; no se infiere ni afirma un valor seleccionado ni un envío.
- Los IDs de llamada se sustituyen por una referencia opaca.
