# Crónica de retoma, corrección de CI e integración 0.10.39 · 2026-10-30

## Entrada y alcance

El operador informó que la sesión local de Windows/RDC era nueva y que no debían suponerse clones, archivos ni procesos de la sesión anterior. Se adoptó como único criterio de persistencia técnica el estado remoto verificado de GitHub. Se solicitó minimizar RDC y finalizar con rapidez. Esta crónica no afirma haber inspeccionado ni modificado el Escritorio de PC-14.

## Gobierno y titularidad

- Fuente normativa consultada: `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`.
- DUG: Samantha v369 · NX-369m; Metacanon 1.26; GOW declarado 2.14 en el bloque estructurado. Se observó una discrepancia: el bloque embebido de GOW aún se rotula v2.12; no se modificó Metodología.
- CONTROL-RESPONSABILIDAD.json: transferencia condicionada G5 → G6, con SHA previo cotejado y lectura de vuelta.
- Titularidad vigente: generación 6 · ACTIVA · constructor.
- Folio: `SES-20261030-A8F4C291`.
- Alias operativo: `chatgpt-signal-interpreter-SES-20261030-A8F4C291` (no es ID nativo).
- UUIDv7 local: `01a18f6d-79cd-7b7f-8138-083ae11becb4`.
- Evento: `SIGNAL-INTERPRETER-TRANSFER-20261030-G6-A8F4C291`.
- Commit de transferencia: `cd4a8bac7ddfcb1294671e398a0f1d408caa660b`.
- Blob de control tras read-back: `73cd791fb63a2c5f28faf96e53ea8912da2d30ab` (UUIDv7 local corregido y cotejado en lectura de vuelta).
- La G5 anterior queda preservada como sustituida. La unicidad global del folio no está certificada.

## Diagnóstico y corrección

La PR [#68](https://github.com/SeryMente/signal-interpreter/pull/68) contiene el arreglo de extremo a extremo para el ciclo de llamadas entrantes:

- La detección pasiva del diálogo y del botón continúa aunque el autocontestador esté bloqueado.
- La autorización de clic sigue fail-closed y se revalida inmediatamente antes de interactuar.
- Se correlaciona cada intento mediante `attemptId` desde timbrado/diálogo hasta contestación, clic sin ruta o clasificación explícita de llamada perdida.
- Los eventos críticos del ciclo se envían con prioridad, sin esperar al rate limit ordinario.
- El relay estampa `relayReceivedAt`; el informe rolling de diez minutos corrige el desfase del reloj del cliente, expone latencias y señales ausentes y no convierte un timbrado sin diálogo en una llamada perdida.
- El health diferencia estados fresh/delayed/stale, ausencia de recibo, backlog y runtime-version-mismatch.
- La extensión pasa a 0.10.39 y actualiza instalador, inventario SHA-256, pruebas y documentación.

El CI inicial falló porque `caption-lab-test.mjs` buscaba una forma textual antigua del guard (`if (labSafetyLock) return;`). Se actualizó esa aserción para exigir el bloqueo `LAB_SAFETY_LOCK_CHANGED_BEFORE_CLICK` antes del clic y el registro `LAB_SAFETY_LOCK` en readiness. No se eliminó el candado ni se debilitó el guard.

## Integración

- PR #68: fusionada.
- Merge commit: `f9ddfade6fbdf1b04448906301c3d98de00930e5`.
- HEAD de main tras la fusión, leído de vuelta: el mismo merge commit.
- `manifest.json`: versión 0.10.39, blob `0cb37ff90b79cd84cf0154c01b055e22485fc5d6`.
- Pull requests abiertas: 0.
- PR #67 permanece fusionada; PR #59 permanece cerrada sin merge.
- CI 3/3 success en el test de la cabeza actual de PR (SHA `55416e125922c9e0d3ecad93bffe9edc74a27f85`): package integrity, observability audit y native-caption-host build.
- Tras el merge, los workflows push de observabilidad y host nativo aparecían en curso en la última lectura. No se declara CI post-merge completo hasta su terminación.
- No se creó release.

## Pendiente operativo y aceptación

- El runtime instalado en el nuevo entorno PC-14 no fue consultado ni actualizado en este ciclo; no se ejecutó RDC.
- No se declara la extensión cargada en Chrome ni el puente verificado en este nuevo entorno.
- La extensión debe quedar en 0.10.39; la raíz de la extensión se carga manualmente desde `chrome://extensions`. El instalador incluido prepara el Native Messaging host y su registro por usuario; no se requiere registrar el puente manualmente.
- Para permitir que el autocontestador actúe, el operador debe confirmar en popup que Auto-Answer está habilitado, presencia armada, disponibilidad online, perfil autorizado y `signalLabLock=false`. El guard no se rearma automáticamente después de reiniciar el service worker o perder continuidad.
- Falta una llamada OPI real controlada para verificar tiempo de detección→clic→ruta, desenlace y que el informe `observations/latest/incoming-calls-10m.md` contenga toda la trazabilidad. Las pruebas sintéticas/CI no sustituyen esa aceptación.
- Video continúa manual. No se declara aceptación Windows/Chrome ni release.

## Próxima acción

Poner 0.10.39 en el PC-14 nuevo, cargar la carpeta raíz en Chrome, verificar los estados de presencia y autocontestación en popup, y realizar una llamada OPI controlada. Solo tras leer el informe y recibir PASS/FAIL se cierra aceptación y se decide release.
