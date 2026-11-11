#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { evaluateDialogueQuality } from "./evaluate-dialogue-quality.mjs";

const SOURCES = ["groq-remote", "groq-interpreter"];
const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STRATA = {
  languagePair: /^[a-z]{2,3}-[a-z]{2,3}$/i,
  noise: new Set(["quiet", "moderate", "noisy", "unknown"]),
  overlap: new Set(["none", "partial", "heavy", "unknown"]),
  network: new Set(["stable", "variable", "unknown"]),
  chunkProfile: /^[a-z0-9][a-z0-9._-]{0,39}$/i
};
const REQUIRED_ACCEPTANCE = [
  "minRecordings",
  "minRecordingsPerStratum",
  "minReferenceWordsBySource",
  "minLatencySamplesBySource",
  "maxWeightedWerBySource",
  "maxMacroWerCiUpperBySource",
  "maxWeightedCerBySource",
  "minCriticalTermRecallBySource",
  "minTurnF1BySource",
  "minOverlapRecall",
  "maxChronologyInversions",
  "maxLatencyP95MsBySource",
  "maxLatencyMaxMsBySource"
];

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function assert(condition, message) {
  if (!condition) throw new TypeError(message);
}

function assertAllowedKeys(value, allowed, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), label + " is invalid");
  assert(Object.keys(value).every(key => allowed.includes(key)), label + " contains an unsupported field");
}

function validateEvaluationShape(evaluation) {
  assertAllowedKeys(evaluation, ["schema", "language", "reference", "hypothesis", "criticalTerms", "structureOptions"], "evaluation");
  assertAllowedKeys(evaluation.reference, ["segments"], "reference");
  assertAllowedKeys(evaluation.hypothesis, ["segments", "latenciesMs", "latencySummaryBySource"], "hypothesis");
  for (const side of [evaluation.reference, evaluation.hypothesis]) {
    for (const segment of side.segments || []) {
      assertAllowedKeys(segment, ["source", "speakerId", "language", "startMs", "endMs", "latencyMs", "text"], "evaluation segment");
    }
  }
  const summaries=evaluation.hypothesis.latencySummaryBySource;
  assertAllowedKeys(summaries, SOURCES, "latency summary by source");
  for (const source of SOURCES) {
    const item=summaries[source];
    assertAllowedKeys(item, ["samples", "p50Ms", "p95Ms", "maxMs"], "source latency summary");
    assert(Number.isInteger(item.samples)&&item.samples>0&&
      finite(item.p50Ms)&&item.p50Ms>=0&&finite(item.p95Ms)&&item.p95Ms>=item.p50Ms&&
      finite(item.maxMs)&&item.maxMs>=item.p95Ms,
      "source latency summary must have positive sample count and ordered p50/p95/max values");
  }
}

function validateAcceptance(profile) {
  assertAllowedKeys(profile, ["id", ...REQUIRED_ACCEPTANCE], "acceptanceProfile");
  for (const key of REQUIRED_ACCEPTANCE) {
    assert(Object.hasOwn(profile, key), "acceptanceProfile is missing a required criterion");
  }
  for (const key of ["minRecordings", "minRecordingsPerStratum", "maxChronologyInversions"]) {
    assert(Number.isInteger(profile[key]) && profile[key] >= 0, "acceptanceProfile contains an invalid count");
  }
  assert(profile.minRecordings >= 2 && profile.minRecordingsPerStratum >= 1,
    "acceptanceProfile sample minimums are too small");
  for (const key of ["minReferenceWordsBySource", "minLatencySamplesBySource"]) {
    assert(profile[key] && typeof profile[key] === "object", "acceptanceProfile source thresholds are invalid");
    for (const source of SOURCES) {
      assert(Number.isInteger(profile[key][source]) && profile[key][source] >= 1,
        "acceptanceProfile word and latency sample minimums must be positive");
    }
  }
  const sourceThresholds = [
    "maxWeightedWerBySource",
    "maxMacroWerCiUpperBySource",
    "maxWeightedCerBySource",
    "minCriticalTermRecallBySource",
    "minTurnF1BySource",
    "maxLatencyP95MsBySource",
    "maxLatencyMaxMsBySource"
  ];
  for (const key of sourceThresholds) {
    assert(profile[key] && typeof profile[key] === "object", "acceptanceProfile source thresholds are invalid");
    for (const source of SOURCES) {
      const value = profile[key][source];
      const boundedRate = [
        "maxWeightedWerBySource", "maxMacroWerCiUpperBySource", "maxWeightedCerBySource",
        "minCriticalTermRecallBySource", "minTurnF1BySource"
      ].includes(key);
      assert(finite(value) && value >= 0 && (boundedRate ? value <= 1 : true),
        "acceptanceProfile source thresholds are invalid");
    }
  }
  assert(finite(profile.minOverlapRecall) && profile.minOverlapRecall >= 0 && profile.minOverlapRecall <= 1,
    "acceptanceProfile overlap threshold is invalid");
}

function validateCorpusMetadata(corpus) {
  assertAllowedKeys(corpus, [
    "id", "version", "split", "frozenAt", "consentStatus", "nonClinical",
    "rawAudioStoredOutsideRepository", "transcriptsStoredOutsideRepository", "clockBasis",
    "independentAnnotators", "adjudicationComplete"
  ], "corpus metadata");
  assert(/^si-dual-[a-z0-9][a-z0-9._-]{1,48}$/i.test(String(corpus.id || "")), "corpus id must be an anonymous si-dual identifier");
  assert(/^\d+\.\d+\.\d+$/.test(String(corpus.version || "")), "corpus version must use MAJOR.MINOR.PATCH");
  assert(corpus.split === "test", "acceptance requires a frozen test split");
  assert(typeof corpus.frozenAt === "string" && Number.isFinite(Date.parse(corpus.frozenAt)),
    "corpus freeze timestamp is invalid");
  assert(corpus.consentStatus === "authorized", "corpus authorization is not verified");
  assert(corpus.nonClinical === true, "the benchmark corpus must be explicitly non-clinical");
  assert(corpus.rawAudioStoredOutsideRepository === true,
    "raw audio must remain outside the Git repository");
  assert(corpus.transcriptsStoredOutsideRepository === true,
    "benchmark manifest and transcripts must remain outside the Git repository");
  assert(corpus.clockBasis === "shared-monotonic", "a shared monotonic time basis is required");
  assert(Number.isInteger(corpus.independentAnnotators) && corpus.independentAnnotators >= 2,
    "two independent reference annotators are required");
  assert(corpus.adjudicationComplete === true, "reference disagreements must be adjudicated");
}

function validateSystem(system) {
  assertAllowedKeys(system, [
    "model", "buildSha", "chunkDurationMs", "overlapMs", "concurrency", "timestampBasis", "latencyBasis"
  ], "system configuration");
  assert(system.model === "whisper-large-v3", "the benchmark model must be pinned to whisper-large-v3");
  assert(/^[a-f0-9]{40}$/i.test(String(system.buildSha || "")), "system build SHA is invalid");
  assert(Number.isInteger(system.chunkDurationMs) && system.chunkDurationMs >= 1000,
    "chunkDurationMs is invalid");
  assert(Number.isInteger(system.overlapMs) && system.overlapMs > 0 &&
    system.overlapMs < system.chunkDurationMs, "overlapMs is invalid");
  assert(system.concurrency === 2, "dual-lane benchmark concurrency must be exactly 2");
  assert(system.timestampBasis === "call-start-relative",
    "reference and hypothesis timestamps must be relative to each recording's call start");
  assert(system.latencyBasis === "capture-window-ready-to-visible-text",
    "latency must run from the ready audio window to rendered visible text, not HTTP response time");
}

function validateStrata(strata) {
  assert(strata && typeof strata === "object" && !Array.isArray(strata), "recording strata are required");
  const keys = Object.keys(strata);
  assert(keys.length > 0 && keys.every(key => Object.hasOwn(STRATA, key)), "recording strata contain an unsupported field");
  for (const [key, value] of Object.entries(strata)) {
    assert(typeof value === "string" && value.length <= 40, "recording strata contain an invalid value");
    const rule = STRATA[key];
    const valid = rule instanceof RegExp ? rule.test(value) : rule.has(value);
    assert(valid, "recording strata contain an unsupported category");
  }
}

function validateMedia(media, durationMs) {
  assertAllowedKeys(media, SOURCES, "media metadata");
  for (const source of SOURCES) {
    const item = media[source];
    assertAllowedKeys(item, ["sha256", "durationMs", "sampleRate", "channels", "codec"], "audio media metadata");
    assert(/^[a-f0-9]{64}$/i.test(String(item.sha256 || "")), "audio media SHA-256 is invalid");
    assert(finite(item.durationMs) && item.durationMs > 0 && item.durationMs <= 60 * 60 * 1000,
      "audio media duration is invalid");
    assert(item.sampleRate === 16000 && item.channels === 1 && item.codec === "pcm_s16le",
      "audio must be mono 16 kHz PCM signed 16-bit little-endian");
    assert(Math.abs(item.durationMs - durationMs) <= 1000,
      "the two audio lanes must share a call duration within one second");
  }
}

function validateRecording(recording, seenIds) {
  assertAllowedKeys(recording, ["id", "strata", "media", "evaluation"], "recording entry");
  assert(/^clip-[a-z0-9-]{1,40}$/i.test(String(recording.id || "")), "recording id must be an anonymous clip identifier");
  assert(!seenIds.has(recording.id), "recording identifiers must be unique");
  seenIds.add(recording.id);
  validateStrata(recording.strata);
  const durations = SOURCES.map(source => recording.media?.[source]?.durationMs);
  assert(durations.every(finite), "audio duration metadata is missing");
  validateMedia(recording.media, Math.max(...durations));
  const evaluation = recording.evaluation;
  validateEvaluationShape(evaluation);
  assert(evaluation?.schema === "signal-interpreter-dialogue-evaluation/v1",
    "recording evaluation schema is invalid");
  for (const side of ["reference", "hypothesis"]) {
    const segments = evaluation[side]?.segments;
    assert(Array.isArray(segments), "recording reference/hypothesis segments are required");
    for (const segment of segments) {
      assert(SOURCES.includes(segment?.source), "recording contains an invalid source lane");
      const duration = recording.media[segment.source].durationMs;
      assert(finite(Number(segment.startMs)) && finite(Number(segment.endMs)) &&
        Number(segment.startMs) >= 0 && Number(segment.endMs) >= Number(segment.startMs) &&
        Number(segment.endMs) <= duration + 1000, "recording timestamps exceed the audio duration");
    }
  }
  return evaluateDialogueQuality(evaluation);
}

function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const position = Math.max(0, Math.min(sorted.length - 1, (sorted.length - 1) * fraction));
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const value = sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  return Number(value.toFixed(4));
}

function makeRandom(seed) {
  let state = (seed >>> 0) || 0x51a7c0de;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function bootstrapMeanInterval(values, iterations, seed) {
  const usable = values.filter(finite);
  if (!usable.length) return null;
  if (usable.length === 1) {
    return { lower95: usable[0], upper95: usable[0], iterations: 0, independentRecordings: 1 };
  }
  const random = makeRandom(seed);
  const means = new Array(iterations);
  for (let iteration = 0; iteration < iterations; iteration++) {
    let sum = 0;
    for (let sample = 0; sample < usable.length; sample++) {
      sum += usable[Math.floor(random() * usable.length)];
    }
    means[iteration] = sum / usable.length;
  }
  return {
    lower95: percentile(means, 0.025),
    upper95: percentile(means, 0.975),
    iterations,
    independentRecordings: usable.length
  };
}

function summarizeRows(rows, iterations, seed) {
  const bySource = {};
  for (const source of SOURCES) {
    const reports = rows.map(row => row.report);
    const sourceRows = reports.map(report => report.bySource[source]);
    const wordReferences = sourceRows.reduce((sum, item) => sum + item.referenceWords, 0);
    const wordErrors = sourceRows.reduce((sum, item) => sum + item.wordErrors, 0);
    const characterReferences = sourceRows.reduce((sum, item) => sum + item.characterReferenceUnits, 0);
    const characterErrors = sourceRows.reduce((sum, item) => sum + item.characterErrors, 0);
    const critical = reports.map(report => report.criticalTerms.bySource[source]);
    const criticalEvaluated = critical.reduce((sum, item) => sum + item.evaluated, 0);
    const criticalPreserved = critical.reduce((sum, item) => sum + item.preserved, 0);
    const speakerCompared = sourceRows.reduce((sum, item) => sum + item.speakerTokensCompared, 0);
    const speakerCorrect = sourceRows.reduce((sum, item) => sum + item.speakerTokensCorrect, 0);
    const turns = reports.map(report => report.dialogueStructure.turns.bySource[source]);
    const referenceTurns = turns.reduce((sum, item) => sum + item.referenceTurns, 0);
    const hypothesisTurns = turns.reduce((sum, item) => sum + item.hypothesisTurns, 0);
    const matchedTurns = turns.reduce((sum, item) => sum + item.matchedTurns, 0);
    const latencySummaries = rows.map(row => row.evaluation.hypothesis.latencySummaryBySource[source]);
    const latencySamples = latencySummaries.reduce((sum, item) => sum + item.samples, 0);
    const recordingP50s = latencySummaries.map(item => item.p50Ms);
    const worstRecordingP95Ms = Math.max(...latencySummaries.map(item => item.p95Ms));
    const worstRecordingMaxMs = Math.max(...latencySummaries.map(item => item.maxMs));
    const macroWerValues = sourceRows.map(item => item.wordErrorRate).filter(finite);
    const macroCerValues = sourceRows.map(item => item.characterErrorRate).filter(finite);
    const turnPrecision = hypothesisTurns ? matchedTurns / hypothesisTurns : null;
    const turnRecall = referenceTurns ? matchedTurns / referenceTurns : null;
    bySource[source] = {
      recordings: rows.length,
      referenceWords: wordReferences,
      wordErrors,
      weightedWer: wordReferences ? Number((wordErrors / wordReferences).toFixed(4)) : null,
      macroWer: macroWerValues.length ? Number((macroWerValues.reduce((a, b) => a + b, 0) / macroWerValues.length).toFixed(4)) : null,
      macroWerCi95: bootstrapMeanInterval(macroWerValues, iterations, seed ^ (source === SOURCES[0] ? 0x15a4 : 0x2b73)),
      characterReferenceUnits: characterReferences,
      characterErrors,
      weightedCer: characterReferences ? Number((characterErrors / characterReferences).toFixed(4)) : null,
      macroCer: macroCerValues.length ? Number((macroCerValues.reduce((a, b) => a + b, 0) / macroCerValues.length).toFixed(4)) : null,
      criticalTerms: {
        evaluated: criticalEvaluated,
        preserved: criticalPreserved,
        recall: criticalEvaluated ? Number((criticalPreserved / criticalEvaluated).toFixed(4)) : null
      },
      speakerAttribution: {
        comparedTokens: speakerCompared,
        correctTokens: speakerCorrect,
        accuracy: speakerCompared ? Number((speakerCorrect / speakerCompared).toFixed(4)) : null
      },
      turns: {
        reference: referenceTurns,
        hypothesis: hypothesisTurns,
        matched: matchedTurns,
        precision: turnPrecision == null ? null : Number(turnPrecision.toFixed(4)),
        recall: turnRecall == null ? null : Number(turnRecall.toFixed(4)),
        f1: turnPrecision == null || turnRecall == null || turnPrecision + turnRecall === 0
          ? null : Number((2 * turnPrecision * turnRecall / (turnPrecision + turnRecall)).toFixed(4))
      },
      latency: {
        samples: latencySamples,
        p50OfRecordingP50Ms: percentile(recordingP50s, 0.5),
        p95Ms: worstRecordingP95Ms,
        maxMs: worstRecordingMaxMs,
        p95Aggregation: "worst-recording-p95"
      }
    };
  }
  const overlap = rows.map(row => row.report.dialogueStructure.crossSourceOverlap);
  const overlapReference = overlap.reduce((sum, item) => sum + item.referencePairs, 0);
  const overlapHypothesis = overlap.reduce((sum, item) => sum + item.hypothesisPairs, 0);
  const overlapPreserved = overlap.reduce((sum, item) => sum + item.preservedPairs, 0);
  const overlapPrecision = overlapHypothesis ? overlapPreserved / overlapHypothesis : null;
  const overlapRecall = overlapReference ? overlapPreserved / overlapReference : null;
  const overlapF1 = overlapPrecision == null || overlapRecall == null || overlapPrecision + overlapRecall === 0
    ? null : 2 * overlapPrecision * overlapRecall / (overlapPrecision + overlapRecall);
  const chronologyInversions = rows.reduce((sum, row) =>
    sum + row.report.dialogueStructure.chronology.hypothesisOutOfOrderAdjacentPairs, 0);
  return {
    recordings: rows.length,
    bySource,
    crossSourceOverlap: {
      referencePairs: overlapReference,
      hypothesisPairs: overlapHypothesis,
      preservedPairs: overlapPreserved,
      missedPairs: Math.max(0, overlapReference - overlapPreserved),
      extraPairs: Math.max(0, overlapHypothesis - overlapPreserved),
      precision: overlapPrecision == null ? null : Number(overlapPrecision.toFixed(4)),
      recall: overlapRecall == null ? null : Number(overlapRecall.toFixed(4)),
      f1: overlapF1 == null ? null : Number(overlapF1.toFixed(4))
    },
    chronology: { hypothesisOutOfOrderAdjacentPairs: chronologyInversions }
  };
}

function buildStratifiedSummaries(rows, iterations, seed) {
  const result = {};
  for (const dimension of ["languagePair", "noise", "overlap", "network", "chunkProfile"]) {
    const groups = new Map();
    for (const row of rows) {
      const value = row.strata[dimension];
      if (value == null) continue;
      const group = groups.get(value) || [];
      group.push(row);
      groups.set(value, group);
    }
    if (groups.size) {
      result[dimension] = Object.fromEntries(Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
        .map(([value, group], index) => [value, summarizeRows(group, iterations, seed ^ (index + 1))]));
    }
  }
  return result;
}

function evaluateAcceptance(summary, profile) {
  const criteria = [];
  const blocked = (id, observed, limit, reason) => criteria.push({ id, status: "BLOCKED", observed, limit, reason });
  const passFail = (id, observed, limit, comparator) => {
    if (!finite(observed)) return blocked(id, observed, limit, "insufficient or missing evidence");
    const passed = comparator === "min" ? observed >= limit : observed <= limit;
    criteria.push({ id, status: passed ? "PASS" : "FAIL", observed, limit });
  };
  passFail("recordings.minimum", summary.recordings, profile.minRecordings, "min");
  passFail("chronology.inversions", summary.chronology.hypothesisOutOfOrderAdjacentPairs, profile.maxChronologyInversions, "max");
  passFail("overlap.recall", summary.crossSourceOverlap.recall, profile.minOverlapRecall, "min");
  for (const source of SOURCES) {
    const item = summary.bySource[source];
    passFail(source + ".referenceWords", item.referenceWords, profile.minReferenceWordsBySource[source], "min");
    passFail(source + ".latencySamples", item.latency.samples, profile.minLatencySamplesBySource[source], "min");
    passFail(source + ".weightedWer", item.weightedWer, profile.maxWeightedWerBySource[source], "max");
    passFail(source + ".macroWerCi95.upper", item.macroWerCi95?.upper95, profile.maxMacroWerCiUpperBySource[source], "max");
    passFail(source + ".weightedCer", item.weightedCer, profile.maxWeightedCerBySource[source], "max");
    passFail(source + ".criticalTermRecall", item.criticalTerms.recall, profile.minCriticalTermRecallBySource[source], "min");
    passFail(source + ".turnF1", item.turns.f1, profile.minTurnF1BySource[source], "min");
    passFail(source + ".latencyP95Ms", item.latency.p95Ms, profile.maxLatencyP95MsBySource[source], "max");
    passFail(source + ".latencyMaxMs", item.latency.maxMs, profile.maxLatencyMaxMsBySource[source], "max");
  }
  const statuses = criteria.map(item => item.status);
  const status = statuses.includes("BLOCKED") ? "BLOCKED" : statuses.includes("FAIL") ? "FAIL" : "PASS";
  return { status, criteria };
}

export function evaluateDialogueBenchmark(manifest) {
  assertAllowedKeys(manifest, ["schema", "corpus", "system", "acceptanceProfile", "bootstrap", "recordings"], "benchmark manifest");
  assert(manifest?.schema === "signal-interpreter-dialogue-benchmark/v1",
    "schema must be signal-interpreter-dialogue-benchmark/v1");
  validateCorpusMetadata(manifest.corpus);
  validateSystem(manifest.system);
  validateAcceptance(manifest.acceptanceProfile);
  if (manifest.bootstrap != null) {
    assertAllowedKeys(manifest.bootstrap, ["iterations", "seed"], "bootstrap options");
  }
  if (manifest.acceptanceProfile.id != null) {
    assert(typeof manifest.acceptanceProfile.id === "string" &&
      /^si-dual-[a-z0-9][a-z0-9._-]{1,48}$/i.test(manifest.acceptanceProfile.id),
      "acceptance profile id must be an anonymous si-dual identifier");
  }
  const iterations = manifest.bootstrap?.iterations == null ? 2000 : manifest.bootstrap.iterations;
  const seed = manifest.bootstrap?.seed == null ? 0x51a7c0de : manifest.bootstrap.seed;
  assert(Number.isInteger(iterations) && iterations >= 1000 && iterations <= 10000,
    "bootstrap iterations must be between 1000 and 10000");
  assert(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff, "bootstrap seed is invalid");
  assert(Array.isArray(manifest.recordings) && manifest.recordings.length > 0,
    "benchmark recordings are required");
  const seenIds = new Set();
  const rows = manifest.recordings.map(recording => ({
    id: recording.id,
    strata: recording.strata,
    evaluation: recording.evaluation,
    report: validateRecording(recording, seenIds)
  }));
  const summary = summarizeRows(rows, iterations, seed);
  const stratified = buildStratifiedSummaries(rows, iterations, seed);
  const stratumCriteria = [];
  for (const [dimension, groups] of Object.entries(stratified)) {
    for (const [value, group] of Object.entries(groups)) {
      stratumCriteria.push({
        id: "strata." + dimension,
        status: group.recordings >= manifest.acceptanceProfile.minRecordingsPerStratum ? "PASS" : "BLOCKED",
        recordings: group.recordings,
        minimum: manifest.acceptanceProfile.minRecordingsPerStratum
      });
    }
  }
  const acceptance = evaluateAcceptance(summary, manifest.acceptanceProfile);
  const allCriteria = [...acceptance.criteria, ...stratumCriteria];
  const overlapCategories = new Set(rows.map(row => row.strata.overlap));
  for (const required of ["partial", "heavy"]) {
    allCriteria.push({
      id: "strata.overlapCoverage." + required,
      status: overlapCategories.has(required) ? "PASS" : "BLOCKED",
      minimum: required,
      reason: overlapCategories.has(required) ? null : "the test set must include both partial and heavy real cross-source overlap"
    });
  }
  if (summary.crossSourceOverlap.referencePairs <= 0) {
    allCriteria.push({
      id: "overlap.referencePairs",
      status: "BLOCKED",
      observed: summary.crossSourceOverlap.referencePairs,
      reason: "the frozen reference contains no simultaneous cross-source turns"
    });
  }
  const addStratumMetric = (id, observed, limit, comparator) => {
    if (!finite(observed)) {
      allCriteria.push({ id, status: "BLOCKED", observed, limit, reason: "insufficient or missing stratum evidence" });
      return;
    }
    const passed = comparator === "min" ? observed >= limit : observed <= limit;
    allCriteria.push({ id, status: passed ? "PASS" : "FAIL", observed, limit });
  };
  for (const [dimension, groups] of Object.entries(stratified)) {
    for (const [value, group] of Object.entries(groups)) {
      const prefix = "strata." + dimension + "." + value;
      for (const source of SOURCES) {
        const item = group.bySource[source];
        addStratumMetric(prefix + "." + source + ".weightedWer", item.weightedWer,
          manifest.acceptanceProfile.maxWeightedWerBySource[source], "max");
        addStratumMetric(prefix + "." + source + ".macroWerCi95.upper",
          item.macroWerCi95?.upper95, manifest.acceptanceProfile.maxMacroWerCiUpperBySource[source], "max");
        addStratumMetric(prefix + "." + source + ".weightedCer", item.weightedCer,
          manifest.acceptanceProfile.maxWeightedCerBySource[source], "max");
        addStratumMetric(prefix + "." + source + ".criticalTermRecall", item.criticalTerms.recall,
          manifest.acceptanceProfile.minCriticalTermRecallBySource[source], "min");
        addStratumMetric(prefix + "." + source + ".turnF1", item.turns.f1,
          manifest.acceptanceProfile.minTurnF1BySource[source], "min");
        addStratumMetric(prefix + "." + source + ".latencyP95Ms", item.latency.p95Ms,
          manifest.acceptanceProfile.maxLatencyP95MsBySource[source], "max");
      }
      addStratumMetric(prefix + ".overlapRecall", group.crossSourceOverlap.recall,
        manifest.acceptanceProfile.minOverlapRecall, "min");
      addStratumMetric(prefix + ".chronologyInversions",
        group.chronology.hypothesisOutOfOrderAdjacentPairs,
        manifest.acceptanceProfile.maxChronologyInversions, "max");
    }
  }
  const strataCovered = Object.keys(stratified).includes("languagePair") &&
    Object.keys(stratified).includes("noise") && Object.keys(stratified).includes("overlap");
  if (!strataCovered) {
    allCriteria.push({
      id: "strata.requiredDimensions",
      status: "BLOCKED",
      reason: "languagePair, noise and overlap strata are all required"
    });
  }
  const finalStatus = allCriteria.some(item => item.status === "BLOCKED")
    ? "BLOCKED" : allCriteria.some(item => item.status === "FAIL") ? "FAIL" : "PASS";
  return {
    schema: "signal-interpreter-dialogue-benchmark-report/v1",
    corpus: { version: manifest.corpus.version, split: manifest.corpus.split },
    system: {
      model: manifest.system.model,
      buildSha: manifest.system.buildSha,
      chunkDurationMs: manifest.system.chunkDurationMs,
      overlapMs: manifest.system.overlapMs,
      concurrency: manifest.system.concurrency,
      timestampBasis: manifest.system.timestampBasis,
      latencyBasis: manifest.system.latencyBasis
    },
    sample: {
      recordings: rows.length,
      independentAnnotators: manifest.corpus.independentAnnotators,
      adjudicationComplete: manifest.corpus.adjudicationComplete,
      audioOutsideRepository: manifest.corpus.rawAudioStoredOutsideRepository
    },
    metrics: summary,
    stratified,
    acceptance: {
      profileId: String(manifest.acceptanceProfile.id || "UNNAMED"),
      status: finalStatus,
      criteria: allCriteria
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node tools/evaluate-dialogue-benchmark.mjs <benchmark-manifest.json>");
    process.exit(2);
  }
  try {
    const realInputPath = fs.realpathSync(inputPath);
    const relativeInput = path.relative(REPOSITORY_ROOT, realInputPath);
    assert(relativeInput === ".." || relativeInput.startsWith(".." + path.sep) || path.isAbsolute(relativeInput),
      "benchmark manifest and gold transcripts must be outside the Git repository");
    const manifest = JSON.parse(fs.readFileSync(realInputPath, "utf8"));
    const report = evaluateDialogueBenchmark(manifest);
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.acceptance.status !== "PASS") process.exitCode = 3;
  } catch (error) {
    console.error("Benchmark failed: " + String(error && error.message || error));
    process.exit(1);
  }
}
