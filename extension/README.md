# Signal Interpreter — Extension

Conserva la base funcional de Khora · Effectif v0.8.0 para Cloud Interpreter y sustituye su ruta de transcripción.

Cloud: Auto-Answer, OPI/VRI, Online/Offline, llamadas perdidas, cronómetros, ingresos, USD/MXN, overlay, espejo de pantallas, telemetría persistente/exportable y sonido.

Transcripción global:
Chrome Live Caption → Windows UI Automation → Signal Interpreter Bridge → WebSocket local → CLIENTE.

Puede probarse en cualquier pestaña, incluyendo sesame.com con Maya.

CLIENTE = señal externa observada.
YO = producción propia del intérprete.

El texto de CLIENTE es efímero en la extensión.

Carga local: chrome://extensions → Developer mode → Load unpacked → carpeta extension/.