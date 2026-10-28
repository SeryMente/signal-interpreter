# Signal Interpreter — informe de cierre de llamada

- Estado de recolección: **complete**
- Referencia opaca: 0c5bab2262f3c639d6dae8f7
- Versión runtime: 0.10.36
- Modalidad/estado: OPI / completed
- Inicio: 2026-10-28T20:32:41.138Z
- Fin: 2026-10-28T20:33:38.248Z
- Duración observada / plataforma / facturable asumida (s): 57.11 / 55 / 55
- Ingreso estimado: 0.1833 USD
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
- Publicación del lote: 2026-10-28T20:33:58.649Z

## Diagnóstico de subtítulos
- Máximo de filas observado: 0
- Fragmentos nativos encaminados: 0
- Texto nativo fresco observado: false
- Preview de audio histórico (no permitido en 0.10.36): false
- Resultados de preview / con texto: 0 / 0
- Motivos registrados: ["spa-call-route-observed","target-changed","native-host-not-registered"]
- Montaje visible o ausencia de errores no prueban reconocimiento de voz.

## Cobertura y señales

- Eventos correlacionados: 226
- Warnings / errores / eventos fallidos-bloqueados: 7 / 0 / 6
- Muestras de rendimiento / media: 3 / 4
- Conteo por grupos: {"answerFlow":141,"other":16,"overlayActivation":16,"platformAndUi":17,"mediaAndCapture":5,"performanceAndNetwork":3,"transcriptionAndCaptions":16,"ratingAndClose":6,"billingAndEarnings":1,"observabilityPipeline":3,"microphoneAndSafety":1,"runtimeAndRecovery":1}

## Señales ausentes o incompletas


## Errores, advertencias y fallos

| Momento | Acción | Nivel | Categoría | Motivo |
|---|---|---|---|---|
| 2026-10-28T20:32:41.193Z | LIVE_CAPTION_OVERLAY_LOCAL_ROUTE_FALLBACK | warn | CAPTION | spa-call-route-observed |
| 2026-10-28T20:32:44.307Z | EARNINGS_OVERLAY_CHART_SYNC_ERROR | warn | RUNTIME |  |
| 2026-10-28T20:32:58.711Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-28T20:33:22.715Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-28T20:33:33.955Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-28T20:33:39.812Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-28T20:33:45.566Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |

## Privacidad

- Audio/transcripción crudos, texto de transcripción, HTML/CSS/JS completos y credenciales no forman parte del informe.
- Las estrellas indican visibilidad del prompt; no se infiere ni afirma un valor seleccionado ni un envío.
- Los IDs de llamada se sustituyen por una referencia opaca.
