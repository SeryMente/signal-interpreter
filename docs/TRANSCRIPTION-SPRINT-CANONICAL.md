# DOCUMENTO CANÓNICO ÚNICO — Sprint de transcripción y overlay de subtítulos

> **Autoridad documental:** este es el único informe canónico del esfuerzo/sprint de transcripción, Live Caption y overlay de subtítulos de Signal Interpreter. Las notas antiguas de implementación, los requisitos verbatim y las notas de versión son fuentes históricas o técnicas subordinadas; no son informes alternativos del esfuerzo.
> **Ruta canónica:** `docs/TRANSCRIPTION-SPRINT-CANONICAL.md`
> **Repositorio:** https://github.com/SeryMente/signal-interpreter
> **Última versión documentada:** **0.10.35 — Raíz cargable en Windows, laboratorio nativo aislado y calidad de vida**
> **Integración previa al ciclo correctivo:** [PR #52](https://github.com/SeryMente/signal-interpreter/pull/52)
> **Corrección previa de recuperación/exportación:** [PR #53](https://github.com/SeryMente/signal-interpreter/pull/53)
> **Integración histórica del alcance 0.10.32:** [PR #54](https://github.com/SeryMente/signal-interpreter/pull/54)
> **Hotloading histórico 0.10.33:** [PR #55](https://github.com/SeryMente/signal-interpreter/pull/55)
> **Corrección nativa exclusiva 0.10.34:** [PR #56](https://github.com/SeryMente/signal-interpreter/pull/56)
> **Estado de validación real:** no se afirma aquí que una llamada bilingüe real posterior a instalar 0.10.34 haya sido verificada. Las pruebas automatizadas/CI no sustituyen esa validación.

> **ALCANCE VIGENTE Y PREVALENTE (§§15–16):** la extensión es una mejora visual para interpretación telefónica (OPI): copia exclusivamente texto accesible de Live Caption nativo de Chrome. No captura audio de pestaña ni micrófono, no llama a Groq y no reproduce conversación. Las rutas de captura descritas en §§6–14 y el anexo son HISTORIA SUPERADA, no autorización vigente. Los controles de mute existentes permanecen independientes.

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

### Versionado y publicación comprobada

La solicitud [PR #53](https://github.com/SeryMente/signal-interpreter/pull/53) fue creada y recibió el commit `bb8bb5440102ab7e3df1335de6980a0ee9858888`. Para ese primer candidato 0.10.30 se verificaron `audit`, `compile-and-protocol-smoke-test` en Windows y Vercel con resultado success. El trabajo posterior se identifica como **0.10.31**, distinto del ZIP 0.10.30 ya entregado, para no atribuir a dos builds diferentes la misma versión de runtime. La integración se autoriza solo tras comprobar las compuertas del último head efectivo.

El arnés Node de audio no pudo resolver Playwright en el entorno reanudado. Se inventariaron las dependencias y se utilizó el arnés Python instalado, sin modificar el repositorio ni simular una repetición exitosa. Chromium real volvió a producir tres fragmentos del preview y FFmpeg volvió a decodificar los tres independientemente como Opus. No se usó una llamada real ni se certificó el servicio Groq.

La versión 0.10.31 y la preparación de su instalación conservan el criterio de aceptación real pendiente. Una integración en main y una preparación local exitosa NO son evidencia de subtítulos durante una llamada.

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

## 13. Alcance vigente — calidad de vida para interpretación telefónica

### 13.1. Aclaraciones del operador VERBATIM

> Otra cosa, perdon por interrumpir, pero todo lo que la exrtension registra es la salida de audio del navegador, en ese url de llamada, no registra mi entrada de microfono aun, no hemos llegado a esa parte. Seguimos en el mismo canal/pagina tu y yo al respecto?

> Si, es decir, necesito que comprendas el p`roposito. Yo soy interprete OPI, y ya utilizo subittulos automaticos de chrome para registrar la saluda de audio, lo que estoy implementando es calidad de vida. No quiero regresiones respecto a lo implementado, pero si puedes comprender el objetivo, podras resolver la solucion. Nos entendemos?

### 13.2. Propósito y corrección de alcance

El operador es intérprete telefónico (OPI) y ya usa los subtítulos automáticos de Chrome para leer el audio entrante. La extensión debe mejorar esa experiencia: integración discreta, continuidad al cargar la llamada y con el switch encendido aunque se cierre la burbuja nativa, historial, separación visual inglés/español y observabilidad que permita iterar sin adivinar. No se reemplaza un flujo nativo operativo por la promesa de un mock ni se amplía a capturar la voz del operador.

La interpretación anterior de micrófono como fuente del LEP fue incorrecta para este ciclo. 0.10.32 corrige tanto el preview efímero como la captura durable: solo solicitan la pista `chromeMediaSource: tab`. Ignoran solicitudes/preferencias antiguas de micrófono, rechazan chunks de fuentes ajenas a la pestaña antes de acceder al transcriptor y no muestran el control de micrófono como disponible. El micrófono de la plataforma y sus atajos/tonos/guardas de mute se conservan; la extensión no adquiere una pista nueva de micrófono para transcripción.

Los carriles CLIENTE · ENGLISH y LEP · ESPAÑOL se conservan para el audio entrante según el idioma observado, como solicitó el requisito original. Son una convención visual por idioma; no prueban identidad de hablante. Una mezcla de pestaña no permite afirmar que cada persona esté aislada ni que la fuente española sea el micrófono del operador.

### 13.3. Preservación sin regresiones

- Se mantienen montaje/recuperación del overlay, historial desplazable, posición/tamaño, alcance de pestaña, acciones de copia/búsqueda y aislamiento de llamadas.
- Se conserva el puente nativo como fuente preferente cuando Chrome expone texto accesible; switch encendido no demuestra por sí solo que Windows exponga texto con la burbuja cerrada. No se manipula el switch ni se fuerza la apertura del recuadro.
- Se conserva el respaldo efímero independiente por llamada, sus fragmentos WebM completos de 1.8 s y la recuperación de pistas terminadas. Chrome puede exigir invocación explícita para `tabCapture`; abrir el popup existente reintenta la adquisición, sin eludir permisos del navegador.
- Se conserva la exportación automática al cierre, independiente de reconciliación lenta de ingresos, con objetivo de secuencia persistente y reintento si GitHub no confirma entrega. La observabilidad distingue checkpoint entregado, envío automático/manual y errores específicos; no contiene audio ni texto hablado.
- `captionDiagnosis.captureScope` solo dice `tab-only` cuando lo observa en eventos correlacionados; en paquetes históricos sin evidencia queda `not-observed`, no se inventa alcance retrospectivo.

### 13.4. Evidencia y compuerta final

Pruebas causales: preferencias de micrófono activadas, solicitud `micEnabled:true`, mute ON/OFF, preview independiente y captura durable producen únicamente pista de pestaña; los chunks de micrófono son rechazados antes de procesamiento. Los tests preservan controles de mute de la plataforma y carriles bilingües.

Chromium real, sobre audio sintético local: tres fragmentos actuales independientes decodificados con ffprobe/FFmpeg como Opus; el arnés aborta si se solicita una fuente no tab. Esto prueba estructura de audio y exclusión de micrófono, **no** reconocimiento de una llamada real ni lectura de subtítulos Windows.

El parser de PowerShell verifica scripts de preparación/registro/aplicación y la identidad original de la extensión. La batería local completa de 24 suites y auditorías aprobó en este ciclo; también aprobaron la decodificación de los tres WebM y el parser/identidad PowerShell. Las compuertas Linux/Windows del commit publicado deben aprobarse antes de integrar. No se altera `main` con una compuerta fallida.

**Aceptación operativa aún NO VERIFICADA:** primera llamada real en Windows/Chrome/Cloud Interpreter después de instalar 0.10.32, burbuja abierta/cerrada con switch ON, subtítulos de ambos idiomas, ausencia de obstrucción/duplicados, continuidad tras cambio de llamada y publicación automática del informe con estados actuales. No se declara esta prueba ejecutada por fixtures, YouTube ni compilación remota.

## 14. Hotloading durante llamada — preparación segura del escritorio

### 14.1. Instrucción del operador VERBATIM

> Alista la extension en el escritorio, pero antes dale capacidades de hotloading por que estoy en llamad,a yt que si funcione, garantizala.

### 14.2. Evidencia del equipo y hueco encontrado

Inspección autorizada por Desktop Commander Remote, PC-8, sin cerrar Chrome ni navegar la llamada: la carpeta registrada por Chrome Profile 3 es `C:\Users\PC 8\Desktop\Entorno Persistente\signal-interpreter`; el manifiesto en disco informa 0.10.31. No se encontró registro del host en las cuatro ubicaciones HKCU/HKLM, 32/64 bits comprobadas. No existían el archivo local de llave Groq ni el almacén DPAPI esperado; esto **no demuestra ausencia de una llave en chrome.storage**, cuyo contenido no se leyó ni se exportó. No había archivo DevToolsActivePort; no se reinició Chrome para crearlo.

El código anterior reinyectaba el runtime de llamada pero no `live-caption-core.js` / `live-caption-overlay.js`. Además, podía anunciar recuperación de captura tras ignorar un resultado `ok:false`. Estos huecos invalidaban una promesa de hotloading operativo del panel.

### 14.3. Corrección 0.10.33 y compuertas

- Reinyecta explícitamente núcleo + overlay en la pestaña Cloud existente, sin navegar ni recargar la página, reiniciar Chrome o crear una segunda llamada.
- Espera inicialización asíncrona y consulta `SIGNAL_CAPTION_OVERLAY_PROBE`: exige versión actual y host montado cuando corresponde. Panel viejo/ausente no equivale a recuperación. La preferencia de overlay desactivado se respeta.
- Cada runtime del overlay dispone sus timers, listeners y MutationObserver antes del reemplazo; los callbacks tardíos no resucitan el panel. Contextos invalidados se desmontan. El historial se rehidrata desde la sesión y no se duplica el panel.
- Antes de la recarga coordinada en llamada, comprueba pestaña de llamada válida y una vía de captions nativa fresca o respaldo Groq configurado; si faltan, queda bloqueada y preserva el runtime vigente. Configuración de Groq no equivale a credencial aceptada ni permiso tabCapture vigente.
- Persiste la identidad/contexto de llamada antes de recargar exclusivamente la extensión. El éxito de recuperación durable exige resultado `ok:true`, no solo ausencia de excepción. Captura de micrófono sigue excluida.
- Diagnósticos de reinyección/probe/recuperación se publican como metadatos de llamada, nunca como texto hablado o audio. La herramienta de prueba nativa conserva únicamente conteos/estados y termina exclusivamente el proceso que ella inicia.

### 14.4. Pruebas y distribución

La regresión ejecutable prueba reinyección, espera de inicialización, rechazo de panel viejo/ausente, preferencia desactivada, persistencia previa a recarga y bloqueo sin vía de recuperación/pestaña válida. Chromium real sobre una página local simulada prueba un único host/listener, hidratación de historial, desmontaje sin resurrección y limpieza al invalidar el contexto. No es una llamada real ni una prueba de reconocimiento de voz.

La distribución durante una llamada se prepara en una carpeta independiente del escritorio. No se sobrescribe silenciosamente la carpeta cargada por Chrome ni se mezcla código de dos versiones. El aplicador clásico conserva la negativa a reemplazar con Chrome abierto; preparar la carpeta/host no equivale a cargarla. No se solicitan secretos en chat ni se modifica la captura del micrófono.

**Compuerta de garantía:** no se garantiza funcionamiento en vivo solo por pruebas, archivos preparados o registro del host. La activación real y el primer informe automático deben demostrar versión nueva, overlay montado, fuente de captions operativa y continuidad de la llamada. Sin esa evidencia, el estado es PREPARADA / ACTIVACIÓN EN CHROME NO VERIFICADA. Se preserva la llamada del operador por encima de forzar una prueba disruptiva.

### 14.5. Resultado de preparación real y bloqueo vigente

En PC-8 se materializaron ZIP y carpeta independiente `Desktop\Signal-Interpreter-0.10.33-hotload-370da87c\extension`, con versión/identidad y 41 hashes de payload verificados. El ZIP original tiene SHA-256 `370da87cdbf740d857b718421f4696d03980e51482f144abb431a382b25817d6`. La carpeta registrada anteriormente conserva manifiesto 0.10.31; esto no identifica por sí solo la versión del runtime que Chrome tiene en memoria.

La preparación del host abortó antes de registrar por token administrativo de Desktop Commander. Un intento de delegación mediante Shell.Application también devolvió `NORMAL_USER_REQUIRED`: `Prepared=false`, `NativeHostRegistered=false`, `NormalChromeUserVerified=false`. No se declara una prueba nativa en PC-8 ejecutada. No se relajó la compuerta ni se reinició Chrome, recargó la página o sobrescribió la carpeta anterior. La razón interna por la que el broker conservó elevación no se infiere.

Se incluye `tools/prepare-caption-device.ps1` para ejecutarse desde la cuenta **realmente no elevada** del usuario de Chrome. Verifica identidad del usuario/proceso, versión, identidad de extensión, hashes, registro y protocolo; escribe únicamente un resultado de metadatos en la carpeta preparada. No solicita Groq en texto, no exporta transcripciones y no activa automáticamente la extensión. La preparación nativa y posterior activación quedan pendientes de esa sesión normal y evidencia real, no de más intentos administrativos.

Evidencia aprobada de este ciclo: 25 suites/auditorías locales, fixture Chromium real de reinyección/limpieza/hidratación y controles Linux/Windows del primer commit publicado. El helper adicional y el canon actualizado requieren las compuertas del commit final antes de integración. El límite de cuota de Vercel permanece externo; no cambió el servicio alojado ni se afirma un nuevo deploy.

## 15. Corrección 0.10.34 — contrato nativo exclusivo ratificado

### 15.1. Retroalimentación e instrucción del operador VERBATIM

> Cargué la extensión y sin embargo, el problema que encontré fue que al parecer pareciera como si se escuchara un eco en cuanto carga la extensión. De alguna manera no está registrando nada más el contenido del live caption nativo de Chrome, tal y como era la especificación, hacia el overlay, sino que por algún motivo que no entiendo, está reproduciendo un duplicado de lo que se dice y creo que incluso de lo que yo dijo, porque llegué a ver mis propias palabras en el live caption y eso es una anomalía. Entonces, revísalo. Otra cosa es que de hecho, en cierta parte dejó de mandar el contenido del live caption al overlay. Entonces, no está lista. No aparece el contenido en el overlay y se escucha un eco de lo que se está diciendo. Revísala por completo y entrégala.

> Antes de que continues quiero saber si si entiendes el alcance

> Correcto, entrégala con lo más pulida que puedas, resuelve de extremo a extremo, no te detengas hasta terminar.

Alcance explicado por Samantha y confirmado por el operador: SOLO texto de Live Caption nativo; sin captura de pestaña/micrófono, transcripción Groq, replay ni fallback silencioso. No alterar audio, controles de llamada ni mute por la función de captions. Preservar carriles bilingües, historial, copiar/buscar, posición/tamaño, aislamiento, hotloading y observabilidad automática sin voz/texto crudos. Burbuja cerrada se intenta solo si Chrome expone su texto; si no, declarar esa limitación en lugar de sustituirlo por audio. YouTube/página sintética no son aceptación en vivo.

### 15.2. Hallazgos y correcciones causales

- El offscreen anterior enlazaba createMediaStreamSource con destination, reproduciendo audio capturado de pestaña. Es una ruta compatible con el eco descrito, NO una reproducción causal certificada en PC-8. Ver palabras propias en Chrome no demuestra por sí solo captura física del micrófono.
- Se eliminan getUserMedia, MediaRecorder, createMediaStreamSource, tabCapture y llamadas de transcripción del flujo activo; permiso tabCapture y endpoint Groq también desaparecen del manifiesto. Mensajes heredados de captura son rechazados antes de consumir audio. Solo permanecen osciladores breves para avisos de mute preexistentes; no son audio de conversación.
- Al arrancar, se cierra una vez el offscreen heredado y se fuerza estado de captura deshabilitado. Las actualizaciones del overlay requieren source=chrome-live-caption y native=true; se filtra historial sintético previo y se elimina el adaptador YouTube del runtime activo. No se solicita secreto Groq.
- El puente abandonaba reconexión tras cuatro intentos: ahora continúa con retroceso limitado a 10 s mientras la llamada siga activa. Un watchdog de heartbeat a 15 s libera un puerto congelado y recupera; callbacks de puertos/llamadas antiguas son descartados. stop limpia timers/puerto y preserva historial de fin de sesión.
- El host nativo ya no descarta una ventana/nodo de subtítulos únicamente por IsOffscreen. Lee exclusivamente la ventana Chrome con título de Live Caption reconocido y descendientes Text/Document que Windows realmente expone; visible=false no significa texto inexistente.
- El estado del panel distingue host no registrado, conexión, texto no expuesto, ventana sin texto y obsolescencia. Una conexión o montaje sin texto no se anuncia como captions funcionales.

### 15.3. Observabilidad y preparación

Se conservan checkpoint final, drenaje por secuencia confirmada, retry persistente y exportación automática independiente del cálculo de ingresos. Los eventos tardíos de llamadas cerradas actualizan su informe sin crear informes antes del cierre ni duplicados. captionDiagnosis añade alcance nativo observado, conteo de fragmentos encaminados y motivos de fallo; no inventa captions a partir de rowCount/montaje. Los informes distinguen entrega automática/manual y no incluyen audio, texto hablado ni IDs crudos de llamada. La descarga manual de la consola se limita también a metadatos; la consola conserva sesiones históricas/notas, no promete grabación ni captions nuevos fuera del overlay. El conteo nativeTextForwarded prueba encaminamiento desde el worker, NO recepción/render confirmados; se coteja por separado con salud/rowCount del overlay.

PC-8 no respondió a la llamada ping del conector: Timeout - no response from device. No se reintentó una operación pendiente ni se afirma instalación 0.10.34, registro, hotload físico o prueba en vivo. La última inspección efectiva no encontró host registrado. La preparación permite únicamente registro HKCU del mismo usuario Windows que Chrome, comprobado por SID; no solicita elevación, impersona cuentas ni instala servicios. El guard anterior basado solo en pertenencia a Administrators se reemplaza por identidad real, sin eliminar la verificación de usuario.

La carpeta de entrega tiene manifest.json EN SU RAÍZ para evitar el error anterior de seleccionar un padre sin manifiesto. Se prepara en carpeta independiente; no sobrescribe la versión cargada ni reinicia/navega la llamada.

### 15.4. Pruebas y compuerta real

Evidencia local: 26 suites/auditorías aprobadas, además de sintaxis JavaScript, parser PowerShell y fixture Chromium real. El digest del binario compilado es `313CCD3312A8C75131EC7C4ADFEBF883B028BCE8AEE8B1EA43BD4DDDBB202EFE`; fuente normalizado `1891B4D51F38F366116DD2B3E31C6352C3FD065580D56544B1C0E7321316890D`. La integración requiere los controles Linux/Windows del head final.

Pruebas funcionales con APIs de audio envenenadas: cero invocaciones incluso con mensajes/preferencias heredadas; cierre de offscreen una sola vez ante callbacks concurrentes; inicio/fin/cambio de llamada y preferencia desactivada. Reconexión más allá de cuatro intentos, timeout y rechazo de callbacks tardíos. Regresiones conservan controles de mute/atajos, ingresos, historial, búsquedas y exportación/privacidad.

Chromium real local comprueba hidratación solo nativa, rechazo de fila no nativa, hotloading con un solo panel/listener y limpieza de contexto sin navegar la página; no es una llamada Cloud Interpreter real. El fuente C# y payload se compilan/sincronizan en Windows antes de distribuir; ambos hashes se validan. Compilación y protocolo no demuestran acceso a captions con burbuja cerrada en el Chrome del operador.

**Límite técnico y aceptación NO VERIFICADA:** switch ON no garantiza que Chrome conserve la ventana accesible al cerrar la burbuja. Si Chrome elimina ese árbol, esta solución no puede recuperar texto de un objeto inexistente y NO introduce audio como sustituto. Pendiente: extensión nueva cargada en PC-8, texto inglés/español nativo visible/oculto realmente recibido, ausencia de eco, aislamiento de dos llamadas y primer informe automático de cierre de esta versión. No se emite garantía de funcionamiento en vivo sin esa evidencia. La instrucción de completar no autoriza simularla.

## 16. Distribución portable y calidad de vida 0.10.35

### 16.1. Instrucciones del operador — VERBATIM

> Añadele una manera de probar el servicio, para c uando tenga que probar un resultado, como este que me entregas, pero que no vaya a tomar llamadas .
>
> La pregiunta es ,e sposible replicar las condiciones importantes de replicar de la situacion de llamada en CloudInterpreter en un ejemplo, para que el ejemplo si funcione como se necesita?
>
> Te doy una grabacion de llamada de Interpretacion? Y que se reproduzca en el navegador? O como le podemos  hacer?

> Bien. Mientras que sea facil de implementar, y ubicuo a cualquier coomputadora,  y facil de instalar, lo que pasa es que me mueve entre tres ubicacioens todo el tiempo como nomada digital.

> El repo almacena el paquete. Entiendes? Descargo el Repo y puedo usar un archivo de instalacion en la carpeta raiz de la carpeta qeu resulta de la descompresion. Ademas ,la carpeta raiz, es la extension como tal, la cual puede ser ubicada desde chrome como directorio raiz de la extension descomprimida. Es posible que sea asi como digo? Que el zip que descomprimo de githubn, al descomprimirlo de por resultado la carpeta raiz desde donde carga chrome la extension co nel manifiesto etc. ? MacOS o linux no son parte del alcance.

> Bueno, ejecuta, y resuelve de extremo a extremo. Pero por favor, no ocasioens regresioens.
>
> Sagbes, ademas, hay un competidor que esta tratando de hacer lo mismo que yo, y que tiene una UI muy pulida y muy bien desarrollada. Al parecer le metio dinero a la UI y a la experiencia estetica.
>
> Yo quiero competir con el. SIN BLOATING, y sin añadir nada que no necesite y que uya este planeado.
>
> Necesito que pulas todas las asperezas y los bordes de la ui, me explico?
>
> EDIT: Otra cosa, mis informes me dicen que el competidor es un maestro en algo que se le denomina: Calidad de vida para el usuario de herramientas dfe software. Y que el cliente esta muy feliz por ese lado.

La competencia se considera una motivación de calidad de vida declarada por el operador, no evidencia de prestaciones verificadas de un producto no identificado. No se añade roadmap, dependencia visual, tema, capturador, servicio o tablero paralelo.

### 16.2. Una distribución, una raíz

El ZIP fuente del repositorio es el paquete. Dentro de la carpeta extraída están `manifest.json`, `INSTALAR.cmd`, `INSTALAR.ps1`, `PROBAR.cmd`, `PROBAR.ps1` y `payload-sha256.json`; esa MISMA carpeta es la que se carga en Chrome. El runtime permanece organizado bajo `extension/`; no hay segundo manifiesto allí. Recursos de background, popup, offscreen, reinyección y content scripts resuelven desde la raíz real. La clave mantiene el identificador `ldpbjhobnfgmhdoehehdmnbhhjckebmj` y no se amplían permisos de captura.

`.gitattributes` excluye observaciones, diagnósticos históricos y workflows de los archivos fuente instalables mediante export-ignore, sin eliminarlos del repositorio. El ZIP real generado por GitHub fue descargado e inspeccionado: manifiesto raíz presente y observaciones excluidas. La validación remota de huellas detectó normalización de CRLF en los dos cmd; la serialización preserva los bytes de texto originales, sin debilitar la compuerta. Una segunda causa quedó reproducida: git archive con core.autocrlf=true alteró 41 payloads en Windows; * -text conserva los bytes, con cero diferencias en el mismo fixture. El control Windows ejecuta el instalador mediante Windows PowerShell 5.1, no únicamente el parser de PowerShell moderno. La instrumentación temporal de diagnóstico fue retirada tras obtener la causa; las compuertas permanecen. No se comete otro ZIP ni una copia del runtime. Las huellas de los 50 archivos de distribución se validan antes de registrar el host; se evita la envoltura de arrays que falló en Windows PowerShell 5.1.

### 16.3. Instalación Windows, sin runtime de desarrollo

1. Descargar y extraer el ZIP del repositorio a una carpeta estable y escribible. No moverla después de cargarla.
2. Fuera de una llamada/prueba, abrir `INSTALAR.cmd`: valida identidad/huellas; materializa el host incluido; registra bajo HKCU del mismo usuario de Chrome; verifica protocolo; genera una muestra de voz con SAPI si existe. No requiere Node, Python, compilador, clave Groq, elevación ni descargas adicionales. Los paquetes de voz/modelos de Chrome dependen del equipo y no se dan por disponibles.
3. En Chrome, cargar como extensión descomprimida la carpeta que contiene el manifiesto raíz. Esta aprobación de Chrome es manual; el instalador no la simula ni fuerza instalación mediante flags. No mantener activa simultáneamente otra copia de Signal Interpreter.
4. Activar Live Caption y abrir **Probar** en la cabecera del popup. `PROBAR.cmd` ofrece el mismo laboratorio cuando identifica inequívocamente el perfil que cargó ESTA carpeta; si no puede, indica usar el popup y no abre otra cuenta.

El instalador no mata Chrome ni puentes ajenos, no reinicia llamadas, no instala servicios/tareas/watchdogs ni usa rutas de usuario fijas. Si un puente está en uso, se detiene antes de cambiar registro. Conserva respaldo y restaura manifiesto/valor previo si falla registro/protocolo. `INSTALACION-RESULTADO.json` separa preparación verificada de carga de extensión y llamada real NO VERIFICADAS. Cambiar de computadora requiere registrar el puente y cargar la carpeta en cada usuario Windows; no se promete sincronización de Chrome ni configuración financiera entre equipos.

### 16.4. Laboratorio sin llamadas y sin subtítulos fabricados

La página propia `extension/ui/lab.html` usa un reproductor HTML normal con muestra generada localmente o archivo autorizado elegido por el usuario. No abre micrófono, tabCapture, MediaRecorder ni Groq. Ese audio de prueba es deliberado y solo suena al reproducirlo; el flujo de producción continúa sin reproducir conversación.

Recorrido: **audio local en Chrome → Live Caption nativo → MISMO host Windows/puente → MISMO core y overlay**. No hay transcripción simulada ni adaptador YouTube. Pausar otros audios ayuda a evitar atribución accidental de captions globales. No se necesita entregar una grabación real; si se usa una, debe estar autorizada y sin información sensible innecesaria.

El laboratorio requiere su propia página de extensión como emisor autenticado, bloquea arranque ante cualquier pestaña Cloud Interpreter o llamada activa, y pone una compuerta local antes del clic real de respuesta automática sin cambiar la preferencia del usuario. Si se abre la plataforma durante una prueba, detiene puente/audio y conserva el bloqueo hasta **Finalizar** explícitamente. Recuperación tras suspensión mantiene la misma guardia. No genera ingresos, eventos/exports de producción ni historial de llamadas; su layout tiene clave independiente y las filas solo viven en memoria.

**Finalizar y exportar** o fin del audio generan un informe de metadatos y solicitan descarga automáticamente. El último informe también queda guardado para **Descargar último informe**. Cerrar abruptamente la pestaña puede impedir una descarga inmediata: el worker conserva el informe recuperable al reabrir; no se anuncia una descarga completada sin comprobarla. El informe distingue captions nativos observados, filas/host, conexión, motivos y ausencia de evidencia; excluye audio/texto hablado. Cero filas/captions nunca producen resultado aprobado. El cierre automático de llamadas reales y su retry existentes se conservan por separado.

### 16.5. Pulido acotado y prevención de regresiones

- Probar accesible desde la primera pantalla del popup, sin buscar controles enterrados.
- Tipografía, espaciado, foco de teclado y botones legibles; contraste sobrio y semántica de riesgo/estado conservada. Sin animaciones, gráficos o adornos ajenos al trabajo.
- Panel de captions con acciones mayores, guía corta con atajos completos en tooltip; texto/tiempos legibles, sin alterar fusión, idioma, búsqueda/copia ni algoritmos de posición.
- El laboratorio ancla el mismo renderer en una región reservada para no tapar instrucciones; movimiento/redimensionado continúan en la llamada real, no en la región de prueba.
- Panel de ingresos: controles y cifras más legibles, botones amplios y estado compacto conservado; cálculos/periodos/monedas y generación de gráficas intactos.
- Contraer conserva controles visibles; Auto restaura layout. Historial/notas conservados; los controles no desaparecen a ancho estrecho y el origen no se recorta silenciosamente.
- Mensajes distinguen instalación, conexión, texto y renderizado; indican recuperación concreta sin anunciar éxito por apariencia.

### 16.6. Niveles de prueba y límites de aceptación

Evidencia local comprobada: 28/28 suites aprobadas; Chrome for Testing cargó raíz/popup, abrió/cerró el laboratorio, descargó el informe sin captions simulados y bloqueó el arranque con plataforma abierta. Una segunda prueba con audio local ordinario confirmó la descarga automática por media-ended y origen local-file, sin fabricar texto nativo. El caso de recuperación con plataforma se comprueba por regresión adicional del mismo módulo. Las suites locales incluyen 26 regresiones existentes y dos nuevas: raíz/payload e aislamiento/privacidad/ciclo del laboratorio. El workflow Windows prueba ZIP fuente, instalación, identidad, hashes y protocolo del host; la compilación/framing existentes permanecen. El fixture Chrome real carga el manifiesto raíz, abre el laboratorio y comprueba ciclo/descarga/aislamiento. En Linux no dispone del host Windows: la ausencia de texto se declara, jamás se convierte en captions de prueba.

La revisión visual cubre popup, laboratorio, historial y panel contraído/expandido en desktop y 390px. No certifica UI Automation ni una llamada real. El laboratorio replica el recorrido compartido de captions, pero no la autenticación, WebRTC, cambios de ruta, terminación ni particularidades de Cloud Interpreter; esas compuertas requieren su plataforma real. Que el switch esté encendido no obliga a Chrome a conservar el árbol accesible con la burbuja cerrada. Sin texto accesible se informa el bloqueo; no se agrega fallback de audio.

**Aceptación operativa todavía NO VERIFICADA:** primera reproducción nativa en el Windows del operador, visible/oculta, y primera llamada posterior con ausencia de eco, continuidad y observabilidad automática. No se garantiza ausencia absoluta de fallos ni se declara lista en vivo por pasar un fixture. La evidencia final de integración debe cotejar el head final de la propuesta y su versión raíz.

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


