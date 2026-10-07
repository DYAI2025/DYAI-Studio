import { useState } from "react";
import { EVIDENCE_IDS, type AudienceId, type EvidenceId, type Route } from "@/data/model";
import { useExperience } from "@/state/experience";
import { ButtonLink, Trace, TraceMark } from "@/components/ui";
import { VisualCommandLab } from "@/chapters/VisualCommandLab";

/**
 * Route pages. Simpler than the homepage by design; they inherit typography, palette, signal logic,
 * the Augmentation Trace, evidence discipline and problem-first behaviour.
 */
export function RoutePage({ route }: { route: Route }) {
  if (route === "/organisations") return <AudiencePage kind="org" />;
  if (route === "/individuals") return <AudiencePage kind="individual" />;
  if (route === "/work") return <WorkPage />;
  if (route === "/lab") return <LabPage />;
  return <ApproachPage />;
}

function RouteEnd({ title }: { title: string }) {
  const { t, dispatch } = useExperience();
  return <section className="route-end dark-section"><div className="page-shell"><Trace state="loop" inverse /><h2>{title}</h2><ButtonLink onClick={() => dispatch({ type: "mapper", open: true })}>{t.final.primary}</ButtonLink></div></section>;
}

function AudiencePage({ kind }: { kind: AudienceId }) {
  const { t, dispatch, state } = useExperience();
  const page = t.pages[kind === "org" ? "org" : "individual"];
  const path = t.audiences.paths[kind];
  const open = () => { dispatch({ type: "audience", audience: kind }); dispatch({ type: "mapper", open: true }); };
  return <div className="route-page">
    <section className="route-hero page-shell">
      <Trace state="branch" />
      <span className="meta route-kicker">{path.label}{state.audience === kind && <em> · {t.audiences.selected}</em>}</span>
      <h1>{page.title}</h1><p>{page.intro}</p>
      <ButtonLink onClick={open}>{page.cta}</ButtonLink>
    </section>
    <section className="route-problem dark-section"><div className="page-shell route-problem-grid"><div><span className="meta">{page.problemLabel}</span><h2>{page.problem}</h2></div><p>{page.problemText}</p></div></section>
    <section className="route-stages page-shell">
      <span className="meta">{page.modelLabel}</span><h2 className="chapter-title">{page.model}</h2>
      <ol className="route-stage-list">{page.stages.map((s, i) => <li key={s.title}><span className="meta">{String(i + 1).padStart(2, "0")}</span><h3>{s.title}</h3><p>{s.text}</p><i aria-hidden="true">{i < page.stages.length - 1 ? "→" : "↺"}</i></li>)}</ol>
      <div className="route-fields">
        <div><span className="meta">{t.audiences.fields.problem}</span><p>{path.problem}</p></div>
        <div><span className="meta">{t.audiences.fields.change}</span><p>{path.change}</p></div>
        <div><span className="meta">{t.audiences.fields.system}</span><p>{path.system}</p></div>
        <div><span className="meta">{t.audiences.fields.entry}</span><p>{path.entry}</p></div>
      </div>
      <p className="route-close-note">{page.close}</p>
    </section>
    <RouteEnd title={t.pages.end} />
  </div>;
}

function WorkPage() {
  const { t } = useExperience();
  const [filter, setFilter] = useState<"all" | EvidenceId>("all");
  const page = t.pages.work;
  const records = page.records.filter((r) => filter === "all" || r.state === filter);
  return <div className="route-page">
    <section className="route-hero page-shell"><Trace state="bounded" /><h1>{page.title}</h1><p>{page.intro}</p><p className="work-integrity-note meta"><span className="mini-signal mini-signal--on" aria-hidden="true" />{page.conceptual}</p></section>
    <section className="work-library"><div className="page-shell">
      <div className="work-filter-head"><span className="meta">{page.filter}</span><div className="work-filters" role="group" aria-label={page.filter}>
        <button type="button" className={filter === "all" ? "is-active" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{page.all}</button>
        {EVIDENCE_IDS.map((id) => <button type="button" key={id} className={filter === id ? "is-active" : ""} aria-pressed={filter === id} onClick={() => setFilter(id)}>{t.evidence.levels[id].label}</button>)}
      </div></div>
      <div className="work-record-list" aria-live="polite">
        {records.length ? records.map((r, i) => <article className="work-record" key={r.title}><span className="meta">{String(i + 1).padStart(2, "0")}</span><div><span className="meta work-record-status">{t.evidence.levels[r.state].label} · {page.conceptual}</span><h2>{r.title}</h2><p>{r.text}</p><div className="work-record-proof"><span className="meta">{t.evidence.proves}</span><ul>{t.evidence.levels[r.state].proves.map((p) => <li key={p}>{p}</li>)}</ul><span className="meta">{t.evidence.notProves}</span><ul>{t.evidence.levels[r.state].not.map((p) => <li key={p}>{p}</li>)}</ul></div></div></article>)
          : <p className="work-empty">{page.empty}</p>}
      </div>
    </div></section>
  </div>;
}

function LabPage() {
  const { t } = useExperience();
  const page = t.pages.lab;
  return <div className="route-page">
    <section className="route-hero page-shell"><Trace state="reusable" /><h1>{page.title}</h1><p>{page.intro}</p>
      <ol className="route-system-line">{page.sequence.map((s, i) => <li key={s}>{s}{i < page.sequence.length - 1 && <i aria-hidden="true">→</i>}</li>)}</ol>
      <p className="route-close-note">{page.note}</p></section>
    <section className="lab-route-body dark-section"><div className="page-shell">
      <div className="lab-route-intro"><span className="meta experiment-label"><span className="status-dot" aria-hidden="true" />{t.lab.currentExperiment}</span><h2>{t.lab.vclHeadline}</h2><p><span className="meta">{t.lab.hypothesis}</span> {t.lab.vclBody}</p></div>
      <VisualCommandLab />
    </div></section>
  </div>;
}

function ApproachPage() {
  const { t } = useExperience();
  const page = t.pages.approach;
  return <div className="route-page">
    <section className="route-hero page-shell"><Trace state="behaviour" /><h1>{page.title}</h1><p>{page.intro}</p>
      <div className="route-trace-line meta"><span>{t.hero.intent}</span><TraceMark state="resolved" /><span>{t.hero.layer}</span><TraceMark state="resolved" /><span>{t.hero.outcomeResolved}</span></div></section>
    <section className="principles-route page-shell">
      <ol className="principle-list principle-list--static">{t.principles.items.map((p, i) => <li className="principle is-static" key={p.title}><span className="principle-no meta">{String(i + 1).padStart(2, "0")}</span><div><span className="principle-title">{p.title}</span><p className="principle-consequence">{p.consequence}</p></div></li>)}</ol>
      <p className="route-close-note">{page.close}</p>
    </section>
    <RouteEnd title={t.pages.end} />
  </div>;
}
