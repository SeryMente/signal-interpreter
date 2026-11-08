# Preparación de la candidata Signal Interpreter 0.10.45

**Estado: CANDIDATA — NO LIBERADA.** No usar para sustituir una instalación activa ni ejecutar durante una llamada. Esperar aprobación de la revisión exacta y abrir una ventana de mantenimiento confirmada sin llamada.

## Preparación e instalación

1. Descarga/extrae el paquete en una carpeta estable para esta candidata. Conserva copia de seguridad de la instalación y de la ruta activa actual; no mezcles archivos entre versiones.
2. Abre PowerShell con el usuario de Windows que ejecuta Chrome. Desde la raíz del paquete, ejecuta `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\INSTALAR.ps1` o `PREPARAR-Y-CARGAR.cmd`. El instalador debe validar manifiesto, identidad, inventario SHA-256, host nativo, registro Native Messaging y protocolo antes de informar éxito. Si cualquier compuerta falla, detén la instalación y conserva la versión anterior.
3. En Chrome abre `chrome://extensions`, activa el modo desarrollador y usa **Cargar descomprimida**. Selecciona la raíz que contiene `manifest.json`, no la subcarpeta `extension\`.
4. Comprueba en el manifiesto que la versión es `0.10.45` y el atajo global único es `Ctrl+Shift+8`. No existe un segundo atajo `Ctrl+Shift+Y`.
5. Antes de una llamada operativa, verifica por separado la recepción de Live Caption nativo y el estado del panel. La prueba del host nativo comprueba protocolo, pero no demuestra que los subtítulos reales aparezcan o estén clasificados correctamente.

## Qué cambia y qué no

- La contestación automática exige autorización de presencia efímera. Ausencia o incertidumbre bloquea; no rearma automáticamente.
- Live Caption nativo se conserva y se segmenta de forma conservadora por idioma. Los tramos ambiguos permanecen sin etiqueta; el idioma no identifica al hablante.
- El sondeo horario de estadísticas omite de forma controlada la ausencia de una pestaña autenticada de Cloud Interpreter. No abre, navega ni recarga pestañas; una sincronización manual fallida y errores reales de red/API siguen siendo visibles.
- La captura del micrófono del intérprete es opcional y permanece desactivada por defecto. Solo puede iniciarse manualmente desde el botón flotante dentro de una ruta `/call/:id` confirmada; exige que la preferencia de canal y la confirmación de Zero Data Retention (ZDR) estén activas, y una clave Groq local válida. La confirmación ZDR en la extensión es una declaración del operador; no verifica la configuración de la consola de Groq.
- El audio se transmite en fragmentos temporales al endpoint Groq Whisper; no se conserva en disco ni en telemetría. Los textos `INTÉRPRETE` se mantienen solo en memoria/`chrome.storage.session` y se pierden al terminar la sesión del navegador; no se escriben en base de datos ni export de observabilidad.
- La captura se detiene al salir de la llamada, terminar la llamada, perder el contexto, deshabilitar la preferencia o fallar el flujo. La pestaña LIVE es un lector; no puede iniciar captura por sí misma.
- La captura del audio de pestaña y la reproducción de audio continúan deshabilitadas. El idioma no determina identidad del hablante.

## Persistencia y rollback

El instalador raíz administra el puente nativo en `%LOCALAPPDATA%\SignalInterpreter\NativeMessagingHost` y el registro HKCU del usuario de Windows. En equipos administrados por Deep Freeze, confirma con TI que la carpeta local y el registro sobrevivan al reinicio antes de considerar aceptada la candidata. Si falla cualquier verificación, no uses el puente en una llamada; restaura la raíz anterior siguiendo el respaldo y registra los resultados.

## Compuertas de aceptación pendientes

1. CI verde en el SHA exacto de la candidata.
2. Pruebas en Windows PowerShell 5.1: instalación limpia/actualización, hashes, Native Messaging y ausencia de scripts antiguos.
3. Windows/Chrome: idle, bloqueo/desbloqueo, suspensión corta, reinicio y pestañas múltiples; verificar que no se interrumpa una llamada activa.
4. Subtítulos Live Caption nativos reales en inglés/español: texto sin pérdida ni duplicación, tramos ambiguos sin clasificación forzada y repetibilidad.
5. Prueba controlada de micrófono: inicio solo por clic in-call, ZDR confirmado, inglés/español por segmento, detención al terminar/salir y ausencia de audio/texto clínico en telemetría. No usar contenido clínico real sin autorización expresa.
6. Observación operacional nueva sin errores de sondeo por pestaña ausente y aceptación explícita del operador de la revisión instalada.

CI sintética y build del host no sustituyen pruebas en el equipo Windows objetivo.
