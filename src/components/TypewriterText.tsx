import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

const ACCENT = "#e879f9";

interface TypewriterTextProps {
  text: string;
  startFrame?: number;
  charsPerSecond?: number;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  charsPerSecond = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsed = Math.max(0, frame - startFrame);
  const charsVisible = Math.floor((elapsed / fps) * charsPerSecond);
  const displayText = text.slice(0, charsVisible);
  const isComplete = charsVisible >= text.length;

  // Blink every 15 frames (0.5s at 30fps)
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  return (
    <span>
      {displayText}
      <span
        style={{
          color: ACCENT,
          opacity: isComplete && cursorVisible ? 1 : isComplete ? 0 : 1,
        }}
      >
        |
      </span>
    </span>
  );
};
