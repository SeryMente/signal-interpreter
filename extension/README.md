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


### Garantía operativa del indicador y confirmación de contestación

El indicador verde de la barra de extensiones es **fail-closed**: no representa solamente que la extensión esté cargada. Solo se activa cuando, simultáneamente:

1. La pestaña coincide exactamente con el perfil autorizado.
2. El DOM de Cloud Interpreter confirma **You are Online** / **Click to go Offline**.
3. Auto-Answer está habilitado.
4. El content script de la versión actual reporta explícitamente estado **ready**.
5. El reporte de readiness tiene una antigüedad máxima de 5 segundos.

El icono activo usa un **check blanco sobre verde** y badge **ON**. Si cualquiera de las condiciones deja de estar confirmada, el indicador deja de mostrar estado activo.

La confirmación de que una llamada fue contestada por Auto-Answer tampoco depende del simple hallazgo de un diálogo entrante ni del clic en **Connect**. La confirmación válida requiere:

- haber ejecutado el Connect de Auto-Answer;
- permanecer dentro de una ventana de confirmación válida;
- detectar el cambio real de ruta desde el perfil autorizado a `/call/<ID>`;
- confirmar esa transición antes de emitir el aviso de contestación.

El sonido de contestación y el aviso de voz **“Llamada entrante.”** se disparan únicamente después de esa confirmación. El clic en Connect por sí solo ya no genera el beep.

Si Connect no produce la ruta `/call/<ID>` dentro del watchdog, se registra un **CONNECT_ROUTE_TIMEOUT** y no se presenta la llamada como contestada.

La ruta `/call/<ID>` sin una secuencia previa válida de Auto-Answer no se presenta como una contestación automática confirmada.

**Objetivo operativo:** ante incertidumbre, la extensión debe preferir mostrar estado no confirmado y avisar de fallo antes que presentar un falso positivo de “contestada”.
