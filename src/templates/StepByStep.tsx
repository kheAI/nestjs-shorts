import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { AnimatedLine, ChannelHandle, TypewriterText } from "../components";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface StepData {
  title: string;
  description: string;
}

export interface StepByStepProps {
  hookLine1: string;
  hookLine2: string;
  steps: StepData[];        // 2–5 steps
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

const CONTENT_START = 270;
const RULE_START    = 960;
const STAGGER       = 90;   // frames between step reveals (3 s at 30 fps)

// ─── Scene 1: Hook ────────────────────────────────────────────────────────────

const HookScene: React.FC<{ line1: string; line2: string; accent: string }> = ({
  line1, line2, accent,
}) => {
  const frame = useCurrentFrame();
  const line2Start = 15 + Math.ceil((line1.length / 9) * 30) + 8;
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 580, left: 60, right: 60, opacity }}>
        <div style={{ fontFamily: FONT_PROSE, fontSize: 48, lineHeight: 1.45, color: TEXT_PRIMARY, fontWeight: 700 }}>
          <TypewriterText text={line1} startFrame={15} charsPerSecond={9} />
        </div>
        <div style={{ fontFamily: FONT_PROSE, fontSize: 48, lineHeight: 1.45, color: accent, fontWeight: 700, marginTop: 20 }}>
          <TypewriterText text={line2} startFrame={line2Start} charsPerSecond={9} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 870 }}>
        <AnimatedLine color={accent} delay={220} thickness={3} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Step item ────────────────────────────────────────────────────────────────

const StepItem: React.FC<{
  step: StepData;
  index: number;
  accent: string;
  appearAt: number;   // local frame to begin entry animation
}> = ({ step, index, accent, appearAt }) => {
  const frame = useCurrentFrame();
  const local = frame - appearAt;
  if (local < 0) return null;

  const opacity = interpolate(local, [0, 15], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const tx = interpolate(local, [0, 22], [-60, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 28, opacity, transform: `translateX(${tx}px)` }}>
      {/* Numbered circle */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        border: `3px solid ${accent}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        fontFamily: FONT_PROSE, fontSize: 30, fontWeight: 800, color: accent,
      }}>
        {index + 1}
      </div>

      {/* Text */}
      <div style={{ paddingTop: 6 }}>
        <div style={{ fontFamily: FONT_PROSE, fontSize: 36, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.25 }}>
          {step.title}
        </div>
        <div style={{ fontFamily: FONT_PROSE, fontSize: 26, color: TEXT_SEC, lineHeight: 1.45, marginTop: 10 }}>
          {step.description}
        </div>
      </div>
    </div>
  );
};

// ─── Scene 2: Steps ───────────────────────────────────────────────────────────

const StepsScene: React.FC<{ steps: StepData[]; accent: string }> = ({ steps, accent }) => {
  const frame = useCurrentFrame();
  const labelOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", top: 130, left: 0, right: 0,
        textAlign: "center", fontFamily: FONT_PROSE,
        fontSize: 28, color: TEXT_SEC, opacity: labelOpacity,
      }}>
        Here's how it works:
      </div>

      <div style={{
        position: "absolute", top: 240, left: 80, right: 80,
        display: "flex", flexDirection: "column", gap: 64,
      }}>
        {steps.map((step, i) => (
          <StepItem
            key={i}
            step={step}
            index={i}
            accent={accent}
            appearAt={30 + i * STAGGER}
          />
        ))}
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

export const StepByStep: React.FC<StepByStepProps> = ({
  hookLine1, hookLine2,
  steps,
  rule1, rule2,
  channelHandle    = DEFAULT_HANDLE,
  accentColor      = DEFAULT_ACCENT,
  durationInFrames = DEFAULT_DURATION,
}) => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <ChannelHandle handle={channelHandle} />
    <Sequence from={0} durationInFrames={CONTENT_START}>
      <HookScene line1={hookLine1} line2={hookLine2} accent={accentColor} />
    </Sequence>
    <Sequence from={CONTENT_START} durationInFrames={RULE_START - CONTENT_START}>
      <StepsScene steps={steps} accent={accentColor} />
    </Sequence>
    <Sequence from={RULE_START} durationInFrames={durationInFrames - RULE_START}>
      <RuleScene rule1={rule1} rule2={rule2} accent={accentColor} />
    </Sequence>
  </AbsoluteFill>
);
