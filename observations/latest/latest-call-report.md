# Signal Interpreter — informe de cierre de llamada

- Estado de recolección: **partial**
- Referencia opaca: c2cb64a50f7308bfd7aa1434
- Versión runtime: unknown
- Modalidad/estado: unknown / unknown
- Inicio: 2026-10-10T22:35:32.220Z
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
- Fragmentos nativos encaminados: 0
- Texto nativo fresco observado: false
- Preview de audio histórico (no permitido en 0.10.36): false
- Resultados de preview / con texto: 0 / 0
- Motivos registrados: ["call-route-not-authorized","spa-call-route-observed","target-changed","native-disconnect","native-host-not-registered","missing-api-key"]
- Montaje visible o ausencia de errores no prueban reconocimiento de voz.

## Cobertura y señales

- Eventos correlacionados: 347
- Warnings / errores / eventos fallidos-bloqueados: 6 / 0 / 4
- Muestras de rendimiento / media: 2 / 90
- Conteo por grupos: {"answerFlow":184,"other":14,"overlayActivation":19,"platformAndUi":15,"mediaAndCapture":91,"transcriptionAndCaptions":12,"ratingAndClose":1,"billingAndEarnings":1,"observabilityPipeline":2,"performanceAndNetwork":2,"microphoneAndSafety":3,"runtimeAndRecovery":3}

## Señales ausentes o incompletas

- call-end-timestamp-not-observed
- rating-stars-confirmation-not-observed
- final-observability-checkpoint-not-observed

## Errores, advertencias y fallos

| Momento | Acción | Nivel | Categoría | Motivo |
|---|---|---|---|---|
| 2026-10-10T22:35:32.536Z | LIVE_CAPTION_OVERLAY_ACTIVATION_BLOCKED | info | CAPTION | call-route-not-authorized |
| 2026-10-10T22:35:32.708Z | LIVE_CAPTION_OVERLAY_LOCAL_ROUTE_FALLBACK | warn | CAPTION | spa-call-route-observed |
| 2026-10-10T22:35:34.229Z | EARNINGS_OVERLAY_CHART_SYNC_ERROR | warn | RUNTIME |  |
| 2026-10-10T22:35:42.287Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-10T22:35:45.878Z | SIGNAL_CAPTION_PREVIEW_UNAVAILABLE | warn | LIVE_CAPTION | missing-api-key |
| 2026-10-10T22:36:10.354Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-10T22:36:35.995Z | SIGNAL_CAPTION_PREVIEW_UNAVAILABLE | warn | LIVE_CAPTION | missing-api-key |

## Privacidad

- Audio/transcripción crudos, texto de transcripción, HTML/CSS/JS completos y credenciales no forman parte del informe.
- Las estrellas indican visibilidad del prompt; no se infiere ni afirma un valor seleccionado ni un envío.
- Los IDs de llamada se sustituyen por una referencia opaca.
