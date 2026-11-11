# Signal Interpreter — núcleo operativo único

<!-- BEGIN_CANONICAL_CORE -->

## Control e identidad

- Frente: **Signal Interpreter**; propietario: `SeryMente/signal-interpreter`.
- Revisión documental: retoma integral G14, aceleración segura y persistencia provisional · corte 2026-11-10 local / 2026-11-11 UTC; evidencia vigente: [crónica de retoma](cronica/C-SIGNAL-RETOMA-20261111-G14-CURRENT.md) y [tareas provisionales](TAREAS-PROVISIONALES-GROQ-DUAL-G14.md). Naturaleza: actualización del OCP heredado; no proyecto nuevo.
- Directorio canónico: `docs/frentes/signal-interpreter/`. Este archivo es la única materialización del estado vigente y de la Versión de Contexto Universal del frente; README y prompts son navegación, no estados paralelos.
- Base preservada: main `5751281d3fca0a1fc7cb37a69c8cd4bba3632075`, objeto anterior blob `799ed39a297a911aceab46a91f206a14a8361f7c`, sello `SI-OBJ-v1.5-evidencia-04`.
- Estado de producto · último corte documentado G14: `main/manifest.json` permanece en **0.10.47**; PR #79 y #78 están integradas. PR #84 es la candidata selectiva Groq dual, OPEN/DRAFT/NOT MERGED, rama `feat/groq-dual-main-20261111`, HEAD validado `1c7aca92cc89337aeb4c9907426847f941fa35bd`; CI 3/3 SUCCESS en ese SHA. Pruebas independientes: 43/43 suites, 56/56 sintaxis y paquete 66/66 hashes PASS. Esto no prueba carga Chrome ni audio real. La discrepancia anterior de unmute previo a llamada sigue en el historial SI-REG-05. No hubo llamada/audio real, uso API Groq, aceptación ni release; véase la [crónica de retoma G14 vigente](cronica/C-SIGNAL-RETOMA-20261111-G14-CURRENT.md).
- Persistencia verificable: identificar la revisión Git que contiene este archivo y el [recibo de migración](evidencias/C-SIGNAL-METACANON-20261020-01.json); el recibo identifica la base y los contenidos, no autocertifica publicación o conformidad semántica.

## LEER PRIMERO

Modo: continuar el mismo frente como **una sola instancia responsable G14** (folio pendiente por FOL1 no activa). No crear, asignar, invocar ni coordinar un segundo agente; no dividir trabajo por papeles; no generar prompts dobles ni transferencias internas.

Leer este núcleo y adquirir gobierno vigente antes de actuar. Consultar después solo fuentes/evidencias necesarias para el objetivo actual; no recorrer toda la historia por rutina.

Precedencia: plataforma y autorización vigente → Metaprompt Canónico y Metacanon pertinentes → gobierno particular de este frente. [Entrada del gobierno distribuido](https://github.com/SeryMente/metodologia/blob/main/INICIO.md). El repositorio metodológico requiere acceso autorizado; no copiar su contenido privado a este repositorio público ni pedir credenciales en el chat. Revalidar fuente y revisiones desde `main`; una referencia histórica no prueba frescura, autorización o ejecución. Fuente indispensable ausente bloquea solo la acción dependiente.

**Modo operativo vigente:** G14 figura ACTIVO como agente único en `CONTROL-RESPONSABILIDAD.json`; G13 quedó SUSTITUIDO mediante transferencia condicionada por SHA/generación. El operador conserva decisiones humanas, uso real, llamadas reales, aceptación funcional y liberación. FOL1 está PREPARADA, NO ACTIVA; el folio permanece PENDIENTE/NO ASIGNADO. No se heredan autorizaciones de equipos previos.

## Referencia metodológica

- **Metacanon adquirido: 1.29**; DUG **v388 · NX-388m**; GOW **2.18**.
- Fuente canónica releída desde `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`, blob `4db0ebadfd1e48b2bdec9236ba7f344921e4a865`; DUG v388 · NX-388m, Metacanon 1.29 y GOW 2.18. §ARR consultado; se consideró el CNP (P001, P004, P005, P038, P043). `INICIO.md` no se usó para sustituir la fuente canónica.
- Control vigente: `CONTROL-RESPONSABILIDAD.json`, blob `2f02cab6b3697f31b2af3d141204c4431fbc05cb`; G14 ACTIVO, agente único; identidad local `01a1bd8b-8291-7906-b862-6088593acfe5` según control. G13 queda SUSTITUIDO. FOL1 PREPARADA, NO ACTIVA; folio PENDIENTE/NO ASIGNADO.
- Se consultaron §ARR, P001/P004/P005/P007/P008/P011/P019/P033/P038/P043 y Metacanon §§4/24/42/47 pertinentes. **MCP-NORMATIVO: DESACTIVADO**. No se presume sincronización con Notion u otras superficies.

### Constancia de adquisición y aplicación

| Fuente/regla | Requisito de esta acción | Evidencia | Resultado |
|---|---|---|---|
| DUG v373 / Metacanon 1.26 · antecedente histórico | Un frente, una instancia, un OCP y un control | M34/M35 en §24; control G6 actualizado y releído | Modo agente único registrado en aquel ciclo; sustituido después |
| P036/M35 · antecedente PC-14 | Resolver identidad y autorizar excepción puntual para una instalación | Revalidación CLI + confirmación expresa del operador en 2026-10-31 | Excepción histórica consumida y cerrada; no se reutiliza ni acredita permiso actual para PC-14 |
| M34/M35 / §24 · antecedente | RDC mínimo y temporal para PC-14 | Staging e instalador ejecutados, recibo y registro releídos | Ejecución histórica cerrada/verificada; no concede acceso futuro |
| §§22–23 | Una única instrucción operativa | `PROMPT-SIGNAL-INTERPRETER.md`, README actualizado, prompts paralelos retirados del árbol activo | Una sola vía de reinstanciación |
| Persistencia de observabilidad | Confirmar batch durable y proceso | Snapshot histórico de GitHub del ciclo previo: 10,384 batches, 19 informes de llamada, 1,878 snapshots, 1,858 deltas; health `ok`, inbox 0 | Medio provisional observado en ese corte; no es evidencia de audio Groq ni del runtime actual |
| §28 | Originales, secuencia, crónica, read-back | Crónica de este ciclo y revisión Git | Historia preservada, sin fingir acciones no ejecutadas |

## Propósito y alcance

**De dónde viene:** mejorar calidad de vida en interpretación telefónica, apoyada en texto de Live Caption nativo; dictados y ratificaciones originales conservados en el [antecedente íntegro](antecedentes/TRANSCRIPTION-SPRINT-CANONICAL.pre-1.9.md), §§13–17 y SI-D001–008.

**Dónde está:** `main/manifest.json` declara 0.10.47. Los cambios históricos de missed calls/Auto-Answer de PR #74 y cortes 0.10.40/0.10.41 no son la versión actual. La integración dual de Groq está en PR #84, draft/no merge, HEAD 1c7aca92cc89337aeb4c9907426847f941fa35bd; CI 3/3 SUCCESS y pruebas locales independientes PASS. La carga Chrome, la API Groq con audio, ZDR, evaluación acústica y aceptación funcional siguen pendientes.

Incluido: Windows + Chrome; Live Caption → Windows UI Automation → Native Messaging → overlay; carriles por idioma, historial, copiar/buscar, hotloading, controles existentes; instalación portable desde raíz y laboratorio aislado con muestra incluida. MacOS/Linux son entornos de desarrollo, no plataformas de producto acreditadas.

Alcance vigente: la instrucción directa del operador de 2026-11-10 autoriza construir y probar un diálogo único alimentado por dos fuentes independientes y concurrentes: audio remoto de pestaña y micrófono propio del intérprete, con transcripción separada y fusión cronológica posterior. La salida propia se etiqueta INTÉRPRETE; el canal remoto conserva identidad no verificada salvo metadata demostrable. No mezclar pistas antes de transcribir, no inferir LEP/proveedor, no aplicar fallback silencioso a Turbo. La autorización posterior permite trabajo técnico y manejo de datos bajo responsabilidad del operador; no convierte en verificados ZDR, credenciales, Chrome ni aceptación. No persistir audio crudo ni texto clínico en telemetría, exportes, logs, repositorio o bases generales. Mantener fail-closed fuera de llamada activa y en revocación/fin. No agregar replay, escucha oculta ni atribución biométrica. No reducir el objetivo a «audio reproduce» o «panel conecta» para declarar éxito.

## Agente único responsable

Una sola instancia G14 mantiene la responsabilidad completa del frente: análisis, diseño dentro de decisiones autorizadas, código, pruebas automatizadas, CI, ramas/PR, revisión, observabilidad, persistencia, documentación, control, crónicas y continuidad. No existe una segunda instancia responsable ni una división de titularidad. Las pruebas pueden ejecutarse en checkouts aislados, pero eso no crea corresponsables ni agentes adicionales.

**Responsabilidad humana reservada:** el operador decide lo que requiere consentimiento, realiza el uso real que no pueda ejecutarse por CLI, controla las llamadas reales y emite la aceptación funcional y la autorización de liberación. La instancia no simula uso, no interviene una llamada real y no declara aceptación sin evidencia revisable.

**RDC vigente G14:** trabajo técnico y artefactos bajo el perfil CENTRAL\\fila4 en PC10RCIF4EI4; MantenimientoRCI es la identidad operadora/elevada, no el destino de los archivos. Usar CLI/Git/tests/CI y checkouts separados sin pisarse. PC-8 fue indicado como sesión efímera; no es destino persistente. No usar GUI ni recargar/reiniciar Chrome por RDC, no intervenir llamadas reales y no materializar artefactos bajo C:\\Users\\MantenimientoRCI.

**Criterio de ejecución:** realizar directamente todo diagnóstico, edición, automatización, pruebas aisladas, análisis y persistencia que esté autorizado y no requiera interacción real del operador. Cuando exista una dependencia humana, emitir una instrucción breve con precondiciones, resultado esperado, PASS/FAIL y evidencia mínima saneada. La salida debe reflejar qué fue observado, reportado, histórico, sintético, inferido o desconocido. Un único prompt activo: [PROMPT-SIGNAL-INTERPRETER.md](PROMPT-SIGNAL-INTERPRETER.md).

## Autoridad

El encargo original [SI-D009](originales/C-SIGNAL-METACANON-20261020-01.md) y las órdenes posteriores se conservan como procedencia del mismo frente. La instrucción directa del 2026-10-30 estableció una sola instancia responsable; la transferencia G13→G14 está registrada y leída de vuelta en el control. **Antecedente histórico:** DUG v373 · NX-373m, Metacanon 1.26 §24 M34/M35 autorizó una instalación CLI puntual en PC-14; esa autorización está consumida y cerrada. **Estado actual:** el operador indicó que PC-8 es efímero y que Fila 4 se usará para desarrollo/CI y persistencia. El destino Windows es CENTRAL\\fila4; MantenimientoRCI opera como identidad elevada. No usar GUI ni el perfil MantenimientoRCI como destino. La aceptación real, el uso de audio y la liberación se mantienen como compuertas separadas.

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
7. **SI-FB-01–SI-FB-06 — Retroalimentación 2026-10-30: PENDIENTE.** Backlog [BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md](BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md): mute, transcripción bilingüe, calidad, overlay, lector y matriz de aceptación.
8. **Custodia de exports: PENDIENTE.** Originales 2026-10-31, 2026-11-01 y 2026-11-07 fuera del OCP; recibos derivados saneados. Resolver destino privado autorizado.
9. **Patch ART-028 local/no aplicado: NO RECUPERADO NI REVALIDADO.** No asumir vigencia ni integrarlo por semejanza.

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

Estado vigente: **`main` 0.10.40; candidata 0.10.41 en PR #74 no fusionada; carpeta local preparada y verificada 59/59. Chrome no se recargó. Aceptación real, E2E y liberación pendientes. Backlog SI-FB-01–SI-FB-06 permanece intacto y se abordará en el siguiente ciclo.**

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


## Actualización viva G14 · reconciliación de backlog y regresiones · 2026-11-10

Esta adenda supersede las referencias operativas anteriores de G13 y producto 0.10.40 como estado vigente. Las adendas previas se conservan como historia, sin reescritura retroactiva.

- **Responsabilidad:** G14 ACTIVO / agente único según `CONTROL-RESPONSABILIDAD.json`; UUIDv7 local que figura en el control `01a1bd8b-8291-7906-b862-6088593acfe5`. FOL1 PREPARADA, NO ACTIVA; folio de sesión y folios CV/CY/A/B permanecen PENDIENTES/NO ASIGNADOS.
- **Gobierno:** DUG v386 · NX-386m; Metacanon 1.29; GOW 2.18; §ARR y CNP considerados. DUG blob `22dca684830a36dff019b47811d9b800cc9bea0a`. MCP normativo DESACTIVADO.
- **Producto:** main declara 0.10.47; PR #79 fusionada en `10a7f1b1f8c48d290ce8f4df5639109efe571c22`. PR #78 también fusionada.
- **Backlog:** la revisión de `BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md` actualizó SI-FB-01–SI-FB-06 a estados parciales/pendientes reales y añadió SI-REG-01–SI-REG-04 para el switch Auto-Answer, el micrófono con pista tardía, la prueba permanente de paralelismo y la aceptación integrada. Véase [backlog](BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md) y [crónica G14](cronica/C-SIGNAL-BACKLOG-REGRESIONES-20261110-G14.md).
- **Regresión comunicada:** el operador reportó “micrófono no enciende” y “switch de contestador no funciona”. Un mensaje anterior informó un hotfix local; en este corte no se leyeron de nuevo sus archivos/recibo, así que se conserva como REPORTADO, NO RE-VERIFICADO. No se atribuye a main ni se declara integrado.
- **PR abiertas:** #70, #72, #73, #74, #75 y #76 siguen abiertas según la consulta de estado; no se fusionan ramas completas. #72/#73/#76 contienen deltas cuya funcionalidad fue integrada selectivamente en #79; #74 no debe portar rearme automático al pulsar Online; #75 sigue draft y amplio; #70 conserva estado documental antiguo. Comparar deltas antes de cierre o descarte.
- **Verificación:** main 0.10.47, estado de PR y blobs de documentación fueron leídos. Los resultados locales previos (27/27 suites, 59/59 hashes y 4/4 cotejos) se atribuyen al reporte anterior, no a ejecución de este ciclo. No hubo pruebas de código en este ciclo.
- **Aceptación:** Chrome no fue recargado; no hubo llamada real, captura de audio, aceptación funcional ni release. No se usó RDC en PC-7 ni PC-14; la autorización vigente no se hereda a esos dispositivos. Cualquier preparación remota futura debe ajustarse al destino y cuenta registrados en el control G14.



### Actualización viva G14 · candidata PR #80 materializada · 2026-11-10

- **Código:** rama `fix/backlog-p0-switch-mic-late-track-20261110`; paquete de código local desde `6cb479481c51e618d085ae09991cad258d6bdc00`; último commit documental de la rama `52ac306296365a70154e6ca1c670bdedf059373f`; PR #80 abierta en borrador, no fusionada. `main` permanece en 0.10.47.
- **Correcciones candidatas:** default de presencia Auto-Answer 180 s; reintento de unmute solo con llamada activa, intención explícita conservada y pista viva verificada; prueba permanente de concurrencia; manifiesto normalizado y carpeta de carga única `extension/`.
- **Workspace:** `C:\\Users\\fila4\\Desktop\\SeryMente\\signal-interpreter`; Chrome debe cargar `...\\signal-interpreter\\extension`. Se preservó el estado anterior en `Temporal\\SI-backup-pre-PR80-20261110.zip`, SHA-256 `24627DF49B53C58B0DC7323EECD3DBE10C98B84346A7B3A67B6D0BC52B284D65`.
- **Verificación local:** inventario 60/60 SHA-256; `verify-release-package` PASS; layout 18 referencias PASS; presence-connect 35 checks PASS; presence-guard 83 checks PASS; microphone-guard PASS; overlay regression PASS; JS syntax 5/5; PowerShell 5.1 parser 7/7 scripts relevantes PASS.
- **Estado:** materializado y verificado como paquete; Chrome no se cargó/recargó; Native Messaging host ya estaba presente y registrado bajo CENTRAL\\fila4; se verificó en solo lectura que el registro apunta al manifiesto correcto, el origen permitido coincide con el ID de extensión y el ejecutable conserva SHA-256 313CCD3312A8C75131EC7C4ADFEBF883B028BCE8AEE8B1EA43BD4DDDBB202EFE. No se modificó. Llamada real/audio y aceptación del operador pendientes. No declarar resuelta la aceptación funcional.
- **RDC:** endpoint actual PC10RCIF4EI4 / device_id `b573344f-c68f-47c9-9c2e-ae67f2e63bdb` revalidado en el addendum de control G14. MantenimientoRCI solo operó el agente; los artefactos quedaron bajo fila4.


### Actualización viva G14 · repetición del ciclo y retoma literal · 2026-11-10

- Gobierno releído: DUG v388 · NX-388m; Metacanon 1.29; GOW 2.18; blob DUG `4db0ebadfd1e48b2bdec9236ba7f344921e4a865`; §ARR consultado. Control G14 releído, activo y agente único; FOL1 PREPARADA/NO ACTIVA.
- Main: 0.10.47; commit de observabilidad `e2fccfce855e20df9aa1fd0ff34c1eecaa087275`. La actualización observacional posterior no cambia el código de extensión. PR #80 draft, no mergeable; sus tres workflows consultados constan SUCCESS (Package integrity, observability audit, native-caption-host-build), sin aceptación de micrófono/llamada.
- Retoma local bajo `C:\\Users\\fila4\\Desktop\\SeryMente\\signal-interpreter`: presencia 85/85, conexión 35/35, runtime Auto-Answer 15/15, test MIC PASS, sintaxis 2/2 y package 60/60 hashes. Sintético/offline; no Chrome/E2E. Los hashes de archivos y la salida literal del modelo constan en la [crónica de retoma](cronica/C-SIGNAL-RETOMA-20261110-G14-CURRENT.md).
- Política Auto-Answer: interruptor de configuración y `SIGNAL_PRESENCE_ARM` son estados separados. El default del código popup es `autoAnswerEnabled=false`; el estado persistido en Chrome no se consultó. En este ciclo no se habilitó ni armó la contestación.
- Hallazgo MIC: `setExtensionMicrophoneMutedInternal(false, ...)` no exige `callActive` para enviar unmute a una pestaña Cloud Interpreter; el retry de pista tardía sí exige llamada activa. La prueba `microphone-guard-test.mjs` protege el comportamiento pre-call actual. Esto contradice la política anterior de mute en espera/timbrado/incierto. SI-REG-05 queda P0 abierta; no es una prueba de que una llamada real haya transmitido audio.
- Observabilidad: ventana 10m `2026-11-10T19:25:00.897Z`: intentos 0, clicks 0, diálogos 0, readiness samples 10; `freshness=receipt-unavailable`, receiptVerified=false, 0 batches verificados y 12.907 no verificados. No permite adjudicar causalmente las dos llamadas perdidas previas.
- No hubo cambio de código, modificación de preferencias, reload Chrome, activación/armado, llamada/audio real, aceptación, merge, deploy o release.

---

## 10. Recuperación del hilo constructor y reconciliación del frente Groq · G14 · 2026-11-10

### Fuente y preservación

- El operador recuperó y pegó la conversación anterior completa. Su texto se conserva literalmente en [originales/CHATGPT-SI-RECUPERADO-GROQ-20261110.txt](originales/CHATGPT-SI-RECUPERADO-GROQ-20261110.txt). Lectura de vuelta byte por byte: coincide con el mensaje recibido. Es texto recuperado y aportado en esta conversación, no una exportación nativa de ChatGPT.
- El plan con A-01/A-02/A-03/A-04 verbatim, interpretación, modelo, restricciones y P-01–P-13 se recuperó de la rama candidata y se publicó en [INSTRUCCIONES-Y-PLAN-PROVISIONAL-GROQ-DIALOGO-20261110.md](INSTRUCCIONES-Y-PLAN-PROVISIONAL-GROQ-DIALOGO-20261110.md). Su sección 8 concilia sus estados históricos con el HEAD y la CI observados.
- La crónica del ciclo, evidencia, límites y commits/read-back está en [C-SIGNAL-RECUPERACION-GROQ-20261110-G14.md](cronica/C-SIGNAL-RECUPERACION-GROQ-20261110-G14.md).
- SI-OP-03, que existía en la rama candidata pero no en main, fue incorporada en [REGLAS-OPERATIVAS.md](REGLAS-OPERATIVAS.md). La regla exige un único diálogo cronológico y dos fuentes separadas/procesadas concurrentemente. Read-back exacto efectuado.

### Instrucción funcional vigente

El objetivo actual es **un solo diálogo cronológico, de alta fidelidad y baja latencia**, alimentado en paralelo por:
1. audio remoto de la llamada, capturado de la pestaña elegida explícitamente; y
2. micrófono propio del intérprete, etiquetado INTÉRPRETE por procedencia.

Ambos canales van separados a Groq Whisper; no mezclar pistas antes de transcribir, no serializar un canal detrás del otro, y fusionar sus segmentos después usando el tiempo de captura común, IDs estables y reconciliación de solapamientos. El audio remoto permanece como AUDIO REMOTO · HABLANTE NO VERIFICADO mientras no existan pistas/metadatos de identidad verificables. No inferir LEP/proveedor por idioma, voz aparente o contenido.

Las exclusiones históricas de audio de pestaña/Groq quedan supersedidas **solo para diseñar y construir esta función** por las órdenes A-01/A-02 y SI-OP-03. No quedan supersedidos los controles de llamada activa, acción visible, permisos, privacidad, parada, no retención, no telemetría clínica ni aceptación del operador. No autoriza capturas reales, uso de credenciales, llamadas reales, reload de Chrome, merge, deploy o release.

### Estado técnico observado de la candidata

- PR #83 sigue OPEN/DRAFT/no merged: https://github.com/SeryMente/signal-interpreter/pull/83.
- Rama: candidate/whisper-interpreter-live-20261110. HEAD observado: 4737823873f826f80346cd817b877c6664769f20, último commit de contenido a las 17:58:56 locales. La rama estaba 115 commits ahead y 783 behind de main, en estado diverged.
- main/manifest.json sigue en 0.10.47. Ningún código de la candidata Groq se ha integrado a main.
- Por inspección estática de esa cabeza, sí existen y están conectados en código: botón de captura visible; getDisplayMedia para audio de pestaña y getUserMedia para micrófono; dos lanes AudioWorklet; WAV mono PCM16 16 kHz; mensajes SIGNAL_GROQ_DIALOGUE_* y handlers en background.js; preflight de llamada activa, perfil/tab, interruptor y ZDR; colas Groq independientes; transcriptor whisper-large-v3; fusión/IDs; receptor de segmentos en overlay. roleForSource asigna INTÉRPRETE a groq-interpreter y AUDIO REMOTO · NO VERIFICADO a groq-remote.
- Existen pruebas sintéticas para dual capture, policy revocation, WAV/flush/overlap, fusión, colas y transcriptor. La inspección de archivos no demuestra que esas pruebas se hayan ejecutado en este ciclo ni que funcionen con permisos/audio reales.
- El flujo legacy startGroqCapture/handleGroqAudioChunk continúa respondiendo native-text-only; revisar que no se invoque accidentalmente junto con el nuevo flujo SIGNAL_GROQ_DIALOGUE_*.
- Los valores groqDialogueEnabled y groqZeroDataRetentionConfirmed permanecen false por defecto en la candidata. La casilla ZDR es una declaración operativa local, no prueba independiente de la configuración del proveedor. No se leyó ni usó una clave Groq.

### Estado de CI de la cabeza exacta

Los tres workflows asociados a HEAD 4737823873f826f80346cd817b877c6664769f20 terminaron en FAILURE:
- Package integrity · run 42927711704: discrepancias SHA-256 entre inventario e insumos; las pruebas específicas posteriores quedan omitidas.
- signal-observability-audit · run 42927711800: falla Global overlay toggle and hotload lifecycle regression; varias suites posteriores quedan omitidas.
- native-caption-host-build · run 42927712133: instalador falla por Payload SHA-256 mismatch en extension/background.js; compilación/protocolo posteriores quedan omitidos.

Los tres SUCCESS citados en salidas antiguas corresponden a una cabeza anterior y se conservan como reportes históricos, no como validación del HEAD actual.

### Pendientes ejecutivos priorizados

1. Corregir los SHA divergentes del inventario, las invariantes y las referencias a manifests; regenerar/verificar cada SHA y leer de vuelta antes de reintentar.
2. Diagnosticar y corregir Global overlay toggle and hotload lifecycle regression sin debilitar guards de presencia, MIC, Connect, llamada activa ni privacidad.
3. Corregir la validación del archivo/instalador que falla con SHA mismatch de extension/background.js.
4. Ejecutar directamente las suites nuevas (captura dual, WAV, transcriptor, motor, overlap/concurrencia y privacidad); no dar por ejecutadas las que CI omitió.
5. Revalidar el límite entre el flujo nuevo SIGNAL_GROQ_DIALOGUE_* y el flujo legacy native-text-only.
6. Probar el overlay en entorno sintético/headless para confirmar etiqueta INTÉRPRETE, fuente remota neutral, orden temporal y actualización de parciales.
7. Confirmar por inspección de proveedor/cuota el régimen efectivo de Groq y medir ventanas/cadencia/coste. La ventana de 6–6.5 s es una candidata, no un valor óptimo aprobado.
8. Preparar un corpus bilingüe autorizado y medir WER/CER, latencia p50/p95, deriva temporal, pérdida, duplicación y calidad por fuente.
9. Mantener controles de producción desactivados. No capturar audio real ni usar credenciales hasta que el operador lo autorice y se cumplan las compuertas de privacidad.
10. Tras CI verde y revisión selectiva del diff, solicitar aceptación del operador en Windows/Chrome. La aceptación funcional, merge, despliegue y release siguen reservados al operador.

### Evidencia y límites del ciclo de recuperación

- Persistido y verificado en main: conversación recuperada, plan con reconciliación, y regla SI-OP-03.
- Inspección del código: candidata PR #83, solo lectura. No se modificaron fuentes de producto ni paquetes.
- No ejecutado: nuevas pruebas locales, CI de reintento, instalación, carga/reload de Chrome, permisos de audio, micrófono físico, captura de pestaña real, endpoint Groq real, credenciales, verificación de ZDR, llamada real, merge, deploy, release o aceptación.
- G14 continúa como agente único del frente según CONTROL-RESPONSABILIDAD.json. FOL1 sigue PREPARADA/NO ACTIVA; no se asigna folio nuevo ni se simula transferencia de titularidad.



## 11. Integración selectiva Groq dual y aceptación pendiente · G14 · 2026-11-11

La crónica [C-SIGNAL-GROQ-DUAL-PORT-20261111-G14.md](cronica/C-SIGNAL-GROQ-DUAL-PORT-20261111-G14.md) conserva las reparaciones, commits, pruebas, CI, límites de entorno y decisiones de aceptación.

- A-01 quedó corregida para coincidir literalmente con la conversación recuperada: `Calidad maxima. Reportame en 10 minutos.`; lectura de vuelta exacta en main y candidata.
- PR #83 fue cerrada sin merge y supersedida por [PR #84](https://github.com/SeryMente/signal-interpreter/pull/84), port selectivo desde main; no se fusionó la historia divergente.
- PR #84 / rama `feat/groq-dual-main-20261111` permanece draft, abierta y sin merge. HEAD de la crónica: `03fc895dbe682be3bd9f944ee68951a4e815bc16`.
- CI 3/3 SUCCESS en ese HEAD: Package integrity `42939190917`, signal-observability-audit `42939190945`, native-caption-host-build `42939191050`.
- Reparados nueve hashes de inventario, dos fixtures escapados y validación de superficie de captura; ahora exige `displaySurface === "browser"` y falla cerrado antes de pedir el micrófono.
- Pruebas locales: inventario 66/66, verificador y ocho suites, 43 pruebas de observabilidad/regresión/layout, cuatro suites Groq dual, parser Windows PowerShell 5.1, identidad de extensión y archivo de distribución: PASS.
- La carga Chrome en perfil temporal no se completó porque la política organizacional bloquea Developer Mode / Load unpacked. El perfil temporal fue eliminado; el perfil habitual no se tocó.
- No había clave Groq local en el entorno de prueba; no hubo llamadas reales, captura de audio ni verificación ZDR. Los controles siguen false por defecto.
- Las cuotas públicas de Groq presentan discrepancias entre Rate Limits y Supported Models. La cuota exacta de la organización debe comprobarse antes de activar el flujo. La ventana de 6.5 s / 500 ms sigue siendo candidata; el coste mínimo por petición y el uso de ASH deben medirse.
- No hay WER/CER acústico, latencia p50/p95 ni aceptación en Chrome. No hacer merge, activación, deploy o release hasta completar esas compuertas.

G14 sigue ACTIVO como agente único. FOL1 continúa PREPARADA / NO ACTIVA; no se asigna folio. MCP normativo sigue DESACTIVADO.


## 12. Retoma integral y aceleración segura · G14 · corte 2026-11-10 local / 2026-11-11 UTC

### 12.1 Autoridad, procedencia y recuperación literal

- La autorización técnica amplia y las instrucciones de aceleración/continuidad de esta retoma están preservadas literalmente en [CHATGPT-SI-AUTORIZACIONES-RETOMA-20261110-G14.txt](originales/CHATGPT-SI-AUTORIZACIONES-RETOMA-20261110-G14.txt), blob de lectura de vuelta `a55caa4f2659fdee3fafb198b3b1317e1774f859`, 1,133 caracteres, read-back exacto.
- La conversación constructora anterior, suministrada por el operador y no considerada export nativa, continúa preservada en [CHATGPT-SI-RECUPERADO-GROQ-20261110.txt](originales/CHATGPT-SI-RECUPERADO-GROQ-20261110.txt), blob `a24d696207dfb357f12e90151d64ce1a35fc084c`.
- El plan literal A-01–A-04 permanece en [INSTRUCCIONES-Y-PLAN-PROVISIONAL-GROQ-DIALOGO-20261110.md](INSTRUCCIONES-Y-PLAN-PROVISIONAL-GROQ-DIALOGO-20261110.md). A-01 fue cotejada con el original y su frase final es exactamente `Calidad maxima. Reportame en 10 minutos.`; no reintroducir la frase que apareció en un borrador anterior.
- La última salida visible exacta de una conversación previa no se ha localizado como copia literal persistida y cotejada. Se declara **NO DISPONIBLE / NO VERIFICADA**; no reconstruirla desde memoria, resumen ni crónica histórica.

### 12.2 Gobierno y titularidad vigentes

- Fuente metodológica releída: `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`, DUG v388 · NX-388m, Metacanon 1.29, GOW 2.18, blob `4db0ebadfd1e48b2bdec9236ba7f344921e4a865`; §ARR consultado.
- CNP aplicado por pertinencia: P001, P004, P005, P038 y P043. Metacanon §§4, 28, 42 y 47–48 aplicados a salida, persistencia, titularidad y reanudación.
- Control leído: `CONTROL-RESPONSABILIDAD.json`, blob `2f02cab6b3697f31b2af3d141204c4431fbc05cb`; G14 ACTIVO, agente único; alias UUIDv7 local `01a1bd8b-8291-7906-b862-6088593acfe5` (no es ID nativo); G13 sustituido; FOL1 PREPARADA/NO ACTIVA; folio PENDIENTE/NO ASIGNADO.
- No se transfirió titularidad, no se creó corresponsable y no se asignó nuevo folio. MCP normativo continúa DESACTIVADO.

### 12.3 Código, PR y CI vigentes

- PR #83 cerrada sin merge. PR #84 [dual-source Groq Whisper](https://github.com/SeryMente/signal-interpreter/pull/84) permanece OPEN/DRAFT/NOT MERGED, rama `feat/groq-dual-main-20261111`, HEAD validado `1c7aca92cc89337aeb4c9907426847f941fa35bd`.
- Diff del PR: 33 archivos de código, pruebas, manifiestos, empaquetado y workflows; `observations/` no está en el diff. Versión declarada de extensión: 0.10.47.
- CI SUCCESS para ese HEAD: Package integrity run `42941191180`; signal-observability-audit run `42941191052`; native-caption-host-build run `42941191195`.
- La auditoría de observabilidad se ejecutó con cuatro jobs paralelos (syntax 56 comandos, guards 16 suites, observability 14 suites, captions 13 suites) y un job aggregate obligatorio. 99 comandos originales preservados. Los tres workflows aplican concurrency/cancel-in-progress por workflow y rama; dos ejecuciones anteriores obsoletas fueron canceladas y las tres ejecuciones vigentes SUCCESS.
- En dos checkouts de Fila 4 se obtuvo validación independiente: 43/43 suites PASS; 56/56 syntax PASS; verificador 66/66 hashes PASS; 8 critical audio/Connect/presence suites PASS; YAML parse/estructura/conteos PASS; parser PowerShell 5.1, identidad de extensión y archivo de distribución PASS. Los checkouts se mantuvieron separados; el checkout temporal bajo MantenimientoRCI se eliminó tras la prueba.

### 12.4 Estado de runtime, privacidad y aceptación

- La captura exige `displaySurface === "browser"`; metadata ausente, ventana o monitor fallan cerrado antes de pedir el micrófono. El control remoto conserva etiqueta neutral si no hay metadata verificable; no inferir LEP/proveedor.
- Los flags Groq/ZDR permanecen false por defecto. No se encontró clave Groq local ni variable de entorno habilitada. No hubo llamadas al endpoint, audio real, llamada real ni comprobación ZDR en la consola de cuenta.
- Chrome administrado bloqueó Developer Mode / Load unpacked. El perfil temporal fue eliminado y el perfil habitual no fue modificado. No se declara extensión cargada/aceptada.
- No existen métricas WER/CER, latencia p50/p95, jitter, deriva, pérdidas/duplicados, calidad acústica por fuente ni coste/ASH real de la cuenta. Chunk 6.5 s / overlap 500 ms / hop 6 s siguen siendo candidatos, no parámetros óptimos.
- No hubo merge, deploy, release ni aceptación funcional. La CI verde acredita solo los workflows y SHA indicados.

### 12.5 Tareas provisionales activas

El backlog operativo de continuidad queda en [TAREAS-PROVISIONALES-GROQ-DUAL-G14.md](TAREAS-PROVISIONALES-GROQ-DUAL-G14.md), blob `1aa2792ac5e497af72770b1d30d64889f1878d51`. Define 12 tareas, prioridad, estado, dependencias, acciones y criterios de salida. Resumen: conservar PR/CI; resolver Chrome autorizado; verificar ZDR/cuotas; preparar secreto local; probar API con corpus sintético no clínico; validar ciclo de vida de captura; verificar fusión/overlay; optimizar chunking/coste con medición; fijar umbrales acústicos; reservar aceptación final al operador; mantener aceleración CI sin reducción de cobertura; y preservar continuidad interconversacional.

### 12.6 Ruta única de reanudación

Una conversación nueva debe leer, en este orden: (1) §ARR y DUG vigentes desde Metodología main; (2) este OCP y CONTROL-RESPONSABILIDAD.json; (3) [esta crónica de retoma](cronica/C-SIGNAL-RETOMA-20261111-G14-CURRENT.md); (4) [TAREAS-PROVISIONALES-GROQ-DUAL-G14.md](TAREAS-PROVISIONALES-GROQ-DUAL-G14.md); (5) instrucciones literales y plan provisional enlazados en §12.1; (6) PR #84 y checks del HEAD actual. No asumir que el HEAD aquí citado sigue vigente; consultarlo otra vez. No reconstruir la última salida anterior no disponible. No iniciar audio real, credenciales, ZDR, Chrome ni aceptación sin las compuertas descritas.

G14 continúa como agente único. FOL1 sigue PREPARADA/NO ACTIVA; folios permanecen PENDIENTES/NO ASIGNADOS. MCP normativo DESACTIVADO.
