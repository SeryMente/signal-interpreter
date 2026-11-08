# Crónica de diagnóstico Auto-Answer 0.10.43 · G12 · 2026-11-07

## 1. Base y responsabilidad

La ejecución continúa el único frente Signal Interpreter bajo G12:
- Transferencia G11→G12: SIGNAL-INTERPRETER-TRANSFER-20261107-G12-3DC1E417.
- G12 ACTIVO; alias chatgpt-signal-interpreter-01a1b793-ab9f-70bc-bd23-03e83dc1e417; UUIDv7 local 01a1b793-ab9f-70bc-bd23-03e83dc1e417; folio pendiente porque FOL1 no está activa.
- Base actual de código: origin/main observado en d32c5c6a7f99c90322360bd4bac16033855c6fd9.
- PR #72: work/g11-presence-continuity, abierta/no fusionada, candidata 0.10.42.
- Se creó un worktree separado C:\Users\fila4\Desktop\SeryMente\SI-G12-worktree, rama work/g12-autoanswer-revalidation. El clon original, sus cuatro modificaciones rastreadas y dos archivos no seguidos se preservaron intactos.
- El rebase de los tres commits de la candidata sobre el main actualizado encontró conflictos solo en OBJETO-CANONICO.md y README.md; se conservaron las versiones G12 del main. El control local rebasado confirma generación 12 y el mismo alias/evento G12.

## 2. Diagnóstico aplicado

La causa individual del bloqueo sigue sin conocerse: el export 13:50 registró 12 eventos agrupados post-authorization-revalidation-failed, sin una lista de predicados. El código preexistente comprobaba, antes de permitir Connect, la validez del grant, su expiración y generación, runtime activo, identidad del intento, presencia armada, readiness, ausencia de llamada activa, no duplicidad del intento y estado/relación/visibilidad del botón.

En la candidata 0.10.43 se añadió un clasificador puro y el campo revalidationFailureCodes al evento AUTO_ANSWER_AUTHORIZATION_BLOCKED, con versión de esquema 1. Los códigos no incluyen contenido de llamada. Pueden aparecer varios a la vez; solo el patrón del siguiente evento y el contexto operativo autorizado permitirán discriminar una causa. No se cambió la política de permiso ni se agregó un camino de clic alternativo; el comportamiento sigue siendo fail-closed.

## 3. Versión y archivos

Candidata local manifest.json 0.10.43. Cambios principales:
- extension/content.js: clasificador y emisión de códigos de revalidación.
- tools/autoanswer-runtime-guard-test.mjs: 16 nuevos casos; total de la suite 31.
- tools/presence-connect-test.mjs: arnés sintético incorpora el clasificador usado por autoAnswer.
- manifest.json, INSTALAR.ps1 y expectativas de versión de tests pasan a 0.10.43.
- payload-sha256.json: inventario recalculado, 59 entradas.

## 4. Pruebas

| Suite | Resultado |
|---|---:|
| autoanswer-runtime-guard | 31 checks PASS |
| presence-guard | 65/65 PASS |
| presence-connect | 33/33 PASS |
| verify-release-package | 59/59 SHA-256 PASS |
| installer-inventory-shape | PASS |
| portable-root | PASS |
| call-export-runtime | PASS |
| live-caption-static-audit | PASS |
| overlay-activation / overlay-global-toggle | PASS |
| cloud-login-bootstrap | PASS |
| earnings-overlay | PASS |
| microphone-feedback | PASS |
| pipeline-hotkey | PASS |
| hotload-active-call | PASS |
| node --check, git diff --check | PASS |

observability-static-audit quedó NO EJECUTADO en la prueba local por la ausencia de .github/workflows/observability-build.yml. En CI de PR #73, package integrity terminó SUCCESS; native-caption-host-build y signal-observability-audit estaban IN_PROGRESS en la última lectura. No se registra CI completa como PASS. No hubo pruebas en Chrome ni llamadas reales.

## 5. Límites y estado

- La rama work/g12-autoanswer-revalidation se publicó y PR #73 está abierta contra main; no se ha fusionado ni liberado.
- main continúa en 0.10.40; el directorio de Chrome no se modificó.
- No recargar/reiniciar Chrome durante la disponibilidad del operador.
- No manipular llamadas reales, audio, transcripciones ni contenido del diálogo.
- La corrección 0.10.43 es diagnóstica: aún no demuestra ni resuelve por sí sola el predicado que produjo el bloqueo.
- Aceptación funcional, llamada elegible contestada, E2E y liberación siguen pendientes del operador.

IPZ: v0.7 · edad NO VERIFICADA.
DUG: v378 · NX-378m · edad por calcular al cierre.
CONV: CV-G PENDIENTE/NO ASIGNADO · OCP CV-OCP-SI PENDIENTE/NO ASIGNADO.
CICLO: CY-G PENDIENTE/NO ASIGNADO · OCP CY-OCP-SI PENDIENTE/NO ASIGNADO.
A: A-G PENDIENTE/NO ASIGNADO · OCP A-OCP-SI PENDIENTE/NO ASIGNADO.
B: B-G PENDIENTE/NO ASIGNADO · OCP B-OCP-SI PENDIENTE/NO ASIGNADO.