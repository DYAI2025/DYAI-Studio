"""New-oracle stress: per load, raw rects with thread -> remove .bt-seg -> raw rects; must be identical.
Also reports the old cross-load rounded comparison between consecutive loads of the same config, for contrast."""
import os, sys
from playwright.sync_api import sync_playwright
BASE, ROUNDS = sys.argv[1], int(sys.argv[2])
EXE = os.environ.get("CHROMIUM_EXECUTABLE"); H = {1440: 900, 1024: 768, 390: 844}
JS = """() => [...document.querySelectorAll('main *')].filter(e => !e.closest('.bt-seg')).map(e => { const r = e.getBoundingClientRect(); return [e.tagName + '.' + String(e.className.baseVal ?? e.className).slice(0, 40) + '@' + ((e.closest('section') || {}).id || ''), r.x, r.y + scrollY, r.width, r.height]; })"""
def settled(p):
    prev = p.evaluate(JS)
    for _ in range(20):
        p.wait_for_timeout(150); cur = p.evaluate(JS)
        if cur == prev: return cur
        prev = cur
    raise RuntimeError("no settle")
same_doc_diffs = cross_rounded_diffs = cross_raw_diffs = n = pairs = 0
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=EXE)
    for r in range(ROUNDS):
        for w in [1440, 1024, 390]:
            for loc in ["EN", "DE"]:
                prev = None
                for k in range(2):
                    ctx = b.new_context(viewport={"width": w, "height": H[w]}, reduced_motion="reduce")
                    if loc == "DE": ctx.add_init_script("try { localStorage.setItem('dyai-locale', 'DE') } catch (e) {}")
                    p = ctx.new_page(); p.goto(BASE + "#/", wait_until="networkidle"); p.wait_for_selector("main")
                    p.evaluate("() => document.fonts.ready.then(() => true)"); p.wait_for_timeout(400)
                    p.locator(".scenario-tabs button").first.click(); p.wait_for_timeout(200); p.locator(".path-toggle").first.click(); p.wait_for_timeout(400)
                    a = settled(p); p.evaluate("() => document.querySelectorAll('.bt-seg').forEach(s => s.remove())"); c = settled(p); ctx.close()
                    d = [[x, y] for x, y in zip(a, c) if x != y]; n += 1
                    if d or len(a) != len(c):
                        same_doc_diffs += 1; print(f"SAMEDOC_DIFF r{r} {w} {loc} {d[:4]}", flush=True)
                    if prev is not None:
                        pairs += 1
                        rd = [[x, y] for x, y in zip(prev, a) if [x[0]] + [round(v) for v in x[1:]] != [y[0]] + [round(v) for v in y[1:]]]
                        wd = [[x, y] for x, y in zip(prev, a) if x != y]
                        if rd: cross_rounded_diffs += 1; print(f"CROSS_ROUNDED_DIFF r{r} {w} {loc} {rd[:4]}", flush=True)
                        if wd: cross_raw_diffs += 1; print(f"CROSS_RAW_DIFF r{r} {w} {loc} n={len(wd)} {wd[:4]}", flush=True)
                    prev = a
    b.close()
print(f"SUMMARY same_doc_comparisons={n} same_doc_diffs={same_doc_diffs} cross_load_pairs={pairs} cross_rounded_diffs={cross_rounded_diffs} cross_raw_diffs={cross_raw_diffs}")
