# Signal Interpreter Bridge

Lector independiente de Chrome Live Caption mediante Windows UI Automation.

## Cadena observada

Chrome_WidgetWin_1 → CaptionBubbleLabel → AXVirtualView → Name

## Responsabilidades

- Sondea Live Caption cada 150 ms por defecto.
- No captura audio.
- No usa Whisper.
- No usa Groq.
- No controla Effectif.
- Emite JSONL por stdout.
- Publica los mismos eventos mediante WebSocket local.
- Conserva caption.delta y caption.revision para diagnóstico.
- Emite caption.segment como salida reconciliada para CLIENTE.

## Transporte local

WebSocket:

ws://127.0.0.1:8787/

Health check:

http://127.0.0.1:8787/health

El puerto puede cambiarse con:

--port 8787

## Reconciliación

Live Caption puede reescribir el snapshot actual. CaptionReconciler:

1. espera una ventana de estabilidad de 750 ms por defecto;
2. evita volver a emitir el mismo snapshot estable;
3. elimina el prefijo ya comprometido cuando el caption es acumulativo;
4. detecta solapamiento de hasta 10 palabras para reducir duplicados;
5. emite caption.segment cuando el snapshot se estabiliza.

Parámetros:

--interval-ms 150
--stability-ms 750
--port 8787

Ejemplo:

dotnet run -- --interval-ms 150 --stability-ms 750 --port 8787
