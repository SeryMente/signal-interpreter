# Crónica de reconciliación de candidata y CI · 2026-10-30 · generación 5

## Contexto y procedencia

Continuación del mismo frente Signal Interpreter, después de la transferencia G5 registrada en [crónica de retoma](C-SIGNAL-RETOMA-20261030-G5.md). No se crea frente, control ni rama nueva.

- OCP: `docs/frentes/signal-interpreter/OBJETO-CANONICO.md`.
- Control autoritativo: `docs/frentes/signal-interpreter/CONTROL-RESPONSABILIDAD.json`.
- Titularidad observada: generación 5 · ACTIVA · constructor; folio `SES-20261030-3B3868DF`; control blob `d057a5db249939c381892f831d76a81103190074`.
- Gobierno: DUG Samantha v362 · NX-362m; Metacanon 1.24; GOW 2.11; fuente vigente leída en `SeryMente/metodologia/main`. MCP normativo DESACTIVADO.
- Se mantiene la regla de pruebas: el operador efectúa el uso real local; el constructor hace el resto del trabajo técnico. RDC no utilizado y prohibido al constructor (§§6/24).

## Reconciliación de la rama

Se leyó compare de commits y se descargaron recursivamente los árboles Git completos de main, la candidata y el ancestro común. El corte previo del delta de main tuvo 52 rutas: 47 rutas de observabilidad y cinco rutas de gobierno/continuidad actualizadas en G5. No hubo solapamientos de contenido con los 40 cambios exclusivos de la candidata.

El merge se construyó conservando:
- Primer padre: main `0bdbf2b44f76ccb657c6d989c8864c8bb0f67ac0`.
- Segundo padre: cabeza candidata anterior `058fbe65cdbc1be2901320442f1416ae586988c4`.
- Merge commit: `bd21f384b9b6e17aef0184faec9040f53340b4d1`.
- Árbol: `0965691672b7035030b9e026f4b01c5e4df903b9`.

Se leyó de vuelta la rama, los padres y el árbol. Los archivos de main cambiados respecto al ancestro coinciden en el árbol de merge; los cambios exclusivos de producto/prueba de la candidata también se conservaron. Comparación posterior: 68 commits por delante, cero por detrás. PR #67 quedó con base SHA actualizado a `0bdbf2b44f76ccb657c6d989c8864c8bb0f67ac0`, abierta, draft, no fusionada; GitHub indicó mergeable=true. La condición mergeable no es aceptación funcional.

La lista de archivos modificados por la PR, después de actualizar la base, queda limitada a 40 archivos de candidata; los batches e índices de observabilidad ya están en el ancestro/base y no aparecen como cambios de producto.

## CI sobre el merge commit bd21f384

Los tres workflows se ejecutaron por evento `pull_request` sobre el SHA exacto `bd21f384b9b6e17aef0184faec9040f53340b4d1`:

| Workflow | Run | Resultado |
|---|---:|---|
| Package integrity | 41084675899 | success |
| signal-observability-audit | 41084675586 | success |
| native-caption-host-build | 41084675595 | success |

Detalle del audit: el job `audit` terminó success; todas las etapas reportadas concluyeron success. Incluyó `Scheduled official sync no-tab safety regression`, pruebas de disponibilidad fail-closed, presencia/Connect, segmentación, hotload, exportación/privacidad, overlays, inventario, atajos y auditorías estáticas.

Detalle del host: `compile-and-protocol-smoke-test` terminó success. Parseo de scripts/identidad, validación de raíz de archivo, preparación, compilación del host UI Automation, empaquetado, artifact upload y prueba de framing/clean shutdown Native Messaging concluyeron success. La sincronización del host embebido se omitió porque no hubo cambio de fuente que la requiriera.

Detalle de integridad: `package-integrity` terminó success; inventario SHA-256 e invariantes del paquete pasaron.

Estos son resultados CI de la cabeza exacta indicada. No equivalen a Live Caption real, comportamiento de presencia en Windows, actualización/rollback sobre el perfil del operador ni aceptación del producto.

## Ficha 0.10.38 y siguiente ejecución CI

La ficha `docs/versions/0.10.38-candidate.md` se actualizó en la rama candidata y se leyó de vuelta exactamente:
- Commit de actualización documental: `23762a153ad18b1694e73384ac8341e456d0e93e`.
- Blob: `b683d873bde67ac2f39635f53dee69c8f2da49aa`.
- En ella se asentaron merge `bd21f384`, sus tres runs y los límites de aceptación.

Esa actualización generó una cabeza posterior `23762a153ad18b1694e73384ac8341e456d0e93e`; en la lectura inmediata sus workflows nuevos eran: Package integrity success (41085127879), signal-observability-audit in_progress (41085127695), native-caption-host-build in_progress (41085127828). No se atribuye el success de bd21f384 a un SHA posterior sin volver a leer esos runs.

## Baseline observacional relevante

El batch de main `batch-10ae7bc3-7bb8-4e48-90d6-db951509f69c` (extensión 0.10.37, 2026-10-30T15:41:50.501Z, secuencias 7165–7167) reportó:
- `PLATFORM_OFFICIAL_HOURLY_SYNC_STARTED`;
- `EARNINGS_SYNC_QUEUE_ERROR`;
- `PLATFORM_OFFICIAL_HOURLY_SYNC_ERROR`;
- warning text: `Error: No se pudo sincronizar sin afectar la llamada: abre Cloud Interpreter primero.`

El paquete de observabilidad quedó health `ok`, inboxRemaining 0, con 0 errores agregados y 2 warnings. La candidata incorpora una omisión controlada de la falta de pestaña autenticada y el harness sintético comprueba tanto no envenenar la cola como mantener visibles los fallos genuinos de red. El batch baseline no demuestra ejecución ni aceptación de 0.10.38.

## Decisión y límites

- La reconciliación de código y observaciones está ejecutada y verificada.
- CI 3/3 está verificado en `bd21f384`.
- La ficha de versión recibió una actualización documental posterior; sus workflows propios requieren lectura de vuelta por SHA.
- PR #67 sigue abierta y en borrador, sin merge y sin release.
- La única aceptación física pendiente corresponde al operador: Windows/Chrome, Live Caption real, segmentación visible, presencia/idle/bloqueo/desbloqueo/suspensión, sondeo sin pestaña, errores reales, actualización y rollback. Entregar solo PASS/FAIL, versión/SHA y telemetría saneada; nunca texto ni audio de llamadas.
- No se utiliza RDC desde el rol constructor. No se manipula el equipo, GUI, navegador o llamada real.
