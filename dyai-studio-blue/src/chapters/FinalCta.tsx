import { useExperience } from "@/state/experience";
import { ButtonLink, Trace, TraceMark } from "@/components/ui";
import { ThreadSegment } from "@/thread/ThreadSegment";

/**
 * Chapter 10 — Final CTA. Graphite. The loop closes: the site began with a real problem and ends by asking for one.
 */
export function FinalCta() {
  const { t, dispatch } = useExperience();
  return <section className="final-section dark-section" id="map-problem" aria-labelledby="final-heading">
    <ThreadSegment id="final" />
    <div className="page-shell final-layout">
      <div>
        <Trace state="loop" inverse />
        <h2 id="final-heading">{t.final.title}</h2>
        <div className="final-trace" aria-hidden="true"><TraceMark state="loop" /><span className="meta">{t.final.loopNote}</span></div>
      </div>
      <div className="final-content">
        <p>{t.final.body}</p>
        <ul className="final-outcomes">{t.final.outcomes.map((o) => <li key={o}><span className="mini-signal mini-signal--on" aria-hidden="true" />{o}</li>)}</ul>
        <div className="final-actions"><ButtonLink onClick={() => dispatch({ type: "mapper", open: true })}>{t.final.primary}</ButtonLink><a href="mailto:hello@dyai.cloud" className="conversation-link">{t.final.secondary} ↗</a></div>
      </div>
    </div>
  </section>;
}
