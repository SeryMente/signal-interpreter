import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const SOURCE_ROOT = process.env.SIGNAL_INTERPRETER_REPO
  ? path.resolve(process.env.SIGNAL_INTERPRETER_REPO)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OBS = path.join(SOURCE_ROOT, "observations");
const BATCHES = path.join(OBS, "batches");
const LATEST = path.join(OBS, "latest");
const PORT = Number(process.env.SIGNAL_OBSERVATION_PORT || 8788);
const MAX_BYTES = 5 * 1024 * 1024;
const COMMIT_WINDOW_MS = Number(process.env.SIGNAL_OBSERVATION_COMMIT_WINDOW_MS || 600000);
const STATUS_FILE = process.env.SIGNAL_OBSERVATION_STATUS_FILE
  ? path.resolve(process.env.SIGNAL_OBSERVATION_STATUS_FILE)
  : path.join(process.env.USERPROFILE || os.homedir(), ".signal-interpreter", "observation-reporter-status.json");
const PUBLISH_ROOT = process.env.SIGNAL_OBSERVATION_PUBLISH_REPO
  ? path.resolve(process.env.SIGNAL_OBSERVATION_PUBLISH_REPO)
  : path.join(process.env.USERPROFILE || os.homedir(), ".signal-interpreter", "observation-publisher");
const REMOTE_URL = "https://github.com/SeryMente/signal-interpreter.git";
const PUBLISH_BRANCH = "main";

let syncTimer = null, syncRunning = false, dirty = false, forceNext = false;
const startedAt = new Date().toISOString();
const iso = () => new Date().toISOString();

function loadStatus() {
  try {
    const value = JSON.parse(fs.readFileSync(STATUS_FILE, "utf8"));
    return value && typeof value === "object" ? value : {};
  } catch (_) { return {}; }
}
function saveStatus(patch) {
  const value = Object.assign({}, loadStatus(), patch, { updatedAt: iso() });
  fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
  fs.writeFileSync(STATUS_FILE, JSON.stringify(value, null, 2) + "\n");
  return value;
}
function statusSnapshot() {
  return Object.assign({
    lastGitSyncAt: null, lastGitSyncCommit: null, lastGitSyncStatus: null,
    lastGitSyncError: null, lastAiReviewedAt: null
  }, loadStatus(), {
    dirty, gitSyncRunning: syncRunning, sourceRepo: SOURCE_ROOT,
    publisherRepo: PUBLISH_ROOT, publishBranch: PUBLISH_BRANCH, port: PORT, startedAt
  });
}
function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}
function runGit(args, cwd) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, windowsHide: true }, (error, stdout, stderr) => {
      if (error) reject(new Error((stderr || stdout || error.message).trim()));
      else resolve((stdout || "").trim());
    });
  });
}
async function ensurePublisherRepo() {
  fs.mkdirSync(path.dirname(PUBLISH_ROOT), { recursive: true });
  if (!fs.existsSync(path.join(PUBLISH_ROOT, ".git"))) {
    if (fs.existsSync(PUBLISH_ROOT)) fs.rmSync(PUBLISH_ROOT, { recursive: true, force: true });
    await runGit(["clone", "--branch", PUBLISH_BRANCH, "--single-branch", REMOTE_URL, PUBLISH_ROOT], SOURCE_ROOT);
    const userName = await runGit(["config", "--get", "user.name"], SOURCE_ROOT).catch(() => "");
    const userEmail = await runGit(["config", "--get", "user.email"], SOURCE_ROOT).catch(() => "");
    if (userName) await runGit(["config", "user.name", userName], PUBLISH_ROOT);
    if (userEmail) await runGit(["config", "user.email", userEmail], PUBLISH_ROOT);
  }
  await runGit(["fetch", "origin", PUBLISH_BRANCH], PUBLISH_ROOT);
  await runGit(["reset", "--hard", "origin/" + PUBLISH_BRANCH], PUBLISH_ROOT);
  await runGit(["clean", "-fd"], PUBLISH_ROOT);
}
function collectChangedObservations() {
  const changed = [];
  const copyIfChanged = (source, destination, relative) => {
    if (!fs.existsSync(source)) return;
    const sourceStat = fs.statSync(source);
    let destinationStat = null;
    try { destinationStat = fs.statSync(destination); } catch (_) {}
    if (!destinationStat || sourceStat.size !== destinationStat.size || sourceStat.mtimeMs > destinationStat.mtimeMs + 1) {
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
      changed.push(relative.replaceAll(path.sep, "/"));
    }
  };
  for (const dirName of ["batches", "latest"]) {
    const sourceDir = path.join(OBS, dirName);
    if (!fs.existsSync(sourceDir)) continue;
    const walk = (current, prefix) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const source = path.join(current, entry.name);
        const relative = path.join("observations", prefix, entry.name);
        if (entry.isDirectory()) walk(source, path.join(prefix, entry.name));
        else copyIfChanged(source, path.join(PUBLISH_ROOT, relative), relative);
      }
    };
    walk(sourceDir, dirName);
  }
  return changed;
}
function scheduleGitSync(force = false) {
  dirty = true; forceNext = forceNext || force;
  clearTimeout(syncTimer); syncTimer = setTimeout(runGitSync, force ? 5000 : COMMIT_WINDOW_MS);
}
async function runGitSync() {
  if (syncRunning || !dirty) return;
  syncRunning = true; dirty = false;
  const force = forceNext; forceNext = false;
  try {
    await ensurePublisherRepo();
    const changed = collectChangedObservations();
    if (!changed.length) {
      console.error("[observation-reporter]", iso(), "git-sync clean", "branch=" + PUBLISH_BRANCH);
      return;
    }
    await runGit(["add", "--", ...changed], PUBLISH_ROOT);
    const status = await runGit(["status", "--porcelain", "--", ...changed], PUBLISH_ROOT);
    let commit = null;
    if (status) {
      await runGit(["commit", "-m", force ? "diagnostic: publish critical observation batch" : "diagnostic: publish observation batch"], PUBLISH_ROOT);
      commit = await runGit(["rev-parse", "HEAD"], PUBLISH_ROOT);
      await runGit(["push", "origin", "HEAD:" + PUBLISH_BRANCH], PUBLISH_ROOT);
    }
    saveStatus({ lastGitSyncAt: iso(), lastGitSyncCommit: commit, lastGitSyncStatus: "ok", lastGitSyncError: null });
    console.error("[observation-reporter]", iso(), "git-sync ok", "commit=" + (commit || "clean"), "branch=" + PUBLISH_BRANCH);
  } catch (error) {
    dirty = true;
    saveStatus({ lastGitSyncStatus: "error", lastGitSyncError: String(error) });
    console.error("[observation-reporter]", iso(), "git-sync failed:", String(error));
    clearTimeout(syncTimer); syncTimer = setTimeout(runGitSync, COMMIT_WINDOW_MS);
  } finally { syncRunning = false; }
}
function sanitizeBatch(input) {
  if (!input || input.schema !== "signal-interpreter-observation-batch/v1") throw new Error("Schema de batch no soportado");
  const events = Array.isArray(input.events) ? input.events.slice(0, 200) : [];
  const safeEvents = events.map((e) => {
    const out = {};
    for (const k of ["schema","id","sequence","timestamp","ingestedAt","level","category","component","phase","action","outcome","traceId","operationId","parentEventId","attempt","durationMs","session","environment","expected","observed","reasonCode","error","metrics","context","privacy"])
      if (Object.hasOwn(e, k)) out[k] = e[k];
    return out;
  });
  return {
    schema: input.schema, batchId: String(input.batchId || ""), createdAt: String(input.createdAt || iso()),
    trigger: String(input.trigger || "scheduled"), extensionVersion: String(input.extensionVersion || "unknown"),
    summary: input.summary && typeof input.summary === "object" ? input.summary : {}, events: safeEvents
  };
}

saveStatus({ reporterStartedAt: startedAt, reporterStatus: "running" });

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS,GET");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (req.method === "GET" && req.url && req.url.startsWith("/health")) {
    const status = statusSnapshot();
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    return res.end(JSON.stringify({
      ok: true, service: "signal-observation-reporter", port: PORT,
      dirty, gitSyncRunning: syncRunning, sourceRepo: SOURCE_ROOT,
      publisherRepo: PUBLISH_ROOT, publishBranch: PUBLISH_BRANCH,
      startedAt, lastGitSyncAt: status.lastGitSyncAt,
      lastGitSyncCommit: status.lastGitSyncCommit, lastGitSyncStatus: status.lastGitSyncStatus,
      lastGitSyncError: status.lastGitSyncError, lastAiReviewedAt: status.lastAiReviewedAt
    }));
  }
  if (req.method !== "POST" || req.url !== "/v1/observation-batch") {
    res.writeHead(404); return res.end("Not found");
  }
  let size = 0, chunks = [];
  req.on("data", (chunk) => { size += chunk.length; if (size <= MAX_BYTES) chunks.push(chunk); });
  req.on("end", () => {
    try {
      if (size > MAX_BYTES) throw new Error("Batch demasiado grande");
      const batch = sanitizeBatch(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      if (!batch.batchId) throw new Error("batchId requerido");
      write(path.join(BATCHES, batch.batchId + ".json"), JSON.stringify(batch, null, 2) + "\n");
      const latest = { ...batch, receivedAt: iso() };
      write(path.join(LATEST, "latest.json"), JSON.stringify(latest, null, 2) + "\n");
      const s = batch.summary || {};
      const md = [
        "# Signal Interpreter latest observation", "", "- Batch: " + batch.batchId,
        "- Recibido: " + latest.receivedAt, "- Trigger: " + batch.trigger,
        "- Extension: " + batch.extensionVersion, "- Eventos: " + Number(s.eventsTotal || batch.events.length),
        "- Errores: " + Number(s.errors || 0), "- Warnings: " + Number(s.warnings || 0),
        "- Secuencia: " + Number(s.firstSequence || 0) + " -> " + Number(s.lastSequence || 0),
        "", "## Categorias", JSON.stringify(s.categories || {}, null, 2),
        "", "## Acciones", JSON.stringify(s.actions || {}, null, 2), ""
      ];
      write(path.join(LATEST, "latest-summary.md"), md.join("\n"));
      scheduleGitSync(Boolean(s.critical || Number(s.errors || 0) > 0));
      res.writeHead(202, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, accepted: true, batchId: batch.batchId, lastSequence: s.lastSequence || null, gitSync: "queued" }));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(error) }));
    }
  });
});
server.listen(PORT, "127.0.0.1", () => console.error("[observation-reporter]", iso(), "listening on http://127.0.0.1:" + PORT, "source=" + SOURCE_ROOT));
setTimeout(() => scheduleGitSync(true), 3000);