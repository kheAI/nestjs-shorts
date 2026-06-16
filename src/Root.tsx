import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { Ep01Module } from "./compositions/Ep01Module";
import { DefinitionCard } from "./templates/DefinitionCard";
import { BeforeAfter } from "./templates/BeforeAfter";
import { StepByStep } from "./templates/StepByStep";
import { SystemsExplainer } from "./templates/SystemsExplainer";
import { StatCard } from "./templates/StatCard";
import { CodeReveal } from "./templates/CodeReveal";

// ─── DefinitionCard preview ───────────────────────────────────────────────────

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

// ─── BeforeAfter preview ──────────────────────────────────────────────────────

const BeforeAfterPreview: React.FC = () => (
  <BeforeAfter
    hookLine1="You're probably creating services wrong."
    hookLine2="Here's the NestJS way."
    beforeLines={[
      "class CatsController {",
      "  service = new CatsService();",
      "",
      "  findAll() {",
      "    return this.service.findAll();",
      "  }",
      "}",
    ]}
    afterLines={[
      "class CatsController {",
      "  constructor(",
      "    private service: CatsService",
      "  ) {}",
      "",
      "  findAll() {",
      "    return this.service.findAll();",
      "  }",
      "}",
    ]}
    beforeNote="❌ hard to test — new CatsService() is hidden"
    afterNote="✓ injected — swap with a mock in any test"
    rule1="Never new a dependency."
    rule2="Let NestJS inject it."
  />
);

// ─── StepByStep preview ───────────────────────────────────────────────────────

const StepByStepPreview: React.FC = () => (
  <StepByStep
    hookLine1="Building a NestJS feature from scratch?"
    hookLine2="Four steps. Every time."
    steps={[
      { title: "Generate the module",    description: "nest g module cats" },
      { title: "Generate the service",   description: "nest g service cats" },
      { title: "Generate the controller", description: "nest g controller cats" },
      { title: "Wire the module",        description: "Import it in AppModule" },
    ]}
    rule1="Module → Service → Controller."
    rule2="In that order, always."
  />
);

// ─── SystemsExplainer preview ─────────────────────────────────────────────────

const SystemsExplainerPreview: React.FC = () => (
  <SystemsExplainer
    hookLine1="Every HTTP request passes through 5 layers."
    hookLine2="Miss one and things break silently."
    flowTitle="NestJS Request Lifecycle"
    nodes={[
      { label: "Middleware",  sublabel: "use(req, res, next)" },
      { label: "Guard",       sublabel: "canActivate()",    highlight: true },
      { label: "Interceptor", sublabel: "intercept() — before" },
      { label: "Pipe",        sublabel: "transform()",     highlight: true },
      { label: "Controller",  sublabel: "@Get() / @Post()" },
    ]}
    rule1="Guards run before Pipes."
    rule2="Pipes run before Controllers."
  />
);

// ─── StatCard preview ─────────────────────────────────────────────────────────

const StatCardPreview: React.FC = () => (
  <StatCard
    statFrom={0}
    statTo={94}
    statSuffix="%"
    statLabel="of NestJS bugs are dependency injection mistakes"
    contextLine1="DI errors surface at runtime, not compile time."
    contextLine2="Until you add proper typing."
    rule1="Type your providers."
    rule2="Let the compiler catch it first."
  />
);

// ─── CodeReveal preview ───────────────────────────────────────────────────────

const CodeRevealPreview: React.FC = () => (
  <CodeReveal
    hookLine1="One decorator that changes everything —"
    hookLine2="@Injectable()"
    filename="cats.service.ts"
    lines={[
      { code: "@Injectable()",              annotation: "marks it for DI" },
      { code: "export class CatsService {" },
      { code: "  constructor(",             annotation: "NestJS resolves this" },
      { code: "    private db: DatabaseService" },
      { code: "  ) {}",                    annotation: "no new keyword" },
      { code: "",                            },
      { code: "  findAll() {",              annotation: "db already injected" },
      { code: "    return this.db.query();"},
      { code: "  }",                        },
      { code: "}",                          },
    ]}
    insight1="@Injectable() = 'I have dependencies.'"
    insight2="NestJS wires them automatically."
  />
);

// ─── Root ─────────────────────────────────────────────────────────────────────

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
      <Composition
        id="before-after-preview"
        component={BeforeAfterPreview}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="step-by-step-preview"
        component={StepByStepPreview}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="systems-explainer-preview"
        component={SystemsExplainerPreview}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="stat-card-preview"
        component={StatCardPreview}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="code-reveal-preview"
        component={CodeRevealPreview}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
