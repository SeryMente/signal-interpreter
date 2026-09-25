# Signal Interpreter — Extension

## Desarrollo local

1. Abre chrome://extensions.
2. Activa Developer mode.
3. Usa Load unpacked y selecciona la carpeta extension.
4. Arranca SignalInterpreterBridge.exe.
5. Mantén Chrome Live Caption activo.
6. Abre el popup de Signal Interpreter.

## Transporte local

La extensión se conecta a ws://127.0.0.1:8787/

El Bridge también expone http://127.0.0.1:8787/health para verificación.

Eventos consumidos por la extensión:

- bridge.connected
- bridge.heartbeat
- caption.status
- caption.segment

La extensión no usa caption.delta ni caption.revision como texto final.

## Separación

CLIENTE recibe la señal externa observada.

YO permanece separado como entrada propia del intérprete.
