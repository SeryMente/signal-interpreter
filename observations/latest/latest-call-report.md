# Signal Interpreter — informe de cierre de llamada

- Estado de recolección: **complete**
- Referencia opaca: d001e9d9cfc8c83ccb4e4cc2
- Versión runtime: 0.10.36
- Modalidad/estado: OPI / completed
- Inicio: 2026-10-21T01:17:27.806Z
- Fin: 2026-10-21T01:26:32.520Z
- Duración observada / plataforma / facturable asumida (s): 544.714 / 543 / 543
- Ingreso estimado: 1.81 USD
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
- Disparador del lote: critical
- Envío automático: true
- Publicación del lote: 2026-10-21T01:31:08.466Z

## Diagnóstico de subtítulos
- Máximo de filas observado: 57
- Fragmentos nativos encaminados: 354
- Texto nativo fresco observado: true
- Preview de audio histórico (no permitido en 0.10.36): false
- Resultados de preview / con texto: 0 / 0
- Motivos registrados: ["call-route-not-authorized","spa-call-route-observed","target-changed","native-connected","native-text-not-exposed","native-caption-stale","native-caption"]
- Montaje visible o ausencia de errores no prueban reconocimiento de voz.

## Cobertura y señales

- Eventos correlacionados: 3096
- Warnings / errores / eventos fallidos-bloqueados: 2 / 0 / 2
- Muestras de rendimiento / media: 19 / 548
- Conteo por grupos: {"answerFlow":1911,"other":46,"overlayActivation":51,"platformAndUi":64,"mediaAndCapture":549,"transcriptionAndCaptions":400,"ratingAndClose":6,"billingAndEarnings":1,"observabilityPipeline":3,"performanceAndNetwork":19,"microphoneAndSafety":23,"runtimeAndRecovery":23}

## Señales ausentes o incompletas


## Errores, advertencias y fallos

| Momento | Acción | Nivel | Categoría | Motivo |
|---|---|---|---|---|
| 2026-10-21T01:17:28.036Z | LIVE_CAPTION_OVERLAY_ACTIVATION_BLOCKED | info | CAPTION | call-route-not-authorized |
| 2026-10-21T01:17:28.509Z | LIVE_CAPTION_OVERLAY_LOCAL_ROUTE_FALLBACK | warn | CAPTION | spa-call-route-observed |
| 2026-10-21T01:17:28.889Z | EARNINGS_OVERLAY_CHART_SYNC_ERROR | warn | RUNTIME |  |

## Privacidad

- Audio/transcripción crudos, texto de transcripción, HTML/CSS/JS completos y credenciales no forman parte del informe.
- Las estrellas indican visibilidad del prompt; no se infiere ni afirma un valor seleccionado ni un envío.
- Los IDs de llamada se sustituyen por una referencia opaca.
