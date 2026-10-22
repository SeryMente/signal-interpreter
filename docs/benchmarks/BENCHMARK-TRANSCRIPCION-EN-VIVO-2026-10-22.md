# Benchmark de transcripción en vivo — Signal Interpreter

**Estado:** protocolo de evaluación; no contiene resultados medidos.  
**Rama:** `feat/benchmark-live-transcription-20261022`  
**Fecha:** 2026-10-22

## Objetivo

Determinar con mediciones reproducibles si Live Caption mejora la cobertura y la latencia de la transcripción de una llamada de interpretación consecutiva, o si añade duplicados, texto erróneo, distracción o carga de procesamiento. El objetivo primario es fidelidad literal útil para interpretar, no fluidez editorial.

## Regla de evidencia

No se aceptan cifras simuladas, fixtures como evidencia de calidad acústica, resultados inventados ni latencias inferidas. Las pruebas con mocks verifican contratos de software, pero no rendimiento ASR. Toda métrica de calidad publicada debe provenir de audio real, una referencia humana verificada contra el audio y registros de ejecución con marcas de tiempo. Si falta cualquiera de esos elementos, la métrica se marca **NO MEDIDA**.

## Sistemas comparados

A. Live Caption de Chrome solo (línea base actual).  
B. Groq Whisper `whisper-large-v3` por ventanas de audio válidas solapadas.  
C. Groq Whisper `whisper-large-v3-turbo` bajo exactamente el mismo corpus y política de ventanas (control de costo/latencia).  
D. Híbrido: Live Caption provisional + Whisper large-v3 autoritativo/conciliado.  
E. Ablación sin Live Caption dentro del híbrido, para medir si Live Caption ayuda o estorba.

No se considerará que una ruta existe hasta comprobar captura, transmisión, respuesta del proveedor, conciliación y visualización en la extensión cargada en Chrome.

## Diseño de prueba

- Usar audios reales autorizados y representativos de interpretación consecutiva inglés-español, incluidos turnos largos, nombres propios, cifras, direcciones, negaciones, correcciones, pausas y solapamiento.
- Preparar transcripción de referencia humana, literal y revisada contra el audio. No corregir gramática, no borrar repeticiones ni traducir.
- Mantener el mismo corpus, idioma, códec, ventana, solapamiento, red y máquina al comparar condiciones.
- Ejecutar cada condición al menos 3 veces por archivo para medir variabilidad; añadir más repeticiones si los intervalos siguen siendo inestables.
- Separar desarrollo/calibración de evaluación final. No ajustar prompts o parámetros sobre el conjunto final.
- Registrar identificadores pseudónimos de archivo y hashes, no datos identificables de pacientes en logs o repositorio público.
- Obtener consentimiento y definir retención antes de enviar audio clínico a un proveedor externo.

## Métricas obligatorias

1. **WER** = (sustituciones + eliminaciones + inserciones) / palabras de referencia. Publicar WER global y por idioma/turno; documentar normalización de puntuación, números y contracciones.
2. **CER** como complemento para nombres, números y términos cortos.
3. **Cobertura literal** = palabras de referencia recuperadas / palabras de referencia.
4. **Omisiones críticas**: conteo separado de negaciones, dosis/unidades, nombres, números, direcciones y correcciones omitidas o alteradas; revisión humana de cada caso.
5. **Latencia de primera palabra**: desde el tiempo acústico de la palabra en la grabación hasta su primera aparición visible; reportar mediana, p90 y p95.
6. **Latencia de estabilización**: tiempo desde la palabra acústica hasta que el texto deja de cambiar durante al menos 1 segundo.
7. **Retractaciones**: palabras visibles que después se eliminan o sustituyen.
8. **Duplicación**: palabras o frases repetidas en el texto final frente a la referencia.
9. **Carga de solicitudes**: solicitudes/minuto, duración de audio por solicitud, errores, reintentos, fragmentos perdidos y cola máxima.
10. **Costo real estimado**: solicitudes y duración facturada de la ejecución, con tarifa vigente; separar estimación del proveedor y cargos observados.
11. **Utilidad de Live Caption**: diferencia pareada D−E en WER, cobertura, latencia y errores críticos; medir tanto la transcripción final como la disponibilidad temprana de palabras útiles.
12. **Estorbo de Live Caption**: aumento de inserciones/duplicados, palabras retractadas, errores críticos, latencia, CPU/cola o carga visual atribuible al híbrido.

## Cómo decidir si Live Caption ayuda

La comparación primaria es pareada, mismo audio y condiciones:

- Beneficio de calidad: `WER(E) - WER(D)`; positivo significa que el híbrido mejora.
- Beneficio de cobertura: `cobertura(D) - cobertura(E)`; positivo significa mejora.
- Beneficio de latencia: `p50/p90(latencia(E)) - p50/p90(latencia(D))`; positivo significa mejora.
- Penalización de duplicación/retractación: diferencia `D - E`; positivo significa que el híbrido empeora.
- Reportar diferencias absolutas y relativas, cantidad de archivos/palabras, dispersión e intervalos de confianza por bootstrap a nivel de archivo. No tratar cada palabra como una observación independiente.

La decisión no se basará en un único promedio. Live Caption se conserva si aporta disponibilidad temprana medible sin deteriorar de forma material la fidelidad final ni aumentar omisiones críticas. Si solo adelanta texto provisional pero añade retractaciones o errores, se informa ese intercambio con números. Si los resultados no son concluyentes, se declara inconcluso.

## Requisitos de captura

- No usar `latest-only` para trabajos de audio: cada fragmento de audio debe tener una secuencia FIFO y un estado de entrega explícito.
- Validar cada ventana como archivo reproducible antes de llamar a Whisper. No asumir que cada Blob de `MediaRecorder` es reproducible aisladamente.
- Mantener solapamiento para reducir cortes de palabras y conciliar duplicados usando tiempos y contenido.
- Limitar concurrencia con backpressure; jamás descartar silenciosamente audio. Registrar cualquier pérdida como fallo.
- El audio de pestaña puede contener varias voces remotas mezcladas. Fuente de audio no equivale a identidad de hablante; idioma tampoco prueba el rol.
- No cambiar, resumir, traducir ni “mejorar” semánticamente el texto destinado a interpretación. La presentación puede agrupar párrafos, pero debe conservar las palabras y las disfluencias.

## Salida obligatoria de cada ejecución

Un CSV/JSON por solicitud con: run_id, archivo pseudónimo/hash, condición, modelo, configuración de ventana, timestamps de inicio/fin/captura/solicitud/respuesta/render, duración de audio, bytes, idioma solicitado, texto (solo en artefactos locales protegidos), estado/error, reintentos, y tokens/costo cuando el proveedor los reporte. El informe agregado incluye entorno, versiones, commit, corpus, exclusiones, WER/CER, latencias p50/p90/p95, fallos, costo y decisión.

No subir audio, transcripciones clínicas ni claves API a GitHub. No registrar claves ni incluirlas en mensajes de error.

## Estado inicial

- Benchmark acústico real: **NO EJECUTADO**.
- WER/CER reales: **NO MEDIDOS**.
- Latencias reales: **NO MEDIDAS**.
- Beneficio/estorbo de Live Caption: **NO DETERMINADO**.
- Pruebas con mocks existentes: solo contrato de la envoltura Groq; no son benchmark.
- El endpoint documentado de transcripción de Groq es de petición/respuesta por archivo; no debe describirse como streaming nativo sin evidencia adicional.
