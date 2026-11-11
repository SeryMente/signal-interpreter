# Benchmark reproducible de diálogo dual

## Alcance

Este protocolo evalúa la transcripción de las dos fuentes independientes de Signal Interpreter:

- groq-remote: audio remoto de la pestaña compartida.
- groq-interpreter: micrófono propio del intérprete.

No graba audio, no invoca Groq, no modifica ZDR y no carga Chrome. El runner agrega las métricas del evaluador de diálogo sobre múltiples grabaciones, calcula intervalos bootstrap por grabación y aplica un perfil de aceptación fijado antes de consultar el test set.

**Estado de este documento:** protocolo implementado; benchmark acústico real NO EJECUTADO. Los umbrales propuestos abajo son una línea base candidata, no una aceptación ratificada.

## Contrato de privacidad y almacenamiento

1. Usar únicamente material no clínico y expresamente autorizado por sus participantes. No usar llamadas reales ni audio clínico para el primer benchmark.
2. El audio, el manifiesto con las transcripciones y el informe detallado permanecen fuera del repositorio Git y fuera de telemetría.
3. El repositorio conserva únicamente código, este protocolo y tests sintéticos sin valor probatorio acústico.
4. El manifiesto no admite rutas ni archivos de audio. Cada fuente se identifica mediante SHA-256 y metadatos.
5. El verificador exige que la carpeta local de WAV y el manifiesto estén fuera del checkout. Los audios se nombran con el SHA-256 en minúsculas y extensión .wav.
6. La verificación de SHA-256 demuestra identidad de bytes, no consentimiento, anonimización, veracidad de la referencia ni configuración ZDR. Esas condiciones conservan comprobación independiente.
7. No copiar transcripciones, nombres, identificadores de participantes, claves o datos de llamada a stdout, Git, issue trackers o métricas.

## Requisitos del corpus

El test formal debe cumplir simultáneamente:

- Split test, congelado antes de medir, con versión semántica y fecha UTC de congelación.
- Consentimiento confirmado; corpus no clínico.
- Dos pistas de audio separadas, alineadas a un reloj monotónico común. No mezclar las dos fuentes antes de transcribir.
- WAV PCM signed 16-bit, mono, 16 kHz para cada pista. Duraciones de las dos pistas dentro de un segundo.
- Referencia humana por pista y segmentos con tiempos en milisegundos sobre el mismo reloj.
- Dos anotadores independientes como mínimo y adjudicación de todas las discrepancias antes de congelar el gold transcript.
- Identificadores de hablante anónimos y estables solo cuando exista ground truth. No inferir identidad de audio remoto por voz, idioma, acento, género o contenido. Cuando no esté probada, speakerId=null.
- Estratos declarados sin datos personales: languagePair, noise, overlap; se recomiendan también network y chunkProfile.
- criticalTerms debe cubrir negaciones, nombres propios, números, fechas/horas, cantidades/unidades y vocabulario difícil del dominio sin usar información sensible.
- Tanto audio remoto como micrófono del intérprete deben estar presentes como pistas. Para aceptar el diseño concurrente debe haber muestras partial y heavy en overlap; el runner bloquea una evaluación sin pares solapados de referencia.

Objetivo de muestra para aceptación inicial: **60 grabaciones como mínimo**, **20 por cada categoría de cada estrato declarado**, y **10.000 palabras de referencia por fuente**. El tamaño no sustituye diversidad real: cubrir varios hablantes voluntarios, acentos autorizados, ritmos, volúmenes, ruido y cambios de idioma. Una categoría escasamente representada debe mantenerse como pendiente, no desaparecer del promedio.

## Formato de audio e integridad

Por grabación y fuente, el manifiesto lleva únicamente:

- SHA-256 del WAV.
- Duración en ms.
- sampleRate=16000.
- channels=1.
- codec=pcm_s16le.

La carpeta privada contiene el WAV con nombre igual al SHA-256. Verificarla antes de evaluar con:

    node tools/verify-dialogue-media.mjs "D:\SI-private\benchmark\manifest.json" "D:\SI-private\benchmark\audio"

El verificador comprueba ubicación fuera del repositorio, RIFF/WAVE, PCM entero, canal, frecuencia, profundidad, hash y duración (tolerancia de 20 ms). No imprime rutas, nombres de archivo ni hashes. No valida consentimiento ni contenido hablado.

El manifiesto signal-interpreter-dialogue-benchmark/v1 incluye:

- corpus: ID/version/split/frozenAt, consentimiento, no-clínico, almacenamiento separado, reloj común, revisores y adjudicación.
- system: modelo fijado whisper-large-v3, SHA del build, duración de ventana, overlap, concurrencia 2 y base de latencia.
- acceptanceProfile: todos los límites numéricos pre-registrados.
- recordings[]: ID anónimo clip-*, estratos, metadata de ambas pistas y evaluación signal-interpreter-dialogue-evaluation/v1 con referencia e hipótesis.

No se admite apiKey, token, ruta de audio o campo extra en el manifiesto. Las transcripciones sí son necesarias para el cálculo, por eso el manifiesto completo es local/privado y su CLI rechaza rutas dentro del repositorio.

## Perfil candidato de alta calidad

Propuesta para revisar y fijar **antes de ejecutar el test congelado**:

| Criterio | Umbral candidato |
| --- | ---: |
| Grabaciones independientes | ≥ 60 |
| Grabaciones por categoría/estrato | ≥ 20 |
| Palabras gold por fuente | ≥ 10.000 |
| Muestras de latencia por fuente | ≥ 60 |
| WER ponderado, cada fuente | ≤ 10 % |
| Límite superior 95 % bootstrap de macro-WER, cada fuente | ≤ 12 % |
| CER ponderado, cada fuente | ≤ 5 % |
| Recall de términos críticos, cada fuente | 100 % |
| F1 de turnos, cada fuente | ≥ 95 % |
| Recall de pares solapados entre fuentes | ≥ 95 % |
| Inversiones cronológicas en hipótesis | 0 |
| Latencia p95, desde ventana lista hasta texto visible | ≤ 2.500 ms |
| Latencia máxima, misma definición | ≤ 5.000 ms |

El runner aplica los criterios globales y vuelve a aplicarlos en cada categoría languagePair, noise, overlap, network y chunkProfile; un resultado limpio no puede ocultar un estrato deficiente. Los intervalos bootstrap remuestrean grabaciones completas, no palabras ni segmentos, para evitar tratar tokens correlacionados de un mismo clip como observaciones independientes.

Los límites son deliberadamente estrictos y están **propuestos**. No se deben rebajar después de observar el test. Si el corpus no permite estimar un criterio, el resultado será BLOCKED, no PASS.

### Revisión humana complementaria

La métrica WER no captura por completo legibilidad, negaciones ni consecuencias de errores raros. Antes de aceptar:

- Dos revisores, ciegos a la configuración, leen el diálogo completo y puntúan inteligibilidad/continuidad de 1 a 5.
- Revisan expresamente negaciones, cantidades, fechas, nombres, cambios de idioma, pérdidas, duplicados, turnos e interrupciones.
- Todo error crítico se adjudica; ningún error crítico puede quedar sin resolver.
- La fuente remota permanece neutral si no hay metadata que permita asignar participantes.

Este dictamen se conserva fuera de Git y no se sustituye por un promedio automático.

## Secuencia experimental

### 1. Validación y selección

Usar exclusivamente el split validation, nunca el test final:

1. Fijar corpus, gold transcript, hashes, ruido, idiomas, condiciones de overlap y configuración inicial.
2. Baseline: whisper-large-v3, 6.500 ms por ventana, 500 ms overlap, dos colas concurrentes.
3. Ablación de ventana: 4.000 / 6.500 / 8.000 ms, manteniendo 500 ms de overlap.
4. Fijar la mejor ventana y probar overlap de 250 / 500 / 1.000 ms.
5. Medir cada fuente por separado y las dos fuentes concurrentes; registrar WER/CER, términos críticos, turnos, pares solapados, orden y latencia visible. Anotar cuotas/coste facturado directamente desde la consola autorizada, nunca desde estimaciones como si fueran cargos reales.
6. Elegir configuración solo con validation. Congelar código, build SHA, corpus y umbrales.

Los resultados de validation no son aceptación.

### 2. Aceptación final

1. Confirmar ZDR efectivo y cuotas en la cuenta/endpoint que se usará.
2. Confirmar Chrome autorizado y consentimiento para el corpus.
3. Ejecutar una vez la configuración congelada en el test independiente.
4. Verificar archivos y hashes con verify-dialogue-media.mjs.
5. Ejecutar evaluate-dialogue-benchmark.mjs.
6. Completar revisión humana ciega y dictamen de errores críticos.
7. Conservar el informe privado y publicar únicamente los agregados aprobados, sin texto/audio/rutas ni identificadores de participantes.

No realizar ninguna llamada Groq con audio mientras ZDR, cuotas o credencial local no estén verificados.

## Ejecución del evaluador

    node tools/dialogue-quality-benchmark-tests.mjs
    node tools/dialogue-media-verification-tests.mjs
    node tools/evaluate-dialogue-benchmark.mjs "D:\SI-private\benchmark\manifest.json"

Códigos de salida del runner:

- 0: todos los criterios cuantitativos configurados PASS.
- 3: FAIL cuantitativo o BLOCKED por muestra/datos insuficientes.
- 1: manifiesto inválido o error de ejecución.
- 2: uso incorrecto de CLI.

La salida contiene métricas, intervalos y el estado de cada criterio; nunca imprime los textos de referencia/hipótesis, rutas de audio, nombres de archivos, hashes de audio o identificadores de clips.

## Límites actuales

- El harness y el validador de media tienen tests sintéticos en CI; eso no equivale a un benchmark acústico.
- No existe todavía un corpus de audio autorizado ni gold transcript adjudicado.
- La ruta actual del producto no aporta aún un valor de latencia de ventana-lista a texto-visible al esquema del evaluador. No usar la latencia HTTP de Groq como sustituto. La instrumentación de ese evento queda pendiente antes de medir el criterio de latencia.
- No se ha transmitido audio a Groq ni se ha hecho captura real.
