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

La observabilidad de Signal Interpreter tiene un contrato de persistencia explícito y cubre dos planos: telemetría de la propia extensión y observación superficial de Cloud Interpreter.

- La extensión conserva eventos en IndexedDB y dispara el envío por eventos críticos, umbral, ventana y una alarma periódica independiente de los reintentos, con cadencia de 1 minuto.
- Los batches enviados al reporter local se escriben primero de forma durable antes de confirmar su recepción.
- La ruta de publicación usa un spool independiente del repositorio de desarrollo, un publisher Git aislado, reintentos, watchdog y fallback mediante GitHub API.
- Los eventos de plataforma conservan payload estructurado suficiente para reconstruir contexto, URL, superficie DOM, CSS, JavaScript entregado al cliente, recursos y pistas de framework sin almacenar código server-side privado ni secretos.
- El reporter genera snapshots de superficie en `observations/platform-snapshots/`, historial de deltas semánticos en `observations/platform-deltas/`, e índices en `observations/platform-index.json` y `observations/platform-latest.json`.
- `observations/manifest.json` funciona como índice de paquete para el siguiente ciclo de desarrollo.
- La observación de navegación es reactiva al uso real del usuario; no se ejecuta crawling masivo, fuzzing ni bypass de controles.
- La captura distingue evidencia observada de inferencia y aplica minimización/redacción antes de publicar.
- Un Scheduled Task reinicia el reporter y otro watchdog supervisa su salud y recuperación bajo el perfil operativo `fila4`.
- El pipeline puede verificarse mediante el self-test de extremo a extremo sin contaminar el puntero `latest` de telemetría real.

Consulta `docs/OBSERVABILITY-COVERAGE-MATRIX-v1.md` y `docs/OBSERVABILITY-DELTA-PROTOCOL-v1.md` para el contrato de cobertura y el protocolo de aprendizaje incremental.
