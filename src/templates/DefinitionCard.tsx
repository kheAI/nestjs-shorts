import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { AnimatedLine, ChannelHandle, TypewriterText } from "../components";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CodeLineData {
  key: string;    // property name — rendered in codeAccentColor
  value: string;  // array or value — rendered in muted
  label: string;  // human-readable annotation — rendered in accentColor
}

export interface DefinitionCardProps {
  hookLine1: string;         // first hook sentence (white)
  hookLine2: string;         // second hook sentence (accent)
  codeTitle: string;         // decorator/class name, e.g. "@Module"
  codeLines: CodeLineData[];
  rule1: string;             // first golden rule line (white)
  rule2: string;             // second golden rule line (accent)
  channelHandle?: string;    // defaults to "@khe_ai"
  accentColor?: string;      // defaults to "#e879f9"
  codeAccentColor?: string;  // defaults to "#38bdf8"
  durationInFrames?: number; // defaults to 1200
}

// ─── Static brand tokens ──────────────────────────────────────────────────────

const BG             = "#0a0a0f";
const TEXT_PRIMARY   = "#f8fafc";
const TEXT_SECONDARY = "#94a3b8";
const CARD_BG        = "#13131a";
const FONT_PROSE     = "Inter, system-ui, sans-serif";
const FONT_CODE      = "JetBrains Mono, monospace";

// ─── Prop defaults ────────────────────────────────────────────────────────────

const DEFAULT_ACCENT      = "#e879f9";
const DEFAULT_CODE_ACCENT = "#38bdf8";
const DEFAULT_HANDLE      = "@khe_ai";
const DEFAULT_DURATION    = 1200;

// ─── Scene boundaries ─────────────────────────────────────────────────────────
// Scene 1 (Hook):        frames 0   – 269  (270 frames · 9 s)
// Scene 2 (Code):        frames 270 – 959  (690 frames · 23 s)
// Scene 3 (Golden Rule): frames 960 – end  (240 frames at default duration)

const CODE_START = 270;
const RULE_START = 960;

// ─── Code block layout (mirrors Ep01Module Scene 3) ──────────────────────────

const CODE_BLOCK_LEFT  = 160;
const CODE_BLOCK_WIDTH = 760;
const CODE_BLOCK_TOP   = 280;

// ─── Scene 1: Hook ────────────────────────────────────────────────────────────

interface HookSceneProps {
  hookLine1: string;
  hookLine2: string;
  accent: string;
}

const HookScene: React.FC<HookSceneProps> = ({ hookLine1, hookLine2, accent }) => {
  const frame = useCurrentFrame();

  // line2 starts 8 frames after line1 finishes typing
  const line2Start = 15 + Math.ceil((hookLine1.length / 9) * 30) + 8;

  // Matches ep01 badge fade: [0, 20] → [0, 1]
  const blockOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 580,
          left: 60,
          right: 60,
          opacity: blockOpacity,
        }}
      >
        {/* hookLine1: white */}
        <div
          style={{
            fontFamily: FONT_PROSE,
            fontSize: 48,
            lineHeight: 1.45,
            color: TEXT_PRIMARY,
            fontWeight: 700,
          }}
        >
          <TypewriterText text={hookLine1} startFrame={15} charsPerSecond={9} />
        </div>

        {/* hookLine2: accent */}
        <div
          style={{
            fontFamily: FONT_PROSE,
            fontSize: 48,
            lineHeight: 1.45,
            color: accent,
            fontWeight: 700,
            marginTop: 20,
          }}
        >
          <TypewriterText text={hookLine2} startFrame={line2Start} charsPerSecond={9} />
        </div>
      </div>

      {/* Matches ep01: delay=220, thickness=3, top=870 */}
      <div style={{ position: "absolute", top: 870 }}>
        <AnimatedLine color={accent} delay={220} thickness={3} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Code reveal ─────────────────────────────────────────────────────

interface CodeSceneProps {
  codeTitle: string;
  codeLines: CodeLineData[];
  accent: string;
  codeAccent: string;
}

const CodeScene: React.FC<CodeSceneProps> = ({
  codeTitle,
  codeLines,
  accent,
  codeAccent,
}) => {
  const frame = useCurrentFrame();

  // Matches ep01 Scene3: label fade [0,15], block fade+slide [20,40]
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

  // One new line every 8 frames, first line at frame 40 — identical to ep01
  const totalLines = codeLines.length + 2; // opening + body + closing
  const visibleLines = Math.max(
    0,
    Math.min(totalLines, Math.floor((Math.max(0, frame - 32)) / 8))
  );

  const showOpening = visibleLines >= 1;
  const visibleBodyCount = Math.max(0, visibleLines - 1);
  const showClosing = visibleLines >= totalLines;

  // Labels fade in at frame 160 — identical to ep01 callout timing
  const calloutOpacity = interpolate(frame, [160, 175], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* "In code, that looks like:" — same position as ep01 */}
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

      {/* Code card — same position/size as ep01 CODE_BLOCK_* constants */}
      <div
        style={{
          position: "absolute",
          top: CODE_BLOCK_TOP,
          left: CODE_BLOCK_LEFT,
          opacity: blockOpacity,
          transform: `translateY(${blockTranslateY}px)`,
        }}
      >
        <div
          style={{
            width: CODE_BLOCK_WIDTH,
            backgroundColor: CARD_BG,
            borderRadius: 16,
            padding: "40px 48px",
            boxSizing: "border-box",
            fontFamily: FONT_CODE,
            fontSize: 28,
            lineHeight: 1.6,
          }}
        >
          {/* Opening line: e.g. "@Module({" */}
          {showOpening && (
            <div style={{ color: accent }}>{`${codeTitle}({`}</div>
          )}

          {/* Body lines — each as a flex row with inline label */}
          {codeLines.slice(0, visibleBodyCount).map((line) => (
            <div
              key={line.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                <span style={{ color: codeAccent }}>{"  " + line.key}</span>
                <span style={{ color: TEXT_SECONDARY }}>{": " + line.value + ","}</span>
              </span>
              <span
                style={{
                  color: accent,
                  fontFamily: FONT_PROSE,
                  fontSize: 20,
                  fontWeight: 600,
                  opacity: calloutOpacity,
                  paddingLeft: 16,
                  flexShrink: 0,
                }}
              >
                {"← " + line.label}
              </span>
            </div>
          ))}

          {/* Closing line: "})" */}
          {showClosing && (
            <div style={{ color: accent }}>{"})"}</div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Golden Rule ─────────────────────────────────────────────────────

interface GoldenRuleSceneProps {
  rule1: string;
  rule2: string;
  accent: string;
}

const GoldenRuleScene: React.FC<GoldenRuleSceneProps> = ({ rule1, rule2, accent }) => {
  const frame = useCurrentFrame();

  // rule2 starts 8 frames after rule1 finishes typing
  const rule2Start = 45 + Math.ceil((rule1.length / 11) * 30) + 8;

  // All timings identical to ep01 Scene4Rule
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
      {/* Accent flash — same [0,1,3] → [0,0.08,0] as ep01 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: accent,
          opacity: flashOpacity,
        }}
      />

      {/* "GOLDEN RULE" badge — same top=780, scale/opacity timing as ep01 */}
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
            border: `2px solid ${accent}`,
            borderRadius: 12,
            padding: "10px 32px",
            fontFamily: FONT_PROSE,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: accent,
            textTransform: "uppercase",
          }}
        >
          Golden Rule
        </span>
      </div>

      {/* Accent line — delay=25, thickness=2, top=870 matches ep01 */}
      <div style={{ position: "absolute", top: 870 }}>
        <AnimatedLine color={accent} delay={25} thickness={2} />
      </div>

      {/* Rule text block */}
      <div
        style={{
          position: "absolute",
          top: 920,
          left: 60,
          right: 60,
          fontFamily: FONT_PROSE,
          fontSize: 48,
          lineHeight: 1.45,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {/* rule1: white */}
        <div style={{ color: TEXT_PRIMARY }}>
          <TypewriterText text={rule1} startFrame={45} charsPerSecond={11} />
        </div>

        {/* rule2: accent, starts after rule1 finishes */}
        <div style={{ color: accent, marginTop: 20 }}>
          <TypewriterText text={rule2} startFrame={rule2Start} charsPerSecond={11} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Named export ─────────────────────────────────────────────────────────────

export const DefinitionCard: React.FC<DefinitionCardProps> = ({
  hookLine1,
  hookLine2,
  codeTitle,
  codeLines,
  rule1,
  rule2,
  channelHandle = DEFAULT_HANDLE,
  accentColor   = DEFAULT_ACCENT,
  codeAccentColor = DEFAULT_CODE_ACCENT,
  durationInFrames = DEFAULT_DURATION,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <ChannelHandle handle={channelHandle} />

      {/* Scene 1 — Hook (frames 0–269) */}
      <Sequence from={0} durationInFrames={CODE_START}>
        <HookScene hookLine1={hookLine1} hookLine2={hookLine2} accent={accentColor} />
      </Sequence>

      {/* Scene 2 — Code (frames 270–959) */}
      <Sequence from={CODE_START} durationInFrames={RULE_START - CODE_START}>
        <CodeScene
          codeTitle={codeTitle}
          codeLines={codeLines}
          accent={accentColor}
          codeAccent={codeAccentColor}
        />
      </Sequence>

      {/* Scene 3 — Golden Rule (frames 960–end) */}
      <Sequence from={RULE_START} durationInFrames={durationInFrames - RULE_START}>
        <GoldenRuleScene rule1={rule1} rule2={rule2} accent={accentColor} />
      </Sequence>
    </AbsoluteFill>
  );
};
