import { EVIDENCE_TO_LAB, type TraceState } from "@/data/model";
import type { ExperienceState } from "@/state/experience";

/**
 * The Blue Thread — the active relationship being designed between human intent and usable capability
 * (Confluence 04.3 §5). Not one page-spanning path: every home chapter owns a local segment with an entry,
 * a local and an exit state. Neighbouring chapters share one boundary, so the outgoing state of chapter N
 * is by construction the incoming state of chapter N+1. The type checks at the end of this file fail the
 * build when the chain breaks.
 */

/** The ten semantic states of the thread. */
export const THREAD_STATES = ["unresolved", "connecting", "resolved", "diagnostic", "branching", "converging", "selective", "bounded", "reusable", "returning"] as const;
export type ThreadState = (typeof THREAD_STATES)[number];

/** Two line forms only. potential = grey, dashed, thin. active = cobalt, continuous. */
export type ThreadLine = "potential" | "active";

/** States that by meaning are never the active designed relationship. */
export type AlwaysPotential = "unresolved" | "diagnostic" | "returning";

/**
 * What may activate the thread: explicit visitor decisions and the hero's narrative reveal.
 * Deliberately excluded: the scroll-driven process `stage`, `layer`, `added`, `locale`, `mapperOpen` and any
 * scroll progress — so the thread can never suggest evidence or maturity that was not chosen (R-BT-05).
 */
export type DecisionState = Pick<ExperienceState, "scenario" | "audience" | "composerProblem" | "evidence"> & {
  /** The hero has shown its complete relationship (reveal finished, button, returning visit or reduced motion). */
  heroRevealed: boolean;
};

export type DecisionId = "never" | "heroRevealed" | "scenarioChosen" | "audienceChosen" | "practiceComposed" | "problemSelected" | "reuseEarned";

export const DECISIONS: { readonly [K in DecisionId]: (d: DecisionState) => boolean } = {
  never: () => false,
  heroRevealed: (d) => d.heroRevealed,
  scenarioChosen: (d) => d.scenario !== null,
  audienceChosen: (d) => d.audience !== null,
  practiceComposed: (d) => d.scenario !== null && d.audience !== null,
  problemSelected: (d) => (d.composerProblem ?? d.scenario) !== null, // the composer's effective problem
  reuseEarned: (d) => { const m = EVIDENCE_TO_LAB[d.evidence]; return m === "repeated" || m === "productised"; },
};

type Why = { readonly why: string };
type Gated = { readonly state: AlwaysPotential; readonly when: "never" } | { readonly state: Exclude<ThreadState, AlwaysPotential>; readonly when: Exclude<DecisionId, "never"> };
export type BoundarySpec = Why & Gated;
/** A local state may additionally turn from unresolved into resolved — only the hero does this. */
export type LocalSpec = Why & (Gated | { readonly state: "unresolved"; readonly when: "heroRevealed"; readonly revealed: "resolved" });

export const HOME_CHAIN = ["hero", "gap", "map", "audiences", "process", "composer", "evidence", "lab", "principles", "final"] as const;
export type HomeSegmentId = (typeof HOME_CHAIN)[number];

/** Boundaries between chapters. "cycle" joins the final chapter back to the hero. */
export const BOUNDARIES = {
  "cycle": { state: "unresolved", when: "never", why: "A new real problem arrives before any relationship between intent and capability is designed." },
  "hero|gap": { state: "resolved", when: "heroRevealed", why: "Once the hero has shown the designed relationship, the thread leaves it resolved; the Gap then interrupts it (04.3 §6.1, §6.2)." },
  "gap|map": { state: "diagnostic", when: "never", why: "The Gap hands on named missing relationships: diagnosed, not yet designed." },
  "map|audiences": { state: "connecting", when: "scenarioChosen", why: "Relationships become a system; it is this visitor's system only after they chose a work situation." },
  "audiences|process": { state: "branching", when: "audienceChosen", why: "Context selects one of two valid routes; active only once a path was chosen." },
  "process|composer": { state: "converging", when: "practiceComposed", why: "System and context converge into a working practice; needs both explicit choices, never the scroll-driven stage." },
  "composer|evidence": { state: "selective", when: "problemSelected", why: "Only the capabilities the selected problem requires are passed on." },
  "evidence|lab": { state: "bounded", when: "problemSelected", why: "A selected system leaves Evidence carrying bounded claims; maturity itself is not echoed by scrolling." },
  "lab|principles": { state: "reusable", when: "reuseEarned", why: "Reuse is handed on only when the selected evidence reached Repeated or Measured." },
  "principles|final": { state: "resolved", when: "practiceComposed", why: "A relationship that holds (system and context chosen) is the precondition for bringing the next problem." },
} as const satisfies Record<string, BoundarySpec>;
export type BoundaryId = keyof typeof BOUNDARIES;

export type SegmentSpec = { readonly entry: BoundaryId; readonly local: LocalSpec; readonly exit: BoundaryId; readonly glyph: TraceState };

/** Per chapter: entry boundary, local state, exit boundary, and the chapter eyebrow's own trace glyph. */
export const SEGMENTS = {
  hero: { entry: "cycle", glyph: "broken", exit: "hero|gap", local: { state: "unresolved", when: "heroRevealed", revealed: "resolved", why: "Intent and capability start disconnected; when the demonstration completes the relationship is continuous." } },
  gap: { entry: "hero|gap", glyph: "missing", exit: "gap|map", local: { state: "diagnostic", when: "never", why: "The incoming relationship is interrupted by the questions it cannot yet answer; a diagnosis never activates." } },
  map: { entry: "gap|map", glyph: "system", exit: "map|audiences", local: { state: "connecting", when: "scenarioChosen", why: "Relationships become one system; active once the visitor picks a work situation (the default layout is illustrative)." } },
  audiences: { entry: "map|audiences", glyph: "branch", exit: "audiences|process", local: { state: "branching", when: "audienceChosen", why: "Context creates two valid routes for the same principles; the chosen path is the active branch." } },
  process: { entry: "audiences|process", glyph: "practice", exit: "process|composer", local: { state: "converging", when: "practiceComposed", why: "Stages turn each other's output into one practice; activated by explicit choices only, never by the stage reached." } },
  composer: { entry: "process|composer", glyph: "reduced", exit: "composer|evidence", local: { state: "selective", when: "problemSelected", why: "Only capabilities with a reason remain for the selected or inherited problem." } },
  evidence: { entry: "composer|evidence", glyph: "bounded", exit: "evidence|lab", local: { state: "bounded", when: "problemSelected", why: "Each maturity names what it proves and what it does not; scrolling never advances maturity." } },
  lab: { entry: "evidence|lab", glyph: "reusable", exit: "lab|principles", local: { state: "reusable", when: "reuseEarned", why: "Repeated evidence permits reuse; it falls back when the visitor selects a lower maturity." } },
  principles: { entry: "lab|principles", glyph: "behaviour", exit: "principles|final", local: { state: "resolved", when: "practiceComposed", why: "How a designed relationship behaves; it holds for this visitor once system and context are chosen." } },
  final: { entry: "principles|final", glyph: "loop", exit: "cycle", local: { state: "returning", when: "never", why: "A new real problem starts another cycle; it has no designed relationship yet." } },
} as const satisfies Record<HomeSegmentId, SegmentSpec>;

// ---- compile-time contract: `npm run typecheck` fails when any of these breaks ----
type Assert<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Seg<K> = K extends HomeSegmentId ? (typeof SEGMENTS)[K] : never;
type Continuous<T extends readonly unknown[]> =
  T extends readonly [infer A, infer B, ...infer R]
    ? Same<Seg<A>["exit"], Seg<B>["entry"]> extends true ? Continuous<readonly [B, ...R]> : { readonly continuityBrokenBetween: readonly [A, B] }
    : true;
type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;
type LocalStates = { [K in HomeSegmentId]: (typeof SEGMENTS)[K]["local"] extends { revealed: infer R } ? R | (typeof SEGMENTS)[K]["local"]["state"] : (typeof SEGMENTS)[K]["local"]["state"] }[HomeSegmentId];
type UsedStates = (typeof BOUNDARIES)[BoundaryId]["state"] | LocalStates;
type BoundaryUses = (typeof SEGMENTS)[HomeSegmentId]["entry"] | (typeof SEGMENTS)[HomeSegmentId]["exit"];
/** exit(N) === entry(N+1) for every neighbouring pair of home chapters. */
export type ThreadIsContinuous = Assert<Continuous<typeof HOME_CHAIN>>;
/** The final chapter hands back to the hero: the cycle restarts. */
export type ThreadClosesLoop = Assert<Same<Seg<Last<typeof HOME_CHAIN>>["exit"], Seg<(typeof HOME_CHAIN)[0]>["entry"]>>;
export type ThreadHasTenChapters = Assert<Same<(typeof HOME_CHAIN)["length"], 10>>;
/** Every one of the ten semantic states is expressed somewhere in the chain. */
export type ThreadUsesWholeVocabulary = Assert<Same<UsedStates, ThreadState>>;
/** No orphan boundary. */
export type EveryBoundaryIsUsed = Assert<Same<BoundaryUses, BoundaryId>>;

// ---- pure resolver: each boundary is resolved once, by id, identically for both neighbours ----
export type ResolvedPart = { readonly state: ThreadState; readonly line: ThreadLine };
export type ResolvedSegment = { readonly id: HomeSegmentId; readonly glyph: TraceState; readonly entryId: BoundaryId; readonly exitId: BoundaryId; readonly entry: ResolvedPart; readonly local: ResolvedPart; readonly exit: ResolvedPart };

const lineOf = (on: boolean): ThreadLine => (on ? "active" : "potential");

export function resolveBoundary(id: BoundaryId, d: DecisionState): ResolvedPart {
  const b: BoundarySpec = BOUNDARIES[id];
  return { state: b.state, line: lineOf(DECISIONS[b.when](d)) };
}

export function resolveSegment(id: HomeSegmentId, d: DecisionState): ResolvedSegment {
  const s: SegmentSpec = SEGMENTS[id];
  const l = s.local;
  const on = DECISIONS[l.when](d);
  return {
    id, glyph: s.glyph, entryId: s.entry, exitId: s.exit,
    entry: resolveBoundary(s.entry, d),
    local: { state: on && "revealed" in l ? l.revealed : l.state, line: lineOf(on) },
    exit: resolveBoundary(s.exit, d),
  };
}
