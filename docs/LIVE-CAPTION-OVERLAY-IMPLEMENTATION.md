# Live Caption Overlay — implementación

**Repositorio canónico:** https://github.com/SeryMente/signal-interpreter
**Especificación canónica:** https://github.com/SeryMente/signal-interpreter/blob/main/docs/USER-REQUIREMENT-LIVE-CAPTIONS-OVERLAY-VERBATIM-20261008.md
**Versión integrada:** 0.10.23 — Overlay compacto y no obstructivo.
**Commit de producción:** `2607ff07107f1e1e4cf82b3ab6e8bb4516f0ba90` (PR #44, integrada en `main` el 2026-10-09).

## Objetivo

Mostrar en Cloud Interpreter un panel propio, compacto y no intrusivo con las intervenciones que Chrome Live Caption reconoce cuando la burbuja nativa expone texto; al cerrarse la burbuja o quedar el texto nativo obsoleto, mantener el flujo mediante audio efímero de la pestaña y transcripción de baja latencia.

## Arquitectura mínima

### Fuente primaria

`extension/native/SignalInterpreter.CaptionHost.exe` lee mediante Windows UI Automation el árbol accesible de la burbuja nativa. El proceso comunica `status`, `caption` y `heartbeat` por Native Messaging. `live-caption-bridge.js` mantiene una ventana de frescura de 4.5 segundos, detecta texto estancado, notifica transiciones y reintenta conexiones con demoras acotadas. No se usa un selector DOM frágil para leer la ventana nativa.

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
- Actualiza los nodos de las filas en lugar de reconstruir el panel en cada fragmento.
- Evalúa ocho posiciones compactas contra rectángulos de controles interactivos visibles.
- Recalcula la posición al redimensionar, hacer scroll y cambiar `visualViewport`.
- Respeta `EFFECTIF_SCREENSHOT_PREPARE` / `EFFECTIF_SCREENSHOT_RESTORE`.
- Limpia el contexto al cambiar de llamada/pestaña, al cerrar la llamada o al reemplazar el runtime.

La preferencia `liveCaptionOverlayEnabled` detiene el overlay, el puente y el preview; al reactivarla durante una llamada válida, restablece el puente y el fallback.

## Distribución del host nativo

Los archivos adicionales permanecen en `extension/native/`: `SignalInterpreter.CaptionHost.exe.b64`, código C#, manifiesto de Native Messaging y scripts de registro/revocación. El registro materializa el ejecutable desde el payload incluido, valida su SHA-256 y registra el host bajo `HKCU`. No se instala un servicio, Scheduled Task, watchdog ni servidor localhost.

- SHA-256 esperado del ejecutable: `7526667D537E65840D3DDB68F25DCC7271C11CD5639B25C834ABEA15E4F56DB6`.
- SHA-256 normalizado esperado del fuente C#: `B6C9713E063CF1AAB24314810968954398D7A452B382CAD1012E3B91D67A1E33`.

## Observabilidad

El paquete más reciente inspeccionado en `main` se generó el 2026-10-09 a las 20:13 UTC e identifica la extensión 0.10.20, secuencia 5874. Contiene un único evento `TELEMETRY_MAINTENANCE`, sin errores/warnings en ese batch, y el manifiesto acumulado informa 414 errores de captura de screenshots. No demuestra reconocimiento de voz ni renderizado correcto del overlay. Esta observabilidad sirve para contextualizar actividad y rutas de plataforma, no para certificar Live Caption.

## Pruebas y evidencia

El PR #44 fue integrado en `main`. La descripción de la PR registra como aprobados:
- `signal-observability-audit`: pruebas de sintaxis, auditorías existentes, normalización/fusión, transición del puente y ciclo de vida del preview.
- `native-caption-host-build`: compilación Windows del fuente C#, smoke test de framing Native Messaging/apagado limpio y validación del hash del payload.
- Pruebas de reconexión con retroceso acotado (1 s, 2.5 s, 5 s) y de conservación del fragmento pendiente más reciente.

Commit integrado: `2607ff07107f1e1e4cf82b3ab6e8bb4516f0ba90`.
Estado de CI asociado al commit integrado: Vercel success. La suite de GitHub Actions registrada en la PR pasó en los commits de la rama antes de integrar.

## Limitación de validación real

No se ha ejecutado una llamada bilingüe real en esta sesión. Por tanto, permanece pendiente la comprobación operativa de: Live Caption ON, lectura nativa, cierre de la burbuja, continuidad vía Groq, reapertura y recuperación nativa, ausencia de duplicados molestos, controles sin obstrucción, ausencia de persistencia del preview y aislamiento de llamadas consecutivas. No se declara validado el reconocimiento de voz real sin esa prueba.

## Resultado

La versión 0.10.23 limita el panel a 210 px de alto, muestra como máximo cuatro intervenciones recientes y recorta visualmente cada intervención a dos líneas; el host conserva `pointer-events: none` y el cálculo de posición evita controles visibles. La intención es que texto excepcionalmente largo no cubra el keypad ni controles de llamada.

La versión 0.10.22 había integrado el flujo primario/fallback en `main`. El flujo primario/fallback, el overlay y el host nativo están incluidos en la versión canónica. Para habilitar la ruta primaria en Windows, hay que ejecutar el script de registro incluido en `extension/native/register-caption-host.ps1` desde la carpeta materializada de la extensión; después, recargar la extensión y comprobar los permisos/captura necesarios para el fallback. La instalación local de EP no se ha modificado desde esta sesión.
