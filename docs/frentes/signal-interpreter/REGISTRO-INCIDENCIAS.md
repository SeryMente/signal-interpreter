# Registro de incidencias — Signal Interpreter

> **Filosofía obligatoria: «Un error no debe tenerse dos veces».** Toda incidencia debe terminar vinculada a una causa raíz, un invariante, un candado automatizado o una declaración explícita de ausencia de candado, y una prueba de aceptación. Una prueba sintética o un CI verde no equivalen a aceptación en Windows/Chrome.

## Alcance y reglas de lectura

Este registro se reconstruyó desde el estado de **main** fijado en **8a096410101634a86e5042e6a75c9f617660577b** (16-11-2026 18:48:31Z), más los artefactos locales de PC14 inspeccionados en solo lectura y los PR citados. Los hallazgos distinguen **hecho verificado**, **inferencia** y **No verificable / Falta información**. Las referencias históricas conservan su fecha y SHA: no se convierten automáticamente en estado actual.

**Estado general de aceptación:** todas las incidencias de este registro permanecen **PENDIENTE en entorno real** mientras el cambio correspondiente no se integre sobre un main fresco, supere sus candados en el mismo SHA y reciba una prueba controlada del operador. Este Sprint 1 es documental; no corrige código ni acepta producto.

### Flujo obligatorio de cierre de una incidencia

1. Registrar el síntoma reproducible y el artefacto/test que lo demuestra; no duplicar una incidencia ya existente.
2. Identificar causa raíz con evidencia del SHA y de la ruta exacta. Mantener separadas causa confirmada e hipótesis.
3. Convertir el invariante en un test determinista que falle antes del fix y pase después.
4. Ejecutar el test y el CI aplicable sobre el **mismo SHA final**. Un resultado de otro commit no es transferible.
5. Verificar empaquetado, inventario SHA-256 y lectura de vuelta cuando cambie un paquete distribuible.
6. Ejecutar la aceptación real controlada reservada al operador. Registrar versión/commit realmente cargados, resultado y evidencia saneada.
7. Cerrar solo cuando las seis etapas estén satisfechas; de lo contrario conservar el estado **ABIERTO / PENDIENTE**.

---

## INC-001 — Guard de micrófono: wrappers MAIN-world, enrutamiento parcial y liberación tras hotload/desinstalación

- **Severidad:** P0 — seguridad y disponibilidad del canal de voz.
- **Estado:** ABIERTO · fix candidato en PR #97 · no integrado en main.
- **Versiones / SHAs afectados:**
  - main en la base de Sprint 1: versión 0.10.52; manifest blob 87b67f7f35b13c9403ecf5f7a3039f642e4245e7.
  - extension/background.js blob 04025393a947f5537f8c744297ee4a3dfeb89c79.
  - extension/mic-guard-main.js blob de61d78afab7b6f8fe99d5fe02b260ae0f686e37.
  - Candidata de corrección: PR #97, HEAD fc4114792551d175a2208405ad01dbd36bbd4590, manifiesto 0.10.53.
- **Causa raíz — HECHOS VERIFICADOS:**
  - El flujo de órdenes de micrófono en el background.js de la base selecciona frameIds:[0] para inyectar/dirigir la orden MAIN-world; el manifiesto declara mic-guard-main.js con all_frames:true, pero ese alcance del manifiesto no convierte automáticamente una orden posterior dirigida al frame 0 en una orden a todos los frames.
  - El guard de main conserva wrappers en métodos WebRTC y estado versión 1.0. La prueba nueva de PR #97 reproduce explícitamente wrappers históricos 0.10.52 con marca __signalMicWrapped, sin puntero al método original y con una variable de mute cerrada sobre un estado antiguo.
  - El backlog operativo exige desinstalar como salida de emergencia y **recargar la pestaña** de Cloud Interpreter para limpiar los wrappers MAIN-world asociados al documento.
  - PR #97 añade enumeración de todos los frames, inyección solo en frames sin guard, órdenes all-frames, migración del estado compartido a 2.0, release de emergencia y compatibilidad con wrappers antiguos.
- **Causa raíz — INFERENCIA CONTROLADA:** el comando que solo cubre el frame 0 puede dejar sin controlar pistas creadas en otros frames; un wrapper ya inyectado pertenece al contexto JavaScript del documento y no desaparece necesariamente solo por retirar la extensión. La propia instrucción histórica de emergencia exige reload para limpiar ese contexto, pero no se encontró un experimento de desinstalación aislado que pruebe todas las variantes de Chrome.
- **No verificable / Falta información:** no hay registro fiable de los frames que contenían pistas/senders durante el incidente, ni una captura saneada del estado de cada pista. La persistencia exacta tras desinstalar, sin recargar, no está probada por una prueba real preservada.
- **Mitigación conocida:** usar una liberación explícita y, cuando sea necesario, cerrar/recargar la pestaña de Cloud Interpreter para destruir el contexto anterior; PR #97 es una candidata técnica que agrega Ctrl+Alt+Shift+M, limpia el watchdog y coloca un shim pasivo de compatibilidad para wrappers antiguos. No declarar la mitigación candidata como desplegada.
- **Invariante inviolable:** la orden de mute/unmute debe alcanzar todos los frames pertinentes; solo se puede quitar mute cuando una llamada está confirmada como activa y existe al menos una pista de audio saliente viva, verificada mediante su sender WebRTC. Todos los wrappers deben leer un estado mutable compartido; una liberación de emergencia no puede ser anulada por una clausura antigua. Si no se verifica, permanecer muteado.
- **Candado automatizado:**
  - En main existe tools/microphone-guard-test.mjs y el workflow observability-audit.yml lo ejecuta, pero no cubre de forma completa el enrutamiento por frames ni la migración de wrappers v1.
  - PR #97 añade tools/microphone-frame-routing-test.mjs y tools/microphone-legacy-hotload-test.mjs, pero ambos están ausentes de main y del workflow actual.
  - **SIN CANDADO - PENDIENTE P0** para los dos contratos completos (all-frames + hotload/migración/legacy release) en la línea base.
- **Verificación en entorno real:** **PENDIENTE**. Requiere portar selectivamente el fix a un main fresco, probar llamadas/frames con pista previa y tardía en Windows/Chrome y probar la secuencia de recuperación/desinstalación + reload bajo control del operador. Este Sprint 1 no abrió Chrome ni usó llamadas.

## INC-002 — Observabilidad sin recibo confiable y con versión de runtime divergente

- **Severidad:** P0 — integridad de evidencia y decisiones de aceptación.
- **Estado:** ABIERTO · el detector existe y está reportando el fallo; el sistema no debe tratar el paquete como prueba confiable mientras falle.
- **Versiones / SHAs afectados:**
  - Base de Sprint 1: 8a096410101634a86e5042e6a75c9f617660577b.
  - observations/manifest.json blob e73548c9275766c8c90108a149a97669bcaf111b.
  - observations/health/github-build.json blob a24070da162eebccc3e368963ec0ad27bc75f593.
  - Último batch observado en el paquete: batch-488418b1-ccae-44a8-a9bb-9b4ca0c150b1, versión reportada 0.10.50; otro batch posterior en inbox, batch-20fe272e-1c53-4340-9395-d91bbcb83f9a, también reporta 0.10.50.
- **Causa raíz — HECHOS VERIFICADOS:**
  - Health declara extensionVersion=0.10.50, expectedExtensionVersion=0.10.52, runtimeVersionMismatch=true.
  - latestBatchRelayReceivedAt=null, freshness.status="receipt-unavailable", receiptVerified=false, inboxRemaining=0, estado general receipt-unavailable.
  - El batch persistido sí lleva createdAt y campos del cliente, pero ese timestamp no sustituye el sello de recepción confiable del relay.
- **Causa raíz — INFERENCIA:** la pérdida del sello puede originarse en una ruta de recepción/compatibilidad histórica o en una versión del cliente que no produjo el dato esperado. La evidencia disponible no permite decidir cuál sin inspeccionar la secuencia completa de publicación y procesamiento del batch.
- **No verificable / Falta información:** no puede certificarse el reloj de origen del batch ni establecerse qué build concreta estaba cargada en cada sesión a partir de esos datos sin recibo. Los 23 informes de llamada y un estado complete no corrigen esa carencia.
- **Mitigación conocida:** el relay actual agrega relayReceivedAt en el servidor. El auditor marca recibo ausente, actividad retrasada/obsoleta, backlog y desajuste de versión; el workflow de frescura corre cada dos minutos. En la lectura actual el auditor debe fallar, no convertir la hora cliente en recibo.
- **Invariante inviolable:** un batch solo puede servir como evidencia temporal de runtime si tiene recibo verificable del relay, versión runtime igual a la versión esperada, frescura dentro de los límites y backlog cero. Un dato ausente conserva estado desconocido.
- **Candado automatizado:** existe tools/observability-freshness-audit.mjs, su test tools/observability-freshness-audit-test.mjs y .github/workflows/observability-freshness.yml. El test incluye recibo ausente, delayed/stale, backlog y mismatch. **Cobertura detectiva existente; enforcement como requisito de protección/merge/release no está verificado.**
- **Verificación en entorno real:** **PENDIENTE**. Requiere batches nuevos con sello server-side y versión coincidente, seguidos por health fresh, receiptVerified=true y auditor PASS sobre el paquete actualizado.

## INC-003 — PROBAR.ps1 conserva una versión esperada obsoleta

- **Severidad:** P1 — fiabilidad de diagnóstico y aceptación del paquete.
- **Estado:** ABIERTO.
- **Versiones / SHAs afectados:**
  - main base: manifest 0.10.52; PROBAR.ps1 blob d41b91bfe4328bac2b2d945488f552b1d2d4465a.
  - PC14, paquete extraído actual inspeccionado: manifest.json declara 0.10.53; INSTALAR.ps1 también exige 0.10.53; el PROBAR.ps1 local inspeccionado exige 0.10.47.
- **Causa raíz — HECHOS VERIFICADOS:** PROBAR.ps1 contiene una comparación literal contra 0.10.47. En PC14, ese literal no coincide ni con el manifiesto local 0.10.53 ni con el manifiesto de main 0.10.52.
- **Causa raíz — INFERENCIA:** el comprobador quedó fuera de la secuencia de actualización de versión y no se actualizó junto con el instalador/manifiesto.
- **No verificable / Falta información:** no se ejecutó PROBAR.ps1 en esta auditoría (no era necesario para observar el literal y podría abrir Chrome/lab); no se afirma qué mensaje produjo en una ejecución real.
- **Mitigación conocida:** no usarlo como fuente de verdad de la versión hasta corregirlo. Verificar el manifiesto y la identidad directamente con el procedimiento canónico; reservar la prueba del operador para la carga real.
- **Invariante inviolable:** un comprobador no puede imponer un número de versión distinto del artefacto que está comprobando. La versión debe derivarse del manifiesto o validarse contra una única constante versionada y un test de consistencia.
- **Candado automatizado:** tools/verify-release-package.mjs valida la versión e inventario del paquete; tools/portable-root-test.mjs verifica el layout, pero ninguno inspecciona el literal de versión dentro de PROBAR.ps1. **SIN CANDADO - PENDIENTE P0** para la consistencia manifiesto–instalador–probador.
- **Verificación en entorno real:** **PENDIENTE**. Tras alinear el comprobador en un sprint de producto autorizado, verificarlo contra paquete limpio sin cargar ni recargar Chrome automáticamente.

## INC-004 — Ambigüedad histórica sobre la carpeta que se debe cargar en Chrome

- **Severidad:** P1 — riesgo de selección de paquete incorrecto.
- **Estado:** ABIERTO · la regla vigente del paquete raíz está comprobada; quedan instrucciones históricas divergentes.
- **Versiones / SHAs afectados:**
  - main base 8a096410101634a86e5042e6a75c9f617660577b; manifest blob 87b67f7f35b13c9403ecf5f7a3039f642e4245e7.
  - tools/portable-root-test.mjs blob ede039f047df496f879743bd1800e50132026e41.
  - README.md raíz blob dcf486998a1baf9dc4b69f53d8432aa7b8b03fdc.
- **Causa raíz — HECHOS VERIFICADOS:** el manifiesto cargable está en la raíz del paquete; sus rutas de servicio y scripts apuntan dentro de extension/. El README raíz y el README local PC14 0.10.53 indican cargar la carpeta raíz que contiene manifest.json, no la subcarpeta extension/. La prueba portátil afirma que extension/manifest.json no debe existir y verifica las rutas desde la raíz. El backlog histórico contiene una instrucción anterior de aceptación que indicaba seleccionar signal-interpreter\extension.
- **Causa raíz — INFERENCIA:** se confundió la carpeta de código fuente (extension/) con la raíz del paquete distribuible.
- **No verificable / Falta información:** no se dispone de evidencia de que el incidente reciente se debiera efectivamente a haber seleccionado extension/.
- **Mitigación conocida:** seguir el README raíz del SHA objetivo y validar con tools/portable-root-test.mjs; no seguir instrucciones antiguas del backlog sin cotejar la versión.
- **Invariante inviolable:** la ruta cargable es siempre la raíz exacta que contiene el manifiesto del paquete. El subdirectorio extension/ contiene implementación, no otro paquete cargable.
- **Candado automatizado:** existe tools/portable-root-test.mjs y el workflow observability-audit.yml lo ejecuta. Ese candado verifica estructura técnica; no valida todas las frases de documentación histórica. **Cobertura parcial; falta auditoría automatizada de consistencia documental.**
- **Verificación en entorno real:** **PENDIENTE**. La prueba final debe comprobar ID/versión visibles tras carga manual del operador, sin asumir que la ubicación de archivos implica que la extensión está cargada.

## INC-005 — Límite de tamaño documentado del relay no coincide con el código

- **Severidad:** P1 — configuración, operación y diagnóstico de transporte.
- **Estado:** ABIERTO.
- **Versiones / SHAs afectados:**
  - Base de Sprint 1 8a096410101634a86e5042e6a75c9f617660577b.
  - docs/OBSERVABILITY-RELAY-VERCEL-SETUP.md blob 4324c00ab07fa3c8c48c8a0090387876b20cc956.
  - tools/observability-relay/api/batch.js blob 9112c015f0e4494cff5aec431ba0f6b8bbd69b8e.
- **Causa raíz — HECHOS VERIFICADOS:** la guía indica un payload de 1.5 MB; el handler actual define MAX_BODY_BYTES=4200000 (4,200,000 bytes), MAX_SCREENSHOT_BYTES=2500000 (2,500,000 bytes) y MAX_EVENTS=200.
- **Causa raíz — INFERENCIA:** la documentación no se actualizó después de cambiar el límite del handler o de separar límites de lote e imagen.
- **No verificable / Falta información:** la lectura estática no demuestra el límite efectivo del deployment de Vercel actualmente activo; se tendría que comparar el deployment publicado y su SHA.
- **Mitigación conocida:** al diagnosticar, tomar el handler del SHA como contrato de código y no usar 1.5 MB como límite efectivo confirmado del deployment. Reconciliar guía y prueba cuando se autorice el cambio documental/productivo.
- **Invariante inviolable:** cada límite operativo debe tener una única fuente de verdad y un test que falle cuando la documentación se separe del contrato; distinguir siempre cuerpo total, imagen y cantidad de eventos.
- **Candado automatizado:** tools/observability-relay-batch-test.mjs verifica la marca de recepción, no la igualdad guía–constantes de tamaño. **SIN CANDADO - PENDIENTE P0** para el contrato de tamaños y su reflejo documental.
- **Verificación en entorno real:** **PENDIENTE**. Comparar el deployment relay activo con el código y ejecutar pruebas límite autorizadas, sin enviar audio/texto clínico.

## INC-006 — Rama main sin protección ni checks obligatorios

- **Severidad:** P0 — riesgo estructural de integridad de la línea base.
- **Estado:** ABIERTO · requiere decisión/configuración del propietario del repositorio.
- **Versiones / SHAs afectados:** configuración observada en la referencia main al crear Sprint 1, HEAD 8a096410101634a86e5042e6a75c9f617660577b; confirmada de nuevo en main a62ab529fb1fa17b7b0053c7dd19d5b02f732df5.
- **Causa raíz — HECHOS VERIFICADOS:** la API de GitHub devolvió protected:false; required_status_checks.enforcement_level="off"; listas contexts y checks vacías.
- **Causa raíz — INFERENCIA:** la ausencia de una regla de protección permite que la política de integridad dependa de disciplina manual y de los workflows que se disparen, en vez de estar bloqueada por configuración del repositorio.
- **No verificable / Falta información:** no se inspeccionaron todas las reglas org-wide o rulesets que pudieran aplicar indirectamente. La lectura de protección de la rama no mostró protección efectiva.
- **Mitigación conocida:** ninguna aplicada en este Sprint 1. Documentar como riesgo P0 y solicitar al propietario activar reglas de protección/ruleset con checks obligatorios, bloqueo de force-push y reglas de aprobación según la política del operador.
- **Invariante inviolable:** no aceptar cambios de producto en main sin checks obligatorios en el mismo SHA final; la ausencia de checks no debe interpretarse como PASS.
- **Candado automatizado:** **SIN CANDADO - PENDIENTE P0**. No hay protección ni checks obligatorios confirmados en la rama. Los workflows existentes no sustituyen la protección del ref.
- **Verificación en entorno real:** **PENDIENTE**. Debe comprobarse read-back de las reglas aplicadas; no se aplicó ninguna modificación de configuración.

## INC-007 — Informe de llamada complete sin evidencia de captions visibles

- **Severidad:** P1 — semántica de aceptación y diagnóstico.
- **Estado:** ABIERTO · detectado en el último informe visible del paquete.
- **Versiones / SHAs afectados:**
  - Base 8a096410101634a86e5042e6a75c9f617660577b.
  - observations/latest/latest-call-report.json blob 1aaeedb4dd718ff12d273e1170e82681c3018e7d.
  - Manifest del paquete blob e73548c9275766c8c90108a149a97669bcaf111b.
- **Causa raíz — HECHOS VERIFICADOS:** el reporte declara status="complete", pero captionDiagnosis.captureScope="not-observed", nativeTextForwarded=0, maximumVisibleRows=0, nativeFreshObserved=false; los reason codes incluyen native-text-not-exposed. La evidencia de exportación final/checkpoint se marca entregada.
- **Causa raíz — INFERENCIA:** el estado complete describe la completitud del checkpoint/informe de cierre, no la calidad de la transcripción ni la visibilidad de captions. La etiqueta puede ser malinterpretada si se usa como PASS de producto.
- **No verificable / Falta información:** no hay evidencia aquí de por qué el texto nativo no quedó expuesto (permisos, Windows/Chrome, disponibilidad de Live Caption o condiciones de sesión).
- **Mitigación conocida:** interpretar complete como cierre de reporte; leer siempre captionDiagnosis y no afirmar que hubo transcripción cuando el número de filas/texto es cero.
- **Invariante inviolable:** separar al menos tres estados: cierre/checkpoint exportado, captura nativa observada y texto visible. Ninguno sustituye a los otros.
- **Candado automatizado:** existen tools/call-observability-report-test.mjs, tools/call-caption-runtime-test.mjs y tools/live-reader-native-caption-regression-test.mjs; el workflow de auditoría ejecuta tests de reporte/runtime. **Cobertura parcial:** los tests sintéticos no prueban que Windows/Chrome haya expuesto captions en una sesión real ni impiden por sí solos que el estado complete se lea como aceptación.
- **Verificación en entorno real:** **PENDIENTE**. Se requiere una sesión controlada por el operador y evidencia saneada de texto nativo visible, sin registrar audio ni transcripción cruda.

## INC-008 — Procedencia de la versión realmente cargada en PC14 no demostrable tras el incidente

- **Severidad:** P0 — trazabilidad de release/aceptación.
- **Estado:** ABIERTO · versión cargada durante el incidente desconocida.
- **Versiones / SHAs afectados:**
  - main al crear Sprint 1: 0.10.52, SHA 8a096410101634a86e5042e6a75c9f617660577b.
  - Última telemetría observada en base/inbox: 0.10.50, batch batch-20fe272e-1c53-4340-9395-d91bbcb83f9a.
  - Paquete extraído actual de PC14: 0.10.53; INSTALAR.ps1 valida 0.10.53.
  - Antecedente OCP de 2026-11-15 informa que PC14 recibió 0.10.52 y que 61/61 hashes pasaron, pero también declara que la recarga de Chrome quedó no ejecutada/no verificada.
- **Causa raíz — HECHOS VERIFICADOS:**
  - En PC14 no se encontró INSTALACION-RESULTADO.json en el paquete extraído ni en el Desktop inspeccionado.
  - La carpeta de extensión con ID ldpbjhobnfgmhdoehehdmnbhhjckebmj no existe actualmente bajo el perfil Chrome Default consultado, coherente con la desinstalación que informó el operador.
  - El manifiesto del paquete extraído es 0.10.53; el manifest de main en la base es 0.10.52; la telemetría más reciente inspeccionada reporta 0.10.50.
- **Causa raíz — INFERENCIA:** hubo artefactos de distintas etapas/cortes en el equipo o en la cadena observabilidad–repositorio. No es correcto elegir una de esas versiones como la efectivamente cargada en el momento del incidente.
- **No verificable / Falta información:** **versión exacta de Chrome que estaba cargada al producirse el incidente: No verificable / Falta información.** No hay recibo de instalación local disponible ni extensión instalada en el perfil actual tras la desinstalación.
- **Mitigación conocida:** conservar recibo de instalación, paquete/manifest SHA, rama/commit del artefacto y prueba manual del operador que lea la versión/ID efectivamente mostrados por Chrome; adjuntar esa evidencia a la aceptación y cruzarla con la telemetría verificada.
- **Invariante inviolable:** versión de paquete en disco, versión que emite telemetría y versión cargada en Chrome son hechos distintos. No inferir el tercero desde el primero o segundo. Toda aceptación real debe registrar versión + SHA del artefacto y read-back del runtime visible.
- **Candado automatizado:** el instalador puede emitir INSTALACION-RESULTADO.json con ChromeLoaded="NO_VERIFICADO" y RealCall="NO_VERIFICADA", pero no se encontró un candado que pruebe qué versión está activa en Chrome después de carga manual. **SIN CANDADO - PENDIENTE P0** para read-back verificable de versión cargada.
- **Verificación en entorno real:** **PENDIENTE**. Solo el operador puede efectuar la carga manual y aceptar el resultado en Windows/Chrome; este Sprint 1 no accedió a la GUI ni reinstaló nada.

---

## Criterio global de liberación

Ninguna incidencia P0 puede declararse cerrada por ausencia de eventos, por tener paquetes en disco, por CI de un SHA anterior ni por un reporte de llamada complete. Para cambios de micrófono, release y aceptación requieren: tests de guard y frames, migración hotload, compilación/protocolo nativo cuando aplique, inventario SHA-256, CI verde en el SHA final y prueba controlada del operador. Para observabilidad, el recibo, versión y frescura deben ser válidos antes de usar sus datos como evidencia. Toda falta se mantiene como **PENDIENTE / NO VERIFICADA**.
