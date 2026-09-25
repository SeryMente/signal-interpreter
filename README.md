# Signal Interpreter

Asistente independiente para interpretación médica en tiempo real.

La extensión conserva las funciones operativas de Khora · Effectif v0.8.0 específicas de Cloud Interpreter y reemplaza exclusivamente la transcripción por Chrome Live Caption + Windows UI Automation.

La transcripción de CLIENTE funciona globalmente en cualquier pestaña. Auto-Answer, llamadas, ganancias, overlay, espejo y telemetría son específicos de app.cloudinterpreter.com.

Bridge incluido: `tools/live-caption-bridge/run.ps1` → ws://127.0.0.1:8787/

El bridge usa Windows UI Automation para leer Chrome Live Caption (`Chrome_WidgetWin_1 → CaptionBubbleLabel → AXVirtualView → Name`). No captura audio, no usa Whisper/Groq y emite `caption.status`, `caption.delta`, `caption.revision` y `caption.segment` por WebSocket.