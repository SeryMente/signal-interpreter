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

La observabilidad operativa de Signal Interpreter tiene un contrato de persistencia explícito:

- La extensión conserva los eventos en IndexedDB y dispara el envío por eventos críticos, umbral, ventana y alarma periódica.
- Los batches enviados al reporter local se escriben primero de forma durable antes de confirmar su recepción.
- El reporter mantiene un spool independiente del repositorio de desarrollo para que un reset, checkout o conflicto de código no destruya telemetría pendiente.
- La publicación usa un repositorio Git aislado, reintenta los pushes y dispone de fallback mediante GitHub API para el batch más reciente.
- Un Scheduled Task reinicia el reporter y un watchdog supervisa continuamente el endpoint local.
- La ruta de desarrollo puede verificarse mediante el self-test de extremo a extremo que publica un batch deliberado en `main`.
