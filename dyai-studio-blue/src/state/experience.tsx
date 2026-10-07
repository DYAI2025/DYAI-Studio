import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { AudienceId, CapabilityId, EvidenceId, LayerId, Locale, ScenarioId } from "@/data/model";
import { copy, type Copy } from "@/i18n";

/**
 * Shared experience state.
 * The rule: a decision made earlier influences a later relevant interaction, visibly.
 * Everything stays in this browser (sessionStorage); nothing is sent anywhere.
 */
export type ExperienceState = {
  locale: Locale;
  heroResolved: boolean;
  /** Augmentation Map */
  scenario: ScenarioId | null;      // null = visitor has not chosen yet (map shows a default, composer says so)
  layer: LayerId | null;
  /** Audience paths */
  audience: AudienceId | null;
  /** Process */
  stage: number;
  /** Capability Composer */
  composerProblem: ScenarioId | null; // explicit override; otherwise inherits `scenario`
  added: CapabilityId[];
  /** Evidence */
  evidence: EvidenceId;
  /** Problem mapping dialog */
  mapperOpen: boolean;
};

type Action =
  | { type: "locale"; locale: Locale }
  | { type: "heroResolved" }
  | { type: "scenario"; scenario: ScenarioId }
  | { type: "layer"; layer: LayerId | null }
  | { type: "audience"; audience: AudienceId | null }
  | { type: "stage"; stage: number }
  | { type: "composerProblem"; scenario: ScenarioId }
  | { type: "addCapability"; id: CapabilityId }
  | { type: "removeCapability"; id: CapabilityId }
  | { type: "resetAdded" }
  | { type: "evidence"; evidence: EvidenceId }
  | { type: "mapper"; open: boolean };

const STORAGE_KEY = "dyai-p3-experience";

function readStorage(): Partial<ExperienceState> {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ExperienceState>) : {};
    let locale: Locale | undefined = parsed.locale;
    if (!locale) {
      const stored = window.localStorage.getItem("dyai-locale");
      if (stored === "DE" || stored === "EN") locale = stored;
    }
    const result: Partial<ExperienceState> = { ...parsed, mapperOpen: false };
    if (locale) result.locale = locale; else delete result.locale;
    return result;
  } catch {
    return {};
  }
}

function writeStorage(state: ExperienceState) {
  try {
    const { mapperOpen: _omit, ...persist } = state;
    void _omit;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    window.localStorage.setItem("dyai-locale", state.locale);
  } catch {
    /* storage may be unavailable (private mode, embedded preview) — the prototype works without it */
  }
}

export const initialExperience: ExperienceState = {
  locale: "EN", heroResolved: false, scenario: null, layer: null, audience: null, stage: 0,
  composerProblem: null, added: [], evidence: "prototype", mapperOpen: false,
};

function reducer(state: ExperienceState, action: Action): ExperienceState {
  switch (action.type) {
    case "locale": return { ...state, locale: action.locale };
    case "heroResolved": return state.heroResolved ? state : { ...state, heroResolved: true };
    case "scenario":
      // A new scenario resets the composer override so the composer visibly inherits it,
      // and clears any "added anyway" capabilities — they belonged to the previous problem.
      return { ...state, scenario: action.scenario, composerProblem: null, added: [] };
    case "layer": return { ...state, layer: action.layer };
    case "audience": return { ...state, audience: action.audience };
    case "stage": return { ...state, stage: action.stage };
    case "composerProblem": return { ...state, composerProblem: action.scenario, added: [] };
    case "addCapability": return state.added.includes(action.id) ? state : { ...state, added: [...state.added, action.id] };
    case "removeCapability": return { ...state, added: state.added.filter((id) => id !== action.id) };
    case "resetAdded": return { ...state, added: [] };
    case "evidence": return { ...state, evidence: action.evidence };
    case "mapper": return { ...state, mapperOpen: action.open };
  }
}

type Ctx = { state: ExperienceState; dispatch: (a: Action) => void; t: Copy; effectiveComposer: ScenarioId | null };
const ExperienceContext = createContext<Ctx | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialExperience, (init) => ({ ...init, ...readStorage() }));
  useEffect(() => { writeStorage(state); }, [state]);
  useEffect(() => { document.documentElement.lang = state.locale === "DE" ? "de" : "en"; }, [state.locale]);
  const value = useMemo<Ctx>(() => ({
    state, dispatch, t: copy[state.locale],
    effectiveComposer: state.composerProblem ?? state.scenario,
  }), [state]);
  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used inside ExperienceProvider");
  return ctx;
}
