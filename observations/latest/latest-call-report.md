# Signal Interpreter — informe de cierre de llamada

- Estado de recolección: **complete**
- Referencia opaca: 7b382bef3b0fb33ad99bbe8d
- Versión runtime: 0.10.36
- Modalidad/estado: OPI / unfinished
- Inicio: 2026-10-22T21:33:05.736Z
- Fin: 2026-10-22T21:37:34.201Z
- Duración observada / plataforma / facturable asumida (s): 268.465 / 0 / 268.465
- Ingreso estimado: 0.8949 USD
- Fin por: reconcile-no-call-route

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
- Publicación del lote: 2026-10-22T21:44:05.605Z

## Diagnóstico de subtítulos
- Máximo de filas observado: 8
- Fragmentos nativos encaminados: 44
- Texto nativo fresco observado: true
- Preview de audio histórico (no permitido en 0.10.36): false
- Resultados de preview / con texto: 0 / 0
- Motivos registrados: ["spa-call-route-observed","target-changed","native-host-not-registered","native-connected","native-caption-stale","native-caption","native-text-not-exposed"]
- Montaje visible o ausencia de errores no prueban reconocimiento de voz.

## Cobertura y señales

- Eventos correlacionados: 1201
- Warnings / errores / eventos fallidos-bloqueados: 21 / 0 / 18
- Muestras de rendimiento / media: 8 / 262
- Conteo por grupos: {"answerFlow":682,"other":43,"overlayActivation":32,"platformAndUi":39,"mediaAndCapture":263,"performanceAndNetwork":8,"transcriptionAndCaptions":99,"ratingAndClose":8,"billingAndEarnings":1,"observabilityPipeline":2,"microphoneAndSafety":12,"runtimeAndRecovery":12}

## Señales ausentes o incompletas


## Errores, advertencias y fallos

| Momento | Acción | Nivel | Categoría | Motivo |
|---|---|---|---|---|
| 2026-10-22T21:33:05.849Z | LIVE_CAPTION_OVERLAY_LOCAL_ROUTE_FALLBACK | warn | CAPTION | spa-call-route-observed |
| 2026-10-22T21:33:09.641Z | EARNINGS_OVERLAY_CHART_SYNC_ERROR | warn | RUNTIME |  |
| 2026-10-22T21:33:45.811Z | EARNINGS_OVERLAY_ACTIVATION_BLOCKED | warn | RUNTIME | preference-disabled |
| 2026-10-22T21:33:58.446Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:34:06.637Z | EARNINGS_OVERLAY_NOT_VISIBLE | warn | RUNTIME | host-not-visible |
| 2026-10-22T21:35:13.660Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:35:35.255Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:36:00.952Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:36:38.546Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:36:56.968Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:37:12.335Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:37:31.034Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:37:46.844Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:37:59.594Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:38:21.455Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:38:36.408Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:38:48.798Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:39:07.356Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:39:25.538Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:39:38.985Z | SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR | warn | LIVE_CAPTION | native-host-not-registered |
| 2026-10-22T21:43:28.749Z | EXTENSION_MICROPHONE_OUTPUT_HEARTBEAT_VERIFY_DEFERRED | warn | RUNTIME |  |

## Privacidad

- Audio/transcripción crudos, texto de transcripción, HTML/CSS/JS completos y credenciales no forman parte del informe.
- Las estrellas indican visibilidad del prompt; no se infiere ni afirma un valor seleccionado ni un envío.
- Los IDs de llamada se sustituyen por una referencia opaca.
