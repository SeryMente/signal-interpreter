# Signal Interpreter — Extension

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


## Control de Auto-Answer por perfil y disponibilidad

**Versión de extensión: 0.9.15**

En cada ciclo de modificación de la extensión, este README debe leerse antes de editar y la versión de `extension/manifest.json` debe incrementarse.

Auto-Answer solo puede ejecutar **Connect** cuando se cumplen simultáneamente estas condiciones:

1. La pestaña está en `https://app.cloudinterpreter.com/profile/cmu2wuz1v0uwr07adbzb9djfz` (barra final opcional).
2. La página muestra **You are Online** / **Click to go Offline**.
3. Auto-Answer está habilitado.
4. La solicitud es OPI verificable; la política existente mantiene VRI bloqueado para Auto-Answer.

Fuera de ese perfil, o cuando el perfil está Offline/no confirmado, **no se pulsa Connect**.

### Indicadores visuales

- 🟢 Verde: Auto-Answer activo, perfil autorizado y **You are Online**.
- 🟡 Amarillo: perfil autorizado pero disponibilidad aún no confirmada.
- ⚫ Gris: perfil autorizado pero **You are Offline**.
- 🔴 Rojo: Auto-Answer desactivado.

El icono de la extensión se actualiza por pestaña mediante `chrome.action.setIcon()`; la pestaña del perfil autorizado también recibe un favicon de estado.
