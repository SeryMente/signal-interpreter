import assert from "node:assert/strict";
import { evaluateDialogueBenchmark } from "./evaluate-dialogue-benchmark.mjs";

function makeRecording(index, overrides = {}) {
  const remoteText = "Please confirm Tuesday at ten thirty.";
  const interpreterText = "Por favor confirme el martes a las diez treinta.";
  const durationMs = 6000;
  const base = {
    id: "clip-" + String(index).padStart(3, "0"),
    strata: {
      languagePair: index % 2 ? "en-es" : "es-en",
      noise: ["quiet", "moderate", "noisy"][index % 3],
      overlap: index === 3 ? "heavy" : "partial",
      network: index % 2 ? "stable" : "variable",
      chunkProfile: "window-6500-overlap-500"
    },
    media: {
      "groq-remote": {
        sha256: "a".repeat(64), durationMs, sampleRate: 16000, channels: 1, codec: "pcm_s16le"
      },
      "groq-interpreter": {
        sha256: "b".repeat(64), durationMs, sampleRate: 16000, channels: 1, codec: "pcm_s16le"
      }
    },
    evaluation: {
      schema: "signal-interpreter-dialogue-evaluation/v1",
      language: "en",
      reference: {
        segments: [
          { source: "groq-remote", speakerId: null, language: "en", startMs: 0, endMs: 2400, text: remoteText },
          { source: "groq-interpreter", speakerId: null, language: "es", startMs: 900, endMs: 3300, text: interpreterText }
        ]
      },
      hypothesis: {
        segments: [
          { source: "groq-remote", speakerId: null, language: "en", startMs: 0, endMs: 2400, latencyMs: 350, text: remoteText },
          { source: "groq-interpreter", speakerId: null, language: "es", startMs: 900, endMs: 3300, latencyMs: 420, text: interpreterText }
        ]
      },
      criticalTerms: [
        { term: "Tuesday", source: "groq-remote", language: "en" },
        { term: "ten thirty", source: "groq-remote", language: "en" },
        { term: "martes", source: "groq-interpreter", language: "es" },
        { term: "diez treinta", source: "groq-interpreter", language: "es" }
      ]
    }
  };
  return {
    ...base,
    ...overrides,
    strata: { ...base.strata, ...(overrides.strata || {}) },
    media: overrides.media || base.media,
    evaluation: overrides.evaluation || base.evaluation
  };
}

function makeManifest() {
  return {
    schema: "signal-interpreter-dialogue-benchmark/v1",
    corpus: {
      id: "si-dual-nonclinical-fixture",
      version: "1.0.0",
      split: "test",
      frozenAt: "2026-11-11T18:00:00.000Z",
      consentStatus: "authorized",
      nonClinical: true,
      rawAudioStoredOutsideRepository: true,
      transcriptsStoredOutsideRepository: true,
      clockBasis: "shared-monotonic",
      independentAnnotators: 2,
      adjudicationComplete: true
    },
    system: {
      model: "whisper-large-v3",
      buildSha: "c".repeat(40),
      chunkDurationMs: 6500,
      overlapMs: 500,
      concurrency: 2,
      timestampBasis: "call-start-relative",
      latencyBasis: "capture-window-ready-to-visible-text"
    },
    acceptanceProfile: {
      id: "fixture-perfect-1",
      minRecordings: 3,
      minRecordingsPerStratum: 1,
      minReferenceWordsBySource: { "groq-remote": 1, "groq-interpreter": 1 },
      minLatencySamplesBySource: { "groq-remote": 1, "groq-interpreter": 1 },
      maxWeightedWerBySource: { "groq-remote": 0, "groq-interpreter": 0 },
      maxMacroWerCiUpperBySource: { "groq-remote": 0, "groq-interpreter": 0 },
      maxWeightedCerBySource: { "groq-remote": 0, "groq-interpreter": 0 },
      minCriticalTermRecallBySource: { "groq-remote": 1, "groq-interpreter": 1 },
      minTurnF1BySource: { "groq-remote": 1, "groq-interpreter": 1 },
      minOverlapRecall: 1,
      maxChronologyInversions: 0,
      maxLatencyP95MsBySource: { "groq-remote": 1000, "groq-interpreter": 1000 },
      maxLatencyMaxMsBySource: { "groq-remote": 1500, "groq-interpreter": 1500 }
    },
    bootstrap: { iterations: 1000, seed: 20261111 },
    recordings: [makeRecording(1), makeRecording(2), makeRecording(3), makeRecording(4)]
  };
}

const manifest = makeManifest();
const report = evaluateDialogueBenchmark(manifest);
assert.equal(report.schema, "signal-interpreter-dialogue-benchmark-report/v1");
assert.equal(report.acceptance.status, "PASS");
assert.equal(report.sample.recordings, 3);
assert.equal(report.metrics.bySource["groq-remote"].weightedWer, 0);
assert.equal(report.metrics.bySource["groq-interpreter"].weightedWer, 0);
assert.equal(report.metrics.bySource["groq-remote"].weightedCer, 0);
assert.equal(report.metrics.bySource["groq-interpreter"].weightedCer, 0);
assert.equal(report.metrics.bySource["groq-remote"].macroWerCi95.upper95, 0);
assert.equal(report.metrics.bySource["groq-interpreter"].macroWerCi95.upper95, 0);
assert.equal(report.metrics.bySource["groq-remote"].criticalTerms.recall, 1);
assert.equal(report.metrics.bySource["groq-interpreter"].criticalTerms.recall, 1);
assert.equal(report.metrics.crossSourceOverlap.recall, 1);
assert.equal(report.metrics.chronology.hypothesisOutOfOrderAdjacentPairs, 0);
assert.ok(report.stratified.languagePair);
assert.ok(report.stratified.noise);
assert.ok(report.stratified.overlap);

const deterministic = evaluateDialogueBenchmark(manifest);
assert.deepEqual(deterministic.metrics.bySource["groq-remote"].macroWerCi95,
  report.metrics.bySource["groq-remote"].macroWerCi95, "bootstrap CI must be deterministic");

const serialized = JSON.stringify(report);
for (const phrase of ["Please confirm", "Tuesday", "Por favor confirme", "diez treinta"]) {
  assert.equal(serialized.includes(phrase), false, "benchmark report must not disclose transcript content");
}
for (const forbidden of ["sha256", "clip-001", "C:\\", "apiKey", "audioPath"]) {
  assert.equal(serialized.includes(forbidden), false, "benchmark report must omit media identifiers and private paths");
}

const underSampled = makeManifest();
underSampled.recordings.pop();
const underSampledReport = evaluateDialogueBenchmark(underSampled);
assert.equal(underSampledReport.acceptance.status, "BLOCKED");
assert.ok(underSampledReport.acceptance.criteria.some(item =>
  item.id === "recordings.minimum" && item.status === "BLOCKED"
));

const degraded = makeManifest();
degraded.recordings[0].evaluation.hypothesis.segments[0].text =
  "Please confirm Monday at ten thirty.";
const degradedReport = evaluateDialogueBenchmark(degraded);
assert.equal(degradedReport.acceptance.status, "FAIL");
assert.ok(degradedReport.acceptance.criteria.some(item =>
  item.id === "groq-remote.weightedWer" && item.status === "FAIL"
));

const noOverlap = makeManifest();
noOverlap.recordings.forEach(recording => {
  recording.evaluation.reference.segments[1].startMs = 4000;
  recording.evaluation.reference.segments[1].endMs = 5500;
  recording.evaluation.hypothesis.segments[1].startMs = 4000;
  recording.evaluation.hypothesis.segments[1].endMs = 5500;
});
const noOverlapReport = evaluateDialogueBenchmark(noOverlap);
assert.equal(noOverlapReport.acceptance.status, "BLOCKED");
assert.ok(noOverlapReport.acceptance.criteria.some(item =>
  item.id === "overlap.recall" && item.status === "BLOCKED"
));

assert.throws(() => evaluateDialogueBenchmark({ ...manifest, apiKey: "must-not-be-accepted" }), /unsupported field/);
const pathLeak = makeManifest();
pathLeak.recordings[0].media["groq-remote"].path = "private/audio.wav";
assert.throws(() => evaluateDialogueBenchmark(pathLeak), /unsupported field/);

const invalidAudio = makeManifest();
invalidAudio.recordings[0].media["groq-remote"].sampleRate = 48000;
assert.throws(() => evaluateDialogueBenchmark(invalidAudio), /audio must be mono 16 kHz PCM/);

const nonAdjudicated = makeManifest();
nonAdjudicated.corpus.adjudicationComplete = false;
assert.throws(() => evaluateDialogueBenchmark(nonAdjudicated), /reference disagreements must be adjudicated/);

const duplicateIds = makeManifest();
duplicateIds.recordings[1].id = duplicateIds.recordings[0].id;
assert.throws(() => evaluateDialogueBenchmark(duplicateIds), /identifiers must be unique/);

console.log("DIALOGUE_QUALITY_BENCHMARK=PASS");
