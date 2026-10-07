/**
 * Language-independent system model.
 * Everything here is structure (ids, geometry, emphasis, routes).
 * All human-readable text lives in src/i18n/copy.ts.
 */

export type Locale = "EN" | "DE";
export type Route = "/" | "/organisations" | "/individuals" | "/work" | "/lab" | "/approach";

export const ROUTES: Route[] = ["/", "/organisations", "/individuals", "/work", "/lab", "/approach"];

export type LayerId = "human" | "context" | "ai" | "tools" | "workflow" | "control" | "evidence" | "value";
export const LAYER_IDS: LayerId[] = ["human", "context", "ai", "tools", "workflow", "control", "evidence", "value"];

export type ScenarioId = "decision" | "knowledge" | "coordination" | "content";
export const SCENARIO_IDS: ScenarioId[] = ["decision", "knowledge", "coordination", "content"];

export type AudienceId = "org" | "individual";
export type EvidenceId = "concept" | "prototype" | "used" | "repeated" | "measured";
export const EVIDENCE_IDS: EvidenceId[] = ["concept", "prototype", "used", "repeated", "measured"];

export type StageId = "gap" | "practice" | "augment" | "interface" | "context" | "control" | "work" | "evidence" | "reuse";
export const STAGE_IDS: StageId[] = ["gap", "practice", "augment", "interface", "context", "control", "work", "evidence", "reuse"];

/** How strongly a layer participates in a given scenario's system. */
export type Prominence = "primary" | "secondary" | "optional";

export type NodeSpec = { x: number; y: number; prominence: Prominence };

export type ScenarioSystem = {
  nodes: Record<LayerId, NodeSpec>;
  /** The main path of the work through the system, in order. */
  primaryRoute: [LayerId, LayerId][];
  /** Supporting relationships. */
  secondaryRoute: [LayerId, LayerId][];
  /** Order in which the sequential (mobile) inspection lists the layers. */
  sequence: LayerId[];
  /** Does this scenario put an LLM at the centre? Used by the AI-removal test and composer. */
  aiCentral: boolean;
};

/**
 * Four genuinely different architectures. Coordinates are percentages of the map canvas (100 × 100).
 * The canvas is 1.46:1, so visually y is compressed; layouts were chosen with that in mind.
 */
export const SYSTEMS: Record<ScenarioId, ScenarioSystem> = {
  decision: {
    nodes: {
      human: { x: 12, y: 20, prominence: "primary" },
      context: { x: 34, y: 46, prominence: "primary" },
      ai: { x: 60, y: 42, prominence: "primary" },
      tools: { x: 86, y: 18, prominence: "secondary" },
      workflow: { x: 14, y: 74, prominence: "secondary" },
      control: { x: 64, y: 72, prominence: "primary" },
      evidence: { x: 38, y: 90, prominence: "primary" },
      value: { x: 86, y: 90, prominence: "primary" },
    },
    primaryRoute: [["human", "context"], ["context", "ai"], ["ai", "control"], ["control", "human"], ["control", "evidence"], ["evidence", "value"]],
    secondaryRoute: [["tools", "context"], ["workflow", "control"]],
    sequence: ["human", "context", "ai", "control", "evidence", "value", "tools", "workflow"],
    aiCentral: true,
  },
  knowledge: {
    nodes: {
      human: { x: 86, y: 22, prominence: "primary" },
      context: { x: 16, y: 32, prominence: "primary" },
      ai: { x: 50, y: 48, prominence: "primary" },
      tools: { x: 16, y: 70, prominence: "primary" },
      workflow: { x: 52, y: 14, prominence: "secondary" },
      control: { x: 84, y: 58, prominence: "primary" },
      evidence: { x: 50, y: 88, prominence: "primary" },
      value: { x: 86, y: 90, prominence: "primary" },
    },
    primaryRoute: [["tools", "context"], ["context", "ai"], ["human", "ai"], ["ai", "control"], ["control", "human"], ["control", "evidence"], ["evidence", "value"]],
    secondaryRoute: [["workflow", "human"]],
    sequence: ["human", "context", "tools", "ai", "control", "evidence", "value", "workflow"],
    aiCentral: true,
  },
  coordination: {
    nodes: {
      human: { x: 86, y: 60, prominence: "primary" },
      context: { x: 16, y: 66, prominence: "secondary" },
      ai: { x: 16, y: 92, prominence: "optional" },
      tools: { x: 16, y: 26, prominence: "primary" },
      workflow: { x: 50, y: 26, prominence: "primary" },
      control: { x: 86, y: 26, prominence: "primary" },
      evidence: { x: 50, y: 72, prominence: "primary" },
      value: { x: 86, y: 92, prominence: "primary" },
    },
    primaryRoute: [["tools", "workflow"], ["workflow", "control"], ["control", "human"], ["human", "evidence"], ["evidence", "value"]],
    secondaryRoute: [["context", "workflow"], ["ai", "workflow"]],
    sequence: ["tools", "workflow", "control", "human", "evidence", "value", "context", "ai"],
    aiCentral: false,
  },
  content: {
    nodes: {
      human: { x: 12, y: 22, prominence: "primary" },
      context: { x: 36, y: 40, prominence: "primary" },
      ai: { x: 58, y: 58, prominence: "primary" },
      tools: { x: 86, y: 14, prominence: "secondary" },
      workflow: { x: 34, y: 76, prominence: "primary" },
      control: { x: 82, y: 42, prominence: "primary" },
      evidence: { x: 60, y: 92, prominence: "primary" },
      value: { x: 88, y: 76, prominence: "primary" },
    },
    primaryRoute: [["human", "context"], ["context", "ai"], ["ai", "workflow"], ["workflow", "control"], ["control", "human"], ["control", "evidence"], ["evidence", "value"]],
    secondaryRoute: [["tools", "workflow"]],
    sequence: ["human", "context", "ai", "workflow", "control", "evidence", "value", "tools"],
    aiCentral: true,
  },
};

/** Every route that appears in any scenario — rendered once, faded in/out per scenario. */
export const ALL_ROUTES: [LayerId, LayerId][] = (() => {
  const seen = new Set<string>();
  const out: [LayerId, LayerId][] = [];
  for (const id of SCENARIO_IDS) {
    for (const r of [...SYSTEMS[id].primaryRoute, ...SYSTEMS[id].secondaryRoute]) {
      const key = `${r[0]}-${r[1]}`;
      if (!seen.has(key)) { seen.add(key); out.push(r); }
    }
  }
  return out;
})();

export const routeKey = (r: [LayerId, LayerId]) => `${r[0]}-${r[1]}`;

/** Capability classes used by the Capability Composer. Ids are stable; labels are translated. */
export type CapabilityId =
  | "context-design" | "retrieval" | "api" | "workflow-rules" | "deterministic" | "existing-tools"
  | "ai-synthesis" | "ai-transform" | "human-decision" | "human-review" | "human-confirm"
  | "evaluation" | "measurement" | "governance"
  | "llm" | "agent" | "custom-app" | "orchestration";

export type ComposerSystem = {
  required: CapabilityId[];
  /** Tempting additions the baseline does not need. Each one can be toggled on by the visitor. */
  notRequired: CapabilityId[];
};

export const COMPOSER: Record<ScenarioId, ComposerSystem> = {
  decision: { required: ["context-design", "ai-synthesis", "human-decision", "evaluation"], notRequired: ["agent", "custom-app", "orchestration"] },
  knowledge: { required: ["retrieval", "api", "ai-synthesis", "human-review", "evaluation"], notRequired: ["agent", "custom-app"] },
  coordination: { required: ["workflow-rules", "existing-tools", "api", "deterministic", "human-confirm", "measurement"], notRequired: ["llm", "agent", "custom-app"] },
  content: { required: ["context-design", "ai-transform", "workflow-rules", "human-review", "evaluation"], notRequired: ["agent", "custom-app", "orchestration"] },
};

/** Lab maturity ↔ evidence maturity. Lab states are earned by evidence states. */
export type LabMaturity = "experiment" | "used" | "repeated" | "productised";
export const LAB_MATURITY: LabMaturity[] = ["experiment", "used", "repeated", "productised"];
export const EVIDENCE_TO_LAB: Record<EvidenceId, LabMaturity> = { concept: "experiment", prototype: "experiment", used: "used", repeated: "repeated", measured: "productised" };

/** Visual Command Lab — the twelve commands, preserved verbatim from the baseline prototype. */
export type Lane = "play" | "explain" | "polish";
export const LANES: Lane[] = ["play", "explain", "polish"];
export const COMMANDS: Record<Lane, string[]> = {
  play: ["/bricktoy", "/manga", "/actionfigure", "/miniature"],
  explain: ["/mindmap", "/lerncomic", "/infographic", "/storyboard"],
  polish: ["/35mm", "/cinematic", "/editorial", "/prophoto"],
};

/** Trace states — the Augmentation Trace's representation per chapter. */
export type TraceState = "broken" | "missing" | "system" | "branch" | "practice" | "reduced" | "bounded" | "reusable" | "behaviour" | "loop";
