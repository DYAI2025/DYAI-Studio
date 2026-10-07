"""Blue Thread (DYAI-45, Slice 1) browser verification.

Runs against a served production build and prints one line per check:
    PASS|FAIL <name> actual=<json> expected=<json>
Exit code 0 only when every check passes. Canary checks (names containing "canary") inject a defect on purpose and
pass only when the corresponding check detects it.

Usage (from dyai-studio-blue/):
    npx vite build --outDir /tmp/bt-dist --emptyOutDir
    npx vite preview --outDir /tmp/bt-dist --port 4173 --strictPort &
    python3 scripts/verify-blue-thread.py http://localhost:4173/ [screenshot-dir]

Requires Python Playwright. Set CHROMIUM_EXECUTABLE to use a specific Chromium/headless-shell binary.
Expected per-chapter vectors below are written by hand from the semantics in Confluence 04.3, not computed from
src/thread/model.ts, so they act as an independent oracle for the registry.
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173/"
SHOTS = sys.argv[2] if len(sys.argv) > 2 else None
EXE = os.environ.get("CHROMIUM_EXECUTABLE")
CHAIN = ["hero", "gap", "map", "audiences", "process", "composer", "evidence", "lab", "principles", "final"]
HOSTS = ["top", "gap", "augmentation-map", "audiences", "approach", "composer", "evidence", "lab", "principles", "map-problem"]
fails = 0


def check(name, actual, expected):
    global fails
    ok = actual == expected
    fails += 0 if ok else 1
    print(f"{'PASS' if ok else 'FAIL'} {name} actual={json.dumps(actual)} expected={json.dumps(expected)}", flush=True)


# Per chapter: entry, local, exit as P(otential) / A(ctive). Hand-derived from the 04.3 semantics:
# hero resolves on reveal; gap is a diagnosis (never active); map needs a chosen situation; audiences a chosen path;
# process and principles need both; composer and evidence need a selected problem (own or inherited); lab needs
# Repeated/Measured evidence; final returns to an unresolved cycle.
def vec(**over):
    base = dict(hero="PAA", gap="APP", map="PPP", audiences="PPP", process="PPP", composer="PPP", evidence="PPP", lab="PPP", principles="PPP", final="PPP")
    base.update(over)
    return " ".join(f"{k}:{base[k]}" for k in CHAIN)

V_FRESH = vec()
V_SCENARIO = vec(map="PAA", audiences="APP", composer="PAA", evidence="AAA", lab="APP")
V_BOTH = vec(map="PAA", audiences="AAA", process="AAA", composer="AAA", evidence="AAA", lab="APP", principles="PAA", final="APP")
V_BOTH_REUSE = vec(map="PAA", audiences="AAA", process="AAA", composer="AAA", evidence="AAA", lab="AAA", principles="AAA", final="APP")
V_AUDIENCE_ONLY = vec(audiences="PAA", process="APP")
V_COMPOSER_ONLY = vec(composer="PAA", evidence="AAA", lab="APP")
V_EVIDENCE_ONLY = vec(lab="PAA", principles="APP")
V_NOTHING = vec(hero="PPP", gap="PPP")

VECTOR = """() => [...document.querySelectorAll('.bt-seg')].map(s => s.dataset.btChapter + ':' +
  ['entry','mark','exit'].map(k => s.querySelector('.bt-piece--' + k).dataset.btLine === 'active' ? 'A' : 'P').join('')).join(' ')"""
SNAP = """() => [...document.querySelectorAll('.bt-seg')].map(s => ({
  chapter: s.dataset.btChapter, entry: s.dataset.btEntry, exit: s.dataset.btExit, host: (s.closest('section') || {}).id,
  pieces: [...s.querySelectorAll('.bt-piece')].map(p => p.className.replace('bt-piece bt-piece--','') + ':' + p.dataset.btState + ':' + p.dataset.btLine)}))"""
GEOMETRY = """() => { const vw = innerWidth; const out = [];
  document.querySelectorAll('.bt-seg').forEach(s => {
    const shell = s.parentElement.querySelector('.page-shell'); const limit = shell ? shell.getBoundingClientRect().left - 2 : vw;
    const m = s.querySelector('.bt-piece--mark .trace-mark').getBoundingClientRect();
    if (!(m.width > 0 && m.height > 0 && m.left >= 0 && m.right <= limit)) out.push(s.dataset.btChapter + ':mark');
    // entry and exit must be drawn; the body may collapse to zero length (hero: mark sits directly above the exit stub)
    s.querySelectorAll('.bt-piece:not(.bt-piece--mark)').forEach(p => { const r = p.getBoundingClientRect(); const cs = getComputedStyle(p); const body = p.classList.contains('bt-piece--body');
      if (!((body ? r.height >= 0 : r.height > 0) && r.width > 0 && r.left >= 0 && r.right <= limit && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0)) out.push(s.dataset.btChapter + ':' + p.className.split('--')[1]); });
    // the four pieces form one unbroken vertical line from section top to section bottom
    const r = ['entry','mark','body','exit'].map(k => s.querySelector('.bt-piece--' + k).getBoundingClientRect()); const seg = s.getBoundingClientRect();
    if (Math.abs(r[0].top - seg.top) > 1 || Math.abs(r[3].bottom - seg.bottom) > 1 || [0,1,2].some(i => Math.abs(r[i].bottom - r[i + 1].top) > 1)) out.push(s.dataset.btChapter + ':gap-in-line');
  }); return out; }"""
OVERFLOWERS = """() => [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 0.5 || r.left < -0.5); }).length"""
ACTIVE = "() => document.querySelectorAll('.bt-piece[data-bt-line=active]').length"
STRIP = "() => document.querySelectorAll('.bt-seg').forEach(s => s.remove())"
# Every painted colour channel; colours normalised from rgb()/rgba()/color(srgb …) so color-mix results are caught too.
COBALT = r"""() => { const props = ['color','backgroundColor','backgroundImage','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','boxShadow','textDecorationColor','fill','stroke'];
  const isCobalt = v => { const toks = v.match(/rgba?\([^)]*\)|color\(srgb[^)]*\)/g) || []; return toks.some(t => { let n = t.match(/[\d.]+/g).map(Number);
      if (t.startsWith('color(')) n = n.map((x, i) => i < 3 ? x * 255 : x); if (n.length > 3 && n[3] === 0) return false;
      return Math.abs(n[0] - 36) <= 3 && Math.abs(n[1] - 89) <= 3 && Math.abs(n[2] - 232) <= 3; }); };
  const out = [], inside = [];
  document.querySelectorAll('body *').forEach((e, i) => { const cs = getComputedStyle(e);
    if (!props.some(k => isCobalt(cs[k] || ''))) return; const cls = e.className.baseVal ?? e.className;
    if (e.closest('.bt-seg')) { const bt = e.closest('[data-bt-line]'); if (!bt || bt.dataset.btLine !== 'active') inside.push(cls); }
    else out.push(e.tagName + '.' + cls); });
  return { out, inside }; }"""

contexts = []


def page_for(browser, w=1440, h=900, reduced=True, forced=False, de=False, label=""):
    ctx = browser.new_context(viewport={"width": w, "height": h}, reduced_motion="reduce" if reduced else "no-preference",
                              forced_colors="active" if forced else "none")
    if de:
        ctx.add_init_script("try { localStorage.setItem('dyai-locale', 'DE') } catch (e) {}")
    p = ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    p.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    contexts.append((label or f"{w}x{h}-{'rm' if reduced else 'motion'}{'-forced' if forced else ''}{'-de' if de else ''}", errs))
    return ctx, p


def goto(p, url):
    p.goto(url, wait_until="networkidle")
    p.wait_for_selector("main")
    p.evaluate("() => document.fonts.ready.then(() => true)")
    p.wait_for_timeout(400)


def click(p, sel):
    p.locator(sel).first.click()
    p.wait_for_timeout(200)


def reveal_hero(p):
    p.locator(".hero-actions .action-link--secondary").click()
    p.wait_for_timeout(4000)


def text_and_rects(p):
    """Raw (unrounded) geometry of every element in <main> outside the thread, sampled until two consecutive samples
    agree (clicks scroll the page and the sticky header animates its height, which shifts in-flow content).
    Raw values are only compared within one document: separate page loads can lay out a text run differently by a
    sub-pixel amount (cause not identified), and rounding turned that into intermittent 1 px diffs across .5 boundaries
    (docs/evidence/DYAI-45/B7-geometry-oracle.md)."""
    js = """() => { const els = [...document.querySelectorAll('main *')].filter(e => !e.closest('.bt-seg'));
      return { text: document.body.innerText, keys: els.map(e => e.tagName + '.' + String(e.className.baseVal ?? e.className).slice(0, 40) + '@' + ((e.closest('section') || {}).id || '')),
        rects: els.map(e => { const r = e.getBoundingClientRect(); return (e.tagName + '.' + String(e.className.baseVal ?? e.className).slice(0, 40) + '@' + ((e.closest('section') || {}).id || '')) + '=' + [r.x, r.y + scrollY, r.width, r.height].join(','); }) }; }"""
    prev = p.evaluate(js)
    for _ in range(20):
        p.wait_for_timeout(150)
        cur = p.evaluate(js)
        if cur == prev:
            return cur
        prev = cur
    raise RuntimeError("layout did not settle within 3 s")


SCENARIO, AUDIENCE, COMPOSER = ".scenario-tabs button", ".path-toggle", "#composer [role=group] button"

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=EXE) if EXE else pw.chromium.launch()

    # B1 structure, B2 continuity, B3 glyph agreement, B10 a11y — reduced motion, fresh session
    ctx, p = page_for(b, label="B1-B4")
    goto(p, BASE + "#/")
    snap = p.evaluate(SNAP)
    check("B1.segments", len(snap), 10)
    check("B1.pieces", p.evaluate("() => document.querySelectorAll('.bt-piece').length"), 40)
    check("B1.order", [s["chapter"] for s in snap], CHAIN)
    check("B1.hosts", [s["host"] for s in snap], HOSTS)
    pairs = sum(1 for i in range(9) if snap[i]["exit"] == snap[i + 1]["entry"] and snap[i]["pieces"][3].split(":")[1:] == snap[i + 1]["pieces"][0].split(":")[1:])
    check("B2.continuity_pairs", pairs, 9)
    check("B2.loop", [snap[9]["exit"], snap[0]["entry"]], ["cycle", "cycle"])
    p.evaluate("() => { document.querySelector('[data-bt-chapter=gap]').dataset.btEntry = 'x'; }")
    snap_c = p.evaluate(SNAP)
    check("B2.canary_detects_broken_pair", sum(1 for i in range(9) if snap_c[i]["exit"] != snap_c[i + 1]["entry"]), 1)
    goto(p, BASE + "#/")
    check("B3.glyph_agreement", p.evaluate("""() => [...document.querySelectorAll('.bt-seg')].filter(s => {
        const eb = s.parentElement.closest('section').querySelector('.trace > .trace-mark'); const m = s.querySelector('.trace-mark');
        return eb && m && eb.getAttribute('class') === m.getAttribute('class'); }).length"""), 10)
    check("B10.a11y", p.evaluate("""() => { const s = [...document.querySelectorAll('.bt-seg')]; return {
        hidden: s.filter(e => e.getAttribute('aria-hidden') === 'true').length,
        focusable: s.reduce((n, e) => n + e.querySelectorAll('a,button,input,select,textarea,[tabindex]').length, 0),
        empty: s.filter(e => e.textContent === '').length, noPointer: s.filter(e => getComputedStyle(e).pointerEvents === 'none').length }; }"""),
        {"hidden": 10, "focusable": 0, "empty": 10, "noPointer": 10})

    # B4 per-chapter vectors across explicit decisions (reduced motion: hero complete from the start)
    for name, sel, exp in [("fresh", None, V_FRESH), ("scenario", SCENARIO, V_SCENARIO), ("audience", AUDIENCE, V_BOTH),
                           ("repeated", "#ev-tab-repeated", V_BOTH_REUSE), ("prototype", "#ev-tab-prototype", V_BOTH),
                           ("used", "#ev-tab-used", V_BOTH), ("measured", "#ev-tab-measured", V_BOTH_REUSE)]:
        if sel:
            click(p, sel)
        check(f"B4.vector_{name}", p.evaluate(VECTOR), exp)
    p.reload(wait_until="networkidle"); p.wait_for_selector("main"); p.wait_for_timeout(300)
    check("B4.vector_after_reload", p.evaluate(VECTOR), V_BOTH_REUSE)
    p.locator('header button[lang="de"]:visible').first.click(); p.wait_for_timeout(300)
    check("B4.vector_after_DE", p.evaluate(VECTOR), V_BOTH_REUSE)
    for route in ["organisations", "individuals", "work", "lab", "approach"]:
        goto(p, BASE + f"#/{route}")
        check(f"B1.route_{route}_segments", p.evaluate("() => document.querySelectorAll('.bt-seg').length"), 0)
    goto(p, BASE + "#/")
    check("B1.back_home_segments", p.evaluate("() => document.querySelectorAll('.bt-seg').length"), 10)
    ctx.close()

    for name, sel, exp in [("audience_only", AUDIENCE, V_AUDIENCE_ONLY), ("composer_only", COMPOSER, V_COMPOSER_ONLY), ("evidence_only", "#ev-tab-repeated", V_EVIDENCE_ONLY)]:
        ctx, p = page_for(b, label=f"B4-{name}")
        goto(p, BASE + "#/"); click(p, sel)
        check(f"B4.vector_{name}", p.evaluate(VECTOR), exp)
        ctx.close()

    # B5 R-BT-05 + hero/shared-state consistency (motion mode)
    ctx, p = page_for(b, reduced=False, label="B5-motion")
    goto(p, BASE + "#/")
    check("B5.vector_before_reveal", p.evaluate(VECTOR), V_NOTHING)
    reveal_hero(p)
    s0 = p.evaluate(SNAP)
    check("B5.vector_after_reveal", p.evaluate(VECTOR), V_FRESH)
    h = p.evaluate("() => document.documentElement.scrollHeight")
    y = 0
    while y < h:
        y += 200; p.evaluate(f"() => window.scrollTo(0, {y})"); p.wait_for_timeout(50)
    p.wait_for_timeout(500)
    ss = p.evaluate("() => JSON.parse(sessionStorage.getItem('dyai-p3-experience') || '{}')")
    check("B5.positive_control_stage_advanced", ss.get("stage", 0) >= 1, True)
    check("B5.snapshot_diff_after_full_scroll", sum(1 for a, c in zip(s0, p.evaluate(SNAP)) if a != c), 0)
    check("B5.evidence_unchanged_by_scroll", ss.get("evidence"), "prototype")
    # B12 pinned Gap: segment pins with the stage and its mark is fully below the sticky header
    p.evaluate("() => window.scrollTo(0, document.getElementById('gap').offsetTop + 800)"); p.wait_for_timeout(700)
    pin = p.evaluate("""() => { const s = document.querySelector('[data-bt-chapter=gap]').getBoundingClientRect(); const g = document.querySelector('.gap-stage').getBoundingClientRect();
        const m = document.querySelector('[data-bt-chapter=gap] .trace-mark').getBoundingClientRect(); const hd = document.querySelector('.site-header').getBoundingClientRect();
        return { pinned: !!document.querySelector('.gap-section--pinned'), segWithStage: Math.abs(s.top - g.top) <= 1, markBelowHeader: m.top >= hd.bottom, markInViewport: m.bottom <= innerHeight }; }""")
    check("B12.pinned_gap", pin, {"pinned": True, "segWithStage": True, "markBelowHeader": True, "markInViewport": True})
    ctx.close()

    ctx, p = page_for(b, label="B5-rm-toggle")
    goto(p, BASE + "#/")
    p.emulate_media(reduced_motion="no-preference"); p.wait_for_timeout(300)
    p.evaluate("() => window.scrollTo(0, 600)"); p.wait_for_timeout(1500)
    check("B5.hero_stays_resolved_after_rm_off", p.evaluate(VECTOR), V_FRESH)
    check("B5.shared_state_records_resolution", p.evaluate("() => JSON.parse(sessionStorage.getItem('dyai-p3-experience') || '{}').heroResolved"), True)
    ctx.close()

    # B6 same thread state and visible, in-bounds pieces across widths and motion modes
    states = {}
    for w, h, red in [(1440, 900, True), (1024, 768, True), (390, 844, True), (1440, 900, False), (1024, 768, False), (390, 844, False)]:
        ctx, p = page_for(b, w=w, h=h, reduced=red)
        goto(p, BASE + "#/")
        if not red:
            reveal_hero(p)
        click(p, SCENARIO); click(p, AUDIENCE)
        states[(w, red)] = p.evaluate(VECTOR)
        tag = f"{w}_{'rm' if red else 'motion'}"
        check(f"B10.pieces_visible_in_margin_{tag}", p.evaluate(GEOMETRY), [])
        if SHOTS:
            p.screenshot(path=os.path.join(SHOTS, f"thread-{tag}.png"), full_page=True)
        ctx.close()
    check("B6.same_vector_all_modes", sorted(set(states.values())), [V_BOTH])

    # B10 canary: hiding the markers at 390 must be detected
    ctx, p = page_for(b, w=390, h=844, label="B10-canary")
    goto(p, BASE + "#/")
    p.add_style_tag(content="@media (max-width:680px){.bt-seg{display:none!important}}"); p.wait_for_timeout(100)
    check("B10.canary_hidden_markers_detected", len(p.evaluate(GEOMETRY)) > 0, True)
    ctx.close()

    # B7 removability: ?thread=off vs on — text, structure, overflow, position across loads; geometry of everything else
    # within one document: raw rects with the thread, then with its nodes removed (the DOM that ?thread=off renders).
    # The in-document geometry check sees CSS and DOM-presence effects; it cannot see layout that JS fixes at first render
    # because the thread was mounted (src/ currently reads no layout; GSAP pins run only in motion mode, not used here).
    def rect_diffs(x, y):
        return [[a, c] for a, c in zip(x["rects"], y["rects"]) if a != c][:6] + ([["count", len(x["rects"]), len(y["rects"])]] if len(x["rects"]) != len(y["rects"]) else [])

    for w, h in [(1440, 900), (1024, 768), (390, 844)]:
        for loc in ["EN", "DE"]:
            res = {}
            for mode in ["on", "off"]:
                ctx, p = page_for(b, w=w, h=h, de=(loc == "DE"), label=f"B7-{w}-{loc}-{mode}")
                goto(p, BASE + ("?thread=off" if mode == "off" else "") + "#/")
                click(p, SCENARIO); click(p, AUDIENCE); p.wait_for_timeout(200)
                res[mode] = text_and_rects(p)
                res[mode].update(segs=p.evaluate("() => document.querySelectorAll('.bt-seg').length"), lang=p.evaluate("() => document.documentElement.lang"),
                                 pos=p.evaluate("() => getComputedStyle(document.getElementById('augmentation-map')).position"), overflow=p.evaluate(OVERFLOWERS))
                if mode == "on":
                    p.evaluate(STRIP)
                    res["stripped"] = text_and_rects(p)
                ctx.close()
            n = f"B7.{w}.{loc}"
            check(f"{n}.lang", [res["on"]["lang"], res["off"]["lang"]], [loc.lower(), loc.lower()])
            check(f"{n}.segments_on_off", [res["on"]["segs"], res["off"]["segs"]], [10, 0])
            check(f"{n}.innerText_equal", res["on"]["text"] == res["off"]["text"], True)
            check(f"{n}.element_keys_equal", res["on"]["keys"] == res["off"]["keys"], True)
            check(f"{n}.rect_diffs", rect_diffs(res["on"], res["stripped"]), [])
            check(f"{n}.overflowing_elements_on_minus_off", res["on"]["overflow"] - res["off"]["overflow"], 0)
            check(f"{n}.position_on_off", [res["on"]["pos"], res["off"]["pos"]], ["relative", "static"])
    ctx, p = page_for(b, label="B7-canary"); goto(p, BASE + "?thread=off#/"); r1 = text_and_rects(p)
    p.add_style_tag(content="section{padding-top:1px !important}"); p.wait_for_timeout(200); r2 = text_and_rects(p); ctx.close()
    check("B7.canary_1px_shift_detected", len(rect_diffs(r1, r2)) > 0, True)
    # A thread that takes layout space (1 px, and a sub-pixel 0.25 px that integer rounding could not see) must be detected.
    for tag, px in [("1px", "1px"), ("quarter_px", "0.25px")]:
        ctx, p = page_for(b, label=f"B7-canary-thread-{tag}"); goto(p, BASE + "#/")
        p.add_style_tag(content=".bt-seg{position:relative !important; height:" + px + " !important}"); p.wait_for_timeout(200)
        r1 = text_and_rects(p); p.evaluate(STRIP); r2 = text_and_rects(p); ctx.close()
        check(f"B7.canary_thread_layout_{tag}_detected", len(rect_diffs(r1, r2)) > 0, True)

    # B8 R-BT-04: cobalt outside the thread identical on/off; inside only under active pieces; one canary per channel
    res = {}
    for mode in ["on", "off"]:
        ctx, p = page_for(b, label=f"B8-{mode}"); goto(p, BASE + ("?thread=off" if mode == "off" else "") + "#/")
        click(p, SCENARIO)
        res[mode] = p.evaluate(COBALT); ctx.close()
    check("B8.outside_cobalt_set_equal", sorted(res["on"]["out"]) == sorted(res["off"]["out"]), True)
    check("B8.cobalt_in_nonactive_pieces", res["on"]["inside"], [])
    for chan, css in [("background", "background:var(--signal)"), ("box_shadow", "box-shadow:0 0 0 3px var(--signal)"),
                      ("border_right", "border-right:2px solid var(--signal)"), ("color_mix", "background:color-mix(in srgb, var(--signal) 80%, transparent)")]:
        ctx, p = page_for(b, label=f"B8-canary-{chan}"); goto(p, BASE + "#/")
        p.add_style_tag(content='.bt-piece[data-bt-line="potential"]{' + css + ' !important}'); p.wait_for_timeout(100)
        check(f"B8.canary_{chan}_detected", len(p.evaluate(COBALT)["inside"]) > 0, True); ctx.close()

    # B9 state not by colour alone: neutralise cobalt (and forced colours), classify by width + dashing
    for forced in [False, True]:
        ctx, p = page_for(b, forced=forced); goto(p, BASE + "#/")
        click(p, SCENARIO)
        if not forced:
            p.add_style_tag(content=":root{--signal:#3a3f3c !important}")
        agree = p.evaluate("""() => { const ps = [...document.querySelectorAll('.bt-piece:not(.bt-piece--mark)')];
          return [ps.length, ps.filter(e => { const cs = getComputedStyle(e); const dashed = cs.backgroundImage.includes('repeating-linear-gradient');
            const w = Math.round(parseFloat(cs.width)); return (e.dataset.btLine === 'active') === (w === 2 && !dashed) && (e.dataset.btLine === 'potential') === (w === 1 && dashed); }).length]; }""")
        check(f"B9.shape_encodes_state_forced={forced}", agree, [30, 30]); ctx.close()

    b.close()

# Console/page errors from every context except the canaries (which inject CSS only, but are excluded on principle)
errors = {label: errs for label, errs in contexts if errs and "canary" not in label}
check("B1.console_and_page_errors_all_contexts", errors, {})
check("B1.contexts_checked", len(contexts) >= 30, True)
print(f"TOTAL_FAILS={fails}")
sys.exit(1 if fails else 0)
