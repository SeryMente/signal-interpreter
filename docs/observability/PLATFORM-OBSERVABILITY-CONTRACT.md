# Contrato de observabilidad de plataforma — Chrome/Windows

**Estado:** propuesta de ingeniería para revisión; no es una release ni autorización para capturar contenido.
**Fecha:** 2026-10-22
**Repositorio:** `SeryMente/signal-interpreter`
**Ámbito:** contrato de diseño para la observabilidad de Chrome/Windows. La implementación existente tiene como superficie operativa canónica Cloud Interpreter; ChatGPT es un perfil futuro separado que requiere revisión explícita de permisos, origen, privacidad y pruebas. Este documento no amplía por sí solo la allowlist de sitios.

## 1. Propósito

Construir una base verificable para que una extensión pueda describir qué expone una aplicación web, cómo cambia su interfaz, qué controles y capacidades están presentes y qué resultados visibles siguen a una acción autorizada. La observabilidad debe facilitar después el desarrollo de herramientas de gobierno del uso del modelo en ChatGPT, sin acoplar el núcleo a selectores frágiles ni convertir inferencias en hechos.

Este contrato define el plano de observación. No afirma que todas las capacidades descritas estén implementadas.

## 2. Límites de observación y privacidad

La extensión solo puede observar datos a los que tenga acceso legítimo en el navegador y para los que el usuario haya autorizado la finalidad concreta.

- **Contenido visible:** el texto de conversaciones puede ser dato personal o sensible. La captura de contenido debe estar desactivada por defecto, tener consentimiento explícito por sitio/sesión, indicar claramente su estado y ofrecer pausa, exportación y borrado.
- **Razonamiento interno:** no afirmar que se registra el razonamiento oculto del modelo. La extensión puede registrar la respuesta visible, las acciones del usuario, las herramientas visibles y metadatos de ejecución expuestos por la interfaz. No debe intentar extraer cadenas de pensamiento ocultas, acceder a endpoints privados ni eludir controles de la plataforma.
- **Telemetría por defecto:** eventos de ciclo de vida, identificadores efímeros, URL saneada, huellas, conteos, latencias y deltas estructurales. No incluir texto de conversación, prompts, respuestas, cookies, tokens, cabeceras de autenticación, formularios ni contenido de campos por defecto.
- **Minimización:** no enviar datos a GitHub, relay ni otro servicio remoto salvo que exista un modo explícito de publicación, con vista previa saneada y confirmación. Los datos de sesión permanecen locales por defecto.
- **Redacción antes de persistir:** eliminar query strings y fragmentos no necesarios, credenciales, identificadores de cuenta, nombres de perfil, teléfonos, correos y valores de formulario. El saneamiento se ejecuta antes de escritura, no solo al exportar.
- **Separación de planos:** la telemetría técnica y el archivo de conversación, si el usuario lo habilita en el futuro, son almacenes, permisos, retenciones y flujos independientes.

## 3. Modelo de observación

Cada evento debe ser autocontenido y versionado. Esquema lógico mínimo:

| Campo | Requisito |
|---|---|
| `schema_version` | Versión del contrato de evento |
| `event_id` | UUID aleatorio, sin identidad de usuario |
| `session_id` | Identificador efímero, regenerable |
| `observed_at` | Hora UTC ISO-8601 |
| `source` | `content-script`, `service-worker`, `manual` o `ci` |
| `origin` | Origen permitido; nunca credenciales ni query string |
| `kind` | Evento tipado de la taxonomía §4 |
| `confidence` | `direct`, `inferred` o `unknown` |
| `payload` | Datos tipados mínimos, sin contenido sensible por defecto |
| `correlation_id` | Opcional, aleatorio y local a la sesión |
| `build` | Versión de extensión, commit y navegador cuando estén disponibles |

Reglas: los eventos son append-only en el spool local; la corrección se representa con un evento compensatorio. Cada lote declara rango temporal, cantidad, tamaño, versión de esquema, huella de contenido y resultado de validación. Los reintentos deben ser idempotentes por `event_id`. No utilizar hashes de texto de conversación como mecanismo de anonimización: textos de baja entropía pueden recuperarse por diccionario.

## 4. Taxonomía mínima

1. **Lifecycle:** extensión iniciada, service worker suspendido/reanudado, pestaña creada/cerrada, navegación, recarga, desconexión/reconexión.
2. **Page structure:** cambio de ruta, raíz de aplicación, landmarks, formularios, diálogos, regiones accesibles, controles interactivos y cambios de atributos relevantes.
3. **Assets/capabilities:** versiones visibles, scripts/recursos observables por APIs permitidas, permisos concedidos, restricciones de host y disponibilidad de APIs. No ejecutar ni descargar recursos para inspeccionarlos si la finalidad no lo requiere.
4. **Interaction:** tipo de acción del usuario y objetivo semántico general; no almacenar valores escritos por defecto.
5. **Conversation UI:** presencia y conteo de turnos, estado de generación, controles visibles, adjuntos por tipo, mensajes de error, acciones de copiar/editar/regenerar si son detectables. El texto de turnos queda fuera de telemetría técnica.
6. **Network-visible state:** solo señales expuestas por APIs públicas del navegador y permitidas por permisos declarados. No interceptar tráfico privado ni replicar APIs internas.
7. **Health:** errores de observación, timeout, pérdida de eventos, cola pendiente, uso de almacenamiento, retraso de envío y última confirmación de persistencia.
8. **Governance:** consentimiento activo, alcance, pausa, revocación, exportación/borrado y cambios de política.

Cada observación debe distinguir `observed` de `inferred`. La ausencia de un evento no prueba que el comportamiento no haya ocurrido.

## 5. Snapshots, deltas y frescura

- Mantener un snapshot inicial compacto de estructura semántica, seguido de deltas con operaciones explícitas (`add`, `remove`, `attribute-change`, `route-change`, `state-change`).
- Preferir roles ARIA, nombres accesibles, etiquetas y relaciones semánticas sobre clases CSS o selectores generados. Conservar selectores como pista de diagnóstico, no como identidad estable.
- Registrar para cada snapshot: `snapshot_id`, `parent_snapshot_id`, versión del extractor, hora, conteos y hash de estructura normalizada.
- Aplicar muestreo y debounce a mutaciones ruidosas; no perder transiciones críticas como consentimiento, navegación, envío de formulario, error, inicio/fin de generación y revocación.
- Si se pierde un delta, se detecta una brecha de secuencia o cambia el extractor, emitir `snapshot.resync_required` y crear un snapshot nuevo. Nunca reconstruir silenciosamente una historia incompleta.
- Separar las métricas de DOM observado de la interpretación semántica. La presencia de un botón no demuestra que funcione; un indicador visual no demuestra estado del backend.

## 6. Arquitectura de referencia

1. **Content observer (Chrome):** lectura limitada del DOM accesible, eventos de ciclo de vida y señales semánticas; sin automatización de acciones por defecto.
2. **Service worker MV3:** políticas, permisos, coordinación entre pestañas, deduplicación, versionado y cola local.
3. **Local spool:** IndexedDB con límites de tamaño/retención, transacciones y recuperación tras suspensión del worker.
4. **Normalizer/redactor:** contrato único para saneamiento, allowlists y validación de esquema antes de persistir o publicar.
5. **Reporter:** exportación manual por defecto; publicación remota deshabilitada hasta consentimiento explícito.
6. **CI/replay sintético:** fixtures no sensibles, snapshots de referencia, pruebas de deltas y compatibilidad entre versiones. El replay solo usa fixtures sintéticos; nunca reproduce conversaciones reales ni opera la cuenta del usuario.
7. **Host nativo:** fuera del runtime permitido para observabilidad de producción. La arquitectura vinculante existente es extensión MV3 + APIs de Chrome + Vercel Relay + GitHub; no añadir Native Messaging, procesos Windows residentes, localhost, tareas programadas, watchdogs ni supervisores.

La arquitectura debe tolerar que el service worker MV3 se suspenda, que una pestaña desaparezca y que el DOM cambie entre lectura y acción. No depender de timers perpetuos ni de un único contexto vivo.

## 7. Seguridad y controles

- Manifest V3 con permisos mínimos y `host_permissions` explícitos; explicar cada permiso en documentación.
- Allowlist de orígenes por perfil de observación. La observación de ChatGPT no debe implicar acceso universal a todos los sitios.
- Sin ejecución remota de código, `eval`, inyección de scripts remotos, extracción de cookies ni almacenamiento de secretos.
- No efectuar clics, enviar prompts, modificar configuración, aceptar diálogos, activar voz, ni iniciar/terminar conversaciones desde el observador. La automatización futura requiere módulo separado, intención explícita y pruebas de seguridad.
- Las acciones de gobierno deben ser fail-closed: permiso desconocido, origen inesperado, esquema inválido, consentimiento ambiguo o estado de observación incierto bloquean publicación y automatización.
- Publicar solo agregados y muestras sintéticas. Un informe de CI nunca debe contener texto real de conversaciones.
- Las exportaciones locales deben tener un formato explícito, vista previa, opción de cancelar y metadatos de procedencia.

## 8. Matriz de validación

Cada caso debe marcarse `PASS`, `FAIL` o `NOT-VERIFIABLE`, con navegador/Windows/build/fixture y evidencia saneada. No sustituir `NOT-VERIFIABLE` por PASS.

| Área | Caso mínimo | Criterio |
|---|---|---|
| MV3 lifecycle | Suspensión y reactivación del worker | No se pierden lotes confirmados; recuperación idempotente |
| Navigation | SPA route change, reload, tab close | Estado de sesión consistente; ningún dato cruza pestañas sin correlación explícita |
| DOM deltas | Inserción, eliminación, cambio de atributo, rerender | Delta válido o petición de resync; sin crecimiento ilimitado |
| Accessibility | Nombre/rol/label cambian | Cambio semántico detectable sin depender de clases |
| Dynamic UI | Streaming de respuesta y skeleton/loading | Estados transitorios no se interpretan como contenido final |
| Duplicate events | Observer reinicializado, listener duplicado | Deduplicación estable y conteos explicables |
| Privacy default | Prompt/respuesta con canarios sintéticos | Ningún canario en telemetría/spool/export remoto por defecto |
| Consent | Opt-in, pausa, revocación, reinicio | Captura se detiene de inmediato; revocación no rearma |
| Redaction | URL con query, email, token sintético, input | No persisten valores sensibles |
| Offline/retry | Sin red, retry, respuesta tardía | Sin pérdida silenciosa ni duplicación visible |
| Schema migration | Evento de versión previa | Migración o rechazo explícito y recuperable |
| Storage pressure | Cuota llena / datos corruptos | Señal de salud visible; fallo cerrado sin truncado silencioso |
| Origin isolation | Pestañas/orígenes mixtos | No hay contaminación de contexto ni publicación cruzada |
| Chrome/Windows | Chrome estable en Windows, permisos reales | Evidencia real separada de pruebas sintéticas |
| ChatGPT UI | Conversación, regeneración, edición, error, carga | Se registran solo estados permitidos; contenido excluido por defecto |

## 9. Métricas operativas

Medir sin texto de conversación:

- eventos observados, aceptados, deduplicados y descartados por causa;
- latencia observación→persistencia local y persistencia→confirmación remota;
- tamaño y edad del spool, lotes pendientes, reintentos y huecos de secuencia;
- porcentaje de deltas válidos, snapshots de resincronización y errores del extractor;
- permisos/consentimiento efectivo por origen;
- cobertura de matriz por entorno real, sintético y no verificable.

No usar conteos de caracteres como prueba de fidelidad semántica. No presentar cobertura de CI como cobertura de Chrome real.

## 10. Versionado y compatibilidad

- Versionar por separado la versión de extensión, el esquema de eventos y el extractor DOM.
- Cambios aditivos de esquema incrementan minor; cambios incompatibles incrementan major. El consumidor debe rechazar versiones no soportadas de forma explícita.
- Cada build debe exponer commit, versión, versión de esquema y versión del extractor en un diagnóstico exportable.
- La telemetría antigua se conserva con su versión original; no reinterpretarla como si se hubiera generado con el extractor actual.
- El número de versión de producto no debe adelantarse a la aceptación en Windows/Chrome.

## 11. Secuencia propuesta de trabajo

1. Inventariar y mapear la instrumentación existente contra este contrato; marcar `implemented`, `partial`, `missing` o `unverified`.
2. Añadir pruebas sintéticas de privacidad/redacción, deduplicación, resync, MV3 lifecycle y aislamiento entre pestañas.
3. Consolidar un esquema único para eventos, snapshots, deltas, health y recibos de publicación.
4. Construir un reporte local de diagnóstico que muestre cobertura, frescura, huecos y estado de consentimiento sin exponer contenido.
5. Añadir fixtures de interfaz de ChatGPT sintéticos y no sensibles, con selectores semánticos y fallbacks documentados.
6. Ejecutar validación real en Windows/Chrome cuando el dispositivo esté disponible; guardar solo evidencia saneada.
7. Separar cualquier futura función de archivo de conversaciones en un diseño independiente, con consentimiento explícito, retención, exportación y borrado probados.

## 12. Criterio de aceptación del marco

El marco está listo para sustentar nuevas funciones cuando: (a) el contrato de eventos está versionado y validado; (b) el modo predeterminado no persiste contenido conversacional; (c) la pérdida de eventos y los cambios de DOM se detectan; (d) el estado de consentimiento y permisos es auditable; (e) las pruebas separan claramente evidencia sintética de Windows/Chrome real; y (f) un tercero puede reconstruir qué se observó, cuándo, con qué build y con qué nivel de confianza, sin tener acceso a texto sensible.

**No implica:** captura de razonamiento oculto, garantía de estabilidad del DOM de ChatGPT, aceptación de Windows, ni autorización para automatizar acciones sobre la cuenta del usuario.
