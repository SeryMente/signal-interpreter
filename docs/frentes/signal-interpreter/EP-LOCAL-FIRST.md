# Signal Interpreter · persistencia local-first y frontera EP

## Estado del corte

Implementación en la rama `feat/si-ep-local-first-adapter-20261101`; `main` permanece en 0.10.39 y no fue modificada.

- **Almacén canónico:** IndexedDB `signal-interpreter-telemetry`, actualizado de versión 2 a 3.
- **Outbox y ledger:** nuevos object stores `epOutbox` y `epLedger`, ambos locales y durables dentro de la misma base.
- **Captura:** evento, metadata de secuencia, outbox y ledger se confirman en una sola transacción IndexedDB.
- **Transporte remoto:** deshabilitado. No existe un contrato oficial EP verificado ni una allowlist autorizada; `flush()` devuelve `blocked=true` y `attempted=0`.
- **Relay legado:** Vercel→GitHub continúa operando como camino provisional, separado del estado EP. Su ACK y `ackedSequence` no equivalen a `EP_PERSISTED_VERIFIED`.

## Secuencia y migración v2→v3

La actualización de esquema crea los dos stores nuevos sin borrar ni recrear los stores existentes `events`, `snapshots`, `signalSegments` y `metadata`.

La secuencia local se deriva del máximo entre:
1. `metadata.eventSequence` en IndexedDB,
2. la secuencia del último evento local,
3. el contador histórico `effectifEventSequence` de `chrome.storage.local`, utilizado solo como piso de migración.

El piso se registra en IndexedDB sin crear un evento ni marcarlo como transferido. A partir de ahí, IndexedDB es la fuente de verdad. Los huecos de secuencia se permiten; no se reutilizan secuencias ni se rellena historia automáticamente.

## Transacción de captura

`putEventAndEnqueue(event)` calcula SHA-256 del evento saneado y un `operationRef` estable derivado de consumidor + `event.id` + hash. Después ejecuta una única transacción read-write sobre:

- `events`: fuente local original;
- `metadata`: checkpoint de secuencia;
- `epOutbox`: obligación de réplica pendiente;
- `epLedger`: identidad, hash, referencia y estado local/remoto.

Si la transacción falla, el evento no se confirma como durable, no avanza el contador y no se actualiza el mirror de `chrome.storage.local`. El relay legado tampoco recibe el evento. Si la escritura local confirma pero falla el mirror auxiliar, la fuente IndexedDB permanece válida y el error del mirror se registra por separado.

`appendEvent` notifica al relay legado solo después del commit local. Ese ACK conserva su semántica histórica y nunca modifica el ledger EP.

## Operaciones del adaptador

- `enqueue(event)`: confirma evento y referencia/outbox de forma transaccional.
- `listPending(limit)`: obtiene las referencias locales pendientes.
- `defer(operationRef, errorCode)`: registra intento, error saneado y backoff exponencial de hasta una hora.
- `getStatus()`: devuelve conteos locales y blockers EP sin payload sensible.
- `recover(operationRef)`: recupera la fuente local y coteja hash e identidad de operación.
- `flush(options)`: bloqueado hasta contrato oficial y allowlist; no realiza llamadas de red.

La identidad lógica permanece estable en reintentos. El mismo ID con contenido/operación incompatible produce conflicto mediante las restricciones únicas de IndexedDB y la validación de recuperación.

## Retención y eliminación

El pruning por antigüedad y por exceso de eventos consulta `epOutbox`. No elimina secuencias en `CLOUD_PENDING`, `CLOUD_IN_FLIGHT`, `EP_RECEIVED`, `RECONCILE_REQUIRED` o `RETRYABLE`. Si los pendientes exceden el límite, la cola puede permanecer por encima del máximo configurado y se reporta `remainingEventsOverLimit`; no se elimina la fuente para cumplir una cuota. `clear()` rechaza la limpieza mientras exista una obligación de réplica pendiente o no verificada.

En este corte solo se registran eventos de telemetría. Snapshots y signalSegments conservan sus stores y políticas locales; no se envían a EP ni se incluyen en una allowlist implícita. Su clasificación y elegibilidad quedan pendientes de política.

## Pruebas

Workflow: `.github/workflows/ep-local-first.yml` (Node 22, fake-indexeddb).

La prueba `tools/ep-local-first-test.cjs`:
- crea una DB v2 sintética y valida actualización a v3 conservando eventos, snapshots, segmentos y secuencia;
- toma un piso de secuencia heredado mayor sin generar registros históricos;
- verifica commit atómico de evento + metadata + outbox + ledger;
- provoca una secuencia fuera de orden y comprueba que no quedan registros parciales ni avance de contador;
- valida hash y recuperación local, retries/backoff y flush bloqueado;
- verifica que el pruning protege eventos pendientes y que `clear()` no destruye obligaciones abiertas.

La suite usa fake IndexedDB y datos sintéticos; no prueba el runtime IndexedDB de Chrome ni una suspensión real del service worker.

## Integridad del paquete

Los SHA-256 de `background.js`, `telemetry-db.js` y las dos superficies del popup se actualizaron en `payload-sha256.json`, que es leído por el test de inventario y por `INSTALAR.ps1`. La aceptación del paquete depende de que las auditorías estáticas y la prueba Windows PowerShell 5.1 sigan pasando con el mismo commit.

## Límites de aceptación

No se cargó ni recargó SI en Chrome; no se intervino ninguna llamada real. No se realizó prueba E2E contra EP, no se configuraron scopes, tokens, endpoint, B2 App Keys ni recibos remotos. No hubo backfill histórico, migración de datos, despliegue ni release. La prueba del relay legado no se presenta como persistencia EP.
