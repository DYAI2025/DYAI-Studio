# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

DYAI Studio P3+ — "The Semantic Augmentation Experience": a high-fidelity, **local-only click-dummy** of the `studio.dyai.cloud` website (React 19 + TypeScript 5.9 + Vite 7 + GSAP ScrollTrigger). Hard constraints: no backend, no database, no analytics, no external AI API, no real auth, no application/API data calls and no remote persistence. Every dynamic state is simulated in the browser. Don't add network calls. It is not network-silent: the frozen `index.html` loads Geist / Geist Mono from Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`), so every page load requests those font files. Self-hosting the fonts is a separate decision, not part of the frozen baseline.

Project context lives one level up in `../`: `../README.md` (product direction) and `../project-harness/` (operating contract, governance). Systems of record: Confluence space `DYAIStudio` (product truth; canonical design = page 04.3, decision D-015 on page 09), Jira project `DYAI` / board 733 (delivery), GitHub `DYAI2025/DYAI-Studio` (code). The git repo root is `../` (this app lives in its `dyai-studio-blue/` subdirectory).

**Frozen baseline.** Commit `1699df5` is the unmodified P3+ Candidate 01 (`dyai-studio-p3plus.zip`, SHA-256 `3c2f875a…098b38`). Design direction is frozen (D-015): compare changes against that commit, not against memory. `dist-single/index.html` is the frozen hosted-preview artifact from that baseline — keep it as the behavioural reference; build your own single-file output to another `--outDir`.

## Commands

```bash
npm install            # node_modules is not checked in; Node 20+ (built with 22)
npm run dev            # http://localhost:5173
npm run typecheck      # tsc --noEmit — the only automated check
npm run build          # typecheck + multi-file build → dist/
npm run build:single   # typecheck + one self-contained HTML → dist-single/index.html (hosted preview)
npm run preview
```

There is no test runner and no linter. `tsc` (strict, `noUnusedLocals`, `noUnusedParameters`) is the gate. The Blue Thread has a browser verifier, `scripts/verify-blue-thread.py` (Python Playwright, not a project dependency): build to a scratch `--outDir`, `vite preview` it on 4173, then `python3 scripts/verify-blue-thread.py http://localhost:4173/` (set `CHROMIUM_EXECUTABLE` to use a specific Chromium). It exits 0 only if every check passes, and its canary checks inject defects on purpose. Its expected per-chapter vectors are hand-written from the 04.3 semantics, so when `src/thread/model.ts` changes meaning, update those vectors deliberately. Never regenerate them from the model. Behavioural verification has been done manually in headless Chromium at 1440 / 1024 / 390 px widths plus reduced-motion (see README "Verification performed" for what was and was not verified). Never edit `dist-single/index.html` by hand.

Import alias: `@/` → `src/`.

## Architecture

**Structure vs. copy split.** `src/data/model.ts` is the language-independent system model: ids, route list, the 4 scenario geometries (`SYSTEMS`: node coordinates as % of a 1.46:1 canvas, prominence, primary/secondary routes, mobile sequence, `aiCentral`), composer requirements (`COMPOSER`), evidence→lab maturity mapping (`EVIDENCE_TO_LAB`), and lab commands. All human-readable text lives in `src/i18n/en.ts` and `de.ts` (the header comment in `model.ts` still says `copy.ts` — stale). `de` is typed as `Copy` (inferred from `en`), so **EN/DE parity is enforced by tsc**: add a key to `en.ts` and the build fails until `de.ts` has it. Components get copy via `t` from `useExperience()`.

**Shared experience state** (`src/state/experience.tsx`) is the product demonstration: a choice made earlier must visibly influence a later interaction. One `useReducer` in `ExperienceProvider`, persisted to `sessionStorage` key `dyai-p3-experience` (locale additionally to `localStorage` `dyai-locale`; `mapperOpen` is never persisted). Storage failures are swallowed on purpose — the prototype must work without storage. Cross-chapter couplings to preserve when editing:
- Augmentation Map `scenario` → Composer: `effectiveComposer = composerProblem ?? scenario`. Dispatching a new `scenario` resets `composerProblem` and `added` so the composer visibly re-inherits.
- `audience` → ProblemMapper (`src/dialog/`) pre-selects step 1.
- `evidence` maturity → Lab highlight via `EVIDENCE_TO_LAB`.

**Routing** (`src/lib/routing.ts`) is a hand-rolled hook, hash mode by default so the single-file build survives reload anywhere; `ROUTING_MODE = "history"` for a real server deployment. `/principles` is a legacy alias for `/approach`. Adding a route touches: `Route` type + `ROUTES` in `model.ts`, nav copy in both i18n files, the `routeTitle` map in `App.tsx`, and `src/routes/Pages.tsx`. `/` renders the chapter sequence (`src/chapters/`, in `App.tsx` order); every other route renders a `RoutePage`.

**Motion pattern** (`src/lib/motion.ts`), used by every animated chapter:
- `useLayoutEffect` → `gsap.context(..., sectionRef)` → `return () => ctx.revert()`.
- Gate animation on a flag like `animate = canPin && !reduced` (`useReducedMotion`, `useMediaQuery`; `DESKTOP_QUERY` ≥ 900 px, `NARROW_QUERY` ≤ 680 px). With reduced motion or on narrow screens, the chapter must render its **complete final semantic state** without animation — never hide content behind an animation that may not run.
- Include `t` in effect deps where animated elements depend on copy (locale switch re-splits words).
- After layout-changing events call `refreshScroll()` (`App.tsx` already does it on route change, locale change, fonts ready, window load).
- Pins: Gap (desktop ≥ 900 px and ≥ 660 px tall) and Process left column. The Gap thesis is the page's single scrubbed word treatment.

**Styles** are plain CSS in `src/styles/`, one file per chapter group, imported via `index.css`; design tokens are on `:root` in `base.css`. Palette rule: warm paper / graphite / one cobalt `--signal`, and cobalt is **semantic only** (active relationship, selected path, current state, evidence state, focus) — not decoration. Typography floor: nothing below 11 px. Below 680 px spatial layouts become sequential (map rows, stacked accordions, vertical stepper). Fonts: Geist / Geist Mono from Google Fonts in `index.html`.

**Blue Thread** (`src/thread/`, `src/styles/thread.css`; Jira DYAI-45, Confluence 04.3 §5) — the cobalt semantic trace of "the active relationship between human intent and usable capability", built as chapter-local segments, never one page-spanning path. `model.ts` holds the ten thread states, the `BOUNDARIES` shared by neighbouring chapters and the `SEGMENTS` registry (entry / local / exit / glyph, each with a `why`). Type-level asserts at the bottom of `model.ts` fail `tsc` when the chain breaks (exit(N) ≠ entry(N+1), loop not closed, unused state or boundary). Activation reads only explicit visitor decisions plus the hero reveal (`DecisionState`); never bind it to the scroll-driven `stage` or anything scroll-derived (R-BT-05: no false progress). `ThreadSegment` is aria-hidden, static and mounted as the first child of each home chapter section (inside `.gap-stage` for the pinned Gap). Cobalt is consumed only under `[data-bt-line="active"]`. Kill switches: `BLUE_THREAD` constant, or `?thread=off` at runtime for with/without comparisons.

`src/components/ui.tsx` holds shared primitives (`Trace`/`TraceMark` — the "augmentation trace" state label shown per chapter, `ButtonLink`, `Meta`, icons). `ProblemMapper` is a 5-step side-panel dialog with focus trap; Escape must close it.
