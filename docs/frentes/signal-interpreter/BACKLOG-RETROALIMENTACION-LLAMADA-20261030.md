# Backlog provisional — retroalimentación de llamada

- Frente: **Signal Interpreter**
- Fecha de incorporación: **2026-10-30** (fecha local del operador)
- Estado: **PERSISTIDO · PROVISIONAL · IMPLEMENTACIÓN PARCIAL EN CANDIDATA 0.10.45**; no aceptado ni liberado.
- Base de revisión: Signal Interpreter **0.10.39**; main leído en `5129fd67538bfc2ba62c59ee7c26b785eb132361`
- Identificador local UUIDv7: `01a18f95-c7b1-7690-abb7-539a6ea430d4`
- Origen: retroalimentación directa del operador después de una llamada, transcripción pegada en la conversación y captura de pantalla compartida en la conversación.
- Privacidad: no se conserva en este repositorio público la transcripción cruda, la captura, nombres, domicilios, teléfonos, correos, audio ni identificadores de la llamada. Las observaciones de esta lista están redactadas de forma abstracta.

> Este registro conserva los requisitos y criterios originales. La sección 7 documenta la implementación observada en 0.10.45, evidencia automatizada y límites aún abiertos. Código presente o CI verde no equivalen a aceptación funcional Windows/Chrome ni a liberación.

> Las etiquetas de estado originales dentro de las secciones 2–6 describen la línea base al crear el backlog; la sección 7 es la clasificación vigente en G14.

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
**Estado:** pendiente de análisis e implementación.

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
**Estado:** cambio de alcance solicitado; arquitectura y permisos por diseñar.

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
**Estado:** diagnóstico inicial realizado sobre la muestra compartida; correcciones pendientes.

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
**Estado:** diagnóstico visual inicial realizado; rediseño pendiente.

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
**Estado:** solicitado; diseño e implementación pendientes.

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
**Estado:** pendiente.

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

- La candidata contiene un canal opcional de micrófono del intérprete, pero permanece deshabilitado por defecto. En el perfil fila4 no existe credencial Groq local y el estado ZDR de la consola del proveedor no está verificado.
- El operador autorizó la operación técnica mediante MantenimientoRCI, con artefactos y destino bajo el usuario Windows fila4. Esa autorización no habilita llamadas reales, recarga de Chrome, envío de audio ni aceptación funcional automática.
- La solicitud de transcribir el canal propio supersede para el trabajo futuro la exclusión de micrófono que figuraba en el alcance anterior; la exclusión de captura de audio de pestaña y la prohibición de grabación/telemetría cruda permanecen.
- El estado de llamada debe proceder de una señal verificable de Cloud Interpreter, no de estar online, de recibir timbrado ni de la mera visibilidad del overlay.
- La calidad de ASR se evaluará con muestras sintéticas o expresamente autorizadas. La muestra clínica compartida en la conversación no se publica ni se convierte en fixture público.
- La elección de proveedor/modelo de transcripción, la retención de texto de sesión y los límites de procesamiento se resolverán en el diseño previo a implementación.
- La aceptación final en Windows/Chrome y la liberación siguen reservadas al operador.

## 6. Estado de este registro

**Persistencia:** PERSISTIDO en `main`; commit de creación `02b52c061c8c3c9e22d0a4dbc3e69824f95f2c6c`; lectura de vuelta exacta verificada.  
**Implementación:** parcial en candidata 0.10.45 (PR #75, no fusionada ni liberada).
**Prueba de usuario posterior:** pendiente; no se inició llamada real ni E2E en Chrome.
**Clasificación:** backlog provisional del mismo frente Signal Interpreter; no crea un frente ni un responsable paralelo.


## 7. Estado de implementación observado · candidata 0.10.45 · G14

Corte del 2026-11-08. La candidata se encuentra en PR #75; main permanece en 0.10.40. El candidato se integró localmente con origin/main, en un worktree aislado, sin conflictos. Esta tabla actualiza el estado del backlog; no redefine los criterios de aceptación originales.

| Ítem | Estado observado en 0.10.45 | Evidencia automatizada | Pendiente para aceptar/cerrar |
|---|---|---|---|
| **SI-FB-01 · mute por ciclo de llamada** | **Implementado en candidata**: estados fail-closed fuera de llamada; permite apertura solo con llamada activa confirmada; vuelve a mute ante fin, desconexión, fallo o pérdida de contexto. | microphone-call-lifecycle-test.mjs, microphone-guard-test.mjs, regresores de Auto-Answer/presencia y CI candidato. Prueba local post-merge PASS. | Verificar MediaStreamTrack.enabled y pista saliente en Windows/Chrome durante llamada controlada; no se ha hecho. |
| **SI-FB-02 · canal de INTÉRPRETE bilingüe** | **Implementado como canal opcional y explícito** mediante Groq Whisper; captura manual dentro de /call/:id, chunks limitados en memoria y cese/liberación al perder contexto. Desactivado por defecto. | groq-transcriber-tests.mjs, microphone-call-lifecycle-test.mjs, auditoría estática de privacidad y CI candidato PASS. | No hay clave local en fila4 (.signal-interpreter/groq-token.dat ausente), ni ZDR confirmado en consola del proveedor; no se pidió permiso de micrófono ni se envió audio real. Probar calidad bilingüe solo después de resolver esas compuertas. |
| **SI-FB-03 · continuidad, precisión y atribución** | **Parcial**: separación de source, speaker y language; el idioma no identifica hablante; se gestionan revisiones/solapamientos y se rehidrata historial efímero de INTÉRPRETE. | live-caption-core-test.mjs, live-caption-session-history-test.mjs, regresores de mic lifecycle y auditoría estática PASS. | WER/CER, exactitud de nombres/números/direcciones, latencia por idioma y rendimiento con audio real no medidos. |
| **SI-FB-04 · densidad visual** | **Implementado en candidata**: overlay compacto, etiquetas menos repetitivas, tipografía 14 px y límites de render de 72 spans/800 filas de sesión. | live-caption-performance-budget-test.mjs, live-caption-static-audit.mjs y pruebas de overlay PASS. | Comparativa visual en Chrome fila4, legibilidad, teclado y revisión de accesibilidad por operador pendientes. |
| **SI-FB-05 · lector en pestaña Chrome** | **Implementado en candidata**: abre/reutiliza pestaña normal, layout de ancho completo, historial de sesión y actualización de filas LIVE; no abre otro canal de captura. | live-caption-session-history-test.mjs, call-caption-runtime-test.mjs, verificador de paquete y CI candidato PASS. | Verificar sincronización y scroll en vivo en una llamada controlada; no probado en sesión real. |
| **SI-FB-06 · matriz integrada de aceptación** | **Parcial**: 42 scripts de test locales, 25 archivos JS con sintaxis válida y auditorías estáticas/paquete PASS. En el HEAD publicado 72a760a46e0d31eee0d5e9f9ae4ef6fbe414d8c7, los 3 workflows GitHub Actions PASS. | QA local post-merge: 48 verificaciones agrupadas PASS, 0 FAIL. GitHub Actions del HEAD 72a760a46e0d31eee0d5e9f9ae4ef6fbe414d8c7: 3/3 PASS (audit, Package integrity y native-caption-host-build). | E2E Windows/Chrome, llamada real controlada, métricas de calidad, telemetría fresca del runtime y aceptación explícita del operador. |

### Evidencia reproducible de esta actualización

- Worktree candidato reconciliado: C:/Users/fila4/Desktop/SeryMente/SI-G14-RECONCILE; commit local 49f18e18e88918575278ed083db31d127d21a892.
- Pruebas reproducidas desde la raíz del repositorio con Node v24.0.0. Resultado: 42/42 test scripts; 25/25 archivos JS sintácticamente válidos; auditorías estáticas Live Caption/Observability, verificador del paquete, auditoría de observaciones y git diff --check PASS.
- Log: C:/Users/fila4/Desktop/SI-backups/validation-G14-PR75/windows-node24-g14-postmerge.log.
- Resultado JSON: C:/Users/fila4/Desktop/SI-backups/validation-G14-PR75/resultados-postmerge.json.
- Se preservó el checkout original en un ZIP íntegro antes de crear el worktree; SHA-256: 224E9AA78E6B6BE7FF895EAA9030283E9233C74C6391A712461C9025DAFC269C.

**Dictamen:** los cambios de software para SI-FB-01/02/04/05 están presentes en la candidata; SI-FB-03 y SI-FB-06 continúan parciales. No se marca ningún ítem como aceptado por usuario ni se declara backlog cerrado hasta completar E2E y las compuertas humanas descritas.
