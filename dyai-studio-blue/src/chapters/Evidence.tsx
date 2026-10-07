import { EVIDENCE_IDS, type EvidenceId, type Route } from "@/data/model";
import { useExperience } from "@/state/experience";
import { ButtonLink, Trace } from "@/components/ui";

/**
 * Chapter 7 — Evidence. Visually calm; the interaction communicates intellectual honesty.
 * Each maturity state shows two equally weighted areas: THIS PROVES / THIS DOES NOT PROVE.
 * No numbers, customers, logos or outcomes are invented. Motion is CSS-only.
 */
export function Evidence({ navigate }: { navigate: (r: Route) => void }) {
  const { t, state, dispatch } = useExperience();
  const level = state.evidence;
  const index = EVIDENCE_IDS.indexOf(level);
  const active = t.evidence.levels[level];
  return <section className="evidence-section chapter" id="evidence" aria-labelledby="evidence-heading">
    <div className="page-shell">
      <Trace state="bounded" />
      <div className="chapter-heading-row"><div><h2 className="chapter-title" id="evidence-heading">{t.evidence.title}</h2><p className="chapter-intro">{t.evidence.intro}</p></div></div>

      <span className="meta block-label">{t.evidence.rail}</span>
      <div className="evidence-rail" role="tablist" aria-label={t.evidence.rail}>
        {EVIDENCE_IDS.map((id, i) => <button key={id} type="button" role="tab" id={`ev-tab-${id}`} aria-selected={level === id} aria-controls="evidence-detail" tabIndex={level === id ? 0 : -1}
          className={`evidence-step ${level === id ? "is-active" : ""} ${i < index ? "is-past" : ""}`}
          onClick={() => dispatch({ type: "evidence", evidence: id })}
          onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const n = EVIDENCE_IDS[(i + (e.key === "ArrowRight" ? 1 : EVIDENCE_IDS.length - 1)) % EVIDENCE_IDS.length]; dispatch({ type: "evidence", evidence: n }); document.getElementById(`ev-tab-${n}`)?.focus(); } }}>
          <span className="evidence-dot"><i /></span><span className="evidence-no meta">{String(i + 1).padStart(2, "0")}</span><b>{t.evidence.levels[id].label}</b>
        </button>)}
      </div>

      <div className="evidence-detail" id="evidence-detail" role="tabpanel" aria-labelledby={`ev-tab-${level}`}>
        <div className="evidence-detail-head"><span className="meta">{String(index + 1).padStart(2, "0")} / 05</span><h3 key={level}>{active.label}</h3></div>
        <div className="proof-columns">
          <div className="proof-col proof-col--yes"><span className="meta">{t.evidence.proves}</span><ul>{active.proves.map((p) => <li key={p}>{p}</li>)}</ul></div>
          <div className="proof-col proof-col--no"><span className="meta">{t.evidence.notProves}</span><ul>{active.not.map((p) => <li key={p}>{p}</li>)}</ul></div>
        </div>
      </div>

      <div className="evidence-examples">
        <span className="meta block-label">{t.evidence.examplesLabel}</span>
        <ul>{t.evidence.examples.map((ex) => <li key={ex.title} className={ex.state === level ? "is-current" : ""}><b>{ex.title}</b><span className="meta">{t.evidence.levels[ex.state as EvidenceId].label}</span></li>)}</ul>
      </div>
      <ButtonLink secondary onClick={() => { navigate("/work"); window.scrollTo({ top: 0 }); }}>{t.evidence.cta}</ButtonLink>
    </div>
  </section>;
}
