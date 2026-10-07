"""Raw (unrounded) geometry across repeated loads, thread on. Reports, per element key, the spread of raw x/y/w/h,
and whether the rounded tuple ever differs. Also records the loaded font faces per load."""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE, N, W, LOC = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
EXE = os.environ.get("CHROMIUM_EXECUTABLE")
H = {1440: 900, 1024: 768, 390: 844}
JS = """() => [...document.querySelectorAll('main *')].filter(e => !e.closest('.bt-seg')).map((e, i) => { const r = e.getBoundingClientRect();
  return [i + ':' + e.tagName + '.' + String(e.className.baseVal ?? e.className).slice(0, 40) + '@' + ((e.closest('section') || {}).id || ''), r.x, r.y + scrollY, r.width, r.height]; })"""
FONTS = "() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + '|' + f.weight + '|' + f.unicodeRange.slice(0, 30)).sort()"
loads = []
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=EXE)
    for n in range(N):
        ctx = b.new_context(viewport={"width": W, "height": H[W]}, reduced_motion="reduce")
        if LOC == "DE":
            ctx.add_init_script("try { localStorage.setItem('dyai-locale', 'DE') } catch (e) {}")
        p = ctx.new_page()
        p.goto(BASE + "#/", wait_until="networkidle"); p.wait_for_selector("main"); p.evaluate("() => document.fonts.ready.then(() => true)"); p.wait_for_timeout(400)
        p.locator(".scenario-tabs button").first.click(); p.wait_for_timeout(200)
        p.locator(".path-toggle").first.click(); p.wait_for_timeout(1500)
        loads.append((p.evaluate(JS), p.evaluate(FONTS)))
        ctx.close()
    b.close()
keys = [k[0] for k in loads[0][0]]
spread = []
for i, k in enumerate(keys):
    vals = [l[0][i][1:] for l in loads]
    rng = [max(v[j] for v in vals) - min(v[j] for v in vals) for j in range(4)]
    rounded = {tuple(round(x) for x in v) for v in vals}
    if max(rng) > 0:
        spread.append([k, [round(x, 4) for x in rng], len(rounded), [round(vals[0][j], 4) for j in range(4)]])
print("loads", N, "elements", len(keys), "elements_with_any_raw_variation", len(spread))
print("max_raw_range", max((max(s[1]) for s in spread), default=0))
print("elements_with_rounded_variation", sum(1 for s in spread if s[2] > 1))
for s in sorted(spread, key=lambda s: -max(s[1]))[:15]:
    print(" ", json.dumps(s))
print("font_sets_distinct", len({json.dumps(l[1]) for l in loads}))
print(json.dumps(loads[0][1]))
