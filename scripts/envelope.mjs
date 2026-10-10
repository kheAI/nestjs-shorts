#!/usr/bin/env node
// Loudness envelope per scene (one 0-100 value per video frame at 30 fps) so the on-screen mascot's mouth
// follows the narration. Reads public/audio/<id>/<n>.mp3, writes data/wetel-shorts-envelope.json.
// Pure ffmpeg + node, no network. Run after narrate.mjs.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;
const RATE = 8000;
const shorts = JSON.parse(readFileSync(join(root, "data/wetel-shorts.json"), "utf8"));
const out = {};

for (const short of shorts) {
  out[short.id] = short.scenes.map((_, i) => {
    const mp3 = join(root, "public/audio", short.id, `${i}.mp3`);
    if (!existsSync(mp3)) throw new Error(`Missing ${mp3}; run narrate.mjs first`);
    const raw = execFileSync("ffmpeg", ["-loglevel", "error", "-i", mp3, "-f", "s16le", "-ac", "1", "-ar", String(RATE), "-"], {
      maxBuffer: 64 * 1024 * 1024,
    });
    const samples = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2));
    const win = RATE / FPS;
    const rms = [];
    for (let f = 0; f * win < samples.length; f++) {
      let sum = 0;
      const end = Math.min(samples.length, (f + 1) * win);
      for (let k = f * win; k < end; k++) sum += samples[k] * samples[k];
      rms.push(Math.sqrt(sum / (end - f * win)));
    }
    const sorted = [...rms].sort((a, b) => a - b);
    const peak = sorted[Math.floor(sorted.length * 0.95)] || 1;
    return rms.map((v) => Math.min(100, Math.round((v / peak) * 100)));
  });
}
writeFileSync(join(root, "data/wetel-shorts-envelope.json"), JSON.stringify(out) + "\n");
console.log("envelope written for", Object.keys(out).join(", "));
