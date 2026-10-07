import type { ReactNode } from "react";
import type { TraceState } from "@/data/model";
import { useExperience } from "@/state/experience";

export function IconArrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" className="icon-arrow" viewBox="0 0 20 20" fill="none"><path d={diagonal ? "M5 15 15 5M6 5h9v9" : "M3 10h13M11 5l5 5-5 5"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function Mark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>;
}

export function ButtonLink({ children, onClick, secondary = false, className = "", href }: { children: ReactNode; onClick?: () => void; secondary?: boolean; className?: string; href?: string }) {
  const cls = `action-link ${secondary ? "action-link--secondary" : ""} ${className}`;
  if (href) return <a className={cls} href={href}>{children}<IconArrow /></a>;
  return <button className={cls} onClick={onClick} type="button">{children}<IconArrow /></button>;
}

/**
 * The Augmentation Trace glyph. One small SVG whose geometry changes with the chapter's trace state:
 * broken → missing → system → branch → practice → reduced → bounded → reusable → behaviour → loop.
 * Not decoration: it is the same relationship, drawn in its current condition.
 */
export function TraceMark({ state, resolved = false }: { state: TraceState | "resolved"; resolved?: boolean }) {
  const s = resolved && state === "broken" ? "resolved" : state;
  return <svg className={`trace-mark trace-mark--${s}`} viewBox="0 0 48 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    {s === "broken" && <><path d="M2 8h14" /><path d="M32 8h14" /><circle cx="24" cy="8" r="2" strokeDasharray="2 2" /></>}
    {s === "resolved" && <><path d="M2 8h44" /><circle cx="24" cy="8" r="2.4" fill="currentColor" /></>}
    {s === "missing" && <><path d="M2 8h8" /><path d="M14 8h4M22 8h4M30 8h4" strokeDasharray="1 3" /><path d="M38 8h8" /></>}
    {s === "system" && <><path d="M4 8 16 3M4 8l12 5M16 3h14l10 5M16 13h14l10-5" /><circle cx="4" cy="8" r="1.6" fill="currentColor" /><circle cx="16" cy="3" r="1.6" /><circle cx="16" cy="13" r="1.6" /><circle cx="30" cy="3" r="1.6" /><circle cx="30" cy="13" r="1.6" /><circle cx="44" cy="8" r="1.6" fill="currentColor" /></>}
    {s === "branch" && <><path d="M2 8h16" /><path d="M18 8c8 0 8-5 16-5h12M18 8c8 0 8 5 16 5h12" /></>}
    {s === "practice" && <><path d="M2 8h44" /><path d="M8 5v6M16 5v6M24 5v6M32 5v6M40 5v6" /></>}
    {s === "reduced" && <><path d="M2 8h44" /><circle cx="12" cy="8" r="2.2" fill="currentColor" /><circle cx="24" cy="8" r="2.2" fill="currentColor" /><circle cx="36" cy="8" r="2.2" strokeDasharray="1.5 1.5" opacity=".5" /></>}
    {s === "bounded" && <><path d="M8 8h32" /><path d="M8 3v10M40 3v10" /><path d="M2 8h3M43 8h3" strokeDasharray="1 2" /></>}
    {s === "reusable" && <><path d="M2 8h12l6-5 6 5 6-5 6 5h8" /><circle cx="44" cy="8" r="1.6" fill="currentColor" /></>}
    {s === "behaviour" && <><path d="M2 12 14 4l10 8 10-8 12 8" /></>}
    {s === "loop" && <><path d="M2 8h30" /><path d="M32 8a5 5 0 1 0 10 0 5 5 0 1 0-10 0" /><path d="M42 8h4" /><circle cx="2" cy="8" r="1.6" fill="currentColor" /></>}
  </svg>;
}

/** Chapter eyebrow: the trace's current state. Replaces every "01 / SECTION" label of the baseline. */
export function Trace({ state, inverse = false, resolved = false, id }: { state: TraceState; inverse?: boolean; resolved?: boolean; id?: string }) {
  const { t } = useExperience();
  const label = resolved && state === "broken" ? t.trace.resolved : t.trace.states[state];
  return <div className={`trace ${inverse ? "trace--inverse" : ""}`} id={id}>
    <TraceMark state={state} resolved={resolved} />
    <span className="trace-label"><span className="trace-name">{t.trace.label}</span><span aria-hidden="true"> / </span>{label}</span>
  </div>;
}

export function Meta({ children, className = "", as: Tag = "span" }: { children: ReactNode; className?: string; as?: "span" | "div" | "p" }) {
  return <Tag className={`meta ${className}`}>{children}</Tag>;
}
