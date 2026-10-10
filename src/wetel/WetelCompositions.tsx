import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import brand from "../../data/wetel-brand.json";
import shorts from "../../data/wetel-shorts.json";
import timing from "../../data/wetel-shorts-timing.json";
import { ExplainerShort, sceneFrames } from "./ExplainerShort";
import { ExplainerProps, ShortDef } from "./types";

const { width, height, fps } = brand.dimensions;
const timings = timing as Record<string, number[]>;

const calculateMetadata: CalculateMetadataFunction<ExplainerProps> = ({ props }) => {
  const sceneSeconds = timings[props.shortId];
  if (!sceneSeconds) {
    throw new Error(`No narration timing for ${props.shortId}; run node scripts/narrate.mjs`);
  }
  return {
    props: { ...props, sceneSeconds },
    durationInFrames: sceneSeconds.reduce((a, s) => a + sceneFrames(s, fps), 0),
  };
};

export const WetelCompositions: React.FC = () => (
  <>
    {(shorts as unknown as ShortDef[]).map((short) => (
      <Composition
        key={short.id}
        id={short.id}
        component={ExplainerShort}
        width={width}
        height={height}
        fps={fps}
        durationInFrames={300}
        defaultProps={{ shortId: short.id, sceneSeconds: [] }}
        calculateMetadata={calculateMetadata}
      />
    ))}
  </>
);
