import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { Ep01Module } from "./compositions/Ep01Module";
import { DefinitionCard } from "./templates/DefinitionCard";

const DefinitionCardPreview: React.FC = () => (
  <DefinitionCard
    hookLine1="Every NestJS project has 30 files and zero spaghetti —"
    hookLine2="here's why."
    codeTitle="@Module"
    codeLines={[
      { key: "imports",     value: "[DatabaseModule]", label: "borrow" },
      { key: "controllers", value: "[CatsController]", label: "own"    },
      { key: "providers",   value: "[CatsService]",    label: "own"    },
      { key: "exports",     value: "[CatsService]",    label: "lend"   },
    ]}
    rule1="One feature, one module."
    rule2="Declare what you own, borrow, and lend."
  />
);

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
      <Composition
        id="definition-card-preview"
        component={DefinitionCardPreview}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
