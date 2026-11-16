# Análisis de portabilidad de PR #97 — insumo para Sprint 2

## Dictamen ejecutivo

PR #97 es una candidata de reparación P0 para el guard de micrófono. **No debe fusionarse a ciegas ni tomarse como base del sprint.** La comparación de árboles confirma que, desde la base declarada por la PR hasta el main fijado para Sprint 1, la divergencia de contenido está limitada a observaciones automáticas. Para los 27 paths tocados por la PR no hay cambios divergentes preexistentes en main: los 25 paths ya presentes tienen el mismo blob que la base de la PR; los dos tests nuevos están ausentes tanto en la base como en main.

Eso permite afirmar **cero conflictos de contenido detectados en esos paths**, no certificar mergeabilidad de Git ni autorizar integración automática. La API de GitHub devuelve mergeable=null y mergeable_state=unknown para la PR consultada.

## Identidad y procedencia

| Dato | Valor |
|---|---|
| Repositorio | SeryMente/signal-interpreter |
| PR | [#97 — P0: repair microphone guard, all-frame activation and emergency release](https://github.com/SeryMente/signal-interpreter/pull/97) |
| Estado | OPEN / DRAFT |
| Rama candidata | p0/microphone-guard-recovery-20261115 |
| HEAD candidato | fc4114792551d175a2208405ad01dbd36bbd4590 |
| Base declarada por PR | 22470b66c86b68dad2757783eccc5aa0e2a3bb1c |
| Main leído justo antes del branch Sprint 1 | 8a096410101634a86e5042e6a75c9f617660577b |
| Main posterior consultado durante Sprint 1 | b380c8aca32c43887ab6b3dc836aecb9a6ad99ce |
| Mergeability devuelta por API | unknown / null |
| Archivos en la PR | 27 |
| Commits únicos de la PR desde su base declarada | 45 |
| Commits únicos de main desde esa base en la comparación inicial | 2,903 |
| Rutas divergentes de árbol base→main | 2,809; todas bajo observations/ |

## Lista exacta de archivos tocados por PR #97

| # | Archivo | Estado en PR | Grupo / motivo |
|---:|---|---|---|
| 1 | .github/workflows/extension-package.yml | Modificado | Añade los tests P0 al workflow de package |
| 2 | INSTALAR.ps1 | Modificado | Alineación del instalador y paquete |
| 3 | README.md | Modificado | Instrucciones de la versión candidata |
| 4 | extension/background.js | Modificado | Descubrimiento/ejecución de guard en todos los frames |
| 5 | extension/mic-guard-main.js | Modificado | Migración de estado, wrappers compartidos y emergencia |
| 6 | manifest.json | Modificado | Versión 0.10.53 |
| 7 | payload-sha256.json | Modificado | Inventario de hashes |
| 8 | tools/cloud-login-bootstrap-test.mjs | Modificado | Ajuste de prueba existente |
| 9 | tools/earnings-overlay-tests.mjs | Modificado | Ajuste de prueba existente |
| 10 | tools/hotload-active-call-test.mjs | Modificado | Ajuste de prueba existente |
| 11 | tools/hotload-caption-runtime-test.mjs | Modificado | Ajuste de prueba existente |
| 12 | tools/installer-inventory-shape-test.mjs | Modificado | Contrato de inventario |
| 13 | tools/live-caption-static-audit.mjs | Modificado | Auditoría estática |
| 14 | tools/microphone-feedback-test.mjs | Modificado | Prueba de feedback |
| 15 | tools/microphone-frame-routing-test.mjs | Nuevo | Routing de frames |
| 16 | tools/microphone-global-toggle-test.mjs | Modificado | Estado del toggle |
| 17 | tools/microphone-guard-test.mjs | Modificado | Guard, estado compartido y release |
| 18 | tools/microphone-legacy-hotload-test.mjs | Nuevo | Migración de wrappers legacy |
| 19 | tools/microphone-local-preflight-guard-test.mjs | Modificado | Separación preflight local / salida |
| 20 | tools/microphone-preflight-test.mjs | Modificado | Contrato de preflight |
| 21 | tools/observability-static-audit.mjs | Modificado | Auditoría estática de observabilidad |
| 22 | tools/overlay-activation-regression-test.mjs | Modificado | Regresión overlay |
| 23 | tools/overlay-global-toggle-regression-test.mjs | Modificado | Toggle global |
| 24 | tools/pipeline-hotkey-consistency-test.mjs | Modificado | Consistencia de atajos |
| 25 | tools/portable-root-test.mjs | Modificado | Layout portable |
| 26 | tools/signal-interpreter-longitudinal-regression-test.mjs | Modificado | Regresión longitudinal |
| 27 | tools/verify-release-package.mjs | Modificado | Verificación del paquete |

Los dos archivos marcados **Nuevo** no existen en la base de PR ni en main del corte de Sprint 1. Los otros 25 existen en ambas puntas con los mismos blob SHA en la comparación de árbol.

## Hallazgos funcionales del diff

### A. Guard y routing multi-frame

**HECHO observado en el diff:**
- El background de la base ejecutaba/injectaba el guard usando frameIds:[0].
- PR #97 añade ensureMainMicrophoneGuards(tabId), consulta el guard mediante allFrames:true, calcula los frameIds sin guard e inyecta solo en esos frames.
- Las órdenes MAIN-world pasan a target allFrames:true.
- La candidata verifica frames que contienen tracks/senders y no permite que un frame vacío justifique un unmute de llamada.
- El hotload reutiliza guards existentes en lugar de inyectarlos indiscriminadamente.

**Invariante para Sprint 2:** el estado de micrófono debe estar observado y aplicado en todos los frames donde puede existir una pista de llamada; unmute exige llamada activa y al menos un sender-track de audio vivo y comprobado. Falta de evidencia = mute.

### B. Migración de wrappers 1.0 y liberación

**HECHO observado en el diff:**
- El guard cambia el modelo a un objeto de estado compartido versión 2.0, preservando la identidad del objeto cuando existe una versión anterior.
- Los wrappers consultan una función de estado compartido y no solo una variable capturada al instalarse.
- La candidata reconoce wrappers antiguos etiquetados como signalMicWrapped, aunque no expongan la referencia a su método original.
- La emergencia publica una API explícita y un atajo Ctrl+Alt+Shift+M, detiene el timer antiguo y aplica un shim de compatibilidad para que una clausura vieja no vuelva a silenciar pistas nuevas.
- El test nuevo simula timer ID 0 y tracks/senders ya existentes, además de tracks creados/reemplazados/clonados después del release.

**Invariante para Sprint 2:** hotload/desinstalación no puede dejar al operador sin una ruta segura de liberación; la recuperación debe cubrir tanto pistas existentes como las que se creen después de migrar. No declarar restauración de métodos nativos si solo se instaló un shim.

### C. Cobertura de tests y CI candidato

PR #97 actualiza microphone-guard-test.mjs, añade microphone-frame-routing-test.mjs y microphone-legacy-hotload-test.mjs y agrega al workflow extension-package.yml las ejecuciones de los tests de guard, frames, legacy hotload y longitudinal.

El workflow de audit en main ya ejecuta microphone-guard-test.mjs, pero **no** incluye los dos nuevos tests de frame routing ni legacy hotload. La candidata amplía cobertura en extension-package.yml. Esto no demuestra por sí solo que todas las rutas de acceptance estén bloqueadas por branch protection.

### D. Paquete e identidad

PR #97 actualiza manifest.json a 0.10.53, INSTALAR.ps1, README, payload-sha256.json, verify-release-package.mjs y varios tests de inventario. **No modifica PROBAR.ps1.** El desajuste descubierto en PC14/main (PROBAR.ps1 exige 0.10.47) debe resolverse por separado o añadirse deliberadamente al Sprint 2; no está cubierto por el diff de PR #97.

## Resultado de comparación de árboles: conflictos

La comparación se hizo sobre los árboles Git completos, no solo sobre el resumen de commits:

- Base de PR #97: árbol con 26,430 entries.
- Main del corte Sprint 1: árbol con 29,176 entries.
- Diferencias de paths/blobs: 2,809; las 2,809 diferencias pertenecen a observations/ (incluida la entrada de directorio).
- Paths tocados por PR #97: 27.
- De esos 27, 25 paths ya estaban en la base y mantienen exactamente el mismo blob SHA en main; los dos tests nuevos no existían en ambas puntas.

**Conclusión precisa:** no se detectó divergencia de contenido con main en los archivos que cambia PR #97; la divergencia observada entre puntas está en observations/. No se ejecutó un merge ni un merge-tree de Git. mergeable sigue unknown/null; por ello no se declara la PR mergeable ni se aconseja fusionarla directamente.

## CI de PR #97 — evidencia del SHA candidato, no de main

Los cuatro check-runs devueltos por GitHub para HEAD fc4114792551d175a2208405ad01dbd36bbd4590 concluyeron SUCCESS:

| Workflow/check | Conclusión | Finalización UTC |
|---|---|---|
| package | SUCCESS | 2026-11-15 23:35:31Z |
| audit | SUCCESS | 2026-11-15 23:35:36Z |
| package-integrity | SUCCESS | 2026-11-15 23:35:28Z |
| compile-and-protocol-smoke-test | SUCCESS | 2026-11-15 23:36:11Z |

Esto es evidencia del pipeline en ese SHA candidato. No es CI de esta rama documental, no prueba Chrome cargado, no demuestra audio real ni reemplaza la aceptación del operador.

## Orden mínimo seguro propuesto para Sprint 2

1. **Releer main de nuevo inmediatamente antes de ramificar.** Registrar SHA, tree y estado de la rama. No usar fc41147 como base y no incluir el histórico de observations como producto.
2. **Preparar tests P0 antes del port.** Incorporar de forma deliberada las pruebas de routing multi-frame y legacy hotload/release; comprobar que fallan frente al contrato actual y que pasan con el fix. Mantener tests de micrófono, preflight local, hotload activo y regresión longitudinal.
3. **Portar selectivamente el core de PR #97.** Aplicar como unidad coherente mic-guard-main.js + background.js; revisar el esquema de estado, inyección por frame, tracking de sender/track, política fail-closed y emergencia. No portar commits históricos de observations ni hacer merge de rama completa.
4. **Sincronizar el paquete 0.10.53.** Actualizar manifest, instalador, inventario SHA-256, verificador de paquete y README desde el árbol ya validado. Alinear PROBAR.ps1 con la versión derivada del manifiesto; este ajuste está fuera de los 27 archivos de PR #97.
5. **Cerrar los candados de layout y versión.** Validar raíz cargable, identidad, inventario completo, versión coherente entre manifest/INSTALAR/PROBAR/README y hashes leídos de vuelta. Ejecutar Node tests y parser PowerShell en el entorno CI adecuado; no tocar el host C# salvo que una dependencia nueva lo exija y se autorice.
6. **Reparar observabilidad por separado y sin inventar recibos.** Investigar por qué el batch actual no conserva/expone un relayReceivedAt utilizable; reconstruir health mediante el pipeline real; mantener mismatch/error hasta que entren batches nuevos con recibo server-side y versión esperada coincidente. Actualizar el documento de límites 1.5 MB frente a 4,200,000/2,500,000 bytes y añadir test doc–code.
7. **Formalizar reglas de main.** Solicitar autorización/configuración del propietario para branch protection/ruleset y checks obligatorios. No confundir workflows verdes con protección de rama.
8. **Validar el mismo SHA final.** Exigir package, package-integrity, audit y compile/protocol-smoke en la misma punta final. Ningún check de fc41147 se hereda automáticamente al SHA portado.
9. **Aceptación manual reservada al operador.** Solo después de paquete/CI y en entorno controlado: carga manual en Chrome, lectura de ID/versión, prueba de micrófono con frames/timing conocidos, emergency release y reload de recuperación; documentar PASS/FAIL. Este Sprint 1 no autoriza ni realiza esa prueba.

## Límites y decisiones pendientes

- No se copió código de PR #97 a main ni a esta rama Sprint 1.
- No se ejecutó merge, no se tocó Chrome/RDC, no hubo llamada real ni prueba de audio.
- La API de GitHub no certificó mergeability actual de PR #97.
- La ausencia de conflictos de contenido en los 27 paths no sustituye la revisión del diff, tests sobre la rama portadora ni aceptación real.
