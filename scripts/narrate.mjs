#!/usr/bin/env node
// Narration pipeline: data/wetel-shorts.json -> public/audio/<id>/<n>.mp3 + data/wetel-shorts-timing.json
// Local macOS `say` + ffmpeg only, no network, no credentials. Re-run after editing any narration line.
// Usage: node scripts/narrate.mjs [--voice Daniel] [--rate 170] [<short-id>...]
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1];
};
const voice = opt("voice", "Daniel");
const rate = opt("rate", "170");
const only = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));

// `say` mispronounces the brand name; spell it the way it is said.
const spoken = (t) => t.replace(/Wetel/g, "Wettel");

const shorts = JSON.parse(readFileSync(join(root, "data/wetel-shorts.json"), "utf8"));
const timingPath = join(root, "data/wetel-shorts-timing.json");
const timing = existsSync(timingPath) ? JSON.parse(readFileSync(timingPath, "utf8")) : {};
const tmp = mkdtempSync(join(tmpdir(), "narrate-"));

try {
  for (const short of shorts) {
    if (only.length && !only.includes(short.id)) continue;
    const dir = join(root, "public/audio", short.id);
    mkdirSync(dir, { recursive: true });
    timing[short.id] = short.scenes.map((scene, i) => {
      const aiff = join(tmp, `${short.id}-${i}.aiff`);
      const mp3 = join(dir, `${i}.mp3`);
      execFileSync("say", ["-v", voice, "-r", rate, "-o", aiff, spoken(scene.narration)]);
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", aiff, "-ar", "44100", "-ac", "1", "-b:a", "128k", mp3]);
      const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).toString();
      const seconds = Math.round(parseFloat(out) * 1000) / 1000;
      console.log(`${short.id} scene ${i}: ${seconds}s`);
      return seconds;
    });
    const total = timing[short.id].reduce((a, b) => a + b, 0);
    console.log(`${short.id}: ${total.toFixed(1)}s narration`);
  }
  writeFileSync(timingPath, JSON.stringify(timing, null, 2) + "\n");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
