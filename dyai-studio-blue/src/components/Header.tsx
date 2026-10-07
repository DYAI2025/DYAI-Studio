import { useEffect, useState, type MouseEvent } from "react";
import type { Locale, Route } from "@/data/model";
import { hrefFor } from "@/lib/routing";
import { refreshScroll } from "@/lib/motion";
import { useExperience } from "@/state/experience";
import { IconArrow, Mark } from "./ui";

type Props = { route: Route; navigate: (r: Route) => void };

export function Header({ route, navigate }: Props) {
  const { t, state, dispatch } = useExperience();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [route]);

  const go = (event: MouseEvent<HTMLAnchorElement>, target: Route) => { event.preventDefault(); navigate(target); window.scrollTo({ top: 0, behavior: "auto" }); };
  const items: [Route, string][] = [["/organisations", t.nav.organisations], ["/individuals", t.nav.individuals], ["/work", t.nav.work], ["/lab", t.nav.lab], ["/approach", t.nav.approach]];

  return <header className={`site-header ${compact ? "site-header--compact" : ""}`}>
    <div className="header-inner">
      <a className="wordmark" href={hrefFor("/")} onClick={(e) => go(e, "/")} aria-label="DYAI Studio — home"><Mark /><span>DYAI</span><small>{t.nav.home.toUpperCase()}</small></a>
      <nav id="primary-nav" className={`primary-nav ${open ? "primary-nav--open" : ""}`} aria-label={t.nav.primary}>
        {items.map(([r, label]) => <a key={r} href={hrefFor(r)} aria-current={route === r ? "page" : undefined} onClick={(e) => go(e, r)}>{label}</a>)}
        <div className="mobile-nav-utility"><LanguageSwitch /><button className="mobile-map-link" type="button" onClick={() => { dispatch({ type: "mapper", open: true }); setOpen(false); }}>{t.nav.map}<IconArrow /></button></div>
      </nav>
      <div className="header-actions"><LanguageSwitch /><button className="header-cta" type="button" onClick={() => dispatch({ type: "mapper", open: true })}>{t.nav.map}<IconArrow /></button></div>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="primary-nav" aria-label={open ? t.nav.close : t.nav.menu} onClick={() => setOpen(!open)}><span /><span /></button>
    </div>
    <span className="sr-only" aria-live="polite">{state.locale === "DE" ? "Sprache: Deutsch" : "Language: English"}</span>
  </header>;
}

export function LanguageSwitch() {
  const { t, state, dispatch } = useExperience();
  const set = (locale: Locale) => { dispatch({ type: "locale", locale }); refreshScroll(120); };
  return <div className="language-switch" role="group" aria-label={t.nav.language}>
    {(["EN", "DE"] as const).map((l) => <button key={l} type="button" aria-pressed={state.locale === l} onClick={() => set(l)} lang={l === "DE" ? "de" : "en"}>{l}</button>)}
  </div>;
}
