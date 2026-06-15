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
  compositions/       # one file per rendered episode
    Ep01Module.tsx
out/
  rendered/           # raw rendered MP4s
  ready-to-upload/    # final cuts
```

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
