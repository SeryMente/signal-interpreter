# Signal Interpreter

Asistente independiente para interpretación médica en tiempo real sobre Cloud Interpreter.

## Arquitectura de transcripción

La transcripción durable de Signal Interpreter sigue esta ruta:

**Audio de pestaña + micrófono → MediaRecorder → Groq Whisper → CLIENTE / YO → persistencia por sesión → consola LIVE**

Además, el overlay de subtítulos de llamada utiliza una ruta híbrida:

**Chrome Live Caption → puente nativo mínimo (cuando la burbuja expone texto) → overlay**

y, para completar el idioma que Chrome Live Caption no transcriba, mantiene un preview bilingüe de audio de pestaña en paralelo; si esa opción se desactiva, conserva el fallback cuando el caption nativo queda obsoleto:

**Audio de pestaña → fragmentos de 1.8 s → preview Groq con detección inglés/español → overlay**

El preview es efímero: no se persiste en el timeline durable ni se incorpora al paquete de observabilidad. La preferencia liveCaptionBilingualTabEnabled lo mantiene en paralelo a los captions nativos por defecto; liveCaptionInterpreterEnabled controla por separado la fuente de micrófono del LEP, siempre sujeta a verificación de mute.

- **CLIENTE:** audio de la pestaña activa.
- **YO:** micrófono físico.
- Ambos se convierten en audio WebM y se envían a Groq Speech-to-Text.
- La extensión usa whisper-large-v3-turbo por defecto y permite seleccionar whisper-large-v3.
- Las respuestas con segmentos y timestamps se incorporan al timeline y a la persistencia de Signal Interpreter.
- La API key se guarda en la configuración local de la extensión y se redacta en los diagnósticos exportados.

## Funciones Cloud

Auto-Answer, OPI/VRI, Online/Offline, llamadas perdidas, cronómetros, ingresos, USD/MXN, overlay, espejo de pantallas, telemetría persistente/exportable y sonido continúan siendo específicos de app.cloudinterpreter.com.

## Carga local

En chrome://extensions activa Developer mode y usa Load unpacked sobre la carpeta extension/.

Para el overlay de Live Caption, los artefactos adicionales viven íntegramente en extension/native/. El registro del host se realiza una vez por usuario con extension/native/register-caption-host.ps1.

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


## Overlay de subtítulos (0.10.27)

La versión 0.10.27 corrige la atribución de hablantes: Cloud Interpreter usa el canal de audio comprobado (pestaña = cliente; micrófono = LEP) y no infiere la identidad del hablante solo por el idioma detectado. Mantiene captions bilingües desde micrófono verificado, fragmentos de 1.8 s y no fuerza la activación del micrófono. Para el video de prueba autorizado, el popup permite iniciar y detener una captura de audio de pestaña independiente; no utiliza el micrófono ni incorpora segmentos a la transcripción oficial. Teléfonos y direcciones detectados se pueden copiar con un clic; Ctrl+clic abre Google Maps para direcciones y una búsqueda en Google para teléfonos; Ctrl+Mayús+clic consulta términos en Linguee; Ctrl+clic sobre texto común no abre búsquedas. El manifiesto declara `clipboardWrite` para reforzar la copia literal cuando se usa el fallback `execCommand('copy')`, que Chrome recomienda para extensiones. Las búsquedas se abren mediante el service worker y destinos permitidos.

El overlay conserva su historial desplazable, controles para mover/redimensionar, posición automática y alcance source-only/all-tabs. El historial hablado se retiene en chrome.storage.session, no en almacenamiento local duradero. Consulta docs/versions/0.10.27.md para el alcance, los controles y los límites de validación.
