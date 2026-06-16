# NestJS Bite-Sized — YouTube Shorts

Programmatic video pipeline for [@khe_ai](https://youtube.com/@khe_ai) — a series of 35 YouTube Shorts explaining NestJS concepts through engineering-precise analogies.

Built with [Remotion](https://remotion.dev). Each episode is a 1080×1920 short at 30fps, rendered from a React composition.

## Series

35 episodes from `@Module` to the full request lifecycle — covering decorators, providers, guards, interceptors, pipes, microservices, and more. Episode data lives in `data/episodes.json`.

## Project layout

```
data/
  brand.json          # colours, fonts, dimensions
  episodes.json       # all 35 episode definitions
src/
  components/         # reusable animation primitives
    AnimatedLine      # accent line sweep
    ChannelHandle     # @khe_ai watermark
    CodeBlock         # syntax-highlighted code card
    CountUpNumber     # animated counter
    TypewriterText    # typewriter with blinking cursor
  templates/          # scene-level layout templates
    DefinitionCard    # hook → code reveal → golden rule
    BeforeAfter       # side-by-side comparison with divider
    CodeReveal        # sequential line typing with context label
    SystemsExplainer  # labelled items list with stat callout
    StepByStep        # numbered steps with outcome text
    StatCard          # single number with context and explanation
  compositions/       # one file per rendered episode
    Ep01Module.tsx
out/
  rendered/           # raw rendered MP4s
  ready-to-upload/    # final cuts
```

## Templates

Each template is a self-contained `React.FC` in `src/templates/` that accepts typed props and handles all scene timing internally. Pass it directly to a Remotion `<Composition>`.

| Template | Key props | Best for |
|----------|-----------|----------|
| `DefinitionCard` | `hookLine1`, `hookLine2`, `codeLines[]`, `rule1`, `rule2` | Decorator/concept introductions |
| `BeforeAfter` | `leftItems[]`, `rightItems[]`, `dividerLabel`, `bottomBanner` | Contrast and migration stories |
| `CodeReveal` | `lines[]` (with `typingDelay`), `finalLabel`, `context` | Walking through a code snippet |
| `SystemsExplainer` | `items[]` (label + description), `statNumber`, `statLabel` | Architecture overviews |
| `StepByStep` | `steps[]` (title + sublabel), `outcomeText` | Request lifecycle, boot sequence |
| `StatCard` | `contextLabel`, `number`, `unit`, `explanation` | Performance facts, benchmark results |

All templates share the same animation rhythm (fade timings, typewriter speeds, line stagger) and accept `accentColor`, `codeAccentColor`, `channelHandle`, and `durationInFrames` overrides.

## Commands

```bash
npm i                         # install dependencies
npm run dev                   # open Remotion Studio (preview)
npx remotion render <id>      # render a single composition
npx remotion still <id> --frame=30 --scale=0.3   # spot-check a frame
```

## Brand

| Token | Value |
|-------|-------|
| Background | `#0a0a0f` |
| Accent | `#e879f9` |
| Code accent | `#38bdf8` |
| Canvas | 1080 × 1920 px · 30 fps |
| Prose font | Inter |
| Code font | JetBrains Mono |
