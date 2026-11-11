import assert from "node:assert/strict";
import { evaluateDialogueQuality } from "./evaluate-dialogue-quality.mjs";

const perfect = {
  schema: "signal-interpreter-dialogue-evaluation/v1",
  language: "en",
  reference: {
    segments: [
      {
        source: "groq-remote",
        speakerId: "remote-1",
        startMs: 0,
        endMs: 1800,
        text: "Good morning, please confirm Tuesday at ten thirty."
      },
      {
        source: "groq-interpreter",
        speakerId: "interpreter",
        language: "es",
        startMs: 150,
        endMs: 2100,
        text: "Buenos días, confirme martes a las diez treinta."
      }
    ]
  },
  hypothesis: {
    segments: [
      {
        source: "groq-remote",
        speakerId: "remote-1",
        startMs: 0,
        endMs: 1800,
        text: "Good morning, please confirm Tuesday at ten thirty.",
        latencyMs: 180
      },
      {
        source: "groq-interpreter",
        speakerId: "interpreter",
        language: "es",
        startMs: 150,
        endMs: 2100,
        text: "Buenos días, confirme martes a las diez treinta.",
        latencyMs: 260
      }
    ],
    latenciesMs: [110, 220, 330, 440, 550]
  },
  criticalTerms: [
    { term: "Tuesday", source: "groq-remote" },
    { term: "ten thirty", source: "groq-remote" },
    { term: "Buenos días", source: "groq-interpreter", language: "es" }
  ]
};

const perfectReport = evaluateDialogueQuality(perfect);
assert.equal(perfectReport.overall.wordErrorRate, 0);
assert.equal(perfectReport.overall.characterErrorRate, 0);
assert.equal(perfectReport.bySource["groq-remote"].wordErrorRate, 0);
assert.equal(perfectReport.bySource["groq-interpreter"].wordErrorRate, 0);
assert.equal(perfectReport.criticalTerms.recall, 1);
assert.equal(perfectReport.criticalTerms.bySource["groq-remote"].recall, 1);
assert.equal(perfectReport.criticalTerms.bySource["groq-interpreter"].recall, 1);
assert.equal(perfectReport.speakerAttribution.accuracy, 1);
assert.equal(perfectReport.latency.bySource["groq-remote"].p50Ms, 180);
assert.equal(perfectReport.latency.bySource["groq-interpreter"].p95Ms, 260);
assert.equal(perfectReport.latency.p50Ms, 330);
assert.equal(perfectReport.latency.p95Ms, 550);
assert.equal(perfectReport.latency.maxMs, 550);

const degraded = structuredClone(perfect);
degraded.hypothesis.segments[0].text =
  "Good morning, please confirm Wednesday at ten thirty.";
degraded.hypothesis.segments[0].speakerId = "remote-2";
degraded.criticalTerms = [
  { term: "Tuesday", source: "groq-remote" },
  { term: "ten thirty", source: "groq-remote" }
];
const degradedReport = evaluateDialogueQuality(degraded);
assert.ok(degradedReport.overall.wordErrorRate > 0);
assert.ok(degradedReport.overall.characterErrorRate > 0);
assert.equal(degradedReport.criticalTerms.preserved, 1);
assert.equal(degradedReport.criticalTerms.evaluated, 2);
assert.ok(degradedReport.speakerAttribution.accuracy < 1);

const japanese = {
  schema: "signal-interpreter-dialogue-evaluation/v1",
  language: "ja",
  reference: {
    segments: [{
      source: "groq-remote", speakerId: "remote-1", language: "ja",
      startMs: 0, endMs: 1200, text: "患者は東京にいます"
    }]
  },
  hypothesis: {
    segments: [{
      source: "groq-remote", speakerId: "remote-1", language: "ja",
      startMs: 0, endMs: 1200, text: "患者は大阪にいます"
    }]
  },
  criticalTerms: ["東京"]
};
const japaneseReport = evaluateDialogueQuality(japanese);
assert.ok(japaneseReport.overall.characterErrorRate > 0);
assert.equal(japaneseReport.criticalTerms.preserved, 0);

const serialized = JSON.stringify(perfectReport);
for (const phrase of ["Good morning", "Tuesday", "Buenos días"]) {
  assert.equal(serialized.includes(phrase), false, "reports contain metrics only, never transcript text");
}

assert.throws(() => evaluateDialogueQuality({ schema: "wrong" }), /schema/);
assert.throws(() => evaluateDialogueQuality({
  schema: "signal-interpreter-dialogue-evaluation/v1",
  reference: { segments: [{ source: "unknown", startMs: 0, endMs: 1, text: "x" }] },
  hypothesis: { segments: [] }
}), /source is invalid/);
assert.throws(() => evaluateDialogueQuality({
  schema: "signal-interpreter-dialogue-evaluation/v1",
  reference: { segments: [{ source: "groq-remote", startMs: null, endMs: 1, text: "x" }] },
  hypothesis: { segments: [] }
}), /invalid timestamps/);

console.log("DIALOGUE_QUALITY_EVALUATION=PASS");
