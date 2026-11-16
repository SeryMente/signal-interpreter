# Mapa Vivo del Repositorio — Signal Interpreter

> **Corte estático de código:** main SHA **8a096410101634a86e5042e6a75c9f617660577b**, leído inmediatamente antes de crear la rama Sprint 1. manifest.json declara **0.10.52**. Este documento describe lo que está declarado y cableado en ese SHA; no afirma que cada función haya sido aceptada en Windows/Chrome.
>
> Convención: **HECHO** = observado directamente en fuente, manifiesto, workflow o artefacto versionado; **INFERENCIA** = lectura técnica compatible con esos hechos; **No verificable / Falta información** = no existe evidencia suficiente.

## 1) Cómo está construido

### 1.1 Empaquetado y punto de entrada

- **HECHO:** manifest.json es Manifest V3, versión 0.10.52, con service worker extension/background.js. Blob: 87b67f7f35b13c9403ecf5f7a3039f642e4245e7.
- **HECHO:** el paquete portable tiene el manifiesto en la raíz. README.md instruye cargar la carpeta raíz extraída; tools/portable-root-test.mjs exige que exista manifest.json raíz y que no exista extension/manifest.json. La carpeta extension/ contiene implementación, no el root cargable.
- **HECHO:** background.js importa presence-guard.js, live-caption-core.js, live-caption-bridge.js, dialogue-engine.js, telemetry-db.js, observability-relay.js, observation-sync.js, platform-screenshot.js, auth-bootstrap.js y caption-lab.js. Blob: 04025393a947f5537f8c744297ee4a3dfeb89c79.
- **HECHO:** manifest.json inyecta mic-guard-main.js en MAIN-world, document_start, all_frames:true para Cloud Interpreter; live-caption-core.js, live-caption-overlay.js y content.js en ISOLATED-world para Cloud Interpreter; gestos/atajos globales ISOLATED en páginas HTTP/S; y el asistente de signin en la ruta de autenticación.
- **HECHO:** extension/mic-guard-main.js es el guard MAIN-world que envuelve métodos de RTCPeerConnection, RTCRtpSender y MediaStreamTrack; blob de61d78afab7b6f8fe99d5fe02b260ae0f686e37.
- **HECHO:** extension/content.js aporta el runtime de página Cloud Interpreter, Auto-Answer/readiness y envío de eventos al background; blob 3c742c573f23c6bc7e1f34b264dc2637f668aa5b.
- **HECHO:** extension/live-caption-core.js normaliza y segmenta texto, con clasificación lingüística por segmento; blob d776a1dec977f28f66232f63442f3ac87c5a3f7d. Idioma/segmentación no es una identidad de hablante.
- **HECHO:** extension/live-caption-overlay.js implementa presentación/controles del overlay; blob a2b75e3ffa251e550799bdc827c7d116f7847d7d.
- **HECHO:** extension/live-caption-bridge.js abre Native Messaging mediante chrome.runtime.connectNative(HOST_NAME), escucha mensajes/desconexión y reintenta; blob be05913506dafeaa3a59d271ca2d21e57deaaa4a.
- **HECHO:** bridge/windows-uia/ contiene el host Windows UI Automation. La implementación C# y el protocolo se compilan/validan por .github/workflows/native-caption-host.yml; este Sprint no modificó ni ejecutó el host.
- **HECHO:** extension/offscreen.js devuelve captureScope:"native-text-only" para el estado de captura y rechaza mensajes de inicio de captura/reproducción de audio de conversación; blob 512307b7d6050b8b8a45f995e5be7d6082a4555f. La página se usa para cues locales; no es un grabador de llamada.
- **HECHO:** extension/groq-transcriber.js existe como helper de transcripción HTTP a Groq, pero no forma parte del importScripts(...) de background.js. Blob 504b6dfd7d32e5b94de52e2f56e84bb5981e4834.

### 1.2 Flujos de datos, audio y mensajería

**Texto de Live Caption (runtime nativo actual):**

Windows/Chrome Live Caption → Windows UI Automation → Native Messaging host (bridge/windows-uia) → live-caption-bridge.js → background/content runtime → live-caption-core.js → overlay

- **HECHO:** el bridge usa connectNative; el service worker recibe estado/eventos, y el core segmenta texto. La existencia del host y el paso de protocolo se validan en CI, pero la exposición de texto real de Windows/Chrome requiere aceptación manual.
- **No verificable / Falta información:** el repositorio no prueba que Windows/Chrome expusiera captions en una sesión real concreta al momento de este corte.

**Protección del micrófono de llamada:**

background.js → chrome.scripting.executeScript / MAIN-world command → mic-guard-main.js → RTCPeerConnection senders/tracks

- **HECHO:** manifiesto carga el guard en todos los frames; el comando del background en la base tiene operaciones dirigidas a frameIds:[0]. Esta divergencia está registrada como INC-001.
- **HECHO:** el guard distingue el preflight local de getUserMedia() de una pista que entra a un sender RTP; la política de salida controla pistas/senders WebRTC.
- **Invariante:** no abrir el micrófono fuera de llamada activa; si no existe pista saliente viva y verificable, fail-closed.

**Eventos/observabilidad:**

content/background → telemetry-db.js (IndexedDB) → observation-sync.js (batch sanitizado) → observability-relay.js → HTTPS Vercel Relay → GitHub observations/inbox → GitHub Actions → observations/batches, manifest, health, deltas y reports

- **HECHO:** observation-sync.js define MAX_BATCH=200, EVENT_THRESHOLD=50, MIN_GAP_MS=10000; elimina/omite claves que podrían contener audio, transcripción cruda, HTML, credenciales, etc. Blob 91d92ca492b1f9fd41313715b12506d96db44424.
- **HECHO:** tools/observability-relay/api/batch.js usa GITHUB_TOKEN en servidor, escribe en SeryMente/signal-interpreter/main, agrega relayReceivedAt y fija MAX_EVENTS=200, MAX_BODY_BYTES=4200000, MAX_SCREENSHOT_BYTES=2500000. Blob 9112c015f0e4494cff5aec431ba0f6b8bbd69b8e.
- **HECHO:** workflows observability-build.yml (inbox/cron cada 5 min), observability-freshness.yml (cada 2 min) y observability-audit.yml (pull request y cambios a main) reconstruyen/validan paquetes e informes.
- **HECHO:** el token de escritura GitHub es leído por el relay desde process.env.GITHUB_TOKEN; no está embebido en la extensión.
- **No verificable / Falta información:** los límites de código no prueban por sí solos los límites del deployment Vercel actualmente activo.

### 1.3 Estructura operativa relevante

- manifest.json: identidad, permisos, service worker y content scripts.
- extension/: background/content, guard, caption core/bridge/overlay, offscreen, UI, telemetry y helpers.
- bridge/windows-uia/: host nativo Windows.
- tools/: tests sintéticos, auditorías estáticas, verificación de paquetes, scripts de preparación y pipeline de observabilidad.
- tools/observability-relay/: Vercel Relay API.
- .github/workflows/: package, package integrity, audit, build/freshness de observabilidad y build/protocolo de host nativo.
- observations/: evidencia derivada y paquetes de telemetría; sus commits automáticos no deben confundirse con cambios de producto.

## 2) Qué SÍ está construido y activo en runtime hoy en main

El término **activo** aquí significa que está declarado, importado o conectado al runtime de la extensión por el manifiesto/código de main. No significa que exista prueba de aceptación real para cada función.

1. **Live Caption de texto nativo:** integración Native Messaging y procesamiento de captions que Windows/Chrome exponga; segmentación lingüística y overlay.
2. **Guard MAIN-world de micrófono:** envoltura de métodos WebRTC para rastrear senders/tracks y aplicar mute seguro; existe una brecha conocida de alcance por frames en las órdenes del background (INC-001).
3. **Cloud page runtime y Auto-Answer guardado por estado:** detección de ruta/diálogo/readiness, validación de perfil/autorización/disponibilidad/presencia; el estado no habilita respuesta sin compuertas válidas.
4. **Presence guard:** estado explícito de disponibilidad, revocación por condiciones de seguridad y validación del permiso antes de Auto-Answer.
5. **Overlay y controles:** renderizado de captions, interacción, hotkeys/gestos globales, panel y popup declarados en el manifiesto.
6. **Preflight local de micrófono y salida sintética de audio de pestaña:** helpers de prueba local; la captura de diagnóstico no se convierte en audio saliente de la llamada.
7. **Earnings/call lifecycle y sincronización Cloud:** código/runtime para medir tiempo, estado y datos de ingresos, con tests de regresión.
8. **Login bootstrap y Caption Lab:** módulos importados/declarados para asistencia de signin y pruebas aisladas con muestra incluida.
9. **Observabilidad automática:** IndexedDB, sanitización, relay de Vercel y generación de reportes/manifest/health/deltas mediante Actions.
10. **Instalación portable:** instalador raíz verifica el paquete/inventario, prepara el Native Messaging host, registra la identidad/origen y realiza probe de protocolo.

**Límite obligatorio de lectura:** los tests del repositorio son unitarios, sintéticos o estáticos. No demuestran por sí solos una llamada real, audio real, calidad acústica, captions visibles en un equipo específico o aceptación funcional del operador.

## 3) Qué NO está construido o está apagado/pendiente

- **Groq ASR de audio de llamada:** no está activo en main. background.js implementa startGroqCapture() devolviendo reasonCode:"native-text-only"; handleGroqAudioChunk() rechaza la fuente no nativa. No se captura audio de conversación para enviarlo a Groq.
- **Captura remota de audio de pestaña para transcripción en llamada:** apagada/no implementada como ruta activa; las funciones de preview están bloqueadas con native-text-only.
- **Captura del micrófono del intérprete para transcripción bilingüe:** no está conectada al runtime de main. Su diseño dual separado y la fusión cronológica están en tareas/PR de trabajo, no en el runtime activo.
- **Diarización/identificación biométrica:** no está construida; idioma o voz no autorizan inferir LEP/proveedor/identidad.
- **Playback/replay o grabación de conversación:** no está habilitada en el flujo de transcripción nativo actual.
- **groq-transcriber.js:** existe en el árbol, pero no está importado por background.js; el default model del helper no demuestra uso activo.
- **PR #84:** abierta/draft y fuera de main en este corte; dual-source Groq sigue candidata no aceptada. HEAD observado 6b14c0fad64cbc8eef364c496a6a96043c9dbbf1.
- **PR #97:** abierta/draft y fuera de main; candidata de micrófono all-frames/legacy hotload/emergency release. HEAD fc4114792551d175a2208405ad01dbd36bbd4590. El CI verde de esa candidata no es prueba de runtime en main ni prueba real.
- **ZDR de Groq:** No verificable / Falta información; la mera presencia de flags/helper/checkbox no prueba la configuración efectiva del proveedor.
- **Aceptación Windows/Chrome tras una nueva carga y llamada controlada:** pendiente. Este Sprint 1 no cargó Chrome ni intervino llamadas.
- **Versión realmente cargada durante el incidente PC14:** No verificable / Falta información. El paquete local 0.10.53, la telemetría 0.10.50 y el main 0.10.52 son evidencias distintas (INC-008).

## 4) Inventario de documentos históricos y desfases conocidos

| Documento / artefacto | Estado de lectura en el corte | Regla para siguientes sprints |
|---|---|---|
| docs/frentes/signal-interpreter/OBJETO-CANONICO.md | Núcleo operativo único; el corte superior 2026-11-15 prevalece sobre snapshots históricos inferiores | Leer primero y respetar la sección/corte vigente; las secciones antiguas no son estado actual |
| docs/TRANSCRIPTION-SPRINT-CANONICAL.md | Ruta histórica de entrada; remite al OCP y al antecedente TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md | No usar como gobierno ni estado vivo |
| docs/frentes/signal-interpreter/antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md | Antecedente histórico íntegro | Consultar solo para rastrear decisiones, no para inferir versiones o permisos actuales |
| docs/frentes/signal-interpreter/BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md | Backlog provisional con SI-FB/SI-REG y estados de cortes anteriores | No considerar el estado histórico de cada tarea actual sin cotejar código/PR/CI del SHA presente |
| docs/OBSERVABILITY-RELAY-VERCEL-SETUP.md | **Desfase confirmado:** indica 1.5 MB | El handler fuente del corte define 4,200,000 bytes por batch y 2,500,000 bytes por screenshot; reconciliar con deployment real antes de usar límites operativos |
| README.md raíz | Indica 0.10.52 y cargar carpeta raíz con manifest | Es la instrucción de layout para el SHA de main documentado aquí |
| extension/README.md | Contiene secciones versionadas 0.10.52, 0.10.51, 0.10.38 y 0.10.35 | Leer encabezados/versiones de sección; las entradas menores son históricas, no el runtime vigente |
| PROBAR.ps1 | **Desfase confirmado:** exige 0.10.47 en main y en la copia PC14 examinada | No confiar en él hasta alinearlo con manifiesto/instalador; INC-003 |
| tools/portable-root-test.mjs | Confirma layout raíz; declara ausente extension/manifest.json | Usar como candado de estructura, no como prueba de Chrome cargado |
| manifest.json de main vs carpeta PC14 extraída | main 0.10.52; paquete local PC14 0.10.53 | No equiparar paquete local con main o runtime; falta recibo de instalación |
| observations/manifest.json + health | Runtime reportado 0.10.50; esperado 0.10.52; recibo no disponible | No usar telemetría como prueba de versión efectiva hasta reparar INC-002 |

El análisis detallado de archivos, conflictos de contenido y orden mínimo de portabilidad de PR #97 para Sprint 2 está en [ANALISIS-PORTABILIDAD-PR97.md](ANALISIS-PORTABILIDAD-PR97.md).

**Regla de precedencia documental:** para hechos actuales, el SHA y los archivos del repositorio prevalecen sobre prosa histórica. Para estados de acceptance, el read-back del operador prevalece sobre el paquete construido. Los antecedentes explican por qué existe una decisión, pero no reviven una autorización ni sustituyen evidencia actual.
