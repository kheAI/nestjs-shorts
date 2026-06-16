import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { AnimatedLine, ChannelHandle, TypewriterText } from "../components";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface BeforeAfterProps {
  hookLine1: string;
  hookLine2: string;
  beforeLabel?: string;     // default "BEFORE"
  afterLabel?: string;      // default "AFTER"
  beforeLines: string[];    // raw code lines for the before panel
  afterLines: string[];     // raw code lines for the after panel
  beforeNote?: string;      // e.g. "❌ tightly coupled"
  afterNote?: string;       // e.g. "✓ injectable & testable"
  rule1: string;
  rule2: string;
  channelHandle?: string;
  accentColor?: string;
  durationInFrames?: number;
}

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const BG           = "#0a0a0f";
const TEXT_PRIMARY = "#f8fafc";
const CARD_BG      = "#13131a";
const BEFORE_RED   = "#ef4444";
const FONT_PROSE   = "Inter, system-ui, sans-serif";
const FONT_CODE    = "JetBrains Mono, monospace";

const DEFAULT_ACCENT   = "#e879f9";
const DEFAULT_HANDLE   = "@khe_ai";
const DEFAULT_DURATION = 1200;

// ─── Scene boundaries ─────────────────────────────────────────────────────────
// Scene 1 (Hook):    0   – 269
// Scene 2 (Compare): 270 – 959
// Scene 3 (Rule):    960 – end

const CONTENT_START = 270;
const RULE_START    = 960;

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

// ─── Code panel ───────────────────────────────────────────────────────────────

interface PanelProps {
  label: string;
  lines: string[];
  note?: string;
  borderColor: string;
  entryAt: number;    // local frame — card slides in
  revealAt: number;   // local frame — lines start appearing (one per 6 frames)
}

const CodePanel: React.FC<PanelProps> = ({
  label, lines, note, borderColor, entryAt, revealAt,
}) => {
  const frame = useCurrentFrame();

  const cardOpacity = interpolate(frame - entryAt, [0, 15], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const cardSlide = interpolate(frame - entryAt, [0, 20], [48, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const visibleLines = Math.max(
    0, Math.min(lines.length, Math.floor(Math.max(0, frame - revealAt) / 6))
  );

  const linesDoneAt = revealAt + lines.length * 6;
  const noteOpacity = interpolate(frame - (linesDoneAt + 20), [0, 12], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity: cardOpacity, transform: `translateY(${cardSlide}px)` }}>
      <div style={{
        fontFamily: FONT_PROSE, fontSize: 20, fontWeight: 800,
        color: borderColor, letterSpacing: "0.1em",
        textTransform: "uppercase", marginBottom: 10,
      }}>
        {label}
      </div>

      <div style={{
        backgroundColor: CARD_BG, borderRadius: 16,
        borderLeft: `4px solid ${borderColor}`,
        padding: "28px 36px",
        fontFamily: FONT_CODE, fontSize: 26, lineHeight: 1.6,
        minHeight: 80,
      }}>
        {lines.slice(0, visibleLines).map((line, i) => (
          <div key={i} style={{ color: TEXT_PRIMARY, whiteSpace: "pre" }}>{line}</div>
        ))}
        {visibleLines === 0 && (
          <div style={{ color: "transparent" }}>{"·"}</div>
        )}
      </div>

      {note && (
        <div style={{
          marginTop: 10, fontFamily: FONT_PROSE, fontSize: 22,
          color: borderColor, fontWeight: 600, opacity: noteOpacity,
        }}>
          {note}
        </div>
      )}
    </div>
  );
};

// ─── Scene 2: Compare ─────────────────────────────────────────────────────────

const CompareScene: React.FC<{
  beforeLabel: string; afterLabel: string;
  beforeLines: string[]; afterLines: string[];
  beforeNote?: string; afterNote?: string;
  accent: string;
}> = ({ beforeLabel, afterLabel, beforeLines, afterLines, beforeNote, afterNote, accent }) => (
  <AbsoluteFill>
    <div style={{
      position: "absolute", top: 180, left: 60, right: 60,
      display: "flex", flexDirection: "column", gap: 52,
    }}>
      <CodePanel
        label={beforeLabel} lines={beforeLines} note={beforeNote}
        borderColor={BEFORE_RED}
        entryAt={10} revealAt={25}
      />
      <CodePanel
        label={afterLabel} lines={afterLines} note={afterNote}
        borderColor={accent}
        entryAt={160} revealAt={175}
      />
    </div>
  </AbsoluteFill>
);

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

export const BeforeAfter: React.FC<BeforeAfterProps> = ({
  hookLine1, hookLine2,
  beforeLabel = "BEFORE", afterLabel = "AFTER",
  beforeLines, afterLines, beforeNote, afterNote,
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
      <CompareScene
        beforeLabel={beforeLabel} afterLabel={afterLabel}
        beforeLines={beforeLines} afterLines={afterLines}
        beforeNote={beforeNote} afterNote={afterNote}
        accent={accentColor}
      />
    </Sequence>
    <Sequence from={RULE_START} durationInFrames={durationInFrames - RULE_START}>
      <RuleScene rule1={rule1} rule2={rule2} accent={accentColor} />
    </Sequence>
  </AbsoluteFill>
);
