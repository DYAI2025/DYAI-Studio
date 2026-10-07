import { useLayoutEffect, useRef } from "react";
import { STAGE_IDS } from "@/data/model";
import { gsap, ScrollTrigger, useMediaQuery, useReducedMotion, DESKTOP_QUERY } from "@/lib/motion";
import { useExperience } from "@/state/experience";
import { Trace } from "@/components/ui";

/**
 * Chapter 5 — From capability gap to working practice.
 * Desktop: the left column is pinned (GSAP ScrollTrigger) while nine stages move through the viewport.
 * Each stage visibly consumes what the previous stage produced; a thin trace fills with scroll progress.
 * Stage names on the left are buttons — a keyboard/convenience alternative to scrolling.
 * Mobile / reduced motion: a plain vertical stepper, nothing pinned.
 */
export function Process() {
  const { t, state, dispatch } = useExperience();
  const reduced = useReducedMotion();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const section = useRef<HTMLElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const pin = desktop && !reduced;

  useLayoutEffect(() => {
    if (!pin || !section.current || !left.current || !right.current) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: right.current, start: "top 96px", end: "bottom bottom", pin: left.current, pinSpacing: false, anticipatePin: 1 });
      gsap.fromTo(fill.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: right.current, start: "top center", end: "bottom center", scrub: 0.3 } });
      gsap.utils.toArray<HTMLElement>(".stage", right.current).forEach((el, i) => {
        ScrollTrigger.create({ trigger: el, start: "top 55%", end: "bottom 55%", onToggle: (self) => { if (self.isActive) dispatch({ type: "stage", stage: i }); } });
        gsap.fromTo(el.querySelector(".stage-body"), { autoAlpha: 0.35, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none reverse" } });
      });
    }, section.current);
    return () => ctx.revert();
  }, [pin, dispatch, state.locale]);

  const go = (i: number) => {
    dispatch({ type: "stage", stage: i });
    const el = right.current?.querySelectorAll<HTMLElement>(".stage")[i];
    el?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  };

  const active = Math.min(state.stage, STAGE_IDS.length - 1);
  const activeStage = t.process.stages[STAGE_IDS[active]];

  return <section className={`process-section chapter ${pin ? "process-section--pinned" : ""}`} id="approach" aria-labelledby="process-heading" ref={section}>
    <div className="page-shell process-layout">
      <div className="process-left" ref={left}>
        <Trace state="practice" />
        <h2 className="chapter-title" id="process-heading">{t.process.title}</h2>
        <p className="chapter-intro">{t.process.intro}</p>
        <div className="process-active" aria-live="polite">
          <span className="meta">{t.process.pinnedLabel} · {String(active + 1).padStart(2, "0")}</span>
          <p key={active}>{activeStage.sub}</p>
        </div>
        <ol className="process-nav" aria-label={t.process.title}>
          {STAGE_IDS.map((id, i) => <li key={id}><button type="button" className={i === active ? "is-active" : i < active ? "is-past" : ""} aria-current={i === active ? "step" : undefined} onClick={() => go(i)}><span className="meta">{String(i + 1).padStart(2, "0")}</span>{t.process.stages[id].title}</button></li>)}
        </ol>
      </div>

      <div className="process-right" ref={right}>
        <span className="process-trace" aria-hidden="true"><span className="process-trace-fill" ref={fill} /></span>
        {STAGE_IDS.map((id, i) => {
          const s = t.process.stages[id];
          const prev = i === 0 ? t.process.start : t.process.stages[STAGE_IDS[i - 1]].output;
          return <article key={id} className={`stage ${i === active ? "is-active" : ""} ${i < active ? "is-past" : ""}`} id={`stage-${id}`}>
            <div className="stage-consume"><span className="meta">{t.process.input}</span><span className="stage-chip">{prev}</span></div>
            <div className="stage-body">
              <div className="stage-head"><span className="stage-no">{String(i + 1).padStart(2, "0")}</span><h3>{s.title}</h3></div>
              <p>{s.detail}</p>
            </div>
            <div className="stage-produce"><span className="meta">{t.process.output}</span><span className="stage-chip stage-chip--out">{s.output}</span>{i === STAGE_IDS.length - 1 && <span className="meta stage-loop">↺ {t.process.next}</span>}</div>
          </article>;
        })}
      </div>
    </div>
  </section>;
}
