import { TraceMark } from "@/components/ui";
import { useReducedMotion } from "@/lib/motion";
import { useExperience } from "@/state/experience";
import { resolveSegment, type HomeSegmentId } from "@/thread/model";

/** Build switch. false = every segment renders nothing and thread.css matches nothing. */
export const BLUE_THREAD: boolean = true;

/** Same-bundle falsification switch for QA: `?thread=off`. Read once, never persisted. */
const THREAD_ON: boolean = BLUE_THREAD && (() => {
  try { return new URLSearchParams(window.location.search).get("thread") !== "off"; } catch { return true; }
})();

/**
 * One chapter-local Blue Thread segment: entry stub, the chapter's own trace glyph as local mark, local body, exit stub.
 * Presentation only — aria-hidden, no text, nothing focusable, static. The meaning is already exposed by the chapter
 * eyebrow (Trace) and by the state of the controls the visitor used.
 */
export function ThreadSegment({ id }: { id: HomeSegmentId }) {
  const { state } = useExperience();
  const reduced = useReducedMotion();
  if (!THREAD_ON) return null;
  const s = resolveSegment(id, {
    scenario: state.scenario, audience: state.audience, composerProblem: state.composerProblem, evidence: state.evidence,
    // Shared state is authoritative (the hero records its resolution); `reduced` only covers the first paint before that effect runs.
    heroRevealed: state.heroResolved || reduced,
  });
  return <div className="bt-seg" aria-hidden="true" data-bt-chapter={s.id} data-bt-entry={s.entryId} data-bt-exit={s.exitId}>
    <span className="bt-piece bt-piece--entry" data-bt-state={s.entry.state} data-bt-line={s.entry.line} />
    <span className="bt-piece bt-piece--mark" data-bt-state={s.local.state} data-bt-line={s.local.line}>
      <TraceMark state={s.glyph} resolved={s.local.state === "resolved" && s.glyph === "broken"} />
    </span>
    <span className="bt-piece bt-piece--body" data-bt-state={s.local.state} data-bt-line={s.local.line} />
    <span className="bt-piece bt-piece--exit" data-bt-state={s.exit.state} data-bt-line={s.exit.line} />
  </div>;
}
