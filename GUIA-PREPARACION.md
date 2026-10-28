# Signal Interpreter 0.10.38 — paquete portable con puente nativo y control global

## Preparación e instalación

1. Extrae este ZIP a una carpeta estable que no vaya a moverse después de cargarla en Chrome.
2. Ejecuta \`PREPARAR-Y-CARGAR.cmd\`. Solo continúa si el proceso termina con \`BRIDGE_PREPARADO=VERIFICADO\`, \`HASHES=PASS\` y \`NATIVE_MESSAGING_PROTOCOL=PASS\`.
3. En \`chrome://extensions\`, activa el modo desarrollador y selecciona **Cargar descomprimida** sobre la carpeta raíz de esta extracción, donde se encuentra \`manifest.json\`.
4. Antes de atender llamadas, usa la prueba local del popup y comprueba que el texto de Live Caption llegue al overlay.

## Qué prepara el paquete

El instalador valida las huellas de los archivos, genera el ejecutable nativo desde el payload incluido, prueba el protocolo Native Messaging, lo instala en \`%LOCALAPPDATA%\\SignalInterpreter\\NativeMessagingHost\` y registra su manifiesto bajo HKCU. La ruta registrada no depende de la ruta de extracción de la carpeta de extensión. El instalador usa el mismo usuario de Windows que Chrome y no reinicia Chrome ni navega la llamada.

**Importante:** Chrome no permite que \`Cargar descomprimida\` registre por sí solo un host nativo de Windows. Esta versión automatiza esa fase con un único archivo \`PREPARAR-Y-CARGAR.cmd\`; el registro de Windows y la instalación autorizada del ejecutable siguen siendo necesarios.

## Control de overlays

El interruptor **Overlays de llamada** y el atajo predeterminado \`Ctrl+Shift+8\` ocultan/muestran tanto el panel de ingresos como el panel de subtítulos. Este control cambia solo \`callOverlaysVisible\`; no desactiva la preferencia de transcripción, no detiene Native Messaging, no captura audio y no responde/finaliza llamadas. Si Chrome no asigna el atajo predeterminado, configúralo en \`chrome://extensions/shortcuts\`.

Al actualizar/reinyectar, Signal Interpreter intenta desactivar el runtime anterior y limpiar su overlay antes de cargar el nuevo. La prueba automatizada no sustituye la validación en el equipo físico.

## Deep Freeze y límites

Si Deep Freeze revierte \`%LOCALAPPDATA%\` o HKCU al reiniciar, la preparación puede revertirse también. Realiza la instalación en modo de mantenimiento/Thawed y verifica persistencia tras reiniciar, o configura la persistencia correspondiente. \`INSTALACION-RESULTADO.json\` confirma la preparación, no la transcripción en una llamada real.

Versión de extensión: 0.10.38.
