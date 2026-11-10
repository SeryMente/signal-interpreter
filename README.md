# Signal Interpreter

> **Frente de trabajo — núcleo operativo único:** [Objeto canónico de Signal Interpreter](docs/frentes/signal-interpreter/OBJETO-CANONICO.md). Gobierno, estado, pendientes y prompts vigentes en esa carpeta; [historia íntegra del sprint](docs/frentes/signal-interpreter/antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md). La ruta documental anterior es solo una remisión compatible, no otro estado.


Asistente independiente para interpretación médica en tiempo real sobre Cloud Interpreter.

## Uso del workspace — Windows + Chrome · 0.10.47

El manifiesto canónico del repositorio permanece en la raíz (manifest.json). Para el workspace SI-OP-02 también existe una variante normalizada en extension/manifest.json. La carpeta que debe cargarse en Chrome es signal-interpreter/extension, no la raíz del repositorio.

1. Mantén el repositorio completo en %USERPROFILE%\Desktop\SeryMente\signal-interpreter.
2. En chrome://extensions, activa el modo desarrollador y elige Cargar descomprimida. Selecciona %USERPROFILE%\Desktop\SeryMente\signal-interpreter\extension, donde manifest.json está directamente en la raíz.
3. No extraigas encima de una instalación anterior. Conserva una copia reversible y verifica versión e inventario antes de sustituir archivos.
4. El Native Messaging host se prepara según SI-OP-01 y debe registrarse en el perfil Windows que ejecuta Chrome. La mera copia del directorio no demuestra que el host esté instalado.
5. Comprueba que Chrome muestra la versión 0.10.47. La carga/reload es manual del operador y debe hacerse fuera de una llamada activa. No se reinicia Chrome desde RDC.
6. La aceptación en vivo es del operador: prueba presencia, Auto-Answer y micrófono en una llamada controlada. Los tests sintéticos y el probe Native Messaging no equivalen a aceptación E2E.

### Puente Native Messaging

No ejecutes por separado `extension/native/register-caption-host.ps1` en la versión 0.10.39. El instalador raíz ya materializa el ejecutable, genera el manifiesto estable, registra HKCU y hace el probe del host instalado. La preparación es por usuario de Windows: debe ser la misma cuenta que utiliza Chrome. Después de preparar el puente, todavía debes cargar la carpeta raíz en Chrome; esa carga no la realiza el instalador.

La extensión utiliza texto nativo de Live Caption → Windows UI Automation → puente Native Messaging → overlay de llamada. No captura audio de pestaña ni del micrófono, no usa Groq como fallback y no reproduce conversación. La segmentación lingüística no identifica hablantes; los fragmentos ambiguos permanecen sin asignar. Windows/Chrome deben exponer el texto nativo para que SI pueda mostrarlo.

La prueba real en Windows/Chrome permanece **NO VERIFICADA** hasta que el operador la ejecute y reporte PASS/FAIL, versión/SHA y telemetría saneada. No compartir texto ni audio de llamadas.

## Funciones Cloud

Auto-Answer, OPI/VRI, Online/Offline, llamadas perdidas, cronómetros, ingresos, USD/MXN, overlay, espejo de pantallas, telemetría persistente/exportable y sonido continúan siendo específicos de app.cloudinterpreter.com.

## Carga local

En el workspace 0.10.47, usa **Cargar descomprimida** sobre extension/, que contiene el manifiesto normalizado. En el ZIP portable de distribución se debe seguir el README incluido en ese paquete específico. Prepara el Native Messaging host conforme a SI-OP-01 y verifica registro y protocolo bajo el mismo usuario Windows de Chrome. No ejecutes el instalador de un paquete antiguo sobre este workspace.

No se instala un servicio de Windows, Scheduled Task, watchdog ni servidor localhost.

## Pruebas

La prueba de transcripción está en tools/groq-transcriber-tests.mjs y valida endpoint, modelo, parámetros de Groq, segmentos y redacción de credenciales.
## Persistencia automática de observabilidad

La observabilidad de Signal Interpreter cubre dos planos: telemetría de la propia extensión y observación superficial de Cloud Interpreter.

- La extensión observa reactivamente el uso real de `app.cloudinterpreter.com` y conserva los eventos en IndexedDB.
- El envío se dispara por eventos críticos, umbral, ventana temporal y una alarma periódica de aproximadamente 1 minuto.
- Los batches saneados salen de Chrome hacia el **relay HTTPS de Vercel**, que los valida y publica en GitHub (`observations/inbox/`) usando `GITHUB_TOKEN` solo en el entorno de servidor. No existe servidor local intermedio ni se entrega ese token a la extensión.
- GitHub Actions transforma el inbox en batches históricos, snapshots, deltas, índices, manifest y health remoto.
- La observación de plataforma conserva evidencia estructurada sobre URL, DOM/HTML renderizado, CSS, JavaScript entregado al navegador, recursos, controles y cambios observables, sin almacenar secretos, cuerpos de red ni código server-side privado.
- La observación distingue evidencia observada, inferencia, hipótesis y desconocido.
- El paquete derivado alimenta obligatoriamente el siguiente ciclo de desarrollo mediante un delta semántico.
- No se requieren Node.js residente, Native Messaging, Scheduled Tasks, watchdogs, supervisores, hosts nativos ni servidores `localhost` en Windows.

### Diagnóstico de llamadas entrantes y autocontestador · 0.10.39

La captura del diálogo y del botón `Connect` funciona aunque la acción automática esté bloqueada. Cada intento registra un `attemptId`, modalidad, estado del botón, readiness desglosado, motivo de bloqueo, autorización, clic, ruta de llamada y desenlace. El guard de presencia continúa siendo fail-closed: tras reinicio del worker, pérdida de continuidad, inactividad/bloqueo o cambio de configuración, hay que re-confirmar disponibilidad desde el popup. No se desactiva ni se rearma automáticamente.

El informe móvil de los últimos diez minutos se publica en:

- `observations/latest/incoming-calls-10m.md`: resumen humano por intento.
- `observations/latest/incoming-calls-10m.json`: timeline, latencias, estado de botón/readiness y señales ausentes.

Solo cuenta una llamada como perdida con `MISSED_CALL_CLASSIFIED`. Timbrado sin diálogo se etiqueta `ring_unmatched`; clic sin ruta es `connect_failed_no_route`; los intentos sin evidencia terminal permanecen inconclusos. No se confunde la señal de timbrado con una llamada perdida.

Cada batch incluye `relayReceivedAt` estampado por el servidor para medir la recepción y corregir el desfase del reloj del equipo. Health usa límites de 2 minutos (fresh), 5 minutos (stale), señala lotes pendientes y divergencia de versión. El workflow `observability-freshness` comprueba la frescura cada dos minutos.

La aceptación de producción exige además la prueba del operador en Chrome con la versión 0.10.39, presencia rearmada, estado online, candado de laboratorio apagado y una llamada OPI controlada. CI con DOM sintético no prueba una llamada real ni reemplaza esa aceptación.

La arquitectura canónica está documentada en `docs/OBSERVABILITY-ARCHITECTURE-BROWSER-GITHUB-v2.md`.



## Auto-recuperación y diagnóstico del overlay (0.10.29)

La activación de los dos paneles tiene etapas observables: detección de ruta, reconciliación de contexto, montaje del DOM/Shadow DOM, confirmación de visibilidad y recuperación. El overlay de subtítulos trata una ruta real `/call/<ID>` como evidencia local válida mientras el estado del service worker se sincroniza, y reintenta el saludo cuando el runtime falla. Un watchdog de ruta SPA verifica el montaje durante una llamada. El panel de ingresos cuenta con un watchdog independiente del observador de Auto-Answer/telemetría, por lo que esos ajustes no pueden impedir que detecte la llamada.

Los eventos de diagnóstico incluyen razón de bloqueo, estado del contexto, pestaña de origen conocida, conexión del host, Shadow DOM, visibilidad, tamaño del panel, fallos/reintentos y antigüedad del último caption. El paquete por llamada conserva estos eventos en el grupo `overlayActivation`. Se omiten el texto transcrito, audio, credenciales y rutas con el ID bruto de llamada.

## Informe automático después de la llamada

Cuando Signal Interpreter detecta la pantalla de estrellas de calificación, registra el evento explícito `CALL_RATING_STARS_CONFIRMED`. Al cerrar la llamada, incluye un checkpoint final con el registro de duración e ingresos y drena el transporte de observabilidad hasta el número de secuencia de cierre, o conserva ese objetivo para reintentar.

GitHub Actions genera o actualiza:

- `observations/latest/latest-call-report.md`: resumen de lectura rápida para la siguiente sesión de trabajo.
- `observations/latest/latest-call-report.json`: informe estructurado completo.
- `observations/call-reports/index.json`: índice de informes por referencia opaca.
- `observations/call-reports/YYYY-MM-DD/`: historial por llamada.

Los informes incluyen duración observada/plataforma/facturable asumida, modalidad, estado y fuente de cierre, ingreso estimado, errores y warnings, cobertura de audio/micrófono/transcripción, métricas de rendimiento/red, señales de plataforma y runtime, evidencia de estrellas visibles y datos que faltan. La categoría `complete` requiere el checkpoint final; de lo contrario, el reporte queda `partial` y enumera las lagunas.

La presencia de estrellas no prueba qué puntuación se seleccionó ni que se envió. El reporte omite audio y transcripciones crudas, secretos, credenciales y el ID bruto de la llamada. No requiere un servicio local ni un endpoint Vercel nuevo.

## Overlay de subtítulos (0.10.28 — registro histórico, micrófono fuera del alcance vigente)

La versión 0.10.28 corrige la atribución de hablantes: Cloud Interpreter usa el canal de audio comprobado (pestaña = cliente; micrófono = LEP) y no infiere la identidad del hablante solo por el idioma detectado. Mantiene captions bilingües desde micrófono verificado, fragmentos de 1.8 s y no fuerza la activación del micrófono. Para el video de prueba autorizado, el popup permite iniciar y detener una captura de audio de pestaña independiente; no utiliza el micrófono ni incorpora segmentos a la transcripción oficial. Teléfonos y direcciones detectados se pueden copiar con un clic; Ctrl+clic abre Google Maps para direcciones y una búsqueda en Google para teléfonos; Ctrl+Mayús+clic consulta términos en Linguee; Ctrl+clic sobre texto común no abre búsquedas. El manifiesto declara `clipboardWrite` para reforzar la copia literal cuando se usa el fallback `execCommand('copy')`, que Chrome recomienda para extensiones. Las búsquedas se abren mediante el service worker y destinos permitidos.

El overlay conserva su historial desplazable, controles para mover/redimensionar, posición automática y alcance source-only/all-tabs. El historial hablado se retiene en chrome.storage.session, no en almacenamiento local duradero. Consulta docs/versions/0.10.28.md para el alcance, los controles y los límites de validación.

## Histórico superado: corrección de transcripción 0.10.32 — exclusivamente audio entrante

El relato único del esfuerzo y sus límites está en [el documento canónico](docs/frentes/signal-interpreter/antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md#13-alcance-vigente--calidad-de-vida-para-interpretación-telefónica). El preview de llamada puede funcionar sin consola ni sesión durable; no solicita ni captura el micrófono. Prepare el host y la clave local con `extension/PREPARE-CAPTIONS.cmd` bajo su cuenta Windows normal, fuera de una llamada, y recargue la extensión. Si Chrome exige invocación, abrir el popup existente en la pestaña de Cloud Interpreter reintenta la captura.

Los informes de cierre exponen `captionDiagnosis` y `exportEvidence`; la publicación del checkpoint no espera a consultas de ingresos. La evidencia de audio sintético/fixtures no sustituye una llamada real en Cloud Interpreter.

## Histórico: hotloading del overlay 0.10.33

La recuperación reinyecta núcleo y overlay en pestañas Cloud existentes y verifica versión/host montado mediante un probe. Reemplazar el runtime desmonta listeners, timers y observadores anteriores; el historial se rehidrata sin duplicar el panel. La recarga coordinada conserva el contexto de llamada y se bloquea si no verifica la pestaña o una vía de recuperación configurada. No recarga la página de llamada ni captura el micrófono.

La carpeta nueva puede prepararse en el escritorio con Chrome abierto, separada de la extensión cargada. Prepararla no significa activarla: el aplicador clásico requiere Chrome cerrado. Los permisos de Chrome y una llamada real siguen siendo compuertas de aceptación, no garantías inferidas de pruebas. El relato y la instrucción literal están en el documento canónico §14.

Para preparar solo el host de una carpeta staged, `tools/prepare-caption-device.ps1` requiere StageRoot y una cuenta normal **no administrativa** idéntica al dueño de Chrome. Conserva todas las compuertas, verifica payload/registro y genera DEVICE-PREPARATION-RESULT.json con metadatos, nunca voz/texto. No cambia la carpeta activa ni recarga Chrome; Prepared=true tampoco prueba activación de la extensión o reconocimiento en vivo.

## Muestra incluida en el laboratorio · 0.10.36

`INSTALAR.cmd` prepara y verifica automáticamente el audio incluido; ya no genera voz sintética ni depende de voces SAPI. `Probar` reproduce por defecto el segmento continuo **16:02–20:43.6 (281.6 s)** de la práctica de hernia aportada por el operador: médico/cliente, paciente LEP e interpretaciones inglés/español. No hace falta descargar YouTube, elegir un archivo ni instalar codecs o runtimes. La atribución y huella están en `extension/ui/sample.json`; el audio portátil está en `sample.ogg.b64` y se materializa como `sample.ogg` con PowerShell/.NET. El informe identifica `bundled-sample`, separado de `local-file`. La recepción nativa real sigue pendiente: reproducción de audio no equivale a subtítulos visibles.

## Organización de frentes y recursos

El OCP observado para este repositorio está en [`docs/frentes/signal-interpreter/`](docs/frentes/signal-interpreter/README.md). Se conserva esta ruta histórica, declarada por el propio frente; no se mueve a `frentes/` solo para uniformidad. El código, las capturas, los datos y las herramientas de producto siguen en sus áreas existentes y no se interpretan como frentes independientes solo por ser directorios o archivos numerosos.
