import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useReducedMotion } from "@/lib/motion";
import { useExperience } from "@/state/experience";
import { ButtonLink, Trace } from "@/components/ui";
import { ThreadSegment } from "@/thread/ThreadSegment";

/**
 * Chapter 1 — Hero.
 * The system experience below the copy starts with HUMAN INTENT and AI CAPABILITY and a broken connection.
 * Resolving the gap establishes Context → Knowledge → Interface → Tools → Workflow → Human control → Evidence.
 * Each arrival closes part of the gap; at completion the relationship is continuous and cobalt.
 * The AI did not change. The relationship did.
 */
export function Hero({ scrollToGap }: { scrollToGap: () => void }) {
  const { t, state, dispatch } = useExperience();
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const system = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const [assembled, setAssembled] = useState<boolean>(() => state.heroResolved || reduced);

  // Returning in the same session, or reduced motion: complete state, no animation.
  useEffect(() => { if (state.heroResolved || reduced) setAssembled(true); }, [state.heroResolved, reduced]);

  useLayoutEffect(() => {
    if (reduced || assembled || !system.current) return;
    const root = system.current;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".hero-layer-item", root);
      const left = root.querySelector<SVGLineElement>(".hero-connector-active--left");
      const right = root.querySelector<SVGLineElement>(".hero-connector-active--right");
      gsap.set(items, { autoAlpha: 0, y: 8 });
      gsap.set(left, { attr: { x2: 190 } });
      gsap.set(right, { attr: { x2: 500 } });
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" }, onComplete: () => {
        setAssembled(true);
        dispatch({ type: "heroResolved" });
        gsap.set([items, left, right], { clearProps: "all" });
      } });
      items.forEach((item, i) => {
        const at = i * 0.28;
        tl.to(item, { autoAlpha: 1, y: 0, duration: 0.42 }, at);
        tl.to(item.querySelector(".hero-layer-dot"), { backgroundColor: "#2459e8", borderColor: "#2459e8", duration: 0.3 }, at + 0.1);
        // the left half closes over the first four arrivals, the right half over the last four
        if (i < 4) tl.to(left, { attr: { x2: 190 + (310 * (i + 1)) / 4 }, duration: 0.5, ease: "power1.inOut" }, at);
        if (i >= 3) tl.to(right, { attr: { x2: 500 + (310 * (i - 2)) / 4 }, duration: 0.5, ease: "power1.inOut" }, at + 0.1);
      });
      tl.add(() => root.classList.add("hero-system--closing"), "+=0.05");
      tl.to({}, { duration: 0.35 });
      timeline.current = tl;

      ScrollTrigger.create({ trigger: section.current, start: "top -56px", once: true, onEnter: () => tl.play() });
    }, root);
    // kill, don't revert: after completion React owns the final attributes/classes (reverting would undo them)
    return () => { ctx.kill(); timeline.current = null; };
  }, [reduced, assembled, dispatch]);

  const resolve = () => {
    if (assembled || !timeline.current) { setAssembled(true); dispatch({ type: "heroResolved" }); scrollToGap(); return; }
    timeline.current.timeScale(1.35).play();
    window.setTimeout(scrollToGap, 900);
  };

  return <section className="hero" id="top" aria-labelledby="hero-heading" ref={section}>
    <ThreadSegment id="hero" />
    <div className="hero-inner page-shell">
      <div className="hero-overline meta"><span>{t.hero.studio}</span><span>{t.hero.domain}</span></div>
      <div className="hero-intro">
        <div className="hero-brand-block"><div className="hero-brand-word" aria-label="DYAI">DYAI</div><div className="hero-brand-caption meta">{t.hero.strap}</div></div>
        <div className="hero-copy">
          <h1 id="hero-heading">{t.hero.title}</h1>
          <p>{t.hero.body}</p>
          <div className="hero-actions"><ButtonLink onClick={() => dispatch({ type: "mapper", open: true })}>{t.hero.primary}</ButtonLink><ButtonLink secondary onClick={resolve}>{t.hero.secondary}</ButtonLink></div>
        </div>
      </div>

      <div className={`hero-system ${assembled ? "hero-system--assembled" : ""}`} ref={system} role="group" aria-label={`${t.hero.intent} → ${t.hero.layer} → ${t.hero.outcomeResolved}`}>
        <svg className="hero-connectors" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
          <line className="hero-connector-base" x1="190" y1="60" x2="400" y2="60" />
          <line className="hero-connector-base" x1="600" y1="60" x2="810" y2="60" />
          <line className="hero-connector-gap" x1="400" y1="60" x2="600" y2="60" />
          <line className="hero-connector-active hero-connector-active--left" x1="190" y1="60" x2={assembled ? 500 : 190} y2="60" />
          <line className="hero-connector-active hero-connector-active--right" x1="500" y1="60" x2={assembled ? 810 : 500} y2="60" />
          <rect className="hero-junction" x="496" y="56" width="8" height="8" />
        </svg>

        <div className="hero-pole hero-pole--human">
          <div className="pole-index meta">{t.hero.intent}</div>
          <h2>{t.hero.intentQuestion}</h2>
          <ul className="micro-terms">{t.hero.humanExamples.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>

        <div className="hero-middle">
          <div className="gap-state meta" aria-live="polite"><span className="mini-signal" />{assembled ? t.hero.layer : t.hero.gap}</div>
          <ol className="hero-layer-list" aria-label={t.hero.layer}>
            {t.hero.layerItems.map((item) => <li className="hero-layer-item" key={item}><span className="hero-layer-dot" aria-hidden="true" />{item}</li>)}
          </ol>
          <p className="hero-system-note">{assembled ? t.hero.complete : t.hero.incomplete}</p>
        </div>

        <div className="hero-pole hero-pole--ai">
          <div className="pole-index meta">{t.hero.capability}</div>
          <h2>{t.hero.capabilityQuestion}</h2>
          <ul className="micro-terms">{t.hero.aiExamples.map((w) => <li key={w}>{w}</li>)}</ul>
          <div className="hero-outcome"><span className="meta">{t.hero.outcomeLabel}</span><strong>{assembled ? t.hero.outcomeResolved : t.hero.outcomeUnresolved}</strong></div>
        </div>
      </div>
    </div>
    <div className="hero-foot page-shell">
      <Trace state="broken" resolved={assembled} />
      <span className="hero-foot-note">{assembled ? t.hero.resolvedNote : t.hero.incomplete}</span>
      <span className="hero-scroll meta">{assembled ? "" : t.hero.scroll}{!assembled && <i aria-hidden="true">↓</i>}</span>
    </div>
  </section>;
}
