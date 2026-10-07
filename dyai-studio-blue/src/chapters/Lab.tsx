import { useLayoutEffect, useRef, useState } from "react";
import { EVIDENCE_TO_LAB, LAB_MATURITY } from "@/data/model";
import { gsap, ScrollTrigger, useReducedMotion } from "@/lib/motion";
import { useExperience } from "@/state/experience";
import { ButtonLink, Trace } from "@/components/ui";
import { VisualCommandLab } from "./VisualCommandLab";

/**
 * Chapter 8 — DYAI Lab. Dark, experimental.
 * Evidence creates the right to reuse: Experiment → Used → Repeated → Productised, linked to the Evidence chapter.
 * Reusable assets are possible outputs of repeated validated learning — not a catalogue.
 * The Visual Command Lab is the CURRENT EXPERIMENT, deliberately less dominant than the Augmentation Map.
 */
export function Lab() {
  const { t, state } = useExperience();
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const labState = EVIDENCE_TO_LAB[state.evidence];
  const labIndex = LAB_MATURITY.indexOf(labState);

  useLayoutEffect(() => {
    if (reduced || !section.current) return;
    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray<HTMLElement>(".maturity-step", section.current);
      gsap.fromTo(steps, { autoAlpha: 0.25, y: 8 }, { autoAlpha: 1, y: 0, stagger: 0.14, duration: 0.5, scrollTrigger: { trigger: ".maturity-rail", start: "top 78%", once: true } });
      gsap.fromTo(".maturity-fill", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power2.inOut", scrollTrigger: { trigger: ".maturity-rail", start: "top 78%", once: true } });
    }, section.current);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced]);

  return <section className="lab-section dark-section chapter" id="lab" aria-labelledby="lab-heading" ref={section}>
    <div className="page-shell">
      <Trace state="reusable" inverse />
      <div className="chapter-heading-row"><div><h2 className="chapter-title chapter-title--light" id="lab-heading">{t.lab.title}</h2><p className="chapter-intro chapter-intro--light">{t.lab.intro}</p></div></div>

      <div className="maturity-rail" role="list" aria-label={t.lab.linked}>
        <span className="maturity-line" aria-hidden="true"><span className="maturity-fill" style={{ transformOrigin: "left", width: `${(labIndex / (LAB_MATURITY.length - 1)) * 100}%` }} /></span>
        {LAB_MATURITY.map((m, i) => <div key={m} role="listitem" className={`maturity-step ${i === labIndex ? "is-active" : i < labIndex ? "is-past" : ""}`}>
          <span className="maturity-dot" aria-hidden="true" /><span className="meta">{String(i + 1).padStart(2, "0")}</span><b>{t.lab.maturity[m].label}</b><small>{t.lab.maturity[m].note}</small>
        </div>)}
      </div>
      <p className="maturity-link meta" aria-live="polite"><span className="mini-signal mini-signal--on" aria-hidden="true" />{t.lab.linked}: {t.lab.linkedNote} <b>{t.evidence.levels[state.evidence].label}</b> → {t.lab.labState} <b>{t.lab.maturity[labState].label}</b></p>

      <div className="lab-assets">
        <div><h3>{t.lab.assetsTitle}</h3><span className="meta">{t.lab.assetsNote}</span></div>
        <ul>{t.lab.assets.map((a) => <li key={a}>{a}</li>)}</ul>
      </div>

      <div className="experiment">
        <div className="experiment-intro">
          <span className="meta experiment-label"><span className="status-dot" aria-hidden="true" />{t.lab.currentExperiment}</span>
          <h3>{t.lab.vclHeadline}</h3>
          <p><span className="meta">{t.lab.hypothesis}</span> {t.lab.vclBody}</p>
          <div className="experiment-steps meta">{t.lab.vclSteps.map((s, i) => <span key={s}><b>{String(i + 1).padStart(2, "0")}</b>{s}</span>)}</div>
          {!open && <ButtonLink onClick={() => setOpen(true)}>{t.lab.open}</ButtonLink>}
          {open && <button type="button" className="text-button text-button--light" onClick={() => setOpen(false)}>{t.lab.close}</button>}
        </div>
        {open ? <VisualCommandLab compact /> : <div className="experiment-teaser" aria-hidden="true"><span className="meta">{t.lab.vclTitle}</span><div className="experiment-sample"><b>/mindmap</b><i /><i /><i /><small>{t.lab.simulation}</small></div></div>}
      </div>
    </div>
  </section>;
}
