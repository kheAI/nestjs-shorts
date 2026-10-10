import React from "react";
import { useCurrentFrame } from "remotion";
import brand from "../../data/wetel-brand.json";

// Outline of the Wetel cyber-capybara (paths ported from wetel-site's Capybara.astro, stand pose).
// The mouth opens with the narration loudness; the body bobs a little while it speaks.
const HEAD = "C38.5 9 40 8 42 7.8 L54 8 C57 8 59 9.5 60.5 11.5 L63 15 C63.8 16.3 64 17.5 64 19";
const JAW = "L64 20 C64 21.5 63 22.5 61.5 22.5 L52 22.5 C48 22.5 46 22 45 23";
const EAR = "M43 8 C42 4.5 46 3.8 47 7.5";
const NOSE = "M61 14.5 L62 15.5";
const VISOR = "M46 12 H52.5";
const BODY = `M10 30 C5 28 3 21 6 16 C9 11 16 9 25 9 C30 9 34 10 37 10.5 ${HEAD} ${JAW} C44.5 25 44.5 27.5 43 29.5 C42 30.5 40.5 31 39 31 L16 31 C13.5 31 11.5 30.8 10 30 Z`;
const LEGS = "M14 31 V35 H17 M20 31 V35 H23 M36.5 31 V35 H39.5 M41.5 30.2 V35 H44.5";
const CIRCUIT = "M16 17 H25 L28 20 H31";

export const TalkingCapybara: React.FC<{ envelope: number[]; size?: number }> = ({ envelope, size = 250 }) => {
  const frame = useCurrentFrame();
  // Smooth over 3 frames so the mouth does not flicker.
  const at = (f: number) => envelope[Math.min(Math.max(f, 0), envelope.length - 1)] ?? 0;
  const level = (at(frame - 1) + at(frame) + at(frame + 1)) / 3 / 100;
  const speaking = level > 0.08;
  const open = speaking ? Math.min(1, level * 1.2) : 0;
  const mouth = `M58.5 19 Q61.3 ${19.2 + open * 4.2} 64 19.2`;
  const bob = speaking ? Math.sin(frame / 2.2) * 0.9 : 0;
  const stroke = brand.textPrimary;
  const accent = brand.accent;
  return (
    <svg
      viewBox="0 0 66 35"
      width={size}
      height={(size * 35) / 66}
      fill="none"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      overflow="visible"
    >
      <g transform={`translate(0 ${bob})`}>
        <path d={BODY} stroke={stroke} />
        <path d={LEGS} stroke={stroke} />
        <path d={EAR} stroke={stroke} />
        <path d={NOSE} stroke={stroke} />
        <path d={mouth} stroke={stroke} />
        <path d={CIRCUIT} stroke={accent} />
        <circle cx="32.6" cy="20" r="1.3" stroke={accent} />
        <path d={VISOR} stroke={accent} />
      </g>
    </svg>
  );
};
