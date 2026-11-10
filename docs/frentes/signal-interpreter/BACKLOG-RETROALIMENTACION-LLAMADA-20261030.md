# Backlog provisional — retroalimentación de llamada

- Frente: **Signal Interpreter**
- Fecha de incorporación: **2026-10-30** (fecha local del operador)
- Estado: **PERSISTIDO · PROVISIONAL · NO IMPLEMENTADO**
- Base de revisión: Signal Interpreter **0.10.39**; main leído en `5129fd67538bfc2ba62c59ee7c26b785eb132361`
- Identificador local UUIDv7: `01a18f95-c7b1-7690-abb7-539a6ea430d4`
- Origen: retroalimentación directa del operador después de una llamada, transcripción pegada en la conversación y captura de pantalla compartida en la conversación.
- Privacidad: no se conserva en este repositorio público la transcripción cruda, la captura, nombres, domicilios, teléfonos, correos, audio ni identificadores de la llamada. Las observaciones de esta lista están redactadas de forma abstracta.

> Este archivo es un backlog de trabajo provisional. Registra intención, evidencia reportada y criterios de aceptación; no declara cambios de código, pruebas, captura de micrófono, despliegue ni aceptación ya realizados. Las decisiones arquitectónicas de alto nivel se resolverán antes de construirlas. La aceptación de uso real permanece reservada al operador.

## 1. Resumen de la retroalimentación

1. En espera de llamada, la extensión debe mantener el micrófono silenciado de forma invariable.
2. La restricción de silencio solo debe levantarse cuando exista una llamada contestada/activa. La intención inicial del operador fue que, al contestar, el micrófono quede disponible sin mute. La corrección posterior describe el comportamiento observado en 0.10.39: la llamada inicia silenciada y el operador debe quitar el mute manualmente. Se registra como discrepancia entre objetivo inicial y comportamiento actual, no como confirmación de que el comportamiento actual sea el deseado.
3. La voz del propio intérprete no está llegando de forma fiable a la transcripción. Debe capturarse/transcribirse el canal propio en **español e inglés**, con detección bilingüe por segmento y atribución explícita a INTÉRPRETE.
4. La transcripción visible presenta oportunidades en continuidad de frases, fragmentación, posibles duplicaciones de hipótesis, reconocimiento de nombres/direcciones/números, solapamientos y asignación de fuente/hablante.
5. El overlay emplea demasiado espacio en cabeceras, etiquetas repetidas, metadatos y separaciones. La prioridad visual debe ser el texto útil.
6. Debe existir un botón para abrir la transcripción en una pestaña independiente de Google Chrome, usando el espacio completo de la pestaña como lector de transcripción.

## 2. Línea base técnica verificada en el repositorio

- `extension/mic-guard-main.js` contiene un guard que intercepta pistas de audio y dispone de operaciones verificables de mute/unmute. El backlog debe conectar ese guard con el ciclo de vida real de la llamada; la existencia del guard no demuestra que la política completa de estados ya esté cubierta.
- `extension/background.js` mantiene la ruta oficial de captions basada en texto nativo de Chrome. La captura de audio de pestaña está deshabilitada en la ruta consultada.
- `extension/live-caption-core.js` contiene detección de inglés/español y segmentación lingüística local. También contiene reglas que mapean el canal entrante según idioma y reservan la etiqueta INTÉRPRETE para una fuente explícita `yo`. Idioma no debe utilizarse como sustituto de identidad de hablante.
- `extension/live-caption-overlay.js` renderiza rol, idioma y hora en cada fila, con separaciones y padding visibles. La captura compartida muestra una columna estrecha y repetición de etiquetas antes de cada fragmento.
- `extension/groq-transcriber.js` existe como módulo de transcripción aislado. Su existencia no prueba que esté integrado al flujo oficial de captions ni determina que deba ser el proveedor elegido para esta ampliación.
- La documentación vigente de 0.10.39 excluía la captura del micrófono. La nueva solicitud directa del operador cambia ese alcance para estudiar e implementar la transcripción del canal propio; no autoriza captura durante espera, escucha permanente, grabación duradera ni envío de audio/texto privado a observabilidad.

## 3. Backlog priorizado

### SI-FB-01 — Política de mute vinculada al estado de llamada

**Prioridad:** P0 · seguridad del canal de audio  
**Estado al 2026-11-10:** implementación parcial en main 0.10.47; el operador reportó que el micrófono no enciende. El hotfix local que atendería pistas tardías está reportado, no re-verificado ni integrado en main. Aceptación pendiente.

**Objetivo:** impedir que el micrófono quede abierto antes de que el operador conteste una llamada y asegurar el cierre inmediato al terminarla.

**Comportamiento objetivo provisional:**

- `IDLE / WAITING`: micrófono silenciado; no se inicia captura para transcripción.
- `RINGING / INCOMING / CONNECTING`: micrófono continúa silenciado.
- `ACCEPTED / ACTIVE`: se permite abrir el micrófono. Según la intención inicial, el estado objetivo al establecerse la llamada es sin mute; 0.10.39 fue observado iniciando con mute y requiriendo desbloqueo manual.
- `ENDED / DISCONNECTED / FAILED / SESSION-LOST`: volver a silenciar y detener cualquier captura del canal propio.
- Cualquier transición desconocida, error de permisos, pérdida de contexto o reinicio del runtime debe fallar en modo seguro: silenciado.

**Criterios de aceptación:**

- Pruebas de transición para espera, timbrado, conexión, llamada aceptada, llamada terminada, desconexión, error y reinicio.
- Ninguna pista de micrófono puede quedar habilitada en espera o durante timbrado.
- La capacidad de quitar el mute queda bloqueada hasta que la llamada esté realmente aceptada/activa.
- La terminación o pérdida de llamada devuelve el micrófono a mute sin depender de una acción manual posterior.
- Estado visual y estado real de las pistas coinciden; las verificaciones deben inspeccionar `MediaStreamTrack.enabled` y la pista saliente, no solo el icono.
- El guard actual se reutiliza o extiende sin crear una segunda ruta de control contradictoria.

### SI-FB-02 — Captura y transcripción bilingüe del canal INTÉRPRETE

**Prioridad:** P1 · funcionalidad central  
**Estado al 2026-11-10:** no implementado en main. La candidata de PR #75 permanece draft/no mergeable; credencial y confirmación efectiva de ZDR, aislamiento y E2E bilingüe siguen pendientes.

**Objetivo:** transcribir en tiempo real la voz del operador/intérprete capturada desde el micrófono, tanto en español como en inglés, y mostrarla como un canal independiente de los captions del cliente/LEP.

**Requisitos:**

- Captura únicamente después de `ACCEPTED / ACTIVE`; nunca durante espera, timbrado o una sesión sin llamada.
- Canal lógico explícito, por ejemplo `source=yo` y `speaker=INTÉRPRETE`, sin deducir identidad a partir del idioma.
- Detección automática español/inglés por segmento o cambio de idioma dentro de una misma intervención; no fijar toda la llamada a un solo idioma.
- El texto propio debe coexistir con el canal nativo de Chrome sin mezclar fuentes, sobrescribir frases ni duplicar eventos.
- Indicador visible de captura/transcripción activa y estado de error/permisos.
- Al terminar la llamada, detener captura y liberar las pistas.
- No enviar audio crudo, texto clínico ni contenido de la llamada al sistema de observabilidad. No persistir audio. La retención del texto de sesión debe permanecer limitada al alcance explícitamente aprobado.
- Evaluar latencia, precisión por idioma, estabilidad de conexión, coste y privacidad antes de seleccionar proveedor. No asumir Groq como decisión arquitectónica por el solo hecho de existir el módulo.

**Criterios de aceptación:**

- Prueba bilingüe con frases de intérprete en inglés y español, incluyendo cambios de idioma dentro de la misma llamada.
- Todo segmento de esa fuente queda atribuido a INTÉRPRETE, independientemente del idioma.
- Ningún audio propio se captura fuera de una llamada aceptada.
- Las fuentes entrantes y el micrófono se conservan como canales independientes.
- El micrófono se silencia y la captura se detiene al terminar, perder o reiniciar la llamada.
- Se documentan latencia y calidad por idioma usando muestras sintéticas o expresamente autorizadas; no se publica contenido clínico real.

### SI-FB-03 — Calidad, continuidad y atribución de la transcripción

**Prioridad:** P1 · calidad funcional  
**Estado al 2026-11-10:** parcial para captions nativos, metadata source/speaker/language e identidad de parciales; métricas WER/CER, corpus autorizado y aceptación del canal INTÉRPRETE pendientes.

**Hallazgos observados en la muestra (sin conservar contenido privado):**

- Fragmentos que terminan a mitad de una frase y continúan en filas posteriores.
- Repetición de frases o preguntas en intervalos cortos. Debe determinarse si son repeticiones reales del hablante o hipótesis parciales que se están anexando en vez de actualizarse.
- Reconocimiento inestable de entidades críticas: nombres propios, direcciones, números y palabras similares fonéticamente.
- Distorsiones de palabras y frases, especialmente con habla rápida, ruido y fragmentos cortos.
- Intervenciones de varios canales con marcas temporales iguales o muy próximas, sin una representación suficientemente clara del solapamiento.
- Cambios de idioma dentro de una intervención y etiquetas de fuente/rol ambiguas. El canal `INTERVENCIÓN LIVE` aparece mezclando idiomas y no constituye evidencia suficiente de identidad por sí mismo.

**Líneas de mejora:**

- Revisar el ciclo de vida de los resultados parciales/finales del motor: actualizar la hipótesis provisional de un mismo segmento, en lugar de anexar cada revisión como una intervención nueva.
- Ajustar ventanas de segmentación, contexto, puntuación y cierre de frase para evitar cortes innecesarios sin aumentar de forma excesiva la latencia.
- Preservar tiempos de inicio/fin y canal de origen para que las intervenciones simultáneas no se fusionen ni se reordenen artificialmente.
- Separar estrictamente `source`, `speaker` y `language`. El idioma clasifica el contenido lingüístico; no prueba quién habló.
- Tratar nombres, domicilios, teléfonos y números como entidades de alta criticidad: no autocorregir ni completar con conjeturas. Si el reconocimiento es incierto, conservar la forma escuchada y marcar incertidumbre para verificación humana.
- Medir por separado inglés y español. Establecer línea base antes de fijar umbrales de aceptación.

**Criterios de aceptación:**

- Corpus de prueba bilingüe con texto de referencia, frases completas, cambios de idioma, ruido controlado y habla solapada.
- Métricas separadas por idioma: WER/CER, continuidad de segmentos, duplicación de parciales, exactitud de entidades críticas y atribución de fuente.
- Los parciales revisados no generan duplicados falsos; las repeticiones realmente pronunciadas sí se conservan.
- Fragmentos de idioma incierto permanecen inciertos; no se asigna una identidad de hablante por heurística lingüística.
- Prueba real controlada en Windows/Chrome, aceptada expresamente por el operador.

### SI-FB-04 — Densidad visual y redistribución del overlay

**Prioridad:** P2 · UX / legibilidad  
**Estado al 2026-11-10:** parcial: minimización reversible y preferencia de colapso integradas en main; densidad compacta integral, revisión teclado/viewport y aceptación visual pendientes.

**Objetivo:** maximizar el espacio legible para el contenido transcrito y reducir el espacio consumido por elementos repetitivos.

**Requisitos:**

- Reducir padding, gaps y altura de filas/cabecera donde no aporten información.
- Evitar repetir en cada fila etiquetas completas de rol e idioma cuando el canal no cambia; mostrar metadatos compactos y solo cuando exista un cambio relevante.
- Dar prioridad al texto de la intervención; mantener el timestamp como dato secundario y discreto.
- Aumentar el ancho útil inicial del panel y aprovechar mejor el ancho disponible, conservando redimensionamiento manual.
- Reordenar controles secundarios para que no compitan con la lectura.
- Mantener contraste, selección/copiar texto, navegación por teclado, scroll y tamaño de letra legible.
- Incorporar una densidad compacta por defecto sin sacrificar accesibilidad.

**Criterios de aceptación:**

- Comparación visual antes/después con el mismo volumen de segmentos y viewport.
- Mayor proporción del panel dedicada a texto y menos altura desperdiciada en metadatos repetidos.
- Se identifican claramente los cambios de canal e idioma sin necesitar una tarjeta completa por cada fragmento.
- El panel sigue siendo desplazable, redimensionable y usable con teclado.

### SI-FB-05 — Lector de transcripción en pestaña independiente de Chrome

**Prioridad:** P2 · UX / lectura extendida  
**Estado al 2026-11-10:** implementado a nivel de código en main 0.10.47 como pestaña LIVE normal/reutilizable y de ancho completo con captions nativos de sesión; sincronización/scroll y aceptación en Chrome real pendientes.

**Objetivo:** añadir un botón visible en el overlay para abrir la transcripción de la llamada en una pestaña independiente de Google Chrome, utilizando el espacio completo de esa pestaña.

**Requisitos:**

- Botón con acción inequívoca, por ejemplo `Abrir transcripción`.
- Abrir una página/vista de extensión en una nueva pestaña mediante la API de Chrome.
- La vista utiliza todo el ancho y alto del viewport de esa pestaña; esto significa lector a pantalla completa dentro de la pestaña, no forzar el modo F11 del navegador.
- Mantener el historial de la sesión y recibir nuevas intervenciones en vivo mientras la llamada siga activa.
- Permitir desplazarse por el historial sin que la llegada de texto obligue a saltar al final; incluir indicador para volver a las nuevas intervenciones.
- Texto seleccionable y copiable, timestamps discretos y controles mínimos.
- Al terminar la llamada, conservar el historial únicamente durante el periodo de sesión definido y no publicar texto en telemetría.

**Criterios de aceptación:**

- El botón abre exactamente una vista de transcripción en una pestaña nueva.
- La vista presenta todo el contenido disponible y se actualiza con nuevos segmentos de la misma llamada.
- El scroll histórico no se pierde cuando llegan segmentos nuevos.
- La pestaña no inicia otra captura de audio ni crea una sesión duplicada.
- Cerrar la pestaña no afecta la llamada ni el overlay original.

### SI-FB-06 — Matriz integrada de pruebas y aceptación

**Prioridad:** P1 · compuerta de liberación  
**Estado al 2026-11-10:** parcial: CI y pruebas sintéticas disponibles; el operador reportó una batería 27/27 y SHA 59/59 en el ciclo anterior, no re-verificados aquí. La prueba integrada en Chrome/llamada real y aceptación del operador siguen pendientes.

La entrega que incorpore estos cambios debe probar, como mínimo:

1. Mute permanente en espera y timbrado.
2. Transición a llamada aceptada y estado inicial del micrófono.
3. Mute inmediato al finalizar, desconectar o perder la sesión.
4. Transcripción separada del micrófono del intérprete en inglés y español.
5. Coexistencia de captions nativos entrantes y voz del intérprete.
6. Fragmentos parciales, frases completas, repeticiones verdaderas, cambios de idioma y solapamientos.
7. Nombres/números/direcciones con incertidumbre visible y sin corrección inventada.
8. Panel compacto con texto legible y metadatos mínimos.
9. Apertura del lector en una pestaña Chrome y sincronización de nuevos segmentos.
10. Ausencia de audio/texto clínico crudo en telemetría y artefactos públicos.
11. E2E Windows/Chrome en una llamada controlada; aceptación funcional explícita del operador.

## 4. Secuencia de trabajo propuesta

1. **Seguridad de audio:** definir y probar la máquina de estados de mute (SI-FB-01).
2. **Canal del intérprete:** diseñar la captura acotada a llamada activa y el ASR bilingüe (SI-FB-02); confirmar arquitectura, permisos y retención antes de construir.
3. **Calidad de texto:** corregir segmentación, parciales, entidades críticas y atribución de fuentes (SI-FB-03).
4. **Lectura del overlay:** reducir densidad visual y ampliar el área útil (SI-FB-04).
5. **Vista extendida:** implementar el lector en pestaña independiente (SI-FB-05).
6. **Aceptación:** ejecutar la matriz completa y prueba real controlada (SI-FB-06).

## 5. Límites y decisiones pendientes

- Este backlog no activa captura de micrófono en la versión instalada ni realiza cambios en el equipo PC-14.
- No autoriza una sesión nueva de RDC, GUI, intervención real en llamadas ni carga/reload de Chrome.
- La solicitud de transcribir el canal propio supersede para el trabajo futuro la exclusión de micrófono que figuraba en el alcance anterior; la exclusión de captura de audio de pestaña y la prohibición de grabación/telemetría cruda permanecen.
- El estado de llamada debe proceder de una señal verificable de Cloud Interpreter, no de estar online, de recibir timbrado ni de la mera visibilidad del overlay.
- La calidad de ASR se evaluará con muestras sintéticas o expresamente autorizadas. La muestra clínica compartida en la conversación no se publica ni se convierte en fixture público.
- La elección de proveedor/modelo de transcripción, la retención de texto de sesión y los límites de procesamiento se resolverán en el diseño previo a implementación.
- La aceptación final en Windows/Chrome y la liberación siguen reservadas al operador.

## 6. Estado de este registro

**Persistencia:** PERSISTIDO en `main`; commit de creación `02b52c061c8c3c9e22d0a4dbc3e69824f95f2c6c`; lectura de vuelta exacta verificada.  
**Implementación:** no iniciada.  
**Prueba de usuario posterior:** pendiente.  
**Clasificación:** backlog provisional del mismo frente Signal Interpreter; no crea un frente ni un responsable paralelo.


## 7. Reconciliación vigente — 2026-11-10 · G14

Esta sección actualiza los estados operativos de SI-FB-01–SI-FB-06 sin borrar su registro original. La crónica detallada está en [C-SIGNAL-BACKLOG-REGRESIONES-20261110-G14.md](cronica/C-SIGNAL-BACKLOG-REGRESIONES-20261110-G14.md). La última versión de producto verificada en `main/manifest.json` es **0.10.47**; PR #79 se fusionó en `10a7f1b1f8c48d290ce8f4df5639109efe571c22`.

### Nuevas tareas de regresión reportadas

#### SI-REG-01 — Interruptor Auto-Answer · P0
**Estado:** CORRECCIÓN CANDIDATA VERIFICADA en `fix/backlog-p0-switch-mic-late-track-20261110`: `presenceIdleSeconds=180` en popup y worker; prueba de presencia 83/83 y suite completa 42/42 PASS; inventario 60/60 SHA-256. PR #80 sigue draft y no está integrada en main; aceptación E2E en Chrome pendiente.

Revisar carga del popup, listener/event handler, estado visible, escritura/lectura de configuración, comunicación con background/service worker y atajo de teclado. El fallback del handler mencionado en la conversación debe cotejarse en los archivos reales antes de promoverlo. No introducir rearme automático al pulsar Online; conservar autorización explícita, presencia revalidada y fail-closed.

**Aceptación:** activar/desactivar desde UI y atajo; estado visual y almacenado coincidentes; revalidación correcta; ningún Connect sin grant vigente; pausa, idle/locked, fin de sesión y reinicio no rearman la autorización.

#### SI-REG-02 — Habilitación tardía del micrófono · P0
**Estado:** CORRECCIÓN CANDIDATA VERIFICADA en `fix/backlog-p0-switch-mic-late-track-20261110`: el heartbeat reintenta unmute solo con intención explícita persistente de activar, llamada activa y pista viva silenciada y verificada; pruebas específicas y suite 42/42 PASS. El retry no depende del estado auxiliar del heartbeat. PR #80 draft; no integrada ni aceptada en Chrome.

Investigar el caso en que la llamada/ruta activa se confirma antes de que Cloud Interpreter cree la pista de audio. Cotejar el tratamiento de pistas que aparecen posteriormente, el estado del botón y `MediaStreamTrack.enabled`/pista saliente. Mantener mute fuera de llamada y remute al terminar, perder la ruta o quedar en estado desconocido.

**Aceptación:** prueba determinista con pista previa y tardía; unmute solo dentro de llamada activa; estado visual y pista real coincidentes; remute en fin/desconexión/session-loss; cero captura/unmute en espera.

Esta tarea se refiere al micrófono operativo de la llamada; no equivale a SI-FB-02 (transcripción del canal INTÉRPRETE).

#### SI-REG-03 — Test permanente de autorización paralela · P1
**Estado:** COBERTURA POR RESTAURAR.

PR #78 documentó la ejecución simultánea de cuatro validaciones independientes: configuración, inactividad/bloqueo, otra llamada activa y perfil correcto. La rama candidata restaura el test permanente con promesas diferidas; `presence-guard-test.mjs` pasa con 83/83 comprobaciones y la suite completa 42/42.

**Aceptación:** test determinista con promesas diferidas que demuestre el inicio de las cuatro consultas antes de resolver la primera; falla si se ejecutan secuencialmente; no modifica guards ni la regla de un único clic autorizado.

#### SI-REG-04 — Aceptación integrada 0.10.47 + corrección de regresiones · P0
**Estado:** PAQUETE CANDIDATO VALIDADO EN STAGING (42/42 pruebas; 77 archivos JS sin errores de sintaxis; 8 scripts PowerShell parseables; 60/60 SHA-256); falta sincronizar la carpeta activa y la aceptación manual del operador en Chrome/llamada controlada.

Después de cotejar e integrar únicamente el hotfix mínimo y las pruebas, verificar paquete, inventario SHA-256 y respaldo reversible. La recarga manual en Chrome debe hacerla el operador fuera de una llamada activa; verificar versión realmente cargada, switch, presencia y una llamada controlada. No considerar CI o el archivo en disco como aceptación E2E.

### Ledger de PR — no fusionar ramas completas por conveniencia

- **#79:** fusionada; contiene la línea base de main 0.10.47.
- **#78:** fusionada; proteger la optimización de autorización paralela y su test permanente.
- **#72 y #73:** abiertas/no mergeable; parte de continuidad MV3 y manejo de fallos transitorios fue integrada selectivamente en #79. Revisar solo deltas no cubiertos.
- **#74:** abierta/no mergeable; no portar el rearme automático al pulsar Online. Revisar únicamente el arreglo de URL/diagnóstico que no debilite el consentimiento.
- **#75:** abierta, draft/no mergeable; rama amplia. Mantener sin merge mientras no se aíslen y validen los cambios de micrófono/ASR, privacidad, rendimiento y visuales.
- **#76:** abierta/no mergeable; el indicador contextual azul ya está descrito en #79. Conciliar diff restante antes de decidir cierre.
- **#70:** abierta, draft/no mergeable y documentalmente antigua; conservar como antecedente hasta conciliar deltas útiles, no fusionar completa.

La búsqueda de GitHub Issues abiertos devolvió cero. Este archivo sigue siendo el backlog persistente del frente.

### Evidencia y límites del corte

- PR #79 confirma que main 0.10.47 incluye guards de Auto-Answer, mute fail-closed, lector LIVE nativo y controles de overlay. No confirma recarga de Chrome ni E2E real.
- La conversación anterior reportó un hotfix local para pistas tardías, el handler del switch y escrituras serializadas, con 7/7 suites, paquete 59/59 y 4/4 SHA comparados. En este corte no se leyó el recibo ni se cotejaron esos archivos; clasificar como **REPORTADO, NO RE-VERIFICADO**. No afirmar integración en main.
- No se realizó acceso remoto a PC-7 ni se recargó Chrome. El control G14 vigente no hereda autorización de dispositivos anteriores.
- No se capturó audio real ni se actuó sobre llamadas. La aceptación funcional final permanece PENDIENTE.

## 8. Secuencia priorizada actual

1. P0 — cotejar contra main y reparar el interruptor Auto-Answer sin alterar autorización explícita.
2. P0 — cotejar contra main y reparar la habilitación del micrófono con pista tardía, preservando mute fuera de llamada.
3. P1 — restaurar test permanente de concurrencia de las cuatro validaciones.
4. P0 — validar paquete integrado y dejarlo preparado para recarga manual autorizada.
5. P0 — aceptación del operador en Chrome y llamada controlada.
6. P1/P2 — continuar SI-FB-02/03/04 y aceptación funcional del lector SI-FB-05.



## Aditamento de verificación de la candidata — 2026-11-10

- Rama: `fix/backlog-p0-switch-mic-late-track-20261110`; PR #80 abierta como draft, no fusionada.
- En staging aislado del perfil de trabajo `fila4`: **42/42 pruebas PASS**, **0 FAIL**; **77 archivos JavaScript** pasan `node --check`; **8 scripts PowerShell** pasan Parser; **60/60 archivos del inventario** coinciden en SHA-256.
- `tools/verify-release-package.mjs` y `tools/portable-root-test.mjs` pasan. El manifiesto derivado `extension/manifest.json` es normalizado respecto del manifiesto raíz y las 18 rutas comprobadas existen.
- No se cargó ni recargó Chrome, no se manipuló ninguna llamada y no se efectuó aceptación E2E. La aceptación funcional del operador permanece pendiente.
