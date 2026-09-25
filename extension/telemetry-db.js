(function (global) {
  "use strict";
  var DB_NAME = "signal-interpreter-telemetry";
  var DB_VERSION = 2;
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
    var db = await open();
    var tx = db.transaction(storeName, "readwrite");
    var done = transactionDone(tx);
    var index = tx.objectStore(storeName).index(indexName);
    var request = index.openCursor(IDBKeyRange.upperBound(cutoffIso, true));
    var deleted = 0;
    await new Promise(function (resolve, reject) {
      request.onsuccess = function () {
        var cursor = request.result;
        if (!cursor) { resolve(); return; }
        cursor.delete(); deleted += 1; cursor.continue();
      };
      request.onerror = function () { reject(request.error); };
    });
    await done;
    return deleted;
  }
  async function trimEvents(maxEvents) {
    var total = await count("events");
    var excess = Math.max(0, total - Math.max(1000, Number(maxEvents) || 250000));
    if (!excess) return 0;
    var db = await open();
    var tx = db.transaction("events", "readwrite");
    var done = transactionDone(tx);
    var request = tx.objectStore("events").openCursor();
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
    var expiredEvents = await deleteBefore("events", "timestamp", cutoff);
    var expiredSnapshots = await deleteBefore("snapshots", "capturedAt", cutoff);
    var expiredSignalSegments = await deleteBefore("signalSegments", "timestamp", cutoff);
    var excessEvents = await trimEvents(options.maxEvents || 250000);
    var excessSignalSegments = await trimSignalSegments(options.maxSignalSegments || 100000);
    return {
      cutoff: cutoff,
      expiredEvents: expiredEvents,
      expiredSnapshots: expiredSnapshots,
      expiredSignalSegments: expiredSignalSegments,
      excessEvents: excessEvents,
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
  async function clear() {
    var db = await open();
    var tx = db.transaction(["events", "snapshots", "signalSegments", "metadata"], "readwrite");
    tx.objectStore("events").clear();
    tx.objectStore("snapshots").clear();
    tx.objectStore("signalSegments").clear();
    tx.objectStore("metadata").clear();
    await transactionDone(tx);
  }

  global.KhoraTelemetryDB = {
    open: open,
    putEvent: function (event) { return put("events", event); },
    putEvents: function (events) { return putMany("events", events); },
    getEvents: function () { return getAll("events"); },
    putSnapshot: function (snapshot) { return put("snapshots", snapshot); },
    getSnapshots: function () { return getAll("snapshots"); },
    putSignalSegment: function (segment) { return put("signalSegments", segment); },
    getSignalSegments: getSignalSegments,
    getAllSignalSegments: function () { return getAll("signalSegments"); },
    clearSignalSession: deleteSignalSession,
    putMetadata: function (key, value) { return put("metadata", { key: key, value: value, updatedAt: new Date().toISOString() }); },
    stats: stats,
    prune: prune,
    clear: clear
  };
})(typeof self !== "undefined" ? self : window);