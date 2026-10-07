# Matriz de cobertura de observabilidad

**Sprint:** SPRINT-OBSERVABILITY-AUTOOBSERVATION-01  
**Versión del modelo:** v1  
**Repositorio:** SeryMente/signal-interpreter

## Objetivo de la matriz

Esta matriz define qué debe observar Signal Interpreter, dónde se observa, qué evidencia debe conservarse y cómo se valida que la señal realmente llega al paquete de observabilidad sincronizado.

| Área | Señal requerida | Fuente | Evidencia persistente | Frecuencia/trigger | Estado objetivo |
|---|---|---|---|---|---|
| Runtime | inicio, suspensión, actualización, límites de versión | background | evento estructurado | lifecycle | Cubierto |
| Errores | excepción, rechazo, timeout, fallo de API | background/content/reporter | evento + error contextual | inmediato | Cubierto |
| Navegación | URL, ruta, cambio de query keys, navegación SPA | content + tabs | URL event + surface snapshot | por cambio; sondeo 1 s | Cubierto |
| DOM/HTML | estructura, tags, atributos estructurales, roles, relaciones | content | platform surface snapshot | cambio/debounce | Cubierto |
| CSS | stylesheets, medios, conteo de reglas, presencia de inline styles | content | platform surface snapshot | cambio de superficie | Cubierto |
| JavaScript | scripts, módulos, defer/async, integridad, longitud inline | content | platform surface snapshot | cambio de superficie | Cubierto |
| Recursos | URL normalizada, initiator, duración, bytes, protocolo | content + webRequest | snapshot + network window | carga/red | Cubierto |
| Framework | indicios de React/Next/Vite/Vue/etc. | content | framework hints | snapshot | Cubierto |
| UI | botones, enlaces, campos, headings, diálogos y estados | content | snapshot + interacción | mutación/interacción | Cubierto |
| Llamadas | entrada, conexión, ruta, fin, rating, fallback | content/background | eventos y estado | por transición | Cubierto |
| Hangup | interacción con End call y ruta posterior | content | CALL_END_CONTROL_INTERACTION + CALL_END_CLICKED + route | interacción | Cubierto |
| Disponibilidad | online/offline/unknown | content/background | eventos + estado reconciliado | cambio/heartbeat | Cubierto |
| Performance | navigation timing, long tasks, layout shift, memoria, recursos | content | heartbeat estructurado | heartbeat | Cubierto |
| Red | solicitudes y respuestas al dominio autorizado | background | ventanas agregadas y errores | 15 s | Cubierto |
| Persistencia | DB writes/errors, spool, publicación, retries | background/reporter | health + eventos | continuo | Cubierto |
| Sincronización | recepción, publicación Git, fallback, backlog | reporter | health + batches | <=30 s objetivo + sweep | Cubierto |
| Recuperación | watchdog y reinicio | Windows task/reporter | health + watchdog log | cada 2 min / ante fallo | Cubierto |
| Delta | cambios semánticos entre superficies | reporter | platform-deltas | por superficie nueva | Cubierto |
| Privacidad | redacción de secretos y exclusión de audio/texto crudo | todos | flags privacy + scrubber | siempre | Cubierto |
| Integridad ética | observación read-only y connect-only validado | content | PLATFORM_INTEGRITY_CHECK | startup/call/heartbeat | Cubierto |

## 1. Contrato de una observación de plataforma

Una observación de superficie debe incluir, cuando sea aplicable:

- \`schema\`: \`signal-interpreter-platform-surface/v1\`
- \`page.origin\`
- \`page.url\` normalizada
- \`page.path\`
- \`page.route\`
- \`page.searchKeys\`
- \`page.hashPresent\`
- \`page.title\` sanitizado
- \`page.nodeCount\`
- \`dom.tagCounts\`
- \`dom.elements\`
- \`controls\`
- \`css\`
- \`javascript\`
- \`resources\`
- \`metadata\`
- \`frameworkHints\`
- \`privacy\`

No debe incluir código fuente PHP/server-side ni contenido privado que el navegador no haya expuesto o que no sea necesario para el diagnóstico.

## 2. Reglas de suficiencia

Una señal se considera cubierta cuando:

1. Existe un productor claramente identificado.
2. Tiene un trigger verificable.
3. Está estructurada.
4. Tiene timestamp y contexto suficiente.
5. Llega a IndexedDB o persistencia local equivalente.
6. Está incluida en un batch sincronizable.
7. El reporter puede reconstruir o consultar la evidencia.
8. Existe una prueba o guard que detectaría su desaparición.

La ausencia de una señal debe ser distinguible de la conclusión «la señal no ocurrió».

## 3. Huecos explícitos

La matriz no afirma capacidades que el navegador no puede proporcionar directamente.

En particular:

- no se obtiene código fuente PHP u otro server-side privado;
- no se obtienen secretos;
- no se pretende enumerar rutas que el usuario no visite;
- no se obtiene audio o transcripción cruda como mecanismo general de observabilidad;
- una API o evento que no sea observable desde el navegador permanece como desconocido, no como falso.

## 4. Objetivo de cobertura

El objetivo del sprint es que cualquier bug que ocurra durante el uso real deje una cadena de evidencia suficientemente rica para reconstruir:

**estado de extensión → contexto de pestaña → URL → superficie de plataforma → evento → consecuencia → recuperación/fallo → publicación.**

La cobertura se revisará nuevamente cuando aparezcan nuevas capacidades de Signal Interpreter o nuevos patrones observables en Cloud Interpreter.
