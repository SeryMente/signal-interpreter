# Signal Interpreter — núcleo operativo único

<!-- BEGIN_CANONICAL_CORE -->

## Control e identidad

- Frente: **Signal Interpreter**; propietario: `SeryMente/signal-interpreter`.
- Revisión documental: **SI-OBJ-v1.10-seguridad-idiomas-01**; ancla: **C-SIGNAL-SEGURIDAD-IDIOMAS-20261020-01**, encargo directo del operador del 2026-10-20. Naturaleza: permanente, actualización del objeto existente expresamente solicitada; no proyecto nuevo.
- Directorio canónico: `docs/frentes/signal-interpreter/`. Este archivo es la única materialización del estado vigente y de la Versión de Contexto Universal del frente; README y prompts son navegación, no estados paralelos.
- Base preservada: main `5751281d3fca0a1fc7cb37a69c8cd4bba3632075`, objeto anterior blob `799ed39a297a911aceab46a91f206a14a8361f7c`, sello `SI-OBJ-v1.5-evidencia-04`.
- Estado de versiones al 2026-10-29: `main` permanece en 0.10.37. La candidata consolidada 0.10.38 está en [PR #67](https://github.com/SeryMente/signal-interpreter/pull/67), abierta, en borrador y sin fusionar. La reconciliación incorporó `main` `6756dcde7811f9b7ac9502499f7890359f20de02` con la cabeza candidata previa `a5d6d4ab0b119da8cc8a3c6950edc0f0f236cf5c` mediante merge commit `a9e235bedd188c289db56369bcbb62df16aedd4d`, conservando el núcleo canónico de main y los 40 archivos de producto/prueba de la candidata. La ficha de versión se actualizó en la rama mediante `b4945afeb1e1b03a712860b7442825385504dad0`. En esa cabeza los tres workflows concluyeron success: [Package integrity](https://github.com/SeryMente/signal-interpreter/actions/runs/40993477067), [signal-observability-audit](https://github.com/SeryMente/signal-interpreter/actions/runs/40993477076) y [native-caption-host-build](https://github.com/SeryMente/signal-interpreter/actions/runs/40993477194). En sandbox Node 22.16.0 se repitieron cuatro regresores sintéticos: presencia 29/29, Connect 22/22, segmentos lingüísticos 46/46 y sondeo sin pestaña PASS. Esto no equivale a aceptación Windows. `main` continúa en 0.10.37; no existe aceptación integral Windows ni autorización de merge/release.
- Persistencia verificable: identificar la revisión Git que contiene este archivo y el [recibo de migración](evidencias/C-SIGNAL-METACANON-20261020-01.json); el recibo identifica la base y los contenidos, no autocertifica publicación o conformidad semántica.

## LEER PRIMERO

Modo: continuar el mismo frente, no ejecutar ejemplos. Leer este núcleo y adquirir gobierno obligatorio antes de actuar; consultar después originales/evidencias necesarios, no toda la historia por rutina.

Precedencia: plataforma y autorización vigente → Metaprompt Canónico de Samantha pertinente → Metacanon → gobierno particular de este frente. [Entrada del gobierno distribuido](https://github.com/SeryMente/metodologia/blob/main/INICIO.md). El repositorio metodológico requiere acceso autorizado; no copiar su contenido privado a este repositorio público ni pedir credenciales en el chat. En Notion cotejar carga automática con fuente viva; fuera de Notion cargar el gobierno explícitamente. Un enlace, firma, ejemplo o cita histórica no acredita lectura ni permiso. Fuente indispensable ausente bloquea solo la acción dependiente.

Samantha continúa como **constructor**, Claudia como **asistente**. El nombre de persona no identifica el modelo técnico. Adquisición del método no crea agentes, sesiones, servicios, permisos ni acceso remoto; este ciclo no los creó. No activar PRIUS ni trabajo de otros frentes.

## Referencia metodológica

- **Metacanon adquirido: 1.24**; DUG Samantha **v362 · NX-362m**; GOW **2.11**.
- Fuente autenticada y releída en este ciclo: `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`, blob `b7593409c428e209d35f53a5f13501652208d949`; `INICIO.md`, blob `3557bfe0ebd69e8520b11ec7733ed9f7e61daae5`. Metacanon 1.24 y GOW 2.11 están integrados en el DUG. Revalidar en cada retoma; la lectura de estas huellas no acredita frescura futura.
- Control de responsabilidad vigente: [CONTROL-RESPONSABILIDAD.json](CONTROL-RESPONSABILIDAD.json), blob `d057a5db249939c381892f831d76a81103190074` (commit `2beb165cb792f072a6b5448d47a6e0a74b5c853f`). **Generación 5 · ACTIVA · constructor**; folio `SES-20261030-3B3868DF`, alias operativo `chatgpt-signal-interpreter-SES-20261030-3B3868DF`, UUIDv7 local `01a18d7d-1369-7059-b029-8a9104b94647`; no son IDs nativos. Transferencia explícita conforme a P037/Metacanon §42, evento `SIGNAL-INTERPRETER-TRANSFER-20261030-G5-3B3868DF`, commit `2beb165cb792f072a6b5448d47a6e0a74b5c853f`, lectura de vuelta confirmada. Titular anterior G4 preservado en el control y en el historial; unicidad global del folio NO VERIFICADA. El control es cooperativo, sin fencing frente a escritores que lo eludan.
- Gobierno adquirido desde `main`: DUG Samantha v362 · NX-362m; Metacanon 1.24; GOW 2.11 (122 términos definidos/indexados). Revisión manual de la cascada y principios relevantes P001, P004, P005, P037–P040; Metacanon §§3–7, 14–16, 24, 28, 43, 46–48 y 51. **MCP-NORMATIVO: DESACTIVADO**. No se modificó Metodología ni se presume sincronización con Notion u otras superficies.

### Constancia de adquisición y aplicación

| Fuente/regla | Requisito de esta acción | Evidencia o bloqueo | Resultado acotado |
|---|---|---|---|
| §§1–5, 26–27 | Un estado, trece bloques, permiso, revisión y delta | Este núcleo; encargo literal; base y huellas en recibo | Adaptación documental; no aceptación del producto |
| §§20, 29 | Directorio en repo propietario, sin perder historia | Antecedente íntegro, entrada antigua convertida en remisión | Migración autorizada por el encargo actual; no mover runtime |
| §§22–23 | Versión visible y herencia verificable | Este bloque, formato y prompts de ambos roles | No afirmar recepción de otras instancias |
| §§24–25, 38 | Conservar rol y comparar responsabilidad; excepción solo expresa | Control exclusivo y órdenes remotas directas posteriores | Preparación/lectura local acotadas, no permiso remoto general |
| §§28, 30 | Originales, secuencia, crónica, corte y readback | Originales de este corte, crónica y recibo enlazados | Historia previa preservada; chats/adjuntos privados no recuperados aquí |
| §§31–34 | Gobierno único y continuidad, sin sincronización fingida | Referencias de gobierno, matriz, prompts y pendientes | Copia puntual; sincronización automática no implementada |
| §§35–38 | Revisar fuentes/efectos/concurrencia, categorías y aceptación | Evidencia de candidata, recibo de observación y control | Pruebas locales aprobadas no equivalen a aceptación Windows |

## Propósito y alcance

**De dónde viene:** mejorar calidad de vida en interpretación telefónica, apoyada en texto de Live Caption nativo; dictados y ratificaciones originales conservados en el [antecedente íntegro](antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md), §§13–17 y SI-D001–008.

**Dónde está:** main publica `0.10.37`; la candidata consolidada `0.10.38` está en la PR [#67](https://github.com/SeryMente/signal-interpreter/pull/67), con CI verde y sin merge. El operador confirmó históricamente transcripción nativa visible, con clasificación errónea de idiomas y buffers repetidos. **A dónde va:** presencia segura y texto nativo conservado en tramos de idioma, sin inferir identidad de voz. **Qué cambió:** se consolidaron los cambios de presencia/segmentación de #60, las correcciones útiles del runtime/instalador ya presentes en main y la omisión segura del sondeo horario si no hay pestaña autenticada. La aceptación en Windows permanece pendiente.

Incluido: Windows + Chrome; Live Caption → Windows UI Automation → Native Messaging → overlay; carriles por idioma, historial, copiar/buscar, hotloading, controles existentes; instalación portable desde raíz y laboratorio aislado con muestra incluida. MacOS/Linux son entornos de desarrollo, no plataformas de producto acreditadas.

Excluido/vetado: captura de micrófono o pestaña para el overlay, Groq/fallback de voz, replay, atribución biométrica, rutas de audio históricamente sustituidas, infraestructura metodológica nueva. Los papeles de la dramatización no equivalen a identidades de hablantes. No reducir el objetivo a «audio reproduce» o «panel conecta» para declarar éxito.

## Roles y colaboración

- **Samantha, constructor:** único escritor de código; entrega evidencia/checkpoint. Metacanon 1.24 §§6/24 reserva Remote Desktop Commander al rol asistente y prohíbe al constructor invocarlo para cualquier fin, incluida lectura/descubrimiento; esta regla superior sustituye cualquier excepción remota histórica del frente para el rol constructor. El constructor continúa por GitHub/sandbox/artefactos autorizados; no realiza acciones GUI, no interviene llamadas reales y no declara aceptación sin evidencia. **Claudia, asistente:** revisión/continuidad; toda operación remota que resulte estrictamente necesaria corresponde únicamente a ese rol y conserva sus propias compuertas.
- **Claudia, asistente:** revisión y continuidad; conserva su posible operación remota bajo sus propias compuertas. La excepción directa de este hilo no le transfiere responsabilidad ni crea actividad suya. Vínculo/equipo/permiso se comprueban por operación, no se heredan del objeto.
- Salida del constructor recibida por Claudia: atender primero en punto seguro, contrastar evidencia, resumir delta/viabilidad/tiempo y entregar prompt completo de continuación sin reiniciar ni duplicar trabajo. Emitir prompt no demuestra ejecución.
- Un escritor por recurso; consolidación documental secuencial. El alcance actual incluye la candidata técnica expresamente encargada; no instancia ni contacta otro agente. Antes de escribir revalidar revisión/contenido; si hay otro delta, conciliar o detener esa publicación, no sobrescribir.


### Regla permanente: pruebas locales y responsabilidad técnica

**La prueba local de uso real la realiza el operador humano: el operador eres tú y la ejecutas usando Signal Interpreter en el equipo y entorno de destino.** No debo sustituir esa validación, simularla ni declarar que la realicé. Tampoco debo operar tu equipo, GUI, navegador o llamadas reales desde el rol constructor.

**Yo me encargo de todo el trabajo restante del frente**, dentro de las autorizaciones y compuertas metodológicas vigentes: análisis y diagnóstico; revisión y modificación del código; diseño de casos y criterios de aceptación; pruebas unitarias, de integración, regresión, sandbox y harnesses automatizados; análisis estático y de seguridad; revisión de dependencias y empaquetado; CI y workflows; inspección de resultados, logs y telemetría saneados; gestión técnica de ramas/PR; documentación, trazabilidad, control de versiones y preparación de entregas. No limitar esta responsabilidad a recomendar pasos: debo ejecutar directamente todo lo que pueda realizarse de forma autorizada sin la presencia física del operador.

Cuando una conclusión dependa de uso real en Windows/Chrome o de interacción humana, debo preparar una instrucción de prueba concreta y breve con precondiciones, pasos observables, resultado esperado, criterio PASS/FAIL y evidencia mínima segura que se debe devolver. **Tú ejecutas la prueba usando el sistema y me compartes el resultado; yo analizo la evidencia, localizo la causa, implemento las correcciones que correspondan, repito las pruebas automatizables y actualizo el estado canónico.** No pedir texto, audio, capturas ni datos sensibles de llamadas cuando basten estados, errores, contadores o logs saneados.

Esta división es permanente para Signal Interpreter y prevalece en futuras retomas: **operador = uso y prueba local real; constructor = todo el trabajo técnico y de entrega que no requiera esa interacción local**. No crea permisos remotos, no modifica la prohibición RDC del rol constructor y no convierte una prueba del operador en aceptación hasta revisar la evidencia y los criterios definidos.

## Autoridad

El encargo original [SI-D009](originales/C-SIGNAL-METACANON-20261020-01.md) autoriza actualizar este objeto para ajustarlo al metacanon actual, incluida su reorganización documental como directorio. Sustituye únicamente el estado anterior «migración pendiente de autorización» para esta migración; se conserva literalmente como antecedente. Ese encargo documental por sí solo no autorizaba código, instalación o merge. Órdenes posteriores autorizaron protección de disponibilidad y corrección de la mezcla de idiomas de extremo a extremo. La orden histórica de preparación local no anula Metacanon 1.24 §§6/24: el constructor no opera RDC. No se autoriza exposición de datos privados, arquitectura de captura nueva, gasto ni aprobación de pruebas inexistentes.

Decisiones posteriores aprobadas: automatismo telefónico solo tras «Estoy disponible»; vídeo manual; idle/bloqueo/fin de disponibilidad revocan sin colgar llamada actual; retorno no rearma; incierto = bloquear. El plazo de 150s fue retirado; NO hay límite numérico nuevo ratificado. La candidata requiere selección expresa (opciones 1/3/5/10 minutos, sin default). No confundir temporizadores técnicos de autorización con presencia.

Participantes declarados por el operador: intérprete por micrófono, cliente habitualmente inglés, LEP español. Idioma NO demuestra identidad; la fuente nativa actual no trae identificación fiable de hablante. Fuente `yo` si llegara a estar verificada corresponde al INTÉRPRETE, jamás al LEP; **no se activó captura de micrófono**. «INTERVENCIÓN · LIVE» es incertidumbre de clasificación, no prueba de una tercera voz. Si se requiere transcribir al intérprete, hace falta resolver explícitamente fuente, privacidad y permiso de captura: no inferirlo de la declaración del canal ni reemplazar por Groq.

Decisiones vigentes: fuente nativa exclusiva (§15 antiguo); raíz portable y laboratorio aislado (§16); muestra integrada y no carga manual (§17 y SI-D002–004); separación estricta de roles; evidencia causal previa al cambio. Aprobación documental no equivale a aceptación Windows. Los vetos siguen vigentes.

Antes de cambiar código, instalar o pedir otra prueba: hecho observado + fuente/entorno + alcance de la evidencia + hipótesis separada + prueba causal pertinente. No solicitar otra vez el JSON ya recibido. No modificar lector C# por semejanza de título/clase. Ante timeout, verificar efectos antes de repetir; no presumir ausencia de ejecución.

Privacidad actual comprobada del repositorio: **público**. No incorporar secretos, cuentas/dispositivos, capturas, texto/audio clínico, normas privadas íntegras ni originales restringidos. La historia ya pública se preserva byte por byte; su existencia no autoriza nuevas exposiciones. Pendientes privados se declaran como faltantes, no «verbatim» reconstruido.

## Perfil de entorno

Producto objetivo Windows/Chrome. En equipo autorizado se comprobó usuario normal, Escritorio, preparación de 0.10.36, integridad, muestra incluida, identidad de extensión, protocolo y registro HKCU a la misma raíz. Chrome posteriormente registra esa raíz y existe proceso de CaptionHost; estos hechos solos no certifican texto visible. Rutas privadas, cuentas e identificadores no se publican aquí.

El operador después confirma texto visible en una llamada y aporta contenido privado con errores de idiomas. Observabilidad 0.10.36 recibió eventos `SIGNAL_CAPTION_NATIVE_TEXT_FORWARDED` de un único contexto nativo entre `2026-10-21T01:18:29.735Z` y `2026-10-21T01:29:03.376Z` en la revisión examinada: son metadatos de caracteres, NO texto de la conversación. La coincidencia temporal es consistente con su salida, pero no se recibió identificador privado suyo para probar igualdad exacta. Véase recibo saneado. Lectura posterior fijada a `c21c2e861ac6b52acefd12fc876d19c810855127`: informe consolidado reciente `status=complete`, generado `2026-10-21T01:32:46.481Z`, 354 eventos nativos reenviados y texto fresco observado; build de observabilidad `ok` a `2026-10-21T01:34:38.244Z`. Esto actualiza el corte inicial, cuyo índice aún era histórico. El campo de filas del informe antiguo no prueba por sí solo DOM visible ni atribución correcta; no se recibió el contenido de la llamada en telemetría.

Sandbox Linux: lógica real y DOM Chromium con eventos sintéticos para candidata; NO Windows UI Automation ni aceptación del host del operador. Históricamente se observó un intento de preparación remota con efecto incierto; queda como antecedente y no debe repetirse a ciegas. **Actualización de evidencia r3 leída el 2026-10-29:** el registro local identifica paquete 0.10.38, inventario 59/59, 34/34 pruebas, Native Messaging registrado/protocolo PASS y smoke Chromium 149 headless con extensión/service worker/popup y cero errores; informa que el perfil principal de Chrome permaneció intacto. Es evidencia reportada por registros locales, no una prueba nueva ejecutada por este ciclo. No se verificó Cloud Interpreter autenticado, llamada real, Live Caption nativo, idle/bloqueo/desbloqueo/suspensión Windows ni upgrade en perfil activo. No hubo escrituras ni acciones GUI en el equipo durante esta retoma.

## Estado vivo

### 🔄 Estado vivo

```text
Corte vigente 2026-10-30 · generación 5. Titularidad ACTIVA y releída: folio SES-20261030-3B3868DF; commit de transferencia 2beb165cb792f072a6b5448d47a6e0a74b5c853f; blob del control d057a5db249939c381892f831d76a81103190074. La generación 4 y su folio anterior quedaron preservados.
main continúa en 0.10.37. La observabilidad reciente del baseline 0.10.37 confirma el fallo del sondeo horario/cola cuando falta la pestaña autenticada de Cloud Interpreter.
La candidata 0.10.38 permanece en PR #67, abierta, borrador y sin merge. Rama fix/pipeline-e2e-20261029. Merge de reconciliación de producto y observaciones: bd21f384b9b6e17aef0184faec9040f53340b4d1; primer padre main 0bdbf2b44f76ccb657c6d989c8864c8bb0f67ac0, segundo padre candidata anterior 058fbe65cdbc1be2901320442f1416ae586988c4. La cabeza documental posterior de la rama, tras actualizar la ficha candidata, es 23762a153ad18b1694e73384ac8341e456d0e93e.
La reconciliación de árboles conservó los 40 cambios exclusivos de producto/prueba de la candidata e incorporó 47 rutas de observabilidad y cinco rutas de gobierno/continuidad de main. No hubo solapamientos de contenido. La comparación tras el merge bd21 quedó en 68 commits por delante y 0 por detrás del main incorporado; tras actualizar la ficha a 23762, la rama quedó 69 commits por delante y 0 por detrás de ese mismo main. main ha avanzado desde entonces con la crónica y este corte canónico; esas actualizaciones documentales deben incorporarse a la rama en el siguiente merge de sincronización.
CI exacta 3/3 PASS en el merge commit bd21f384:
- Package integrity: 41084675899
- signal-observability-audit: 41084675586
- native-caption-host-build: 41084675595
La auditoría incluye el regresor scheduled no-tab. El host compiló, se empaquetó y pasó framing/clean shutdown de Native Messaging.
CI exacta 3/3 PASS también en la cabeza documental 23762a153:
- Package integrity: 41085127879
- signal-observability-audit: 41085127695
- native-caption-host-build: 41085127828
La ficha docs/versions/0.10.38-candidate.md fue actualizada en 23762 y releída exactamente. Los tres runs anteriores de bd21 y los tres de 23762 son checks de sus respectivos SHA; no atribuirlos a otra revisión posterior sin releer GitHub.
En sandbox Linux/Node 22.16.0 se habían reportado presence-guard 29/29, presence-connect 22/22, caption-language-spans 46/46 y scheduled-no-tab PASS. Son harnesses sintéticos; no equivalen a aceptación Windows.
El operador realiza la prueba de uso real utilizando SI en Windows/Chrome. El constructor realiza el resto del trabajo técnico: diagnóstico, edición, pruebas automatizadas, seguridad, CI, gestión de PR, documentación y entrega. El constructor no opera equipo, GUI, navegador o llamadas reales y no utiliza RDC (§§6/24).
Mantener PR #67 en borrador. No fusionar ni liberar 0.10.38 hasta integrar el último delta documental, revalidar CI sobre la cabeza resultante y completar las compuertas de aceptación del operador.
```

### ⚗️ En prueba / recién fallido

```text
Baseline de main 0.10.37, batch batch-10ae7bc3-7bb8-4e48-90d6-db951509f69c, 2026-10-30T15:41:50.501Z, secuencias 7165–7167: PLATFORM_OFFICIAL_HOURLY_SYNC_STARTED, EARNINGS_SYNC_QUEUE_ERROR y PLATFORM_OFFICIAL_HOURLY_SYNC_ERROR. El agregado registró 0 errores y 2 warnings; el health del build observacional quedó ok e inboxRemaining=0. Mensaje saneado: «No se pudo sincronizar sin afectar la llamada: abre Cloud Interpreter primero».
La candidata incluye omisión controlada para ausencia de pestaña autenticada. La auditoría de CI del merge bd21 ejecutó Scheduled official sync no-tab safety regression y concluyó success; también mantuvo visibles fallos de red genuinos en el test. Es CI sintética, no una observación real del producto 0.10.38 en Windows.
Windows/Chrome: Live Caption nativo, segmentación visible, presencia/idle/bloqueo/desbloqueo/suspensión, errores reales, pestañas múltiples y upgrade/rollback siguen NO VERIFICADOS en el entorno del operador sobre la revisión exacta.
Micrófono del intérprete no se captura; identidad de tres voces y pureza universal de idioma no están demostradas. Desconocido se conserva sin inventar atribución.
```

### Pendientes en secuencia

1. **SI-P01 — Sincronización documental final:** integrar en la rama candidata la crónica y el OCP actualizados de main, preservando ambos historiales y la ficha de versión; mover la rama con SHA esperado. Verificar compare y que el diff PR siga limitado a los 40 archivos de candidata.
2. **SI-P02 — CI de la cabeza final:** ejecutar/leer Package integrity, signal-observability-audit y native-caption-host-build sobre el SHA resultante; revisar logs ante cualquier fallo.
3. **SI-P03 — Regresores y paquete:** mantener verificados guard de presencia, Connect, segmentos, sondeo sin pestaña, inventario SHA-256, raíz portable, instalador y host; confirmar que los vetos audio/Groq/replay continúan respetados.
4. **SI-P04 — Aceptación local del operador:** sobre el SHA exacto preparado, probar Live Caption real, tramos inglés/español, pérdida/duplicación, segmentos ambiguos, idle/bloqueo/desbloqueo/suspensión corta, errores de API, reinicio, múltiples pestañas, llamada actual intacta, upgrade y rollback. Devolver PASS/FAIL y telemetría saneada; no compartir texto/audio de llamadas.
5. **SI-P05 — Liberación:** solo después de CI exacta, revisión del operador y compuertas completas, evaluar pasar PR #67 a ready y fusionar.
6. **SI-P06 — Tercer canal:** si persiste el requerimiento de transcribir al intérprete, resolver fuente, privacidad y autorización; no activar micrófono o ruta alternativa por inferencia.
7. **SI-P07 — Custodia/diferidos:** preservar originales disponibles; no pedir otra vez el JSON histórico. Sincronización perpetua/cifrado/PRIUS siguen diferidos y fuera del alcance de este cierre.

### 🔔 Recordatorios latentes

- Mantener #59 separada como diagnóstico; #60/#63 y sus antecedentes no se reabren ni se convierten en estado vigente.
- 150 segundos revocados; no reactivar plazos antiguos. Vídeo manual. Idle/ausencia revoca autorización pero no debe colgar la llamada actual; retorno no rearma.
- Teclado/ratón no prueban presencia física; ausencia de señal = bloquear, no inventar garantía.
- Cliente/LEP son convenciones lingüísticas, no diarización. Fragmentos ambiguos se conservan sin atribución forzada.
- Preservar fuente nativa exclusiva, privacidad, exportación y funciones existentes. Nada de micrófono/pestaña/Groq/replay como arreglo encubierto.
- No publicar texto hablado, audio, nombres, teléfonos, cuentas, identificadores de equipo ni secretos.
- Copia puntual no es sincronización automática; no portar permisos, identidades ni decisiones de otro frente.

## Aceptación y viabilidad

Resultado vigente: retoma del mismo FT; titularidad transferida a generación 5, ACTIVA y verificada por lectura de vuelta. Metodología adquirida: Metacanon 1.24 / DUG v362 · NX-362m / GOW 2.11. PR #67 continúa abierta/en borrador; main conserva 0.10.37 y candidata 0.10.38 aún NO LIBERADA ni aceptada en Windows.

| Requisito | Estado implementado / evidencia | Aceptación y pendiente |
|---|---|---|
| Disponibilidad segura | Candidata 0.10.38 incorpora guard de presencia, autorización efímera y no rearme automático; regresores sintéticos previos PASS | CI de auditoría success en bd21 y 23762; falta prueba real idle/bloqueo/suspensión y llamada actual intacta |
| Separación de idiomas | Segmentación local de texto Live Caption; ambigüedad neutra; harness 46/46 reportado | Requiere repetibilidad y tramos visibles en Live Caption real; heurística no es garantía universal |
| Sondeo horario | Baseline 0.10.37 observó error de cola/sondeo sin pestaña; candidato incluye omisión y test | Test sintético pasó en CI bd21; falta prueba de operación real posterior a instalar 0.10.38 |
| Integridad/host | Package integrity, auditoría y compilación/protocolo Native Messaging 3/3 success en bd21 y 23762 | Revalidar el SHA tras sincronización final de documentación/observaciones; operador comprueba upgrade/rollback |
| Tres participantes | Idioma no equivale a identidad; no se habilitó captura de micrófono | Identidad remota/canal del micrófono no demostrados ni autorizados |
| Observabilidad | Main tiene baseline fresco de 0.10.37; health ok, inbox 0 | La respuesta de 0.10.38 y nuevos contadores aún no están validados en el Windows real |

Cono terminal de liberación: revisión exacta reconciliada + integridad + CI 3/3 + Windows seguro + fuente nativa real + segmentación visible + protección de presencia + sondeo sin pestaña autenticada + errores reales observables + upgrade/rollback + aceptación expresa del operador. Pruebas de fixture, CI y Chromium headless no sustituyen aceptación integral Windows. No declarar «todo terminado».

Pronóstico: integración documental final y re-ejecución CI son ejecutables por el constructor; la aceptación Windows no es estimable desde este rol, pues depende de uso físico por el operador sobre la revisión exacta. No inventar fecha ni basarse en disponibilidad RDC.

## Formato de ciclo

Conservar agrupados, sin omitir: (1) frente/rol/sello y Metacanon versión/sello/revisión/frescura; (2) panorama; (3) delta de método y proyecto; (4) avance/evidencia/entorno y no tocado; (5) pendientes/bloqueos; (6) intención→viabilidad→aceptación y límites; (7) siguiente hito/cierre con pronóstico fundado o dependencia no estimable; (8) siguiente acción y mínima intervención material; (9) continuación/prompt pertinente; (10) persistencia, ID de crónica, revisión y checkpoint.

Cada ciclo sustantivo conserva originales realmente disponibles y salida visible efectiva, con procedencia/corte, antes del cierre; no solo al handoff. Distinguir observado, reportado, histórico, sintético, inferido y desconocido; propuesto, autorizado, intentado, ejecutado, verificado y aceptado. Resultado incierto no equivale a fallo y no se repite a ciegas. No prometer trabajo o captura automática en segundo plano.

## Crónica y fuentes

- [Candidata consolidada #67](https://github.com/SeryMente/signal-interpreter/pull/67), [compuertas de versión 0.10.38](https://github.com/SeryMente/signal-interpreter/blob/fix/pipeline-e2e-20261029/docs/versions/0.10.38-candidate.md), payload probado `e15b0ed8828e13cf7357be3bdcfd9a6e5f8b67eb`, cabeza PR `a5d6d4ab0b119da8cc8a3c6950edc0f0f236cf5c`; CI exacta [Package integrity](https://github.com/SeryMente/signal-interpreter/actions/runs/40986509054), [auditoría](https://github.com/SeryMente/signal-interpreter/actions/runs/40986508942), [host nativo](https://github.com/SeryMente/signal-interpreter/actions/runs/40986509019), los tres `success`. PR #60/#63 se conservan como historial supersedido; #59 continúa separada. No fusionar la candidata hasta completar aceptación Windows y reconciliar el núcleo documental de la rama.
- [Informe consolidado recibido](https://github.com/SeryMente/signal-interpreter/blob/c21c2e861ac6b52acefd12fc876d19c810855127/observations/latest/latest-call-report.json); no texto clínico. [Windows CI](https://github.com/SeryMente/signal-interpreter/actions/runs/39528993131/job/118990266837) y [auditoría CI](https://github.com/SeryMente/signal-interpreter/actions/runs/39528993110/job/118990266881).

- [Crónica de retoma y evidencia del 2026-10-29 · generación 4](cronica/C-SIGNAL-RETOMA-20261029-G4.md); entrada literal del operador, procedencia del adjunto, transferencia/read-back, fuentes vigentes, evidencia r3 y límites.
- [Crónica de retoma y transferencia del 2026-10-30 · generación 5](cronica/C-SIGNAL-RETOMA-20261030-G5.md); autorización literal, control G5/read-back, delta de ramas, batch observacional del baseline 0.10.37, límites y siguiente secuencia.
- [Crónica de reconciliación de candidata y CI del 2026-10-30 · generación 5](cronica/C-SIGNAL-RECONCILIACION-CI-20261030-G5.md); merge con ambos padres, preservación del árbol, PR base actualizada, CI 3/3 en bd21f384 y CI 3/3 en la actualización documental 23762a15.
- [Crónica del ciclo de nueva sesión RDC y regresores aislados](cronica/C-SIGNAL-RDC-TESTS-20261029-G4.md): instrucción, compuerta de rol, runs CI, cuatro resultados de Node y límites explícitos; no contiene identificadores de dispositivo ni tokens.
- [Crónica del cierre técnico 0.10.38 y reconciliación de ramas](cronica/C-SIGNAL-CIERRE-TECNICO-20261029-G4.md): análisis de árboles, merge con ambos padres, regresores aislados, tres workflows verdes y validación local reservada al operador.
- [Crónica del corte actual](cronica/C-SIGNAL-SEGURIDAD-IDIOMAS-20261020-01.md); [corte anterior preservado](cronica/C-SIGNAL-METACANON-20261020-01.md).
- [Originales disponibles saneados](originales/C-SIGNAL-SEGURIDAD-IDIOMAS-20261020-01.md): órdenes/ratificaciones y extractos no sensibles; contenido clínico excluido expresamente, no custodia íntegra fingida. [Originales del corte anterior](originales/C-SIGNAL-METACANON-20261020-01.md) preservados.
- [Antecedente íntegro pre-1.9](antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md): 1152 líneas originales, conservadas sin renumerar. Sus estados/prompts/instrucciones de ruta son históricos, no otro núcleo activo. Fuente exacta y hash en recibo.
- [Candidata diagnóstica #59](https://github.com/SeryMente/signal-interpreter/pull/59): comprobada abierta, borrador, no fusionada, cabeza `0f7f9516b0e1bfbb76aa982c7ee1b87c7f9855b0`. El texto de su body todavía dice JSON pendiente: el estado posterior conservado acredita recepción por Claudia; no volver a pedirlo por esa cita antigua.
- [Runtime y especificación fuente](../../USER-REQUIREMENT-LIVE-CAPTIONS-OVERLAY-VERBATIM-20261008.md), [arquitectura de observabilidad](../../OBSERVABILITY-ARCHITECTURE-BROWSER-GITHUB-v2.md), [versiones](../../versions/): fuentes técnicas de alcance, no núcleos paralelos. No releídas íntegramente aquí ni presentadas como prueba Windows actual.
- Originales restringidos SI-D005/SI-D007, `session-instructions.json`, capturas, JSON y sondas privadas: referenciados en antecedente, **no recuperados completos en este ciclo**. Sus hashes no garantizan disponibilidad ni custodia entre plataformas.

## Reinstanciación

[Prompt de Samantha, constructor](PROMPT-SAMANTHA.md) y [prompt de Claudia, asistente](PROMPT-CLAUDIA.md), subordinados al [prompt universal](https://github.com/SeryMente/metodologia/blob/main/PROMPT-UNIVERSAL-REINSTANCIACION.md). Son disparadores estables al núcleo, no copias manuales de su estado. Al retomar: adquirir gobierno/método y esta misma revisión; citar literalmente los dos bloques de estado/prueba leídos aquí y comprobar siguiente acción/permisos. Un prompt no crea acceso a repositorio privado ni obliga a otro modelo.

## Persistencia y revisión

Releer base y método antes de escribir; ante delta/concurrencia conciliar, no sobrescribir. Separar actualización del núcleo en main de candidata técnica en rama revisable, sin declarar el código candidato como desplegado. Revalidar control de responsabilidad antes de escribir. La transferencia a generación 5 quedó ejecutada y verificada en `main`; control blob `d057a5db249939c381892f831d76a81103190074`, commit `2beb165cb792f072a6b5448d47a6e0a74b5c853f`, con generación 4 preservada. La candidata se reconcilió con main en merge commit `bd21f384b9b6e17aef0184faec9040f53340b4d1`, conservando ambos padres; la lectura de vuelta verificó el árbol completo. CI 3/3 PASS en `bd21f384` y de nuevo en la actualización documental `23762a153ad18b1694e73384ac8341e456d0e93e`. La crónica y este nuevo corte documental de main deben sincronizarse en la rama antes del siguiente cierre. La herramienta de escritura múltiple no instala fencing global: no afirmar exclusión mutua técnica. Si se detecta otro escritor o delta, detener publicación y conservar payload local para conciliación.

Dos pasadas: fidelidad (historia/hash, alcance, vetos, roles, pendientes y originales) y resultado guardado (estructura/semántica, enlaces, prompts, versiones, estado y prueba de vuelta). Comprobar también casos negativos: fuente privada inaccesible, operación incierta, excepción remota acotada no general, histórico no actual y cambio de base. Las comprobaciones mecánicas no prueban comprensión de otro modelo.

Sin escritura remota: entregar delta/paquete completo **NO GUARDADO**, no simular persistencia. No borrar historia ni reactivar una propuesta al migrar. Copia puntual no equivale a sincronización perpetua; infraestructura de sincronización, cifrado y observador no se instaló. Guardar antes de un corte y declarar el último material realmente custodiado.

<!-- END_CANONICAL_CORE -->
