# Crónica G14 — Auto-Answer con prioridad de latencia · 2026-11-10

## Instrucción rectora del operador

La premisa de diseño es que varias personas pueden competir por una misma llamada entrante y que otros intérpretes podrían usar automatización. Es una hipótesis operativa indicada por el operador, no un hecho comprobado sobre la plataforma.

**Criterio de éxito:** ejecutar una sola activación normal del botón `Connect` tan pronto como el diálogo y las compuertas permitan hacerlo. La prioridad es minimizar detección→clic; no demostrar equivalencia con un ratón físico ni manipular la procedencia del evento.

La activación vigente es `button.click()` sobre el botón de aceptación de la interfaz. No se incorpora CDP `Input.dispatchMouseEvent`, `isTrusted`, eventos físicos simulados ni una API/end-point privado de Cloud Interpreter. La exploración temporal de esa interpretación errónea se eliminó del workspace temporal y no forma parte del producto ni de las pruebas.

## Camino crítico

1. MutationObserver detecta el diálogo OPI y localiza el botón `Connect`.
2. Se comprueban sin esperas innecesarias la ruta de perfil, modalidad, estado Online, configuración Auto-Answer, presencia explícita y candado de laboratorio.
3. El guard concede una autorización efímera de un solo uso y excluye llamadas activas en otras pestañas.
4. Content script ejecuta una sola vez `button.click()`.
5. La observabilidad correlaciona `CONNECT_CLICKED`, cierre del diálogo, `CALL_ROUTE_ENTERED` y `ANSWER_FLOW_ROUTE_CONFIRMED`.

No se realizan dobles clics sobre el mismo intento ni se rebasa una concesión denegada. El guard conserva revalidación de presencia, expiración, generación, unicidad, ruta autorizada y exclusión de llamada activa.

## Optimización implementada en la candidata

Rama: `perf/autoanswer-fast-dispatch-20261110`.

En `extension/presence-guard.js`:
- Se conserva en memoria el último muestreo de presencia del sondeo de 15 segundos, la restauración de worker y los eventos de estado del sistema operativo.
- Se reutiliza ese muestreo cuando tiene como máximo 20 segundos y sigue en estado `active`; un dato ausente, desconocido o vencido obliga a consultar de nuevo y falla cerrado si no se puede verificar.
- Preferencia Auto-Answer y candado de laboratorio se mantienen como caché actualizada por `chrome.storage.onChanged`; la concesión rápida no vuelve a leer almacenamiento.
- Se mantiene la consulta de llamadas activas en otras pestañas.
- Se elimina la consulta redundante `chrome.tabs.get`: la autorización comprueba la URL y el frame desde los metadatos del remitente entregados por Chrome.
- La publicación del estado de presencia ya no bloquea el camino crítico del intento; el estado en memoria se actualiza antes de publicar.

En `extension/content.js`, los eventos de elegibilidad y clic registran `authorizationVerificationPath` y `presenceSampleAgeMs`, para poder medir el uso real de la ruta rápida. `button.click()` permanece como la única activación.

## Verificación

Workspace aislado de prueba: `C:\\Users\\fila4\\Desktop\\SeryMente\\Temporal\\SI-FastPath-20261110`. No es carpeta de instalación ni fue cargado en Chrome.

- Presence Guard: **91/91 PASS** (Node VM, APIs Chrome sintéticas).
- Presence Connect: **33/33 PASS** (Node VM, DOM sintético).
- Auto-Answer Runtime: **15/15 PASS**.
- `node --check`: fuentes y suites relacionadas PASS.
- `manifest.json`: parseo JSON PASS.
- SHA-256 contra `payload-sha256.json`: `extension/presence-guard.js`, `extension/content.js` y `tools/verify-release-package.mjs` PASS.

Hashes cotejados:
- `extension/presence-guard.js`: `975B9AB16C89F0542B5C36FCE64B1EBF430E29A0F1057E353886F8B6C589EA50`
- `extension/content.js`: `404C9F3F2250CAEBA3E822EF19739178AC967D99228F16F61E316C8363A23099`
- `tools/verify-release-package.mjs`: `C09DB2349BB2AF8811D60BDCFE1A2D451C5FF661395FF800E6FB12809FFAF218`

Los resultados son sintéticos/offline: no demuestran todavía latencia en Chrome real ni aceptación de llamadas. No se modificaron preferencias, no se armó presencia, no se cambió Online/Offline y no se hizo reload de Chrome, llamada/audio real, aceptación, merge, deploy o release. PR #80 permanece intacta.

## Próxima medición permitida

Una vez que el operador cargue y acepte explícitamente la candidata, medir por intento y misma referencia temporal:
- detección de diálogo → solicitud de autorización;
- latencia de autorización y ruta (`cached` frente a `refreshed`);
- detección de diálogo → `CONNECT_CLICKED`;
- `CONNECT_CLICKED` → ruta confirmada;
- resultado terminal de la llamada.

La hipótesis competitiva gobierna la optimización, pero el resultado solo se declara ganado/contestado cuando exista evidencia de ruta y aceptación de la plataforma.
