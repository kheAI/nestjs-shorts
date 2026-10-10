#!/usr/bin/env node
// Scaffold a new short: appends a skeleton entry to data/wetel-shorts.json for you to fill in.
// Usage: node scripts/new-short.mjs <NN> <slug> <blog-post-slug> "<Title>"
//   e.g. node scripts/new-short.mjs 06 sub-agents what-is-a-sub-agent-and-when-would-i-use-one "What is a sub-agent?"
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const [nn, slug, post, title] = process.argv.slice(2);
if (!nn || !slug || !post || !title) {
  console.error('Usage: node scripts/new-short.mjs <NN> <slug> <blog-post-slug> "<Title>"');
  process.exit(1);
}
const path = join(dirname(fileURLToPath(import.meta.url)), "../data/wetel-shorts.json");
const shorts = JSON.parse(readFileSync(path, "utf8"));
const id = `wetel${nn}-${slug}`;
if (shorts.some((s) => s.id === id)) throw new Error(`${id} already exists`);
const TODO = "TODO: replace with 2-3 spoken sentences (60-340 characters), written the way it is said out loud.";
shorts.push({
  id,
  title,
  source: `wetel-site blog: ${post}`,
  scenes: [
    { kind: "hook", eyebrow: `AI employees · ${nn}`, title: "TODO hook title", subtitle: "TODO one line", narration: TODO },
    { kind: "cards", eyebrow: "TODO", title: "TODO", items: [{ label: "TODO", text: "TODO", tone: "accent" }], narration: TODO },
    { kind: "cards", eyebrow: "Honest gap", title: "TODO what is not built yet", items: [{ label: "Today", text: "TODO", tone: "warn" }], narration: TODO },
    { kind: "cta", eyebrow: "Read more", title: "TODO", subtitle: "wetel.dev", narration: "TODO ending with the link spoken as wetel dot dev." },
  ],
});
writeFileSync(path, JSON.stringify(shorts, null, 2) + "\n");
console.log(`Added ${id}. Fill in the TODOs, then: scripts/make-short.sh ${id}`);
