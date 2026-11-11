#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SOURCES = ["groq-remote", "groq-interpreter"];

function normalizeText(value, language) {
  let text = String(value ?? "");
  try { text = text.normalize("NFKC"); } catch (_) {}
  try { text = text.toLocaleLowerCase(language || "und"); } catch (_) {
    text = text.toLowerCase();
  }
  return text;
}

function wordValues(value, language) {
  const text = normalizeText(value, language);
  if (typeof Intl.Segmenter === "function") {
    try {
      const segmenter = new Intl.Segmenter(language || "und", { granularity: "word" });
      return Array.from(segmenter.segment(text))
        .filter(part => part.isWordLike)
        .map(part => part.segment);
    } catch (_) {}
  }
  return text
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
}

function characterValues(value, language) {
  const text = normalizeText(value, language)
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "");
  return Array.from(text);
}

function normalizeSegments(input, language, label) {
  if (!Array.isArray(input)) throw new TypeError(label + ".segments must be an array");
  return input.map((segment, index) => {
    if (!segment || !SOURCES.includes(segment.source)) {
      throw new TypeError(label + ".segments[" + index + "].source is invalid");
    }
    if (segment.startMs == null || segment.endMs == null ||
        !Number.isFinite(Number(segment.startMs)) ||
        !Number.isFinite(Number(segment.endMs)) ||
        Number(segment.startMs) < 0 ||
        Number(segment.endMs) < Number(segment.startMs)) {
      throw new TypeError(label + ".segments[" + index + "] has invalid timestamps");
    }
    const text = String(segment.text ?? "");
    if (!text.trim()) throw new TypeError(label + ".segments[" + index + "].text is empty");
    const latencyMs = segment.latencyMs == null ? null : Number(segment.latencyMs);
    if (latencyMs !== null && (!Number.isFinite(latencyMs) || latencyMs < 0)) {
      throw new TypeError(label + ".segments[" + index + "].latencyMs is invalid");
    }
    return {
      source: segment.source,
      speakerId: segment.speakerId == null ? null : String(segment.speakerId),
      startMs: Number(segment.startMs),
      endMs: Number(segment.endMs),
      latencyMs,
      language: String(segment.language || language),
      text,
      index
    };
  }).sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs || a.index - b.index);
}

function flattenWords(segments, language) {
  const output = [];
  for (const segment of segments) {
    for (const value of wordValues(segment.text, segment.language || language)) {
      output.push({
        value,
        speakerId: segment.speakerId,
        source: segment.source,
        startMs: segment.startMs
      });
    }
  }
  return output;
}

function align(reference, hypothesis) {
  const rows = reference.length + 1;
  const columns = hypothesis.length + 1;
  const costs = Array.from({ length: rows }, () => new Uint32Array(columns));
  const moves = Array.from({ length: rows }, () => new Uint8Array(columns));

  for (let i = 1; i < rows; i++) {
    costs[i][0] = i;
    moves[i][0] = 1; // deletion
  }
  for (let j = 1; j < columns; j++) {
    costs[0][j] = j;
    moves[0][j] = 2; // insertion
  }

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < columns; j++) {
      const equal = reference[i - 1].value === hypothesis[j - 1].value;
      const diagonal = costs[i - 1][j - 1] + (equal ? 0 : 1);
      const deletion = costs[i - 1][j] + 1;
      const insertion = costs[i][j - 1] + 1;
      const best = Math.min(diagonal, deletion, insertion);
      costs[i][j] = best;
      // Prefer diagonal alignment on ties to preserve exact word anchors.
      moves[i][j] = diagonal === best ? 0 : deletion === best ? 1 : 2;
    }
  }

  const operations = [];
  let i = reference.length;
  let j = hypothesis.length;
  while (i > 0 || j > 0) {
    const move = moves[i][j];
    if (i > 0 && j > 0 && move === 0) {
      const ref = reference[i - 1];
      const hyp = hypothesis[j - 1];
      operations.push({
        type: ref.value === hyp.value ? "match" : "substitution",
        reference: ref,
        hypothesis: hyp
      });
      i--;
      j--;
    } else if (i > 0 && (j === 0 || move === 1)) {
      operations.push({ type: "deletion", reference: reference[i - 1], hypothesis: null });
      i--;
    } else {
      operations.push({ type: "insertion", reference: null, hypothesis: hypothesis[j - 1] });
      j--;
    }
  }
  operations.reverse();

  const counts = { substitutions: 0, deletions: 0, insertions: 0, matches: 0 };
  for (const operation of operations) {
    if (operation.type === "match") counts.matches++;
    else if (operation.type === "substitution") counts.substitutions++;
    else if (operation.type === "deletion") counts.deletions++;
    else counts.insertions++;
  }
  return { operations, counts };
}

function rate(errors, denominator) {
  return denominator > 0 ? Number((errors / denominator).toFixed(4)) : null;
}

function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(fraction * sorted.length) - 1);
  return Number(sorted[index].toFixed(1));
}

function chronologyInversions(segments) {
  let inversions = 0;
  for (let index = 1; index < segments.length; index++) {
    if (Number(segments[index - 1]?.startMs) > Number(segments[index]?.startMs)) inversions++;
  }
  return inversions;
}

function chronologyBySource(segments) {
  return Object.fromEntries(SOURCES.map(source => [
    source,
    chronologyInversions(segments.filter(segment => segment?.source === source))
  ]));
}

function buildDialogueTurns(segments, gapThresholdMs) {
  const tracks = new Map();
  const ordered = segments.slice().sort((a, b) =>
    a.startMs - b.startMs || a.endMs - b.endMs || a.index - b.index
  );

  for (const segment of ordered) {
    const trackKey = JSON.stringify([segment.source, segment.speakerId]);
    const turns = tracks.get(trackKey) || [];
    const previous = turns[turns.length - 1];
    if (previous && segment.startMs - previous.endMs <= gapThresholdMs) {
      previous.endMs = Math.max(previous.endMs, segment.endMs);
      previous.segmentCount++;
    } else {
      turns.push({
        id: trackKey + "#" + String(turns.length),
        source: segment.source,
        speakerId: segment.speakerId,
        startMs: segment.startMs,
        endMs: segment.endMs,
        segmentCount: 1
      });
    }
    tracks.set(trackKey, turns);
  }

  return Array.from(tracks.values()).flat().sort((a, b) =>
    a.startMs - b.startMs || a.endMs - b.endMs || a.id.localeCompare(b.id)
  );
}

function matchDialogueTurns(referenceTurns, hypothesisTurns, minimumOverlapMs) {
  const matchedHypothesisToReference = new Map();
  const bySource = {};

  for (const source of SOURCES) {
    const reference = referenceTurns.filter(turn => turn.source === source);
    const hypothesis = hypothesisTurns.filter(turn => turn.source === source);
    const usedHypothesis = new Set();
    let matched = 0;

    for (const expected of reference) {
      let best = null;
      for (const actual of hypothesis) {
        if (usedHypothesis.has(actual.id)) continue;
        if (expected.speakerId != null && actual.speakerId !== expected.speakerId) continue;
        const intersection = Math.max(0,
          Math.min(expected.endMs, actual.endMs) - Math.max(expected.startMs, actual.startMs)
        );
        if (intersection < minimumOverlapMs) continue;
        const union = Math.max(expected.endMs, actual.endMs) - Math.min(expected.startMs, actual.startMs);
        const score = union > 0 ? intersection / union : 0;
        const startDelta = Math.abs(expected.startMs - actual.startMs);
        if (!best || score > best.score || (score === best.score && startDelta < best.startDelta)) {
          best = { turn: actual, score, startDelta };
        }
      }
      if (best) {
        usedHypothesis.add(best.turn.id);
        matchedHypothesisToReference.set(best.turn.id, expected.id);
        matched++;
      }
    }

    const precision = rate(matched, hypothesis.length);
    const recall = rate(matched, reference.length);
    bySource[source] = {
      referenceTurns: reference.length,
      hypothesisTurns: hypothesis.length,
      matchedTurns: matched,
      missedTurns: reference.length - matched,
      extraTurns: hypothesis.length - matched,
      precision,
      recall,
      f1: precision == null || recall == null || precision + recall === 0
        ? null : Number((2 * precision * recall / (precision + recall)).toFixed(4))
    };
  }

  return { bySource, matchedHypothesisToReference };
}

function findCrossSourceOverlapPairs(turns, minimumOverlapMs) {
  const remote = turns.filter(turn => turn.source === "groq-remote");
  const interpreter = turns.filter(turn => turn.source === "groq-interpreter");
  const pairs = [];
  for (const remoteTurn of remote) {
    for (const interpreterTurn of interpreter) {
      const overlapMs = Math.max(0,
        Math.min(remoteTurn.endMs, interpreterTurn.endMs) -
        Math.max(remoteTurn.startMs, interpreterTurn.startMs)
      );
      if (overlapMs >= minimumOverlapMs) {
        pairs.push({ remoteId: remoteTurn.id, interpreterId: interpreterTurn.id, overlapMs });
      }
    }
  }
  return pairs;
}

function evaluateOverlapPreservation(referenceTurns, hypothesisTurns, matchedHypothesisToReference, minimumOverlapMs) {
  const referencePairs = findCrossSourceOverlapPairs(referenceTurns, minimumOverlapMs);
  const hypothesisPairs = findCrossSourceOverlapPairs(hypothesisTurns, minimumOverlapMs);
  const expectedKeys = new Set(referencePairs.map(pair => pair.remoteId + "|" + pair.interpreterId));
  const seenHypothesisKeys = new Set();
  let preservedPairs = 0;
  let extraPairs = 0;

  for (const pair of hypothesisPairs) {
    const remoteId = matchedHypothesisToReference.get(pair.remoteId);
    const interpreterId = matchedHypothesisToReference.get(pair.interpreterId);
    const key = remoteId && interpreterId ? remoteId + "|" + interpreterId : null;
    const uniqueKey = key || "unmatched|" + pair.remoteId + "|" + pair.interpreterId;
    if (seenHypothesisKeys.has(uniqueKey)) continue;
    seenHypothesisKeys.add(uniqueKey);
    if (key && expectedKeys.has(key)) preservedPairs++;
    else extraPairs++;
  }

  const missedPairs = Math.max(0, referencePairs.length - preservedPairs);
  const precision = rate(preservedPairs, preservedPairs + extraPairs);
  const recall = rate(preservedPairs, referencePairs.length);
  const referenceOverlapMs = referencePairs.reduce((sum, pair) => sum + pair.overlapMs, 0);
  const hypothesisOverlapMs = hypothesisPairs.reduce((sum, pair) => sum + pair.overlapMs, 0);

  return {
    referencePairs: referencePairs.length,
    hypothesisPairs: hypothesisPairs.length,
    preservedPairs,
    missedPairs,
    extraPairs,
    precision,
    recall,
    f1: precision == null || recall == null || precision + recall === 0
      ? null : Number((2 * precision * recall / (precision + recall)).toFixed(4)),
    referenceOverlapMs,
    hypothesisOverlapMs,
    overlapDurationDeltaMs: hypothesisOverlapMs - referenceOverlapMs
  };
}

function hasContiguous(tokens, termTokens) {
  if (!termTokens.length || termTokens.length > tokens.length) return false;
  outer: for (let i = 0; i <= tokens.length - termTokens.length; i++) {
    for (let j = 0; j < termTokens.length; j++) {
      if (tokens[i + j] !== termTokens[j]) continue outer;
    }
    return true;
  }
  return false;
}

function evaluateSource(referenceSegments, hypothesisSegments, language) {
  const referenceWords = flattenWords(referenceSegments, language);
  const hypothesisWords = flattenWords(hypothesisSegments, language);
  const wordAlignment = align(referenceWords, hypothesisWords);

  const referenceCharacters = referenceSegments.flatMap(segment => characterValues(segment.text, segment.language || language));
  const hypothesisCharacters = hypothesisSegments.flatMap(segment => characterValues(segment.text, segment.language || language));
  const characterAlignment = align(
    referenceCharacters.map(value => ({ value })),
    hypothesisCharacters.map(value => ({ value }))
  );

  let speakerCompared = 0;
  let speakerCorrect = 0;
  for (const operation of wordAlignment.operations) {
    if (operation.type !== "match") continue;
    const expected = operation.reference.speakerId;
    const actual = operation.hypothesis.speakerId;
    if (expected == null) continue;
    speakerCompared++;
    if (actual === expected) speakerCorrect++;
  }

  const wordErrors = wordAlignment.counts.substitutions +
    wordAlignment.counts.deletions + wordAlignment.counts.insertions;
  const characterErrors = characterAlignment.counts.substitutions +
    characterAlignment.counts.deletions + characterAlignment.counts.insertions;

  return {
    referenceWords: referenceWords.length,
    hypothesisWords: hypothesisWords.length,
    wordErrors,
    wordErrorRate: rate(wordErrors, referenceWords.length),
    characterReferenceUnits: referenceCharacters.length,
    characterErrors,
    characterErrorRate: rate(characterErrors, referenceCharacters.length),
    substitutions: wordAlignment.counts.substitutions,
    deletions: wordAlignment.counts.deletions,
    insertions: wordAlignment.counts.insertions,
    speakerTokensCompared: speakerCompared,
    speakerTokensCorrect: speakerCorrect,
    speakerAttributionAccuracy: speakerCompared
      ? Number((speakerCorrect / speakerCompared).toFixed(4))
      : null
  };
}

export function evaluateDialogueQuality(dataset) {
  if (!dataset || dataset.schema !== "signal-interpreter-dialogue-evaluation/v1") {
    throw new TypeError("schema must be signal-interpreter-dialogue-evaluation/v1");
  }
  const language = String(dataset.language || "es");
  const reference = normalizeSegments(dataset.reference?.segments, language, "reference");
  const hypothesis = normalizeSegments(dataset.hypothesis?.segments, language, "hypothesis");

  const bySource = {};
  let aggregate = {
    referenceWords: 0, hypothesisWords: 0, wordErrors: 0,
    characterReferenceUnits: 0, characterErrors: 0,
    substitutions: 0, deletions: 0, insertions: 0,
    speakerTokensCompared: 0, speakerTokensCorrect: 0
  };

  for (const source of SOURCES) {
    const ref = reference.filter(segment => segment.source === source);
    const hyp = hypothesis.filter(segment => segment.source === source);
    const result = evaluateSource(ref, hyp, language);
    bySource[source] = result;
    for (const key of Object.keys(aggregate)) aggregate[key] += result[key] || 0;
  }

  const criticalTerms = Array.isArray(dataset.criticalTerms) ? dataset.criticalTerms : [];
  const hypothesisWords = Object.fromEntries(SOURCES.map(source => [
    source,
    flattenWords(hypothesis.filter(segment => segment.source === source), language).map(token => token.value)
  ]));
  let criticalPreserved = 0;
  const criticalBySource = Object.fromEntries(SOURCES.map(source => [source, { evaluated: 0, preserved: 0 }]));
  for (const item of criticalTerms) {
    const term = typeof item === "string" ? item : String(item?.term ?? "");
    const requestedSource = typeof item === "string" ? null : item?.source;
    const termLanguage = typeof item === "string" ? language : String(item?.language || language);
    if (!term.trim() || (requestedSource != null && !SOURCES.includes(requestedSource))) {
      throw new TypeError("criticalTerms contains an empty term or invalid source");
    }
    const tokens = wordValues(term, termLanguage);
    const sources = requestedSource ? [requestedSource] : SOURCES;
    const preserved = sources.some(source => hasContiguous(hypothesisWords[source], tokens));
    if (preserved) criticalPreserved++;
    if (requestedSource) {
      criticalBySource[requestedSource].evaluated++;
      if (preserved) criticalBySource[requestedSource].preserved++;
    } else {
      for (const source of SOURCES) {
        criticalBySource[source].evaluated++;
        if (hasContiguous(hypothesisWords[source], tokens)) criticalBySource[source].preserved++;
      }
    }
  }
  const criticalTermsBySource = Object.fromEntries(SOURCES.map(source => {
    const item = criticalBySource[source];
    return [source, {
      evaluated: item.evaluated,
      preserved: item.preserved,
      recall: item.evaluated ? Number((item.preserved / item.evaluated).toFixed(4)) : null
    }];
  }));

  const suppliedLatencies = Array.isArray(dataset.hypothesis?.latenciesMs)
    ? dataset.hypothesis.latenciesMs.map(Number)
    : hypothesis.filter(segment => segment.latencyMs != null).map(segment => Number(segment.latencyMs));
  const validLatencies = suppliedLatencies.filter(value => Number.isFinite(value) && value >= 0);
  const latencyBySource = Object.fromEntries(SOURCES.map(source => {
    const values = hypothesis
      .filter(segment => segment.source === source && segment.latencyMs != null)
      .map(segment => segment.latencyMs)
      .filter(value => Number.isFinite(value) && value >= 0);
    return [source, {
      samples: values.length,
      p50Ms: percentile(values, 0.5),
      p95Ms: percentile(values, 0.95),
      maxMs: values.length ? Math.max(...values) : null
    }];
  }));

  const structureOptions = dataset.structureOptions && typeof dataset.structureOptions === "object"
    ? dataset.structureOptions : {};
  const turnGapThresholdMs = structureOptions.turnGapThresholdMs == null
    ? 1200 : Number(structureOptions.turnGapThresholdMs);
  const minimumOverlapMs = structureOptions.minimumOverlapMs == null
    ? 100 : Number(structureOptions.minimumOverlapMs);
  if (!Number.isFinite(turnGapThresholdMs) || turnGapThresholdMs < 0 ||
      !Number.isFinite(minimumOverlapMs) || minimumOverlapMs <= 0) {
    throw new TypeError("turnGapThresholdMs must be non-negative and minimumOverlapMs must be positive");
  }

  const referenceTurns = buildDialogueTurns(reference, turnGapThresholdMs);
  const hypothesisTurns = buildDialogueTurns(hypothesis, turnGapThresholdMs);
  const turnMatching = matchDialogueTurns(referenceTurns, hypothesisTurns, minimumOverlapMs);
  const referenceSegmentsInput = dataset.reference.segments;
  const hypothesisSegmentsInput = dataset.hypothesis.segments;
  const hypothesisChronologyBySource = chronologyBySource(hypothesisSegmentsInput);
  const referenceChronologyBySource = chronologyBySource(referenceSegmentsInput);
  const turnCounts = Object.values(turnMatching.bySource).reduce((total, item) => ({
    referenceTurns: total.referenceTurns + item.referenceTurns,
    hypothesisTurns: total.hypothesisTurns + item.hypothesisTurns,
    matchedTurns: total.matchedTurns + item.matchedTurns,
    missedTurns: total.missedTurns + item.missedTurns,
    extraTurns: total.extraTurns + item.extraTurns
  }), { referenceTurns: 0, hypothesisTurns: 0, matchedTurns: 0, missedTurns: 0, extraTurns: 0 });
  const turnPrecision = rate(turnCounts.matchedTurns, turnCounts.hypothesisTurns);
  const turnRecall = rate(turnCounts.matchedTurns, turnCounts.referenceTurns);
  const turnF1 = turnPrecision == null || turnRecall == null || turnPrecision + turnRecall === 0
    ? null : Number((2 * turnPrecision * turnRecall / (turnPrecision + turnRecall)).toFixed(4));
  const overlapPreservation = evaluateOverlapPreservation(
    referenceTurns, hypothesisTurns, turnMatching.matchedHypothesisToReference, minimumOverlapMs
  );

  const wordDenominator = aggregate.referenceWords;
  const characterDenominator = aggregate.characterReferenceUnits;
  const speakerDenominator = aggregate.speakerTokensCompared;

  return {
    schema: "signal-interpreter-dialogue-quality-report/v1",
    language,
    bySource,
    overall: {
      referenceWords: aggregate.referenceWords,
      hypothesisWords: aggregate.hypothesisWords,
      substitutions: aggregate.substitutions,
      deletions: aggregate.deletions,
      insertions: aggregate.insertions,
      wordErrorRate: rate(aggregate.wordErrors, wordDenominator),
      characterReferenceUnits: aggregate.characterReferenceUnits,
      characterErrorRate: rate(aggregate.characterErrors, characterDenominator)
    },
    criticalTerms: {
      evaluated: criticalTerms.length,
      preserved: criticalPreserved,
      recall: criticalTerms.length ? Number((criticalPreserved / criticalTerms.length).toFixed(4)) : null,
      bySource: criticalTermsBySource
    },
    dialogueStructure: {
      definition: {
        turnGapThresholdMs,
        minimumOverlapMs,
        note: "A turn groups consecutive segments on the same source/speaker track; unknown speaker IDs remain grouped as unknown."
      },
      turns: {
        bySource: turnMatching.bySource,
        overall: Object.assign({}, turnCounts, {
          precision: turnPrecision,
          recall: turnRecall,
          f1: turnF1
        })
      },
      chronology: {
        referenceOutOfOrderAdjacentPairs: chronologyInversions(referenceSegmentsInput),
        hypothesisOutOfOrderAdjacentPairs: chronologyInversions(hypothesisSegmentsInput),
        referenceBySource: referenceChronologyBySource,
        hypothesisBySource: hypothesisChronologyBySource
      },
      crossSourceOverlap: overlapPreservation
    },
    speakerAttribution: {
      comparedTokens: speakerDenominator,
      correctTokens: aggregate.speakerTokensCorrect,
      accuracy: speakerDenominator
        ? Number((aggregate.speakerTokensCorrect / speakerDenominator).toFixed(4))
        : null
    },
    latency: {
      samples: validLatencies.length,
      p50Ms: percentile(validLatencies, 0.5),
      p95Ms: percentile(validLatencies, 0.95),
      maxMs: validLatencies.length ? Math.max(...validLatencies) : null,
      bySource: latencyBySource
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node tools/evaluate-dialogue-quality.mjs <evaluation.json>");
    process.exit(2);
  }
  try {
    const dataset = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    const report = evaluateDialogueQuality(dataset);
    // Deliberately emit aggregate metrics only; never echo reference or hypothesis text.
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } catch (error) {
    console.error("Evaluation failed: " + String(error && error.message || error));
    process.exit(1);
  }
}
