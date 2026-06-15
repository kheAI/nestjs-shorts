import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { Ep01Module } from "./compositions/Ep01Module";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={60}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="ep01-module"
        component={Ep01Module}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
