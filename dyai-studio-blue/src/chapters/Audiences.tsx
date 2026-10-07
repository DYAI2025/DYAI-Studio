import { useLayoutEffect, useRef } from "react";
import type { AudienceId, Route } from "@/data/model";
import { gsap, useMediaQuery, useReducedMotion, NARROW_QUERY } from "@/lib/motion";
import { useExperience } from "@/state/experience";
import { ButtonLink, Trace } from "@/components/ui";

const PATHS: AudienceId[] = ["org", "individual"];

/**
 * Chapter 4 — Two working systems.
 * Desktop: two adjacent vertical fields, 50/50. Selecting one expands it to ~62/38 and reveals
 * problem → change → system → entry route. The other path stays visible: same principle, different context.
 * Mobile: two stacked accordions.
 */
export function Audiences({ navigate }: { navigate: (r: Route) => void }) {
  const { t, state, dispatch } = useExperience();
  const reduced = useReducedMotion();
  const narrow = useMediaQuery(NARROW_QUERY);
  const grid = useRef<HTMLDivElement>(null);
  const selected = state.audience;

  useLayoutEffect(() => {
    if (narrow || !grid.current) return;
    // 50/50 → 62/38 when the left path is selected, 38/62 for the right path.
    const split = selected === "org" ? 62 : selected === "individual" ? 38 : 50;
    if (reduced) { grid.current.style.setProperty("--split", String(split)); return; }
    const tw = gsap.to(grid.current, { "--split": split, duration: 0.7, ease: "power3.inOut" });
    return () => { tw.kill(); };
  }, [selected, reduced, narrow]);

  useLayoutEffect(() => {
    if (!grid.current || reduced || !selected) return;
    const items = grid.current.querySelectorAll(`.audience-path--${selected} .path-details > div`);
    const tw = gsap.fromTo(items, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.08, delay: 0.2, clearProps: "all" });
    return () => { tw.kill(); };
  }, [selected, reduced]);

  const toggle = (id: AudienceId) => dispatch({ type: "audience", audience: selected === id ? null : id });

  return <section className="audience-section chapter" id="audiences" aria-labelledby="audience-heading">
    <div className="page-shell">
      <Trace state="branch" />
      <div className="chapter-heading-row"><div><h2 className="chapter-title" id="audience-heading">{t.audiences.title}</h2><p className="chapter-intro">{t.audiences.intro}</p></div></div>

      <div className={`audience-grid ${selected ? `audience-grid--${selected}` : ""} ${narrow ? "audience-grid--stacked" : ""}`} ref={grid}>
        {PATHS.map((id) => {
          const p = t.audiences.paths[id];
          const isSel = selected === id;
          const route: Route = id === "org" ? "/organisations" : "/individuals";
          return <article key={id} className={`audience-path audience-path--${id} ${isSel ? "is-selected" : selected ? "is-other" : ""}`}>
            <button type="button" className="path-toggle" aria-expanded={isSel} aria-controls={`path-${id}`} onClick={() => toggle(id)}>
              <span className="path-kicker meta"><span className="path-kicker-dot" aria-hidden="true" />{p.label}{isSel && <em>{t.audiences.selected}</em>}</span>
              <h3>{p.title}</h3>
              <span className="path-hint meta" aria-hidden="true">{isSel ? "−" : "+"} {t.audiences.selectHint}</span>
            </button>
            <p className="path-body">{p.body}</p>
            <div id={`path-${id}`} className="path-details" hidden={!isSel}>
              <div><span className="meta">{t.audiences.fields.problem}</span><p>{p.problem}</p></div>
              <div><span className="meta">{t.audiences.fields.change}</span><p>{p.change}</p></div>
              <div><span className="meta">{t.audiences.fields.system}</span><p>{p.system}</p></div>
              <div><span className="meta">{t.audiences.fields.entry}</span><p>{p.entry}</p></div>
              <div><ButtonLink secondary onClick={() => { navigate(route); window.scrollTo({ top: 0 }); }}>{p.cta}</ButtonLink></div>
            </div>
            {!isSel && selected && <p className="path-other meta">{t.audiences.other}</p>}
          </article>;
        })}
      </div>
      <p className="audience-shared meta"><span className="signal-line" aria-hidden="true" />{t.audiences.shared}</p>
    </div>
  </section>;
}
