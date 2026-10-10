#!/usr/bin/env node
// Narration pipeline: data/wetel-shorts.json -> public/audio/<id>/<n>.mp3 + data/wetel-shorts-timing.json
// Engines: `gemini` (default, human-sounding; needs GEMINI_API_KEY in the environment, never committed) or
// `say` (offline macOS fallback, robotic). Re-run after editing any narration line.
// Usage: GEMINI_API_KEY=... node scripts/narrate.mjs [--engine gemini|say] [--voice Sulafat] [--rate 170] [<short-id>...]
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
const engine = opt("engine", "gemini");
const voice = opt("voice", engine === "say" ? "Daniel" : "Sulafat");
const model = process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-lite-tts";
// No style prefix: the lite TTS model reads instructions aloud instead of following them (measured 2026-10-10).
const rate = opt("rate", "170");
const only = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));

// `say` mispronounces the brand name; spell it the way it is said.
const spoken = (t) => (engine === "say" ? t.replace(/Wetel/g, "Wettel") : t);

async function geminiPcm(text, pcmPath, attempt = 1) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set (or use --engine say)");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (res.status === 429 && attempt < 5) {
    // Per-minute quota on a key shared with the live platform: back off, never hammer.
    await new Promise((r) => setTimeout(r, 20_000 * attempt));
    return geminiPcm(text, pcmPath, attempt + 1);
  }
  if (!res.ok) throw new Error(`Gemini TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const data = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!data) throw new Error("Gemini TTS returned no audio");
  // The API returns a complete 24 kHz mono WAV; ffmpeg reads it directly.
  writeFileSync(pcmPath, Buffer.from(data, "base64"));
}

const shorts = JSON.parse(readFileSync(join(root, "data/wetel-shorts.json"), "utf8"));
const timingPath = join(root, "data/wetel-shorts-timing.json");
const timing = existsSync(timingPath) ? JSON.parse(readFileSync(timingPath, "utf8")) : {};
const tmp = mkdtempSync(join(tmpdir(), "narrate-"));

try {
  for (const short of shorts) {
    if (only.length && !only.includes(short.id)) continue;
    const dir = join(root, "public/audio", short.id);
    mkdirSync(dir, { recursive: true });
    timing[short.id] = [];
    for (const [i, scene] of short.scenes.entries()) {
      const mp3 = join(dir, `${i}.mp3`);
      if (engine === "say") {
        const aiff = join(tmp, `${short.id}-${i}.aiff`);
        execFileSync("say", ["-v", voice, "-r", rate, "-o", aiff, spoken(scene.narration)]);
        execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", aiff, "-ar", "44100", "-ac", "1", "-b:a", "128k", mp3]);
      } else {
        const pcm = join(tmp, `${short.id}-${i}.wav`);
        await geminiPcm(spoken(scene.narration), pcm);
        await new Promise((r) => setTimeout(r, 3000));
        execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", pcm, "-ar", "44100", "-ac", "1", "-b:a", "128k", mp3]);
      }
      const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).toString();
      const seconds = Math.round(parseFloat(out) * 1000) / 1000;
      console.log(`${short.id} scene ${i}: ${seconds}s`);
      timing[short.id].push(seconds);
      writeFileSync(timingPath, JSON.stringify(timing, null, 2) + "\n");
    }
    const total = timing[short.id].reduce((a, b) => a + b, 0);
    console.log(`${short.id}: ${total.toFixed(1)}s narration`);
  }
  writeFileSync(timingPath, JSON.stringify(timing, null, 2) + "\n");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
