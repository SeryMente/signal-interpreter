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

Calidad maxima. No me conformare con menos
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

- Esta especificación es provisional y debe actualizarse al implementar y medir.
- Las instrucciones literales A-01 y A-02 son fuentes de verdad; la interpretación técnica no las reemplaza.
- No se declara que el canal esté integrado en runtime, que capture audio real, que exista diarización ni que el operador haya aceptado la función.
- No se autoriza por este documento realizar llamadas reales, capturar audio real, acceder a credenciales, recargar Chrome, fusionar a `main`, desplegar o liberar.
