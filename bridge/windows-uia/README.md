# Signal Interpreter Bridge

Lector independiente de Chrome Live Caption mediante Windows UI Automation.

Cadena observada:
Chrome_WidgetWin_1 → CaptionBubbleLabel → AXVirtualView → Name

El proceso:
- sondea cada 150 ms por defecto;
- no captura audio;
- no usa Whisper;
- no usa Groq;
- no controla Effectif;
- emite JSONL por stdout;
- distingue append delta de revisiones completas.

Prueba:
dotnet run -- --interval-ms 150
