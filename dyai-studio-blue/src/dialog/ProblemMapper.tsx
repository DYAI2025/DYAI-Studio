import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { AudienceId } from "@/data/model";
import { useExperience } from "@/state/experience";
import { IconArrow, Mark, TraceMark } from "@/components/ui";

/**
 * Problem mapping — a local diagnostic interaction, not a lead form.
 * Five steps in a large side panel. Context from the visit (audience path, map scenario) is used and shown.
 * The synthesis is a preliminary mapping, explicitly not an AI diagnosis. Nothing is sent anywhere.
 */
export function ProblemMapper() {
  const { t, state, dispatch } = useExperience();
  const close = () => dispatch({ type: "mapper", open: false });
  const audience: AudienceId | null = state.audience;
  const scenario = state.scenario;

  const [step, setStep] = useState(0);
  const [person, setPerson] = useState<string>(() => audience === "org" ? t.modal.people[0] : audience === "individual" ? t.modal.people[1] : "");
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [other, setOther] = useState("");
  const [friction, setFriction] = useState<string[]>([]);
  const [today, setToday] = useState("");
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const liveTitle = useRef<HTMLHeadingElement>(null);

  // Focus management: trap focus, Escape closes, restore focus on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add("dialog-open");
    panel.current?.querySelector<HTMLElement>("button:not(.dialog-close), input, textarea")?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Tab" && panel.current) {
        const f = Array.from(panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]"));
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.classList.remove("dialog-open"); previous?.focus(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { liveTitle.current?.focus(); }, [step]);

  const toggle = (v: string, list: string[], set: (l: string[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const otherLabel = t.modal.outcomes[t.modal.outcomes.length - 1];
  const chosenOutcomes = [...outcomes.filter((o) => o !== otherLabel), ...(outcomes.includes(otherLabel) && other.trim() ? [other.trim()] : [])];
  const layers = Array.from(new Set(friction.flatMap((f) => t.modal.frictionLayers[f] ?? [])));
  const frame: AudienceId | null = person === t.modal.people[0] ? "org" : person === t.modal.people[1] || person === t.modal.people[2] ? "individual" : audience;
  const canAdvance = step === 0 ? !!person : step === 1 ? chosenOutcomes.length > 0 : step === 2 ? friction.length > 0 : true;
  const titles = [t.modal.q1, t.modal.q2, t.modal.q3, t.modal.q4, t.modal.synthesis];
  const summary = [person, chosenOutcomes.join(", "), friction.join(", "), today.trim(), scenario ? t.map.scenarios[scenario].title : ""].filter(Boolean).join(" / ");

  async function copySummary() { try { await navigator.clipboard.writeText(summary || t.modal.noNotes); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } }
  function keyAdvance(e: KeyboardEvent) { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && step < 4) setStep(step + 1); }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
    <div className="problem-panel" role="dialog" aria-modal="true" aria-labelledby="mapper-title" ref={panel}>
      <div className="panel-top">
        <span className="wordmark"><Mark /><span>DYAI</span><small>STUDIO</small></span>
        <span className="meta panel-local">{t.modal.local}</span>
        <button className="dialog-close" type="button" onClick={close} aria-label={t.modal.close}>×</button>
      </div>

      <div className="panel-retained" aria-live="polite">
        <span className="meta">{t.modal.retained}</span>
        {audience || scenario ? <ul>
          {audience && <li><span className="meta">{t.modal.retainedAudience}</span><b>{t.audiences.paths[audience].label}</b></li>}
          {scenario && <li><span className="meta">{t.modal.retainedScenario}</span><b>{t.map.scenarios[scenario].title}</b></li>}
        </ul> : <p>{t.modal.retainedNone}</p>}
      </div>

      <div className="panel-progress meta"><span>{t.modal.step} {String(step + 1).padStart(2, "0")} / 05</span><div aria-hidden="true">{titles.map((_, i) => <i key={i} className={i <= step ? "is-active" : ""} />)}</div></div>

      <div className="panel-content" key={step}>
        <span className="meta">{step === 4 ? t.modal.synthesis : `${t.modal.step} ${String(step + 1).padStart(2, "0")}`}</span>
        <h2 id="mapper-title" ref={liveTitle} tabIndex={-1}>{titles[step]}</h2>
        {step === 0 && <div className="choice-list">{t.modal.people.map((p) => <button type="button" key={p} className={person === p ? "is-active" : ""} aria-pressed={person === p} onClick={() => setPerson(p)}><span className="choice-mark" aria-hidden="true" />{p}<IconArrow /></button>)}</div>}
        {step === 1 && <>
          <div className="selectable-options">{t.modal.outcomes.map((o) => <button type="button" key={o} className={outcomes.includes(o) ? "is-active" : ""} aria-pressed={outcomes.includes(o)} onClick={() => toggle(o, outcomes, setOutcomes)}>{o}</button>)}</div>
          {outcomes.includes(otherLabel) && <input className="dialog-input" value={other} onChange={(e) => setOther(e.target.value)} placeholder={t.modal.otherPlaceholder} aria-label={t.modal.otherPlaceholder} />}
        </>}
        {step === 2 && <div className="selectable-options">{t.modal.friction.map((f) => <button type="button" key={f} className={friction.includes(f) ? "is-active" : ""} aria-pressed={friction.includes(f)} onClick={() => toggle(f, friction, setFriction)}>{f}</button>)}</div>}
        {step === 3 && <textarea className="dialog-textarea" value={today} onChange={(e) => setToday(e.target.value)} onKeyDown={keyAdvance} placeholder={t.modal.todayPlaceholder} aria-label={t.modal.q4} />}
        {step === 4 && <div className="synthesis">
          <div className="synthesis-row"><span className="meta">{t.modal.problem}</span><p>{today.trim() || chosenOutcomes.join(", ") || t.modal.noNotes}</p></div>
          <div className="synthesis-row"><span className="meta">{t.modal.gap}</span><p>{chosenOutcomes.length ? chosenOutcomes.join(" + ") : t.modal.noNotes}</p></div>
          <div className="synthesis-row"><span className="meta">{t.modal.inspect}</span><p>{layers.length ? <>{layers.map((l) => <span className="layer-chip" key={l}>{l}</span>)}</> : t.modal.noNotes}</p></div>
          {frame && <div className="synthesis-row"><span className="meta">{t.modal.frame}</span><p>{t.modal.frames[frame]}{scenario ? ` · ${t.map.scenarios[scenario].thesis}` : ""}</p></div>}
          <p className="synthesis-disclaimer"><TraceMark state="loop" /> {t.modal.disclaimer}</p>
        </div>}
      </div>

      <div className="panel-bottom">
        {step > 0 ? <button type="button" className="text-button" onClick={() => setStep(step - 1)}>← {t.modal.back}</button> : <span />}
        {step < 4 ? <button type="button" className="dialog-next" disabled={!canAdvance} onClick={() => setStep(step + 1)}>{step === 3 ? t.modal.finish : t.modal.next}<IconArrow /></button>
          : <div className="panel-final-actions">
            <a className="dialog-next" href={`mailto:hello@dyai.cloud?subject=${encodeURIComponent(t.modal.title)}&body=${encodeURIComponent(summary)}`}>{t.modal.conversation}<IconArrow /></a>
            <button type="button" className="text-button" onClick={() => void copySummary()}>{copied ? t.modal.copied : t.modal.copy}</button>
            <button type="button" className="text-button" onClick={() => { setStep(0); setOutcomes([]); setFriction([]); setToday(""); setOther(""); }}>{t.modal.restart}</button>
            <button type="button" className="text-button" onClick={close}>{t.modal.done}</button>
          </div>}
      </div>
    </div>
  </div>;
}
