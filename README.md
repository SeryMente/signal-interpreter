# Signal Interpreter

> **Frente de trabajo — núcleo operativo único:** [Objeto canónico de Signal Interpreter](docs/frentes/signal-interpreter/OBJETO-CANONICO.md). Gobierno, estado, pendientes y prompts vigentes en esa carpeta; [historia íntegra del sprint](docs/frentes/signal-interpreter/antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md). La ruta documental anterior es solo una remisión compatible, no otro estado.


Asistente independiente para interpretación médica en tiempo real sobre Cloud Interpreter.

## Candidata 0.10.37 — NO liberada para uso ni transcripción validada

La protección de contestación está en revisión y requiere aceptación Windows antes de sustituir una instalación activa. Arranca pausada; «Estoy disponible» necesita confirmación y un límite de inactividad elegido expresamente. Las opciones 1/3/5/10 minutos NO constituyen un valor predeterminado aprobado. Vídeo siempre manual; la contestación manual de la plataforma no se altera. El permiso Chrome `idle` consulta estado agregado de inactividad/bloqueo; no registra teclas, ratón, cámara o audio. Volver al equipo no rearma el automatismo. No se cuelga la llamada actual.

Pruebas locales/sintéticas no certifican presencia humana ni bloqueo/suspensión en Windows. Es obligatorio verificar el recorrido real y los casos de suspensión corta sin bloqueo antes de liberar. Una pausa conservadora después de reiniciar el worker es deliberada. [Alcance y evidencia de la candidata](docs/versions/0.10.37-candidata.md).

## Uso portable — Windows + Chrome

El **ZIP del repositorio** contiene la extensión cargable: `manifest.json` está en la **raíz** de la carpeta extraída, no dentro de `extension/`.

1. Extrae el ZIP en una carpeta estable y escribible. Finaliza cualquier llamada/prueba antes de instalar.
2. Haz doble clic en **INSTALAR.cmd**, en esa raíz. Verifica huellas/identidad y registra el puente incluido para tu usuario; no requiere Node/Python/compilador ni privilegios de administrador. No reinicia Chrome. `INSTALACION-RESULTADO.json` confirma preparación, no captions en vivo.
3. En Chrome, activa modo desarrollador y **Cargar descomprimida**: selecciona esa **misma raíz**. Desactiva otra copia anterior; no muevas la carpeta cargada.
4. Enciende Live Caption, cierra las pestañas Cloud Interpreter y pausa otros audios. Abre **Probar** en el popup; pulsa **Iniciar prueba** y luego reproducir. También puedes usar **PROBAR.cmd** si el perfil cargado se identifica sin ambigüedad.
5. Comprueba texto nativo y filas del panel, prueba abrir/cerrar la burbuja, y **Finalizar y exportar**. El fin del audio también solicita la descarga. Si cierras abruptamente la página, recupera **Descargar último informe** al reabrir.

Muestra de voz incluida y verificada por hash al instalar, o archivo local autorizado; no se sube audio/texto. El laboratorio no toma llamadas ni produce ingresos/exportación de producción. Una prueba local no certifica Cloud Interpreter; si Chrome destruye el árbol accesible al cerrar la burbuja, no se fabrica texto ni se captura audio como alternativa. Windows/Chrome deben tener Live Caption disponible; puede requerir sus propios modelos. MacOS y Linux no pertenecen al alcance del producto.

En cada computadora registra/carga la carpeta para su usuario Windows. Sin rutas fijas, servicios ni runtime de desarrollo; las preferencias locales no se sincronizan automáticamente entre equipos. Canon completo y límites: [antecedente del sprint](docs/frentes/signal-interpreter/antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md), §16.

## Arquitectura vigente 0.10.36 — exclusivamente texto nativo

**Live Caption nativo de Chrome → Windows UI Automation → puente Native Messaging → overlay de llamada**

La extensión no captura audio de pestaña ni micrófono, no transcribe con Groq y no reproduce conversación. Mensajes/configuración antiguos no reactivan esas rutas. Solo se preservan tonos breves preexistentes de los controles de mute; no son audio de llamada.

- Carriles **CLIENTE · ENGLISH / LEP · ESPAÑOL** por idioma del texto, no identificación de hablantes. No se inventa traducción si Chrome no produce texto en un idioma.
- Historial local de sesión, copiar/buscar, posición/tamaño, hotloading y controles de mute/ingresos conservados.
- El host lee texto oculto únicamente cuando Windows/Chrome aún lo exponen. Si al cerrar la burbuja Chrome destruye su árbol accesible, el panel lo informa; no sustituye la fuente por captura de audio.
- Observabilidad automática al cierre con retry persistente e informes actualizables por eventos tardíos, sin texto hablado/audio. La descarga manual de diagnóstico contiene únicamente metadatos.
- No necesita llave Groq. La consola conserva historial/notas anteriores y no es un capturador nuevo.

La carpeta distribuida contiene **manifest.json en su raíz**, y `INSTALAR.cmd` prepara el host para el mismo usuario Windows que Chrome. Preparación, activación y prueba en vivo son compuertas diferentes. La prueba real en PC-8 permanece **NO VERIFICADA** mientras el dispositivo no responda al conector.

## Funciones Cloud

Auto-Answer, OPI/VRI, Online/Offline, llamadas perdidas, cronómetros, ingresos, USD/MXN, overlay, espejo de pantallas, telemetría persistente/exportable y sonido continúan siendo específicos de app.cloudinterpreter.com.

## Carga local

En chrome://extensions activa Developer mode y usa Load unpacked sobre la raíz que contiene manifest.json, nunca sobre extension/.

Para el overlay de Live Caption, los artefactos adicionales viven íntegramente en extension/native/. El registro del host se realiza una vez por usuario con extension/native/register-caption-host.ps1.

No se instala un servicio de Windows, Scheduled Task, watchdog ni servidor localhost.

## Pruebas

Pruebas de la ruta nativa: tools/live-caption-core-test.mjs, tools/live-caption-bridge-tests.mjs, tools/caption-lab-test.mjs y auditorías. Las pruebas Groq son históricas y no prueban la transcripción vigente.
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
