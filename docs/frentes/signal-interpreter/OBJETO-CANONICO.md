# Signal Interpreter — núcleo operativo único

<!-- BEGIN_CANONICAL_CORE -->

## Control e identidad

- Frente: **Signal Interpreter**; propietario: `SeryMente/signal-interpreter`.
- Revisión documental: SI-OBJ-v1.20-G14-20261108-01; ancla: SIGNAL-INTERPRETER-TRANSFER-20261108-G14-593ACFE5. Actualización del mismo OCP; no crea un frente nuevo.
- Directorio canónico: `docs/frentes/signal-interpreter/`. Este archivo es la única materialización del estado vigente y de la Versión de Contexto Universal del frente; README y prompts son navegación, no estados paralelos.
- Base preservada: main `5751281d3fca0a1fc7cb37a69c8cd4bba3632075`, objeto anterior blob `799ed39a297a911aceab46a91f206a14a8361f7c`, sello `SI-OBJ-v1.5-evidencia-04`.
- Estado de producto: main conserva 0.10.40; PR #75 contiene candidata 0.10.45 y sigue sin merge remoto. La candidata fue integrada localmente con origin/main sin conflictos en worktree aislado; commit local 49f18e18e88918575278ed083db31d127d21a892. Chrome del perfil CENTRAL\fila4 sigue cargando 0.10.42; no se modificó ni recargó. Native Messaging del perfil fila4 existe y el ejecutable coincide con SHA esperado. No hay release.
- Persistencia verificable: identificar la revisión Git que contiene este archivo y el [recibo de migración](evidencias/C-SIGNAL-METACANON-20261020-01.json); el recibo identifica la base y los contenidos, no autocertifica publicación o conformidad semántica.

## LEER PRIMERO

Modo: continuar como una sola instancia responsable G14; alias/UUIDv7 local chatgpt-signal-interpreter-01a1bd8b-8291-7906-b862-6088593acfe5; generación 14. No crear segunda instancia ni dividir titularidad. FOL1 sigue PREPARADA, NO ACTIVA.

Leer este núcleo y adquirir gobierno vigente antes de actuar. Consultar después solo fuentes/evidencias necesarias para el objetivo actual; no recorrer toda la historia por rutina.

Precedencia: plataforma y autorización vigente → Metaprompt Canónico y Metacanon pertinentes → gobierno particular de este frente. [Entrada del gobierno distribuido](https://github.com/SeryMente/metodologia/blob/main/INICIO.md). El repositorio metodológico requiere acceso autorizado; no copiar su contenido privado a este repositorio público ni pedir credenciales en el chat. Revalidar fuente y revisiones desde `main`; una referencia histórica no prueba frescura, autorización o ejecución. Fuente indispensable ausente bloquea solo la acción dependiente.

**Modo operativo vigente:** G14 es titular único ACTIVO de Signal Interpreter; G13 quedó SUSTITUIDO mediante SIGNAL-INTERPRETER-TRANSFER-20261108-G14-593ACFE5. El control se escribió con precondición SHA y se leyó de vuelta; blob de control 52733e7a21b87b85ad3754fef2dd837e2c9d7928. MantenimientoRCI opera el agente; el entorno y destino operativo son los del usuario Windows CENTRAL\fila4. Esta regla aplica solo a este frente. El operador conserva aceptación funcional en llamada real y liberación.

## Referencia metodológica

- **Metacanon adquirido: 1.29**; DUG **v383 · NX-383m**; GOW **2.18**.
- Fuente canónica releída desde `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`, HTML canónico blob `cad464717c43733aa84b49f8c9c3af0875597fbd`; §ARR consultado. `INICIO.md` visible conserva metadatos anteriores y no se usó para sustituir la fuente canónica.
- Control vigente: CONTROL-RESPONSABILIDAD.json; G14 ACTIVO, agente único; alias/UUIDv7 local 01a1bd8b-8291-7906-b862-6088593acfe5; generación 14; evento SIGNAL-INTERPRETER-TRANSFER-20261108-G14-593ACFE5; blob/read-back 52733e7a21b87b85ad3754fef2dd837e2c9d7928 verificado. G13 SUSTITUIDO. Folio pendiente mientras FOL1 no esté activa.
- Se consultaron §ARR, P001/P004/P005/P007/P008/P011/P019/P033/P038/P043 y Metacanon §§4/24/42/47 pertinentes. **MCP-NORMATIVO: DESACTIVADO**. No se presume sincronización con Notion u otras superficies.

### Constancia de adquisición y aplicación

| Fuente/regla | Requisito de esta acción | Evidencia | Resultado |
|---|---|---|---|
| DUG v373 / Metacanon 1.26 · antecedente histórico | Un frente, una instancia, un OCP y un control | M34/M35 en §24; control G6 actualizado y releído | Modo agente único registrado en aquel ciclo; sustituido después |
| P036/M35 · antecedente PC-14 | Resolver identidad y autorizar excepción puntual para una instalación | Revalidación CLI + confirmación expresa del operador en 2026-10-31 | Excepción consumida y cerrada; no se reutiliza; PC-14 excluido en la retoma actual |
| M34/M35 / §24 · antecedente | RDC mínimo y temporal para PC-14 | Staging e instalador ejecutados, recibo y registro releídos | Ejecución histórica cerrada/verificada; no concede acceso futuro |
| §§22–23 | Una única instrucción operativa | `PROMPT-SIGNAL-INTERPRETER.md`, README actualizado, prompts paralelos retirados del árbol activo | Una sola vía de reinstanciación |
| Persistencia de observabilidad | Confirmar batch durable y proceso | GitHub: 10,384 batches, 19 informes de llamada, 1,878 snapshots, 1,858 deltas; health `ok`, inbox 0 | Medio provisional confirmado; versión runtime observada aún 0.10.37 |
| §28 | Originales, secuencia, crónica, read-back | Crónica de este ciclo y revisión Git | Historia preservada, sin fingir acciones no ejecutadas |

## Propósito y alcance

**De dónde viene:** mejorar calidad de vida en interpretación telefónica, apoyada en texto de Live Caption nativo; dictados y ratificaciones originales conservados en el [antecedente íntegro](antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md), §§13–17 y SI-D001–008.

**Dónde está:** main conserva 0.10.40. PR #75 contiene candidata 0.10.45. La reconciliación con origin/main se probó localmente en work/g14-pr75-reconcile y terminó sin conflictos; todavía no se publicó ni fusionó. Chrome en el perfil CENTRAL\fila4 sigue cargando 0.10.42 desde el checkout original.

Incluido: Windows + Chrome; Live Caption → Windows UI Automation → Native Messaging → overlay; carriles por idioma, historial, copiar/buscar, hotloading, controles existentes; instalación portable desde raíz y laboratorio aislado con muestra incluida. MacOS/Linux son entornos de desarrollo, no plataformas de producto acreditadas.

Excluido/vetado: captura de audio de pestaña, Groq/fallback de voz como ruta no aprobada, replay, atribución biométrica, rutas de audio históricamente sustituidas e infraestructura metodológica nueva. La captura del micrófono del intérprete deja de estar excluida por la instrucción directa del operador del 2026-10-30, pero queda limitada a una llamada aceptada/activa y sujeta a diseño explícito de permisos, privacidad, estado de llamada y pruebas. No habilita escucha durante espera o timbrado, grabación duradera ni envío de audio/texto clínico a observabilidad. Los papeles de la dramatización no equivalen a identidades de hablantes. No reducir el objetivo a «audio reproduce» o «panel conecta» para declarar éxito.

## Agente único responsable

Una sola instancia G14 mantiene la responsabilidad completa del frente: análisis, diseño autorizado, código, pruebas automatizadas, CI, ramas/PR, revisión, observabilidad, persistencia, documentación, control y continuidad. No hay una segunda instancia responsable.

**Responsabilidad humana reservada:** el operador decide lo que requiere consentimiento, realiza el uso real que no pueda ejecutarse por CLI, controla las llamadas reales y emite la aceptación funcional y la autorización de liberación. La instancia no simula uso, no interviene una llamada real y no declara aceptación sin evidencia revisable.

**RDC vigente G14:** PC10RCIF4EI4 permite operar el agente mediante MantenimientoRCI; artefactos, checkout, perfil Chrome y destino deben permanecer bajo C:/Users/fila4. Identidad del proceso Chrome verificada como CENTRAL\fila4. Se abrió ChatGPT en el perfil fila4, pero no se identificó de forma inequívoca el URL profundo de esta conversación; no afirmar que este hilo exacto quedó seleccionado. No intervenir llamadas reales ni hacer que tests sintéticos simulen aceptación. La instalación activa sigue sin recarga.

**Criterio de ejecución:** realizar directamente todo diagnóstico, edición, automatización, pruebas aisladas, análisis y persistencia que esté autorizado y no requiera interacción real del operador. Cuando exista una dependencia humana, emitir una instrucción breve con precondiciones, resultado esperado, PASS/FAIL y evidencia mínima saneada. La salida debe reflejar qué fue observado, reportado, histórico, sintético, inferido o desconocido. Un único prompt activo: [PROMPT-SIGNAL-INTERPRETER.md](PROMPT-SIGNAL-INTERPRETER.md).

## Autoridad

El encargo original [SI-D009](originales/C-SIGNAL-METACANON-20261020-01.md) y las órdenes posteriores se conservan como procedencia del mismo frente. La instrucción directa del 2026-10-30 estableció una sola instancia responsable para todo Signal Interpreter y supersedió cualquier distribución anterior de tareas o prompts. **Antecedente histórico:** DUG v373 · NX-373m, Metacanon 1.26 §24 M34/M35 autorizó una sola instalación CLI en PC-14 durante esa sesión; la autorización está consumida y cerrada, y P036 general no fue modificado. **Estado actual:** el operador excluyó expresamente PC-14 y señaló PC-8 para esta retoma; PC-8 solo se usó para leer/hash del export y luego quedó offline. No se autoriza GUI, intervención de llamadas reales, exposición de datos privados, cambios metodológicos ni liberación sin aceptación.

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

**Registro histórico de PC-14 (2026-10-30/31; no repetir):** el PC-14 y el perfil Windows autorizado por el operador se verificaron por CLI. Se preparó `Desktop/Signal Interpreter/signal-interpreter` desde commit `f4ee70caa2f22b3fbc52493ef17d2f21837ab103`; el ZIP tuvo SHA-256 `C587E9F13661148FEDAE547B02B3FD05785952DEFE03D76FAEE98108D89E7782`; versión 0.10.39; inventario de 59 payloads verificado. `INSTALAR.ps1` terminó exit code 0. `INSTALACION-RESULTADO.json` leído de vuelta: Hashes PASS, NativeProtocol PASS, NativeHostRegistry PASS, muestra BUNDLED_VERIFIED, ChromeLoaded NO_VERIFICADO, RealCall NO_VERIFICADA. El ejecutable nativo instalado coincidió SHA-256 `313CCD3312A8C75131EC7C4ADFEBF883B028BCE8AEE8B1EA43BD4DDDBB202EFE`. La excepción M34/M35 quedó cerrada tras este read-back. El operador excluyó PC-14 en la retoma actual.

## Reglas operativas del frente

### SI-OP-01 — El puente Chrome Native Messaging forma parte de la materialización Windows

**Estado:** PROVISIONAL · Regla de operación del frente · 2026-11-08

Cuando el operador solicite materializar Signal Interpreter en el Escritorio del usuario operativo de Windows, el procedimiento estándar debe instalar y verificar el puente Chrome Native Messaging como parte de la misma materialización. No debe dejarse como paso opcional ni como tarea posterior.

Alcance mínimo de la rutina:

1. Materializar el ejecutable host, el manifiesto Native Messaging y los scripts de preparación/registro que correspondan al paquete canónico.
2. Registrar el host en el ámbito del usuario operativo mediante la clave HKCU y comprobar que su ruta absoluta apunta al ejecutable de la materialización final. No usar elevación administrativa para una instalación por usuario salvo que una dependencia concreta la exija y exista autorización.
3. Validar que el manifiesto declare el nombre de host correcto, el origen permitido de la extensión y una ruta ejecutable existente.
4. Cotejar SHA-256 del ejecutable materializado contra el hash autorizado del paquete.
5. Ejecutar la prueba de protocolo Native Messaging y hacer read-back del manifiesto, registro y resultado de la prueba bajo el mismo perfil Windows.
6. Conservar el resultado y distinguir materializado, registrado, protocolo probado y verificado. Si cualquiera de las comprobaciones falla, informar la materialización como INCOMPLETA; no afirmar que el puente está operativo.

La regla se aplica a instalaciones nuevas o a materializaciones que cambien la ubicación final del host. En actualizaciones de una extensión ya instalada se puede reutilizar el puente existente solo después de comprobar que el ejecutable, manifiesto, registro HKCU y ruta corresponden al paquete y destino actuales; no reinstalarlo a ciegas. La recarga de la extensión en Chrome sigue siendo una acción separada y no queda implícita por instalar el host.

Esta regla no declara que el puente haya sido instalado en una máquina por el mero hecho de estar escrita aquí. Cada ejecución necesita evidencia propia y read-back.

## Estado vivo

### 🔄 Estado vivo

```text
Corte 2026-11-07 · generación 11 · única instancia ACTIVA. Control G11: SES-20261107-6495BAA5; alias chatgpt-signal-interpreter-SES-20261107-6495BAA5; UUIDv7 local 01a1b703-181f-7838-a492-0d21cf717013; rol agente_unico. Control SHA 3461d073fe8c76d9aa0a7d472d8f0a7b1e54846b; read-back PASS. G10 (SES-20261106-95D9F8B5) SUSTITUIDO; historial conservado.
Transferencia G10→G11: SIGNAL-INTERPRETER-TRANSFER-20261107-G11-6495BAA5; confirmación «Bien sigue»; SHA previo bb0cb36c3add81987caa99c4d63e4722ddb4487b; generación 10; commit de escritura 086600fdefa78695b9ff9d150f434735ff72ddff; verificación 2cc5ee82bc3bda5c65fa6d551bdf8156a8cbd373; autorización superior alineada en 169600c99c58489c71a5b4c4bb4c4b3b073a1671. UUIDv7 local, no ID nativo; unicidad global NO VERIFICADA.
Gobierno: DUG v377 · NX-377m; Metacanon 1.28; GOW 2.17; blob 54064c8fe00f872023a455f06596061ed69062ae (mismo blob en la última lectura). Último commit en Metodología main: `b66789064c7e6efed4b712f3b2e7bfab9744f4d9`; su diff afecta solo `frentes/ep/README.md` y no altera el HTML canónico del DUG ni la gobernanza de Signal Interpreter. §ARR; P001/P004/P005/P037–P043; Metacanon §§4/28/42/47 y ART-007/012/014 revisados. MCP normativo DESACTIVADO. FOL1 PREPARADO, NO ACTIVO; folios CONV/CICLO/A/B no asignados.
Producto en main: manifest.json 0.10.40 (blob aa3ccf76d28397086045c61b399e5fdae3c7cd41). PR #71 cerrada y fusionada el 2026-11-07 17:41:52Z; merge commit 2546d967f15759c2eabac7b4026cc5b4f1cbd081; head integrado ac50779a6e93288b58d7631c74dacca8ae72300e. La comparación de rutas desde el ancestro común no encontró solapamientos; GitHub confirmó mergeable=true/clean antes de fusionar. La configuración del repo tenía allow_update_branch=false, por lo que no se ejecutó una actualización separada de rama; la fusión limpia se realizó directamente y quedó verificada en main.
Corrección adicional: agotamiento terminal de siete reintentos por intento; una mutación DOM no reinicia la cadena y una llamada nueva recibe presupuesto independiente. Inventario SHA-256 59/59 cotejado.
CI del head de la PR ac50779a6e93288b58d7631c74dacca8ae72300e: audit 11096/42396386100 PASS; package 129/42396386110 PASS (59 hashes); host nativo 8749/42396386126 PASS. CI post-merge en 2546d967f15759c2eabac7b4026cc5b4f1cbd081: audit run 11114/42397580798 PASS; host nativo run 8767/42397580803 PASS. Cobertura sintética: presence-guard 42, presence-connect 33, runtime-guard 15. No equivale a aceptación en Chrome del operador ni a llamada real.
Instalación local del operador: la carpeta registrada por Chrome fue actualizada a **0.10.40**. El manifiesto anidado conserva el ID de extensión y define `background.js` como service worker. Read-back exacto: 48/48 archivos de la candidata; inventario canónico 55/59 más cuatro adaptaciones de layout; 0 faltantes. El Native Messaging existente no se reinstaló ni modificó; su ejecutable estable conserva SHA-256 `313CCD3312A8C75131EC7C4ADFEBF883B028BCE8AEE8B1EA43BD4DDDBB202EFE`. El respaldo previo 0.10.39 conserva 50/50 archivos sin discrepancias; el sample local se restauró y cotejó con `sample.json`. La recarga de Chrome no se ha realizado: Secure Preferences aún registra la versión de service worker anterior hasta que el operador pulse Recargar. No se usaron llamadas reales ni se declaró aceptación. No hay release.
Export ChatGPT-SI-20261107-1105.txt: 55,257 bytes, 1,270 líneas; SHA-256 B23EB3895BEFDC7AC546DACFD90FB81BF1CD25B5E36B01DCDE3933EE4E5A6182; lectura RDC completa y SHA cotejado con el adjunto. Recibo saneado persistido; original no copiado al OCP ni publicado por privacidad/repositorio público y restricción P036 de identidad RDC.
Persistencia observacional: GitHub provisional; telemetría nueva NO LEÍDA; E2E 0.10.40 NO VERIFICADO. Último runtime heredado 0.10.37, no actual.
Pendientes: instalación controlada de 0.10.40 en perfil/identidad autorizados; aceptación funcional restringida a OPI realmente contestable y validación negativa de VRI/desconocida/perfil/presencia; E2E observabilidad; SI-P04 liberación; SI-FB-01–SI-FB-06; custodia privada de exports 2026-10-31/11-01/11-07; recuperar/revalidar ART-028. PR #71 integrada. No llamadas reales, despliegue ni release.
```

### Captura documental pendiente — exportación 2026-10-31

Se identificó `ChatGPT-SI-20261031-0916.txt` (133.492 bytes; 2.794 líneas; SHA-256 `D906E3399F6F6763546351D0EFB09CB1FCBC1C28E4802BADCE1DA8E67C9B5195`). La carga del original al OCP está pendiente: el repositorio es público y la exportación contiene datos de contacto. No se ha escrito el original, no se ha creado el manifiesto y no se presenta ningún derivado como original. Estado: **NO DISPONIBLE / BLOQUEADO** hasta resolver autorización de exposición o destino privado autorizado.

Un extracto sustantivo de la última salida visible del modelo anterior fue recuperado del tramo final del export local y conservado en la sección correspondiente de [la crónica G9](cronica/C-SIGNAL-RETOMA-20261101-G9-01F5BFEA.md). No se presenta como reproducción íntegra/verbatim del mensaje completo; el export íntegro sigue local, no publicado ni custodiado en el OCP.


### Captura documental pendiente — exportación 2026-11-01

Se localizó y leyó `ChatGPT-SI-20261101-1724.md` en `PC-8/Downloads`: 81.920 bytes, 1.488 líneas, exportado/guardado el 2026-11-01 a las 17:24:23 (America/Mexico_City), SHA-256 `7C92BC2DE3301EEFC12F531ECE33C6C1E9B79329AF4355441395B0190A264A0B`. El archivo se leyó y su huella se verificó en PC-8; no se hizo escritura remota.

El recibo [de adquisición y custodia](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261101-1724.json) está persistido y releído, pero el original **NO está adjunto ni persistido en el OCP**. El repositorio es público; no se ha completado revisión de privacidad, credenciales o datos relacionados con llamadas. PC-8 quedó desconectado antes de completar esa revisión. Mantener el original local hasta reconectar PC-8, inspeccionar el contenido completo y decidir un derivado saneado o un destino privado autorizado. No publicar el original sin revisión.
### Captura documental pendiente — exportación 2026-11-07

Se leyó por RDC `ChatGPT-SI-20261107-1105.txt`: 55,257 bytes, 1,270 líneas, exportado 2026-11-07 11:05:45 (America/Mexico_City), SHA-256 `B23EB3895BEFDC7AC546DACFD90FB81BF1CD25B5E36B01DCDE3933EE4E5A6182`. La misma huella se obtuvo del adjunto de esta conversación. Lectura completa en dos rangos; coincidencia exacta de hash verificada.

El recibo [de adquisición y custodia](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261107-1105.json) y la [crónica G11](cronica/C-SIGNAL-RETOMA-20261107-G11-6495BAA5.md) están persistidos y releídos. El original **NO se copió al OCP**: el repositorio es público y el export contiene datos de entorno/telemetría de llamadas. La sesión RDC se ejecutó con una identidad distinta de la propietaria del perfil y P036 bloqueó cualquier escritura en ese perfil. Mantener el original en su fuente; resolver destino privado autorizado. No presentar el recibo saneado como copia íntegra del original.

### ⚗️ Estado de instalación local · lista para recarga manual

```text
PR #71 quedó fusionada por 2546d967f15759c2eabac7b4026cc5b4f1cbd081. main de producto en la carpeta local: 679578fb3580b1518a9adafa5e0f398e1ee6d097; el único commit adicional sobre ese punto antes del read-back añadió una captura diagnóstica, sin cambios de código ni payload.
La carpeta que Secure Preferences registra para la extensión ID ldpbjhobnfgmhdoehehdmnbhhjckebmj ahora contiene manifest anidado 0.10.40, service worker background.js y permiso idle. Chrome mantiene esa ruta registrada; el dato de service_worker_registration_info todavía es 0.10.39 porque la recarga manual no se ha efectuado.
Inventario canónico main: 59 entradas; 55 hashes exactos. Cuatro overlays locales, necesarios para los recursos de UI del layout anidado, están identificados y hasheados: caption-lab.js, live-caption-overlay.js, presence-guard.js y ui/popup.js. Todos los 48 archivos del árbol candidato coinciden por SHA con el destino; no hay faltantes ni discrepancias.
Se respaldó la extensión previa 0.10.39: 50/50 archivos verificados, 0 discrepancias. El ejecutable Native Messaging existente y su registro permanecen sin modificación; SHA-256 del ejecutable estable 313CCD3312A8C75131EC7C4ADFEBF883B028BCE8AEE8B1EA43BD4DDDBB202EFE. sample.ogg fue restaurado desde el respaldo y coincide con sample.json.
Pruebas sobre el paquete/copia: portable-root-layout y 59 hashes PASS en el paquete canónico antes de crear el manifiesto anidado; sintaxis JS 25/25; presence-guard 42 PASS; presence-connect 33 PASS; autoanswer-runtime-guard 15 PASS; git diff --check PASS. Los tres regresores son sintéticos y no constituyen aceptación Windows ni llamada real.
Recibo local: Desktop/SI-backups/SI-0.10.39-before-0.10.40-20261107/UPDATE-0.10.40-RESULTADO.json; read-back exacto PASS. Overlay y manifiesto anidado respaldados por separado.
Resultado: ACTUALIZACIÓN LOCAL 0.10.40 COMPLETADA/VERIFICADA; LISTA PARA QUE EL OPERADOR PULSE RECARGAR. Chrome no se recargó ni reinició; no hubo llamada real, aceptación funcional, E2E 0.10.40 ni release.
```

### Pendientes en secuencia

1. **SI-P01 — Staging e instalación del puente 0.10.39: COMPLETADO/VERIFICADO en sesión histórica.** Paquete, 59 hashes, muestra, protocolo y registro Native Messaging PASS; recibo releído. M34/M35 consumidas; PC-14 EXCLUIDO.
2. **SI-AUTO-01 — Revisión e integración PR #71: COMPLETADA/VERIFICADA.** Agotamiento terminal por intento, regresión de siete backoffs, inventario actualizado; tres suites PR CI PASS. PR #71 fusionada en main mediante 2546d967f15759c2eabac7b4026cc5b4f1cbd081; auditoría y host nativo post-merge PASS.
3. **SI-AUTO-02 — Empaquetado y actualización controlada 0.10.40: COMPLETADA/VERIFICADA; RECARGA MANUAL PENDIENTE.** El manifiesto anidado de la carpeta registrada por Chrome declara 0.10.40 y conserva el ID. Se respaldaron 50 archivos previos y todos verificaron SHA; 48 archivos del árbol candidato se cotejaron exactos contra destino. El inventario canónico registra 59 rutas: 55 hashes exactos y cuatro overlays de layout identificados y hasheados; 0 faltantes. El Native Messaging estable ya registrado se mantuvo sin cambios y su SHA quedó verificado. Las regresiones `presence-guard` 42, `presence-connect` 33 y `autoanswer-runtime-guard` 15 PASS (sintéticas); 25 archivos JavaScript pasan sintaxis y `git diff --check` PASS. El operador debe pulsar Recargar en Chrome; la instancia no lo hizo ni reinició Chrome.
4. **SI-AUTO-03 — Aceptación funcional: PENDIENTE.** OPI realmente contestable debe contestarse automáticamente; VRI, modalidad desconocida, presencia inactiva, perfil no autorizado y demás condiciones no elegibles deben permanecer sin clic. CI sintético no equivale a llamada real ni aceptación del operador.
5. **SI-P03 — Persistencia observacional E2E: PENDIENTE.** Verificar versión, relayReceivedAt, ACK, drenaje, workflow, freshness e informe latest, sin audio ni texto de llamadas. Último runtime heredado 0.10.37; no hay lectura nueva.
6. **SI-P04 — Liberación: PENDIENTE.** Requiere pruebas Windows/Chrome, integridad, rollback, evidencia real y aceptación expresa. No liberar por merge o CI.
7. **SI-FB-01–SI-FB-06 · Retroalimentación 2026-10-30: implementación parcial en candidata 0.10.45; QA local Windows 48 verificaciones PASS y CI GitHub del HEAD 48f2798d3599f6e91f70ec665d3eb26b986d3116 3/3 PASS.** Ver BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md, sección 7. Aún no aceptado: quedan E2E Windows/Chrome, métricas bilingües, verificación ZDR y aceptación humana.
8. **Custodia de exports: PENDIENTE DE COPIA PRIVADA VERIFICADA.** El export ChatGPT-SI (2)-20261108-1720.md fue leído íntegramente en PC-14 en el ciclo previo: 872 líneas, 43,461 bytes, SHA-256 8E48AF0C07D7E576B3CE081F287DB3D7E8486B320D7F1CA2C3EA1A9F5590A3F6. La lectura/copia remota actual desde PC-14 sigue pendiente; no afirmar persistencia en fila4. Los originales 2026-10-31, 2026-11-01 y 2026-11-07 continúan fuera del OCP; recibos derivados saneados. Mantener originales en área privada, nunca en este repositorio público.
9. **Patch ART-028 local/no aplicado: NO RECUPERADO NI REVALIDADO.** No asumir vigencia ni integrarlo por semejanza.

### 🔔 Recordatorios latentes

- PR #59 está cerrada sin merge; el laboratorio no es requisito de esta entrega y no debe reabrirse por defecto. #60/#63 y sus antecedentes permanecen históricos.
- #67 ya está fusionada; no crear una nueva PR para repetir su contenido.
- En 0.10.39, el puente Native Messaging se instala automáticamente mediante `PREPARAR-Y-CARGAR.cmd` / `INSTALAR.ps1`; no ejecutar manualmente `extension/native/register-caption-host.ps1`. Cargar la raíz de la extensión en Chrome sí es manual.
- 150 segundos revocados; no reactivar plazos antiguos. Vídeo manual. Idle/ausencia revoca autorización pero no debe colgar la llamada actual; retorno no rearma.
- Teclado/ratón no prueban presencia física; ausencia de señal = bloquear, no inventar garantía.
- Cliente/LEP son convenciones lingüísticas, no diarización. Fragmentos ambiguos se conservan sin atribución forzada.
- Preservar texto nativo para el canal entrante y la privacidad. El canal del micrófono propio está autorizado como funcionalidad opcional mediante Groq Whisper, solo con acción manual dentro de llamada aceptada/activa confirmada y con ZDR del proveedor verificado. En fila4 no hay credencial local y el estado ZDR no está verificado; por tanto permanece deshabilitado. No habilitar audio de pestaña, grabación duradera, envío de audio/texto clínico a observabilidad ni replay.
- No publicar texto hablado, audio, nombres, teléfonos, cuentas, identificadores de equipo ni secretos.
- Copia puntual no es sincronización automática; no portar permisos, identidades ni decisiones de otro frente.

## Aceptación y viabilidad

Estado vigente: **main 0.10.40; candidata 0.10.45 en PR #75, integrada localmente con origin/main en work/g14-pr75-reconcile. Chrome de fila4 sigue 0.10.42 y no se recargó. QA local 48 PASS/0 FAIL. Los ítems SI-FB-01–06 están clasificados en la actualización G14; E2E, llamada real controlada, ZDR, aceptación y release siguen pendientes.**

| Requisito | Estado implementado / evidencia | Aceptación y pendiente |
|---|---|---|
| Integración de desarrollo | PR #68 integrada; `main` 0.10.39; CI post-merge de auditoría y host nativo 2/2 SUCCESS en SHA `8955c1cae996d150052483cdf0d5da37c4da41eb` | No hay release; aceptación real pendiente |
| Modo de trabajo del frente | Control G11 ACTIVO como agente_unico; un prompt activo; README actualizado; prompts anteriores retirados del árbol activo | Transferencia G10 a G11 COMMITTED_AND_READBACK_VERIFIED |
| Persistencia provisional | 10,384 batches; 19 informes de llamada; 1,878 snapshots; 1,858 deltas; último health `ok`; inbox 0 | Operación histórica confirmada; el runtime heredado más reciente sigue siendo 0.10.37; falta E2E 0.10.40 |
| Relay Vercel | Código server-side usa `GITHUB_TOKEN` y escribe `observations/inbox`; GitHub muestra procesamiento automático reciente | Recepción efectiva observada; Vercel management/logs API 403; no se inspeccionó secret ni deployment |
| Informe incoming 10m | Código de pipeline genera JSON/Markdown y aplica corrección por `relayReceivedAt` | Los artefactos no aparecieron en última lectura; falta batch 0.10.39 con receipt timestamp |
| Identidad/entorno PC-14 · histórico | Dispositivo RDC Online en el evento 2026-10-31; M35 autorizó la asociación solo para esa instalación | Revalidación CLI PASS; permiso consumido. PC-14 está EXCLUIDO en la retoma actual |
| Puente Native Messaging | Registro Native Messaging ya existente en el perfil Chrome, manifest y ejecutable leídos; SHA estable coincidente y sin cambios durante la actualización | Verificación PASS; no se reinstaló el host |
| Aceptación funcional | Carpeta 0.10.40 preparada; recarga manual pendiente; guards y regresiones sintéticas PASS | Después de recargar: confirmar versión, ejecutar aceptación OPI controlada y aceptación expresa del operador |

Cono terminal de liberación: integridad + checks del SHA candidato + actualización segura en el perfil correcto + recarga manual y lectura de versión 0.10.41 en Chrome + fuente nativa real + segmentación visible + guards de presencia + telemetría 0.10.41 fresca + informe incoming 10m + upgrade/rollback + aceptación expresa. La carpeta está preparada; la recarga sigue pendiente. Fixtures, CI y Chromium headless no sustituyen aceptación integral Windows.

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
- [Cronica de retoma G9 a G10 - 2026-11-06](cronica/C-SIGNAL-RETOMA-20261106-G10-95D9F8B5.md) y [recibo del export](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261106-1517.json). El original se conserva byte-exacto solo en la copia local originales/ChatGPT-SI-20261106-1517.txt, excluida de Git; no se publica por contener detalles privados y telemetria relacionada con llamadas.
- Cronica historica G8 a G9, 2026-11-01: cronica/C-SIGNAL-RETOMA-20261101-G9-01F5BFEA.md; autorizacion, CAS/read-back G9 y custodia del export anterior. Recibo anterior: evidencias/RECIBO-EXPORT-CHATGPT-SI-20261101-1724.json.
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

[Prompt operativo único](PROMPT-SIGNAL-INTERPRETER.md), subordinado al objeto canónico y al gobierno vigente. El checkpoint de esta revisión es G13 (UUIDv7 local `01a1bca3-e123-74f7-b884-5792d8fb3e62`; folio no asignado); cada retoma debe releer el control, verificar generación/SHA y adquirir el gobierno actual. No instancies identidades adicionales ni emitas prompts paralelos. Un prompt no crea permiso, conectividad, persistencia ni aceptación.

## Persistencia y revisión

Releer base y método antes de escribir; ante delta/concurrencia conciliar, no sobrescribir. Control G13 ACTIVO; blob `3c3b0e6999ede64593a013d78fd66c4ce28e9cd4`; read-back remoto PASS. G12 queda SUSTITUIDO con histórico preservado.

Gobernanza actual releída: DUG v383 · NX-383m, Metodología `main` HTML canónico blob `cad464717c43733aa84b49f8c9c3af0875597fbd`; Metacanon 1.29; GOW 2.18. §ARR consultado; MCP normativo DESACTIVADO.

Prompt operativo único G11 blob `ca9e4f1e25aca92717778772418181477a5c025a`; crónica de retoma G11 blob `02b81140201a7235474dda787477a8a74d101cc2`; recibo del export G11 blob `9f08e7eb9de4650427741e886e5099b3f477b404`. Persistencia y read-back verificados.

Versión de producto: `main/manifest.json` **0.10.40**. La candidata **0.10.41** está en PR #74, no fusionada. La carpeta local autorizada fue preparada y verificada con inventario SHA-256 59/59; recarga manual de Chrome, E2E y aceptación siguen pendientes. No hay release.

Persistencia provisional: `observations/manifest.json` y el corte heredado siguen registrando 10,384 batches, 19 informes de llamada, 1,878 snapshots y 1,858 deltas; health `status=ok`, inbox 0. El último batch visible en ese corte es de runtime 0.10.37 y no contiene `relayReceivedAt` superior. El pipeline de main contiene el informe incoming de diez minutos y freshness; los artefactos no aparecieron en esa lectura. Vercel management/logs API devolvió 403; no se inspeccionó el secret. Recepción histórica no prueba runtime 0.10.39, timestamp fiable ni frescura actual.

**Export documental 2026-11-01:** el archivo `ChatGPT-SI-20261101-1724.md` fue localizado, leído y hasheado en PC-8; 81.920 bytes, 1.488 líneas, SHA-256 `7C92BC2DE3301EEFC12F531ECE33C6C1E9B79329AF4355441395B0190A264A0B`. Solo el recibo de custodia está publicado y verificado. El original no está en el repositorio público: falta revisión completa de privacidad/credenciales/datos de llamada. PC-8 quedó offline; PC-14 está expresamente excluido.

PC-14/M34/M35 son historia cerrada y no habilitan acceso futuro. PC-8 fue autorizado por el operador para la solicitud actual, usado solo para lectura/hash y está offline. No se ejecutó RDC ahora, no se intervinieron llamadas reales ni se modificó el producto.

Copia puntual a GitHub no equivale a sincronización global perpetua. Mantener los lotes históricos append-only; ninguna limpieza, compactación destructiva ni migración sin decisión expresa, prueba de integridad y read-back.

Dos pasadas: fidelidad a originales/decisiones y resultado guardado/read-back. Cada ciclo sustantivo conserva salida visible y crónica, distingue estados propuesto/autorizado/intentado/ejecutado/verificado/aceptado y declara los límites.


## Actualización viva G12 · retoma 2026-11-07

Esta adenda es el checkpoint vigente y supersede cualquier mención anterior de G11 como titular activo, sin reescribir el historial.

- **Responsabilidad:** G12 ACTIVO, alias operativo `chatgpt-signal-interpreter-01a1b793-ab9f-70bc-bd23-03e83dc1e417`, UUIDv7 local `01a1b793-ab9f-70bc-bd23-03e83dc1e417`, generación 12. G11 quedó SUSTITUIDO por `SIGNAL-INTERPRETER-TRANSFER-20261107-G12-3DC1E417`. Control blob `309b3ae07d1fb6b2398787d1c9f3c25d858899f4`; read-back PASS.
- **Foliación:** FOL1 PREPARADA, NO ACTIVA. Folios CV/CY/A/B permanecen PENDIENTES/NO ASIGNADOS.
- **Gobierno:** DUG v378 · NX-378m; Metacanon 1.28; GOW 2.17. §ARR adquirido; MCP normativo DESACTIVADO.
- **Producto:** `main/manifest.json` 0.10.40. El export reporta una candidata local 0.10.42, no reconciliada con main en esta retoma. No declarar integración ni aceptación.
- **Incidente:** la última llamada perdida fue detectada; se encontró el botón Connect. La revalidación posterior a la autorización se bloqueó con `post-authorization-revalidation-failed`; no consta `CONNECT_CLICKED`. El predicado individual fallido sigue DESCONOCIDO.
- **Trabajo siguiente:** instrumentar por separado los predicados de revalidación en `content.js` y añadir pruebas sin audio, transcripción ni texto de llamada; mantener fail-closed. No recargar Chrome ni actuar sobre llamadas reales durante una ventana activa.
- **Custodia:** el original 1350 está copiado localmente con SHA exacto y excluido de Git; recibo y crónica saneados están en main. Original no publicado ni almacenado remotamente por esta operación.
- **Estado local:** clon observado 29 commits detrás y con cuatro archivos modificados y dos no seguidos. Preservar; usar base aislada para el desarrollo siguiente.

## Actualización viva G13 · corrección urgente Auto-Answer · 2026-11-08

Esta actualización supersede los checkpoints anteriores como estado actual, preservando las adendas G11/G12 como historia.

- **Responsabilidad:** G13 ACTIVO, agente único; UUIDv7 local `01a1bca3-e123-74f7-b884-5792d8fb3e62`. Control blob/read-back `3c3b0e6999ede64593a013d78fd66c4ce28e9cd4`. FOL1 PREPARADA, NO ACTIVA; folios de sesión y CV/CY/A/B PENDIENTES/NO ASIGNADOS.
- **Gobierno:** DUG v383 · NX-383m; Metacanon 1.29; GOW 2.18; §ARR consultado; MCP normativo DESACTIVADO.
- **Diagnóstico:** el intento OPI `471263e4-f995-429c-9358-eed8ed6b94b6` encontró Connect habilitado y readiness=true, pero recibió dos rechazos `sender-not-authorized` antes del clic. En v0.10.40, content script y guardián aplicaban reglas de URL inconsistentes: el primero reconocía el perfil, el segundo exigía igualdad literal. Ese defecto puede ocasionar el falso rechazo. Los campos históricos del remitente no quedaron registrados; el predicado individual responsable de aquella llamada es NO DETERMINADO.
- **Corrección:** PR [#74](https://github.com/SeryMente/signal-interpreter/pull/74), rama `fix/autoanswer-missed-call-guard-20261108`, head `c938decb70888c1ecc7a6b8eb096fc1a0d139975`, abierta/no fusionada; último read-back indica mergeable=true. `main` sigue en 0.10.40. No se reportaron workflow runs ni status checks para el head.
- **Paquete local:** `EP/Signal-Interpreter/extension` en PC-13 preparado con manifiesto 0.10.41, inventario SHA-256 59/59 PASS y respaldo de 9 archivos en `.rollback-0.10.40-20261108`. Native Messaging sin cambios.
- **Pruebas:** autoanswer-runtime-guard 15, presence-guard 59, presence-connect 33, platform-availability-overlay 20: 127 checks PASS. Verificador del paquete 59/59, contrato de inventario de instalador y sintaxis JavaScript PASS. Todas son pruebas sintéticas; no sustituyen aceptación en Chrome ni una llamada real.
- **Límites:** Chrome no recargado; E2E real y aceptación funcional PENDIENTES. PR no fusionada; no hay release ni deploy.
- **Siguiente ciclo:** SI-FB-01–SI-FB-06 permanecen pendientes, por instrucción del operador para el siguiente ciclo; no se abordaron aquí.
- **Evidencia:** [crónica G13](cronica/C-SIGNAL-MISSED-CALL-AUTOANSWER-20261108-G13-D8FB3E62.md) y [PR #74](https://github.com/SeryMente/signal-interpreter/pull/74).


## Actualización viva G13 · 0.10.43 · rendimiento y overlays · 2026-11-08

Esta adenda mantiene a G13 como agente responsable único; no crea una generación nueva ni altera las adendas G11/G12 anteriores.

- **Responsabilidad y folios:** G13 ACTIVO, UUIDv7 local `01a1bca3-e123-74f7-b884-5792d8fb3e62`. Control G13 previamente verificado; FOL1 PREPARADA, NO ACTIVA. CONV/CICLO/A/B permanecen PENDIENTES/NO ASIGNADOS.
- **Gobierno:** DUG v383 · NX-383m; Metacanon 1.29; GOW 2.18; §ARR consultado; MCP normativo DESACTIVADO.
- **Diagnóstico de rendimiento:** la muestra posterior a la llamada registrada en el perfil (no en ruta de llamada; `callId=null`) tuvo navegación de 5.67 s, 8 tareas largas, 4.6 s acumulados y una tarea de 4.128 s. La medición local posterior mostró Chrome entre 16 % y 33 % de CPU agregada, con renderers de hasta ~1.3 GB; no fue posible asociar PID a pestaña ni atribuir causalmente la tarea a la plataforma o al content script. No declarar causalidad ni latencia de la llamada que acaba de terminar: no se encontró un ciclo correlacionado `CALL_ROUTE_ENTERED/CALL_TIMER_STOPPED` en el lote disponible.
- **Correcciones candidatas 0.10.43:** guard de micrófono sin sondeo continuo en espera (mute fail-closed fuera de ruta de llamada, enforcement 250 ms solo con pistas vivas y transiciones serializadas en inicio/fin); trabajo DOM y repintado de overlays limitado; captions nativos no deducen identidad por idioma; el overlay de prellamada solo se muestra en el perfil sin llamada activa.
- **Control de overlays:** se añadió un control flotante persistente en la pantalla de llamada con acciones OCULTAR/MOSTRAR OVERLAYS. Mantiene su propia visibilidad, salvo la preferencia explícita `callOverlayControlVisible` del popup, para permitir recuperar todos los overlays después de ocultarlos globalmente. El popup expone dicha preferencia; el control aparece visible por defecto.
- **Verificación local:** rama inicial candidata probada en PC-13: 12/12 suites Node PASS, 7/7 `node --check` PASS y verificador de paquete con 59/59 SHA-256 PASS, identidad de extensión sin cambio y hash del host nativo embebido correcto. Es evidencia sintética/estática, no aceptación E2E de Chrome.
- **Materialización local:** PC-13 / usuario operativo `PC 12`, `EP/Signal-Interpreter/extension` actualizado de 0.10.41 a 0.10.43; 59 archivos copiados y 59/59 SHA cotejados tras respaldo íntegro en `.rollback-0.10.41-pre-01043-20261108`. La clave/identidad de extensión no cambió. Chrome NO recargado; la versión activa en memoria puede seguir siendo la anterior.
- **PR y CI:** [PR #75](https://github.com/SeryMente/signal-interpreter/pull/75), rama `fix/performance-overlays-autoanswer-01043-20261108`, borrador abierto/no fusionado. La integridad de paquete y compile/protocol smoke test pasaron en el último ciclo; la auditoría está siendo reejecutada tras corregir contratos obsoletos de versión, atribución de hablante e intervalo del guard de micrófono. No declarar CI verde hasta leer checks de la cabeza final.
- **Native Messaging:** SI-OP-01 queda como regla provisional para futuras materializaciones Windows; esta regla documental no demuestra que el host se haya instalado ahora. No se instaló/modificó el puente en esta operación.
- **Límites:** no hubo recarga de Chrome, intervención de llamada en curso, prueba E2E real, release ni aceptación del operador. El respaldo local se conserva; los directorios temporales de prueba están separados de la carpeta instalada.


### Verificación final de candidata y carpeta local · 2026-11-08

- **PR #75:** [revisión en borrador](https://github.com/SeryMente/signal-interpreter/pull/75), rama `fix/performance-overlays-autoanswer-01043-20261108`, head `1a4695a9922c26a92b94c60693de1cef606ca6e5`. Checks del head consultado: `audit`, `package-integrity` y `compile-and-protocol-smoke-test` = **3/3 SUCCESS**. PR abierto, draft, NO fusionado; no hay release. `main/manifest.json` permanece en 0.10.40.
- **Carpeta local final:** PC-13, usuario Windows operativo `PC 12`, `EP/Signal-Interpreter/extension`, manifiesto 0.10.43. Inventario SHA-256 read-back `B31ED5C80F7545850AE633BD251617D61E1DD5A9867EA5B18B20AEDD50F158B3`; 59 entradas, 59/59 cotejadas, cero discrepancias; identidad de extensión coincide con el respaldo previo.
- **Respaldo:** se conserva `.rollback-0.10.41-pre-01043-20261108`. Antes de sincronizar al head final se creó además `.rollback-0.10.43-pre-sync-20261108-1535`, con copia byte-exacta del estado 0.10.43 previo y copia explícita del inventario anterior `payload-sha256.json.pre-sync`.
- **Auditoría local de la cabeza:** los 12 tests de regresión de la candidata y 7/7 comprobaciones `node --check` pasaron; los audits estáticos Live Caption y Observability y el verificador de paquete también pasaron después de incorporar al árbol temporal de prueba los tres workflows ocultos `.github/workflows` que el ZIP no había extraído. Verificador de paquete: 59/59 SHA.
- **Aceptación:** Chrome NO se recargó. No hubo aceptación E2E/Windows ni intervención de llamada real. La carpeta en disco está actualizada y verificada; el runtime cargado en Chrome puede seguir siendo la versión anterior. La prueba en llamada y la aceptación explícita del operador siguen pendientes.


## Actualización viva G14 · reconciliación, backlog y QA · 2026-11-08

Esta actualización supersede los checkpoints G13 como estado vigente, preservándolos como historia. No declara aceptación funcional ni cierre de liberación.

- **Titularidad:** G14 ACTIVO, agente único; alias/UUIDv7 local 01a1bd8b-8291-7906-b862-6088593acfe5, generación 14. Evento SIGNAL-INTERPRETER-TRANSFER-20261108-G14-593ACFE5. Control blob/read-back 52733e7a21b87b85ad3754fef2dd837e2c9d7928; G13 SUSTITUIDO. FOL1 PREPARADA, NO ACTIVA; folio de sesión y CV/CY/A/B no asignados.
- **Entorno de ejecución:** RDC dispositivo PC10RCIF4EI4; operador técnico MantenimientoRCI. Chrome del perfil objetivo fue verificado como proceso de CENTRAL\\fila4, sesión interactiva 4. Las rutas de repositorio, perfil, respaldos y entregables locales de este frente están bajo C:/Users/fila4.
- **Preservación:** respaldo íntegro del checkout original, incluidos .git, cuatro archivos modificados y dos no seguidos: C:/Users/fila4/Desktop/SI-backups/SI-pre-backlog-G14-20261108-174825.zip; 57,665,641 bytes; SHA-256 224E9AA78E6B6BE7FF895EAA9030283E9233C74C6391A712461C9025DAFC269C; 540 archivos de origen y 729 miembros. El checkout original no fue reseteado ni limpiado.
- **Reconciliación:** candidata PR #75 (38472be1e12aa9ef8dced668a7a2195138d8adb9) integrada localmente con origin/main (43430424ab5d81ab7cc0ce9d2ae70c63dd4f3fa2) en worktree aislado C:/Users/fila4/Desktop/SeryMente/SI-G14-RECONCILE; merge commit 49f18e18e88918575278ed083db31d127d21a892; cero conflictos; 45 archivos cambiados. El checkout original sigue intacto. El commit local aún no publicado al registrar esta adenda.
- **Producto:** candidata 0.10.45. main/manifest.json permanece en 0.10.40. PR #75 sigue abierta, en borrador y no fusionada. No se creó release ni despliegue.
- **QA local Windows:** 42/42 scripts tools/*test*.mjs PASS; sintaxis JavaScript 25/25 PASS; live-caption-static-audit, observability-static-audit, verify-release-package, observability-package-audit observations y git diff --check PASS. Total: 48 verificaciones agrupadas PASS, 0 FAIL. Node v24.0.0. Evidencia local en C:/Users/fila4/Desktop/SI-backups/validation-G14-PR75/windows-node24-g14-postmerge.log y resultados-postmerge.json. CI GitHub del head candidato previo 38472be...: audit, package integrity y native-caption-host-build 3/3 SUCCESS. Para el HEAD publicado 48f2798d3599f6e91f70ec665d3eb26b986d3116, GitHub Actions completó 3/3 PASS: signal-observability-audit, Package integrity y native-caption-host-build.
- **Chrome fila4:** perfil C:/Users/fila4/AppData/Local/Google/Chrome/User Data/Profile; extensión ID ldpbjhobnfgmhdoehehdmnbhhjckebmj, carpeta registrada C:/Users/fila4/Desktop/SeryMente/Signal Interpreter/extension, manifiesto cargado en disco 0.10.42. No se modificó la carpeta activa ni se recargó Chrome. Native Messaging registrado en HKU/HKCU de fila4; manifest com.signalinterpreter.captionhost.json, host exe presente; SHA-256 313CCD3312A8C75131EC7C4ADFEBF883B028BCE8AEE8B1EA43BD4DDDBB202EFE, coincide con el hash esperado.
- **Groq:** no hay credencial local C:/Users/fila4/.signal-interpreter/groq-token.dat ni extension/groq-secret.local.js; ZDR en consola del proveedor no verificado. Captura queda deshabilitada por defecto. No se solicitó ni expuso una clave.
- **ChatGPT en fila4:** se abrió https://chatgpt.com/ en Chrome con el perfil fila4. El ID/URL profunda de esta conversación no está expuesto en el contexto del agente; no se afirma que se haya seleccionado exactamente este hilo.
- **Backlog SI-FB-01–06:** actualizado en el registro específico. SI-FB-01 implementado en candidata y cubierto por pruebas sintéticas; E2E de pista real pendiente. SI-FB-02 canal opcional Groq integrado y guardado, pero sin key/ZDR y sin prueba real; permanece deshabilitado. SI-FB-03 mejoras parciales de fuente/idioma/segmentos; métricas WER/CER y exactitud de entidades críticas no medidas. SI-FB-04 compacidad/rendimiento implementados en candidata; revisión visual/accesibilidad del operador pendiente. SI-FB-05 lector de pestaña implementado en candidata; prueba real sincronizada pendiente. SI-FB-06 42 suites locales y tres workflows previos PASS; E2E Windows/Chrome, llamada controlada y aceptación del operador pendientes.
- **Límites:** tests sintéticos no equivalen a validación de llamada. No se inició/intervino llamada real, no se midió WER/CER, no se verificó ZDR en consola, no se habilitó Groq, no se recargó Chrome, no se fusionó el PR ni se publicó release.
- **Siguiente paso técnico:** commit de la actualización documental en la rama reconciliada, push fast-forward a la rama de PR #75 y verificación de CI sobre su nuevo HEAD. Mantener PR en draft mientras falte revisión y aceptación humana.


### Cierre de CI remoto del HEAD publicado · 2026-11-08

GitHub Actions para 48f2798d3599f6e91f70ec665d3eb26b986d3116 terminó:
- signal-observability-audit: SUCCESS.
- Package integrity: SUCCESS.
- native-caption-host-build: SUCCESS.

Resultado 3/3 PASS. La PR #75 permanece OPEN/DRAFT y sin merge ni release. Los workflows son evidencia de CI del commit indicado; cualquier commit posterior dispara una nueva ejecución y requiere revalidación.


### Checkpoint posterior · integración del control RDC fila4 · 2026-11-08

- Control autoritativo en main: commit f3b70adee388d83193aecc9249293d383d3c768f; blob/read-back afd20f31f1518ae69395064509999f84e9b81cae.
- Evento de autorización: SIGNAL-INTERPRETER-RDC-FILA4-20261108-G14. MantenimientoRCI opera RDC en PC10RCIF4EI4; todos los artefactos, perfiles, worktrees y resultados locales permanecen bajo C:/Users/fila4. Perfil Chrome verificado como CENTRAL\fila4.
- PR #75 sincronizada con main: HEAD 48f2798d3599f6e91f70ec665d3eb26b986d3116; base f3b70adee388d83193aecc9249293d383d3c768f; 82 commits; 50 archivos; mergeable true; estado OPEN/DRAFT, sin merge.
- CI del HEAD vigente: signal-observability-audit, Package integrity y native-caption-host-build: 3/3 SUCCESS.
- El checkout original permanece intacto con los cuatro archivos tracked modificados y dos no seguidos. Respaldo y SHA-256 verificados.
- El export ChatGPT-SI (2)-20261108-1720.md sigue pendiente de copia privada verificada en fila4; origen PC-14, 872 líneas, 43,461 bytes, SHA-256 8E48AF0C07D7E576B3CE081F287DB3D7E8486B320D7F1CA2C3EA1A9F5590A3F6. La lectura remota PC-14 agotó el tiempo de espera; no se afirma read-back ni persistencia en destino.
- ChatGPT está abierto en el perfil Chrome de fila4, pero no se verificó el URL profundo de este hilo; no sustituirlo por otro chat cuyo título/ID no sea inequívoco.

Los tres workflows acreditan el commit exacto indicado. No se realizó llamada real, captura de audio, reload Chrome, merge o release; aceptación humana sigue pendiente.
