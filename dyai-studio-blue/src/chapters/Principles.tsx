import { useLayoutEffect, useRef } from "react";
import { gsap, useReducedMotion } from "@/lib/motion";
import { useExperience } from "@/state/experience";
import { Trace } from "@/components/ui";

/**
 * Chapter 9 — Principles / Why DYAI, merged into one editorial chapter. No cards.
 * Large statements; each reveals one operational consequence on hover, focus, or scroll (touch).
 * Followed by the relational chain Workflow → Technology → Organisation → Learning → Governance.
 */
export function Principles() {
  const { t } = useExperience();
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (reduced || !section.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".principle", section.current).forEach((el) => {
        gsap.fromTo(el, { autoAlpha: 0.2, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.55, scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" } });
      });
    }, section.current);
    return () => ctx.revert();
  }, [reduced]);

  return <section className="principles-section chapter" id="principles" aria-labelledby="principles-heading" ref={section}>
    <div className="page-shell">
      <Trace state="behaviour" />
      <div className="chapter-heading-row"><div><h2 className="chapter-title" id="principles-heading">{t.principles.title}</h2><p className="chapter-intro">{t.principles.intro}</p></div></div>

      <ol className="principle-list">
        {t.principles.items.map((p, i) => <li className="principle" key={p.title}>
          <button type="button" className="principle-toggle" aria-describedby={`consequence-${i}`}>
            <span className="principle-no meta">{String(i + 1).padStart(2, "0")}</span>
            <span className="principle-title">{p.title}</span>
          </button>
          <p className="principle-consequence" id={`consequence-${i}`}>{p.consequence}</p>
        </li>)}
      </ol>

      <div className="relational-chain" aria-label={t.principles.chain.join(" → ")}>
        <ol>{t.principles.chain.map((c, i) => <li key={c}><span>{c}</span>{i < t.principles.chain.length - 1 && <i aria-hidden="true">→</i>}</li>)}</ol>
        <p>{t.principles.chainStatement}</p>
      </div>
    </div>
  </section>;
}
