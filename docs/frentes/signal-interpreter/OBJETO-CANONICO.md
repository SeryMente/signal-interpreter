# Signal Interpreter — núcleo operativo único

<!-- BEGIN_CANONICAL_CORE -->

## Control e identidad

- Frente: **Signal Interpreter**; propietario: `SeryMente/signal-interpreter`.
- Revisión documental: **SI-OBJ-v1.15-retoma-G9-20261101-01**; ancla: **C-SIGNAL-RETOMA-20261101-G9-01F5BFEA**, transferencia de titularidad y reanudación del 2026-11-01. Naturaleza: actualización del OCP heredado; no proyecto nuevo.
- Directorio canónico: `docs/frentes/signal-interpreter/`. Este archivo es la única materialización del estado vigente y de la Versión de Contexto Universal del frente; README y prompts son navegación, no estados paralelos.
- Base preservada: main `5751281d3fca0a1fc7cb37a69c8cd4bba3632075`, objeto anterior blob `799ed39a297a911aceab46a91f206a14a8361f7c`, sello `SI-OBJ-v1.5-evidencia-04`.
- Estado de producto: `main` contiene Signal Interpreter **0.10.39**, integrado por PR [#68](https://github.com/SeryMente/signal-interpreter/pull/68). CI post-merge de auditoría y host nativo pasó 2/2 en `8955c1cae996d150052483cdf0d5da37c4da41eb`. No hay release. El paquete 0.10.39 quedó staged en el Escritorio autorizado y el puente Native Messaging terminó instalado/verificado; Chrome aún no ha cargado la extensión y la aceptación real Windows/Chrome/llamada OPI sigue pendiente.
- Persistencia verificable: identificar la revisión Git que contiene este archivo y el [recibo de migración](evidencias/C-SIGNAL-METACANON-20261020-01.json); el recibo identifica la base y los contenidos, no autocertifica publicación o conformidad semántica.

## LEER PRIMERO

Modo: continuar el mismo frente como **una sola instancia responsable G9** (`SES-20261101-01F5BFEA`). No crear, asignar, invocar ni coordinar un segundo agente; no dividir trabajo por papeles; no generar prompts dobles ni transferencias internas.

Leer este núcleo y adquirir gobierno vigente antes de actuar. Consultar después solo fuentes/evidencias necesarias para el objetivo actual; no recorrer toda la historia por rutina.

Precedencia: plataforma y autorización vigente → Metaprompt Canónico y Metacanon pertinentes → gobierno particular de este frente. [Entrada del gobierno distribuido](https://github.com/SeryMente/metodologia/blob/main/INICIO.md). El repositorio metodológico requiere acceso autorizado; no copiar su contenido privado a este repositorio público ni pedir credenciales en el chat. Revalidar fuente y revisiones desde `main`; una referencia histórica no prueba frescura, autorización o ejecución. Fuente indispensable ausente bloquea solo la acción dependiente.

**Modo operativo vigente:** una instancia única G9 tiene titularidad y responsabilidad integral de Signal Interpreter. El operador conserva decisiones humanas, uso real, llamadas reales, aceptación y liberación. Esta disposición no se propaga a otros proyectos. G8 quedó SUSTITUIDA por G9 mediante transferencia condicionada por SHA/generación y doble read-back. G7 y G8 permanecen en el historial como titulares anteriores. M34/M35 son antecedentes históricos cerrados; PC-14 está expresamente excluido por el operador.

## Referencia metodológica

- **Metacanon adquirido: 1.28**; DUG **v377 · NX-377m**; GOW **2.17**.
- Fuente canónica releída desde `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`, commit `8ee2482866b3dd085e58e05006727256d0274376`, blob `54064c8fe00f872023a455f06596061ed69062ae`. `INICIO.md` confirma DUG v377, Metacanon 1.28 y GOW 2.17.
- Control vigente: [CONTROL-RESPONSABILIDAD.json](CONTROL-RESPONSABILIDAD.json), **G9 · ACTIVO · agente_unico**, folio `SES-20261101-01F5BFEA`, alias `chatgpt-signal-interpreter-SES-20261101-01F5BFEA`, UUIDv7 local `01A199C7-AD7F-77D8-B66B-8B070269D6A6`. Blob final `6ae9903479394ebda40beff83d392fd86a61bad8`; commit de cierre de read-back `d86cc48d20addc6c09360eb5b185c0eaf8274b95`. G8 (`SES-20261101-76B4BFF9`) quedó SUSTITUIDO y permanece en el historial.
- Se revisaron manualmente P001/P004/P005/P037/P038/P043, §42 de Metacanon y vocabulario GOW relativo a Arranque en Frío, MDP, SPDF, Persistencia documental, Registro conversacional, FT y Control de responsabilidad. `INICIO.md` refiere §ARR; no se localizó un encabezado literal §ARR en las secciones humanas recuperadas, por lo que su ubicación exacta queda NO VERIFICADA. **MCP-NORMATIVO: DESACTIVADO**. No se presume sincronización con Notion u otras superficies.

### Constancia de adquisición y aplicación

| Fuente/regla | Requisito de esta acción | Evidencia | Resultado |
|---|---|---|---|
| DUG v373 / Metacanon 1.26 | Un frente, una instancia, un OCP y un control | M34/M35 en §24; control G6 actualizado y releído | Modo agente único registrado |
| P036/M35 | Resolver identidad y autorizar excepción puntual para PC-14 | Revalidación CLI + confirmación expresa del operador | Excepción usada solo para este staging; P036 general intacto |
| M34/M35 / §24 | RDC mínimo y temporal para PC-14 | Staging e instalador ejecutados, recibo y registro releídos | Excepción cerrada/verificada; sin permiso remoto futuro |
| §§22–23 | Una única instrucción operativa | `PROMPT-SIGNAL-INTERPRETER.md`, README actualizado, prompts paralelos retirados del árbol activo | Una sola vía de reinstanciación |
| Persistencia de observabilidad | Confirmar batch durable y proceso | GitHub: 10,384 batches, 19 informes de llamada, 1,878 snapshots, 1,858 deltas; health `ok`, inbox 0 | Medio provisional confirmado; versión runtime observada aún 0.10.37 |
| §28 | Originales, secuencia, crónica, read-back | Crónica de este ciclo y revisión Git | Historia preservada, sin fingir acciones no ejecutadas |

## Propósito y alcance

**De dónde viene:** mejorar calidad de vida en interpretación telefónica, apoyada en texto de Live Caption nativo; dictados y ratificaciones originales conservados en el [antecedente íntegro](antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md), §§13–17 y SI-D001–008.

**Dónde está:** `main` publica **0.10.39**, integrada por PR #68 en `f9ddfade6fbdf1b04448906301c3d98de00930e5`. El paquete exacto quedó staged desde commit `f4ee70caa2f22b3fbc52493ef17d2f21837ab103`. El instalador oficial finalizó con exit code 0; hashes, protocolo Native Messaging y registro HKCU PASS; el SHA del ejecutable instalado coincidió con el esperado. No hay PR abiertas ni release. Falta cargar la extensión en Chrome y aceptación real Windows/Chrome.

Incluido: Windows + Chrome; Live Caption → Windows UI Automation → Native Messaging → overlay; carriles por idioma, historial, copiar/buscar, hotloading, controles existentes; instalación portable desde raíz y laboratorio aislado con muestra incluida. MacOS/Linux son entornos de desarrollo, no plataformas de producto acreditadas.

Excluido/vetado: captura de audio de pestaña, Groq/fallback de voz como ruta no aprobada, replay, atribución biométrica, rutas de audio históricamente sustituidas e infraestructura metodológica nueva. La captura del micrófono del intérprete deja de estar excluida por la instrucción directa del operador del 2026-10-30, pero queda limitada a una llamada aceptada/activa y sujeta a diseño explícito de permisos, privacidad, estado de llamada y pruebas. No habilita escucha durante espera o timbrado, grabación duradera ni envío de audio/texto clínico a observabilidad. Los papeles de la dramatización no equivalen a identidades de hablantes. No reducir el objetivo a «audio reproduce» o «panel conecta» para declarar éxito.

## Agente único responsable

Una sola instancia mantiene la responsabilidad completa del frente: análisis, diseño dentro de decisiones autorizadas, código, pruebas automatizadas, CI, ramas/PR, revisión de resultados, observabilidad, persistencia, documentación, instalación permitida, control, crónicas y continuidad. No existe una segunda instancia responsable ni una división activa de tareas. No se producen mensajes de relevo ni prompts por separado.

**Responsabilidad humana reservada:** el operador decide lo que requiere consentimiento, realiza el uso real que no pueda ejecutarse por CLI, controla las llamadas reales y emite la aceptación funcional y la autorización de liberación. La instancia no simula uso, no interviene una llamada real y no declara aceptación sin evidencia revisable.

**RDC M34/M35:** staging e instalación oficial en PC-14 fueron hechos históricos de una sesión anterior, ya consumida y cerrada. Esta mención preserva la trazabilidad y no autoriza ni recomienda reutilizar PC-14. En la retoma actual el operador indicó PC-8; se usó solo para lectura/hash del export y después quedó OFFLINE. PC-14 está expresamente EXCLUIDO. No hay operación RDC actualmente en curso.

**Criterio de ejecución:** realizar directamente todo diagnóstico, edición, automatización, pruebas aisladas, análisis y persistencia que esté autorizado y no requiera interacción real del operador. Cuando exista una dependencia humana, emitir una instrucción breve con precondiciones, resultado esperado, PASS/FAIL y evidencia mínima saneada. La salida debe reflejar qué fue observado, reportado, histórico, sintético, inferido o desconocido. Un único prompt activo: [PROMPT-SIGNAL-INTERPRETER.md](PROMPT-SIGNAL-INTERPRETER.md).

## Autoridad

El encargo original [SI-D009](originales/C-SIGNAL-METACANON-20261020-01.md) y las órdenes posteriores se conservan como procedencia del mismo frente. La instrucción directa del 2026-10-30 establece una sola instancia responsable para todo Signal Interpreter y supersede en la capa activa cualquier distribución anterior de tareas o prompts. DUG v373 · NX-373m, Metacanon 1.26 §24 M34/M35, autorizó el staging/instalación CLI en este PC-14 y perfil únicamente para esta sesión; la autorización está consumida y cerrada. P036 general no fue modificado. No se autorizó GUI, llamadas reales, otros equipos, sesiones futuras, exposición de datos privados, captura de micrófono/pestaña, arquitectura vetada ni liberación sin aceptación.

Decisiones posteriores aprobadas: automatismo telefónico solo tras «Estoy disponible»; vídeo manual; idle/bloqueo/fin de disponibilidad revocan sin colgar llamada actual; retorno no rearma; incierto = bloquear. El plazo de 150s fue retirado; NO hay límite numérico nuevo ratificado. La candidata requiere selección expresa (opciones 1/3/5/10 minutos, sin default). No confundir temporizadores técnicos de autorización con presencia.

Participantes declarados por el operador: intérprete por micrófono, cliente habitualmente inglés, LEP español. Idioma NO demuestra identidad; la fuente nativa actual no trae identificación fiable de hablante. Fuente `yo` verificada corresponde al INTÉRPRETE, jamás al LEP; en 0.10.39 no se activó captura de micrófono. «INTERVENCIÓN · LIVE» es incertidumbre de clasificación, no prueba de una tercera voz.

### Addendum 2026-10-30 — retroalimentación directa de llamada

El operador solicita: (1) micrófono siempre silenciado en espera y durante timbrado; (2) permitir apertura únicamente después de una llamada aceptada/activa; (3) transcribir el canal propio del intérprete en español e inglés; (4) mejorar continuidad, precisión, segmentación y atribución de la transcripción; (5) compactar el overlay para priorizar el texto; y (6) abrir el historial en una pestaña independiente de Chrome.

La política objetivo provisional de mute registra la intención inicial expresada por el operador: micrófono disponible/sin mute al establecerse la llamada contestada. La corrección posterior describe el comportamiento observado en 0.10.39: la llamada inicia con mute y exige desbloqueo manual. Esa observación se conserva como comportamiento actual, no como aceptación del objetivo. Espera, timbrado, estado incierto, desconexión y fin de llamada deben permanecer silenciados; solo una transición verificable a llamada aceptada/activa puede habilitar el micrófono.

Esta instrucción supersede para el trabajo futuro la exclusión anterior de captura del micrófono, únicamente para el canal propio del intérprete y dentro de una llamada activa. No autoriza captura de audio de pestaña, escucha en espera, grabación duradera, telemetría de audio/texto clínico ni proveedor ASR específico. El diseño debe resolver permisos, indicador visible, fuente independiente, retención y cierre seguro antes de construir la captura.

Los hallazgos de transcripción se limitan a la muestra privada aportada en la conversación: fragmentos incompletos, posibles duplicaciones de hipótesis parciales, errores en entidades críticas, habla solapada y mezcla entre fuente/idioma/rol. El idioma no puede usarse para inferir identidad; `source`, `speaker` y `language` son dimensiones distintas. La captura y la muestra no se copian al repositorio público.

El detalle ejecutable está en [Backlog provisional de retroalimentación de llamada](BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md), estado PERSISTIDO/PROVISIONAL/NO IMPLEMENTADO, tareas SI-FB-01 a SI-FB-06. Esta actualización documental no altera el paquete instalado, no realiza captura ni concede permisos de RDC/GUI/Chrome o llamadas reales. La aceptación de la prueba de usuario y la liberación permanecen reservadas al operador.

Decisiones vigentes: texto nativo de Chrome para el canal entrante; nueva solicitud de transcripción del micrófono propio, acotada a llamada activa, según addendum de 2026-10-30; raíz portable y laboratorio aislado (§16); muestra integrada y no carga manual (§17 y SI-D002–004); una sola instancia responsable; evidencia causal previa al cambio. Aprobación documental no equivale a aceptación Windows. Los demás vetos siguen vigentes; la captura del micrófono solo se permite dentro del alcance descrito en el addendum.

Antes de cambiar código, instalar o pedir otra prueba: hecho observado + fuente/entorno + alcance de la evidencia + hipótesis separada + prueba causal pertinente. No solicitar otra vez el JSON ya recibido. No modificar lector C# por semejanza de título/clase. Ante timeout, verificar efectos antes de repetir; no presumir ausencia de ejecución.

Privacidad actual comprobada del repositorio: **público**. No incorporar secretos, cuentas/dispositivos, capturas, texto/audio clínico, normas privadas íntegras ni originales restringidos. La historia ya pública se preserva byte por byte; su existencia no autoriza nuevas exposiciones. Pendientes privados se declaran como faltantes, no «verbatim» reconstruido.

## Perfil de entorno

Producto objetivo Windows/Chrome. En equipo autorizado se comprobó usuario normal, Escritorio, preparación de 0.10.36, integridad, muestra incluida, identidad de extensión, protocolo y registro HKCU a la misma raíz. Chrome posteriormente registra esa raíz y existe proceso de CaptionHost; estos hechos solos no certifican texto visible. Rutas privadas, cuentas e identificadores no se publican aquí.

El operador después confirma texto visible en una llamada y aporta contenido privado con errores de idiomas. Observabilidad 0.10.36 recibió eventos `SIGNAL_CAPTION_NATIVE_TEXT_FORWARDED` de un único contexto nativo entre `2026-10-21T01:18:29.735Z` y `2026-10-21T01:29:03.376Z` en la revisión examinada: son metadatos de caracteres, NO texto de la conversación. La coincidencia temporal es consistente con su salida, pero no se recibió identificador privado suyo para probar igualdad exacta. Véase recibo saneado. Lectura posterior fijada a `c21c2e861ac6b52acefd12fc876d19c810855127`: informe consolidado reciente `status=complete`, generado `2026-10-21T01:32:46.481Z`, 354 eventos nativos reenviados y texto fresco observado; build de observabilidad `ok` a `2026-10-21T01:34:38.244Z`. Esto actualiza el corte inicial, cuyo índice aún era histórico. El campo de filas del informe antiguo no prueba por sí solo DOM visible ni atribución correcta; no se recibió el contenido de la llamada en telemetría.

Sandbox Linux: lógica real y DOM Chromium con eventos sintéticos para candidata; NO Windows UI Automation ni aceptación del host del operador. Históricamente se observó un intento de preparación remota con efecto incierto; queda como antecedente y no debe repetirse a ciegas. **Actualización de evidencia r3 leída el 2026-10-29:** el registro local identifica paquete 0.10.38, inventario 59/59, 34/34 pruebas, Native Messaging registrado/protocolo PASS y smoke Chromium 149 headless con extensión/service worker/popup y cero errores; informa que el perfil principal de Chrome permaneció intacto. Es evidencia reportada por registros locales, no una prueba nueva ejecutada por este ciclo. No se verificó Cloud Interpreter autenticado, llamada real, Live Caption nativo, idle/bloqueo/desbloqueo/suspensión Windows ni upgrade en perfil activo. No hubo escrituras ni acciones GUI en el equipo durante esta retoma.

Preflight y ejecución remota: el PC-14 y el perfil Windows autorizado por el operador se verificaron por CLI. Se preparó `Desktop/Signal Interpreter/signal-interpreter` desde commit `f4ee70caa2f22b3fbc52493ef17d2f21837ab103`; el ZIP tuvo SHA-256 `C587E9F13661148FEDAE547B02B3FD05785952DEFE03D76FAEE98108D89E7782`; versión 0.10.39; inventario de 59 payloads verificado. `INSTALAR.ps1` terminó exit code 0. `INSTALACION-RESULTADO.json` leído de vuelta: Hashes PASS, NativeProtocol PASS, NativeHostRegistry PASS, muestra BUNDLED_VERIFIED, ChromeLoaded NO_VERIFICADO, RealCall NO_VERIFICADA. El ejecutable nativo instalado coincidió SHA-256 `313CCD3312A8C75131EC7C4ADFEBF883B028BCE8AEE8B1EA43BD4DDDBB202EFE`. La excepción M34/M35 quedó cerrada tras este read-back.

## Estado vivo

### 🔄 Estado vivo

```text
Corte 2026-11-01 · generación 9 · instancia única ACTIVA. Control G9: folio `SES-20261101-01F5BFEA`; alias `chatgpt-signal-interpreter-SES-20261101-01F5BFEA`; UUIDv7 local `01A199C7-AD7F-77D8-B66B-8B070269D6A6`; rol `agente_unico`. Control SHA final `6ae9903479394ebda40beff83d392fd86a61bad8`; commit de read-back `d86cc48d20addc6c09360eb5b185c0eaf8274b95`. G8 quedó SUSTITUIDO; se conserva el historial.
Transferencia G8→G9: autorización explícita del operador en esta conversación; CAS por blob anterior `93791ee500064375d9d101ffe866e5076a3488a3`, generación 8; escritura `31c4b06931fc7dee78ed85bee09eb50ff4149c48`; read-back inicial PASS; commit final de verificación `d86cc48d20addc6c09360eb5b185c0eaf8274b95`; lectura final PASS. Control cooperativo, no fencing universal.
Gobierno adquirido: DUG v377 · NX-377m; Metacanon 1.28; GOW 2.17. DUG commit `8ee2482866b3dd085e58e05006727256d0274376`, blob `54064c8fe00f872023a455f06596061ed69062ae`. P001/P004/P005/P037/P038/P043 y Metacanon §42 revisados manualmente; MCP normativo DESACTIVADO.
Producto: el manifest de `main` declara Signal Interpreter 0.10.39 (blob `0cb37ff90b79cd84cf0154c01b055e22485fc5d6`). No se ejecutó CI, no se instaló, no se cargó Chrome ni se hizo prueba real en este ciclo. El export anterior informa un patch ART-028 local no aplicado; sus artefactos no fueron recuperados ni revalidados.
Persistencia observacional: GitHub sigue siendo el depósito provisional descrito en el núcleo; el último corte heredado observaba runtime 0.10.37, 10,384 batches y health ok. E2E de 0.10.39 sigue sin demostrarse. No se leyó telemetría nueva en esta retoma.
Export recibido: `ChatGPT-SI-20261101-1724.md`, 81,920 bytes, 1,488 líneas, SHA-256 `7C92BC2DE3301EEFC12F531ECE33C6C1E9B79329AF4355441395B0190A264A0B`. Capturado y leído en PC-8; sin escritura remota. Original no publicado ni almacenado en OCP porque el repo es público y la revisión de privacidad/credenciales/datos de llamada quedó pendiente. Recibo persistido: `evidencias/RECIBO-EXPORT-CHATGPT-SI-20261101-1724.json`; crónica: `cronica/C-SIGNAL-RETOMA-20261101-G9-01F5BFEA.md`.
PC-8: autorizado para esta solicitud, usado para localizar/leer/hash y después OFFLINE. PC-14: EXCLUIDO expresamente; no utilizar. No hay operación RDC actual.
Pendientes: revisión de custodia del export original; aceptar manualmente 0.10.39 en Windows/Chrome cuando el operador lo decida; verificar persistencia provisional E2E con runtime 0.10.39; SI-P04 liberación; SI-FB-01–SI-FB-06. No llamadas reales, despliegue ni release.
```



### Captura documental pendiente — exportación 2026-10-31

Se identificó `ChatGPT-SI-20261031-0916.txt` (133.492 bytes; 2.794 líneas; SHA-256 `D906E3399F6F6763546351D0EFB09CB1FCBC1C28E4802BADCE1DA8E67C9B5195`). La carga del original al OCP está pendiente: el repositorio es público y la exportación contiene datos de contacto. No se ha escrito el original, no se ha creado el manifiesto y no se presenta ningún derivado como original. Estado: **NO DISPONIBLE / BLOQUEADO** hasta resolver autorización de exposición o destino privado autorizado.

La última salida visible del modelo anterior no está localizada como registro recuperable en el OCP leído: **NO DISPONIBLE / NO VERIFICADA**. No reconstruirla desde fragmentos.


### Captura documental pendiente — exportación 2026-11-01

Se localizó y leyó `ChatGPT-SI-20261101-1724.md` en `PC-8/Downloads`: 81.920 bytes, 1.488 líneas, exportado/guardado el 2026-11-01 a las 17:24:23 (America/Mexico_City), SHA-256 `7C92BC2DE3301EEFC12F531ECE33C6C1E9B79329AF4355441395B0190A264A0B`. El archivo se leyó y su huella se verificó en PC-8; no se hizo escritura remota.

El recibo [de adquisición y custodia](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261101-1724.json) está persistido y releído, pero el original **NO está adjunto ni persistido en el OCP**. El repositorio es público; no se ha completado revisión de privacidad, credenciales o datos relacionados con llamadas. PC-8 quedó desconectado antes de completar esa revisión. Mantener el original local hasta reconectar PC-8, inspeccionar el contenido completo y decidir un derivado saneado o un destino privado autorizado. No publicar el original sin revisión.
### ⚗️ En prueba / recién fallido

```text
La telemetría más reciente que aparece en el paquete se originó en runtime 0.10.37, no 0.10.39. El batch contiene 3 eventos y el historial tiene 10,384 archivos. El objeto batch más reciente no presenta el campo superior `relayReceivedAt`, aunque la implementación actual del relay lo añade; por tanto, la hora server-side y la frescura de este último registro no están demostradas. La diferencia entre `manifest.generatedAt` (00:40:36.645Z) y `lastInputCreatedAt` (00:41:50.519Z) queda como inconsistencia temporal a investigar, no como prueba de pérdida.
El pipeline vigente ya contiene generación de `incoming-calls-10m.json/md`, corrección temporal usando `relayReceivedAt` y estados de freshness; esos archivos no aparecieron en la última lectura. Confirmar que el workflow programado ejecuta la versión actual y que Vercel sirve el relay de la revisión vigente.
El CI post-merge pasó 2/2 en la revisión de main comprobada; eso valida build/audit, no recepción 0.10.39 en producción.
La sesión remota confirmó el PC-14 y la asociación autorizada; staging y ejecución de `INSTALAR.ps1` finalizaron correctamente. El recibo y el registro de Native Messaging se releieron y cotejaron.
```

### Pendientes en secuencia

1. **SI-P01 — Staging e instalación del puente: COMPLETADO/VERIFICADO en la sesión histórica registrada.** Paquete 0.10.39, 59 hashes, muestra, protocolo y registro HKCU PASS; recibo releído y ejecutable con SHA coincidente. M34/M35 consumidas y cerradas; PC-14 queda ahora EXCLUIDO y no se reutiliza.
2. **SI-P02 — Cargar/aceptar 0.10.39:** el operador realiza la carga manual en `chrome://extensions`, confirma versión y perfil, rearma presencia según los guards y realiza la prueba real cuando decida. Revisar la telemetría saneada, `observations/latest/incoming-calls-10m.json/md` y health. No asumir llamada contestada; no compartir audio/texto.
3. **SI-P03 — Cerrar persistencia provisional E2E 0.10.39:** tras la carga, verificar batch recibido con extensionVersion 0.10.39, `relayReceivedAt`, ACK, drenaje del inbox, ejecución de build, freshness y materialización del informe de diez minutos. Resolver el posible desajuste de despliegue Vercel/revisión y la discrepancia temporal. Mantener GitHub como depósito provisional; no migrar la persistencia global sin decisión posterior.
4. **SI-P04 — Liberación:** solo después de pruebas Windows/Chrome, integridad, rollback, evidencia real y aceptación expresa del operador. No crear release por el mero merge o CI.
5. **SI-FB-01–SI-FB-06 — Retroalimentación de llamada 2026-10-30:** backlog provisional persistido en [BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md](BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md). Seguridad de mute, transcripción bilingüe del intérprete, calidad, densidad del overlay, lector en nueva pestaña y matriz de aceptación. Todas las tareas permanecen pendientes.
6. **Custodia de exportación 2026-11-01:** completar revisión de privacidad del original local en PC-8 y decidir destino autorizado/derivado saneado. El recibo de adquisición está persistido; el original no está publicado ni adjunto al OCP.

### 🔔 Recordatorios latentes

- PR #59 está cerrada sin merge; el laboratorio no es requisito de esta entrega y no debe reabrirse por defecto. #60/#63 y sus antecedentes permanecen históricos.
- #67 ya está fusionada; no crear una nueva PR para repetir su contenido.
- En 0.10.39, el puente Native Messaging se instala automáticamente mediante `PREPARAR-Y-CARGAR.cmd` / `INSTALAR.ps1`; no ejecutar manualmente `extension/native/register-caption-host.ps1`. Cargar la raíz de la extensión en Chrome sí es manual.
- 150 segundos revocados; no reactivar plazos antiguos. Vídeo manual. Idle/ausencia revoca autorización pero no debe colgar la llamada actual; retorno no rearma.
- Teclado/ratón no prueban presencia física; ausencia de señal = bloquear, no inventar garantía.
- Cliente/LEP son convenciones lingüísticas, no diarización. Fragmentos ambiguos se conservan sin atribución forzada.
- Preservar texto nativo para el canal entrante y privacidad. La nueva captura de micrófono propio solo se permite después de llamada aceptada/activa y mediante el alcance explícito SI-FB-02; no habilitar audio de pestaña, grabación duradera, envío de audio/texto a observabilidad, Groq no aprobado ni replay.
- No publicar texto hablado, audio, nombres, teléfonos, cuentas, identificadores de equipo ni secretos.
- Copia puntual no es sincronización automática; no portar permisos, identidades ni decisiones de otro frente.

## Aceptación y viabilidad

Estado: **desarrollo 0.10.39 integrado; staging e instalación Native Messaging PC-14 PASS; medio repo-backed histórico confirmado; recepción E2E 0.10.39 y carga Chrome/aceptación funcional aún pendientes. Backlog provisional de retroalimentación de llamada persistido; ninguna de sus seis tareas está implementada ni aceptada.**

| Requisito | Estado implementado / evidencia | Aceptación y pendiente |
|---|---|---|
| Integración de desarrollo | PR #68 integrada; `main` 0.10.39; CI post-merge de auditoría y host nativo 2/2 SUCCESS en SHA `8955c1cae996d150052483cdf0d5da37c4da41eb` | No hay release; aceptación real pendiente |
| Modo de trabajo del frente | Control G7 ACTIVO como `agente_unico`; un prompt activo; README actualizado; prompts anteriores retirados del árbol activo | Read-back verificado; historial Git anterior permanece como historia |
| Persistencia provisional | 10,384 batches; 19 informes de llamada; 1,878 snapshots; 1,858 deltas; último health `ok`; inbox 0 | Operación histórica confirmada; runtime más reciente 0.10.37; falta E2E 0.10.39 |
| Relay Vercel | Código server-side usa `GITHUB_TOKEN` y escribe `observations/inbox`; GitHub muestra procesamiento automático reciente | Recepción efectiva observada; Vercel management/logs API 403; no se inspeccionó secret ni deployment |
| Informe incoming 10m | Código de pipeline genera JSON/Markdown y aplica corrección por `relayReceivedAt` | Los artefactos no aparecieron en última lectura; falta batch 0.10.39 con receipt timestamp |
| Identidad/entorno PC-14 | Dispositivo RDC Online; M35 autorizó la asociación actual solo para esta instalación | Revalidación CLI PASS; permiso remoto cerrado tras instalación |
| Puente Native Messaging | `INSTALAR.ps1` ejecutado en el perfil autorizado | Receipt PASS, protocolo PASS, registro PASS y SHA del ejecutable coincidente |
| Aceptación funcional | Guards y pruebas sintéticas verdes | Falta carga manual en Chrome, llamada OPI controlada y aceptación expresa |

Cono terminal de liberación: integridad + CI sobre SHA candidato + instalación segura en el perfil correcto + carga Chrome + fuente nativa real + segmentación visible + guards de presencia + telemetría 0.10.39 fresca + informe incoming 10m + upgrade/rollback + aceptación expresa. Fixtures, CI y Chromium headless no sustituyen aceptación integral Windows.

## Formato de ciclo

Conservar agrupados, sin omitir: (1) frente/instancia única/sello y Metacanon versión/sello/revisión/frescura; (2) panorama; (3) delta de método y proyecto; (4) avance/evidencia/entorno y no tocado; (5) pendientes/bloqueos; (6) intención→viabilidad→aceptación y límites; (7) siguiente hito/cierre con pronóstico fundado o dependencia no estimable; (8) siguiente acción y mínima intervención material; (9) prompt operativo único pertinente; (10) persistencia, ID de crónica, revisión y checkpoint.

Cada ciclo sustantivo conserva originales realmente disponibles y salida visible efectiva, con procedencia/corte, antes del cierre; no solo al handoff. Distinguir observado, reportado, histórico, sintético, inferido y desconocido; propuesto, autorizado, intentado, ejecutado, verificado y aceptado. Resultado incierto no equivale a fallo y no se repite a ciegas. No prometer trabajo o captura automática en segundo plano.

## Crónica y fuentes

- [Retoma G7 — 2026-10-31](cronica/C-SIGNAL-RETOMA-20261031-G7-86FFBCFE.md): transferencia autorizada y verificada, estado técnico contrastado y custodia documental pendiente.

- [Crónica de este ciclo · agente único, M34/M35, persistencia e instalación PC-14](cronica/C-SIGNAL-AGENTE-UNICO-PERSISTENCIA-20261030-G6.md); instrucciones directas, DUG v373, control G6, evidencia repo-backed, staging y recibo de instalación.
- [PR #68 · Signal Interpreter 0.10.39](https://github.com/SeryMente/signal-interpreter/pull/68), fusionada en `f9ddfade6fbdf1b04448906301c3d98de00930e5`. CI 3/3 success en el SHA probado `55416e125922c9e0d3ecad93bffe9edc74a27f85`; workflows push de main aún en curso en la última lectura. Sin release ni aceptación Windows/Chrome.
- [Housekeeping 0.10.38, cierre de PRs y handoff de prueba del 2026-10-30 · generación 5](cronica/C-SIGNAL-HOUSEKEEPING-20261030-G5.md); merge #67, cierre sin merge de #59, consulta sin PR abiertas, read-back de manifest, conclusión del puente automático y bloqueo metodológico histórico de staging RDC.

- [Informe consolidado recibido](https://github.com/SeryMente/signal-interpreter/blob/c21c2e861ac6b52acefd12fc876d19c810855127/observations/latest/latest-call-report.json); no texto clínico. [Windows CI](https://github.com/SeryMente/signal-interpreter/actions/runs/39528993131/job/118990266837) y [auditoría CI](https://github.com/SeryMente/signal-interpreter/actions/runs/39528993110/job/118990266881).

- [Crónica de retoma y evidencia del 2026-10-29 · generación 4](cronica/C-SIGNAL-RETOMA-20261029-G4.md); entrada literal del operador, procedencia del adjunto, transferencia/read-back, fuentes vigentes, evidencia r3 y límites.
- [Crónica de retoma y transferencia del 2026-10-30 · generación 5](cronica/C-SIGNAL-RETOMA-20261030-G5.md); autorización literal, control G5/read-back, delta de ramas, batch observacional del baseline 0.10.37, límites y siguiente secuencia.
- [Crónica de retoma y transferencia G8→G9 · 2026-11-01](cronica/C-SIGNAL-RETOMA-20261101-G9-01F5BFEA.md); autorización, CAS/read-back G9, DUG v377, recepción del export y custodia pendiente. [Recibo del export](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261101-1724.json).
- [Crónica de reconciliación de candidata y CI del 2026-10-30 · generación 5](cronica/C-SIGNAL-RECONCILIACION-CI-20261030-G5.md); merge con ambos padres, preservación del árbol, PR base actualizada, CI 3/3 en bd21f384 y CI 3/3 en la actualización documental 23762a15.
- [Crónica de sincronización final y CI del 2026-10-30 · generación 5](cronica/C-SIGNAL-FINAL-SYNC-20261030-G5.md); merge documental 0601cf0c, compare 70/0 y CI 3/3 en la cabeza exacta.
- [Estado final de PR #67 y CI del 2026-10-30 · generación 5](cronica/C-SIGNAL-PR-FINAL-STATE-20261030-G5.md); base main leída de vuelta, diff 40 archivos, compare 71/0, mergeable_state clean y CI 3/3 sobre 5f57a47c; aceptación local del operador pendiente.
- [Crónica del ciclo de nueva sesión RDC y regresores aislados](cronica/C-SIGNAL-RDC-TESTS-20261029-G4.md): instrucción, compuerta de rol, runs CI, cuatro resultados de Node y límites explícitos; no contiene identificadores de dispositivo ni tokens.
- [Crónica del cierre técnico 0.10.38 y reconciliación de ramas](cronica/C-SIGNAL-CIERRE-TECNICO-20261029-G4.md): análisis de árboles, merge con ambos padres, regresores aislados, tres workflows verdes y validación local reservada al operador.
- [Crónica del corte actual](cronica/C-SIGNAL-SEGURIDAD-IDIOMAS-20261020-01.md); [corte anterior preservado](cronica/C-SIGNAL-METACANON-20261020-01.md).
- [Originales disponibles saneados](originales/C-SIGNAL-SEGURIDAD-IDIOMAS-20261020-01.md): órdenes/ratificaciones y extractos no sensibles; contenido clínico excluido expresamente, no custodia íntegra fingida. [Originales del corte anterior](originales/C-SIGNAL-METACANON-20261020-01.md) preservados.
- [Antecedente íntegro pre-1.9](antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md): 1152 líneas originales, conservadas sin renumerar. Sus estados/prompts/instrucciones de ruta son históricos, no otro núcleo activo. Fuente exacta y hash en recibo.
- [PR #59 · diagnóstico del laboratorio](https://github.com/SeryMente/signal-interpreter/pull/59): cerrada sin fusionar el 2026-10-30 por decisión del operador; trabajo de laboratorio no prioritario, rama e historial preservados.
- [Runtime y especificación fuente](../../USER-REQUIREMENT-LIVE-CAPTIONS-OVERLAY-VERBATIM-20261008.md), [arquitectura de observabilidad](../../OBSERVABILITY-ARCHITECTURE-BROWSER-GITHUB-v2.md), [versiones](../../versions/): fuentes técnicas de alcance, no núcleos paralelos. No releídas íntegramente aquí ni presentadas como prueba Windows actual.
- Originales restringidos SI-D005/SI-D007, `session-instructions.json`, capturas, JSON y sondas privadas: referenciados en antecedente, **no recuperados completos en este ciclo**. Sus hashes no garantizan disponibilidad ni custodia entre plataformas.

## Reinstanciación

[Prompt operativo único](PROMPT-SIGNAL-INTERPRETER.md), subordinado al objeto canónico y al gobierno vigente. El checkpoint de esta revisión es G9 (`SES-20261101-01F5BFEA`), pero cada retoma debe releer el control, verificar generación/SHA y adquirir el gobierno actual. No instancies identidades adicionales ni emitas prompts paralelos. Un prompt no crea permiso, conectividad, persistencia ni aceptación.

## Persistencia y revisión

Releer base y método antes de escribir; ante delta/concurrencia conciliar, no sobrescribir. **Control G9 ACTIVO** y modo `agente_unico` releídos; blob `6ae9903479394ebda40beff83d392fd86a61bad8`, commit de cierre `d86cc48d20addc6c09360eb5b185c0eaf8274b95`. G8 quedó SUSTITUIDO con histórico preservado. La transferencia G8→G9 quedó COMMITTED_AND_READBACK_VERIFIED bajo el evento `SIGNAL-INTERPRETER-TRANSFER-20261101-G9-01F5BFEA`. El control es cooperativo y no garantiza fencing frente a escritores que lo eludan.

Gobernanza actual releída: DUG v377 · NX-377m, commit `8ee2482866b3dd085e58e05006727256d0274376`, blob `54064c8fe00f872023a455f06596061ed69062ae`; Metacanon 1.28; GOW 2.17. MCP normativo desactivado. La localización precisa de §ARR queda NO VERIFICADA.

Prompt operativo único actualizado: blob `08f645dc63e9008b775c32b64bea20978c436f70`; README continúa apuntando al prompt único. Crónica G9 persistida: blob `7570620e5c97dcc4f46ce82f71a9a8f173209065`. Recibo de exportación persistido: blob `37b87c76540d2f9586cd1c210c710537f27cd634`.

Versión de producto: manifest 0.10.39 (blob `0cb37ff90b79cd84cf0154c01b055e22485fc5d6`). PR #68 permanece como la integración histórica del baseline. No se volvió a ejecutar CI ni se hizo release en este ciclo.

Persistencia provisional: `observations/manifest.json` y el corte heredado siguen registrando 10,384 batches, 19 informes de llamada, 1,878 snapshots y 1,858 deltas; health `status=ok`, inbox 0. El último batch visible en ese corte es de runtime 0.10.37 y no contiene `relayReceivedAt` superior. El pipeline de main contiene el informe incoming de diez minutos y freshness; los artefactos no aparecieron en esa lectura. Vercel management/logs API devolvió 403; no se inspeccionó el secret. Recepción histórica no prueba runtime 0.10.39, timestamp fiable ni frescura actual.

**Export documental 2026-11-01:** el archivo `ChatGPT-SI-20261101-1724.md` fue localizado, leído y hasheado en PC-8; 81.920 bytes, 1.488 líneas, SHA-256 `7C92BC2DE3301EEFC12F531ECE33C6C1E9B79329AF4355441395B0190A264A0B`. Solo el recibo de custodia está publicado y verificado. El original no está en el repositorio público: falta revisión completa de privacidad/credenciales/datos de llamada. PC-8 quedó offline; PC-14 está expresamente excluido.

PC-14/M34/M35 son historia cerrada y no habilitan acceso futuro. PC-8 fue autorizado por el operador para la solicitud actual, usado solo para lectura/hash y está offline. No se ejecutó RDC ahora, no se intervinieron llamadas reales ni se modificó el producto.

Copia puntual a GitHub no equivale a sincronización global perpetua. Mantener los lotes históricos append-only; ninguna limpieza, compactación destructiva ni migración sin decisión expresa, prueba de integridad y read-back.

Dos pasadas: fidelidad a originales/decisiones y resultado guardado/read-back. Cada ciclo sustantivo conserva salida visible y crónica, distingue estados propuesto/autorizado/intentado/ejecutado/verificado/aceptado y declara los límites.
