import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { AnimatedLine, ChannelHandle, TypewriterText } from "../components";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CodeLine {
  code: string;           // the source line (use spaces for indentation, not tabs)
  annotation?: string;    // callout label, e.g. "injected here"
  color?: string;         // override token color for this line
}

export interface CodeRevealProps {
  hookLine1: string;
  hookLine2: string;
  filename?: string;      // shown as a tab header above the code block
  lines: CodeLine[];      // 3–10 lines work best
  insight1: string;       // "Key Insight" equivalent — white line
  insight2: string;       // accent line
  channelHandle?: string;
  accentColor?: string;
  codeAccentColor?: string;
  durationInFrames?: number;
}

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const BG           = "#0a0a0f";
const TEXT_PRIMARY = "#f8fafc";
const TEXT_SEC     = "#94a3b8";
const CARD_BG      = "#13131a";
const FONT_PROSE   = "Inter, system-ui, sans-serif";
const FONT_CODE    = "JetBrains Mono, monospace";

const DEFAULT_ACCENT      = "#e879f9";
const DEFAULT_CODE_ACCENT = "#38bdf8";
const DEFAULT_HANDLE      = "@khe_ai";
const DEFAULT_DURATION    = 1200;

// ─── Scene boundaries ─────────────────────────────────────────────────────────

const CONTENT_START = 270;
const RULE_START    = 960;

// Each line gets this many frames of "active" focus before cursor moves on
const PER_LINE = 90;   // 3 s at 30 fps

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

// ─── Scene 2: Code walkthrough ────────────────────────────────────────────────

const CodeScene: React.FC<{
  filename?: string;
  lines: CodeLine[];
  accent: string;
  codeAccent: string;
}> = ({ filename, lines, accent, codeAccent }) => {
  const frame = useCurrentFrame();

  // Code block fades in
  const blockOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Active line moves forward every PER_LINE frames; stays on last line once done
  const activeIdx = Math.min(lines.length - 1, Math.floor(frame / PER_LINE));
  // Frames elapsed since the active line became active
  const sinceActive = frame - activeIdx * PER_LINE;

  // Annotation fades in 15 frames after the line becomes active
  const annotationOpacity = interpolate(sinceActive - 15, [0, 12], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* Scene subtitle */}
      <div style={{
        position: "absolute", top: 140, left: 0, right: 0,
        textAlign: "center", fontFamily: FONT_PROSE,
        fontSize: 28, color: TEXT_SEC,
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        Let's walk through the code:
      </div>

      {/* Code card */}
      <div style={{
        position: "absolute",
        top: 220, left: 60, right: 60,
        opacity: blockOpacity,
      }}>
        {/* Filename tab */}
        {filename && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: CARD_BG,
            borderRadius: "12px 12px 0 0",
            padding: "10px 24px",
            fontFamily: FONT_CODE,
            fontSize: 22,
            color: TEXT_SEC,
            borderBottom: `2px solid ${accent}`,
          }}>
            {filename}
          </div>
        )}

        <div style={{
          backgroundColor: CARD_BG,
          borderRadius: filename ? "0 12px 12px 12px" : 16,
          padding: "28px 36px",
          fontFamily: FONT_CODE,
          fontSize: 26,
          lineHeight: 1.65,
        }}>
          {lines.map((line, i) => {
            const isActive = i === activeIdx;
            const isPast   = i < activeIdx;
            // Lines after the cursor haven't been reached yet — show dimmed
            const textColor = (isActive || isPast) ? (line.color ?? TEXT_PRIMARY) : TEXT_SEC;
            const thisAnnotationOpacity = isPast ? 1 : isActive ? annotationOpacity : 0;

            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 6,
                  // Highlight overlay for active line
                  backgroundColor: isActive ? `${accent}12` : "transparent",
                  // Left accent strip
                  borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
                  paddingLeft: 10,
                  marginLeft: -13,  // compensate so text stays aligned
                  paddingRight: 8,
                }}
              >
                {/* Code text */}
                <div style={{ flex: 1, color: textColor, whiteSpace: "pre" }}>
                  {line.code}
                </div>

                {/* Annotation badge */}
                {line.annotation && (
                  <div style={{
                    opacity: thisAnnotationOpacity,
                    color: accent,
                    fontFamily: FONT_PROSE,
                    fontSize: 20,
                    fontWeight: 600,
                    flexShrink: 0,
                    paddingLeft: 20,
                    whiteSpace: "nowrap",
                  }}>
                    {"← " + line.annotation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Key Insight ─────────────────────────────────────────────────────

const InsightScene: React.FC<{ insight1: string; insight2: string; accent: string }> = ({
  insight1, insight2, accent,
}) => {
  const frame = useCurrentFrame();
  const insight2Start = 45 + Math.ceil((insight1.length / 11) * 30) + 8;
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
          Key Insight
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
          <TypewriterText text={insight1} startFrame={45} charsPerSecond={11} />
        </div>
        <div style={{ color: accent, marginTop: 20 }}>
          <TypewriterText text={insight2} startFrame={insight2Start} charsPerSecond={11} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Named export ─────────────────────────────────────────────────────────────

export const CodeReveal: React.FC<CodeRevealProps> = ({
  hookLine1, hookLine2,
  filename,
  lines,
  insight1, insight2,
  channelHandle     = DEFAULT_HANDLE,
  accentColor       = DEFAULT_ACCENT,
  codeAccentColor   = DEFAULT_CODE_ACCENT,
  durationInFrames  = DEFAULT_DURATION,
}) => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <ChannelHandle handle={channelHandle} />
    <Sequence from={0} durationInFrames={CONTENT_START}>
      <HookScene line1={hookLine1} line2={hookLine2} accent={accentColor} />
    </Sequence>
    <Sequence from={CONTENT_START} durationInFrames={RULE_START - CONTENT_START}>
      <CodeScene
        filename={filename}
        lines={lines}
        accent={accentColor}
        codeAccent={codeAccentColor}
      />
    </Sequence>
    <Sequence from={RULE_START} durationInFrames={durationInFrames - RULE_START}>
      <InsightScene insight1={insight1} insight2={insight2} accent={accentColor} />
    </Sequence>
  </AbsoluteFill>
);
