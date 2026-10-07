# DYAI STUDIO P3+ — The Semantic Augmentation Experience

High-fidelity click-dummy. Local only: no backend, no database, no analytics, no external AI API, no real authentication, nothing stored remotely. Every dynamic state is simulated.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + multi-file build → dist/
npm run build:single # typecheck + one self-contained HTML → dist-single/index.html
```

Node 20+ recommended (built with Node 22, Vite 7, React 19, TypeScript 5.9, GSAP 3.15).

## Routing

Hash routing (`#/organisations`, `#/individuals`, `#/work`, `#/lab`, `#/approach`) so the single-file build survives reload anywhere, including the hosted preview. `/principles` redirects to `/approach`. For a real deployment behind a server that rewrites to `index.html`, switch `ROUTING_MODE` in `src/lib/routing.ts` to `"history"`.

## Structure

```
src/
  data/model.ts          language-independent system model: layers, 4 scenario geometries, routes,
                         prominence, composer requirements, lab↔evidence mapping, the 12 commands
  i18n/en.ts, de.ts      all copy (DE is typed against EN, so parity is checked by tsc)
  state/experience.tsx   shared experience state (sessionStorage) — scenario, layer, audience, stage,
                         composer problem + added capabilities, evidence stage, locale
  lib/motion.ts          GSAP + ScrollTrigger registration, reduced-motion + media hooks
  lib/routing.ts         hash/history router
  components/            Header, Footer, ui (Trace / TraceMark, buttons)
  chapters/              Hero, Gap, AugmentationMap, Audiences, Process, Composer, Evidence,
                         Lab (+ VisualCommandLab), Principles, FinalCta
  routes/Pages.tsx       Organisations, Individuals, Work & Evidence, Lab, Approach
  dialog/ProblemMapper   5-step local problem mapping (side panel, focus trap, retained context)
  styles/                plain CSS, split per chapter; tokens in base.css
```

## State continuity (the product demonstration)

- Augmentation Map scenario → Capability Composer opens on the same problem (label: "Inherited from the Augmentation Map").
- Audience path → problem mapping pre-selects step 1 and frames the synthesis; both retained selections are shown in the panel.
- Evidence maturity → Lab maturity highlight (Concept/Prototype → Experiment, Used → Used, Repeated → Repeated, Measured → Productised).
- Process stage, selected map layer, hero resolution and locale persist for the session tab.

## Motion

GSAP ScrollTrigger pinning: Gap diagnosis (desktop ≥ 900 px and ≥ 660 px tall), Process left column (desktop). Scrubbed reveals: Gap questions + the single word-scrub thesis, Process trace. Timelines: hero resolution, map geometry interpolation, audience split, composer assembly, lab maturity. `prefers-reduced-motion` renders every complete semantic state without animation. Below 680 px spatial layouts become sequential (map rows, stacked audience accordions, vertical stepper).

## Typography

Geist Sans + Geist Mono via Google Fonts (`index.html`). Body 16–18 px, important metadata 12–13 px, secondary metadata 11 px, nothing below 11 px. `®` removed from the wordmark (registration not verified).

## Verification performed (headless Chromium, see the delivery note)

Typecheck + build clean; 1440 / 1024 / 390 walk-throughs; no runtime errors; no horizontal overflow at 390; no text below 11 px; reduced-motion complete states; Escape closes the dialog; both hero activation paths resolve; coordination scenario marks AI as OPTIONAL and the composer contains no LLM by default; adding an unnecessary capability raises the complexity question.

Not verified: formal accessibility compliance (screen-reader walk-through, WCAG audit), real-device Safari/iOS behaviour, real-world performance on low-end hardware.
