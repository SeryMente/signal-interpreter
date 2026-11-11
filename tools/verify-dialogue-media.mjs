#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const SOURCES = ["groq-remote", "groq-interpreter"];
const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new TypeError(message);
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative));
}

function readWav(buffer) {
  assert(Buffer.isBuffer(buffer) && buffer.length >= 44, "WAV container is truncated");
  assert(buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WAVE",
    "audio container must be RIFF/WAVE");
  assert(buffer.readUInt32LE(4) === buffer.length - 8, "RIFF container length does not match the file");
  let offset = 12;
  let format = null;
  let dataBytes = null;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + chunkSize;
    assert(dataEnd <= buffer.length, "WAV chunk exceeds the file boundary");
    if (chunkId === "fmt ") {
      assert(chunkSize >= 16, "WAV format chunk is too short");
      format = {
        audioFormat: buffer.readUInt16LE(dataStart),
        channels: buffer.readUInt16LE(dataStart + 2),
        sampleRate: buffer.readUInt32LE(dataStart + 4),
        byteRate: buffer.readUInt32LE(dataStart + 8),
        blockAlign: buffer.readUInt16LE(dataStart + 12),
        bitsPerSample: buffer.readUInt16LE(dataStart + 14)
      };
    } else if (chunkId === "data") {
      dataBytes = chunkSize;
    }
    offset = dataEnd + (chunkSize & 1);
  }
  assert(format && dataBytes != null, "WAV is missing the format or data chunk");
  assert(format.audioFormat === 1, "WAV must contain uncompressed integer PCM");
  assert(format.channels === 1 && format.sampleRate === 16000 && format.bitsPerSample === 16,
    "WAV must be mono 16 kHz signed 16-bit PCM");
  assert(format.blockAlign === 2 && format.byteRate === 32000,
    "WAV PCM block alignment or byte rate is invalid");
  assert(dataBytes > 0 && dataBytes % format.blockAlign === 0, "WAV audio data length is invalid");
  return {
    sampleRate: format.sampleRate,
    channels: format.channels,
    bitsPerSample: format.bitsPerSample,
    dataBytes,
    durationMs: dataBytes / format.byteRate * 1000
  };
}

export function verifyDialogueMedia(manifest, audioDirectory) {
  assert(manifest?.schema === "signal-interpreter-dialogue-benchmark/v1",
    "schema must be signal-interpreter-dialogue-benchmark/v1");
  assert(manifest.corpus?.rawAudioStoredOutsideRepository === true &&
    manifest.corpus?.transcriptsStoredOutsideRepository === true,
    "the corpus must declare that raw audio and transcripts are stored outside the repository");
  assert(Array.isArray(manifest.recordings) && manifest.recordings.length > 0,
    "benchmark recordings are required");
  assert(typeof audioDirectory === "string" && path.isAbsolute(audioDirectory),
    "audio directory must be an absolute path");
  const realDirectory = fs.realpathSync(audioDirectory);
  assert(fs.statSync(realDirectory).isDirectory(), "audio directory is invalid");
  assert(!isInside(REPOSITORY_ROOT, realDirectory),
    "raw audio directory must be outside the Git repository");

  const verified = new Map();
  let sourceFiles = 0;
  for (const recording of manifest.recordings) {
    for (const source of SOURCES) {
      const media = recording.media?.[source];
      assert(media && /^[a-f0-9]{64}$/i.test(String(media.sha256 || "")),
        "audio media metadata is invalid");
      const filename = media.sha256.toLowerCase() + ".wav";
      const candidate = path.join(realDirectory, filename);
      const realFile = fs.realpathSync(candidate);
      assert(isInside(realDirectory, realFile), "audio file resolves outside the selected audio directory");
      assert(fs.statSync(realFile).isFile(), "audio media file is invalid");
      const bytes = fs.readFileSync(realFile);
      const actualHash = createHash("sha256").update(bytes).digest("hex").toUpperCase();
      assert(actualHash === media.sha256.toUpperCase(), "audio media SHA-256 mismatch");
      const wav = readWav(bytes);
      assert(media.codec === "pcm_s16le" && media.sampleRate === 16000 && media.channels === 1,
        "media manifest does not match the required WAV profile");
      assert(Math.abs(wav.durationMs - Number(media.durationMs)) <= 20,
        "audio media duration differs from the manifest by more than 20 ms");
      verified.set(media.sha256.toUpperCase(), true);
      sourceFiles++;
    }
  }
  return {
    schema: "signal-interpreter-dialogue-media-verification/v1",
    recordings: manifest.recordings.length,
    sourceFiles,
    uniqueAudioFiles: verified.size,
    format: "mono-16000Hz-pcm-s16le",
    sha256: "PASS",
    duration: "PASS",
    storageBoundary: "OUTSIDE_REPOSITORY"
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const manifestPath = process.argv[2];
  const audioDirectory = process.argv[3];
  if (!manifestPath || !audioDirectory) {
    console.error("Usage: node tools/verify-dialogue-media.mjs <benchmark-manifest.json> <absolute-audio-directory>");
    process.exit(2);
  }
  try {
    const realManifestPath = fs.realpathSync(manifestPath);
    assert(!isInside(REPOSITORY_ROOT, realManifestPath),
      "benchmark manifest and gold transcripts must be outside the Git repository");
    const manifest = JSON.parse(fs.readFileSync(realManifestPath, "utf8"));
    const result = verifyDialogueMedia(manifest, audioDirectory);
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } catch (error) {
    console.error("Media verification failed: " + String(error && error.message || error));
    process.exit(1);
  }
}
