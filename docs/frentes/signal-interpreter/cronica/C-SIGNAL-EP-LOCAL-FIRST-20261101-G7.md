# Crónica · persistencia local-first EP · Signal Interpreter G7
Fecha del corte: 2026-11-01

## 1. Autoridad y alcance

- Continuidad: Signal Interpreter, control G7 ACTIVO, instancia única.
- Control releído de `main`: `docs/frentes/signal-interpreter/CONTROL-RESPONSABILIDAD.json`, blob `c1b4425fa91b5ac6acb90a52298ed9d07a62eaf5`. La autorización G7 permite desarrollo, pruebas automatizadas, CI y documentación dentro de sus límites.
- El acceso RDC continúa NO AUTORIZADO para esta continuidad. No se utilizó RDC, no se accedió a archivos de perfil ni se intervino Chrome.
- La instrucción de continuidad del operador fue: «Bien avanza». Este corte queda limitado a una rama independiente; no autoriza llamadas reales, modificación de servicios EP/B2, despliegue, release, merge ni aceptación funcional.

## 2. Fuente normativa común

- DUG releído en `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`: v377 / NX-377m, blob `54064c8fe00f872023a455f06596061ed69062ae`.
- Metacanon 1.28; GOW 2.17; 22 anexos; MCP normativo DESACTIVADO.
- ART-028 establece dos capas: persistencia local durable primero, réplica EP verificable después; los consumidores conservan almacenes locales independientes; no se permite transporte directo a B2 desde la extensión.
- No se identificó un contrato oficial EP versionado, SDK/API de consumidor, scopes, operación de lookup/read-back, recibo remoto, allowlist ni entorno OCP-MSP verificable. No se inventaron endpoints.

## 3. Rama y preservación del estado actual de main

- Repositorio: `https://github.com/SeryMente/signal-interpreter`.
- Rama de desarrollo: `feat/si-ep-local-first-adapter-20261101`.
- Base de rama: main SHA `59b4c9e4d3cdc80e7627ba1eef1d546da1fbb8c8`.
- Main conserva el producto 0.10.39 y no contiene la implementación local-first. No se fusionó la rama, no se cambió el manifiesto ni se creó release. La comparación de `main` actual `1826378b7a37ec40a12283337b3109826e44e0ea` contra la base `59b4c9e4d3cdc80e7627ba1eef1d546da1fbb8c8` devuelve `ahead_by=2`, `behind_by=0`, `files=0`: los dos commits de alta/retirada de la crónica accidental permanecen en el historial, pero el árbol actual de main no tiene diferencia neta respecto de la base.
- **Incidencia de publicación documental:** durante el registro de esta crónica se omitió el argumento `branch` en una llamada de creación y GitHub escribió el archivo por defecto en `main`. Se detectó de inmediato. El archivo se retiró mediante delete condicionado al blob SHA `d1f99ca3672e7679cb239beed4322ba4c1cf861c`; commit correctivo `1826378b7a37ec40a12283337b3109826e44e0ea`. La ruta ya no está en el árbol actual de main, pero los commits de alta y retirada permanecen en el historial Git; no se reescribió la historia. El mismo archivo se publica ahora en esta rama con `branch` explícito.

## 4. Implementación local-first

### 4.1 IndexedDB v3

- `extension/telemetry-db.js` cambia DB_VERSION de 2 a 3.
- Conserva stores v2 `events`, `snapshots`, `signalSegments` y `metadata`; añade `epOutbox` y `epLedger` sin borrar los stores previos.
- Cada evento elegible para este corte se confirma en una sola transacción read-write que incluye:
  1. `events`: evento original saneado;
  2. `metadata`: checkpoint de secuencia;
  3. `epOutbox`: referencia de réplica;
  4. `epLedger`: identidad/hash/estado de la operación.
- `operationRef` se deriva de SHA-256 de `SIGNAL_INTERPRETER`, event.id y SHA-256 del evento serializado. No agrega payload ni secretos.
- `background.js` solicita la secuencia siguiente desde IndexedDB; solo después de un commit local actualiza el mirror de `chrome.storage.local` y notifica al relay legado. Un error de IndexedDB no avanza la secuencia ni crea mirror/ACK de relay.
- `chrome.storage.local.effectifEventSequence` se conserva como piso de migración legado; `ensureSequenceAtLeast` toma el máximo entre ese piso, metadata de IndexedDB y el último evento almacenado. No crea eventos ni rellena huecos. Después de inicializar, IndexedDB es la fuente de verdad.

### 4.2 Adaptador y estados

- Métodos internos expuestos en `KhoraTelemetryDB`: `enqueue`, `listPending`, `defer`, `getStatus`, `recover`, `flush`.
- Los estados locales se mantienen separados de nube: `LOCAL_DURABLE`, `CLOUD_PENDING`, elegibilidad `PENDING_ALLOWLIST_APPROVAL`.
- `defer` registra intentos, causa de error saneada y backoff exponencial con tope de una hora.
- `recover` recupera el evento por secuencia y coteja el hash del original y la identidad `operationRef`.
- `flush` permanece bloqueado, con `attempted=0`, mientras falten contrato oficial y allowlist.

### 4.3 Relay legado y retención

- El relay Vercel→GitHub sigue siendo el canal provisional existente. Su ACK/`ackedSequence` se conserva separado; no marca registros EP como confirmados ni altera el outbox EP.
- El pruning por antigüedad y por máximo de eventos consulta `epOutbox`. No elimina eventos en estados CLOUD_PENDING, CLOUD_IN_FLIGHT, EP_RECEIVED, RECONCILE_REQUIRED o RETRYABLE. Si el conjunto protegido supera el máximo, informa el exceso en lugar de borrar fuentes.
- `clear()` rechaza limpiar eventos, metadata, outbox y ledger cuando existan obligaciones de réplica pendientes/no verificadas.
- En este corte solo el store `events` está incluido en el outbox. Snapshots y signalSegments permanecen locales y no se envían por inferencia; esperan clasificación/allowlist aprobada.

## 5. Pruebas y evidencia

- Workflow específico: `.github/workflows/ep-local-first.yml`.
- Run `41360039965`, SHA `5a24281d5a35b36da6e68f62f85a43f298a9ceac`: SUCCESS. Node 22; sintaxis y pruebas fake-indexeddb.
- El fixture parte de una DB v2 sintética y valida preservación de eventos, snapshots, segmentos y metadata; piso de secuencia heredado; commit atómico evento/secuencia/outbox/ledger; rechazo de secuencia fuera de orden; referencia `events#<sequence>`; recuperación por lectura local; reintentos; bloqueo de flush y retención de fuentes pendientes.
- Auditoría general `observability-audit.yml`: run `41360217809`, SHA final `561389550530e6a2eba5a534f820f8ab67ee4c99`: SUCCESS. Incluye sintaxis del background/DB/popup, auditorías estáticas existentes y comparación contra el inventario de payload.
- Workflow Windows `native-caption-host.yml`: run `41360217829`, SHA final `561389550530e6a2eba5a534f820f8ab67ee4c99`: SUCCESS. El instalador en runner Windows PowerShell 5.1 verificó hashes, preparación del puente Native Messaging, framing/clean shutdown y empaquetado del host. Es prueba CI aislada; no instalación en el perfil del operador.
- `payload-sha256.json`: commit `1494a3ca04e26e999535cdf0a32b92d6d70e5a6c`, blob `2151f91c293b8881027552b90045ae91972c147d`. Se cotejaron sus cuatro entradas afectadas contra SHA-256 recalculado de los blobs actuales: `background.js`, `telemetry-db.js`, popup HTML y popup JS; las cuatro coinciden.
- Los primeros runs fallidos correspondieron a inventario de payload obsoleto y a un fixture que intentó reasignar `globalThis.crypto` en Node 22. Se corrigieron: inventario actualizado, WebCrypto nativo y nueva ejecución. Los runs fallidos permanecen en Actions como historial y no se presentan como PASS.
- Workflow local-first: run `41360039965`, SHA `5a24281d5a35b36da6e68f62f85a43f298a9ceac`: SUCCESS. La prueba sintética abarca migración v2→v3, secuencia heredada, referencia local, transacción, recuperación y retención.

## 6. Límites

- No se conectó ni invocó un servicio remoto EP; no se verificó OCP-MSP, read-back remoto ni recibo EP.
- No se añadieron credenciales, tokens de consumidor ni B2 Application Keys a la extensión.
- No hay migración histórica ni backfill; los eventos v2 se conservan y no se convierten automáticamente en transferencias pendientes.
- No se cargó ni recargó la extensión en Chrome; no se probó IndexedDB real en Chrome, suspensión/reinicio del service worker, offline/online real ni una llamada controlada.
- No hay merge, release ni despliegue.

## 7. Dictamen y checkpoint

**Implementado en rama:** almacenamiento transaccional local de eventos y outbox/ledger, recuperación local, secuencia monotónica de migración, retención protegida, estado visible y pruebas automatizadas.

**Pendiente:** aceptación Chrome real; contrato EP oficial y allowlist; envío remoto idempotente; read-back/recibo EP; verificación OCP-MSP; clasificación futura de snapshots/segments.

El PASS local-first, la auditoría del paquete y el test del instalador en runner Windows no equivalen a aceptación Chrome ni a persistencia remota. La rama queda lista para revisión técnica; main conserva el producto 0.10.39.
