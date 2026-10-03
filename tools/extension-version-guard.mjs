import fs from "node:fs";
import { execFileSync } from "node:child_process";

const MANIFEST = "extension/manifest.json";
const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();

function parseVersion(value) {
  const parts = String(value).split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) throw new Error("Invalid extension version: " + value);
  return parts;
}

function newer(a, b) {
  const av = parseVersion(a), bv = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if (av[i] !== bv[i]) return av[i] > bv[i];
  }
  return false;
}

function manifestFromRevision(revision) {
  return JSON.parse(git(["show", revision + ":" + MANIFEST]));
}

function changedFilesForCommit(commit) {
  return git(["diff-tree", "--no-commit-id", "--name-only", "-r", commit]).split(/\r?\n/).filter(Boolean);
}

function checkCommit(commit) {
  const files = changedFilesForCommit(commit);
  if (!files.some((file) => file === MANIFEST || file.startsWith("extension/"))) return;
  const parent = git(["rev-parse", commit + "^"]);
  const before = manifestFromRevision(parent);
  const after = manifestFromRevision(commit);
  if (!files.includes(MANIFEST)) {
    throw new Error(commit.slice(0, 7) + ": extension/ changed without changing extension/manifest.json (version " + after.version + ")");
  }
  if (!newer(after.version, before.version)) {
    throw new Error(commit.slice(0, 7) + ": extension version did not increase (" + before.version + " -> " + after.version + ")");
  }
}

function checkStaged() {
  const files = git(["diff", "--cached", "--name-only"]).split(/\r?\n/).filter(Boolean);
  if (!files.some((file) => file.startsWith("extension/"))) return;
  if (!files.includes(MANIFEST)) throw new Error("Staged extension changes require staging extension/manifest.json with a version bump.");
  const head = manifestFromRevision("HEAD");
  const staged = JSON.parse(git(["show", ":" + MANIFEST]));
  if (!newer(staged.version, head.version)) {
    throw new Error("Staged extension changes require a higher version: " + head.version + " -> " + staged.version);
  }
}

function checkHistory() {
  let commits = [];
  try { commits = git(["rev-list", "--no-merges", "--reverse", "origin/main..HEAD"]).split(/\r?\n/).filter(Boolean); }
  catch { return; }
  for (const commit of commits) checkCommit(commit);
}

const mode = process.argv[2] || "--history";
if (mode === "--staged") checkStaged();
else if (mode === "--history") checkHistory();
else throw new Error("Usage: node tools/extension-version-guard.mjs [--staged|--history]");

console.log("EXTENSION_VERSION_GUARD=PASS");
