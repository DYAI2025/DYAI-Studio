# DYAI-45 — B7 intermittent geometry check: classification and oracle replacement

**Check:** `B7.<width>.<locale>.rect_diffs` in `scripts/verify-blue-thread.py`. In reduced motion, at 1440 / 1024 / 390 px,
EN and DE, after a scenario and an audience path are chosen, it verifies that the Blue Thread moves no other element in
`<main>`. This is the layout half of the "removable without breaking content" acceptance criterion.

**Classification: an invalid hard-gate oracle.** The old check compared integer-rounded rects across two separate page
loads, and that comparison is nondeterministic. The flake is **not a Blue Thread layout effect**: two loads that both had
the thread on showed the same diff. Its underlying source was **not identified**. At the flaking load the fonts reported
`loaded`, with the same face count, header height and scroll position as the other loads, but font identity, the shaping
result and network data were not recorded. Font delivery or text-shaping variance between loads is therefore not excluded.

## Evidence (all files in `probes/`, measured against a scratch build of source commit `64ccf05`)

| Probe | Result |
|---|---|
| `b7_stress.py` → `b7-stress-old-oracle.txt` | The old oracle was run over 144 load pairs (6 rounds × 3 widths × 2 locales × 4 pairings: on/off, on2/off2, on/on2, off/off2). It reproduced **once**, at `r3 1024 DE`: one element, `B.@composer`, rounded rect `515,7436,w,19`, with width `133` in load `on` and `134` in `off`, `on2` and `off2`. The control pair **`on/on2`** (both loads with the thread on) shows the same diff, so the thread is excluded. In both loads the layout settled on the first sample. |
| `boundary_probe.py` → `boundary-probe.txt` | Selected by its flagged rect, the element is the text "Kontextgestaltung", raw width `133.515625` px in a normal load. `Math.round` gives 134 down to 133.5, so the outlier load measured ≤ 133.484375 px, a deviation of **at least 2/64 px**. Its exact size was not captured, because the old oracle logged only rounded values. In this one configuration (1024 px, DE), 129 of the 3344 raw rect values in `<main>` lie within 1/64 px of an x.5 boundary. |
| `raw_probe.py` → `raw-1024-DE.txt`, plus the cross-load columns of `strip-stress-new-oracle.txt` | 12 further loads at 1024 DE (836 elements each) showed **0** raw variation, and 72 further cross-load pairs over all widths and locales showed 0 raw diffs. The variance is rare. PR #1's body records the earlier rate: 10 of 11 full runs green, with one 3-element diff at 1440 before element names were logged. That earlier case is attributed to the same oracle weakness by inference only. |

## Replacement oracle (the smallest deterministic equivalent)

- **before:** rounded rects compared across two separate page loads (`?thread=off` vs on);
- **after:** raw rects compared **within one document**. They are measured with the thread, then again after
  removing its `.bt-seg` nodes, which leaves the DOM that `?thread=off` renders. The comparison is exact equality,
  with no rounding and no tolerance.

**What it covers and what it does not.** The in-document check sees every CSS effect and every DOM-presence effect of
the thread: its own boxes, and the `:has(> .bt-seg)` host rules, which re-evaluate live when the nodes are removed. It
cannot see layout that JavaScript fixes during the first render *because* the thread was mounted, since removing the nodes
does not undo such work. That gap is latent today. `src/` reads no layout (a grep for `getBoundingClientRect`,
`offsetHeight`/`Width`/`Top`, `clientHeight`/`Width`, `ResizeObserver`, `getComputedStyle` and `scrollHeight` over `src/`
finds 0 hits; the same pattern finds 8 in the verifier), and the GSAP pins run only in motion mode, which B7 does not use.
A cross-load comparison with a tolerance was considered and rejected: the size of the jitter between loads is unknown
(≥ 2/64 px), so any tolerance would be a guess and could bring the flake back.

The cross-load checks that are deterministic stay: identical `innerText`, segment counts 10 / 0, the overflow count and
`position` relative / static. One cross-load check was added, `element_keys_equal`: the element list (tag, class and
section) with the thread on must equal the list with `?thread=off`, which ties the in-document removal to the real switch.

## Red / green proof

| Run | Result |
|---|---|
| Clean scratch build, new verifier → `green-run-new-oracle.txt` | 98 / 98 PASS, `TOTAL_FAILS=0`, rc 0 |
| `strip_stress.py` → `strip-stress-new-oracle.txt` | 144 same-document comparisons, **0 diffs**. Over the same loads, 72 cross-load pairs showed 0 rounded and 0 raw diffs. |
| Mutant: `:where(section,.gap-stage):has(> .bt-seg){padding-top:.25px}` appended to the built CSS → `mutant-run-new-oracle.txt` | rc 1, `TOTAL_FAILS=6`. The failed set equals `mutant-targets.txt` exactly (the six `rect_diffs`); 0 untargeted, 0 targets missed. The old oracle was not run against this mutant. |
| Built-in canaries | `B7.canary_1px_shift_detected`, `B7.canary_thread_layout_1px_detected` and `B7.canary_thread_layout_quarter_px_detected` all PASS (each injects a defect, and the check must detect it). |

## Network (CLAUDE.md correction)

`net_probe.py` → `network-origins.txt`: the page was loaded in reduced and full motion, with the hero reveal, scenario,
audience, evidence and composer decisions, the DE switch, every route and a full scroll. Requests went only to the
local origin plus `fonts.googleapis.com` (stylesheet) and `fonts.gstatic.com` (fonts). The bundle's only `fetch` is
Vite's same-origin modulepreload polyfill.
