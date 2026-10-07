import type { Route } from "@/data/model";
import { hrefFor } from "@/lib/routing";
import { useExperience } from "@/state/experience";
import { Mark } from "./ui";

export function Footer({ navigate }: { navigate: (r: Route) => void }) {
  const { t } = useExperience();
  const items: [Route, string][] = [["/organisations", t.nav.organisations], ["/individuals", t.nav.individuals], ["/work", t.nav.work], ["/lab", t.nav.lab], ["/approach", t.nav.approach]];
  return <footer className="site-footer">
    <div className="page-shell footer-main">
      <a href={hrefFor("/")} className="footer-brand" onClick={(e) => { e.preventDefault(); navigate("/"); window.scrollTo({ top: 0 }); }}><Mark /><span>DYAI</span><small>STUDIO</small></a>
      <p>{t.footer.statement}</p>
      <nav className="footer-links" aria-label="Footer">{items.map(([r, label]) => <a key={r} href={hrefFor(r)} onClick={(e) => { e.preventDefault(); navigate(r); window.scrollTo({ top: 0 }); }}>{label}</a>)}</nav>
    </div>
    <div className="page-shell footer-meta">
      <span>© DYAI STUDIO · {t.hero.domain}</span>
      <span>{t.footer.rights} · {t.footer.local}</span>
      <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>↑ {t.nav.backTop}</a>
    </div>
  </footer>;
}
