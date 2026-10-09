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

## Inicio de sesión automático de Cloud Interpreter (0.10.15)

Al instalar o actualizar la extensión, y al iniciar Chrome, Signal Interpreter comprueba la sesión sin reemplazar las pestañas existentes. Si ya hay una pestaña de perfil o llamada autenticada, no abre otra. En caso contrario, examina en segundo plano la ruta de acceso; si sigue mostrando el formulario de inicio de sesión, esa misma pestaña nueva se activa.

En Más controles → Acceso a Cloud Interpreter, guarda el usuario o correo. Se almacena localmente como cloudInterpreterLoginUsername, separado de la configuración y la telemetría. En /auth/signin, la extensión completa el usuario y enfoca la contraseña. La contraseña se introduce manualmente y la extensión no la lee ni la persiste.

## Pruebas

La prueba de transcripción está en tools/groq-transcriber-tests.mjs y valida endpoint, modelo, parámetros de Groq, segmentos y redacción de credenciales.


## Control de Auto-Answer por perfil y disponibilidad

**Versión de extensión: 0.10.15**

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


### v0.9.16 — Trazabilidad de exportaciones de observabilidad

Esta versión conserva el historial del último intento de exportación de observabilidad, incluyendo hora, secuencia, modo, resultado y error cuando el puente GitHub no está disponible. Un fallo de Native Messaging ya no queda únicamente como mensaje efímero del popup: se persiste en `chrome.storage.local` mediante `effectifObservabilityExportAttempt`, mientras que `effectifObservabilityExport` conserva el último éxito confirmado. Esto permite distinguir un último éxito de un último intento fallido sin perder el checkpoint anterior.


### v0.9.17 — Indicador visible y diagnóstico real del puente GitHub

Esta versión hace dos correcciones operativas:

- El indicador de la extensión se inicializa también en las pestañas de Cloud Interpreter aunque todavía no exista el perfil autorizado o no se haya confirmado disponibilidad; el estado activo continúa reservado exclusivamente al perfil autorizado, Auto-Answer habilitado, disponibilidad Online y readiness fresco.
- La detección de disponibilidad acepta las variantes visibles de controles Online/Offline que utiliza la interfaz, sin convertir un estado desconocido en Online.
- La exportación manual conserva el diagnóstico local, pero ya no convierte cualquier excepción de Native Messaging en el mensaje genérico de "falta instalar el puente". Si el host no está registrado se informa específicamente de esa condición; si el host existe pero falla al arrancar, se muestra el error real.

**Importante:** la exportación de observabilidad de GitHub utiliza el host Native Messaging `com.serymente.signal_interpreter.observability`. Ese host debe estar instalado y registrado en Windows para publicar directamente desde la extensión. La extensión no debe fingir que una instalación inexistente es un fallo de GitHub.


### v0.9.18 — Inicialización determinista del indicador

La versión 0.9.18 corrige un defecto de ciclo de vida del indicador de la barra de herramientas: el indicador se recalcula explícitamente después de la inicialización del service worker y después de una instalación/actualización de la extensión, por lo que no depende de que el usuario cambie de pestaña o active otra pestaña para empezar a mostrar estado.

También corrige el patrón de detección de disponibilidad para que `status: online` y `status: offline` reconozcan correctamente los espacios mediante `\s`.

La revisión del entorno local confirmó además que el host Native Messaging `com.serymente.signal_interpreter.observability` no está registrado en Chrome y no existe una instalación local identificable de ese host. El directorio `bridge/windows-uia` del repositorio es otro componente: corresponde al lector histórico de Chrome Live Caption/Windows UI Automation y **no implementa** el host de exportación GitHub. Por tanto, la exportación directa a GitHub sigue dependiendo de instalar ese host específico; la extensión ya no debe atribuir ese estado a un problema genérico de GitHub.
### v0.9.19 — Restauración del host de exportación GitHub

Esta versión restaura la ruta operativa existente para exportar observabilidad directamente a GitHub:

- El host nativo se publica como ejecutable autocontenido en `%USERPROFILE%\\.signal-interpreter\\observability-native`.
- El instalador registra `com.serymente.signal_interpreter.observability` para Chrome mediante Native Messaging.
- El host reutiliza la autenticación existente de GitHub CLI (`gh auth`) y no almacena tokens en el código.
- El instalador descubre automáticamente una extensión desempaquetada válida que contenga `manifest.json`, en lugar de asumir únicamente `Desktop\\Signal-Interpreter-Extension`.
- El origen de la extensión queda restringido mediante `allowed_origins`, sin comodines.

La implementación existente del repositorio ya contiene el host, el protocolo stdio y la publicación mediante GitHub CLI; la regresión estaba en la instalación/registro local del host, no en la necesidad de crear un puente nuevo.

### v0.9.20 — Overlay de ingresos por llamada y periodos

Esta versión concentra el flujo de ingresos en el overlay que solo se muestra dentro de https://app.cloudinterpreter.com/call/<ID>:

- Al entrar a una llamada, sincroniza silenciosamente el ingreso oficial del día mediante el endpoint autenticado fetchInterpreterLogs ejecutado desde el contexto de la pestaña de la llamada.
- No abre, crea, navega ni recarga una pestaña de Statistics para obtener los datos oficiales.
- El overlay calcula en tiempo real el ingreso acumulado del día y el incremento de la llamada activa usando timestamps de milisegundos; la interfaz se repinta cada 100 ms.
- El overlay permite consultar Hoy, Este mes y Mes pasado; los rangos históricos se solicitan por fecha al mismo endpoint silencioso.
- Permite cambiar entre MXN y USD. La conversión MXN usa exclusivamente una tasa USD/MXN confirmada para la fecha local de hoy; la tasa se actualiza al iniciar la llamada y mediante la alarma horaria existente.
- La consulta de currentMonth también se precarga al inicio de cada llamada para que el botón sea inmediato.

### v0.9.21 — Integridad del cálculo vivo y reconciliación de ingresos

Esta versión endurece el flujo sin introducir un subsistema adicional de persistencia:

- Las sincronizaciones oficiales de ingresos y las escrituras del espejo de plataforma pasan por una única cola, evitando pérdidas por read-modify-write concurrente en `chrome.storage.local`.
- Al iniciar una llamada se captura un checkpoint aislado de ingresos del día y del mes; mientras la llamada está activa, ese checkpoint permanece inmutable y el backend ya no puede mover la base que se suma al contador vivo.
- Al terminar una llamada, se reconcilian oficialmente Hoy y Este mes antes de liberar cualquier actualización de runtime diferida.
- El overlay detecta cambio de fecha local y solicita una sola actualización de FX y de los rangos necesarios; no consulta red cada 100 ms.
- USD continúa siendo la magnitud canónica y MXN se muestra solo con una tasa USD/MXN confirmada para la fecha local actual.

### v0.9.22 — Histórico oficial y clasificación de llamadas

Esta versión amplía el overlay sin sustituir los datos oficiales por estimaciones locales:

- **Mes pasado:** el ingreso se extrae de un rango cerrado completo, desde las 00:00:00.000 del primer día hasta las 23:59:59.999 del último día del mes anterior, mediante `fetchInterpreterLogs` autenticado y `outputTimeZone` de la página.
- **Mes actual:** el botón Este mes incorpora una gráfica pequeña de barras por día con una línea de tendencia; cada día se obtiene de forma independiente desde `fetchInterpreterLogs`. El día actual incorpora la llamada viva sin alterar los días históricos.
- **Año:** se añade un botón Año con barras mensuales combinadas de ingreso y minutos trabajados, usando escalas independientes para no mezclar unidades.
- **Estados de llamadas:** una llamada solo entra como completada cuando se observan realmente los controles de estrellas en la ruta `/rate`. Si se abandona la llamada sin esa confirmación, se registra como **no terminada**. Las solicitudes que nunca pasan a una llamada se clasifican como **perdidas** cuando expira/cierra el diálogo sin conexión.
- El overlay muestra **Completadas / No terminadas / Perdidas / Total** por el periodo seleccionado; una llamada activa se incluye en Total como llamada en curso.
- Las sincronizaciones de detalle de gráficas se mantienen dentro de la misma cola de ingresos para evitar carreras de almacenamiento.

### v0.9.23 — Persistencia automática de observabilidad

Esta versión convierte la telemetría de desarrollo en un flujo persistente y supervisado:

- La extensión ejecuta el flush automático por alarma, además del flush por ventana, umbral y eventos críticos.
- Los flush concurrentes se serializan para evitar batches duplicados o carreras sobre el checkpoint de secuencia.
- Si el endpoint local falla, la extensión conserva el estado pendiente y programa reintentos con backoff.
- El reporter escribe primero el batch en disco; la observabilidad queda durable localmente antes de responder a la extensión.
- El publisher utiliza un clone Git aislado del repositorio de desarrollo, por lo que cambios locales de código no pueden bloquear el push de telemetría.
- El publisher arranca sincronizando cualquier backlog existente, reintenta los pushes y dispone de fallback directo mediante GitHub API.
- Un Scheduled Task mantiene el reporter activo con reinicio automático y un watchdog adicional recupera procesos colgados en el puerto 8788.
- El health endpoint expone el último intento, último éxito GitHub, secuencia publicada, errores y estado de cola.
- El self-test de extremo a extremo confirma que un batch llega a GitHub main de forma automática.