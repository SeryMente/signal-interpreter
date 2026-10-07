# Signal Interpreter

Asistente independiente para interpretación médica en tiempo real sobre Cloud Interpreter.

## Arquitectura de transcripción

La ruta de transcripción ya no utiliza Chrome Live Caption, Windows UI Automation ni un bridge local.

El flujo activo es:

**Audio de pestaña + micrófono → MediaRecorder → Groq Whisper → CLIENTE / YO → persistencia por sesión → consola LIVE**

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

No es necesario ejecutar ningún proceso de bridge local.

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

