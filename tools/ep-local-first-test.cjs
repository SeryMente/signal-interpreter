'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
require('fake-indexeddb/auto');
globalThis.self = globalThis;
globalThis.crypto = globalThis.crypto || require('node:crypto').webcrypto;
globalThis.TextEncoder = globalThis.TextEncoder || require('node:util').TextEncoder;
require('../extension/telemetry-db.js');

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
  await db.clear();

  assert.equal(await db.getNextEventSequence(), 1);
  const first = makeEvent(1, 'si-ep-test-0001');
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
    () => db.putEventAndEnqueue(makeEvent(3, 'si-ep-test-skip-sequence')),
    /Event sequence changed/
  );
  assert.equal(await db.getNextEventSequence(), 2);
  assert.equal((await db.getStatus()).localRecords, 1);

  await db.defer(written.operationRef, 'synthetic-offline');
  const deferred = await db.listPending(10);
  assert.equal(deferred[0].operationRef, written.operationRef);
  assert.equal(deferred[0].attempts, 1);
  assert.equal((await db.getStatus()).retryingCount, 1);

  for (let sequence = 2; sequence <= 1001; sequence += 1) {
    const event = makeEvent(sequence, 'si-ep-test-' + String(sequence).padStart(4, '0'));
    await db.putEventAndEnqueue(event);
  }

  const pruned = await db.prune({ retentionDays: 7, maxEvents: 1000, maxSignalSegments: 1000 });
  assert.equal(pruned.expiredEvents, 0);
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
