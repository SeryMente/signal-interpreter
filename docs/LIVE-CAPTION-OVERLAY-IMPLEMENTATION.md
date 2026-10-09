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

Versión 0.10.22 en la rama de trabajo. El último commit de código probado fue `57a51c23ab6c48d30f02e99b50dcd4b7a3bce38e`:
- `signal-observability-audit`: **success** en GitHub Actions PR run `37994825723`. Incluye sintaxis, auditorías existentes y pruebas de normalización/fusión, transición del puente nativo y ciclo de vida del preview.
- `native-caption-host-build`: **success** en GitHub Actions PR run `37994825677`. Compila el fuente C#, verifica el encuadre Native Messaging/apagado limpio y valida que el payload incluido corresponde al hash esperado.
- El ejecutable embebido y la fuente se sincronizaron en `bbba7b13912b3a4b9da2c09f374632e1ee47d0ec`. SHA-256 del ejecutable: `7526667D537E65840D3DDB68F25DCC7271C11CD5639B25C834ABEA15E4F56DB6`; SHA-256 normalizado del fuente C#: `B6C9713E063CF1AAB24314810968954398D7A452B382CAD1012E3B91D67A1E33`. Ambas huellas coinciden entre el payload, el registro y la auditoría.
- Los reintentos se prueban con retroceso progresivo (1 s, 2.5 s, 5 s) al fallar repetidamente el host. La prueba cubre el puente simulado, no la disponibilidad de UI Automation en una sesión real de Chrome.

Estas pruebas automatizadas no equivalen a reconocimiento de voz real. Sigue pendiente una llamada bilingüe para verificar: Live Caption ON, lectura nativa, cierre de la burbuja, continuidad vía Groq, reapertura y recuperación nativa, controles sin obstrucción, ausencia de persistencia del preview y aislamiento de llamadas consecutivas. No se declara una prueba real hasta que se ejecute.

La validación se describe en el commit de código indicado. Este documento y la narrativa de versión se actualizarán aquí en la misma PR; la ejecución de CI del commit documental actual debe aprobarse antes de fusionar.
