import { useLayoutEffect, useRef } from "react";
import { COMPOSER, SCENARIO_IDS, SYSTEMS, type CapabilityId, type ScenarioId } from "@/data/model";
import { gsap, useReducedMotion } from "@/lib/motion";
import { useExperience } from "@/state/experience";
import { Trace } from "@/components/ui";

/**
 * Chapter 6 — Capability Composer. Technology follows the problem.
 * Inherits the Augmentation Map scenario (visibly). Shows the capabilities that earn their place, why,
 * what remains human, and which tempting technologies are NOT required.
 * Adding one of those does not reward the visitor with features: it raises the question
 * "Additional complexity introduced. What problem does this solve?" and offers the way back.
 */
export function Composer() {
  const { t, state, dispatch, effectiveComposer } = useExperience();
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const problem: ScenarioId | null = effectiveComposer;
  const inherited = state.scenario !== null && state.composerProblem === null;

  useLayoutEffect(() => {
    if (reduced || !panel.current || !problem) return;
    const items = panel.current.querySelectorAll(".capability-item");
    const tw = gsap.fromTo(items, { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.06, clearProps: "all" });
    return () => { tw.kill(); };
  }, [problem, reduced, state.locale]);

  useLayoutEffect(() => {
    if (reduced || !panel.current) return;
    const el = panel.current.querySelector(".complexity-notice");
    if (!el) return;
    const tw = gsap.fromTo(el, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.4, clearProps: "all" });
    return () => { tw.kill(); };
  }, [state.added.length, reduced]);

  const spec = problem ? COMPOSER[problem] : null;
  const added = state.added;
  const total = (spec?.required.length ?? 0) + added.length;
  const llmPresent = problem ? SYSTEMS[problem].aiCentral || added.includes("llm") : true;

  return <section className="composer-section chapter" id="composer" aria-labelledby="composer-heading">
    <div className="page-shell">
      <Trace state="reduced" />
      <div className="chapter-heading-row"><div><h2 className="chapter-title" id="composer-heading">{t.composer.title}</h2><p className="chapter-intro">{t.composer.intro}</p></div></div>

      <div className="composer-layout">
        <div className="composer-choices">
          <div className={`composer-inherit ${inherited ? "is-on" : ""}`} aria-live="polite">
            <span className="meta">{inherited ? t.composer.inherited : t.composer.choose}</span>
            {inherited && problem ? <b>{t.map.scenarios[problem].title}</b> : !problem ? <p>{t.composer.noScenario}</p> : null}
          </div>
          <div role="group" aria-label={t.composer.choose}>
            {SCENARIO_IDS.map((id) => <button key={id} type="button" aria-pressed={problem === id} className={problem === id ? "is-active" : ""} onClick={() => dispatch({ type: "composerProblem", scenario: id })}>
              <span className="scenario-dot" aria-hidden="true" />{t.map.scenarios[id].title}
            </button>)}
          </div>
        </div>

        <div className="composer-result" ref={panel} aria-live="polite">
          {problem && spec ? <>
            <div className="composer-result-head">
              <span className="meta">{t.composer.systemSize} · {total} {t.composer.capabilities}{added.length ? ` · ${added.length} ${t.composer.added}` : ""}</span>
              <span className={`composer-badge meta ${added.length ? "composer-badge--warn" : ""}`}>{added.length ? t.composer.complexityTitle.split(".")[0] : t.composer.smallest}</span>
            </div>
            <h3>{t.map.scenarios[problem].title}</h3>

            <span className="meta block-label">{t.composer.required}</span>
            <ol className="capability-list">
              {spec.required.map((id, i) => <li className="capability-item" key={id}><span className="capability-index">{String(i + 1).padStart(2, "0")}</span><div><b>{t.composer.classes[id].name}</b><p>{t.composer.classes[id].why}</p></div></li>)}
              {added.map((id, i) => <li className="capability-item capability-item--added" key={id}><span className="capability-index">{String(spec.required.length + i + 1).padStart(2, "0")}</span><div><b>{t.composer.classes[id].name}</b><p>{t.composer.classes[id].why}</p><small className="meta">{t.composer.addedWhy}</small></div><button type="button" className="text-button" onClick={() => dispatch({ type: "removeCapability", id })}>{t.composer.remove}</button></li>)}
            </ol>

            <div className="composer-human"><span className="meta">{t.composer.remainsHuman}</span><p>{t.composer.remains[problem]}</p></div>
            {!llmPresent && <p className="composer-ai-note"><span className="mini-signal mini-signal--on" aria-hidden="true" />{t.composer.aiOptionalNote}</p>}

            {added.length > 0 && <div className="complexity-notice" role="status">
              <h4>{t.composer.complexityTitle}</h4>
              <p>{t.composer.complexityBody}</p>
              <ul className="cost-rows" aria-label={t.composer.systemSize}>
                {(["build", "maintain", "evaluate"] as const).map((k) => <li key={k}><span className="meta">{t.composer.cost[k]}</span><span className="cost-ticks" aria-hidden="true">{Array.from({ length: total }, (_, i) => <i key={i} className={i >= spec.required.length ? "is-added" : ""} />)}</span><span className="meta cost-count">{total}</span></li>)}
              </ul>
              <button type="button" className="action-link action-link--secondary" onClick={() => dispatch({ type: "resetAdded" })}>{t.composer.returnSmallest}</button>
            </div>}

            <div className="not-required">
              <span className="meta block-label">{t.composer.notRequired}</span>
              <ul>
                {spec.notRequired.map((id: CapabilityId) => { const on = added.includes(id); return <li key={id} className={on ? "is-added" : ""}><div><b>{t.composer.classes[id].name}</b><p>{t.composer.classes[id].why}</p></div><button type="button" className="text-button" aria-pressed={on} onClick={() => dispatch({ type: on ? "removeCapability" : "addCapability", id })}>{on ? t.composer.remove : t.composer.add}</button></li>; })}
              </ul>
            </div>
          </> : <p className="composer-empty">{t.composer.noScenario}</p>}
        </div>
      </div>
    </div>
  </section>;
}
