# Signal Interpreter · tareas provisionales de Groq dual · G14

**Clase:** registro operativo subordinado al OCP; no crea un segundo estado canónico.  
**Estado:** ACTIVO · PROVISIONAL · pendiente de aceptación acústica y funcional del operador.  
**Titularidad:** G14 · agente único.  
**Última cabeza de código validada:** 1c7aca92cc89337aeb4c9907426847f941fa35bd.  
**PR:** [#84 · dual-source Groq Whisper](https://github.com/SeryMente/signal-interpreter/pull/84), abierta, draft, no fusionada.  
**Fuente literal:** [conversación Groq recuperada](originales/CHATGPT-SI-RECUPERADO-GROQ-20261110.txt) y [autorizaciones de continuidad G14](originales/CHATGPT-SI-AUTORIZACIONES-RETOMA-20261110-G14.txt).  
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

Dos checkouts independientes sobre Fila 4 se emplearon como superficies separadas de prueba; no se crearon dos agentes ni dos titulares. Un checkout bajo CENTRAL\fila4 mantuvo la rama candidata; un checkout temporal bajo CENTRAL\mantenimientorci se limitó a pruebas independientes y fue eliminado tras el read-back.

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
- Checkout local de integración: C:\Users\fila4\AppData\Local\Temp\SI-G14-candidate, rama feat/groq-dual-main-20261111, HEAD observado 1c7aca92cc89337aeb4c9907426847f941fa35bd, limpio en el último read-back.
- Checkout principal del perfil Fila 4: C:\Users\fila4\Desktop\SeryMente\Repositorios\signal-interpreter, rama main; sincronizar por fast-forward cuando se requiera. No confundirlo con C:\Users\fila4\Desktop\SeryMente\signal-interpreter, otra carpeta existente que no se debe asumir como checkout.
- El entorno secundario bajo CENTRAL\mantenimientorci fue un clon temporal para ejecutar pruebas independientes; ya fue eliminado. Sus archivos/scripts temporales fueron eliminados y read-back comprobado.
- No hay CLI/Hiku ni herramienta Hiku expuesta en esta sesión. Claude Code fue localizado en otro perfil, pero auth status mostró loggedIn=false; no se usó ni se contabiliza como agente. La aceleración real se logró con runners paralelos de GitHub Actions y pruebas en dos checkouts aislados.
- PC-8 fue tratado como sesión efímera indicada por el operador; la actividad técnica y las pruebas se hicieron en Fila 4, según el alcance autorizado.
  
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
