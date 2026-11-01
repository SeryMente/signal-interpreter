(function (global) {
  "use strict";
  var DB_NAME = "signal-interpreter-telemetry";
  var DB_VERSION = 3;
  var dbPromise = null;

  function requestPromise(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("IndexedDB request failed")); };
    });
  }
  function transactionDone(transaction) {
    return new Promise(function (resolve, reject) {
      transaction.oncomplete = function () { resolve(); };
      transaction.onerror = function () { reject(transaction.error || new Error("IndexedDB transaction failed")); };
      transaction.onabort = function () { reject(transaction.error || new Error("IndexedDB transaction aborted")); };
    });
  }
  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains("events")) {
          var events = db.createObjectStore("events", { keyPath: "sequence" });
          events.createIndex("timestamp", "timestamp", { unique: false });
          events.createIndex("action", "action", { unique: false });
          events.createIndex("level", "level", { unique: false });
          events.createIndex("sessionId", "sessionId", { unique: false });
        }
        if (!db.objectStoreNames.contains("snapshots")) {
          var snapshots = db.createObjectStore("snapshots", { keyPath: "id", autoIncrement: true });
          snapshots.createIndex("capturedAt", "capturedAt", { unique: false });
          snapshots.createIndex("key", "key", { unique: false });
        }
        if (!db.objectStoreNames.contains("signalSegments")) {
          var segments = db.createObjectStore("signalSegments", { keyPath: "id" });
          segments.createIndex("sessionId", "sessionId", { unique: false });
          segments.createIndex("timestamp", "timestamp", { unique: false });
        }
        if (!db.objectStoreNames.contains("metadata")) db.createObjectStore("metadata", { keyPath: "key" });
        if (!db.objectStoreNames.contains("epOutbox")) {
          var outbox = db.createObjectStore("epOutbox", { keyPath: "operationRef" });
          outbox.createIndex("sequence", "sourceSequence", { unique: true });
          outbox.createIndex("eventId", "eventId", { unique: true });
          outbox.createIndex("cloudState", "cloudState", { unique: false });
          outbox.createIndex("nextAttemptAt", "nextAttemptAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("epLedger")) {
          var ledger = db.createObjectStore("epLedger", { keyPath: "operationRef" });
          ledger.createIndex("eventId", "eventId", { unique: true });
          ledger.createIndex("sourceSequence", "sourceSequence", { unique: true });
        }
      };
      request.onsuccess = function () {
        var db = request.result;
        db.onversionchange = function () { db.close(); dbPromise = null; };
        resolve(db);
      };
      request.onerror = function () { dbPromise = null; reject(request.error || new Error("IndexedDB open failed")); };
    });
    return dbPromise;
  }
  async function put(storeName, value) {
    var db = await open();
    var tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    await transactionDone(tx);
    return value;
  }
  async function putMany(storeName, values) {
    if (!values || !values.length) return 0;
    var db = await open();
    var tx = db.transaction(storeName, "readwrite");
    var store = tx.objectStore(storeName);
    values.forEach(function (value) { store.put(value); });
    await transactionDone(tx);
    return values.length;
  }
  async function getAll(storeName) {
    var db = await open();
    var tx = db.transaction(storeName, "readonly");
    var done = transactionDone(tx);
    var values = await requestPromise(tx.objectStore(storeName).getAll());
    await done;
    return values;
  }
  async function count(storeName) {
    var db = await open();
    var tx = db.transaction(storeName, "readonly");
    var done = transactionDone(tx);
    var result = await requestPromise(tx.objectStore(storeName).count());
    await done;
    return result;
  }
  async function edge(storeName, direction) {
    var db = await open();
    var tx = db.transaction(storeName, "readonly");
    var done = transactionDone(tx);
    var request = tx.objectStore(storeName).openCursor(null, direction);
    var result = await new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result ? request.result.value : null); };
      request.onerror = function () { reject(request.error); };
    });
    await done;
    return result;
  }
  async function getEventsAfter(sequence, limit) {
    var db=await open(),tx=db.transaction("events","readonly"),done=transactionDone(tx),store=tx.objectStore("events"),max=Math.max(1,Math.min(1000,Number(limit)||200)),values=[];
    var request=store.openCursor(IDBKeyRange.lowerBound(Number(sequence)||0,true),"next");
    await new Promise(function(resolve,reject){request.onsuccess=function(){var cursor=request.result;if(!cursor||values.length>=max){resolve();return}values.push(cursor.value);cursor.continue()};request.onerror=function(){reject(request.error||new Error("Event cursor failed"))}});
    await done;return values;
  }

  function bytesToHex(buffer) {
    return Array.from(new Uint8Array(buffer)).map(function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }
  async function sha256Hex(value) {
    if (!global.crypto || !global.crypto.subtle || !global.TextEncoder) throw new Error("WebCrypto SHA-256 is unavailable");
    var digest = await global.crypto.subtle.digest("SHA-256", new global.TextEncoder().encode(String(value)));
    return bytesToHex(digest);
  }
  async function ensureSequenceAtLeast(sequenceFloor) {
    var floor = Number(sequenceFloor);
    if (!Number.isSafeInteger(floor) || floor < 0) floor = 0;
    var db = await open();
    var tx = db.transaction(["metadata", "events"], "readwrite");
    var done = transactionDone(tx);
    var metadataStore = tx.objectStore("metadata");
    var eventStore = tx.objectStore("events");
    var metadataRequest = metadataStore.get("eventSequence");
    var latestRequest = eventStore.openCursor(null, "prev");
    var readyCount = 0;
    var metadataSequence = 0;
    var storedSequence = 0;
    var result = 0;
    var failed = false;
    function fail() {
      if (failed) return;
      failed = true;
      try { tx.abort(); } catch (_) {}
    }
    function commitWhenReady() {
      readyCount += 1;
      if (readyCount !== 2 || failed) return;
      result = Math.max(floor, metadataSequence, storedSequence);
      if (result !== metadataSequence) {
        metadataStore.put({ key: "eventSequence", value: result, updatedAt: new Date().toISOString() });
      }
    }
    metadataRequest.onsuccess = function () {
      metadataSequence = Number(metadataRequest.result && metadataRequest.result.value || 0);
      commitWhenReady();
    };
    metadataRequest.onerror = fail;
    latestRequest.onsuccess = function () {
      storedSequence = Number(latestRequest.result && latestRequest.result.value && latestRequest.result.value.sequence || 0);
      commitWhenReady();
    };
    latestRequest.onerror = fail;
    await done;
    return result;
  }

  async function getNextEventSequence() {
    var db = await open();
    var tx = db.transaction(["metadata", "events"], "readonly");
    var done = transactionDone(tx);
    var metadataRequest = tx.objectStore("metadata").get("eventSequence");
    var latestRequest = tx.objectStore("events").openCursor(null, "prev");
    var values = await Promise.all([
      requestPromise(metadataRequest),
      new Promise(function (resolve, reject) {
        latestRequest.onsuccess = function () { resolve(latestRequest.result ? latestRequest.result.value : null); };
        latestRequest.onerror = function () { reject(latestRequest.error || new Error("Event sequence cursor failed")); };
      })
    ]);
    await done;
    var metadataSequence = Number(values[0] && values[0].value || 0);
    var storedSequence = Number(values[1] && values[1].sequence || 0);
    return Math.max(metadataSequence, storedSequence) + 1;
  }
  async function putEventsWithOutbox(events) {
    if (!Array.isArray(events) || !events.length) return 0;
    var written = 0;
    for (var i = 0; i < events.length; i += 1) {
      await putEventAndEnqueue(events[i]);
      written += 1;
    }
    return written;
  }
  async function putEventAndEnqueue(event) {
    if (!event || !Number.isSafeInteger(Number(event.sequence)) || Number(event.sequence) < 1 ||
        typeof event.id !== "string" || !event.id) throw new Error("Invalid local event identity");
    var serialized = JSON.stringify(event);
    var sourceHash = await sha256Hex(serialized);
    var operationRef = await sha256Hex("SIGNAL_INTERPRETER\n" + event.id + "\n" + sourceHash);
    var now = new Date().toISOString();
    var row = {
      schema: "signal-interpreter.ep-transfer.v1",
      consumer: "signal-interpreter",
      operationRef: operationRef,
      eventId: event.id,
      sourceStore: "events",
      sourceRef: "events#" + Number(event.sequence),
      sourceSequence: Number(event.sequence),
      sourceHash: sourceHash,
      sourceBytes: global.TextEncoder ? new global.TextEncoder().encode(serialized).length : serialized.length,
      localState: "LOCAL_DURABLE",
      cloudState: "CLOUD_PENDING",
      eligibility: "PENDING_ALLOWLIST_APPROVAL",
      attempts: 0,
      nextAttemptAt: 0,
      lastErrorCode: null,
      receipt: null,
      createdAt: now,
      updatedAt: now
    };
    var db = await open();
    var tx = db.transaction(["events", "metadata", "epOutbox", "epLedger"], "readwrite");
    var done = transactionDone(tx);
    var metadataRequest = tx.objectStore("metadata").get("eventSequence");
    var latestRequest = tx.objectStore("events").openCursor(null, "prev");
    var readyCount = 0;
    var metadataSequence = 0;
    var storedSequence = 0;
    var failed = false;
    function fail(message) {
      if (failed) return;
      failed = true;
      try { tx.abort(); } catch (_) {}
      row.error = message;
    }
    function commitWhenReady() {
      readyCount += 1;
      if (readyCount !== 2 || failed) return;
      var expected = Math.max(metadataSequence, storedSequence) + 1;
      if (Number(event.sequence) !== expected) {
        fail("Event sequence changed before the local transaction committed");
        return;
      }
      tx.objectStore("events").add(event);
      tx.objectStore("metadata").put({ key: "eventSequence", value: Number(event.sequence), updatedAt: now });
      tx.objectStore("epOutbox").add(row);
      tx.objectStore("epLedger").add(Object.assign({}, row));
    }
    metadataRequest.onsuccess = function () {
      metadataSequence = Number(metadataRequest.result && metadataRequest.result.value || 0);
      commitWhenReady();
    };
    metadataRequest.onerror = function () { fail("Unable to read local event sequence"); };
    latestRequest.onsuccess = function () {
      storedSequence = Number(latestRequest.result && latestRequest.result.value && latestRequest.result.value.sequence || 0);
      commitWhenReady();
    };
    latestRequest.onerror = function () { fail("Unable to read latest local event"); };
    try {
      await done;
    } catch (error) {
      if (row.error) throw new Error(row.error);
      throw error;
    }
    return { event: event, operationRef: operationRef, sourceHash: sourceHash, sourceBytes: row.sourceBytes, localState: row.localState, cloudState: row.cloudState };
  }
  async function getEventBySequence(sequence) {
    var db = await open();
    var tx = db.transaction("events", "readonly");
    var done = transactionDone(tx);
    var value = await requestPromise(tx.objectStore("events").get(Number(sequence)));
    await done;
    return value || null;
  }
  async function getEpStatus() {
    var db = await open();
    var tx = db.transaction(["epOutbox", "epLedger"], "readonly");
    var done = transactionDone(tx);
    var values = await Promise.all([
      requestPromise(tx.objectStore("epOutbox").getAll()),
      requestPromise(tx.objectStore("epLedger").count())
    ]);
    await done;
    var rows = values[0] || [];
    var pending = rows.filter(function (row) { return row.cloudState !== "EP_PERSISTED_VERIFIED"; });
    return {
      schema: "signal-interpreter.ep-consumer-status.v1",
      consumer: "signal-interpreter",
      localState: "LOCAL_DURABLE",
      localRecords: values[1],
      cloudPendingCount: pending.length,
      eligibilityPendingCount: rows.filter(function (row) { return row.eligibility === "PENDING_ALLOWLIST_APPROVAL"; }).length,
      retryingCount: rows.filter(function (row) { return Number(row.attempts || 0) > 0; }).length,
      epTransportEnabled: false,
      epContractVersion: null,
      remoteState: "NOT_CONNECTED",
      blockers: ["ALLOWLIST_NOT_APPROVED", "EP_OFFICIAL_CONTRACT_UNAVAILABLE"]
    };
  }
  async function listEpPending(limit) {
    var rows = await getAll("epOutbox");
    return rows.filter(function (row) { return row.cloudState !== "EP_PERSISTED_VERIFIED"; })
      .sort(function (a, b) { return Number(a.sourceSequence) - Number(b.sourceSequence); })
      .slice(0, Math.max(1, Math.min(500, Number(limit) || 100)));
  }
  async function deferEpOperation(operationRef, errorCode) {
    var db = await open();
    var tx = db.transaction(["epOutbox", "epLedger"], "readwrite");
    var done = transactionDone(tx);
    var outbox = tx.objectStore("epOutbox");
    var ledger = tx.objectStore("epLedger");
    var req = outbox.get(operationRef);
    var updated = false;
    req.onsuccess = function () {
      var row = req.result;
      if (!row) return;
      row.attempts = Math.min(1000000, Number(row.attempts || 0) + 1);
      row.nextAttemptAt = Date.now() + Math.min(3600000, 1000 * Math.pow(2, Math.min(12, row.attempts)));
      row.lastErrorCode = String(errorCode || "ep-not-connected").slice(0, 80);
      row.updatedAt = new Date().toISOString();
      outbox.put(row);
      ledger.put(Object.assign({}, row));
      updated = true;
    };
    await done;
    return updated;
  }
  async function recoverEpOperation(operationRef) {
    var db = await open();
    var tx = db.transaction("epLedger", "readonly");
    var done = transactionDone(tx);
    var row = await requestPromise(tx.objectStore("epLedger").get(operationRef));
    await done;
    if (!row) return { found: false, localVerified: false, epVerified: false, reason: "operation-not-found" };
    var event = await getEventBySequence(row.sourceSequence);
    var sourceHashValid = !!event && event.id === row.eventId && await sha256Hex(JSON.stringify(event)) === row.sourceHash;
    var expectedOperationRef = sourceHashValid ? await sha256Hex("SIGNAL_INTERPRETER\n" + row.eventId + "\n" + row.sourceHash) : null;
    var localVerified = sourceHashValid && expectedOperationRef === row.operationRef;
    return {
      found: true,
      operationRef: row.operationRef,
      eventId: row.eventId,
      sourceSequence: row.sourceSequence,
      localVerified: localVerified,
      epVerified: false,
      remoteState: "NOT_QUERIED",
      reason: localVerified ? "EP_OFFICIAL_CONTRACT_UNAVAILABLE" : "local-source-integrity-error"
    };
  }
  async function flushEp(options) {
    await getEpStatus();
    return { attempted: 0, persisted: 0, blocked: true, reason: "EP_CONTRACT_OR_ALLOWLIST_NOT_AVAILABLE", optionsAccepted: Object.keys(options || {}).length };
  }
  async function protectedEventSequences() {
    var rows = await getAll("epOutbox");
    return new Set(rows.filter(function (row) {
      return ["CLOUD_PENDING", "CLOUD_IN_FLIGHT", "EP_RECEIVED", "RECONCILE_REQUIRED", "RETRYABLE"].indexOf(row.cloudState) >= 0;
    }).map(function (row) { return Number(row.sourceSequence); }));
  }

  async function getSignalSegments(sessionId, limit) {
    var db = await open();
    var tx = db.transaction("signalSegments", "readonly");
    var done = transactionDone(tx);
    var index = tx.objectStore("signalSegments").index("sessionId");
    var request = index.getAll(IDBKeyRange.only(sessionId));
    var values = await requestPromise(request);
    await done;
    var max = Math.max(1, Math.min(1000, Number(limit) || 200));
    values.sort(function (a, b) {
      var at = Date.parse(a && a.timestamp || 0), bt = Date.parse(b && b.timestamp || 0);
      if (Number.isFinite(at) && Number.isFinite(bt) && at !== bt) return at - bt;
      return String(a && a.id || "").localeCompare(String(b && b.id || ""));
    });
    return values.slice(-max);
  }
  async function deleteSignalSession(sessionId) {
    var db = await open();
    var tx = db.transaction("signalSegments", "readwrite");
    var done = transactionDone(tx);
    var index = tx.objectStore("signalSegments").index("sessionId");
    var request = index.openCursor(IDBKeyRange.only(sessionId));
    await new Promise(function (resolve, reject) {
      request.onsuccess = function () {
        var cursor = request.result;
        if (!cursor) { resolve(); return; }
        cursor.delete();
        cursor.continue();
      };
      request.onerror = function () { reject(request.error); };
    });
    await done;
  }
  async function deleteBefore(storeName, indexName, cutoffIso) {
    if (storeName !== "events") {
      var dbSimple = await open();
      var txSimple = dbSimple.transaction(storeName, "readwrite");
      var doneSimple = transactionDone(txSimple);
      var idxSimple = txSimple.objectStore(storeName).index(indexName);
      var reqSimple = idxSimple.openCursor(IDBKeyRange.upperBound(cutoffIso, true));
      var removedSimple = 0;
      await new Promise(function (resolve, reject) {
        reqSimple.onsuccess = function () {
          var cursor = reqSimple.result;
          if (!cursor) { resolve(); return; }
          cursor.delete(); removedSimple += 1; cursor.continue();
        };
        reqSimple.onerror = function () { reject(reqSimple.error); };
      });
      await doneSimple;
      return removedSimple;
    }
    var db = await open();
    var tx = db.transaction(["events", "epOutbox"], "readwrite");
    var done = transactionDone(tx);
    var pendingRequest = tx.objectStore("epOutbox").getAll();
    var eventIndex = tx.objectStore("events").index(indexName);
    var request = eventIndex.openCursor(IDBKeyRange.upperBound(cutoffIso, true));
    var protectedSequences = new Set();
    var pendingReady = false;
    var cursorReady = false;
    var deleted = 0;
    var cursor = null;
    function process() {
      if (!pendingReady || !cursorReady) return;
      while (cursor) {
        if (protectedSequences.has(Number(cursor.value.sequence))) {
          cursor.continue();
          return;
        }
        cursor.delete();
        deleted += 1;
        cursor.continue();
        return;
      }
    }
    pendingRequest.onsuccess = function () {
      (pendingRequest.result || []).forEach(function (row) {
        if (["CLOUD_PENDING", "CLOUD_IN_FLIGHT", "EP_RECEIVED", "RECONCILE_REQUIRED", "RETRYABLE"].indexOf(row.cloudState) >= 0) {
          protectedSequences.add(Number(row.sourceSequence));
        }
      });
      pendingReady = true;
      process();
    };
    pendingRequest.onerror = function () { try { tx.abort(); } catch (_) {} };
    request.onsuccess = function () { cursor = request.result; cursorReady = true; process(); };
    request.onerror = function () { try { tx.abort(); } catch (_) {} };
    await done;
    return { deleted: deleted, protected: protectedSequences.size };
  }
  async function trimEvents(maxEvents) {
    var total = await count("events");
    var excess = Math.max(0, total - Math.max(1000, Number(maxEvents) || 250000));
    if (!excess) return { deleted: 0, protected: 0, remainingOverLimit: 0 };
    var db = await open();
    var tx = db.transaction(["events", "epOutbox"], "readwrite");
    var done = transactionDone(tx);
    var events = tx.objectStore("events");
    var pendingRequest = tx.objectStore("epOutbox").getAll();
    var countRequest = events.count();
    var protectedSequences = new Set();
    var pendingReady = false;
    var countReady = false;
    var deleted = 0;
    var remaining = total;
    function beginCursor() {
      if (!pendingReady || !countReady) return;
      var cursorRequest = events.openCursor(null, "next");
      cursorRequest.onsuccess = function () {
        var cursor = cursorRequest.result;
        if (!cursor || deleted >= excess) return;
        if (protectedSequences.has(Number(cursor.value.sequence))) {
          cursor.continue();
          return;
        }
        cursor.delete();
        deleted += 1;
        remaining -= 1;
        cursor.continue();
      };
      cursorRequest.onerror = function () { try { tx.abort(); } catch (_) {} };
    }
    pendingRequest.onsuccess = function () {
      (pendingRequest.result || []).forEach(function (row) {
        if (["CLOUD_PENDING", "CLOUD_IN_FLIGHT", "EP_RECEIVED", "RECONCILE_REQUIRED", "RETRYABLE"].indexOf(row.cloudState) >= 0) {
          protectedSequences.add(Number(row.sourceSequence));
        }
      });
      pendingReady = true;
      beginCursor();
    };
    pendingRequest.onerror = function () { try { tx.abort(); } catch (_) {} };
    countRequest.onsuccess = function () { remaining = countRequest.result; countReady = true; beginCursor(); };
    countRequest.onerror = function () { try { tx.abort(); } catch (_) {} };
    await done;
    return { deleted: deleted, protected: protectedSequences.size, remainingOverLimit: Math.max(0, remaining - Math.max(1000, Number(maxEvents) || 250000)) };
  }
  async function trimSignalSegments(maxSegments) {
    var total = await count("signalSegments");
    var excess = Math.max(0, total - Math.max(1000, Number(maxSegments) || 100000));
    if (!excess) return 0;
    var db = await open();
    var tx = db.transaction("signalSegments", "readwrite");
    var done = transactionDone(tx);
    var request = tx.objectStore("signalSegments").openCursor();
    var deleted = 0;
    await new Promise(function (resolve, reject) {
      request.onsuccess = function () {
        var cursor = request.result;
        if (!cursor || deleted >= excess) { resolve(); return; }
        cursor.delete(); deleted += 1; cursor.continue();
      };
      request.onerror = function () { reject(request.error); };
    });
    await done;
    return deleted;
  }
  async function prune(options) {
    options = options || {};
    var days = Math.max(7, Number(options.retentionDays) || 180);
    var cutoff = new Date(Date.now() - days * 86400000).toISOString();
    var expiredEventResult = await deleteBefore("events", "timestamp", cutoff);
    var expiredEvents = expiredEventResult.deleted;
    var expiredSnapshots = await deleteBefore("snapshots", "capturedAt", cutoff);
    var expiredSignalSegments = await deleteBefore("signalSegments", "timestamp", cutoff);
    var excessEventResult = await trimEvents(options.maxEvents || 250000);
    var excessEvents = excessEventResult.deleted;
    var excessSignalSegments = await trimSignalSegments(options.maxSignalSegments || 100000);
    return {
      cutoff: cutoff,
      expiredEvents: expiredEvents,
      expiredSnapshots: expiredSnapshots,
      expiredSignalSegments: expiredSignalSegments,
      excessEvents: excessEvents,
      protectedEvents: Math.max(expiredEventResult.protected, excessEventResult.protected),
      remainingEventsOverLimit: excessEventResult.remainingOverLimit,
      excessSignalSegments: excessSignalSegments
    };
  }
  async function stats() {
    var results = await Promise.all([
      count("events"),
      count("snapshots"),
      count("signalSegments"),
      edge("events", "next"),
      edge("events", "prev")
    ]);
    var estimate = null;
    try { estimate = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null; } catch (_) {}
    return {
      database: DB_NAME,
      events: results[0],
      snapshots: results[1],
      signalSegments: results[2],
      oldestEventAt: results[3] && results[3].timestamp || null,
      newestEventAt: results[4] && results[4].timestamp || null,
      usageBytes: estimate && estimate.usage || null,
      quotaBytes: estimate && estimate.quota || null
    };
  }
  async function getLatest(storeName, indexName) {
    var db=await open(),tx=db.transaction(storeName,"readonly"),done=transactionDone(tx),store=tx.objectStore(storeName),result=null;
    var request=indexName?store.index(indexName).openCursor(null,"prev"):store.openCursor(null,"prev");
    await new Promise(function(resolve,reject){request.onsuccess=function(){result=request.result?request.result.value:null;resolve()};request.onerror=function(){reject(request.error)}});await done;return result;
  }
  async function clear() {
    var status = await getEpStatus();
    if (status.cloudPendingCount > 0) throw new Error("Cannot clear local telemetry while EP transfers are pending or unverified");
    var db = await open();
    var tx = db.transaction(["events", "snapshots", "signalSegments", "metadata", "epOutbox", "epLedger"], "readwrite");
    tx.objectStore("events").clear();
    tx.objectStore("snapshots").clear();
    tx.objectStore("signalSegments").clear();
    tx.objectStore("metadata").clear();
    tx.objectStore("epOutbox").clear();
    tx.objectStore("epLedger").clear();
    await transactionDone(tx);
  }

  global.KhoraTelemetryDB = {
    open: open,
    putEvent: putEventAndEnqueue,
    putEventAndEnqueue: putEventAndEnqueue,
    getNextEventSequence: getNextEventSequence,
    getEventBySequence: getEventBySequence,
    ensureSequenceAtLeast: ensureSequenceAtLeast,
    enqueue: function (event) { return putEventAndEnqueue(event); },
    flush: flushEp,
    getStatus: getEpStatus,
    listPending: listEpPending,
    defer: deferEpOperation,
    recover: recoverEpOperation,
    putEvents: putEventsWithOutbox,
    getEvents: function () { return getAll("events"); },
    getEventsAfter: getEventsAfter,
    putSnapshot: function (snapshot) { return put("snapshots", snapshot); },
    getSnapshots: function () { return getAll("snapshots"); },
    putSignalSegment: function (segment) { return put("signalSegments", segment); },
    getSignalSegments: getSignalSegments,
    getAllSignalSegments: function () { return getAll("signalSegments"); },
    clearSignalSession: deleteSignalSession,
    putMetadata: function (key, value) { return put("metadata", { key: key, value: value, updatedAt: new Date().toISOString() }); },
    stats: stats,
    getLatest: getLatest,
    prune: prune,
    clear: clear
  };
})(typeof self !== "undefined" ? self : window);