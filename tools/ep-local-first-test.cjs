'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
require('fake-indexeddb/auto');
globalThis.self = globalThis;
globalThis.TextEncoder = globalThis.TextEncoder || require('node:util').TextEncoder;
require('../extension/telemetry-db.js');


async function seedV2Database() {
  await new Promise((resolve, reject) => {
    const request = indexedDB.open('signal-interpreter-telemetry', 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      const events = db.createObjectStore('events', { keyPath: 'sequence' });
      events.createIndex('timestamp', 'timestamp', { unique: false });
      events.createIndex('action', 'action', { unique: false });
      events.createIndex('level', 'level', { unique: false });
      events.createIndex('sessionId', 'sessionId', { unique: false });
      const snapshots = db.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true });
      snapshots.createIndex('capturedAt', 'capturedAt', { unique: false });
      snapshots.createIndex('key', 'key', { unique: false });
      const segments = db.createObjectStore('signalSegments', { keyPath: 'id' });
      segments.createIndex('sessionId', 'sessionId', { unique: false });
      segments.createIndex('timestamp', 'timestamp', { unique: false });
      db.createObjectStore('metadata', { keyPath: 'key' });
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(['events', 'snapshots', 'signalSegments', 'metadata'], 'readwrite');
      tx.objectStore('events').put(makeEvent(7, 'si-legacy-v2-event'));
      tx.objectStore('snapshots').put({ key: 'legacy-v2-snapshot', capturedAt: '2000-01-01T00:00:00.000Z', value: { fixture: true } });
      tx.objectStore('signalSegments').put({ id: 'legacy-v2-segment', sessionId: 'legacy', timestamp: '2000-01-01T00:00:00.000Z' });
      tx.objectStore('metadata').put({ key: 'eventSequence', value: 7, updatedAt: '2000-01-01T00:00:00.000Z' });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
}

function makeEvent(sequence, id) {
  return {
    schema: 'khora-effectif-event/v4',
    id: id || 'event-' + sequence,
    sequence,
    timestamp: '2000-01-01T00:00:00.000Z',
    ingestedAt: '2000-01-01T00:00:01.000Z',
    action: 'LOCAL_FIRST_TEST',
    payload: { reasonCode: 'synthetic-fixture' },
    privacy: { rawTextStored: false, captionTextStored: false }
  };
}

test('SI event, sequence, outbox and ledger commit atomically; pruning protects pending EP sources', async () => {
  const db = globalThis.KhoraTelemetryDB;
  await seedV2Database();
  assert.equal((await db.stats()).events, 1);
  assert.equal((await db.stats()).snapshots, 1);
  assert.equal((await db.stats()).signalSegments, 1);
  assert.equal(await db.getNextEventSequence(), 8);
  const first = makeEvent(8, 'si-ep-test-0001');
  const written = await db.putEventAndEnqueue(first);
  assert.equal(written.localState, 'LOCAL_DURABLE');
  assert.equal(written.cloudState, 'CLOUD_PENDING');
  assert.match(written.operationRef, /^[0-9a-f]{64}$/);

  const statusAfterFirst = await db.getStatus();
  assert.equal(statusAfterFirst.localRecords, 1);
  assert.equal(statusAfterFirst.cloudPendingCount, 1);
  assert.equal(statusAfterFirst.epTransportEnabled, false);

  const pendingFirst = await db.listPending(10);
  assert.equal(pendingFirst.length, 1);
  assert.equal(pendingFirst[0].operationRef, written.operationRef);
  assert.equal(pendingFirst[0].sourceHash, written.sourceHash);

  const recovery = await db.recover(written.operationRef);
  assert.equal(recovery.found, true);
  assert.equal(recovery.localVerified, true);
  assert.equal(recovery.epVerified, false);

  const blockedFlush = await db.flush();
  assert.equal(blockedFlush.blocked, true);
  assert.equal(blockedFlush.attempted, 0);

  await assert.rejects(
    () => db.putEventAndEnqueue(makeEvent(10, 'si-ep-test-skip-sequence')),
    /Event sequence changed/
  );
  assert.equal(await db.getNextEventSequence(), 9);
  assert.equal((await db.getStatus()).localRecords, 1);

  await db.defer(written.operationRef, 'synthetic-offline');
  const deferred = await db.listPending(10);
  assert.equal(deferred[0].operationRef, written.operationRef);
  assert.equal(deferred[0].attempts, 1);
  assert.equal((await db.getStatus()).retryingCount, 1);

  for (let sequence = 9; sequence <= 1008; sequence += 1) {
    const event = makeEvent(sequence, 'si-ep-test-' + String(sequence).padStart(4, '0'));
    await db.putEventAndEnqueue(event);
  }

  const pruned = await db.prune({ retentionDays: 7, maxEvents: 1000, maxSignalSegments: 1000 });
  assert.equal(pruned.expiredEvents, 1);
  assert.equal(pruned.excessEvents, 0);
  assert.equal(pruned.protectedEvents >= 1001, true);
  assert.equal(pruned.remainingEventsOverLimit, 1);
  const stats = await db.stats();
  assert.equal(stats.events, 1001);

  await assert.rejects(
    () => db.clear(),
    /Cannot clear local telemetry while EP transfers are pending/
  );
});
