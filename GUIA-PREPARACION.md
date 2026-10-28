# Preparar Signal Interpreter 0.10.36 — paquete con puente estable

Este ZIP contiene una carpeta cargable como extension descomprimida y un preparador de un solo paso.

## Instalacion

1. Extrae el ZIP a la carpeta donde se mantendra la extension. No cambies la carpeta despues de cargarla en Chrome.
2. Ejecuta \`PREPARAR-Y-CARGAR.cmd\`. Debe terminar con \`BRIDGE_PREPARADO=VERIFICADO\`, \`HASHES=PASS\` y \`NATIVE_MESSAGING_PROTOCOL=PASS\`. Si muestra un error, no cargues la extension ni dependas de la transcripcion en una llamada.
3. En Chrome abre \`chrome://extensions\`, activa el modo desarrollador y selecciona **Cargar descomprimida**. Selecciona la raiz extraida donde esta \`manifest.json\`; no selecciones \`extension\\\`.
4. Antes de una llamada operativa, usa la prueba local de la extension y confirma que los subtitulos nativos llegan al panel.

## Que automatiza y que no

El preparador verifica los hashes del paquete, reconstruye el ejecutable nativo incluido, comprueba su protocolo, lo instala en \`%LOCALAPPDATA%\\SignalInterpreter\\NativeMessagingHost\` y registra el manifiesto en HKCU para el mismo usuario de Windows que ejecuta Chrome. De este modo, mover el paquete de extension ya no deja el registro apuntando al ejecutable dentro de la carpeta extraida.

**Limite de Chrome:** el boton **Cargar descomprimida** no puede instalar ni registrar por si solo un host nativo de Windows. Esa operacion requiere un proceso de instalacion de Windows. En este paquete se realiza con un unico comando \`PREPARAR-Y-CARGAR.cmd\`; no necesitas editar el registro manualmente ni ejecutar a mano el script interno del puente.

**Deep Freeze:** si el equipo revierte cambios de \`%LOCALAPPDATA%\` o del registro HKCU al reiniciar, la preparacion tambien puede revertirse. Ejecuta el preparador en la ventana de mantenimiento/Thawed y confirma que la ruta y el registro sobrevivan el reinicio, o configura persistencia/ThawSpace para ambos. El ZIP por si solo no puede impedir que Deep Freeze restaure un estado anterior.

La salida \`INSTALACION-RESULTADO.json\` registra el resultado de preparacion. \`ChromeLoaded\` y \`RealCall\` permanecen NO VERIFICADO hasta una comprobacion separada; pasar el probe nativo no garantiza la transcripcion real en una llamada.

Version de extension: 0.10.36. La rama de paquete no modifica \`main\`.
