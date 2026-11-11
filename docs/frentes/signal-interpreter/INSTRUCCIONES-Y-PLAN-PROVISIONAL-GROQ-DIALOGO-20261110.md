# Signal Interpreter — instrucciones fuente y plan provisional de diálogo Groq

**Estado:** DOCUMENTO DE TRABAJO · PROVISIONAL · NO ES ACEPTACIÓN NI LIBERACIÓN  
**Frente:** Signal Interpreter · G14  
**Fecha de registro:** 2026-11-10  
**Objeto:** conservar instrucciones literales del operador y convertirlas en criterios verificables de implementación.  
**Regla de procedencia:** los bloques de la sección 1 son transcripciones literales de mensajes del operador disponibles en el contexto de esta tarea. No corregir ortografía, puntuación, mayúsculas ni erratas dentro de esos bloques.

---

## 1. Instrucciones del operador — verbatim

### A-01 · instrucción sobre el canal de voz INTÉRPRETE

```text
Reconocer tu voz como INTÉRPRETE
Signfiica: Que capture la entrada de audio, y la transcvriba y la muestre en el dialogo, usando,  enla medida de lo util, pero adecuada para el proposito y el caso de uso especial de Signal Interpreter, lo que ya se construyo en Khora que usa whisper pra transcribir muy rapido. No signficia que sea el estandar, significa que puede ser util. Pero considera las necesidades de Signal intepreter por separado. 

Calidad maxima. Reportame en 10 minutos.
```

### A-02 · instrucción sobre diálogo combinado, velocidad y documentación

```text
Lo que necesito es la transcripcion,  commbinada, del procesamiento de la salida de audio via api groq el whisper mas potente que la pltforma ofrezca,  y la transcripcion tan rapida como sea posible de mi voz, ordenado todo en un dialogo bien organizado, bien ppresentado etc. De alta calidad. Sin costursa. Aqui importa mucho la velocidad de procesamiento con  la api de groq. 

Entonces vamos bien? 

Documenta tus tareas provisionaels y todas mi sinstruccioens verbatim, que sean usadas como fuetned e verdad para las tareas.
```

### Nota de integridad del registro

El resumen previo del frente incluye una petición inicial anterior, pero el texto literal completo de ese mensaje no está disponible en el contexto textual que se pudo recuperar para este documento. No se reconstruye ni se presenta una paráfrasis como cita. Si se recupera el mensaje original exacto, debe añadirse como otro bloque verbatim sin alterar A-01 ni A-02.

---

### A-03 · continuidad, OCP y ventana de trabajo

```text
Okj, continuemos, actualiza en tu ocp las reglas operativas y las decisiones hasta aquim tus tareas provisionales,  y sigamos trabajando,  tengo 40 minutos, hagamos que cuenten.
```


### A-04 · estándar de calidad y ejecución

```text
Ok, no uize interrumpir tu trabajo de tan alta calidad yu pulcritud. Documenta todo correctamente,  y construye mi solucion elgantemente, pensando siempre en calidad mundial que quede bien a la primer ok? Perfecto al primer itnento.  go.
```

## 2. Interpretación operativa vinculante

El entregable solicitado es **un solo diálogo cronológico combinado** que recibe dos fuentes de audio independientes y las procesa con Groq Whisper:

1. **SALIDA REMOTA:** audio reproducido por la pestaña de la llamada (participantes remotos). Debe capturarse como canal separado y enviarse a Groq.
2. **MICRÓFONO PROPIO:** entrada del micrófono del intérprete. Debe capturarse como canal separado, identificarse por procedencia como `INTÉRPRETE` y enviarse a Groq.

Ambos canales deben funcionar simultáneamente. No son dos productos, dos conversaciones ni dos motores alternativos: son dos fuentes sincronizadas del mismo diálogo, transcritas mediante el mismo modelo Groq Whisper.

**No basta** con transcribir únicamente el micrófono. **Tampoco basta** con conservar únicamente Live Caption nativo. El diálogo final debe incorporar la transcripción de la salida remota y la voz propia, fusionadas por tiempo y conservando los solapamientos.

### Atribución de hablantes

- La fuente del micrófono propio determina la etiqueta `INTÉRPRETE`.
- La salida remota puede contener LEP y proveedor mezclados.
- Whisper/Groq no entrega una identidad LEP/proveedor documentada en el formato de respuesta de transcripción revisado. No inventar esas etiquetas.
- Si Cloud Interpreter expone pistas remotas separadas o metadatos verificables de participante, pueden usarse para atribuir cada canal. Si no, mostrar `AUDIO REMOTO · HABLANTE NO VERIFICADO` o etiquetas neutrales equivalentes hasta tener diarización validada.
- No inferir identidad por idioma, acento, género, contenido clínico o secuencia conversacional.

---

## 3. Decisiones técnicas provisionales

### 3.1 Modelo y endpoint

- Modelo inicial de calidad: `whisper-large-v3` para **ambos** canales.
- Endpoint síncrono: `POST https://api.groq.com/openai/v1/audio/transcriptions`.
- `response_format=verbose_json`.
- `temperature=0`.
- `timestamp_granularities[]=segment` en el camino crítico en vivo.
- Idioma omitido en chunks bilingües ES/EN para permitir detección por fragmento; suministrar `language` solo cuando el idioma del audio de ese chunk esté determinado con evidencia fiable.
- Prompt breve, contextual y bilingüe; conservar nombres, números, dosis, unidades, direcciones y terminología sin completar contenido inaudible.
- Conservar los metadatos de segmento disponibles (`avg_logprob`, `no_speech_prob`, `compression_ratio`) para control de calidad, sin bloquear la presentación de texto válido por heurísticas no calibradas.

Groq recomienda `whisper-large-v3` para aplicaciones multilingües sensibles a errores. Su tabla pública compara WER 10.3% y factor de velocidad 189x frente a WER 12% y 216x para `whisper-large-v3-turbo`. Estas cifras son referencias publicadas por Groq, no una garantía de WER en interpretación médica. El modelo turbo queda como alternativa experimental de latencia, nunca como sustitución silenciosa del modelo de calidad.

### 3.2 Latencia y ejecución simultánea

- Dos colas independientes, una por fuente.
- Las peticiones de cada fuente y entre fuentes deben poder ejecutarse concurrentemente; nunca transcribir primero el audio remoto y después el micrófono en una cola serial compartida.
- Priorizar respuesta rápida mediante ventanas cortas y controladas, límite de concurrencia, cola acotada y backpressure explícito.
- Groq documenta la transcripción mediante archivo/URL y recomienda chunking con segmentos solapados y posterior reconciliación. La ruta de audio revisada no documenta streaming incremental de tokens para Whisper; por tanto, la experiencia en vivo se construirá con ventanas de audio subidas repetidamente, no afirmando que el endpoint es WebSocket/streaming.
- La granularidad de palabra se excluye del camino crítico: Groq indica que las marcas por palabra añaden latencia; las marcas por segmento no.
- El tamaño y solapamiento de ventanas es provisional y debe medirse. No fijar una cifra como óptima hasta comparar latencia, WER/CER, continuidad, duplicación y límites de cuenta.
- Tratar 429, `Retry-After`, timeouts y límites ASH/RPM sin pérdida silenciosa. Mantener estado de fuente degradada y recuperar por secuencia cuando sea posible.

**Límites públicos consultados el 2026-11-10 (no equivalen a los límites contratados de la cuenta del operador):** la documentación de Groq publica para Whisper Large V3 en Developer una base de 20 RPM, 2.000 RPD y 7.200 ASH; el endpoint aplica facturación mínima de 10 segundos por petición. La tarifa publicada para Large V3 es USD 0.111 por hora de audio. Dos canales de una hora en tiempo real consumen aproximadamente 7.200 segundos de audio por hora de sesión antes de añadir solapamiento/reintentos; por tanto, la cuenta puede necesitar límites superiores para mantener ventanas solapadas sin throttling. La ventana real debe calcularse contra los headers y límites efectivos de la organización, no asumir la base. No fijar chunk size hasta medir latencia y confirmar el plan.

### 3.3 Captura, cronología y continuidad

- Capturar micrófono y audio de pestaña en pistas separadas; no mezclarlos antes de transcribir.
- Establecer un único origen de reloj monotónico para la sesión.
- Cada fragmento conserva: `sessionId`, `source`, `sequence`, `captureStartMs`, `captureEndMs`, `durationMs`, `requestId`, `model`, resultado, metadatos de confianza y estado de entrega.
- Validar que cada carga sea un archivo multimedia autónomo y decodificable. No asumir que cualquier fragmento aislado de un `MediaRecorder` timesliced es reproducible por sí solo; verificar contenedor, cabecera y límites de segmento con ffprobe/ffmpeg o usar una estrategia de codificación por ventana que genere archivos autónomos.
- Fusionar segmentos de ambas fuentes por `startMs`, conservando el orden relativo y los solapamientos reales.
- Reconciliar ventanas contiguas/solapadas con identidad de fuente, secuencia y tolerancia temporal; no borrar repeticiones legítimas de hablantes distintos.
- Actualizar parciales por identidad estable; no insertar una fila nueva por cada revisión del mismo fragmento.
- Nunca esperar a que termine una fuente para mostrar la otra.

### 3.4 Presentación y fidelidad clínica

- Una sola vista de diálogo, cronológica, compacta y legible.
- Diferenciar visualmente `INTÉRPRETE` y `AUDIO REMOTO`; no mezclar ambos textos en un mismo segmento.
- Puntuación y capitalización conservadoras. Corregir presentación solo cuando no altere el contenido pronunciado.
- Mantener texto bruto y texto presentado por separado cuando exista una normalización.
- No resumir, traducir, completar, parafrasear ni “mejorar” dosis, nombres, cifras, síntomas o indicaciones clínicas.
- Mostrar incertidumbre cuando falte audio, haya solapamiento, baja confianza o atribución no verificada.
- La vista debe seguir siendo fluida bajo llamadas largas y fragmentación; scroll y render no deben bloquear la captura ni la carga a Groq.

### 3.5 Privacidad y ciclo de vida

- Captura explícita, visible y controlable por el operador, solo dentro de llamada activa reconocida.
- Comprobaciones de llamada, fuente, permiso, configuración y credencial antes de solicitar micrófono o compartir audio.
- Confirmación de ZDR como compuerta conservadora del producto; no afirmar que la preferencia de UI prueba por sí sola la configuración real de Groq.
- No enviar audio si no se cumple la compuerta de privacidad.
- No persistir audio ni transcripción clínica en telemetría, exportaciones, base de datos general o logs. Mantener el material de sesión en memoria/almacenamiento de sesión conforme a la política aprobada.
- Detener ambas capturas y liberar tracks al finalizar la llamada, salir de la ruta, pagehide, revocar permiso, perder una fuente, deshabilitar el canal o fallar el pipeline. Una falla de una pista no debe ocultarse como sesión completa.

---

## 4. Tareas provisionales — estado verificable

| ID | Tarea | Estado |
|---|---|---|
| P-01 | Confirmar modelo Groq de mayor fidelidad multilingüe disponible | VERIFICADO EN DOCS: `whisper-large-v3` |
| P-02 | Seleccionar Large V3 como modelo de calidad para ambos canales | DECISIÓN PROVISIONAL |
| P-03 | Ejecutar micrófono y salida remota como dos fuentes independientes | PENDIENTE DE IMPLEMENTACIÓN |
| P-04 | Capturar y empaquetar ventanas autónomas, decodificables y continuas | PENDIENTE DE DISEÑO/PRUEBA |
| P-05 | Ejecutar dos colas Groq concurrentes con backpressure y recuperación | PENDIENTE DE IMPLEMENTACIÓN |
| P-06 | Fusionar segmentos con reloj común, identidad estable y solapamientos | PENDIENTE DE IMPLEMENTACIÓN |
| P-07 | Renderizar un diálogo único con INTÉRPRETE y audio remoto | PENDIENTE DE IMPLEMENTACIÓN |
| P-08 | Determinar si Cloud Interpreter expone pistas o IDs de los participantes remotos | PENDIENTE DE INSPECCIÓN ESTÁTICA |
| P-09 | Evitar atribución LEP/proveedor no respaldada por evidencia | REQUISITO DE SEGURIDAD |
| P-10 | Construir pruebas unitarias/headless de captura, WebM/WAV, orden, ventanas, fallos y UI | PENDIENTE |
| P-11 | Añadir corpus bilingüe autorizado y medir WER/CER, latencia, deriva temporal y pérdida | PENDIENTE |
| P-12 | Ejecutar CI GitHub completa en la cabeza exacta que contiene la implementación final | PENDIENTE |
| P-13 | Aceptación acústica/funcional del operador en entorno controlado | PENDIENTE · NO AUTORIZADA EN G14 ACTUAL |

---

## 5. Criterios de aceptación

No marcar la tarea como terminada hasta demostrar, con evidencia reproducible:

1. Las dos fuentes se capturan simultáneamente y producen texto en la misma sesión.
2. El micrófono propio aparece como `INTÉRPRETE` sin usar identificación biométrica.
3. La salida remota aparece en el mismo diálogo, y sus speakers solo se etiquetan cuando exista una fuente de identidad verificable.
4. Las peticiones Groq de ambas fuentes progresan concurrentemente y el retraso de presentación se mide desde el instante de captura.
5. No hay huecos, duplicados artificiales ni reordenamiento a través de límites de chunk; los solapamientos reales se conservan.
6. El render no bloquea captura ni transcripción.
7. Los errores, límites de API y pérdida de fuente quedan visibles; no se declara completitud si una pista falló.
8. CI pasa para la revisión exacta; las pruebas headless comprueban que todos los fragmentos son decodificables.
9. WER/CER, latencia p50/p95, pérdida de segmentos, tasa de duplicados y error de atribución se reportan con corpus autorizado.
10. Las protecciones de micrófono saliente, Connect y ciclo de llamada siguen pasando.

---

## 6. Fuentes técnicas consultadas

- Groq Speech to Text: https://console.groq.com/docs/speech-to-text
- Groq API Reference: https://console.groq.com/docs/api-reference
- Groq Rate Limits: https://console.groq.com/docs/rate-limits
- Groq Service Tiers: https://console.groq.com/docs/service-tiers
- KHORA — captura de diálogo: https://github.com/SeryMente/khora/blob/main/khora-web/lib/dialogo/capturar.ts
- KHORA — transcripción de pistas: https://github.com/SeryMente/khora/blob/main/khora-web/lib/dialogo/transcribir.ts
- KHORA — contrato de diálogo: https://github.com/SeryMente/khora/blob/main/khora-web/lib/dialogo/contrato.ts

## 7. Registro de cambios y límites

### Corte de implementación sintética · 2026-11-10 · cabeza CI 317242c

- **Código integrado en candidata:** captura dual de pestaña/micrófono, AudioWorklet WAV mono 16 kHz, colas independientes y concurrentes, cliente Groq Large V3, fusión cronológica, overlay único, etiquetas por procedencia, ZDR gate, parada/limpieza y cancelación. No integrado en `main`.
- **Rama/PR:** `candidate/whisper-interpreter-live-20261110`; PR #83 abierta, draft/no merge. Cabeza `317242c4809aa5434803d25c28a134a84894a284`.
- **CI de esa cabeza:** Package integrity SUCCESS (`42926141243`); signal-observability-audit SUCCESS (`42926141253`); native-caption-host-build SUCCESS (`42926141415`). Package integrity informa 66/66 hashes y ocho suites de gate aprobadas; tests dual capture, policy revocation, WAV/flush, merger/overlap/queue concurrency y Groq transcriber mock PASS.
- **Qué queda demostrado:** código, contratos, fusión, buffers WAV sintéticos, concurrencia y limpieza ante API/boundaries simuladas. No demuestra permisos reales de Chrome, calidad acústica real, recepción de audio tab, micrófono físico ni funcionamiento del endpoint con la cuenta del operador.
- **Pendiente:** audio real, llamadas reales, API/key real, verificación de ZDR en consola, WER/CER, latencia p50/p95, pérdida/duplicado real, coste/cuotas efectivas, aceptación del operador. No se declara diarización.
- Las instrucciones literales A-01, A-02, A-03 y A-04 son fuentes de verdad; la interpretación técnica no las reemplaza.
- No se autoriza por este documento realizar llamadas reales, capturar audio real, acceder a credenciales, recargar Chrome, fusionar a `main`, desplegar o liberar. La aceptación y la liberación siguen reservadas al operador.


---

## 8. Reconciliación de contexto recuperado y estado verificable · G14 · 2026-11-10

**Procedencia:** conversación recuperada y pegada literalmente por el operador el 2026-11-10, preservada en originales/CHATGPT-SI-RECUPERADO-GROQ-20261110.txt. Este registro conserva mensajes del operador y salidas del asistente. Las salidas del asistente se tratan como afirmaciones históricas/reportadas hasta que una fuente independiente las confirma; no se convierten por repetición en evidencia ejecutada. No se afirma que el archivo sea una exportación nativa de ChatGPT.

### 8.1 Estado canónico y rama de trabajo

- main/manifest.json leído en este ciclo: 0.10.47, blob ee0df8e5a3b822c14a30e61da98dc2fddd3ba8de.
- main contiene la línea de producto y OCP anteriores. Este plan, sus decisiones Groq y el código dual no estaban publicados en main al comenzar esta reconciliación.
- PR #83 · Whisper interpreter: abierta, draft=true, sin merge; rama candidate/whisper-interpreter-live-20261110; HEAD 4737823873f826f80346cd817b877c6664769f20; última actualización observada 2026-11-10T23:58:56Z (17:58:56, America/Mexico_City); 115 commits, 39 archivos cambiados, +2,489/-145.
- Comparación con main observada: candidata 115 commits por delante y 783 por detrás; estado diverged. No fusionar la rama completa por conveniencia. Revisar y portar deltas selectivos tras reconciliar historia y diffs.
- El reporte histórico que menciona CI 3/3 SUCCESS corresponde a una cabeza anterior reportada; no acredita el estado del HEAD actual.

### 8.2 Implementación hallada por inspección estática del HEAD de PR #83

Se inspeccionaron los archivos de la rama indicada; esto acredita presencia y conexión estática de componentes, no ejecución en Chrome ni captura real:

| Componente | Hallazgo en candidata | Alcance de la evidencia |
|---|---|---|
| extension/groq-dialogue-capture.js | Control visible en ruta de llamada; solicita audio de la pestaña por gesto del operador y micrófono propio por separado; usa dos lanes AudioWorklet y despacha WAV separados | Código inspeccionado; no se solicitó permiso ni se capturó audio real |
| extension/whisper-window-processor.js | Generación WAV mono PCM16 a 16 kHz, ventanas autónomas, solapamiento y flush final | Código y prueba sintética presentes; ejecución física no comprobada |
| extension/groq-transcriber.js | Endpoint Groq /openai/v1/audio/transcriptions, modelo whisper-large-v3, verbose_json, temperatura 0, timestamps por segmento, abort y compuerta ZDR | Código inspeccionado; no se usó credencial ni endpoint real |
| extension/background.js | Handlers para policy preflight, inicio, chunk y parada; exige ruta/perfil/tab de llamada activa, switch Groq, declaración ZDR y credencial local; valida WAV/sequence/offset y mantiene colas independientes por fuente con backpressure | Conexión estática comprobada; no se ejecutó el runtime |
| extension/dialogue-engine.js | IDs estables por captura/fuente/secuencia; orden temporal; reconciliación de repetición entre ventanas adyacentes de la misma fuente; conserva solapamientos entre fuentes | Código y pruebas presentes; no probado con audio real |
| extension/live-caption-overlay.js | Recibe SIGNAL_GROQ_DIALOGUE_RESET, ...SEGMENTS y ...STOP; inserta filas en una sola vista y ordena por tiempo | Handler inspeccionado; visualización real no verificada |
| extension/live-caption-core.js | roleForSource("groq-interpreter") devuelve INTÉRPRETE; groq-remote devuelve AUDIO REMOTO · NO VERIFICADO | Mapeo estático confirmado; no valida diarización remota |
| extension/ui/popup.html / popup.js | Interruptor de diálogo dual y checkbox ZDR; ambos apagados por defecto; el checkbox declara expresamente que es una declaración operativa, no prueba de consola | Código inspeccionado; no se cambió preferencia local |

**Corrección de una hipótesis anterior:** en esta cabeza sí existen los manejadores del service worker para los mensajes nuevos y el overlay sí recibe los segmentos Groq. El reporte anterior que afirmaba que todavía no existían esos handlers no describe el HEAD actual. La integración está presente en código, pero no está acreditada como funcional por ejecución ni por CI verde.

**Diferencia de camino antiguo/nuevo:** background.js todavía contiene funciones históricas startGroqCapture() y handleGroqAudioChunk() que responden native-text-only; el flujo nuevo utiliza los mensajes SIGNAL_GROQ_DIALOGUE_*. Debe revisarse que no quede una entrada UI/hotkey que invoque accidentalmente el camino antiguo y que no se presenten ambos caminos como una única ruta verificada.

### 8.3 CI de la cabeza exacta actual

Los tres workflows consultados para HEAD 4737823873f826f80346cd817b877c6664769f20 terminaron en failure:

| Workflow | Run | Resultado y causa observada |
|---|---:|---|
| Package integrity | 42927711704 (#311) | Falla la verificación de inventario/invariantes: varias entradas SHA-256 no coinciden con los archivos de la rama; el test de Whisper queda omitido tras el fallo |
| signal-observability-audit | 42927711800 (#13584) | Falla Global overlay toggle and hotload lifecycle regression; las suites posteriores, incluidas varias de captions/Groq, quedan omitidas |
| native-caption-host-build | 42927712133 (#11236) | La preparación/instalación del archivo fuente falla con Payload SHA-256 mismatch: extension/background.js; compilación/protocolo quedan omitidos |

No se deben reutilizar como estado actual los tres SUCCESS de una cabeza anterior. No se repitió CI en esta reconciliación ni se modificaron hashes/código.

### 8.4 Estados reconciliados de P-01 a P-13

| ID | Estado reconciliado |
|---|---|
| P-01 | VERIFICADO EN DOCUMENTACIÓN: Groq publica whisper-large-v3 y lo recomienda para usos multilingües sensibles a errores. |
| P-02 | DECISIÓN OPERATIVA REGISTRADA: Large V3 es el default de ambos canales; Turbo no es fallback silencioso. No equivale a benchmark propio. |
| P-03 | IMPLEMENTADO EN CANDIDATA · NO EJECUTADO EN ENTORNO REAL: captura separada de audio remoto y micrófono propio con acción visible. |
| P-04 | IMPLEMENTADO EN CANDIDATA · PRUEBA SINTÉTICA DISPONIBLE: WAV autónomo mono 16 kHz, secuencia, offset, solapamiento y flush; no se comprobó decodificación de audio físico. |
| P-05 | IMPLEMENTADO EN CANDIDATA · NO VALIDADO POR CI ACTUAL: lanes concurrentes por fuente, backpressure, cancelación y reintento. |
| P-06 | IMPLEMENTADO EN CANDIDATA · PRUEBAS PRESENTES: fusión cronológica e IDs estables; solapamientos reales entre fuentes se conservan. Sin evaluación acústica real. |
| P-07 | CONECTADO ESTÁTICAMENTE A OVERLAY · NO ACEPTADO EN CHROME: handler de segmentos y mapeo de INTÉRPRETE/remoto no verificado existen. |
| P-08 | NO RESUELTO: no se acreditó metadata/pista separada de participantes remotos; no inferir LEP/proveedor. |
| P-09 | REQUISITO DE SEGURIDAD: atribución únicamente por procedencia verificable; no por idioma, acento, género ni contenido. |
| P-10 | PRUEBAS SINTÉTICAS EXISTEN; CI ACTUAL BLOQUEADA: hay archivos de test para captura dual, WAV/flush/overlap, motor/fusión y transcriptor. No se da por ejecutada una suite que CI omitió. |
| P-11 | PENDIENTE: corpus bilingüe autorizado, WER/CER, latencia p50/p95, deriva, pérdida/duplicación, cuotas/coste y calidad por fuente. |
| P-12 | FALLIDA EN HEAD ACTUAL: deben corregirse inventario SHA-256, regresión overlay/hotload y fallo de verificación de instalación; después ejecutar las suites en el HEAD exacto. |
| P-13 | PENDIENTE · RESERVADA AL OPERADOR: credencial/ZDR en el entorno destinado, permisos reales, llamada controlada, evaluación funcional y aceptación. |

### 8.5 Orden ejecutivo vigente

1. Corregir de manera reproducible los hashes divergentes del inventario y de las invariantes de paquete; read-back de cada hash antes de reintentar CI.
2. Diagnosticar y corregir Global overlay toggle and hotload lifecycle regression sin debilitar guards de presencia, MIC, Connect, llamada activa ni privacidad.
3. Corregir la verificación de instalación/raíz de archivo que falla por SHA de extension/background.js; volver a ejecutar los tres workflows sobre el mismo HEAD.
4. Ejecutar directamente las pruebas nuevas de captura dual, WAV, transcriptor y motor, y demostrar concurrencia entre fuentes, orden, offsets, solapamientos, backpressure, cancelación y liberación de tracks.
5. Verificar consistencia entre el flujo nuevo SIGNAL_GROQ_DIALOGUE_* y los manejadores legacy startGroqCapture/handleGroqAudioChunk.
6. Revisar el overlay en entorno de prueba para confirmar texto visible, etiqueta INTÉRPRETE, fuente remota neutral, orden y actualización de parciales.
7. Medir cuotas y coste con ventanas/solapamiento candidatos. La ventana de 6–6.5 s es parámetro candidato, no óptimo ratificado; no optimizar latencia ignorando el mínimo de facturación por petición documentado por Groq.
8. Preparar corpus bilingüe no clínico o expresamente autorizado para WER/CER y medidas p50/p95, pérdida, duplicación y deriva.
9. Mantener apagados los controles de producción por defecto. La casilla local ZDR solo declara una comprobación hecha por el operador; no sustituye la verificación de la consola de Groq.
10. Solo tras CI verde, pruebas sintéticas completas y revisión selectiva de diff, solicitar al operador la aceptación manual en Windows/Chrome. No hacer llamadas, capturar audio real, solicitar/usar credenciales, recargar Chrome, fusionar, desplegar ni liberar desde este ciclo.

### 8.6 Decisiones supersedidas y límites preservados

- Las exclusiones anteriores de captura de audio de pestaña/Groq quedan supersedidas para diseño y construcción de esta función por las instrucciones directas A-01/A-02 y la decisión SI-OP-03; las citas históricas no se reescriben.
- La captura debe seguir siendo explícita, visible, voluntaria y limitada a llamada reconocida como activa. No se habilita escucha oculta, espera, timbrado, prellamada ni captura sin permiso.
- No persistir audio crudo ni texto clínico en telemetría, exportes diagnósticos, repositorio público o bases generales.
- No acceder a claves ni habilitar preferencias reales en este ciclo. groqDialogueEnabled y groqZeroDataRetentionConfirmed permanecen false por defecto en la candidata.
- No utilizar speaker diarization/biometría ni asignar LEP/proveedor sin metadatos verificados.
- No merge de PR #83: 115 commits adelante y 783 detrás respecto de main; revisión selectiva obligatoria.
- Esta reconciliación no certifica ejecución de tests locales, permisos de Chrome, endpoint real, cuenta Groq, ZDR efectivo, instalación, llamada, calidad ASR ni aceptación del operador.


## 9. Reconciliación de integración selectiva · G14 · 2026-11-11

### 9.1 Estado de implementación

- La corrección literal A-01 ya está aplicada y cotejada contra la conversación recuperada: `Calidad maxima. Reportame en 10 minutos.`.
- PR #83 se cerró sin merge. Su historia divergente no se integra.
- PR #84 [dual-source Groq Whisper](https://github.com/SeryMente/signal-interpreter/pull/84) contiene el port selectivo sobre el main vigente. Sigue draft y sin merge.
- HEAD documentado: `03fc895dbe682be3bd9f944ee68951a4e815bc16`; CI 3/3 SUCCESS (Package integrity, observability audit y native caption host build).

### 9.2 Trabajo completado y verificado

1. Reconciliación de nueve SHA-256 divergentes del inventario y lectura de vuelta.
2. Corrección de dos fixtures mal escapados (Unicode zero-width y separadores de párrafo).
3. Validación de superficie de captura fail-closed: solo acepta `displaySurface === "browser"`; ausencia de metadata y window/monitor rechazan antes de pedir el micrófono.
4. Port selectivo de manifiestos, captura dual, worklet WAV, transcriptor, motor temporal, overlay, guards y pruebas a una rama nueva basada en main.
5. 66/66 hashes, ocho suites del verificador, 43 pruebas de observabilidad/regresión/layout, cuatro suites Groq dual, parser PowerShell 5.1, identidad de extensión y archivo de distribución: PASS.
6. CI 3/3 SUCCESS en el HEAD indicado.

### 9.3 Compuertas aún pendientes

- La carga de extensión en Chrome no se pudo completar en el entorno temporal porque la política organizacional bloquea Developer Mode / Load unpacked. El perfil temporal fue eliminado y el perfil habitual no se tocó.
- No se encontró clave Groq en el entorno de prueba conectado; no hubo llamadas API ni audio real.
- ZDR y límites efectivos de la cuenta siguen sin verificar. Las páginas públicas de Groq consultadas muestran límites discrepantes; la cuenta es la fuente definitiva.
- Con 6.5 s / 500 ms y paso de 6 s, dos canales podrían generar 20 RPM y 7,800 segundos de audio enviados por hora. El mínimo de facturación de 10 s puede elevar el coste teórico a aproximadamente USD 0.37 por hora de llamada simultánea. No declarar ese tamaño óptimo ni habilitar producción antes de medir cuotas/coste.
- WER/CER, latencia p50/p95, deriva, pérdidas/duplicados y calidad por fuente no han sido medidos con audio autorizado.
- No merge, activación, deploy, release ni aceptación funcional en nombre del operador.

La secuencia de aceptación es: verificar ZDR/cuotas en la cuenta, instalar una clave local ignorada por Git, ejecutar corpus bilingüe sintético no clínico contra Groq, cargar la extensión en un Chrome autorizado, validar una llamada controlada y obtener aceptación expresa.


---

## 10. Tareas provisionales y checkpoint de continuidad G14 · 2026-11-11 UTC

El registro ejecutable y priorizado se conserva en [TAREAS-PROVISIONALES-GROQ-DUAL-G14.md](TAREAS-PROVISIONALES-GROQ-DUAL-G14.md); la crónica de evidencia/entorno en [C-SIGNAL-RETOMA-20261111-G14-CURRENT.md](cronica/C-SIGNAL-RETOMA-20261111-G14-CURRENT.md). La nueva instrucción literal del operador está en [CHATGPT-SI-AUTORIZACIONES-RETOMA-20261110-G14.txt](originales/CHATGPT-SI-AUTORIZACIONES-RETOMA-20261110-G14.txt). No reproducir o resumir esos originales como si fueran la fuente literal; leerlos directamente.

### 10.1 Estado reconciliado más reciente

- PR #84 abierta/draft/no merge; rama `feat/groq-dual-main-20261111`; HEAD probado `1c7aca92cc89337aeb4c9907426847f941fa35bd`.
- CI en ese HEAD: Package integrity `42941191180`, signal-observability-audit `42941191052`, native-caption-host-build `42941191195` = 3/3 SUCCESS.
- Auditoría paralela: 56 syntax checks, 16 guard suites, 14 observability suites, 13 caption suites y job aggregate; 99 comandos originales preservados.
- Fila 4: dos checkouts independientes; 43 suites PASS, 56 syntax checks PASS, 66/66 hashes PASS y 8 critical audio/Connect/presence suites PASS. Checkout secundario de prueba eliminado. Sin agente Hiku accesible ni Claude Code autenticado; G14 permanece único responsable.
- Chrome: el navegador gestionado bloqueó Developer Mode / Load unpacked; perfil temporal eliminado; perfil habitual intacto.
- Groq: sin clave local/variables de entorno; no API calls ni audio real; ZDR y cuotas de cuenta no comprobados. Flags false por defecto.
- No WER/CER, latencia p50/p95, jitter, drift, pérdidas/duplicados, coste/ASH real ni aceptación acústica. No merge, deploy ni release.

### 10.2 Orden de ejecución siguiente

1. Releer Metodología DUG/§ARR, OCP y control G14. Confirmar el HEAD actual de PR #84 y CI; no asumir que sigue en `1c7aca92...`.
2. Resolver el entorno Chrome autorizado sin eludir políticas corporativas. Si sigue bloqueado, dejar evidencia del bloqueo y avanzar solo en pruebas headless/sintéticas.
3. Verificar ZDR y cuotas efectivas de la cuenta Groq; registrar solo estado no sensible.
4. Preparar credencial local ignorada por Git después de ZDR; jamás introducirla en chat, logs o repositorio.
5. Correr smoke tests Groq con corpus sintético no clínico y medir WER/CER, p50/p95, drift, pérdida, duplicación y coste/ASH.
6. Validar captura dual, revocación, parada/liberación, roles, fusión temporal y overlay en Chrome autorizado.
7. Fijar umbrales de calidad y pedir aceptación explícita del operador antes de merge/release.

### 10.3 Política de aceleración

Conservar el paralelismo CI actual y la cancelación de ejecuciones obsoletas. No recortar suites. Una sesión secundaria puede repetir pruebas o revisar de forma independiente, pero no crea otra titularidad ni escribe sobre el checkout principal. Toda escritura en la rama de integración tiene un único escritor y revisión del diff; todo PASS debe corresponder al mismo SHA exacto.
