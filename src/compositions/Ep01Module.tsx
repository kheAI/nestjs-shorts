import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import {
  AnimatedLine,
  ChannelHandle,
  CodeBlock,
  TypewriterText,
} from "../components";

const BG = "#0a0a0f";
const ACCENT = "#e879f9";
const CODE_ACCENT = "#38bdf8";
const TEXT_PRIMARY = "#f8fafc";
const TEXT_SECONDARY = "#94a3b8";
const FONT_PROSE = "Inter, system-ui, sans-serif";

// ─── Scene 1: Hook (frames 0–269 · 9 s) ─────────────────────────────────────

const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();

  const badgeOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 60,
          opacity: badgeOpacity,
          fontFamily: FONT_PROSE,
          fontSize: 22,
          color: TEXT_SECONDARY,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        NestJS Bite-Sized · ep01
      </div>

      <div
        style={{
          position: "absolute",
          top: 680,
          left: 60,
          right: 60,
          fontFamily: FONT_PROSE,
          fontSize: 48,
          lineHeight: 1.45,
          color: TEXT_PRIMARY,
          fontWeight: 700,
        }}
      >
        <TypewriterText
          text="Every NestJS project has 30 files and zero spaghetti — here's why."
          startFrame={15}
          charsPerSecond={9}
        />
      </div>

      <div style={{ position: "absolute", top: 870 }}>
        <AnimatedLine delay={220} thickness={3} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Department Analogy (frames 270–719 · 15 s) ─────────────────────

const ROWS = [
  { label: "OWNS", color: ACCENT, text: "its own staff & tools", startFrame: 60 },
  { label: "REQUESTS", color: CODE_ACCENT, text: "from other departments", startFrame: 120 },
  { label: "SHARES", color: "#4ade80", text: "what it chooses to expose", startFrame: 180 },
];

const Scene2Analogy: React.FC = () => {
  const frame = useCurrentFrame();

  const headlineOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineScale = interpolate(frame, [0, 20], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: headlineOpacity,
          transform: `scale(${headlineScale})`,
          fontFamily: FONT_PROSE,
          fontSize: 72,
          fontWeight: 800,
          color: TEXT_PRIMARY,
        }}
      >
        The Department
      </div>

      <div style={{ position: "absolute", top: 488 }}>
        <AnimatedLine delay={25} thickness={2} />
      </div>

      {ROWS.map((row, i) => {
        const opacity = interpolate(
          frame,
          [row.startFrame, row.startFrame + 15],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const translateX = interpolate(
          frame,
          [row.startFrame, row.startFrame + 15],
          [60, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={row.label}
            style={{
              position: "absolute",
              top: 560 + i * 160,
              left: 60,
              right: 60,
              display: "flex",
              alignItems: "center",
              gap: 28,
              opacity,
              transform: `translateX(${translateX}px)`,
            }}
          >
            <span
              style={{
                backgroundColor: row.color,
                color: BG,
                borderRadius: 10,
                padding: "8px 18px",
                fontFamily: FONT_PROSE,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "0.08em",
                minWidth: 140,
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontFamily: FONT_PROSE,
                fontSize: 36,
                color: TEXT_SECONDARY,
              }}
            >
              {row.text}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Scene 3: @Module Code Reveal (frames 720–1109 · 12.67 s) ─────────────────

const ALL_CODE_LINES = [
  { text: "@Module({", color: ACCENT },
  { text: "  imports:     [DatabaseModule],", color: TEXT_SECONDARY },
  { text: "  controllers: [CatsController],", color: TEXT_SECONDARY },
  { text: "  providers:   [CatsService],   ", color: TEXT_SECONDARY },
  { text: "  exports:     [CatsService],   ", color: TEXT_SECONDARY },
  { text: "})", color: ACCENT },
  { text: "export class CatsModule {}", color: TEXT_PRIMARY },
];

const CODE_BLOCK_TOP = 280;
const CODE_BLOCK_LEFT = 160;
const CODE_BLOCK_WIDTH = 760;
const CODE_PADDING_TOP = 40;
const LINE_HEIGHT_PX = 45; // 28px fontSize × 1.6 lineHeight

const CALLOUTS = [
  { label: "← borrow", color: CODE_ACCENT, lineIndex: 1 },
  { label: "← own", color: ACCENT, lineIndex: 2.5 },
  { label: "← lend", color: "#4ade80", lineIndex: 4 },
];

const Scene3Code: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blockOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blockTranslateY = interpolate(frame, [20, 40], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // One new line every 8 frames, first line at frame 40 → (frame-32)/8
  const visibleLines = Math.max(
    0,
    Math.min(ALL_CODE_LINES.length, Math.floor((Math.max(0, frame - 32)) / 8))
  );

  const calloutOpacity = interpolate(frame, [160, 175], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT_PROSE,
          fontSize: 28,
          color: TEXT_SECONDARY,
          opacity: labelOpacity,
        }}
      >
        In code, that looks like:
      </div>

      <div
        style={{
          position: "absolute",
          top: CODE_BLOCK_TOP,
          left: CODE_BLOCK_LEFT,
          opacity: blockOpacity,
          transform: `translateY(${blockTranslateY}px)`,
        }}
      >
        <CodeBlock
          lines={ALL_CODE_LINES.slice(0, visibleLines)}
          width={CODE_BLOCK_WIDTH}
        />
      </div>

      {CALLOUTS.map((callout) => {
        const lineY =
          CODE_BLOCK_TOP + CODE_PADDING_TOP + callout.lineIndex * LINE_HEIGHT_PX;
        return (
          <div
            key={callout.label}
            style={{
              position: "absolute",
              top: lineY,
              left: CODE_BLOCK_LEFT + CODE_BLOCK_WIDTH + 12,
              opacity: calloutOpacity,
              fontFamily: FONT_PROSE,
              fontSize: 20,
              fontWeight: 600,
              color: callout.color,
              whiteSpace: "nowrap",
            }}
          >
            {callout.label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Scene 4: Golden Rule (frames 1110–1350 · 8 s) ────────────────────────────

const Scene4Rule: React.FC = () => {
  const frame = useCurrentFrame();

  const flashOpacity = interpolate(frame, [0, 1, 3], [0, 0.08, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeOpacity = interpolate(frame, [3, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeScale = interpolate(frame, [3, 21], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: ACCENT,
          opacity: flashOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 780,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: badgeOpacity,
          transform: `scale(${badgeScale})`,
        }}
      >
        <span
          style={{
            border: `2px solid ${ACCENT}`,
            borderRadius: 12,
            padding: "10px 32px",
            fontFamily: FONT_PROSE,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: ACCENT,
            textTransform: "uppercase",
          }}
        >
          Golden Rule
        </span>
      </div>

      <div style={{ position: "absolute", top: 870 }}>
        <AnimatedLine delay={25} thickness={2} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 920,
          left: 60,
          right: 60,
          fontFamily: FONT_PROSE,
          fontSize: 48,
          lineHeight: 1.45,
          color: TEXT_PRIMARY,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        <TypewriterText
          text="One feature, one module — declare what you own, borrow, and lend."
          startFrame={45}
          charsPerSecond={11}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Root Composition (1350 frames · 45 s · 1080×1920) ────────────────────────

export const Ep01Module: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <ChannelHandle />

      <Sequence from={0} durationInFrames={270}>
        <Scene1Hook />
      </Sequence>

      <Sequence from={270} durationInFrames={450}>
        <Scene2Analogy />
      </Sequence>

      <Sequence from={720} durationInFrames={390}>
        <Scene3Code />
      </Sequence>

      <Sequence from={1110} durationInFrames={240}>
        <Scene4Rule />
      </Sequence>
    </AbsoluteFill>
  );
};
