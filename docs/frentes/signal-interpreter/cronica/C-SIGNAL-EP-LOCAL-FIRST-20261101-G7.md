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
- Main conserva el producto 0.10.39 y no contiene la implementación local-first. No se fusionó la rama, no se cambió el manifiesto ni se creó release.
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
- Run `41359731237`, SHA `880cdce9b794df43127c44ca9c7d98e4f82665dc`: SUCCESS. Node 22; sintaxis y pruebas fake-indexeddb.
- El fixture parte de una DB v2 sintética y valida preservación de eventos, snapshots, segmentos y metadata; piso de secuencia heredado; commit atómico evento/secuencia/outbox/ledger; rechazo de secuencia fuera de orden; recuperación; reintentos; bloqueo de flush y retención de fuentes pendientes.
- Run `41359755454`, SHA `b6604e65a3d687959468b1d6a64d4c0d646580e4`: auditoría estática del paquete SUCCESS. Las huellas de `background.js`, `telemetry-db.js` y superficies de popup quedaron registradas en `payload-sha256.json`.
- Run `41359791711`, SHA `0528c09b91d078d29a8a35e8f07f01bf52e88a9e`: workflow Windows Native Messaging / instalador PowerShell 5.1 SUCCESS; validación del paquete sintético en CI, no instalación en el perfil del operador.
- El workflow `observability-audit.yml` del OCP v0.15 también pasó en SHA `1ccfd6fbfc735f3454174d102adef2aaf557594a`, run `41359821042`. El workflow Windows para ese mismo SHA estaba en curso al redactar esta crónica; se conserva como pendiente de read-back final en el siguiente checkpoint.
- Los primeros runs fallidos correspondieron a hashes de payload obsoletos y al fixture que intentó reasignar `globalThis.crypto` en Node 22. Se corrigieron ambos: se usa WebCrypto nativo y se actualizaron los SHA-256. Los runs posteriores anteriores citados ya pasan; no se ocultan las ejecuciones fallidas históricas.

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
