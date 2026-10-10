import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import brand from "../../data/wetel-brand.json";
import shorts from "../../data/wetel-shorts.json";
import {
  CardsScene,
  CtaScene,
  ExplainerProps,
  FlowScene,
  HookScene,
  Scene,
  ShortDef,
  TableScene,
  Tone,
} from "./types";

export const SCENE_PAD_SECONDS = 0.6;

const toneColor = (tone: Tone): string =>
  tone === "accent" ? brand.accent
  : tone === "good" ? brand.good
  : tone === "bad" ? brand.bad
  : tone === "warn" ? brand.warn
  : brand.textSecondary;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Shorts UI covers the bottom ~380px and the right edge; keep everything inside this box.
const SAFE = { left: 72, right: 120, top: 260, captionTop: 1290, bottomLimit: 1540 };

const fadeUp = (frame: number, start: number, dur = 14) => ({
  opacity: interpolate(frame, [start, start + dur], [0, 1], clamp),
  transform: `translateY(${interpolate(frame, [start, start + dur], [28, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  })}px)`,
});

const Eyebrow: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        ...fadeUp(frame, 0),
        fontFamily: brand.fontProse,
        fontSize: 34,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: brand.accent,
      }}
    >
      {text}
    </div>
  );
};

const Title: React.FC<{ text: string; size?: number }> = ({ text, size = 76 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        ...fadeUp(frame, 6),
        fontFamily: brand.fontProse,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.1,
        color: brand.textPrimary,
        marginTop: 20,
      }}
    >
      {text}
    </div>
  );
};

/** Frame at which item i of n appears, spread across the first 75% of the scene. */
const revealFrame = (i: number, n: number, sceneFrames: number) =>
  Math.round(30 + (i / Math.max(n, 1)) * sceneFrames * 0.6);

const Panel: React.FC<{ tone: Tone; style?: React.CSSProperties; children: React.ReactNode }> = ({
  tone,
  style,
  children,
}) => (
  <div
    style={{
      background: brand.panel,
      border: `2px solid ${brand.panelBorder}`,
      borderLeft: `10px solid ${toneColor(tone)}`,
      borderRadius: 20,
      padding: "26px 32px",
      ...style,
    }}
  >
    {children}
  </div>
);

const HookView: React.FC<{ scene: HookScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <Eyebrow text={scene.eyebrow} />
      <Title text={scene.title} size={92} />
      <div
        style={{
          ...fadeUp(frame, 24),
          marginTop: 36,
          fontFamily: brand.fontProse,
          fontSize: 44,
          lineHeight: 1.35,
          color: brand.textSecondary,
        }}
      >
        {scene.subtitle}
      </div>
    </>
  );
};

const CardsView: React.FC<{ scene: CardsScene; frames: number }> = ({ scene, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Eyebrow text={scene.eyebrow} />
      <Title text={scene.title} />
      <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 22 }}>
        {scene.items.map((item, i) => {
          const start = revealFrame(i, scene.items.length, frames);
          const s = spring({ frame: frame - start, fps, config: { damping: 18 } });
          return (
            <Panel
              key={item.label}
              tone={item.tone}
              style={{ opacity: s, transform: `translateX(${(1 - s) * 60}px)` }}
            >
              <div
                style={{
                  fontFamily: brand.fontProse,
                  fontSize: 44,
                  fontWeight: 700,
                  color: toneColor(item.tone === "muted" ? "accent" : item.tone),
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontFamily: brand.fontProse,
                  fontSize: 36,
                  lineHeight: 1.3,
                  color: brand.textPrimary,
                  marginTop: 6,
                }}
              >
                {item.text}
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
};

const TableView: React.FC<{ scene: TableScene; frames: number }> = ({ scene, frames }) => {
  const frame = useCurrentFrame();
  const colTemplate = `1.25fr ${scene.columns.map(() => "1fr").join(" ")}`;
  const cell: React.CSSProperties = {
    fontFamily: brand.fontProse,
    fontSize: 32,
    lineHeight: 1.2,
    padding: "14px 10px",
  };
  return (
    <>
      <Eyebrow text={scene.eyebrow} />
      <Title text={scene.title} size={64} />
      <div style={{ marginTop: 36, ...fadeUp(frame, 16) }}>
        <div style={{ display: "grid", gridTemplateColumns: colTemplate }}>
          <div />
          {scene.columns.map((c, ci) => (
            <div
              key={c}
              style={{
                ...cell,
                fontWeight: 800,
                color: ci === scene.columns.length - 1 ? brand.accent : brand.textSecondary,
                borderBottom: `3px solid ${ci === scene.columns.length - 1 ? brand.accent : brand.panelBorder}`,
              }}
            >
              {c}
            </div>
          ))}
          {scene.rows.map((row, ri) => {
            const start = revealFrame(ri, scene.rows.length, frames);
            const opacity = interpolate(frame, [start, start + 14], [0, 1], clamp);
            return (
              <React.Fragment key={row.label}>
                <div style={{ ...cell, opacity, fontWeight: 700, color: brand.textPrimary, borderBottom: `1px solid ${brand.panelBorder}` }}>
                  {row.label}
                </div>
                {row.values.map((v, vi) => (
                  <div
                    key={vi}
                    style={{
                      ...cell,
                      opacity,
                      color: vi === row.values.length - 1 ? brand.good : brand.textSecondary,
                      fontWeight: vi === row.values.length - 1 ? 700 : 400,
                      borderBottom: `1px solid ${brand.panelBorder}`,
                    }}
                  >
                    {v}
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
};

const FlowView: React.FC<{ scene: FlowScene; frames: number }> = ({ scene, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodeS = spring({ frame: frame - 14, fps, config: { damping: 16 } });
  return (
    <>
      <Eyebrow text={scene.eyebrow} />
      <Title text={scene.title} size={64} />
      <div style={{ marginTop: 36, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            transform: `scale(${nodeS})`,
            background: brand.panel,
            border: `3px solid ${brand.accent}`,
            borderRadius: 20,
            padding: "18px 60px",
            fontFamily: brand.fontProse,
            fontSize: 44,
            fontWeight: 800,
            color: brand.accent,
          }}
        >
          {scene.node}
        </div>
        <div style={{ width: 4, height: 36, background: brand.panelBorder }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {scene.branches.map((b, i) => {
          const start = revealFrame(i, scene.branches.length, frames);
          const s = spring({ frame: frame - start, fps, config: { damping: 18 } });
          return (
            <Panel key={b.label} tone={b.tone} style={{ opacity: s, transform: `translateY(${(1 - s) * 40}px)`, padding: "18px 28px" }}>
              <span style={{ fontFamily: brand.fontProse, fontSize: 40, fontWeight: 800, color: toneColor(b.tone) }}>
                {b.label}
              </span>
              <span style={{ fontFamily: brand.fontProse, fontSize: 32, color: brand.textPrimary }}> → {b.text}</span>
            </Panel>
          );
        })}
      </div>
    </>
  );
};

const CtaView: React.FC<{ scene: CtaScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <Eyebrow text={scene.eyebrow} />
      <Title text={scene.title} size={84} />
      <div
        style={{
          ...fadeUp(frame, 30),
          marginTop: 48,
          display: "inline-block",
          padding: "20px 44px",
          borderRadius: 999,
          background: brand.accent,
          fontFamily: brand.fontProse,
          fontSize: 52,
          fontWeight: 800,
          color: brand.background,
        }}
      >
        {scene.subtitle}
      </div>
    </>
  );
};

/** Splits narration into sentence captions, each shown for time proportional to its length. */
const Captions: React.FC<{ text: string; frames: number }> = ({ text, frames }) => {
  const frame = useCurrentFrame();
  const sentences = text.match(/[^.?!]+[.?!]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  const total = sentences.reduce((a, s) => a + s.length, 0);
  const speechFrames = frames - Math.round(SCENE_PAD_SECONDS * 30);
  let cursor = 0;
  const active = sentences.find((s) => {
    const end = cursor + (s.length / total) * speechFrames;
    const hit = frame >= cursor && frame < end;
    cursor = end;
    return hit;
  }) ?? sentences[sentences.length - 1];
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        right: SAFE.right,
        top: SAFE.captionTop,
        maxHeight: SAFE.bottomLimit - SAFE.captionTop,
        fontFamily: brand.fontProse,
        fontSize: 42,
        fontWeight: 600,
        lineHeight: 1.3,
        color: brand.textPrimary,
        textShadow: "0 2px 12px rgba(0,0,0,0.8)",
      }}
    >
      {active}
    </div>
  );
};

const SceneView: React.FC<{ scene: Scene; frames: number }> = ({ scene, frames }) => {
  switch (scene.kind) {
    case "hook":
      return <HookView scene={scene} />;
    case "cards":
      return <CardsView scene={scene} frames={frames} />;
    case "table":
      return <TableView scene={scene} frames={frames} />;
    case "flow":
      return <FlowView scene={scene} frames={frames} />;
    case "cta":
      return <CtaView scene={scene} />;
  }
};

export const sceneFrames = (seconds: number, fps: number) =>
  Math.round((seconds + SCENE_PAD_SECONDS) * fps);

export const ExplainerShort: React.FC<ExplainerProps> = ({ shortId, sceneSeconds }) => {
  const { fps } = useVideoConfig();
  const short = (shorts as unknown as ShortDef[]).find((s) => s.id === shortId);
  if (!short) throw new Error(`Unknown short id: ${shortId}`);

  let from = 0;
  return (
    <AbsoluteFill style={{ background: brand.background }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 80% 10%, ${brand.accent}22 0%, transparent 55%)`,
        }}
      />
      {short.scenes.map((scene, i) => {
        const frames = sceneFrames(sceneSeconds[i], fps);
        const start = from;
        from += frames;
        return (
          <Sequence key={i} from={start} durationInFrames={frames}>
            <Audio src={staticFile(`audio/${short.id}/${i}.mp3`)} />
            <AbsoluteFill style={{ padding: `${SAFE.top}px ${SAFE.right}px 0 ${SAFE.left}px` }}>
              <SceneView scene={scene} frames={frames} />
            </AbsoluteFill>
            <Captions text={scene.narration} frames={frames} />
          </Sequence>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          top: 50,
          fontFamily: brand.fontProse,
          fontSize: 30,
          fontWeight: 800,
          color: brand.textSecondary,
          letterSpacing: "0.08em",
        }}
      >
        {brand.channelHandle} · {brand.site}
      </div>
    </AbsoluteFill>
  );
};
