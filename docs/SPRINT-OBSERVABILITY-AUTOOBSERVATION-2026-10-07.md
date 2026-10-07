# Sprint: Observabilidad integral y autoobservación de Signal Interpreter

**Identificador:** SPRINT-OBSERVABILITY-AUTOOBSERVATION-01
**Fecha de inicio:** 2026-10-07
**Repositorio:** SeryMente/signal-interpreter
**Rama:** sprint/observability-autoobservacion-2026-10-07
**Estado:** Implementación browser→GitHub; infraestructura Windows de observabilidad descontinuada

## 0. Enmienda arquitectónica vinculante

A partir del 2026-10-07, la observabilidad de producción queda limitada a **Chrome + extensión Signal Interpreter + Cloud Interpreter + GitHub**.

No forman parte del runtime de observabilidad:

- reporter local;
- localhost;
- Node.js residente;
- Scheduled Tasks;
- watchdog/supervisor en Windows;
- Native Messaging;
- host nativo;
- instaladores de observabilidad.

La implementación derivada debe usar IndexedDB/chrome.storage para persistencia local, GitHub API para transporte y GitHub Actions para construir el paquete derivado.

La especificación completa de esta decisión está en `docs/OBSERVABILITY-ARCHITECTURE-BROWSER-GITHUB-v2.md`.

## 1. Objetivo

Diseñar y validar un sistema de observabilidad suficientemente completo, persistente y utilizable para que Signal Interpreter pueda:

1. Registrar de forma confiable los eventos relevantes producidos por la extensión durante su operación.
2. Capturar las señales necesarias para diagnosticar causa raíz de bugs, regresiones, fallas de integración y problemas de rendimiento.
3. Observar de manera continua y no invasiva la plataforma de Cloud Interpreter mientras el usuario la utiliza, con el fin de construir conocimiento incremental sobre su estructura, navegación, estados y comportamiento observable.
4. Consolidar ambas fuentes —telemetría de Signal Interpreter y observaciones de Cloud Interpreter— en un paquete de observabilidad versionado y persistente.
5. Sincronizar automáticamente ese paquete con el repositorio de Signal Interpreter con una frecuencia suficientemente alta para minimizar la pérdida de información y reducir el retraso entre la observación y su disponibilidad para desarrollo.
6. Convertir el paquete de observabilidad en una entrada protocolaria de cada ciclo posterior de desarrollo, permitiendo comparar el estado actual contra el último estado conocido y detectar novedades útiles para orientar la siguiente iteración.

El objetivo no es simplemente tener logs. El objetivo es construir una **capacidad de autoobservación operacional y de aprendizaje técnico** que aumente progresivamente la capacidad de desarrollar, depurar y adaptar Signal Interpreter.

## 2. Propósito

El sistema debe crear un circuito cerrado:

**operación real → observación → persistencia → sincronización → comparación/delta → conocimiento → decisión de desarrollo → nueva operación.**

La observabilidad será considerada parte de la arquitectura del sistema, no una herramienta externa opcional.

Su valor principal será reducir la dependencia de hipótesis construidas únicamente a partir de síntomas reportados por el usuario. Cuando exista información observada suficiente, cada ciclo de desarrollo deberá poder partir de evidencia directa sobre:

- qué ocurrió;
- cuándo ocurrió;
- en qué estado estaba la extensión;
- en qué URL y contexto de Cloud Interpreter ocurrió;
- qué componentes participaron;
- qué cambios de plataforma fueron visibles;
- qué secuencias de eventos precedieron o siguieron al problema;
- qué comportamiento nuevo apareció desde la última observación;
- y qué información sigue siendo desconocida.

## 3. Alcance de la observabilidad

### 3.1. Observabilidad de Signal Interpreter

Debe cubrir, como mínimo:

- ciclo de vida de la extensión y sus módulos;
- navegación y lifecycle de pestañas relevantes;
- llamadas, estados de llamada y rutas de transición;
- auto-answer y sus decisiones/resultado;
- earnings y extracción de datos;
- transcripción/captura cuando corresponda;
- sincronización de telemetría;
- errores, excepciones, timeouts y reintentos;
- rendimiento y heartbeats;
- cambios de versión y límites de runtime;
- estados de salud de los mecanismos de persistencia;
- secuencias y correlación temporal de eventos.

La captura debe privilegiar datos estructurados, trazables y correlacionables sobre mensajes textuales ambiguos.

### 3.2. Observabilidad superficial de Cloud Interpreter

Mientras el usuario opere normalmente dentro de app.cloudinterpreter.com, el sistema debe aprender progresivamente de las partes de la plataforma que realmente sean observables desde el navegador.

Debe registrar, cuando estén disponibles de forma legítima y no invasiva:

- URL y cambios de URL;
- rutas y patrones de navegación;
- estructura DOM/HTML renderizada;
- elementos relevantes visibles y sus estados;
- atributos, roles, clases y relaciones estructurales útiles para diagnóstico;
- hojas CSS y recursos cargados que sean observables desde el cliente;
- scripts y recursos JavaScript entregados al navegador, identificadores de archivos y metadatos disponibles;
- cambios estructurales del DOM asociados a eventos;
- señales de interacción y transiciones de estado observables;
- metadatos de solicitudes de red que la extensión pueda observar legítimamente, sin capturar secretos innecesarios;
- aparición, modificación y desaparición de diálogos, botones, temporizadores, indicadores y otros controles relevantes;
- correspondencia temporal entre acciones del usuario y cambios observados en la plataforma.

La observación será **reactiva a la navegación y uso real del usuario**. No se plantea como crawler, fuzzing, enumeración agresiva de rutas, explotación, bypass de controles, ni ejecución de acciones que no sean necesarias para la operación normal de la extensión.

### 3.3. Límite técnico del conocimiento del backend

El navegador no recibe el código fuente PHP u otros componentes server-side simplemente porque una página los utilice.

Por ello, este sprint no considera como objetivo la extracción del código privado del servidor. La capa de backend podrá estudiarse únicamente mediante aquello que la plataforma exponga legítimamente al cliente: respuestas, endpoints observables, contratos, metadatos, tiempos, estados y demás señales disponibles durante la operación normal.

## 4. Principios de diseño

### 4.1. Evidencia antes que inferencia

Debe conservarse la diferencia entre:

- evento observado directamente;
- estructura observada;
- inferencia derivada;
- hipótesis todavía no confirmada.

### 4.2. No invasividad

La observabilidad no debe modificar de forma sustancial el comportamiento de Cloud Interpreter ni ejecutar acciones destinadas a explorar o manipular la plataforma fuera del flujo normal de uso.

Quedan fuera de alcance:

- bypass de autenticación o controles;
- explotación de vulnerabilidades;
- manipulación de datos del servidor;
- fuzzing o pruebas destructivas;
- crawling masivo de rutas no visitadas;
- extracción de secretos, credenciales o tokens;
- almacenamiento indiscriminado de contenido sensible.

### 4.3. Privacidad y minimización

El sistema debe recolectar el mínimo de información necesaria para explicar el comportamiento.

Debe existir redacción o exclusión sistemática de:

- credenciales;
- cookies y tokens;
- secretos de API;
- datos personales innecesarios;
- transcripciones o audio crudos cuando no sean imprescindibles para el objetivo específico;
- cualquier contenido cuyo almacenamiento no aporte valor diagnóstico proporcional.

### 4.4. Persistencia antes que conveniencia

Un evento importante no debe depender de que otro proceso siga vivo para sobrevivir.

La persistencia local durable precede a la publicación remota.

### 4.5. Sincronización directa desde Chrome a GitHub

La sincronización de producción no utiliza ningún proceso intermedio local.

La ruta canónica es:

**captura → IndexedDB/chrome.storage → batch saneado → GitHub API → observations/inbox → GitHub Actions → paquete derivado.**

La extensión publica:

- por umbral de eventos;
- por ventana temporal;
- inmediatamente ante eventos críticos;
- con reintentos y backoff desde el service worker.

La frecuencia base objetivo es de aproximadamente 1 minuto para el flush periódico, sin impedir envíos anteriores por umbral o criticidad.

La aceptación HTTP de GitHub confirma que el batch ya está en el sistema remoto. El proceso de construcción posterior pertenece exclusivamente a GitHub Actions.

No existe spool, watchdog, supervisor ni fallback local.
### 4.6. Trazabilidad

Cada observación relevante debe poder relacionarse temporalmente con:

**evento → sesión/contexto → URL → estado de plataforma → consecuencia → diagnóstico.**

## 5. Estrategia de implementación

### Fase 1 — Definir el modelo de observabilidad

Construir una matriz explícita de cobertura que responda:

- qué debemos capturar;
- desde qué componente;
- con qué frecuencia;
- con qué nivel de severidad;
- cómo se correlaciona;
- dónde persiste;
- cómo se valida su presencia;
- y qué significa cobertura suficiente.

La matriz debe identificar también los huecos conocidos y distinguir no observado de no ocurrió.

### Fase 2 — Instrumentar y endurecer la captura

Revisar cada módulo de Signal Interpreter y cada punto de observación de Cloud Interpreter para comprobar:

- existencia de eventos;
- consistencia del esquema;
- secuencias;
- timestamps;
- correlation IDs;
- contexto;
- resultados;
- errores y reintentos;
- invariantes;
- salud de los propios mecanismos de observabilidad.

Cuando una operación importante no tenga una señal observable, deberá añadirse explícitamente o declararse la limitación.

### Fase 3 — Construir el observador de plataforma

Añadir o endurecer mecanismos que observen, sin navegación invasiva:

- URL actual y transiciones;
- estructura de la página;
- recursos relevantes;
- cambios de DOM;
- estados de UI;
- señales de llamadas;
- lifecycle visible de controles y diálogos;
- metadatos de red permitidos.

El observador debe aprender incrementalmente: no solo producir snapshots aislados, sino permitir reconstruir cómo evolucionó la plataforma.

### Fase 4 — Empaquetado y persistencia

Definir un paquete de observabilidad compuesto como mínimo por:

- eventos de extensión;
- observaciones de plataforma;
- snapshots estructurales;
- deltas respecto de snapshots anteriores;
- índice temporal;
- resumen de salud del pipeline;
- estado de sincronización;
- metadatos de versión/esquema.

El paquete deberá mantener historial suficiente para comparar estados sin depender únicamente de un archivo latest.

### Fase 5 — Sincronización automática browser→Vercel→GitHub

Implementar una ruta que no requiera infraestructura instalada en la máquina del usuario:

1. IndexedDB mantiene el backlog durable.
2. La extensión sanea el batch antes de transmitirlo.
3. La extensión publica HTTPS en la Vercel Function de relay.
4. El relay publica exclusivamente en `observations/inbox/` mediante GitHub REST API.
5. GitHub Actions consume el inbox y construye los artefactos derivados.
6. Los errores de red/relay mantienen el backlog local para reintento.

La observabilidad de producción no depende del estado de ningún proceso Windows.

El tiempo de disponibilidad remoto se mide como:

**flush Chrome + Vercel relay + GitHub API + workflow de construcción.**
### Fase 6 — Delta protocolario para futuros ciclos

En cada ciclo de desarrollo posterior, el protocolo deberá comenzar por acceder al paquete de observabilidad vigente y compararlo con el paquete/estado anterior.

El análisis deberá producir al menos:

1. **Novedades:** observaciones o eventos nunca vistos.
2. **Cambios:** estructuras, rutas, estados o comportamientos modificados.
3. **Anomalías:** secuencias inesperadas, errores, pérdidas de eventos o divergencias.
4. **Oportunidades:** nuevos datos que puedan mejorar funcionalidad, robustez, adaptación o diagnóstico.
5. **Huecos:** señales que deberían existir pero no pudieron observarse.

El delta no debe limitarse a un diff textual. Debe ser un **delta semántico** orientado a decisiones de desarrollo.

## 6. Paquete de observabilidad esperado

La estructura concreta podrá evolucionar, pero conceptualmente debe separar:

extension-events/
Eventos estructurados producidos por Signal Interpreter.

platform-observations/
Observaciones de Cloud Interpreter.

platform-snapshots/
Snapshots de estructura y estado observable.

platform-deltas/
Cambios detectados entre snapshots.

indexes/
Índices temporales, de sesión, URL y secuencia.

health/
Estado del propio pipeline de observabilidad.

latest/
Punteros resumidos al estado actual, sin sustituir el historial.

El diseño deberá impedir que una ejecución de prueba o diagnóstico destruya o sobrescriba por accidente la referencia al último estado real.

## 7. Criterios de éxito del sprint

El sprint se considerará exitoso cuando exista evidencia de que:

1. Los eventos críticos de Signal Interpreter están cubiertos y son trazables.
2. Las pérdidas de observabilidad son detectables, no silenciosas.
3. Cloud Interpreter puede observarse de forma reactiva mientras se utiliza normalmente.
4. Los cambios relevantes de URL y estructura pueden reconstruirse cronológicamente.
5. La observación distingue estado real de inferencia.
6. Los datos sensibles están protegidos por diseño.
7. El paquete de observabilidad se persiste de forma durable.
8. La extensión puede publicar automáticamente mediante el relay Vercel sin servidor local en Windows.
9. GitHub Actions puede transformar el inbox en el paquete derivado.
10. La construcción remota preserva el último estado real y no permite que pruebas contaminen latest.
11. Existe un mecanismo reproducible para verificar el paquete y sus deltas.
12. Un ciclo posterior puede consultar el paquete y producir un delta útil para decidir qué desarrollar después.
13. CI contiene guardas suficientes para impedir regresiones en captura, transporte, privacidad y construcción remota.
## 8. Definición de completitud suficiente

No se considerará posible demostrar que se capturó absolutamente todo en un sentido matemático.

La meta operativa será demostrar una combinación de:

- cobertura conocida de eventos relevantes;
- detección explícita de huecos;
- redundancia de captura cuando sea razonable;
- persistencia durable;
- publicación confirmable;
- correlación temporal;
- y capacidad de reconstrucción suficiente para diagnóstico y aprendizaje.

La pregunta de aceptación no será únicamente:

> ¿Tenemos logs?

sino:

> **¿Podemos reconstruir con evidencia suficiente qué estaba haciendo la extensión, qué estaba haciendo la plataforma observable, qué cambió y qué información nueva apareció desde el último ciclo?**

## 9. Resultado esperado al terminar

El resultado del sprint debe convertir la observabilidad en una capacidad permanente de Signal Interpreter:

**la extensión se observa a sí misma, observa de manera superficial y no invasiva el entorno de Cloud Interpreter que el usuario realmente utiliza, conserva evidencia durable, la sincroniza automáticamente y convierte esa evidencia en insumo obligatorio para el siguiente ciclo de desarrollo.**

Este documento constituye la definición inicial del sprint y podrá ampliarse con decisiones técnicas, hallazgos, métricas de cobertura y cambios de estrategia conforme avance la implementación.

## 10. Implementación del sprint

La implementación debe materializar el objetivo mediante:

- captura reactiva de cambios de URL y navegación SPA en Cloud Interpreter;
- snapshots estructurales de DOM/HTML renderizado;
- inventario acotado de CSS, JavaScript entregado y recursos observables;
- contexto de pestaña, frame e iniciador en telemetría operacional;
- persistencia durable en IndexedDB;
- transporte browser→Vercel→GitHub mediante observations/inbox/;
- Vercel Function con GITHUB_TOKEN almacenado como Secret;
- construcción del paquete en GitHub Actions;
- snapshots y deltas semánticos generados remotamente;
- manifest, índices y health del paquete;
- aislamiento de self-tests respecto de latest real;
- límites de tamaño y minimización de datos antes de publicación;
- auditoría estática contra cualquier dependencia local de Windows;
- protocolo de delta para los ciclos de desarrollo.

La extensión adopta la versión 0.10.0 por la ampliación funcional del modelo de observabilidad.

La infraestructura local previa queda fuera de esta implementación.
## 11. Evidencia de aceptación

La aceptación técnica se apoya en cuatro capas:

1. **Sintaxis:** todos los módulos JavaScript relevantes deben analizarse sin errores.
2. **Pruebas unitarias:** learning, delta, pipeline GitHub y auditoría del paquete tienen fixtures reproducibles.
3. **Auditoría estática:** CI verifica captura, privacidad, transporte browser→Vercel→GitHub y ausencia de infraestructura local.
4. **Ejecución remota:** GitHub Actions valida la construcción del paquete y su publicación derivada.

No se requiere instalar software, tareas, hosts nativos ni procesos residentes en Windows para validar la observabilidad.
## 12. Estado de cierre

El sprint se considerará cerrado cuando la implementación browser→Vercel→GitHub esté publicada, CI pase todas las guardas, el relay Vercel esté desplegado con GITHUB_TOKEN como Secret y exista evidencia de al menos un batch real procesado por GitHub Actions.

El cierre no depende de la instalación de ningún componente local de observabilidad en Windows.


El sprint no se considerará cerrado únicamente porque el código compile. El cierre exige además que la implementación publicada esté preparada para el entorno operativo `fila4` y que exista evidencia de publicación de observabilidad real posterior al despliegue.
