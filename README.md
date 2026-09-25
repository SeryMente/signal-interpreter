# Signal Interpreter

Asistente independiente para interpretación médica en tiempo real.

## Arquitectura

- extension/ — Chrome extension
- extension/core/ — contratos y lógica común
- extension/ui/ — interfaz CLIENTE / YO
- extension/bridge/ — transporte hacia servicios nativos
- bridge/ — código nativo independiente del navegador
- bridge/windows-uia/ — UI Automation / Chrome Live Caption
- docs/ — especificaciones técnicas
- tests/ — pruebas

## Flujo actual

Chrome Live Caption → Windows UI Automation → Signal Interpreter Bridge → WebSocket local → extension → CLIENTE

## Estado

La captura de Live Caption y la reconciliación de snapshots están validadas en Windows.

El transporte local WebSocket expone ws://127.0.0.1:8787/ y un health check en http://127.0.0.1:8787/health.

La extensión recibe caption.segment como canal estable para CLIENTE.

## Principio de separación

CLIENTE = señal externa observada.

YO = producción propia del intérprete.

El producto es independiente de Khora/Effectif y no depende de Whisper para su ruta base de captura.
