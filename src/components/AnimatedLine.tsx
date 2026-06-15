import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

const ACCENT = "#e879f9";

interface AnimatedLineProps {
  color?: string;
  thickness?: number;
  delay?: number;
}

export const AnimatedLine: React.FC<AnimatedLineProps> = ({
  color = ACCENT,
  thickness = 2,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const scaleX = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width,
        height: thickness,
        backgroundColor: color,
        transformOrigin: "left center",
        transform: `scaleX(${scaleX})`,
      }}
    />
  );
};
