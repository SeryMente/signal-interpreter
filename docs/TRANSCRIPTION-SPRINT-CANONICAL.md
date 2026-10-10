# DOCUMENTO CANÓNICO ÚNICO — Sprint de transcripción y overlay de subtítulos

> **Autoridad documental:** este es el único informe canónico del esfuerzo/sprint de transcripción, Live Caption y overlay de subtítulos de Signal Interpreter. Las notas antiguas de implementación, los requisitos verbatim y las notas de versión son fuentes históricas o técnicas subordinadas; no son informes alternativos del esfuerzo.  
> **Ruta canónica:** `docs/TRANSCRIPTION-SPRINT-CANONICAL.md`  
> **Repositorio:** https://github.com/SeryMente/signal-interpreter  
> **Última versión documentada:** **0.10.30 — Preview independiente de llamada y exportación automática diagnosticable**
> **Integración previa al ciclo correctivo:** [PR #52](https://github.com/SeryMente/signal-interpreter/pull/52)
> **Estado de validación real:** no se afirma aquí que una llamada bilingüe real posterior a instalar 0.10.30 haya sido verificada. Las pruebas automatizadas/CI no sustituyen esa validación.

## 1. Regla inequívoca de documentación

Este archivo es el único documento que narra el esfuerzo de extremo a extremo: requisitos recibidos, evolución, decisiones, implementación, pruebas, límites, evidencia y pendientes. En caso de que otro documento histórico parezca competir con este relato, prevalece este documento para la narrativa del sprint.

La documentación especializada conserva funciones acotadas:

- [Requisito de usuario VERBATIM (2026-10-08)](USER-REQUIREMENT-LIVE-CAPTIONS-OVERLAY-VERBATIM-20261008.md): fuente primaria de los bloques originales de requisitos; no es un informe de sprint.
- [Notas de versión 0.10.21–0.10.29](versions/): registros técnicos por release, no narrativas paralelas del sprint.
- [Arquitectura de observabilidad Browser→GitHub](OBSERVABILITY-ARCHITECTURE-BROWSER-GITHUB-v2.md): arquitectura transversal de observabilidad, no documentación específica del esfuerzo de transcripción.
- El antiguo `LIVE-CAPTION-OVERLAY-IMPLEMENTATION.md` queda convertido en un puntero a este documento. Su contenido previo se conserva en el anexo histórico de este archivo para no perder trazabilidad.

No debe crearse otro informe de sprint o esfuerzo de transcripción/overlay sin actualizar primero esta declaración de autoridad y consolidar el contenido aquí.

## 2. Objetivo funcional original

Proporcionar durante una llamada en Cloud Interpreter un overlay integrado, visualmente discreto y no obstructivo que muestre las intervenciones en inglés y español, distinguiendo CLIENTE y LEP. Chrome Live Caption es la fuente nativa preferente cuando expone texto accesible; un preview efímero de audio de pestaña y Groq sirve como continuidad/fallback cuando el texto nativo no está disponible o queda obsoleto. El preview no debe convertirse en transcripción durable ni introducirse en el paquete de observabilidad.

## 3. Instrucciones del usuario conservadas VERBATIM

### 3.1. Instrucción funcional original — registrada en PR #31

> Actualmente, Chrome, mediante servicio de accesibildad, hace un trabajo decente a la hora de transcribir la saluda de audio, y mostramrelka. Para dos idiomas en español, e ingles. 
>
> La pregunta que te quiero hac eres la siguiente: Puedo hacer que teniendo el switch de subtitulso automaticos en posicionde encendido, pero habiendo cerrado los subitutlos tras su aparicion (Sale una ventanita con los subtitulso automaticos, pero si la cierro se queda el switch de Subtitulso Automaticos encendido, y ya no muestra la ventana) tu utilizes la extension para mostrarme en la misma pantalla donde tomo la llamada en la plataforma de cloud interpreter, un recuaddro, que armonize con la plataforma visualmente, sin obstruir por ejemplo el keypad para conferncia, etc. ni ninguna otra funcion, dobnde aparezcan los subtitlos, poniendome, por turnos, lo ue salga en ingles, yu luego lo que salga en español, de otro color, uno para el cliente, y otro para el LEP (Limited English Profficient) lo cual es terminologiad ela indsutria del interpetacion para los ahblantes de español que sirvo en als llamadas

Fuente de registro: [PR #31](https://github.com/SeryMente/signal-interpreter/pull/31), que introdujo el requisito verbatim.

### 3.2. Instrucción de preservar literalmente los requisitos — registrada en PR #31

> Pero tal como te lo pedi, es importante que guardes verbatim, en el repo,  mis instrucciones, para consultarlas luegoy asegurarte el estricto apego a ellas

### 3.3. Criterio adicional de UX, distribución y calidad — registrado en PR #33

> Bien, mientras no sea intrusivo viualmente, y todo luzca comoe xtension normnal. Y siempre se incluya en la carpeta de la extension que el entorno persistente descarga a escritoriuo, me doy por satisfecho. SIempre y cauando resuelvas la implemetntacion elegantemente, armonizando con la UI de la plataforma, y que funcione agil ygracilmente, y que sea pulida maxima calidad de vida para mi como usuario, sin bloat.

Fuente: [PR #33](https://github.com/SeryMente/signal-interpreter/pull/33). Los bloques anteriores se reproducen con su ortografía original intencionalmente; no corregirlos ni sustituirlos por paráfrasis.

### 3.4. Instrucción de consolidación documental — primera formulación en esta conversación

> Asegúrate que el documento sea accesible en el repositorio y que no haya ambigüedad, que no haya otros documentos de esfuerzos del pasado y que el único documento que exista para lo que tiene que ver con la transcripción, este, sea inequívocamente el único que se pueda encontrar y que no haya ambigüedad. Además documenta de manera exhaustiva todas las instrucciones verbatim, tal y como yo te las fui dando. Es decir, sé exhaustivo con la documentación del esfuerzo del sprint.

### 3.5. Reiteración literal de la instrucción documental

> Asegúrate que el documento sea accesible en el repositorio y que no haya ambigüedad, que no haya otros documentos de esfuerzos del pasado y que el único documento que exista para lo que tiene que ver con la transcripción, este, sea inequívocamente el único que se pueda encontrar y que no haya ambigüedad. Además documenta de manera exhaustiva todas las instrucciones verbatim, tal y como yo te las fui dando. Es decir, sé exhaustivo con la documentación del esfuerzo del sprint.

La petición de consolidación se repitió literalmente; se registran ambas instancias para dejar constancia de su reiteración. Esta sección solo afirma literalidad para texto recuperado de los registros disponibles (PR #31, PR #33 y las dos peticiones anteriores de esta conversación). No pretende afirmar acceso a mensajes que no puedan recuperarse.

## 4. Criterios de aceptación derivados

1. El overlay debe armonizar con Cloud Interpreter y no obstruir keypad, mute, colgar, transferencia ni otros controles.
2. Las etiquetas de rol son **CLIENTE · ENGLISH** y **LEP · ESPAÑOL**; la atribución se basa en fuente verificada cuando existe una fuente de audio identificable, no solamente en el idioma.
3. Chrome Live Caption se aprovecha cuando la burbuja nativa expone texto accesible.
4. El cierre de la burbuja nativa o el envejecimiento del caption no debe dejar el panel silenciosamente sin subtítulos; el fallback de audio de pestaña es efímero.
5. Los previews no deben persistirse como segmentos durables ni incorporarse a observabilidad.
6. El componente se distribuye dentro de la carpeta de extensión materializada en el Escritorio, sin una instalación oculta paralela.
7. La arquitectura debe ser la mínima viable. No añadir servicios, tareas programadas, watchdogs externos ni servidores localhost por conveniencia.
8. Los estados de activación, bloqueo, montaje, visibilidad, fallos y recuperación deben ser diagnosticables sin capturar audio, texto transcrito, secretos ni IDs brutos.
9. La calidad final exige pruebas automatizadas y una prueba de llamada real; no confundir una con la otra.

## 5. Cronología técnica consolidada

| Hito | Evidencia | Resultado documentado | Límite |
|---|---|---|---|
| 0.10.21 | [PR #41](https://github.com/SeryMente/signal-interpreter/pull/41) | Reconciliación de overlay de ingresos con totales oficiales y pruebas de métricas | No demuestra por sí mismo transcripción real |
| Requisito verbatim | [PR #31](https://github.com/SeryMente/signal-interpreter/pull/31) | Se conserva la solicitud funcional original en el repositorio | Especificación, no prueba de implementación |
| Criterios UX | [PR #33](https://github.com/SeryMente/signal-interpreter/pull/33) | Se registran criterios verbatim de no intrusión, integración, agilidad, carpeta persistente y ausencia de bloat | Criterios no equivalen a validación visual |
| 0.10.12 / integración inicial Live Caption | [PR #34](https://github.com/SeryMente/signal-interpreter/pull/34) | Fuente nativa vía Native Messaging cuando expone texto; fallback de audio de pestaña + Groq; separación CLIENTE/LEP | CI/estáticas no prueban una llamada bilingüe real |
| 0.10.23 | [PR #45](https://github.com/SeryMente/signal-interpreter/pull/45) | Endurecimiento UX, límite de tarjeta y comportamiento al cerrar la burbuja | La aceptación final requiere llamada real |
| 0.10.24 | [PR #46](https://github.com/SeryMente/signal-interpreter/pull/46) | Historial desplazable, arrastre/redimensionado, ubicación y alcance por pestaña | Sin afirmar validación visual real |
| 0.10.24 | [PR #47](https://github.com/SeryMente/signal-interpreter/pull/47) | Corrección de contexto de sesión entre pestañas y llamadas | CI es evidencia de regresión, no de llamada real |
| 0.10.25 | [release notes](versions/0.10.25.md) | Preview bilingüe con fragmentos de audio de 1.8 s; reglas de mute/sesión; detección de teléfonos/direcciones y acciones explícitas | Preview efímero; validación real separada |
| 0.10.26 | [release notes](versions/0.10.26.md) | Atribución de CLIENTE/LEP por fuente de audio en Cloud Interpreter; YouTube mantiene regla separada por idioma | El idioma no debe reasignar una fuente verificada |
| 0.10.27 | [release notes](versions/0.10.27.md) | Congruencia de atajos y permiso `clipboardWrite` para fallback de copia | No implica validación de la llamada |
| 0.10.28 | [release notes](versions/0.10.28.md) | Informe persistente al cierre de llamada, checkpoint final, índice y clasificación complete/partial | Estrellas visibles no prueban selección/envío de rating |
| 0.10.29 | [PR #52](https://github.com/SeryMente/signal-interpreter/pull/52) y [release notes](versions/0.10.29.md) | Auto-recuperación de overlay y telemetría de activación | La llamada real posterior a instalar la versión sigue siendo la prueba operativa pendiente |

La cronología es un mapa de evidencias relevantes recuperadas, no una afirmación de que cada release haya sido validada en una llamada real.

## 6. Arquitectura funcional al cierre de 0.10.29

### 6.1. Transcripción durable

Audio de pestaña + micrófono → MediaRecorder → Groq Whisper → canales CLIENTE/YO → segmentos con timestamps → persistencia por sesión → consola LIVE.

La API key reside en configuración local de la extensión y debe redactarse en diagnósticos exportados.

### 6.2. Overlay de Live Caption

- **Fuente nativa:** el host mínimo en `extension/native/` usa Windows UI Automation para leer el árbol accesible de la burbuja de Chrome Live Caption cuando el texto está disponible.
- **Puente:** `live-caption-bridge.js` maneja estado, frescura, transiciones y reconexión acotada.
- **Fallback:** audio de pestaña en fragmentos cortos → Groq Whisper con detección de inglés/español → overlay. El preview es efímero y no se convierte en timeline durable.
- **Presentación:** `live-caption-overlay.js` usa Shadow DOM cerrado, `pointer-events: none`, filas recientes y posicionamiento que considera controles interactivos.
- **Atribución:** el canal de audio probado prevalece sobre el idioma cuando se conoce la fuente. Para Cloud Interpreter, pestaña = CLIENTE y micrófono verificado = LEP; las reglas del video de prueba están separadas.
- **Distribución:** los componentes del overlay residen en la carpeta `extension/`, incluidos los artefactos nativos bajo `extension/native/`.

### 6.3. Auto-recuperación y diagnóstico en 0.10.29

- Reconoce `app.cloudinterpreter.com/call/<ID>` como ruta de llamada activa y excluye `/rate`.
- Usa la ruta real como evidencia local si el estado persistido del service worker va retrasado.
- Los fallos del saludo `SIGNAL_CAPTION_OVERLAY_HELLO` se registran y generan reintentos con retroceso exponencial acotado.
- Verifica montaje, visibilidad y salud del overlay; el watchdog de ingresos es independiente de Auto-Answer y del observador principal.
- El paquete de llamada clasifica señales en `telemetry.featureSignals.overlayActivation` y `telemetry.keySignals`.
- No incluye texto transcrito, audio, credenciales ni IDs brutos de llamada en estos eventos.

## 7. Pruebas y niveles de evidencia

Pruebas automatizadas registradas en los artefactos de versión y PRs:

- `tools/live-caption-core-test.mjs`: normalización, detección de idioma y roles.
- `tools/live-caption-static-audit.mjs`: coherencia estática de la extensión y host.
- `tools/overlay-activation-regression-test.mjs`: contexto, fallback, reintentos, montaje, visibilidad y watchdog.
- `tools/call-observability-report-test.mjs`: inclusión de señales de activación en el informe de llamada.
- `tools/observability-static-audit.mjs` y auditorías de paquete relacionadas.
- Build/smoke test del host nativo en el workflow asociado a los PRs pertinentes.

**Qué demuestran:** contratos de software, compilación, invariantes estáticas y procesamiento de fixtures sintéticos cuando los checks correspondientes pasan.

**Qué no demuestran:** que la extensión cargada en el perfil de Chrome correcto haya mostrado captions durante una llamada bilingüe real, que la burbuja se haya cerrado y el fallback haya mantenido continuidad, ni que todos los controles visuales hayan quedado libres durante una llamada real.

## 8. Privacidad y restricciones

- No persistir audio o transcripción cruda del preview.
- No enviar el texto hablado en los eventos de ciclo de vida del overlay.
- No registrar credenciales, API keys ni identificadores brutos de llamada.
- Usar referencias opacas y rutas saneadas en informes.
- No afirmar que se seleccionó o envió una calificación solo porque las estrellas estaban visibles.
- No instalar infraestructura residente adicional para resolver un problema que la extensión puede manejar.

## 9. Estado de aceptación al cierre

| Área | Estado sustentado | Qué falta para cerrar |
|---|---|---|
| Requisitos verbatim | Registrados en PR #31/#33 y reproducidos arriba | Ninguno para conservar esos textos; no editar bloques verbatim |
| Implementación y regresiones automatizadas | Cambios integrados hasta 0.10.29; PR #52 | Revisar CI asociado a cualquier nuevo SHA si se modifica código |
| Documentación de versión | Notas 0.10.25–0.10.29 disponibles | Mantenerlas como notas de release, no como informes alternativos |
| Overlay en navegador | Hay mecanismos de montaje/visibilidad/recuperación instrumentados | Recargar 0.10.29 en Chrome y probar una llamada real |
| Continuidad al cerrar Live Caption | Fallback diseñado y cubierto por pruebas de software | Verificar en llamada real que el caption nativo desaparezca y el fallback continúe |
| No obstrucción visual | Se calcula ubicación frente a controles interactivos y se usa `pointer-events:none` | Inspección visual en llamada real |
| Observabilidad de extremo a extremo | Pipeline y reportes estructurados documentados | Comprobar que el informe de una llamada real contiene las señales esperadas y no contiene datos prohibidos |

**Conclusión técnica:** 0.10.29 implementa auto-recuperación y observabilidad del ciclo de activación; no se debe declarar el esfuerzo aceptado al 100 % hasta completar la prueba de llamada real.

## 10. Índice de evidencia primaria

- [PR #31 — preservación verbatim](https://github.com/SeryMente/signal-interpreter/pull/31)
- [PR #33 — criterios UX verbatim](https://github.com/SeryMente/signal-interpreter/pull/33)
- [PR #34 — Live Caption overlay](https://github.com/SeryMente/signal-interpreter/pull/34)
- [PR #45 — endurecimiento UX 0.10.23](https://github.com/SeryMente/signal-interpreter/pull/45)
- [PR #46 — overlay legible y configurable 0.10.24](https://github.com/SeryMente/signal-interpreter/pull/46)
- [PR #47 — contexto de sesión 0.10.24](https://github.com/SeryMente/signal-interpreter/pull/47)
- [PR #52 — auto-recuperación y telemetría 0.10.29](https://github.com/SeryMente/signal-interpreter/pull/52)
- [Requisito original VERBATIM](USER-REQUIREMENT-LIVE-CAPTIONS-OVERLAY-VERBATIM-20261008.md)
- [Notas 0.10.25](versions/0.10.25.md), [0.10.26](versions/0.10.26.md), [0.10.27](versions/0.10.27.md), [0.10.28](versions/0.10.28.md), [0.10.29](versions/0.10.29.md)

## 11. Ciclo correctivo 0.10.30 — activación independiente y cierre diagnosticable

### 11.1. Retroalimentación del operador — VERBATIM

> En estos momentos, la versión actual me entrega una extensión que cuando carga la llamada no funciona, es decir, no está transmitiendo del live caption, que por cierto, mientras el switch de subtítulos automáticos está encendido, se suponía que debería de poder reportar a la extensión sin importar que el recuadro nativo de los subtítulos esté abierto o no. Puedo cerrar el recuadro, pero mientras que el switch esté encendido, eso debería dar acceso para que funcione la extensión. En estos momentos, cuando carga la llamada, no está funcionando. Y de hecho, también se había fortalecido la observabilidad para que aportara datos útiles para este desarrollo. En este momento estoy publicando la observabilidad de la extensión, puesto que tomé algunas llamadas y el paquete de observabilidad debería aportarte los datos necesarios para que diagnosticaras el bug y además de otros datos útiles. Si no es así, como parte del esfuerzo de este ciclo, haz que la observabilidad sea útil, repito, haz que la observabilidad sea útil y asegúrate que cuando se termine una llamada se exporte automáticamente. Ahorita lo exporté manual, pero también quiero que revises si se estuvo exportando automáticamente cuando finalizaban las llamadas, porque así es como debe de ser. Se finaliza una llamada, se exporta la observabilidad, yo regreso contigo, te retroalimento y junto con el paquete de observabilidad, tú decides cuál es el mejor camino para seguir desarrollando. Entonces, esa es la retroalimentación. Resuelve de extremo a extremo para darme lo que se supone que debe de darme este desarrollo. Dime, el documento canónico te deja claro todo o qué necesitas por mi parte para resolver de extremo a extremo sin detenerte hasta terminar.

> una pregunta, ¿tienes una herramienta de computadora virtual para que te instales la extensión y utilizando algún, es decir, si había utilizado el video de YouTube para poder probarla, pero al parecer las pruebas en el video de YouTube dan positivo y no sirve la extensión en la plataforma Cloud Interpreter. Entonces, la idea es que, ¿ideas alguna forma de experimentar en una herramienta de computadora virtual para que ya me la entregues lista y probada? ¿Crees que puedas hacer eso?

> ah bueno, entonces continúa, pero trata de dejarla lo menos propensa a que falle cuando yo la utilice. No te detengas hasta terminar, resuelve de extremo a extremo.

Estos textos fueron recuperados de esta conversación. No se atribuye literalidad a instrucciones no recuperadas.

### 11.2. Evidencia primaria inspeccionada

- Base del análisis: `main@ad9abc2b9eaec13648a263021f46e0bffd63af26`.
- El informe de la llamada con referencia opaca `914fd064feac1a1e2c17b942` identifica runtime 0.10.29. Se observa panel montado y visible, con cero filas en sus muestras de salud; montaje no equivale a reconocimiento.
- Los lotes históricos contienen `SIGNAL_CAPTION_NATIVE_BRIDGE_ERROR` con el tipo genérico `NativeMessagingError`, sin causa específica ni correlación propia de llamada. Esta evidencia NO permite distinguir retroactivamente host ausente, acceso denegado o salida del proceso.
- El respaldo anterior consultaba `SIGNAL_GET_GROQ_CAPTURE_STATE` y salía si la captura durable no estaba iniciada. La apertura del panel y del puente no iniciaba esa captura; por ello el respaldo no era independiente de la consola.
- Hay entrega automática verificable: `batch-1fe6034b-3876-4aee-be2a-295ee98b28f8`, trigger `call-ended`, creado `2026-10-10T20:46:38.372Z`, contiene el checkpoint de cierre de la llamada referida. El lote manual posterior no fue el único mecanismo de publicación.
- El evento de fin está fechado `2026-10-10T20:39:38.065Z`; el checkpoint aparece en `2026-10-10T20:46:37.524Z`. El código esperaba a la reconciliación de ingresos antes de solicitar el checkpoint. Este acoplamiento se elimina.
- El saneamiento anterior convierte `startedAt` y `endedAt` en `[PHONE]T…`. El generador seleccionaba ese valor no válido antes de intentar el timestamp válido del evento. Esto explicaba un informe `partial` con checkpoint recibido y sin una explicación suficiente de fechas faltantes.

### 11.3. Corrección y mínima expresión arquitectónica

No se agregan permisos al manifiesto, servicios Windows, tareas programadas, infraestructura externa ni diseños nuevos de panel. Se reutilizan el puente nativo, el documento offscreen, la captura de pestaña y Groq ya autorizados.

- El preview de llamada puede iniciar sin consola LIVE ni sesión durable. Usa una sesión efímera `caption:<callId>`, valida llamada/pestaña antes y después de la transcripción y jamás llama a la ruta de segmentos oficiales.
- La adquisición se serializa: callbacks nativos concurrentes no solicitan capturas duplicadas. Se reutiliza la captura offscreen verificada; las capturas durables y de prueba no deben competir con el preview independiente.
- Cada fragmento del preview independiente se graba con un MediaRecorder nuevo, se cierra y se envía como WebM completo. No se envían fragmentos posteriores de un único archivo como si fueran archivos autónomos.
- La voz del micrófono solo se incorpora cuando el mute y el estado de salida están verificados. El documento offscreen revalida el permiso lógico después de resolver getUserMedia; detiene esa fuente al entrar en mute pendiente, si falla la verificación o si cambia la llamada. Si falta permiso de micrófono, se conserva el preview de pestaña y se registra el motivo.
- Un guardarraíl offscreen libera fuentes al cerrar/cambiar llamada o desactivar la preferencia. Los callbacks y resultados tardíos no pueden reactivar una llamada terminada.
- El puente registra códigos seguros de causa —host no registrado, acceso denegado, proceso terminado, protocolo inválido o conexión fallida— con contexto de llamada, sin exportar mensajes crudos o rutas personales.
- La falta de clave, captura, permiso o activación deja eventos explícitos. Chrome puede exigir que el usuario invoque la extensión sobre la pestaña: abrir el popup existente reintenta el preview sin añadir controles ni abrir la consola.
- El checkpoint final se solicita antes de reconciliar ingresos y el cierre espera el resultado del intento de entrega. Un resultado incompleto se registra como pendiente, no como exportación exitosa; la cola conserva el objetivo y lo reintenta mediante alarma.
- La lista acotada de campos temporales ISO mantiene fechas válidas; los teléfonos y el contenido hablado siguen saneados. El generador usa el timestamp válido del evento si el campo temporal histórico quedó corrupto y enumera las carencias reales.
- Los informes incluyen `captionDiagnosis` y `exportEvidence`: filas visibles, frescura nativa, preview iniciado, resultados/con texto, motivos, trigger de publicación y recepción del checkpoint. Una llamada puede tener informe completo y subtítulos fallidos: son estados distintos.

**Ventana nativa cerrada:** el interruptor encendido no es evidencia de texto accesible. La lectura nativa se usa si Chrome la expone; si desaparece o queda obsoleta, el respaldo independiente debe mantener el flujo sujeto a las capacidades/permisos reales del navegador. No se promete una interfaz interna de Chrome no comprobada.

### 11.4. Preparación de instalación

`extension/PREPARE-CAPTIONS.cmd` invoca `extension/native/prepare-caption-runtime.ps1` bajo la cuenta Windows normal de Chrome, sin elevación. Verifica nombre/versión e identidad de la extensión; ejecuta el registro existente que valida el hash del binario y confirma registro y origen permitido.

Se conserva `groq-secret.local.js` si existe. Si falta, se recupera el token cifrado del almacén existente de esa cuenta; si tampoco existe, se solicita mediante un prompt local oculto, nunca en chat. No se incluyen credenciales en el repositorio ni en el paquete. Presencia del secreto local no certifica que el proveedor acepte la credencial.

Preparar y recargar fuera de una llamada. Si Chrome rechaza la captura por falta de invocación, abrir el popup existente en la pestaña de Cloud Interpreter; el motivo debe figurar como `tab-capture-user-activation-required`.

### 11.5. Pruebas y compuertas

- Regresión del controlador y offscreen: preview sin sesión durable, serialización/reutilización, clave faltante, activación denegada, mute, permiso tardío, llamada consecutiva, micrófono denegado, limpieza al fin y ausencia de segmentos oficiales.
- Regresión de exportación: backlog de 450 eventos, caída del transporte, objetivo persistido, reinicio del worker, reanudación automática hasta recibir el checkpoint, preservación de fechas, redacción de teléfono y omisión del texto hablado.
- Batería heredada de llamadas, ingresos, micrófono, puente, transcriptor, observabilidad y recuperación; sin sustituir contratos funcionales por coincidencias de versión históricas.
- Chromium real en una página local con audio sintético: tres fragmentos del nuevo preview. Los tres se validaron mediante ffprobe y se decodificaron íntegramente mediante FFmpeg como audio Opus. Esta prueba no usa Groq, subtítulos nativos Windows ni Cloud Interpreter; NO se etiqueta como validación de llamada real.
- Integración continua ejecuta las nuevas regresiones y las existentes. Los resultados remotos de cada candidato se verifican antes de su integración.

### 11.6. Estado y aceptación pendiente

Corrección de código y validación controlada: disponibles en la candidata 0.10.30. El primer intento de publicación fue bloqueado por `403 Resource not accessible by personal access token`; no hubo mutación remota en ese intento. El operador corrigió los permisos del token y el segundo intento creó efectivamente la rama `fix/0.10.30-call-caption-runtime` desde `main@f728fb421fbf04c8de3315e23bf309e3eb3cb47c`. La integración requiere verificar las pruebas remotas y el estado efectivo de la solicitud de integración; crear la rama no equivale a integrar. Se verificó sintaxis del preparador y aplicador con PowerShell oficial, y el cálculo de identidad de la extensión; eso no acredita su ejecución en Windows. La prueba de funcionamiento en Windows + Chrome + Cloud Interpreter permanece **NO VERIFICADA** hasta una llamada posterior a instalar y preparar esta versión.

Para aceptación: texto bilingüe visible; cerrar/reabrir la burbuja nativa sin silencio permanente; atribución por fuente; mute respetado; ninguna mezcla entre llamadas; no obstrucción; y checkpoint publicado automáticamente sin pulsar exportación manual. El informe debe distinguir panel montado de texto recibido y especificar cualquier razón de bloqueo.

No se declara resuelto el reconocimiento real únicamente por YouTube, fixtures, compilación o ausencia de errores.


## 12. Reanudación autorizada — cotejo punto por punto

### Instrucción recuperada VERBATIM

> Era el token, not enia los permisos adecuiados. Intenta de nuevo, resolver conforme la instruccion que te di anteriormente, verbatim, punto por punto. Sin excepcion.

### Endurecimiento adicional previo a publicación

- Una solicitud de permiso de micrófono pendiente no bloquea la captura de pestaña, la cola de control ni la siguiente llamada. Los resultados tardíos liberan sus pistas si la llamada ya terminó.
- Un track terminado o un error de grabador libera el preview y registra su causa, para que el heartbeat pueda readquirirlo; no se reutiliza como activo un stream terminado.
- La apertura voluntaria de transcripción durable reserva la captura durante su arranque, evitando que un callback nativo readquiera el preview e interfiera con el token de audio solicitado por el popup.

| Exigencia del operador | Implementación/evidencia | Compuerta de aceptación |
|---|---|---|
| Subtítulos al cargar la llamada | Arranque por ruta/call-start; recuperación en heartbeat; preview sin consola | Texto en una llamada real posterior: NO VERIFICADO |
| Continuidad al cerrar el recuadro nativo con switch encendido | Nativo cuando expone texto; respaldo efímero independiente si no hay texto fresco | Cerrar y reabrir burbuja en Windows: NO VERIFICADO |
| Observabilidad útil para diagnosticar el bug | Eventos con llamada, fuente y motivo seguro; `captionDiagnosis`; resultados de preview sin texto hablado | Verificar informe de la versión instalada |
| Exportación automática cuando termina una llamada | Checkpoint antes de ingresos; drenaje hasta secuencia final y objetivo persistido/reintentos | Fixtures de caída/reinicio aprobados; recepción real posterior: NO VERIFICADA |
| Revisar si ya hubo exportación automática | Lote histórico `call-ended` identificado en §11.2 | Evidencia primaria disponible; no atribuir todo a la exportación manual |
| Usar informe y retroalimentación para el siguiente ciclo | Informe separa montaje, reconocimiento, transporte y aceptación; conserva causas accionables | No declarar diagnóstico operativo cerrado sin nueva evidencia real |
| Probar algo que no sea solo YouTube | Regresiones del controlador de llamada/offscreen; Chromium y audio sintético; suites remotas | Pruebas controladas no se rotulan como llamada real |
| Reducir probabilidad de fallo en uso | Mute verificado, serialización, permisos pendientes, tracks terminados, WebM independientes, resultados tardíos y aislamiento | Pruebas específicas aprobadas antes de integración |
| Resolver extremo a extremo sin simulación | Código, pruebas, documentación única, integración con compuertas, preparador e instalador con respaldo/reversión | Última aceptación requiere Windows + Chrome + Cloud Interpreter reales |

Sin cambios de diseño del panel, sin permisos nuevos del manifiesto y sin servicios residentes adicionales. Los pendientes de llamada real no se reclasifican como resueltos por superar pruebas automáticas.

## Anexo A — documento de implementación preexistente conservado

El documento anterior `docs/LIVE-CAPTION-OVERLAY-IMPLEMENTATION.md` se incorporó como anexo histórico en esta versión canónica. Su contenido refleja decisiones y estado de versiones previas; por ello no debe usarse como segunda fuente de estado actual. Esta sección es el lugar de preservación de ese registro histórico.

---

# Live Caption Overlay — implementación

**Repositorio canónico:** https://github.com/SeryMente/signal-interpreter
**Especificación canónica:** https://github.com/SeryMente/signal-interpreter/blob/main/docs/USER-REQUIREMENT-LIVE-CAPTIONS-OVERLAY-VERBATIM-20261008.md
**Versión objetivo:** 0.10.29 — Auto-recuperación del overlay y observabilidad de activación.
**Rama de trabajo:** feat/0.10.29-self-healing-overlay.
**Versión anterior integrada:** 0.10.24 — Overlay legible, desplazable y configurable.

## Evolución de usabilidad 0.10.24

La tarjeta compacta se sustituye por un panel de historial desplazable, con movimiento por arrastre del encabezado, redimensionado desde la esquina inferior derecha, ajuste por teclado y un control «Auto» que restaura el tamaño y la colocación automática. El posicionamiento automático puntúa ocho ubicaciones contra controles interactivos visibles. El alcance predeterminado es solo la pestaña de origen; la opción «Todas las pestañas web» distribuye la conversación a pestañas HTTP(S) mientras haya contexto de sesión. Las intervenciones se conservan en `chrome.storage.session`, no en almacenamiento local duradero; el historial se mantiene tras terminar una llamada y se limpia al comenzar una nueva o al cambiar de origen. La retención se limita a las 800 intervenciones más recientes y a 1.500 caracteres por intervención para mantenerse dentro del presupuesto de almacenamiento de sesión.

## Evolución bilingüe 0.10.25

- La ruta de la llamada puede activar un preview independiente del micrófono para capturar la voz del LEP en español además de los captions nativos del cliente. Su preferencia es liveCaptionInterpreterEnabled; nunca fuerza a habilitar el micrófono. El preview se detiene cuando el micrófono queda silenciado, el estado de mute no se verifica, el output reporta error o el usuario desactiva esta fuente.
- El preview del LEP y el preview de audio de pestaña usan fragmentos de audio de 1.8 s. La preferencia liveCaptionBilingualTabEnabled está activada por defecto y mantiene el audio de pestaña en paralelo con los captions nativos para recuperar el idioma que la fuente nativa no represente; al desactivarla, el preview de pestaña vuelve a usarse solo cuando el caption nativo queda obsoleto. La fuente nativa conserva prioridad en la continuidad de captions compatibles. El procesador revalida sesión, llamada, pestaña, mute y preferencias antes de publicar el resultado.
- El video de prueba TshOFzKQfG8 tiene una ruta distinta: desde el popup de la extensión, en ese video exacto, el usuario inicia/detiene la captura del audio de la pestaña. No se inicia el micrófono ni la captura si hay una llamada de Cloud Interpreter activa. Los fragmentos se envían al preview efímero y no al timeline durable ni a segmentos de llamada. Al navegar fuera del video, cerrar su pestaña o iniciar una llamada, la captura termina.
- El preview de YouTube dura mientras el usuario lo mantenga activo y usa segmentos de aproximadamente 1.8 s. La detección automática de idioma clasifica captions en inglés como CLIENTE y español como LEP y separa ambos canales para reducir fusión entre hablantes diferentes.
- live-caption-core.js reconoce patrones de teléfonos y direcciones en inglés y español. El overlay los convierte a nodos de texto seguros, sin interpretar transcripciones como HTML. Clic en teléfono/dirección copia el valor exacto; Ctrl+clic en una dirección abre Google Maps; Ctrl+clic en un teléfono abre una búsqueda literal; Ctrl+Mayús+clic sobre un término abre Linguee.
- El service worker valida el tipo de búsqueda y construye URLs para Google Maps, Google Search o Linguee; los términos se limitan a 180 caracteres. Las acciones solo se ejecutan por interacción directa del usuario.

## Corrección 0.10.26 — atribución basada en fuente

- En Cloud Interpreter, el flujo de audio de pestaña identifica al cliente y el preview del micrófono identifica al LEP. El idioma se mantiene como metadato lingüístico y no reemplaza la fuente de captura.
- El overlay representa el rol con `roleForSource(item.source, language)` y conserva la fuente durante la inserción y deduplicación de filas. Una intervención del cliente en español continúa siendo del cliente; una intervención del LEP en inglés continúa siendo del LEP.
- YouTube conserva una asignación separada explícita por idioma porque su captura de prueba es una sola pista de audio, no una pareja tab/micrófono.
- Pruebas de regresión: roles por fuente en ambos idiomas y auditoría estática para impedir que el idioma reasigne una fuente verificada.
- La validación automatizada no sustituye la prueba de llamada real en Chrome.

## Corrección 0.10.27 — atajos congruentes y copia fiable

- `Ctrl+clic` sobre un teléfono o dirección conserva su verificación externa; en texto ordinario no lanza ninguna búsqueda.
- `Ctrl+Mayús+clic` es el único gesto de búsqueda de términos en Linguee sobre texto ordinario. Esto alinea la conducta con las instrucciones visibles del encabezado.
- Se declara el permiso `clipboardWrite`, recomendado por Chromium para extensiones que utilizan `document.execCommand('copy')` como fallback cuando `navigator.clipboard.writeText` no está disponible o falla. Chrome puede mostrar la capacidad como permiso de modificación del portapapeles durante la instalación/actualización.
- La auditoría estática comprueba el permiso, el gesto combinado de Linguee y la ausencia de un manejador que dispare búsquedas con Ctrl+clic solo.


## Observabilidad de cierre 0.10.28

- La ruta de calificación emite `CALL_RATING_STARS_CONFIRMED` cuando se observa evidencia de estrellas visibles, con contadores estructurales acotados y sin guardar la puntuación.
- El evento final conserva vínculo a `callId`, ventana temporal, modalidad, duración observada/plataforma/facturable asumida, fuente de cierre y datos estimados de ingresos.
- La sincronización drena la secuencia hasta el checkpoint final en batches aceptados o mantiene el objetivo persistido y reintenta.
- El pipeline produce `observations/latest/latest-call-report.md` y `.json`, además de un índice e historial individual bajo `observations/call-reports/`.
- El informe combina una línea temporal acotada, señales técnicas permitidas, métricas de rendimiento/media, conteos por dominio y un inventario de evidencias ausentes. Audio, transcripciones crudas, credenciales y el ID bruto no se incluyen en el informe.
- La integración automatizada se valida con `tools/call-observability-report-test.mjs`; la primera llamada real posterior a instalar esta versión sigue siendo necesaria para validar la detección de estrellas, la telemetría del entorno y la entrega de extremo a extremo.

## Objetivo

Mostrar en Cloud Interpreter un panel propio, compacto y no intrusivo con las intervenciones que Chrome Live Caption reconoce cuando la burbuja nativa expone texto; al cerrarse la burbuja o quedar el texto nativo obsoleto, mantener el flujo mediante audio efímero de la pestaña y transcripción de baja latencia.

## Arquitectura mínima

### Fuente primaria

`extension/native/SignalInterpreter.CaptionHost.exe` lee mediante Windows UI Automation el árbol accesible de la burbuja nativa. El proceso comunica `status`, `caption` y `heartbeat` por Native Messaging. `live-caption-bridge.js` mantiene una ventana de frescura de 4.5 segundos, detecta texto estancado, notifica transiciones y reintenta conexiones con demoras acotadas. No se usa un selector DOM frágil para leer la ventana nativa.

### Fallback efímero

Audio de la pestaña → segmentos WebM de aproximadamente 2.8 s → Groq Whisper con detección automática de idioma → overlay.

El preview reutiliza la captura de audio de la pestaña que ya existe y mantiene un `MediaRecorder` de preview distinto del recorder durable. Cuando vuelve texto nativo reciente, el recorder de preview de la pestaña se detiene; si el texto nativo se queda obsoleto, el fallback se reactiva. No se abre un segundo preview del micrófono. Las peticiones se procesan con una sola operación activa y un único fragmento pendiente por fuente: los fragmentos intermedios son coalescidos, no acumulados sin límite. Los resultados se vuelven a validar contra la llamada, pestaña, sesión y preferencia actuales antes de mostrarse.

El preview no crea segmentos durables, no escribe el timeline/IndexedDB de las sesiones y no entra en el paquete de observabilidad. Los diagnósticos solo incluyen estados, códigos de razón, fuente y metadatos técnicos; nunca contenido de audio o texto hablado.

### Clasificación y continuidad

`live-caption-core.js` normaliza nombres/códigos de idioma conocidos a `en`/`es`; una etiqueta fiable prevalece sobre la heurística. Las frases muy cortas no se fuerzan a un idioma. El overlay combina actualizaciones progresivas, duplicados y solapamientos sobre la fila reciente compatible, en lugar de crear una línea por cada parcial.

### Presentación y ciclo de vida

`live-caption-overlay.js` crea un Shadow DOM cerrado dentro de Cloud Interpreter:

- `pointer-events: none` para no interceptar clics.
- `CLIENTE · ENGLISH` y `LEP · ESPAÑOL` con acentos visuales distintos.
- Actualiza los nodos de las filas en lugar de reconstruir el panel en cada fragmento.
- Evalúa ocho posiciones compactas contra rectángulos de controles interactivos visibles.
- Recalcula la posición al redimensionar, hacer scroll y cambiar `visualViewport`.
- Respeta `EFFECTIF_SCREENSHOT_PREPARE` / `EFFECTIF_SCREENSHOT_RESTORE`.
- Limpia el contexto al cambiar de llamada/pestaña, al cerrar la llamada o al reemplazar el runtime.

La preferencia `liveCaptionOverlayEnabled` detiene el overlay, el puente y el preview; al reactivarla durante una llamada válida, restablece el puente y el fallback. `liveCaptionOverlayScope` controla si las actualizaciones se distribuyen solo a la pestaña de origen (`source-only`, predeterminado) o a todas las pestañas web (`all-tabs`). El service worker aplica la preferencia y responde al saludo inicial del content script con el contexto actual y el historial de sesión.

## Distribución del host nativo

Los archivos adicionales permanecen en `extension/native/`: `SignalInterpreter.CaptionHost.exe.b64`, código C#, manifiesto de Native Messaging y scripts de registro/revocación. El registro materializa el ejecutable desde el payload incluido, valida su SHA-256 y registra el host bajo `HKCU`. No se instala un servicio, Scheduled Task, watchdog ni servidor localhost.

- SHA-256 esperado del ejecutable: `7526667D537E65840D3DDB68F25DCC7271C11CD5639B25C834ABEA15E4F56DB6`.
- SHA-256 normalizado esperado del fuente C#: `B6C9713E063CF1AAB24314810968954398D7A452B382CAD1012E3B91D67A1E33`.

## Observabilidad

El paquete más reciente inspeccionado en `main` se generó el 2026-10-09 a las 20:13 UTC e identifica la extensión 0.10.20, secuencia 5874. Contiene un único evento `TELEMETRY_MAINTENANCE`, sin errores/warnings en ese batch, y el manifiesto acumulado informa 414 errores de captura de screenshots. No demuestra reconocimiento de voz ni renderizado correcto del overlay. Esta observabilidad sirve para contextualizar actividad y rutas de plataforma, no para certificar Live Caption.

## Pruebas y evidencia

El PR #44 fue integrado en `main`. La descripción de la PR registra como aprobados:
- `signal-observability-audit`: pruebas de sintaxis, auditorías existentes, normalización/fusión, transición del puente y ciclo de vida del preview.
- `native-caption-host-build`: compilación Windows del fuente C#, smoke test de framing Native Messaging/apagado limpio y validación del hash del payload.
- Pruebas de reconexión con retroceso acotado (1 s, 2.5 s, 5 s) y de conservación del fragmento pendiente más reciente.

Commit integrado: `2607ff07107f1e1e4cf82b3ab6e8bb4516f0ba90`.
Estado de CI asociado al commit integrado: Vercel success. La suite de GitHub Actions registrada en la PR pasó en los commits de la rama antes de integrar.

## Limitación de validación real

No se ha ejecutado una llamada bilingüe real en esta sesión. Por tanto, permanece pendiente la comprobación operativa de: Live Caption ON, lectura nativa, cierre de la burbuja, continuidad vía Groq, reapertura y recuperación nativa, ausencia de duplicados molestos, controles sin obstrucción, ausencia de persistencia del preview y aislamiento de llamadas consecutivas. No se declara validado el reconocimiento de voz real sin esa prueba.

## Resultado

La versión 0.10.24 deja revisar el historial reciente mediante desplazamiento vertical, permite mover y redimensionar el panel y configura la visibilidad por pestaña de origen o en todas las pestañas web. La ubicación automática intenta minimizar el solapamiento con controles interactivos visibles y el host conserva `pointer-events: none`, con interacción explícita solo en los controles del propio panel.

La versión 0.10.22 había integrado el flujo primario/fallback en `main`. El flujo primario/fallback, el overlay y el host nativo están incluidos en la versión canónica. Para habilitar la ruta primaria en Windows, hay que ejecutar el script de registro incluido en `extension/native/register-caption-host.ps1` desde la carpeta materializada de la extensión; después, recargar la extensión y comprobar los permisos/captura necesarios para el fallback. Esta actualización se trabaja exclusivamente en GitHub; no se modifican instalaciones locales mediante RDC.

## Auto-recuperación de activación 0.10.29

- El core expone un predicado estricto de ruta Cloud Interpreter `/call/<ID>` (no incluye `/rate`), compartido por las pruebas y la recuperación.
- El overlay de subtítulos registra fallos de carga, bloqueos, intentos/errores del handshake, contexto aplicado, montaje, visibilidad y salud periódica. El primer saludo fallido usa reintentos con retroceso exponencial acotado; la ruta activa proporciona un fallback visual local mientras llega la reconciliación del service worker.
- Un vigilante ligero detecta cambios SPA y recupera el host si desaparece, queda desconectado o no se muestra. Los informes incluyen estados y métricas de renderizado acotadas, no contenido hablado.
- El contexto del service worker reconoce la ruta activa como evidencia de origen cuando el estado durable todavía está rezagado, evitando bloquear el panel solo por una carrera de reconciliación.
- El panel de ingresos añade un vigilante propio, independiente de los ajustes `autoAnswerEnabled` y `observationEnabled`. Comprueba la ruta cada segundo durante el runtime activo y registra activación, bloqueos, montaje exitoso/fallido, render y recuperación.
- El pipeline agrega las señales de ambos paneles en el grupo `overlayActivation` del informe individual; señales seleccionadas entran en `keySignals` con estado del host, Shadow DOM, visibilidad, intentos de recuperación y razón técnica.
- La regresión `tools/overlay-activation-regression-test.mjs` verifica el contrato de ruta, reintentos, diagnóstico, watchdogs y la inclusión de la evidencia en CI.

La comprobación estática y los fixtures automatizados no sustituyen la recarga de la extensión ni una llamada real en Chrome. Se requiere validar el primer informe de llamada posterior a la instalación de 0.10.29.


