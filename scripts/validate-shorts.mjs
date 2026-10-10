#!/usr/bin/env node
// Lint data/wetel-shorts.json against the layout and brand rules before spending TTS calls or render time.
// Usage: node scripts/validate-shorts.mjs [<short-id>...]   (exit 1 on any error)
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shorts = JSON.parse(readFileSync(join(root, "data/wetel-shorts.json"), "utf8"));
const only = process.argv.slice(2);
const KINDS = ["hook", "cards", "table", "flow", "cta"];
const TONES = ["accent", "good", "bad", "warn", "muted"];
// Content runs y=230..1230 (SOP 14 step 4). The estimate runs ~5% high (calibrated on wetel01 scene 3: real 962 px, estimated 1008).
const CONTENT_BUDGET_PX = 1010;
const lines = (text, perLine) => Math.max(1, Math.ceil(text.length / perLine));
const titleHeight = (t, size = 76) => 34 + 20 + lines(t, Math.floor(880 / (size * 0.52))) * size * 1.1;

let errors = 0;
const fail = (id, i, msg) => {
  errors++;
  console.error(`✗ ${id} scene ${i}: ${msg}`);
};

for (const s of shorts) {
  if (only.length && !only.includes(s.id)) continue;
  if (!/^wetel\d\d-[a-z0-9-]+$/.test(s.id)) fail(s.id, "-", "id must look like wetelNN-slug");
  if (!s.source) fail(s.id, "-", "missing source post");
  if (!s.scenes?.length || s.scenes.length > 8) fail(s.id, "-", "needs 1-8 scenes");
  if (s.scenes.at(-1)?.kind !== "cta") fail(s.id, "-", "last scene must be the cta");
  let chars = 0;
  s.scenes.forEach((sc, i) => {
    const id = s.id;
    if (!KINDS.includes(sc.kind)) return fail(id, i, `unknown kind ${sc.kind}`);
    if (!sc.narration || sc.narration.length < 60 || sc.narration.length > 340) fail(id, i, `narration ${sc.narration?.length ?? 0} chars, want 60-340`);
    if (/TODO/.test(JSON.stringify(sc))) fail(id, i, "unfinished TODO");
    if (/webby/i.test(JSON.stringify(sc))) fail(id, i, "never mention Webby/WebbyGroup/WebbyIntel");
    if (/\bwetel\.dev|https?:/i.test(sc.narration)) fail(id, i, 'write URLs as spoken in the narration ("wetel dot dev"), not "wetel.dev"');
    if ((sc.eyebrow ?? "").length > 30) fail(id, i, "eyebrow over 30 chars");
    if ((sc.title ?? "").length > 44) fail(id, i, "title over 44 chars");
    chars += sc.narration?.length ?? 0;
    if (sc.kind === "cards") {
      if (!sc.items?.length || sc.items.length > 4) fail(id, i, "cards needs 1-4 items");
      if (sc.items?.length === 4 && sc.title.length > 24) fail(id, i, "4-card scenes need a one-line title (max 24 chars) or the last card reaches the mascot");
      let h = titleHeight(sc.title) + 44;
      for (const it of sc.items ?? []) {
        if (!TONES.includes(it.tone)) fail(id, i, `bad tone ${it.tone}`);
        if (it.label.length > 36) fail(id, i, `label too long: ${it.label}`);
        if (it.text.length > 80) fail(id, i, `item text too long: ${it.text}`);
        h += 52 + 53 + lines(it.text, 34) * 47 + 22;
      }
      if (h > CONTENT_BUDGET_PX) fail(id, i, `cards likely ${Math.round(h)}px tall, budget ${CONTENT_BUDGET_PX}; shorten or split the scene`);
    }
    if (sc.kind === "table" && (sc.rows?.length > 4 || sc.columns?.length > 3)) fail(id, i, "table: max 4 rows, 3 columns");
    if (sc.kind === "flow" && (sc.branches?.length ?? 0) > 3) fail(id, i, "flow: max 3 branches");
    if (sc.kind === "flow") for (const b of sc.branches) if (b.text.length > 50) fail(id, i, `branch text too long: ${b.text}`);
  });
  const estSeconds = chars / 14; // ~14 chars/s measured with Gemini Sulafat
  if (estSeconds > 170) fail(s.id, "-", `estimated ${Math.round(estSeconds)} s, Shorts max is 180`);
  console.log(`${errors ? "…" : "✓"} ${s.id}: ${s.scenes.length} scenes, ~${Math.round(estSeconds)} s`);
}
process.exit(errors ? 1 : 0);
