# Live Caption Overlay — implementación

**Repositorio canónico:** https://github.com/SeryMente/signal-interpreter
**Especificación canónica:** https://github.com/SeryMente/signal-interpreter/blob/main/docs/USER-REQUIREMENT-LIVE-CAPTIONS-OVERLAY-VERBATIM-20261008.md

## Objetivo

Mostrar en Cloud Interpreter un panel propio, compacto y no intrusivo con las intervenciones que Chrome Live Caption ya reconoce cuando su burbuja nativa está disponible y, cuando esa superficie desaparece (por ejemplo, al cerrarla), mantener la experiencia mediante una captura efímera de audio de pestaña y transcripción de baja latencia.

## Arquitectura mínima

### Fuente primaria

Chrome Live Caption permanece como motor primario. extension/native/SignalInterpreter.CaptionHost.exe usa Windows UI Automation únicamente para leer el árbol accesible de la burbuja nativa mientras ésta está presente.

### Fallback

Chromium limpia el texto del modelo de Live Caption cuando la burbuja se cierra. Por ello, la extensión mantiene un recorder de preview separado del recorder durable:

Audio de pestaña → segmentos WebM ~2.8 s → Groq Whisper con detección automática de idioma → overlay

El preview es efímero y no entra al timeline, IndexedDB de sesiones, ni al pipeline de observabilidad.

### Presentación

extension/live-caption-overlay.js crea un único Shadow DOM dentro de Cloud Interpreter:

- pointer-events:none: no intercepta clics.
- ancho máximo compacto.
- colores distintos para inglés y español.
- CLIENTE · ENGLISH para inglés.
- LEP · ESPAÑOL para español.
- conserva solo contexto reciente.
- calcula cuatro posiciones candidatas y elige la de menor solapamiento con controles interactivos detectados en el DOM.
- no depende de una ruta concreta de llamada para evitar fragilidad frente a cambios de routing.

## Distribución

Todo componente adicional vive bajo extension/native/:

- SignalInterpreter.CaptionHost.exe.b64
- SignalInterpreter.CaptionHost.cs
- com.signalinterpreter.captionhost.json
- register-caption-host.ps1
- unregister-caption-host.ps1

El script de registro materializa el ejecutable desde el payload incluido, valida SHA-256 y registra el Native Messaging Host en HKCU. No se instala un servicio, Scheduled Task, watchdog ni servidor localhost.

La carpeta extension/ completa es parte del paquete que el entorno persistente materializa en el Escritorio.

## Integración con observabilidad

El Native Messaging bridge pertenece exclusivamente a la función de Live Caption. La observabilidad continúa sin Native Messaging, sin UI Automation y sin infraestructura local.

Los eventos de preview no se persisten como observaciones ni como segmentos de sesión.

## Criterios de calidad

1. La burbuja nativa puede aportar texto cuando está visible.
2. Cerrar la burbuja no deja sin subtítulos al usuario durante una llamada activa.
3. La caída de la ruta nativa no interrumpe la llamada ni la captura durable.
4. El panel no obstruye controles funcionales y no intercepta interacción.
5. La actualización es rápida y sin animaciones innecesarias.
6. La distribución sigue siendo autocontenida dentro de extension/.
7. El paquete no introduce infraestructura persistente ni dependencias de desarrollo para el usuario final.

## Fase actual

La implementación debe pasar primero las pruebas estáticas y de CI. Después debe probarse en una llamada real con:

Live Caption ON → abrir burbuja → verificar texto → cerrar burbuja → continuar recibiendo subtítulos en el panel de Signal Interpreter.