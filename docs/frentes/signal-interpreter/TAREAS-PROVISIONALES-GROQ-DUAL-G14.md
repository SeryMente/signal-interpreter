# Signal Interpreter · tareas provisionales de Groq dual · G14

**Clase:** registro operativo subordinado al OCP; no crea un segundo estado canónico.  
**Estado:** ACTIVO · PROVISIONAL · pendiente de aceptación acústica y funcional del operador.  
**Titularidad:** G14 · agente único.  
**Última cabeza de código validada:** 1c7aca92cc89337aeb4c9907426847f941fa35bd.  
**PR:** [#84 · dual-source Groq Whisper](https://github.com/SeryMente/signal-interpreter/pull/84), abierta, draft, no fusionada.  
**Fuente literal:** [conversación Groq recuperada](originales/CHATGPT-SI-RECUPERADO-GROQ-20261110.txt) y [autorizaciones de continuidad G14](originales/CHATGPT-SI-AUTORIZACIONES-RETOMA-20261110-G14.txt).  
**Exportación de continuidad adicional (2026-11-11):** [recibo de custodia](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261111-0913.json). El TXT completo `ChatGPT-SI-20261111-0913.txt` está en `originales/` del checkout de Fila 4, SHA-256 `1564338E578D32EA685831521627FE58BC0DA8B3DC59920225939D02ED73E955`, excluido de Git y no publicado. La última salida visible literal del modelo anterior se conserva en la crónica G14 §11.2. La ventana de 40 minutos citada en A-03 es un antecedente fechado el 10/11, no una restricción temporal vigente.

**Plan técnico:** [instrucciones verbatim y plan provisional](INSTRUCCIONES-Y-PLAN-PROVISIONAL-GROQ-DIALOGO-20261110.md).  
**Checkpoint más reciente:** [retoma G14 · 2026-11-11](cronica/C-SIGNAL-RETOMA-20261111-G14-CURRENT.md).

---

## 1. Contrato de continuidad y autoridad

Este documento enumera trabajo pendiente y evidencia de avance. No sustituye el OCP, no introduce reglas de producto nuevas y no convierte una propuesta en aprobación. Ante divergencia, prevalecen las políticas obligatorias de plataforma, las autorizaciones explícitas vigentes, el DUG/Metacanon, el OCP/control de Signal Interpreter y las instrucciones literales del operador. El repositorio público no debe contener claves, audio crudo, transcripciones clínicas ni datos privados de llamadas.

El objetivo funcional permanece definido por los originales: **un solo diálogo cronológico**, alimentado por dos fuentes independientes y concurrentes: (1) audio remoto de la pestaña seleccionada y (2) micrófono propio del intérprete. Cada fuente se transcribe separadamente con Groq Whisper; solo después se fusionan sus segmentos mediante un tiempo común, identificadores estables y reconciliación de solapamientos. La fuente propia se etiqueta INTÉRPRETE; la remota se mantiene como AUDIO REMOTO · HABLANTE NO VERIFICADO salvo metadata verificable de participante/pista. No inferir LEP/proveedor por voz, idioma, acento, género o contenido.

La autorización amplia del operador cubre trabajo técnico, pruebas sintéticas, actualización de ramas/PR, CI y persistencia documental. No sustituye las comprobaciones que requieren un Chrome autorizado, la consola Groq, ZDR efectivo, una credencial local o aceptación del operador. No se afirma que esas acciones hayan ocurrido.

## 2. Estado verificado al checkpoint

### Implementación y PR

- PR #83 fue cerrada sin merge; no se incorporó su historia divergente.
- PR #84 se creó mediante port selectivo desde main y permanece **OPEN / DRAFT / NOT MERGED**.
- Rama: feat/groq-dual-main-20261111.
- HEAD validado: 1c7aca92cc89337aeb4c9907426847f941fa35bd.
- Diff del PR: 33 archivos de producto, pruebas, manifiestos, empaquetado y workflows; no incluye observations/.
- Versión declarada de la extensión: 0.10.47.
- La captura exige displaySurface === "browser"; metadata ausente, ventana o monitor se rechazan antes de solicitar el micrófono.
- Los switches groqDialogueEnabled y groqZeroDataRetentionConfirmed quedan false por defecto.
- El archivo local extension/groq-secret.local.js no existe en el entorno verificado; no se encontraron GROQ_API_KEY, SIGNAL_GROQ_API_KEY ni __SIGNAL_GROQ_TOKEN.

### CI de GitHub sobre la cabeza exacta

Los tres workflows terminaron SUCCESS en el mismo HEAD 1c7aca92cc89337aeb4c9907426847f941fa35bd:

| Workflow | Run | Resultado |
|---|---:|---|
| Package integrity | 42941191180 | SUCCESS |
| signal-observability-audit | 42941191052 | SUCCESS |
| native-caption-host-build | 42941191195 | SUCCESS |

La auditoría se dividió en cuatro jobs independientes y un agregador obligatorio:

| Job | Comandos preservados | Resultado |
|---|---:|---|
| syntax | 56 comprobaciones node --check | SUCCESS |
| guards | 16 suites | SUCCESS |
| observability | 14 suites | SUCCESS |
| captions | 13 suites | SUCCESS |
| audit | exige éxito de los cuatro jobs | SUCCESS |

Se conservaron los 99 comandos originales: cambió su paralelización, no se redujo la batería. Los workflows usan concurrency por workflow/rama con cancel-in-progress; las ejecuciones obsoletas duplicadas se cancelan al llegar una cabeza nueva. Los jobs completos de la cabeza vigente conservan sus controles.

### Validación local independiente en Fila 4

Dos superficies de trabajo separadas se emplearon para pruebas independientes; no se crearon dos agentes ni dos titulares. El checkout de pruebas se limitó a lectura/pruebas y fue eliminado tras el read-back; se omiten identidades y rutas.

Resultados observados:

- 43/43 suites de regresión, observabilidad y layout PASS: 42 en el barrido inicial y una suite adicional observability-package-audit.mjs observations ejecutada por separado.
- 56/56 comprobaciones de sintaxis JavaScript PASS.
- tools/verify-release-package.mjs: 66/66 hashes PASS; manifiesto/identidad y hash del host nativo verificados; ocho suites de seguridad/audio/Connect/presencia PASS.
- Parser YAML del workflow: PASS; cuatro jobs paralelos y agregador verificados; 99 comandos identificados con conteos 56/16/14/13.
- Parser Windows PowerShell 5.1 e identidad de extensión: PASS.
- Archivo de distribución: manifiestos de raíz y subcarpeta presentes; directorio de observabilidad excluido.
- No se cargó la extensión en Chrome. La política organizacional bloqueó Developer Mode / Load unpacked. El perfil Chrome temporal fue eliminado; el perfil habitual no se modificó.
- No se ejecutó una llamada real, no se capturó audio real y no se invocó el endpoint Groq con audio.

## 3. Backlog ejecutable por prioridad

Los estados describen trabajo de desarrollo. VERIFICADO significa que la evidencia descrita fue observada. PENDIENTE significa que aún no se ejecutó o falta una condición externa. Ninguno equivale a aceptación funcional.

### SI-GROQ-01 · mantener PR #84 y CI sobre la cabeza exacta

**Prioridad:** P0 · **Estado:** CI 3/3 VERIFICADA; PR continúa draft.

**Objetivo:** conservar una única línea de integración sin absorber commits históricos o snapshots de observabilidad ajenos al producto.

**Acciones:**
1. Releer PR #84, base, head, lista de archivos modificados y checks después de cada mutación.
2. Mantener observations/ fuera del diff; no rebasar ni fusionar cambios concurrentes sin inspección.
3. Mantener los tres workflows activos; preservar 56 chequeos de sintaxis, 43 pruebas/auditorías y agregador de jobs.
4. No quitar suites para acelerar. Usar caché de dependencias o particionado solo si se demuestra equivalencia del conjunto de comandos.

**Criterio de salida:** último HEAD leído de vuelta; 3/3 workflows SUCCESS para ese mismo SHA; agregador SUCCESS; diff sin observations/; cero cambios no revisados.

**Evidencia existente:** HEAD 1c7aca92...; runs 42941191180, 42941191052 y 42941191195.

### SI-GROQ-02 · habilitar un entorno Chrome autorizado para smoke test

**Prioridad:** P0 · **Estado:** PENDIENTE · **Bloqueo externo observado.**

**Objetivo:** demostrar que la extensión puede cargarse en Chrome con permisos válidos, sin tocar el perfil cotidiano antes de una prueba autorizada.

**Acciones:**
1. Obtener o usar un perfil Chrome en el que el operador tenga permitido Developer Mode / Load unpacked; la política del navegador gestionado usado en el intento anterior bloqueó esa opción.
2. Verificar versión, identidad, ruta de carga y permisos del manifiesto desde la carpeta correcta extension/.
3. Usar perfil temporal aislado, sin cuenta personal ni sincronización, y cargar la subcarpeta extension/; no modificar perfiles existentes ni la política corporativa.
4. Verificar popup, service worker, overlay, visibilidad del control y estado false por defecto.
5. Probar apertura/cierre de llamada simulada o entorno sintético antes de probar permisos de audio.

**Criterio de salida:** extensión cargada en Chrome autorizado, versión/ID comprobados, sin errores de consola relevantes y flags aún desactivados.

**Límite:** si la política vuelve a bloquear la carga, registrar el bloqueo con evidencia y no intentar eludir políticas organizacionales.

### SI-GROQ-03 · comprobar ZDR y límites efectivos de la organización Groq

**Prioridad:** P0 · **Estado:** PENDIENTE · **No verificado en consola.**

**Objetivo:** confirmar requisitos de privacidad y capacidad antes de transmitir audio.

**Acciones:**
1. El operador verifica Zero Data Retention (ZDR) en la consola de la cuenta que vaya a utilizarse.
2. Verificar cuotas efectivas de organización: RPM, ASH/horas de audio, tamaño de archivo, límites de concurrencia, tier y condiciones de retención.
3. Registrar solo estado, fecha, alcance y evidencia no sensible; no guardar tokens, secretos, datos de cuenta ni capturas privadas en el repositorio público.
4. Tratar diferencias entre páginas públicas como discrepancia documental: la consola de la cuenta es la referencia del límite efectivo.

**Criterio de salida:** ZDR efectivo confirmado para el endpoint/modelo/cuenta concretos y cuotas anotadas sin secretos.

**Bloqueo:** no se verificó la consola ni hay credencial en el entorno local. La casilla local no sustituye esta verificación.

### SI-GROQ-04 · preparar credencial local de forma aislada

**Prioridad:** P0 · **Estado:** PENDIENTE · **Sin clave local verificada.**

**Objetivo:** disponer de una credencial funcional sin introducirla en ChatGPT, Git, logs o archivos versionados.

**Acciones:**
1. Solo después de SI-GROQ-03, el operador coloca la clave en extension/groq-secret.local.js dentro del checkout/paquete de prueba autorizado.
2. Verificar que está ignorado por Git y que no aparece en inventario, diff, logs, artefactos ni entorno heredado a otros usuarios.
3. No pedir la clave en el chat, no imprimirla, no pasarla en argumentos visibles de proceso, no incluirla en capturas ni recibos.
4. Hacer una verificación local booleana de presencia, sin revelar valor, y comprobar que los flags siguen false hasta que se autorice la prueba controlada.

**Criterio de salida:** presencia local comprobada sin revelar secreto, git status limpio respecto al secreto e ignore efectivo verificado.

**Bloqueo:** la clave no estaba presente en el entorno de Fila 4; no se intentó una llamada.

### SI-GROQ-05 · smoke test de API con audio sintético no clínico

**Prioridad:** P1 · **Estado:** PENDIENTE · **Depende de SI-GROQ-03 y SI-GROQ-04.**

**Objetivo:** comprobar compatibilidad real del endpoint/modelo/formato y calidad inicial con un corpus controlado no clínico.

**Acciones:**
1. Crear o usar corpus bilingüe ES/EN sintético o expresamente autorizado, sin nombres ni datos sensibles; conservar gold transcript separado.
2. Ejecutar una prueba por canal y luego dos canales concurrentes, con ventanas autónomas, offsets, timestamps, solapamiento y flush final.
3. Medir WER/CER por fuente/idioma y tipo de frase; incluir números, nombres propios, unidades y solapamientos.
4. Medir latencia end-to-end y por etapa (captura, cola, upload, API, parseo, overlay), p50/p95, errores, reintentos, pérdidas, duplicados y drift del timeline.
5. Registrar consumo de ASH/RPM y coste facturado real, sin volcar audio o transcripción al repositorio.

**Criterio de salida:** informe reproducible con corpus ID/huella no sensible, tamaño de muestra, medidas por fuente/idioma, percentiles, fallos y criterios de aceptación acordados antes de medir.

**No hacer:** usar llamadas reales o audio clínico como primera prueba.

### SI-GROQ-06 · validar captura y ciclo de vida de las dos fuentes en Chrome

**Prioridad:** P1 · **Estado:** pruebas sintéticas PASS; runtime Chrome PENDIENTE.

**Objetivo:** comprobar que audio remoto de pestaña y micrófono propio son separados, voluntarios, concurrentes y liberados correctamente.

**Acciones:**
1. Solo con Chrome autorizado, probar gesto visible de inicio en ruta de llamada activa.
2. Confirmar que solo se acepta displaySurface === "browser"; metadata ausente, window/monitor y superficies no-browser fallan antes de pedir el micrófono.
3. Confirmar que cada canal tiene captureId/sourceId/sequence/offset y cola independiente, con PCM/WAV válido.
4. Ejecutar concurrencia de ambos lanes; no bloquear el audio remoto esperando al micrófono ni viceversa.
5. Probar stop/release por fin de llamada, cambio de ruta, navegación, pagehide, track end, permiso revocado, reinicio del service worker, error y timeout.
6. Confirmar que no hay escucha en standby, ringing, pre-call, no-call, ruta incierta ni después del fin.
7. Confirmar que los controles de micrófono saliente no son modificados por el canal ASR entrante.

**Criterio de salida:** evidencias de runtime en entorno controlado, todas las pistas cerradas en todos los caminos de terminación, sin escucha en estados no autorizados.

### SI-GROQ-07 · verificar transcripción, fusión temporal y presentación

**Prioridad:** P1 · **Estado:** suites sintéticas PASS; overlay real PENDIENTE.

**Objetivo:** demostrar un único diálogo cronológico y comprensible, conservando solapamientos entre fuentes.

**Acciones:**
1. Verificar source roles: micrófono propio -> INTÉRPRETE; remoto -> AUDIO REMOTO · HABLANTE NO VERIFICADO sin metadata suficiente.
2. Verificar orden por timestamp común; offsets conservados; no colapsar segmentos superpuestos de fuentes distintas.
3. Verificar deduplicación limitada a ventanas adyacentes de la misma fuente; no eliminar repetición real ni habla simultánea.
4. Verificar que parciales y finales no generan filas duplicadas y que segmentos tardíos se insertan cronológicamente.
5. Revisar legibilidad, scroll, visibilidad y recuperación del overlay, incluido hotload/cambio de ruta.

**Criterio de salida:** prueba funcional visual aprobada sobre datos sintéticos de dos fuentes, capturas saneadas sin datos privados, timestamps/roles correctos.

### SI-GROQ-08 · optimizar chunking, overlap y coste sin perder fidelidad

**Prioridad:** P1 · **Estado:** parámetros provisionales, no optimizados empíricamente.

**Situación:** 6.5 s de ventana, 500 ms de solapamiento y paso de 6 s son candidatos heredados, no parámetros probados como óptimos.

**Acciones:**
1. Medir WER/CER, latencia p50/p95, jitter, duplicados, truncamiento y drift con varios tamaños de ventana/solapamiento en corpus idéntico.
2. Medir por separado cada lane y ambas simultáneas; comprobar RPM/ASH y tamaño de audio transmitido.
3. Considerar el mínimo de facturación de 10 segundos por petición descrito en documentación pública, si sigue vigente para la cuenta.
4. No minimizar peticiones si la latencia o precisión se degradan materialmente.
5. Elegir configuración que cumpla los umbrales de SI-GROQ-09 y los límites del plan de cuenta.

**Criterio de salida:** tabla comparativa con muestras suficientes, criterio de aceptación fijo y decisión justificada.

### SI-GROQ-09 · fijar y aprobar umbrales de aceptación acústica

**Prioridad:** P1 · **Estado:** PENDIENTE.

**Objetivo:** convertir la exigencia de calidad máxima en criterios medibles sin rebajar la instrucción original.

**Medidas necesarias:** WER/CER por canal/idioma, precisión de números/nombres/unidades, latencia p50/p95, drift temporal, pérdidas, duplicados, tasa de segmentos vacíos, estabilidad de cola, coste/ASH y claridad de atribución por procedencia.

**Acciones:**
1. Definir umbrales antes de ejecutar pruebas de aceptación.
2. Separar criterio general del criterio especial para cifras, nombres propios y unidades.
3. Documentar tamaño de muestra, corpus, ruido, idioma y condiciones de solapamiento.
4. No declarar aceptación sobre un mock, una llamada API aislada o una prueba de sintaxis.

**Criterio de salida:** matriz aprobada y resultados que cumplan todos los límites críticos, con desviaciones declaradas.

### SI-GROQ-10 · aceptación final del operador y decisión de release

**Prioridad:** P0 para cierre final · **Estado:** PENDIENTE · reservada al operador.

**Condiciones previas:** SI-GROQ-01 a SI-GROQ-09 en estado aceptable; CI verde en HEAD final; Chrome runtime verificado; ZDR/cuotas confirmados; pruebas sintéticas, API y audio controlado satisfactorias.

**Acciones:**
1. Presentar evidencia, limitaciones y riesgo residual.
2. El operador ejecuta o presencia una prueba de llamada controlada cuando proceda, revisa la transcripción y emite aceptación explícita.
3. Solo después de aceptación, revisar el merge de PR #84. Autorización general de desarrollo no equivale a aceptación funcional ni a instrucción automática de merge/release.

**Criterio de salida:** aceptación explícita registrada; merge/release siguen sus propios controles.

### SI-GROQ-11 · aceleración segura de desarrollo y CI

**Prioridad:** P1 · **Estado:** primera optimización IMPLEMENTADA Y VERIFICADA.

**Implementado:**
- GitHub Actions concurrency groups por workflow/rama con cancelación de ejecuciones obsoletas.
- Auditoría dividida en cuatro jobs paralelos: syntax, guards, observability y captions; agregador obligatorio.
- 99 comandos originales preservados; no se redujo la batería.
- YAML local validado y CI 3/3 SUCCESS en HEAD 1c7aca92...
- Los duplicados obsoletos de la misma rama/workflow fueron cancelados al completarse las nuevas ejecuciones.

**Acciones siguientes:**
1. Mantener un único escritor de código en la rama de integración; otras sesiones solo hacen pruebas independientes o revisión read-only.
2. Reutilizar resultados solo si commit SHA y entorno coinciden exactamente; nunca reutilizar PASS de otra cabeza.
3. Usar caché de dependencias determinista si reduce tiempo sin cambiar entradas/resultados.
4. Evitar trabajo duplicado push/pull_request mediante concurrency; no desactivar workflows obligatorios.
5. Si se introduce más paralelismo, mantener un job aggregate que falle ante cualquier job skipped/cancelled/failure.

**Criterio de salida:** aceleración medida, misma cobertura y agregador requerido, sin falsos verdes.

### SI-GROQ-12 · mantener continuidad interconversacional

**Prioridad:** P0 documental · **Estado:** persistencia documental de esta retoma en curso.

**Acciones:**
1. Cada ciclo sustantivo actualiza OCP y agrega crónica con fuente, revisión, commits, entorno, evidencia, límites y checkpoint.
2. Mantener A-01–A-04 sin alterar el texto dentro de los bloques verbatim.
3. La conversación recuperada del operador sigue siendo texto aportado por el operador, no export nativo.
4. En una conversación nueva, leer §ARR, DUG, control, OCP, esta lista, última crónica y originales pertinentes antes de actuar.
5. No reconstruir la última salida anterior desde memoria. Si falta el registro exacto, declarar NO DISPONIBLE / NO VERIFICADA.
6. Mantener estado único G14. No crear agentes paralelos ni transferir responsabilidad sin el proceso del control.

**Criterio de salida:** una nueva sesión puede localizar fuente literal → plan → PR/HEAD → CI → pruebas → límites → siguiente acción sin pedir al operador que repita el contexto.

---

## 4. Secuencia operativa recomendada para la siguiente sesión

1. Releer DUG/§ARR desde main y confirmar blob/version; leer OCP y control; verificar G14.
2. Leer la crónica de retoma más reciente y este registro; no comenzar reconstruyendo la conversación.
3. Reconsultar PR #84, HEAD y tres workflows para la cabeza actual; no asumir que 1c7aca92... seguirá siendo head.
4. Ejecutar solo trabajo material que pueda cerrarse sin intervención del operador; mantener PR draft y no fusionar.
5. Resolver disponibilidad Chrome y ZDR/cuotas sin eludir políticas ni exponer secretos.
6. Continuar SI-GROQ-05 y siguientes en orden de dependencias.
7. Persistir OCP, crónica, plan y esta lista al final de cada ciclo sustantivo.

## 5. Herramientas y superficies de trabajo verificadas

- Repositorio de producto: SeryMente/signal-interpreter.
- Checkout local de integración: rama `feat/groq-dual-main-20261111`, HEAD observado `1c7aca92cc89337aeb4c9907426847f941fa35bd`, limpio en el último read-back. Se omite ruta y cuenta del perfil.
- Checkout principal: alias funcional Fila 4, rama main; sincronizar por fast-forward cuando se requiera. No se conservan rutas locales ni ubicaciones similares.
- **Sincronización local final:** el último fast-forward cotejado fue HEAD `05a12cde497ecb1110211d225fa41d3fab2c9efb`, anterior al pin final del OCP. El hash histórico `3e1697711cd3f578ead7601232d5c33ea9d3f6c8` fue supersedido. La lectura posterior no se pudo verificar; tratar el espejo local como PENDIENTE DE SINCRONIZACIÓN/READ-BACK. La siguiente operación será sincronizar por fast-forward y cotejar el blob vigente; no cambiar `safe.directory` ni la propiedad del checkout.
- El entorno secundario de pruebas fue un clon temporal para repetir pruebas independientes; ya fue eliminado y sus archivos/scripts temporales fueron retirados y leídos de vuelta. Identidad y ruta no se conservan.
- No hay CLI/Hiku ni herramienta Hiku expuesta en esta sesión. Claude Code fue localizado en otro perfil, pero auth status mostró loggedIn=false; no se usó ni se contabiliza como agente. La aceleración real se logró con runners paralelos de GitHub Actions y pruebas en dos checkouts aislados.
- Una sesión separada fue tratada como efímera; la actividad técnica y las pruebas se hicieron en el destino funcional Fila 4, según el alcance autorizado. No persistir identidad o ruta de la sesión efímera.
  
## 6. Límites que no deben reinterpretarse

- CI verde no significa que la extensión esté cargada o aceptada en Chrome.
- Las pruebas sintéticas no demuestran calidad acústica con voz real.
- ZDR no se deduce del checkbox.
- No existe clave Groq verificada en los entornos revisados al último checkpoint.
- No se ha enviado audio real, ni se ha llamado al endpoint Groq con audio, ni se ha probado una llamada real.
- No se ha medido WER/CER, latencia real, jitter, drift, pérdida/duplicación, coste o ASH efectivo de la cuenta.
- No se ha completado aceptación funcional de Chrome, merge, deploy o release.
- La extensión conserva flags false por defecto.
- MCP normativo continúa DESACTIVADO; G14 sigue agente único; FOL1 PREPARADA/NO ACTIVA; folios PENDIENTES/NO ASIGNADOS.

## 7. Seguimiento de retoma · 2026-11-11 · cabeza 9301dade

Este bloque supersede únicamente los valores de checkpoint/HEAD de secciones anteriores; no altera las instrucciones originales ni reescribe evidencia histórica.

### SI-GROQ-01 · PR #84 y sincronización

**Estado:** BASE SINCRONIZADA; CI DEL HEAD ACTUAL NO OBSERVADO.

- Base `main`: `5f80297e1b08bcca4736e549363f47187748df11`.
- Head publicado: `9301dade6cde46a181a7260397223d2d45ea0478`.
- PR #84 OPEN / DRAFT / NOT MERGED; 36 archivos; siete commits adelante, cero detrás; mergeable=true.
- `observations/` sigue fuera del diff.
- Última consulta CI de este SHA: sin ejecuciones ni checks devueltos. No imputar PASS de `81d77ba4` ni de cabezas anteriores.

### SI-GROQ-05 · corpus y evaluación

**Estado:** HARNESS LOCAL IMPLEMENTADO; BENCHMARK ACÚSTICO PENDIENTE.

Se añadieron `tools/evaluate-dialogue-quality.mjs`, pruebas y guía. Calcula WER/CER por fuente, términos críticos por fuente/idioma, atribución y latencias p50/p95/máxima. Fixture CLI temporal bilingüe pasó; no se conserva corpus ni transcripción en Git. No existe aún resultado real de WER/CER ni umbral aprobado.

### SI-GROQ-06 · ciclo de vida de captura

**Estado:** REGRESIONES SINTÉTICAS PASS; CHROME REAL PENDIENTE.

Captura remota y micrófono del intérprete separados; permisos revocados y superficie no-browser fallan cerrado; las pistas se liberan. El cierre identifica transcripciones no drenadas como `Captura INCOMPLETA`. No equivale a validación de runtime Chrome o audio real.

### SI-GROQ-07 · fusión y presentación

**Estado:** RECONCILIACIÓN UNICODE REFORZADA; OVERLAY E2E PENDIENTE.

Se protege la deduplicación de idiomas con escritura Unicode y segmentos solo con símbolos. Se conserva la distinción entre dos fuentes; no inferir identidad del hablante remoto. La presentación visual en Chrome sigue pendiente.

### SI-GROQ-08 / SI-GROQ-09 · optimización y umbrales

**Estado:** PENDIENTE DE MEDICIÓN Y APROBACIÓN.

Las ventanas 6,5 s / overlap 500 ms / avance 6 s siguen siendo candidatas. El evaluador facilita mediciones, pero no aprueba umbrales ni demuestra precisión acústica.

### SI-GROQ-11 · CI

**Estado:** WORKFLOW AMPLIADO; HEAD ACTUAL PENDIENTE DE CI REMOTO.

La auditoría local encontró 58/58 sintaxis y 43/43 suites ejecutables; package 66/66 hashes y ocho suites críticas PASS. Un único test de datos `observability-package-audit.mjs observations` no se ejecutó en el checkout sparse; su test fixture sí. El SHA `9301dade` todavía no tenía ejecuciones/checks observables al último read-back.

### SI-GROQ-12 · continuidad

**Estado:** DOCUMENTACIÓN DE RETOMA PERSISTIDA Y LEÍDA DE VUELTA EN MAIN.

Se actualizan OCP, crónica y navegación con base/head, cambios, pruebas, límites y siguiente acción. G14 sigue titular único; FOL1 PREPARADA/NO ACTIVA; folios PENDIENTES/NO ASIGNADOS. MCP normativo DESACTIVADO.

## 8. Seguimiento de retoma · 2026-11-11 · HEAD 305d8d86

Este bloque supersede únicamente el checkpoint anterior; conserva el orden y las compuertas de SI-GROQ-01 a SI-GROQ-12.

### SI-GROQ-01 · PR y CI

**Estado:** CÓDIGO PUBLICADO; CI NUEVO EN EJECUCIÓN.

- Commit `305d8d862be629af0fc96e35701adc29be15013c` en `feat/groq-dual-main-20261111`, fast-forward confirmado.
- PR #84 OPEN / DRAFT / NOT MERGED; metadata más reciente `mergeable=true`; HEAD exacto `305d8d862be629af0fc96e35701adc29be15013c`.
- Runs del HEAD: Package integrity `43115403310`, native-caption-host-build `43115403381`, signal-observability-audit `43115404314`, IN_PROGRESS al último sondeo.
- Compare: 12 commits de la rama y 47 de main. Main incorpora snapshots `observations/**` y actualizaciones de OCP/crónica; no perseguir esos snapshots mediante sincronización ciega.

### SI-GROQ-05 · benchmark estructural

**Estado:** EVALUADOR AMPLIADO; BENCHMARK ACÚSTICO PENDIENTE.

Además de WER/CER, términos críticos, atribución y latencia, el informe incluye turnos omitidos/extra (precisión/recall/F1), inversiones cronológicas y conservación de relaciones de solapamiento entre los canales. Los parámetros de agrupación/solapamiento son configurables. No constituye diarización ni sustituye referencia humana. Tests de diálogo perfecto, desorden, turno omitido/extra y solapamiento perdido PASS.

Validación local: captions 14/14; hashes 66/66; regresiones críticas 8/8; syntax y pruebas estructurales PASS. El audit completo `observations/` no se ejecutó localmente por sparse checkout.

### Compuertas no alteradas

Chrome autorizado, ZDR/cuotas, credencial local, API con audio y prueba acústica humana continúan pendientes. No habilitar flags, captura real, merge, deploy, release ni aceptación por inferencia. G14 continúa titular único; FOL1 PREPARADA/NO ACTIVA; folios PENDIENTES/NO ASIGNADOS; MCP normativo DESACTIVADO.

## 9. Seguimiento de CI del HEAD 305d8d86 · 2026-11-11

### SI-GROQ-01 · PR y CI

**Estado:** CI 3/3 WORKFLOWS / 7/7 JOBS SUCCESS; PR ABIERTA EN DRAFT.

- HEAD `305d8d862be629af0fc96e35701adc29be15013c`.
- Package integrity `43115403310` SUCCESS.
- native-caption-host-build `43115403381` SUCCESS.
- signal-observability-audit `43115404314` SUCCESS; jobs guards/syntax/observability/captions/audit todos SUCCESS.
- PR #84 OPEN / DRAFT / NOT MERGED; latest metadata `mergeable=true`. No se fusiona hasta superar compuertas externas y aceptación acústica.

### SI-GROQ-05 · evaluador estructural

**Estado:** IMPLEMENTADO + TESTS LOCALES + CI VERDE; BENCHMARK ACÚSTICO PENDIENTE.

El evaluador incluye WER/CER, términos críticos, atribución y latencia, más métricas de continuidad de turnos, orden cronológico y conservación de solapamientos entre canales. La clasificación de turnos es heurística, sin diarización inferida. Local: captions 14/14, package 66/66, regresiones críticas 8/8 y tests/sintaxis del evaluador PASS.

### Compuertas externas

Siguen pendientes Chrome autorizado, verificación ZDR/cuotas, credencial local, llamada Groq con corpus autorizado y evaluación acústica con referencia humana. No hubo audio real/API; flags false. Sin aceptación, merge, deploy o release.

## 10. Gobierno vigente y estado del checkpoint · 2026-11-11

- DUG verificado: Samantha v389 · NX-389m · Metacanon 1.30 · GOW 2.19; blob `bcd99e72113f444a045d7f1c91b4ad36865b8ea8`. §ARR (`gow-sec-14`) leído como vocabulario de entrada, sin autoridad de reglas.
- CNP aplicado por pertinencia: P001, P004, P005, P038 y P043 en sus textos completos. ART-013 §§2–4 aplicado: registrar solo el alias funcional designado Fila 4, no las identidades técnicas efímeras ni rutas de perfil. GOW §37.3: no calcular edades d.h.m. ni intervalos.
- Control: G14 ACTIVO, agente único, generación 14; FOL1 PREPARADA/NO ACTIVA; folios PENDIENTES/NO ASIGNADOS; MCP normativo DESACTIVADO.
- PR #84 HEAD `305d8d862be629af0fc96e35701adc29be15013c`; 3/3 workflows y 7/7 jobs SUCCESS. Evaluador estructural en PR; aceptación acústica real pendiente.
- Compuertas pendientes: Chrome autorizado, ZDR/cuotas, credencial local, API Groq con corpus autorizado y benchmark de referencia humana. No hay captura/audio real ni aceptación; flags false; sin merge, deploy o release.
## 12. Benchmark multi-grabación y validación de latencia · 2026-11-11

### SI-GROQ-05 · evaluación de calidad

**Estado:** HARNESS IMPLEMENTADO + CI 3/3 WORKFLOWS / 7/7 JOBS SUCCESS; BENCHMARK ACÚSTICO REAL BLOQUEADO.

- tools/evaluate-dialogue-benchmark.mjs: métricas por grabación y fuente; WER/CER ponderado y macro; bootstrap por clip; términos críticos; atribución; turn F1; cronología; solapamiento intercanal; estratificación por idioma, ruido, overlap, red y chunk profile.
- purpose=tuning + split=validation entrega TUNING_ONLY; no produce PASS/FAIL. purpose=acceptance + split=test requiere perfil RATIFIED y muestra suficiente; sin ratificación devuelve BLOCKED.
- tools/verify-dialogue-media.mjs valida hashes, RIFF/WAVE, PCM s16le, mono 16 kHz y media/manifiesto fuera de Git. Tests usan WAV sintéticos.
- Latencia visible: captura ready → overlay tras dos frames; documento visible y reloj compartido requeridos; por fuente p50/p95/max/n solo en memoria; HTTP separado.
- Perfil de alta calidad sigue PROPOSED_NOT_RATIFIED: 60 grabaciones, 20 por estrato, 10.000 palabras por fuente; WER ≤10%, macro-WER CI upper ≤12%, CER ≤5%, recall crítico 100%, turn F1 ≥95%, overlap recall ≥95%, inversiones 0, peor p95 ≤2.500 ms, peor máximo ≤5.000 ms.

### CI remoto

HEAD 6b14c0fad64cbc8eef364c496a6a96043c9dbbf1: Package integrity run 43119571803 SUCCESS; Observability audit 43119571875 SUCCESS (5 jobs); Native caption host build 43119571912 SUCCESS. Total 3/3 workflows, 7/7 jobs.

### Compuertas pendientes

No existe corpus no clínico expresamente autorizado, gold transcript con dos anotadores/adjudicación, ZDR/cuotas confirmadas, credencial local ni Chrome autorizado. No hubo llamada Groq con audio ni captura real; flags false. La calidad acústica y la latencia percibida reales siguen NO VERIFICADAS. No aceptar, fusionar, desplegar ni liberar.

## 13. Port selectivo de calidad y aislamiento sobre main · 2026-11-12

**Estado:** IMPLEMENTACIÓN EN RAMA AISLADA · PR #94 OPEN / DRAFT / NOT MERGED · ACEPTACIÓN ACÚSTICA PENDIENTE.

### SI-GROQ-01 · Procedencia y línea base

- A-01, A-02, A-03 y A-04 permanecen conservados verbatim en `INSTRUCCIONES-Y-PLAN-PROVISIONAL-GROQ-DIALOGO-20261110.md`; este seguimiento no los sustituye ni reescribe.
- Rama `feat/groq-dual-quality-20261112`, creada desde `main` HEAD `961220cbccbcdd77b1124b05faf2c90edd4dc104` (manifest 0.10.50). La rama divergente anterior no se actualizó a ciegas.
- PR #94: [Audio: dual-source Groq transcription with playback isolation and lifecycle safeguards](https://github.com/SeryMente/signal-interpreter/pull/94), abierta en Draft. No merge, deploy, release ni carga en Chrome.

### SI-GROQ-02 · Aislamiento de la llamada y del micrófono

- La captura de audio remoto permanece en una copia de `getDisplayMedia`; se declara `suppressLocalAudioPlayback:false`. El worklet emite silencio en su salida de AudioContext: no sustituye ni mezcla con la reproducción original.
- La copia del micrófono solicita `echoCancellation:false`, `noiseSuppression:false` y `autoGainControl:false`. El inicio falla cerrado si `MediaStreamTrack.getSettings()` no confirma los tres valores en `false`; la aplicación efectiva sigue pendiente de prueba en Chrome/dispositivo autorizado.
- Se retiraron beep/locución de confirmación y tonos de mute durante llamadas activas; la prueba manual de sonido se bloquea mientras haya llamada.
- La política de captura requiere MIC ON y estado de salida verificado. MIC OFF y fin de llamada detienen las dos fuentes.

### SI-GROQ-03 · Integridad de captura y transcripción

- Dos fuentes y colas independientes se procesan mediante `whisper-large-v3` y se fusionan por reloj/offset; etiqueta propia `INTÉRPRETE`, fuente remota `AUDIO REMOTO · HABLANTE NO VERIFICADO`.
- El downmix estéreo protege contra cancelación por correlación negativa fuerte, eligiendo el canal de mayor energía en ese caso. Es protección de la copia mono; debe evaluarse también con audio real.
- Las pistas se detienen al comenzar el cierre, antes de drenar solicitudes. Los pendientes y fallos se muestran como captura incompleta; no se informa cierre completo si existe pérdida/pendiente conocida.
- Inventario SHA-256 extendido a los dos assets de captura nuevos y reconciliado para los archivos modificados.

### SI-GROQ-04 · Calidad, velocidad y compuertas

- Modelo predeterminado: `whisper-large-v3`, orientado a precisión multilingüe según documentación vigente de Groq; Turbo no es fallback automático.
- Se conservan métricas devueltas por segmento; todavía no hay umbral de confianza calibrado para aceptar/descartar texto. No inventar thresholds ni ocultar segmentos por una regla arbitraria.
- La ventana de 6.5 s y solapamiento de 500 ms siguen siendo parámetros candidatos; latencia p50/p95, coste, pérdidas, duplicados, WER/CER y términos críticos requieren benchmark autorizado.
- La selección `displaySurface === "browser"` distingue navegador de ventana/monitor, pero no demuestra por sí sola que se seleccionó exactamente la pestaña de Cloud Interpreter. La identidad de pestaña compartida sigue siendo riesgo/compuerta pendiente.
- CI inicial asociado a HEAD `7465ff8db0b3527c0ec25fbafb1995d0a0429750` observado en curso: Package integrity run 43316225686; Signal Interpreter extension package run 43316225803; signal-observability-audit run 43316225694; native-caption-host-build run 43316225586. No declarar PASS/FAIL sin read-back del SHA final.
- Sin clave real, verificación de ZDR/cuotas, API Groq con audio, llamada, audio real, Chrome cargado o aceptación humana. La calidad acústica y la latencia percibida siguen NO VERIFICADAS. Perfil de benchmark sigue PROPOSED_NOT_RATIFIED.

## 14. Carga del renderer y preservación de audio · 2026-11-12

**Implementado en PR #94; pendiente de CI final y aceptación física.**

- Alertas: sin beep/locución de confirmación, sin tonos de mute durante llamada y sin prueba manual de sonido durante llamada.
- MIC guard: elimina el parcheo de APIs cada 50 ms. El watchdog de 50 ms solo permanece cuando MIC está silenciado y hay una pista viva; al abrir MIC se cancela, y los wrappers silencian sincrónicamente cualquier pista nueva mientras MIC siga cerrado.
- Overlay: periodicidad de render de 100 ms a 1.000 ms; las mutaciones agrupan el render en una ventana de 250 ms.
- No se cambia la pista WebRTC saliente ni se inserta DSP en la reproducción remota. La copia ASR del micrófono y la copia ASR de la pestaña permanecen independientes.
- Prueba sintética ampliada: comprueba inicio/parada del watchdog y las frecuencias de render declaradas. No demuestra reducción medida de CPU, ausencia de jitter en hardware ni calidad acústica real.
- La aceptación sigue reservada al operador; no realizar llamadas, captura real, recarga Chrome, merge, deploy o release desde este ciclo.
