import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

const MUTED = "#94a3b8";

type Position = "bottom-left" | "bottom-center" | "bottom-right";

interface ChannelHandleProps {
  handle?: string;
  position?: Position;
  bottomPadding?: number;
}

export const ChannelHandle: React.FC<ChannelHandleProps> = ({
  handle = "@khe_ai",
  position = "bottom-center",
  bottomPadding = 48,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in over 0.3s
  const fadeFrames = Math.round(fps * 0.3);
  const opacity = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const horizontalStyle: React.CSSProperties =
    position === "bottom-left"
      ? { left: 48 }
      : position === "bottom-right"
      ? { right: 48 }
      : { left: 0, right: 0, textAlign: "center" };

  return (
    <div
      style={{
        position: "absolute",
        bottom: bottomPadding,
        ...horizontalStyle,
        opacity,
        fontSize: 20,
        fontFamily: "Inter, system-ui, sans-serif",
        color: MUTED,
        letterSpacing: "0.02em",
      }}
    >
      {handle}
    </div>
  );
};
