import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface CountUpNumberProps {
  from: number;
  to: number;
  durationInFrames: number;
  color: string;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  from,
  to,
  durationInFrames,
  color,
}) => {
  const frame = useCurrentFrame();

  const value = interpolate(frame, [0, durationInFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <span style={{ color }}>
      {Math.round(value).toLocaleString()}
    </span>
  );
};
