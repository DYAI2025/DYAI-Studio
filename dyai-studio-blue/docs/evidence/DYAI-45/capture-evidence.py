"""DYAI-45 (Blue Thread, Slice 1) visual evidence capture.

Captures human-inspectable screenshots of a served build and writes manifest.json + MANIFEST.md next to them.
Every state field in the manifest is read back from the page (sessionStorage `dyai-p3-experience`, the rendered
thread vector, the served bundle names, font status), not typed by hand.

Usage (from dyai-studio-blue/):
    npx vite build --outDir <scratch>/bt-dist --emptyOutDir
    npx vite preview --outDir <scratch>/bt-dist --port 4173 --strictPort &
    python3 docs/evidence/DYAI-45/capture-evidence.py http://localhost:4173/ docs/evidence/DYAI-45 <source-sha>

Requires Python Playwright. Set CHROMIUM_EXECUTABLE to use a specific Chromium/headless-shell binary.
"""
import hashlib, json, os, sys
from playwright.sync_api import sync_playwright

BASE, OUT, SHA = sys.argv[1], sys.argv[2], sys.argv[3]
EXE = os.environ.get("CHROMIUM_EXECUTABLE")
H = {1440: 900, 1024: 768, 390: 844}
SCENARIO, AUDIENCE, REPEATED, REVEAL = ".scenario-tabs button", ".path-toggle", "#ev-tab-repeated", ".hero-actions .action-link--secondary"
CHAIN = ["hero", "gap", "map", "audiences", "process", "composer", "evidence", "lab", "principles", "final"]
VECTOR = """() => [...document.querySelectorAll('.bt-seg')].map(s => s.dataset.btChapter + ':' +
  ['entry','mark','exit'].map(k => s.querySelector('.bt-piece--' + k).dataset.btLine === 'active' ? 'A' : 'P').join('')).join(' ')"""
PROBE = """() => { const ss = JSON.parse(sessionStorage.getItem('dyai-p3-experience') || '{}');
  return { experience: { scenario: ss.scenario ?? null, audience: ss.audience ?? null, composerProblem: ss.composerProblem ?? null,
             evidence: ss.evidence ?? null, heroResolved: ss.heroResolved ?? null },
           locale: document.documentElement.lang, segments: document.querySelectorAll('.bt-seg').length,
           activePieces: document.querySelectorAll('.bt-piece[data-bt-line=active]').length,
           potentialPieces: document.querySelectorAll('.bt-piece[data-bt-line=potential]').length,
           reducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
           fonts: { status: document.fonts.status, geistLoaded: [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Geist' && f.status === 'loaded') },
           bundle: [...document.querySelectorAll('script[src], link[rel=stylesheet]')].map(e => (e.src || e.href).replace(location.origin, '')),
           scrollWidthMinusClient: document.documentElement.scrollWidth - document.documentElement.clientWidth }; }"""

# (file, width, reduced_motion, decisions, kind, purpose). decisions: ordered actions taken after a fresh session load.
SHOTS = [
    ("01-1440-reduced-fresh-full.png", 1440, True, [], "full", "fresh session: every piece gated on a visitor decision is potential (grey, dashed, 1px); only the hero reveal is resolved, because reduced motion shows the hero's complete static state"),
    ("02-1440-reduced-selected-full.png", 1440, True, ["scenario", "audience", "repeated"], "full", "selected state: scenario + audience + Repeated evidence turn every decision-gated piece cobalt, continuous, 2px; unresolved / diagnostic / returning pieces stay potential by meaning"),
    ("03-1440-motion-hero-unrevealed.png", 1440, False, [], "viewport@hero-exit", "motion mode, hero not yet resolved (its scroll reveal may be part-way): hero mark and exit unresolved (grey, dashed) at the hero to Gap boundary"),
    ("04-1440-motion-hero-revealed.png", 1440, False, ["reveal"], "viewport@hero-exit", "motion mode after 'See the augmentation layer': hero mark and exit resolved (cobalt, continuous) into the Gap"),
    ("05-1440-motion-map-fresh.png", 1440, False, ["reveal"], "viewport@augmentation-map", "motion mode, no situation chosen: Map segment potential"),
    ("06-1440-motion-map-selected.png", 1440, False, ["reveal", "scenario", "audience", "repeated"], "viewport@augmentation-map", "motion mode, situation chosen: Map segment active"),
    ("07-1440-reduced-map-closeup-fresh@2x.png", 1440, True, [], "closeup@augmentation-map", "2x close-up of the left-margin thread, potential form"),
    ("08-1440-reduced-map-closeup-selected@2x.png", 1440, True, ["scenario", "audience", "repeated"], "closeup@augmentation-map", "2x close-up of the left-margin thread, active form"),
    ("09-1024-reduced-selected-full.png", 1024, True, ["scenario", "audience", "repeated"], "full", "compact desktop / tablet, selected state"),
    ("10-1024-motion-map-selected.png", 1024, False, ["reveal", "scenario", "audience", "repeated"], "viewport@augmentation-map", "compact desktop / tablet, motion mode, selected state"),
    ("11-390-reduced-fresh-full.png", 390, True, [], "full", "mobile, fresh session: vertical trace with local markers, potential form"),
    ("12-390-reduced-selected-full.png", 390, True, ["scenario", "audience", "repeated"], "full", "mobile, selected state: vertical trace, active form"),
    ("13-390-motion-map-selected.png", 390, False, ["reveal", "scenario", "audience", "repeated"], "viewport@augmentation-map", "mobile, motion mode, selected state"),
    ("14-1440-reduced-selected-thread-off-full.png", 1440, True, ["scenario", "audience", "repeated"], "full+off", "removal comparison: same decisions as 02 with ?thread=off"),
]
ACTION = {"scenario": SCENARIO, "audience": AUDIENCE, "repeated": REPEATED}


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def settle(p):
    p.evaluate("() => document.fonts.ready.then(() => true)")
    p.wait_for_timeout(600)


entries, errors = [], []
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=EXE) if EXE else pw.chromium.launch()
    for name, w, reduced, decisions, kind, purpose in SHOTS:
        closeup = kind.startswith("closeup")
        ctx = b.new_context(viewport={"width": w, "height": H[w]}, reduced_motion="reduce" if reduced else "no-preference",
                            device_scale_factor=2 if closeup else 1)
        p = ctx.new_page()
        p.on("pageerror", lambda e, n=name: errors.append([n, str(e)]))
        p.on("console", lambda m, n=name: errors.append([n, m.text]) if m.type == "error" else None)
        url = BASE + ("?thread=off" if kind.endswith("+off") else "") + "#/"
        p.goto(url, wait_until="networkidle"); p.wait_for_selector("main"); settle(p)
        for d in decisions:
            if d == "reveal":
                p.locator(REVEAL).click(); p.wait_for_timeout(4000)
            else:
                p.locator(ACTION[d]).first.click(); p.wait_for_timeout(300)
        path = os.path.join(OUT, name)
        if kind.startswith("full"):
            p.evaluate("() => window.scrollTo(0, 0)"); settle(p)
            p.screenshot(path=path, full_page=True)
        else:
            target = kind.split("@")[1]
            if target == "hero-exit":  # hero bottom (its mark and exit stub) plus the start of the Gap
                p.evaluate("() => { const h = document.getElementById('top'); window.scrollTo(0, h.offsetTop + h.offsetHeight - innerHeight + 260); }")
            else:
                p.evaluate(f"() => window.scrollTo(0, document.getElementById('{target}').getBoundingClientRect().top + scrollY - 80)")
            settle(p)
            if closeup:
                seg = p.evaluate(f"() => {{ const r = document.querySelector('#{target} > .bt-seg').getBoundingClientRect(); return [r.left, r.top]; }}")
                p.screenshot(path=path, clip={"x": 0, "y": max(0, seg[1]), "width": min(w, seg[0] + 520), "height": 420})
            else:
                p.screenshot(path=path)
        info = p.evaluate(PROBE)
        info["vector"] = p.evaluate(VECTOR)
        entries.append({"file": name, "sha256": sha256(path), "viewport": f"{w}x{H[w]}", "deviceScaleFactor": 2 if closeup else 1,
                        "motion": "reduced (prefers-reduced-motion: reduce)" if reduced else "full (no-preference)",
                        "url": url.replace(BASE, "/"), "capture": kind, "decisions": decisions, "purpose": purpose, **info})
        ctx.close()
    b.close()

manifest = {"workItem": "DYAI-45", "sourceCommit": SHA, "baseUrl": BASE,
            "tool": "Python Playwright (sync API) + Chromium headless shell; docs/evidence/DYAI-45/capture-evidence.py",
            "chromium": (EXE or "playwright default").replace(os.path.expanduser("~"), "~"), "vectorLegend": "chapter:EntryMarkExit, A = active (cobalt, continuous, 2px), P = potential (grey, dashed, 1px)",
            "consoleAndPageErrors": errors, "shots": entries}
with open(os.path.join(OUT, "manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2); f.write("\n")

rows = ["| File | Viewport | Motion | Decisions | scenario / audience / evidence / heroResolved | Thread vector | Purpose |", "|---|---|---|---|---|---|---|"]
for e in entries:
    x = e["experience"]
    rows.append(f"| `{e['file']}` | {e['viewport']}{' @2x' if e['deviceScaleFactor'] == 2 else ''} | {'reduced' if e['reducedMotionMatches'] else 'full'} | {', '.join(e['decisions']) or 'none (fresh)'}{' + `?thread=off`' if 'thread=off' in e['url'] else ''} "
                f"| {' / '.join(json.dumps(x[k]) for k in ['scenario', 'audience', 'evidence', 'heroResolved'])} | `{e['vector'] or '(no segments)'}` | {e['purpose']} |")
md = f"""# DYAI-45 visual evidence — manifest

Generated by `capture-evidence.py`. The state columns (scenario / audience / evidence / heroResolved, thread vector), the bundle names and the font status are read back from the rendered page; image SHA-256 values are computed from the written files; the decisions and purpose columns are the script's inputs. Full data: `manifest.json`.

- **Source commit:** `{SHA}`
- **Served from:** `{BASE}` (`vite preview` of a scratch `vite build`; tracked `dist-single/` untouched)
- **Tool:** {manifest['tool']}
- **Chromium:** `{manifest['chromium']}`
- **Console / page errors during capture:** {len(errors)}
- **Vector legend:** {manifest['vectorLegend']}; chapter order {' → '.join(CHAIN)}

{chr(10).join(rows)}
"""
with open(os.path.join(OUT, "MANIFEST.md"), "w") as f:
    f.write(md)
print(json.dumps({"shots": len(entries), "errors": len(errors)}))
