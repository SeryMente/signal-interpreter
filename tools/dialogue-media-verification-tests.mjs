import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { verifyDialogueMedia } from "./verify-dialogue-media.mjs";

function makeWav(sampleValue) {
  const sampleRate = 16000;
  const channels = 1;
  const bitsPerSample = 16;
  const dataBytes = sampleRate * channels * (bitsPerSample / 8);
  const wav = Buffer.alloc(44 + dataBytes);
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVE", 8, "ascii");
  wav.write("fmt ", 12, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  wav.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  wav.writeUInt16LE(bitsPerSample, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(dataBytes, 40);
  for (let offset = 44; offset < wav.length; offset += 2) wav.writeInt16LE(sampleValue, offset);
  return wav;
}

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "si-dialogue-media-"));
try {
  const remoteWav = makeWav(0);
  const interpreterWav = makeWav(1);
  const remoteHash = createHash("sha256").update(remoteWav).digest("hex");
  const interpreterHash = createHash("sha256").update(interpreterWav).digest("hex");
  fs.writeFileSync(path.join(tempDirectory, remoteHash + ".wav"), remoteWav, { flag: "wx" });
  fs.writeFileSync(path.join(tempDirectory, interpreterHash + ".wav"), interpreterWav, { flag: "wx" });

  const manifest = {
    schema: "signal-interpreter-dialogue-benchmark/v1",
    corpus: {
      rawAudioStoredOutsideRepository: true,
      transcriptsStoredOutsideRepository: true
    },
    recordings: [{
      id: "clip-001",
      media: {
        "groq-remote": {
          sha256: remoteHash, durationMs: 1000, sampleRate: 16000, channels: 1, codec: "pcm_s16le"
        },
        "groq-interpreter": {
          sha256: interpreterHash, durationMs: 1000, sampleRate: 16000, channels: 1, codec: "pcm_s16le"
        }
      }
    }]
  };
  const verified = verifyDialogueMedia(manifest, tempDirectory);
  assert.equal(verified.recordings, 1);
  assert.equal(verified.sourceFiles, 2);
  assert.equal(verified.uniqueAudioFiles, 2);
  assert.equal(verified.sha256, "PASS");
  assert.equal(verified.duration, "PASS");
  assert.equal(verified.storageBoundary, "OUTSIDE_REPOSITORY");
  assert.equal(JSON.stringify(verified).includes(tempDirectory), false);

  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  assert.throws(() => verifyDialogueMedia(manifest, repositoryRoot), /outside the Git repository/);

  const wrongHash = structuredClone(manifest);
  wrongHash.recordings[0].media["groq-remote"].sha256 = "f".repeat(64);
  assert.throws(() => verifyDialogueMedia(wrongHash, tempDirectory), /SHA-256 mismatch|ENOENT/);

  const invalidFormatDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "si-dialogue-media-invalid-"));
  try {
    const invalidWav = Buffer.from(remoteWav);
    invalidWav.writeUInt16LE(2, 22);
    invalidWav.writeUInt32LE(64000, 28);
    invalidWav.writeUInt16LE(4, 32);
    const invalidHash = createHash("sha256").update(invalidWav).digest("hex");
    fs.writeFileSync(path.join(invalidFormatDirectory, invalidHash + ".wav"), invalidWav, { flag: "wx" });
    const invalid = structuredClone(manifest);
    invalid.recordings[0].media["groq-remote"].sha256 = invalidHash;
    assert.throws(() => verifyDialogueMedia(invalid, invalidFormatDirectory), /mono 16 kHz|channel/);
  } finally {
    fs.rmSync(invalidFormatDirectory, { recursive: true, force: true });
  }

  const badDuration = structuredClone(manifest);
  badDuration.recordings[0].media["groq-remote"].durationMs = 1200;
  assert.throws(() => verifyDialogueMedia(badDuration, tempDirectory), /duration differs/);

  console.log("DIALOGUE_MEDIA_VERIFICATION=PASS");
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}
