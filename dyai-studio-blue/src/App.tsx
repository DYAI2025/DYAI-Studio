import { useEffect } from "react";
import type { Route } from "@/data/model";
import { useRoute } from "@/lib/routing";
import { refreshScroll, ScrollTrigger } from "@/lib/motion";
import { ExperienceProvider, useExperience } from "@/state/experience";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/chapters/Hero";
import { Gap } from "@/chapters/Gap";
import { AugmentationMap } from "@/chapters/AugmentationMap";
import { Audiences } from "@/chapters/Audiences";
import { Process } from "@/chapters/Process";
import { Composer } from "@/chapters/Composer";
import { Evidence } from "@/chapters/Evidence";
import { Lab } from "@/chapters/Lab";
import { Principles } from "@/chapters/Principles";
import { FinalCta } from "@/chapters/FinalCta";
import { RoutePage } from "@/routes/Pages";
import { ProblemMapper } from "@/dialog/ProblemMapper";

export default function App() {
  return <ExperienceProvider><Shell /></ExperienceProvider>;
}

function Shell() {
  const { t, state } = useExperience();
  const [route, navigate] = useRoute();

  useEffect(() => {
    document.title = route === "/" ? t.meta.title : `${routeTitle(route)} — DYAI Studio`;
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    refreshScroll(80);
    function routeTitle(r: Route) {
      return ({ "/organisations": t.nav.organisations, "/individuals": t.nav.individuals, "/work": t.nav.work, "/lab": t.nav.lab, "/approach": t.nav.approach, "/": t.nav.home } as Record<Route, string>)[r];
    }
  }, [route, t]);

  // Language switch changes copy lengths → re-measure scroll choreography.
  useEffect(() => { refreshScroll(140); }, [state.locale]);
  useEffect(() => { const onLoad = () => ScrollTrigger.refresh(); window.addEventListener("load", onLoad); document.fonts?.ready.then(() => ScrollTrigger.refresh()); return () => window.removeEventListener("load", onLoad); }, []);

  const scrollToGap = () => document.getElementById("gap")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <>
    <a className="skip-link" href="#main">{t.meta.skip}</a>
    <Header route={route} navigate={navigate} />
    <main id="main">
      {route === "/" ? <>
        <Hero scrollToGap={scrollToGap} />
        <Gap />
        <AugmentationMap />
        <Audiences navigate={navigate} />
        <Process />
        <Composer />
        <Evidence navigate={navigate} />
        <Lab />
        <Principles />
        <FinalCta />
      </> : <RoutePage route={route} />}
    </main>
    <Footer navigate={navigate} />
    {state.mapperOpen && <ProblemMapper />}
  </>;
}
