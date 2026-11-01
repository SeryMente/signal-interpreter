# Crónica · persistencia local-first EP · Signal Interpreter G7
Fecha del corte: 2026-11-01

## 1. Autoridad y alcance

- Continuidad: Signal Interpreter, control G7 ACTIVO, instancia única.
- Control releído de `main`: `docs/frentes/signal-interpreter/CONTROL-RESPONSABILIDAD.json`, blob `c1b4425fa91b5ac6acb90a52298ed9d07a62eaf5`. La autorización G7 permite desarrollo, pruebas automatizadas, CI y documentación dentro de sus límites.
- El acceso RDC continúa NO AUTORIZADO para esta continuidad. No se utilizó RDC, no se accedió a archivos de perfil ni se intervino Chrome.
- Solicitud operativa de continuidad del operador: «Bien avanza». Este corte queda limitado a una rama independiente; no autoriza llamadas reales, modificación de servicios EP/B2, despliegue, release, merge ni aceptación funcional.

## 2. Fuente normativa común

- DUG releído en `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`: v377 / NX-377m, blob `54064c8fe00f872023a455f06596061ed69062ae`.
- Metacanon 1.28; GOW 2.17; 22 anexos; MCP normativo DESACTIVADO.
- ART-028 establece dos capas: persistencia local durable primero, réplica EP verificable después; consumidores conservan almacenes locales independientes; no se permite transporte directo a B2 desde la extensión.
- No se identificó un contrato oficial EP versionado, SDK/API de consumidor, scopes, operación de lookup/read-back, recibo remoto, allowlist ni entorno OCP-MSP verificable. No se inventaron endpoints.

## 3. Rama y preservación de main

- Repositorio: `https://github.com/SeryMente/signal-interpreter`.
- Rama: `feat/si-ep-local-first-adapter-20261101`.
- Base: main SHA `59b4c9e4d3cdc80e7627ba1eef1d546da1fbb8c8`.
- El producto en main conserva manifest 0.10.39. No se incrementó versión, no se creó release y no se fusionó la rama.
- El código de desarrollo permanece aislado en la rama indicada; no se materializó ni instaló en el equipo del operador.

## 4. Implementación local-first

### 4.1 IndexedDB v3

- `extension/telemetry-db.js` cambia DB_VERSION de 2 a 3.
- Conserva stores v2 `events`, `snapshots`, `signalSegments` y `metadata`; añade `epOutbox` y `epLedger` sin borrar los stores previos.
- Cada evento elegible para este corte se confirma en una sola transacción read-write que incluye:
  1. `events`: evento original ya saneado;
  2. `metadata`: checkpoint de secuencia;
  3. `epOutbox`: referencia de réplica;
  4. `epLedger`: identidad/hash/estado de la operación.
- `operationRef` se deriva de SHA-256 de `SIGNAL_INTERPRETER`, event.id y SHA-256 del evento serializado. No incluye payload adicional ni secreto.
- `background.js` solicita la secuencia siguiente desde IndexedDB; solo después de un commit local actualiza el mirror de `chrome.storage.local` y notifica al relay legado. Un error de IndexedDB no avanza la secuencia ni crea mirror/ACK de relay.
- `chrome.storage.local.effectifEventSequence` se conserva como piso de migración legado; `ensureSequenceAtLeast` toma el máximo entre ese piso, metadata de IndexedDB y el último evento almacenado. No crea eventos ni rellena huecos. Tras inicializar, IndexedDB es la fuente de verdad.

### 4.2 Adaptador y estados

- Métodos internos expuestos en `KhoraTelemetryDB`: `enqueue`, `listPending`, `defer`, `getStatus`, `recover`, `flush`.
- Los estados locales se mantienen separados de nube: `LOCAL_DURABLE`, `CLOUD_PENDING`, elegibilidad `PENDING_ALLOWLIST_APPROVAL`.
- `defer` registra intentos, causa de error saneada y backoff exponencial con tope de una hora.
- `recover` recupera el evento por secuencia y coteja tanto el hash del original como la identidad `operationRef`.
- `flush` permanece bloqueado, con `attempted=0`, mientras falten contrato oficial y allowlist.

### 4.3 Relay legado y retención

- El relay Vercel→GitHub sigue siendo el canal provisional existente. Su ACK/`ackedSequence` se conserva separado; no marca registros EP como confirmados ni altera el outbox EP.
- El pruning por antigüedad y por máximo de eventos consulta `epOutbox`. No elimina eventos en estados CLOUD_PENDING, CLOUD_IN_FLIGHT, EP_RECEIVED, RECONCILE_REQUIRED o RETRYABLE. Si el conjunto protegido supera el máximo, informa el exceso en lugar de borrar fuentes.
- `clear()` rechaza limpiar eventos, metadata, outbox y ledger cuando existan obligaciones de réplica sin cerrar.
- En este corte, solo el store `events` está incluido en el outbox. Snapshots y signalSegments permanecen locales y no se envían por inferencia; esperan clasificación/allowlist aprobada.

## 5. Pruebas y evidencia

- Workflow específico: `.github/workflows/ep-local-first.yml`.
- Run `41359731237`, SHA `880cdce9b794df43127c44ca9c7d98e4f82665dc`: SUCCESS. Node 22; syntax checks y prueba fake-indexeddb.
- El fixture parte de una base v2 sintética y comprueba preservación de eventos, snapshots, signalSegments y metadata, toma del piso de secuencia heredado, escritura atómica evento/secuencia/outbox/ledger, rechazo de secuencia fuera de orden, recuperación, reintento, bloqueo del flush y retención de todas las fuentes EP pendientes frente al pruning.
- Workflow de auditoría general: run `41359755454`, SHA `b6604e65a3d687959468b1d6a64d4c0d646580e4`: SUCCESS; inventario de payload actualizado y static audit aprobado.
- El workflow Windows `native-caption-host.yml` se ejecutó sobre el paquete con `payload-sha256.json` actualizado; el resultado final de la ejecución en el SHA de cierre debe quedar registrado por read-back antes de declarar aceptación de instalador. No equivale a instalar en el perfil de usuario.
- SHA-256 actualizados en `payload-sha256.json` para `extension/background.js`, `extension/telemetry-db.js`, `extension/ui/popup.html` y `extension/ui/popup.js`; la prueba de auditoría compara los hashes reales del árbol.

## 6. Límites

- No se ha conectado ni invocado un servicio remoto EP; no se ha verificado almacenamiento OCP-MSP, read-back remoto ni recibo EP.
- No se han añadido credenciales, tokens de consumidor ni B2 Application Keys a la extensión.
- No hay migración histórica ni backfill; los eventos v2 se conservan y no se convierten automáticamente en transferencias pendientes.
- No se ha cargado ni recargado la extensión en Chrome; no se ha probado IndexedDB real en Chrome, suspensión/reinicio del service worker, offline/online real ni una llamada controlada.
- No se ha modificado main, no hay merge, release ni despliegue.

## 7. Dictamen y checkpoint

**Implementado en rama:** almacenamiento transaccional local de eventos y outbox/ledger, recuperación local, secuencia monotónica de migración, retención protegida, estado visible y pruebas automatizadas.

**Pendiente:** E2E de Chrome real; contrato EP oficial y allowlist; envío remoto idempotente, read-back/recibo EP y verificación OCP-MSP; eventual elegibilidad de snapshots/segments.

El PASS de la suite local-first y de la auditoría del paquete no equivale a aceptación Windows/Chrome ni a persistencia remota. La rama queda lista para revisión técnica; main permanece intacta.
