import { useLayoutEffect, useRef } from "react";
import { gsap, useMediaQuery, useReducedMotion } from "@/lib/motion";
import { useExperience } from "@/state/experience";
import { Trace } from "@/components/ui";

/**
 * Chapter 2 — The Gap. Graphite. Diagnosis, not repetition of the hero.
 * Desktop: a short pinned sequence. Nine unresolved questions appear one by one; each one is a relationship
 * still missing between "the model could do this" and "I can use this naturally".
 * The final thesis is the page's single scrubbed word treatment.
 * Mobile / reduced motion: everything visible, no pin.
 */
export function Gap() {
  const { t } = useExperience();
  const reduced = useReducedMotion();
  const canPin = useMediaQuery("(min-width: 900px) and (min-height: 660px)");
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const animate = canPin && !reduced;

  useLayoutEffect(() => {
    if (!animate || !section.current || !stage.current) return;
    const ctx = gsap.context(() => {
      const questions = gsap.utils.toArray<HTMLElement>(".gap-question", stage.current);
      const segments = gsap.utils.toArray<SVGLineElement>(".gap-bridge-seg", stage.current);
      const words = gsap.utils.toArray<HTMLElement>(".gap-thesis .word", stage.current);
      gsap.set(questions, { autoAlpha: 0.12, y: 6 });
      gsap.set(words, { opacity: 0.16 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section.current, start: "top top", end: "+=1700", pin: stage.current, scrub: 0.5, anticipatePin: 1 },
        defaults: { ease: "none" },
      });
      questions.forEach((q, i) => {
        tl.to(q, { autoAlpha: 1, y: 0, duration: 0.6 }, i * 0.7);
        if (segments[i]) tl.to(segments[i], { stroke: "#2459e8", strokeDasharray: "0 0", duration: 0.4 }, i * 0.7 + 0.2);
      });
      tl.to({}, { duration: 0.6 });
      words.forEach((w) => tl.to(w, { opacity: 1, duration: 0.35 }, ">-0.12"));
      tl.to({}, { duration: 0.8 });
    }, section.current);
    return () => ctx.revert();
  }, [animate, t]);

  const thesisWords = (text: string, cls: string) => text.split(" ").map((w, i) => <span className={`word ${cls}`} key={`${cls}-${i}`}>{w} </span>);

  return <section className={`gap-section dark-section ${animate ? "gap-section--pinned" : ""}`} id="gap" aria-labelledby="gap-heading" ref={section}>
    <div className="gap-stage" ref={stage}>
      <div className="page-shell gap-inner">
        <Trace state="missing" inverse />
        <h2 className="chapter-title chapter-title--light" id="gap-heading">{t.gap.title}</h2>

        <div className="gap-poles">
          <div className="gap-quote"><span className="meta">{t.gap.leftLabel}</span><p>“{t.gap.left}”</p></div>
          <div className="gap-bridge" aria-hidden="true">
            <span className="meta">{t.gap.middle}</span>
            <svg viewBox="0 0 180 12" preserveAspectRatio="none">
              {Array.from({ length: 9 }, (_, i) => <line key={i} className="gap-bridge-seg" x1={i * 20 + 2} x2={i * 20 + 16} y1="6" y2="6" strokeDasharray="2 3" />)}
            </svg>
          </div>
          <div className="gap-quote gap-quote--right"><span className="meta">{t.gap.rightLabel}</span><p>“{t.gap.right}”</p></div>
        </div>

        <div className="gap-questions-block">
          <p className="gap-intro">{t.gap.intro}</p>
          <ol className="gap-questions">
            {t.gap.questions.map((q, i) => <li className="gap-question" key={q}><i>{String(i + 1).padStart(2, "0")}</i><span>{q}</span></li>)}
          </ol>
        </div>

        <p className="gap-thesis" aria-label={`${t.gap.thesisA} ${t.gap.thesisB}`}>
          <span className="signal-line" aria-hidden="true" />
          <span className="gap-thesis-text"><span className="gap-thesis-a">{thesisWords(t.gap.thesisA, "a")}</span><span className="gap-thesis-b">{thesisWords(t.gap.thesisB, "b")}</span></span>
        </p>
        {animate && <span className="gap-scroll-hint meta">{t.gap.scrollHint}</span>}
      </div>
    </div>
  </section>;
}
