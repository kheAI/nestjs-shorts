import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { AnimatedLine, ChannelHandle, TypewriterText } from "../components";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface FlowNode {
  label: string;        // e.g. "Guard"
  sublabel?: string;    // e.g. "canActivate()" — shown in code font below label
  highlight?: boolean;  // uses accent color for border instead of muted
}

export interface SystemsExplainerProps {
  hookLine1: string;
  hookLine2: string;
  flowTitle?: string;   // label above the diagram, e.g. "Request Lifecycle"
  nodes: FlowNode[];    // 2–6 nodes
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
const CARD_BG      = "#13131a";
const FONT_PROSE   = "Inter, system-ui, sans-serif";
const FONT_CODE    = "JetBrains Mono, monospace";

const DEFAULT_ACCENT   = "#e879f9";
const DEFAULT_HANDLE   = "@khe_ai";
const DEFAULT_DURATION = 1200;

// ─── Scene boundaries ─────────────────────────────────────────────────────────

const CONTENT_START = 270;
const RULE_START    = 960;

// Timing: one node every 2 s; arrow appears 20 frames after its node
const NODE_INTERVAL = 60;  // frames
const ARROW_DELAY   = 20;  // frames after node appears

// Node box dimensions
const NODE_W = 700;
const NODE_H = 96;    // box height (without sublabel)
const ARROW_TOTAL_H = 60; // line + arrowhead

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

// ─── Flow node + connector ────────────────────────────────────────────────────

const FlowStep: React.FC<{
  node: FlowNode;
  isLast: boolean;
  accent: string;
  appearAt: number;   // local frame
}> = ({ node, isLast, accent, appearAt }) => {
  const frame = useCurrentFrame();
  const local = frame - appearAt;

  const boxOpacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const boxTx = interpolate(local, [0, 18], [40, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const arrowOpacity = isLast ? 0 : interpolate(local - ARROW_DELAY, [0, 12], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const arrowScale = isLast ? 0 : interpolate(local - ARROW_DELAY, [0, 18], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const borderColor = local < 0 ? "transparent" : node.highlight ? accent : TEXT_SEC;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Node box */}
      <div style={{
        width: NODE_W,
        opacity: local < 0 ? 0 : boxOpacity,
        transform: `translateX(${local < 0 ? 0 : boxTx}px)`,
        backgroundColor: CARD_BG,
        borderRadius: 16,
        border: `2px solid ${borderColor}`,
        padding: "20px 36px",
        textAlign: "center",
        minHeight: NODE_H,
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{ fontFamily: FONT_PROSE, fontSize: 34, fontWeight: 700, color: TEXT_PRIMARY }}>
          {node.label}
        </div>
        {node.sublabel && (
          <div style={{ fontFamily: FONT_CODE, fontSize: 22, color: node.highlight ? accent : TEXT_SEC, marginTop: 4 }}>
            {node.sublabel}
          </div>
        )}
      </div>

      {/* Connector arrow */}
      {!isLast && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          opacity: arrowOpacity,
        }}>
          {/* Vertical line — grows downward */}
          <div style={{
            width: 2, height: ARROW_TOTAL_H - 16,
            backgroundColor: TEXT_SEC,
            transformOrigin: "top center",
            transform: `scaleY(${arrowScale})`,
          }} />
          {/* Arrowhead pointing down */}
          <div style={{
            width: 0, height: 0,
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            borderTop: `16px solid ${TEXT_SEC}`,
          }} />
        </div>
      )}
    </div>
  );
};

// ─── Scene 2: Flow diagram ────────────────────────────────────────────────────

const FlowScene: React.FC<{
  nodes: FlowNode[];
  flowTitle: string;
  accent: string;
}> = ({ nodes, flowTitle, accent }) => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Estimate total diagram height to center it between title and bottom
  const withSublabel = nodes.some((n) => n.sublabel);
  const nodeH = withSublabel ? NODE_H + 28 : NODE_H;
  const totalH = nodes.length * nodeH + (nodes.length - 1) * ARROW_TOTAL_H;
  const topStart = Math.max(220, Math.round((1920 - totalH) / 2 - 60));

  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", top: 130, left: 0, right: 0,
        textAlign: "center", fontFamily: FONT_PROSE,
        fontSize: 28, color: TEXT_SEC, opacity: titleOpacity,
      }}>
        {flowTitle}
      </div>

      <div style={{
        position: "absolute", top: topStart, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        {nodes.map((node, i) => (
          <FlowStep
            key={i}
            node={node}
            isLast={i === nodes.length - 1}
            accent={accent}
            appearAt={20 + i * NODE_INTERVAL}
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

export const SystemsExplainer: React.FC<SystemsExplainerProps> = ({
  hookLine1, hookLine2,
  flowTitle = "Request Lifecycle",
  nodes,
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
      <FlowScene nodes={nodes} flowTitle={flowTitle} accent={accentColor} />
    </Sequence>
    <Sequence from={RULE_START} durationInFrames={durationInFrames - RULE_START}>
      <RuleScene rule1={rule1} rule2={rule2} accent={accentColor} />
    </Sequence>
  </AbsoluteFill>
);
