# Live Caption Overlay — implementación

**Repositorio canónico:** https://github.com/SeryMente/signal-interpreter
**Especificación canónica:** https://github.com/SeryMente/signal-interpreter/blob/main/docs/USER-REQUIREMENT-LIVE-CAPTIONS-OVERLAY-VERBATIM-20261008.md
**Versión de trabajo:** 0.10.22, basada en `main` 0.10.21.

## Objetivo

Mostrar en Cloud Interpreter un panel propio, compacto y no intrusivo con las intervenciones que Chrome Live Caption reconoce cuando la burbuja nativa expone texto; al cerrarse la burbuja o quedar el texto nativo obsoleto, mantener el flujo mediante audio efímero de la pestaña y transcripción de baja latencia.

## Arquitectura mínima

### Fuente primaria

`extension/native/SignalInterpreter.CaptionHost.exe` lee mediante Windows UI Automation el árbol accesible de la burbuja nativa. El proceso comunica `status`, `caption` y `heartbeat` por el protocolo Native Messaging. `live-caption-bridge.js` mantiene una ventana de frescura de 4.5 segundos, detecta texto estancado, notifica transiciones y reintenta conexiones con demoras acotadas. No se usa un selector DOM frágil para leer la ventana nativa.

### Fallback efímero

Audio de la pestaña → segmentos WebM de aproximadamente 2.8 s → Groq Whisper con detección automática de idioma → overlay.

El preview reutiliza la captura de audio de la pestaña que ya existe y mantiene un `MediaRecorder` de preview distinto del recorder durable. Cuando vuelve texto nativo reciente, el recorder de preview de la pestaña se detiene; si el texto nativo se queda obsoleto, el fallback se reactiva. No se abre un segundo preview del micrófono. Las peticiones se procesan con una sola operación activa y un único fragmento pendiente por fuente: los fragmentos intermedios son coalescidos, no acumulados sin límite. Los resultados se vuelven a validar contra la llamada, pestaña, sesión y preferencia actuales antes de mostrarse.

El preview no crea segmentos durables, no escribe el timeline/IndexedDB de las sesiones y no entra en el paquete de observabilidad. Los diagnósticos solo incluyen estados, códigos de razón, fuente y metadatos técnicos; nunca contenido de audio o texto hablado.

### Clasificación y continuidad

`live-caption-core.js` normaliza nombres/códigos de idioma conocidos a `en`/`es`; una etiqueta fiable prevalece sobre la heurística. Las frases muy cortas no se fuerzan a un idioma. El overlay combina actualizaciones progresivas, duplicados y solapamientos sobre la fila reciente compatible, en lugar de crear una línea por cada parcial.

### Presentación y ciclo de vida

`live-caption-overlay.js` crea un Shadow DOM cerrado dentro de Cloud Interpreter:

- `pointer-events: none` para no interceptar clics.
- `CLIENTE · ENGLISH` y `LEP · ESPAÑOL` con acentos visuales distintos.
- actualiza los nodos de las filas en lugar de reconstruir el panel en cada fragmento.
- evalúa ocho posiciones compactas contra rectángulos de controles interactivos visibles.
- recalcula la posición al redimensionar, hacer scroll y cambiar `visualViewport`.
- respeta `EFFECTIF_SCREENSHOT_PREPARE` / `EFFECTIF_SCREENSHOT_RESTORE`.
- limpia el contexto al cambiar de llamada/pestaña, al cerrar la llamada o al reemplazar el runtime.

La preferencia `liveCaptionOverlayEnabled` detiene el overlay, el puente y el preview; al reactivarla durante una llamada válida, restablece el puente y el fallback.

## Distribución del host nativo

Los archivos adicionales permanecen en `extension/native/`: `SignalInterpreter.CaptionHost.exe.b64`, código C#, manifiesto de Native Messaging y scripts de registro/revocación. El registro materializa el ejecutable desde el payload incluido, valida su SHA-256 y registra el host bajo `HKCU`. No se instala un servicio, Scheduled Task, watchdog ni servidor localhost.

## Observabilidad

El paquete observado en `main` fue generado el 9 de octubre de 2026 a las 20:13 UTC e identifica la versión 0.10.20, no la versión 0.10.21 que actualmente está en `main`. Su último batch contiene únicamente `TELEMETRY_MAINTENANCE` y no prueba que se hayan recibido subtítulos; el paquete indica además 414 errores de captura de screenshot. No se encontraron batches pendientes en `observations/inbox/`. Por tanto, la observabilidad sirve para conocer la actividad y las rutas de plataforma, pero no verifica el reconocimiento de voz ni el renderizado del overlay.

## Pruebas

CI ejecuta pruebas de normalización y fusión de captions, transición/reconexión Native Messaging, cambio de fuente y limpieza del recorder de preview, junto con las auditorías existentes del host, manifiesto, privacidad y observabilidad. Las pruebas automatizadas no sustituyen la comprobación de la burbuja real y del fallback con una llamada bilingüe.

## Estado de validación

Versión 0.10.22 en rama de trabajo. La integración queda pendiente de que la batería de GitHub Actions pase. Después hace falta una comprobación operativa real de: Live Caption ON, lectura nativa, cierre de la burbuja, continuidad vía Groq, recuperación nativa, controles sin obstrucción, ausencia de persistencia del preview y aislamiento de llamadas consecutivas. No se declara una prueba real hasta que se ejecute.