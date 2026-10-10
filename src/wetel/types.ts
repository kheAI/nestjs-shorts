export type Tone = "accent" | "good" | "bad" | "warn" | "muted";

export interface CardItem {
  label: string;
  text: string;
  tone: Tone;
}

interface SceneBase {
  eyebrow: string;
  title: string;
  narration: string;
}

export interface HookScene extends SceneBase {
  kind: "hook";
  subtitle: string;
}
export interface CardsScene extends SceneBase {
  kind: "cards";
  items: CardItem[];
}
export interface TableScene extends SceneBase {
  kind: "table";
  columns: string[];
  rows: { label: string; values: string[] }[];
}
export interface FlowScene extends SceneBase {
  kind: "flow";
  node: string;
  branches: { label: string; text: string; tone: Tone }[];
}
export interface CtaScene extends SceneBase {
  kind: "cta";
  subtitle: string;
}

export type Scene = HookScene | CardsScene | TableScene | FlowScene | CtaScene;

export interface ShortDef {
  id: string;
  title: string;
  source: string;
  scenes: Scene[];
}

export interface ExplainerProps extends Record<string, unknown> {
  shortId: string;
  /** Per-scene narration length in seconds; filled by calculateMetadata from data/wetel-shorts-timing.json. */
  sceneSeconds: number[];
}
