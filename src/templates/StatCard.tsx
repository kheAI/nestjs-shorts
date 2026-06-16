import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { AnimatedLine, ChannelHandle, CountUpNumber, TypewriterText } from "../components";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface StatCardProps {
  statPrefix?: string;      // e.g. "~" or "$" — shown at large size before the number
  statFrom?: number;        // count-up start value, default 0
  statTo: number;           // count-up end value (the "wow" number)
  statSuffix?: string;      // e.g. "%" or "ms" or "x" — shown at large size after
  statLabel: string;        // context for the number, e.g. "of NestJS apps use DI wrong"
  contextLine1: string;     // explanation shown in scene 2
  contextLine2?: string;    // optional second line (shown in accent color)
  rule1: string;
  rule2: string;
  channelHandle?: string;
  accentColor?: string;
  durationInFrames?: number;
}

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const BG           = "#0a0a0f";
const TEXT_PRIMARY = "#f8fafc";
const TEXT_SEC     = "#94a3b8";
const FONT_PROSE   = "Inter, system-ui, sans-serif";

const DEFAULT_ACCENT   = "#e879f9";
const DEFAULT_HANDLE   = "@khe_ai";
const DEFAULT_DURATION = 1200;

// ─── Scene boundaries ─────────────────────────────────────────────────────────
// Scene 1 (Big Stat):  0   – 449  (15 s) — number counts up
// Scene 2 (Context):   450 – 899  (15 s) — explanation
// Scene 3 (Rule):      900 – end

const CONTEXT_START = 450;
const RULE_START    = 900;

// ─── Scene 1: Big Stat ────────────────────────────────────────────────────────

const StatScene: React.FC<{
  prefix?: string;
  from: number;
  to: number;
  suffix?: string;
  label: string;
  accent: string;
}> = ({ prefix, from, to, suffix, label, accent }) => {
  const frame = useCurrentFrame();

  // Number counts up over 240 frames (8 s)
  const COUNT_DURATION = 240;

  const numberOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const numberScale = interpolate(frame, [0, 25], [0.6, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const labelOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const labelTy = interpolate(frame, [30, 50], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      {/* Ambient glow behind the number */}
      <div style={{
        position: "absolute",
        top: 580, left: 0, right: 0,
        height: 400,
        background: `radial-gradient(ellipse 600px 300px at center, ${accent}18 0%, transparent 70%)`,
        opacity: numberOpacity,
      }} />

      {/* Big number row */}
      <div style={{
        position: "absolute",
        top: 620, left: 0, right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "baseline",
        gap: 4,
        opacity: numberOpacity,
        transform: `scale(${numberScale})`,
      }}>
        {prefix && (
          <span style={{
            fontFamily: FONT_PROSE, fontSize: 80, fontWeight: 900, color: accent,
            lineHeight: 1,
          }}>
            {prefix}
          </span>
        )}
        <span style={{ fontFamily: FONT_PROSE, fontSize: 200, fontWeight: 900, lineHeight: 1 }}>
          <CountUpNumber from={from} to={to} durationInFrames={COUNT_DURATION} color={accent} />
        </span>
        {suffix && (
          <span style={{
            fontFamily: FONT_PROSE, fontSize: 80, fontWeight: 900, color: accent,
            lineHeight: 1,
          }}>
            {suffix}
          </span>
        )}
      </div>

      {/* Stat label */}
      <div style={{
        position: "absolute",
        top: 890, left: 60, right: 60,
        textAlign: "center",
        fontFamily: FONT_PROSE, fontSize: 40, fontWeight: 600,
        color: TEXT_SEC, lineHeight: 1.4,
        opacity: labelOpacity,
        transform: `translateY(${labelTy}px)`,
      }}>
        {label}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Context ─────────────────────────────────────────────────────────

const ContextScene: React.FC<{
  line1: string;
  line2?: string;
  accent: string;
}> = ({ line1, line2, accent }) => {
  const frame = useCurrentFrame();

  const line2Start = line2
    ? 15 + Math.ceil((line1.length / 9) * 30) + 8
    : 0;

  const blockOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const blockTy = interpolate(frame, [0, 25], [30, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute",
        top: 580, left: 60, right: 60,
        opacity: blockOpacity,
        transform: `translateY(${blockTy}px)`,
      }}>
        <div style={{
          fontFamily: FONT_PROSE, fontSize: 48, lineHeight: 1.45,
          color: TEXT_PRIMARY, fontWeight: 700,
        }}>
          <TypewriterText text={line1} startFrame={15} charsPerSecond={9} />
        </div>
        {line2 && (
          <div style={{
            fontFamily: FONT_PROSE, fontSize: 48, lineHeight: 1.45,
            color: accent, fontWeight: 700, marginTop: 20,
          }}>
            <TypewriterText text={line2} startFrame={line2Start} charsPerSecond={9} />
          </div>
        )}
      </div>
      <div style={{ position: "absolute", top: 870 }}>
        <AnimatedLine color={accent} delay={220} thickness={3} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Golden Rule ─────────────────────────────────────────────────────

const RuleScene: React.FC<{ rule1: string; rule2: string; accent: string }> = ({
  rule1, rule2, accent,
}) => {
  const frame = useCurrentFrame();
  const rule2Start = 45 + Math.ceil((rule1.length / 11) * 30) + 8;
  const flashOpacity = interpolate(frame, [0, 1, 3], [0, 0.08, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const badgeOpacity = interpolate(frame, [3, 15], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const badgeScale = interpolate(frame, [3, 21], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, backgroundColor: accent, opacity: flashOpacity }} />
      <div style={{
        position: "absolute", top: 780, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        opacity: badgeOpacity, transform: `scale(${badgeScale})`,
      }}>
        <span style={{
          border: `2px solid ${accent}`, borderRadius: 12,
          padding: "10px 32px", fontFamily: FONT_PROSE,
          fontSize: 22, fontWeight: 700, letterSpacing: "0.12em",
          color: accent, textTransform: "uppercase" as const,
        }}>
          Golden Rule
        </span>
      </div>
      <div style={{ position: "absolute", top: 870 }}>
        <AnimatedLine color={accent} delay={25} thickness={2} />
      </div>
      <div style={{
        position: "absolute", top: 920, left: 60, right: 60,
        fontFamily: FONT_PROSE, fontSize: 48, lineHeight: 1.45,
        fontWeight: 600, textAlign: "center",
      }}>
        <div style={{ color: TEXT_PRIMARY }}>
          <TypewriterText text={rule1} startFrame={45} charsPerSecond={11} />
        </div>
        <div style={{ color: accent, marginTop: 20 }}>
          <TypewriterText text={rule2} startFrame={rule2Start} charsPerSecond={11} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Named export ─────────────────────────────────────────────────────────────

export const StatCard: React.FC<StatCardProps> = ({
  statPrefix, statFrom = 0, statTo,
  statSuffix, statLabel,
  contextLine1, contextLine2,
  rule1, rule2,
  channelHandle    = DEFAULT_HANDLE,
  accentColor      = DEFAULT_ACCENT,
  durationInFrames = DEFAULT_DURATION,
}) => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <ChannelHandle handle={channelHandle} />
    <Sequence from={0} durationInFrames={CONTEXT_START}>
      <StatScene
        prefix={statPrefix} from={statFrom} to={statTo}
        suffix={statSuffix} label={statLabel} accent={accentColor}
      />
    </Sequence>
    <Sequence from={CONTEXT_START} durationInFrames={RULE_START - CONTEXT_START}>
      <ContextScene line1={contextLine1} line2={contextLine2} accent={accentColor} />
    </Sequence>
    <Sequence from={RULE_START} durationInFrames={durationInFrames - RULE_START}>
      <RuleScene rule1={rule1} rule2={rule2} accent={accentColor} />
    </Sequence>
  </AbsoluteFill>
);
