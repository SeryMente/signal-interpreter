# Arquitectura canónica de observabilidad: Chrome + Vercel Relay + GitHub

**Sprint:** SPRINT-OBSERVABILITY-AUTOOBSERVATION-01  
**Versión arquitectónica:** v2  
**Fecha:** 2026-10-07  
**Repositorio:** SeryMente/signal-interpreter

## 1. Regla arquitectónica vinculante

La observabilidad de Signal Interpreter debe ejecutarse exclusivamente mediante:

**extensión Chrome (Manifest V3) + APIs de Chrome + Cloud Interpreter + Vercel Functions + GitHub.**

Queda prohibido que la observabilidad dependa de software residente o infraestructura auxiliar en Windows. En particular, no debe requerir:

- Node.js o procesos locales de observabilidad;
- servidores HTTP localhost;
- Scheduled Tasks;
- watchdogs de Windows;
- supervisores;
- Native Messaging;
- hosts nativos;
- instaladores de observabilidad;
- agentes residentes o ventanas de consola.

Esta regla aplica al runtime operativo de la observabilidad, no a los runners hospedados de GitHub Actions utilizados para construir y validar el paquete.

## 2. Flujo canónico

El circuito completo es:

**Cloud Interpreter → content script → background/service worker → IndexedDB → Vercel relay → GitHub API → observations/inbox → GitHub Actions → paquete de observabilidad → siguiente ciclo de desarrollo.**

La extensión es la única entidad que observa la plataforma durante el uso real.

GitHub es el sistema remoto de persistencia y el lugar donde se materializa el conocimiento derivado.

## 3. Captura

### 3.1. Cloud Interpreter

La extensión observa reactivamente las URLs que el usuario realmente visita en https://app.cloudinterpreter.com/*.

Puede capturar, cuando estén disponibles de forma legítima:

- URL y transición;
- estructura DOM/HTML renderizada;
- controles y estados;
- CSS observable y metadatos de hojas;
- JavaScript entregado al navegador mediante metadatos/fingerprints;
- recursos observables;
- señales de llamadas, navegación y lifecycle;
- metadatos de rendimiento;
- metadatos de red permitidos.

No se captura:

- código PHP/server-side privado;
- cuerpos de requests/responses;
- cookies;
- authorization headers;
- tokens;
- credenciales;
- audio crudo;
- transcripciones crudas;
- HTML/CSS/JavaScript fuente completos.

## 4. Persistencia local

La extensión conserva los eventos en IndexedDB y el estado operativo auxiliar en chrome.storage.local.

La confirmación de persistencia remota no sustituye la persistencia local.

El runtime debe tolerar que el service worker de Chrome se suspenda y reanude.

## 5. Transporte mediante relay Vercel

La extensión no envía observabilidad a localhost ni contiene credenciales de GitHub.

Publica cada batch mediante una Vercel Function pública y de destino fijo:

https://signal-interpreter-observability-re.vercel.app/api/batch

El relay valida método, schema, batchId, cantidad de eventos y tamaño máximo. Después escribe exclusivamente en:

observations/inbox/<batchId>.json

mediante GitHub REST API.

### 5.1. Credencial remota

El relay mantiene GITHUB_TOKEN como Secret de Vercel. Ese token nunca se entrega al navegador ni se versiona en el repositorio.

La extensión sólo conoce la URL del relay; no realiza OAuth de GitHub, no usa Device Flow y no requiere Client ID de una GitHub App.

### 5.2. Aceptación e idempotencia

Si el batch ya existe en GitHub, el relay lo trata como aceptación duplicada. Si existe una carrera de escritura y GitHub devuelve conflicto, el relay vuelve a consultar el objeto antes de reportar error.

El batch no se elimina de IndexedDB hasta que la extensión recibe accepted: true.

## 6. Reconocimiento de aceptación

Cuando GitHub acepta el PUT del batch a observations/inbox/, la extensión considera el batch entregado al sistema remoto.

El batch no se elimina de la base local hasta que la propia extensión haya confirmado la aceptación HTTP.

Los fallos de autenticación, autorización, conflicto, rate limit o red incrementan el contador de reintentos y conservan el batch pendiente.

## 7. Construcción del paquete en GitHub

Una GitHub Action, ejecutada en infraestructura hospedada por GitHub, procesa observations/inbox/**.

La Action:

1. valida el schema;
2. mueve los batches al historial durable;
3. reconstruye/actualiza snapshots de plataforma;
4. calcula deltas semánticos;
5. actualiza índices;
6. actualiza manifest.json;
7. actualiza latest/ solamente con telemetría real;
8. actualiza health/github-build.json;
9. elimina del inbox los batches ya procesados;
10. ejecuta las auditorías;
11. publica el cambio derivado mediante el token de GitHub Actions.

La Action es una función de construcción remota, no una dependencia del runtime del usuario.

## 8. Paquete canónico

observations/ debe contener como mínimo:

- inbox/: entrada temporal desde Chrome;
- batches/: historial de batches aceptados;
- platform-snapshots/: superficies observadas;
- platform-deltas/: cambios semánticos;
- platform-index.json: último estado por identidad;
- platform-latest.json: resumen consumible;
- manifest.json: índice del paquete;
- latest/latest.json: último batch real;
- latest/latest-summary.md: resumen humano del último batch real;
- health/github-build.json: estado del proceso de construcción remoto.

Los archivos derivados no pueden ser sustituidos por un latest de una prueba.

## 9. Identidad y aprendizaje

La identidad de superficie sigue siendo:

origin | route/path normalizado | query keys normalizadas

Los valores de query parameters no forman parte de la identidad.

Cada superficie nueva genera un baseline.

Cada superficie modificada genera un delta semántico.

Una superficie sin cambios no debe generar falsos hallazgos de novedad.

El conocimiento debe distinguir:

- observed;
- inferred;
- hypothesis;
- unknown;
- not-applicable.

## 10. Sincronización

La frecuencia base del runtime Chrome es:

- flush periódico: ~1 minuto;
- flush por umbral de eventos;
- flush inmediato para eventos críticos;
- retry con backoff.

El límite temporal ya no depende de un reporter local.

La latencia real de disponibilidad en GitHub será:

**tiempo de flush del navegador + latencia Vercel + latencia GitHub API + tiempo del workflow de construcción.**

Esto se mide y optimiza como una propiedad del sistema, no mediante un daemon local.

## 11. Seguridad y privacidad

La redacción se ejecuta antes de la publicación.

Además de la redacción en la extensión, GitHub Actions vuelve a validar la estructura del paquete.

La observabilidad no debe poder:

- abrir rutas arbitrarias para descubrirlas;
- cambiar la navegación de la plataforma para recolectar datos;
- saltarse controles;
- modificar datos;
- capturar secretos;
- convertir una prueba en una mutación de latest.

## 12. Pruebas

CI debe validar:

- sintaxis de todos los módulos de observabilidad;
- contrato de autenticación y transporte;
- minimización/redacción;
- learning/delta;
- construcción del paquete;
- integridad del paquete;
- ausencia de cualquier runtime local de observabilidad;
- ausencia de nativeMessaging;
- ausencia de 127.0.0.1;
- ausencia de Scheduled Tasks, watchdogs o supervisores.

La observabilidad de producción no se valida mediante la instalación de software en Windows.

## 13. Configuración externa única

La precondición fuera del código es disponer de una credencial de escritura de GitHub para SeryMente/signal-interpreter y almacenarla como Secret en el proyecto Vercel del relay.

Configuración requerida:

- Vercel project: signal-interpreter-observability-relay;
- Vercel Secret: GITHUB_TOKEN;
- la credencial se utiliza exclusivamente del lado servidor;
- la extensión no almacena ni solicita credenciales de GitHub.

No debe existir ningún secreto de GitHub en el repositorio.

## 14. Criterio de completitud

La arquitectura se considera completa cuando:

1. Chrome observa y persiste;
2. Chrome publica al relay Vercel;
3. Vercel publica en GitHub;
4. GitHub Actions construye el paquete;
5. ningún servicio local participa;
5. los batches sobreviven a suspensión/reanudación del service worker;
7. el paquete contiene evidencia operacional y de plataforma;
8. los deltas son reproducibles;
9. las pruebas detectan una regresión de cualquiera de las reglas anteriores.

## 15. Informe durable de cierre de llamada

Cuando Cloud Interpreter navega a `/call/<ID>/rate` y la extensión observa las estrellas, el content script emite `CALL_RATING_STARS_CONFIRMED` con evidencia estructural limitada (método de detección y contadores, no texto crudo ni puntuación). Los eventos del content script incorporan `callId` en `payload`, `session` y `context` para correlación explícita.

El cierre de la llamada conserva el registro final, completa la conciliación de ingresos y emite `CALL_OBSERVABILITY_CHECKPOINT` de `call-ended`. La sincronización drena lotes hasta que el ACK remoto cubre la secuencia de checkpoint; si no lo logra, persiste el objetivo de secuencia y programa reintentos. La presencia de estrellas no se confunde con rating seleccionado o enviado.

GitHub Actions construye los artefactos:

- `observations/call-reports/YYYY-MM-DD/call-<opaque-ref>.json`
- `observations/call-reports/index.json`
- `observations/latest/latest-call-report.json`
- `observations/latest/latest-call-report.md`

El informe agrupa duración, modalidad, cierre, ingreso estimado y diferencias entre duración observada/de plataforma; distribuciones por acción, categoría, componente y severidad; reason codes de fallos; señales de micrófono, media, transcripción, rendimiento, red, plataforma, facturación y runtime; métricas de rendimiento/medios resumidas; cobertura y señales ausentes. Si llega primero el evento de estrellas, el artefacto permanece `partial`; se actualiza a `complete` solo cuando se recibe el checkpoint y el registro final de llamada.

El artefacto es generado a partir de batches existentes y no requiere endpoint Vercel nuevo ni servicio local. El index/manifest declara la referencia opaca más reciente y el estado; la auditoría comprueba el contrato de privacidad y la consistencia de los punteros.

### Privacidad del informe

No se incluyen audio, transcripciones crudas, valores escritos, cuerpos HTTP, código fuente privado o credenciales. La identidad original de la llamada no se escribe en el nombre ni en el cuerpo del informe: se usa un hash opaco. No se afirma que la valoración se seleccionó o envió solo porque las estrellas fueran visibles.

## 16. Decisión de migración

La infraestructura previa basada en reporter local, watchdog, supervisor, Scheduled Tasks y Native Messaging queda descontinuada y debe permanecer fuera del árbol de producción de Signal Interpreter.

La nueva arquitectura es la única arquitectura canónica para la observabilidad del sprint.
