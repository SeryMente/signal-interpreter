# Signal Interpreter

> **Frente de trabajo — núcleo operativo único:** [Objeto canónico de Signal Interpreter](docs/frentes/signal-interpreter/OBJETO-CANONICO.md). Gobierno, estado, pendientes y prompts vigentes en esa carpeta; [historia íntegra del sprint](docs/frentes/signal-interpreter/antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md). La ruta documental anterior es solo una remisión compatible, no otro estado.


Asistente independiente para interpretación médica en tiempo real sobre Cloud Interpreter.

## Uso portable — Windows + Chrome · 0.10.38

El ZIP de `main` contiene la extensión cargable: `manifest.json` está en la **raíz** de la carpeta extraída, no dentro de `extension/`.

1. Descarga el ZIP de `main` y extráelo en una carpeta estable y escribible. No lo extraigas encima de una versión anterior ni mezcles carpetas.
2. Fuera de una llamada activa y con la misma cuenta de Windows que ejecuta Chrome, ejecuta **`PREPARAR-Y-CARGAR.cmd`**. Este ejecuta `INSTALAR.ps1`, valida la identidad y los SHA-256, prepara y prueba el ejecutable Native Messaging, lo instala en `%LOCALAPPDATA%\SignalInterpreter\NativeMessagingHost` y registra el manifiesto en HKCU. No requiere una instalación separada del puente, Node.js, Python, compilador ni privilegios de administrador. No reinicia Chrome.
3. En `chrome://extensions`, activa el modo desarrollador y elige **Cargar descomprimida**. Selecciona la **raíz extraída** que contiene `manifest.json`; no selecciones `extension/` ni muevas la carpeta después de cargarla. Desactiva una copia anterior de Signal Interpreter para evitar duplicados.
4. Comprueba que Chrome muestra la versión `0.10.38`. El atajo global es `Ctrl+Shift+8`; no se incorpora `Ctrl+Shift+Y`.
5. La prueba en vivo corresponde al operador: confirma que Live Caption nativo de Windows/Chrome está activo y verifica los segmentos inglés/español, la continuidad del overlay y el comportamiento de presencia en una sesión controlada. La prueba del protocolo Native Messaging y el recibo `INSTALACION-RESULTADO.json` **no prueban** captions reales ni aceptación de una llamada.

### Puente Native Messaging

No ejecutes por separado `extension/native/register-caption-host.ps1` en la versión 0.10.38. El instalador raíz ya materializa el ejecutable, genera el manifiesto estable, registra HKCU y hace el probe del host instalado. La preparación es por usuario de Windows: debe ser la misma cuenta que utiliza Chrome. Después de preparar el puente, todavía debes cargar la carpeta raíz en Chrome; esa carga no la realiza el instalador.

La extensión utiliza texto nativo de Live Caption → Windows UI Automation → puente Native Messaging → overlay de llamada. No captura audio de pestaña ni del micrófono, no usa Groq como fallback y no reproduce conversación. La segmentación lingüística no identifica hablantes; los fragmentos ambiguos permanecen sin asignar. Windows/Chrome deben exponer el texto nativo para que SI pueda mostrarlo.

La prueba real en Windows/Chrome permanece **NO VERIFICADA** hasta que el operador la ejecute y reporte PASS/FAIL, versión/SHA y telemetría saneada. No compartir texto ni audio de llamadas.

## Funciones Cloud

Auto-Answer, OPI/VRI, Online/Offline, llamadas perdidas, cronómetros, ingresos, USD/MXN, overlay, espejo de pantallas, telemetría persistente/exportable y sonido continúan siendo específicos de app.cloudinterpreter.com.

## Carga local

En 0.10.38, usa **Cargar descomprimida** sobre la carpeta raíz que contiene `manifest.json`. Ejecuta primero `PREPARAR-Y-CARGAR.cmd` (o `INSTALAR.cmd`) para que `INSTALAR.ps1` prepare y registre automáticamente el puente incluido. No ejecutes manualmente `extension/native/register-caption-host.ps1` en este flujo.

No se instala un servicio de Windows, Scheduled Task, watchdog ni servidor localhost.

## Pruebas

La prueba de transcripción está en tools/groq-transcriber-tests.mjs y valida endpoint, modelo, parámetros de Groq, segmentos y redacción de credenciales.
## Persistencia automática de observabilidad

La observabilidad de Signal Interpreter cubre dos planos: telemetría de la propia extensión y observación superficial de Cloud Interpreter.

- La extensión observa reactivamente el uso real de `app.cloudinterpreter.com` y conserva los eventos en IndexedDB.
- El envío se dispara por eventos críticos, umbral, ventana temporal y una alarma periódica de aproximadamente 1 minuto.
- Los batches saneados se publican **directamente desde Chrome a GitHub** en `observations/inbox/`; no existe servidor local intermedio.
- GitHub Actions transforma el inbox en batches históricos, snapshots, deltas, índices, manifest y health remoto.
- La observación de plataforma conserva evidencia estructurada sobre URL, DOM/HTML renderizado, CSS, JavaScript entregado al navegador, recursos, controles y cambios observables, sin almacenar secretos, cuerpos de red ni código server-side privado.
- La observación distingue evidencia observada, inferencia, hipótesis y desconocido.
- El paquete derivado alimenta obligatoriamente el siguiente ciclo de desarrollo mediante un delta semántico.
- No se requieren Node.js residente, Native Messaging, Scheduled Tasks, watchdogs, supervisores, hosts nativos ni servidores `localhost` en Windows.

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
