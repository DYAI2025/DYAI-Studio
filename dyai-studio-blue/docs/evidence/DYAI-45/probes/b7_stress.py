"""B7 flake stress probe. Repeats the B7 measurement and compares pairs:
on/off (the real check) and on/on, off/off (controls: any diff there is nondeterminism unrelated to the thread).
Prints every differing element with both rects plus context state at sampling time."""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1]
ROUNDS = int(sys.argv[2])
WIDTHS = [int(x) for x in sys.argv[3].split(",")] if len(sys.argv) > 3 else [1440, 1024, 390]
EXE = os.environ.get("CHROMIUM_EXECUTABLE")
H = {1440: 900, 1024: 768, 390: 844}
SCENARIO, AUDIENCE = ".scenario-tabs button", ".path-toggle"
JS = """() => { const els = [...document.querySelectorAll('main *')].filter(e => !e.closest('.bt-seg'));
  return { rects: els.map(e => { const r = e.getBoundingClientRect(); return (e.tagName + '.' + String(e.className.baseVal ?? e.className).slice(0, 40) + '@' + ((e.closest('section') || {}).id || '')) + '=' + [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)].join(','); }) }; }"""
CTX = """() => ({ fonts: document.fonts.status, loaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).length,
  header: Math.round(document.querySelector('.site-header').getBoundingClientRect().height), scrollY: Math.round(scrollY), docH: document.documentElement.scrollHeight })"""


def sample(b, w, de, mode):
    ctx = b.new_context(viewport={"width": w, "height": H[w]}, reduced_motion="reduce")
    if de:
        ctx.add_init_script("try { localStorage.setItem('dyai-locale', 'DE') } catch (e) {}")
    p = ctx.new_page()
    p.goto(BASE + ("?thread=off" if mode == "off" else "") + "#/", wait_until="networkidle")
    p.wait_for_selector("main"); p.evaluate("() => document.fonts.ready.then(() => true)"); p.wait_for_timeout(400)
    p.locator(SCENARIO).first.click(); p.wait_for_timeout(200)
    p.locator(AUDIENCE).first.click(); p.wait_for_timeout(200)
    p.wait_for_timeout(200)
    prev = p.evaluate(JS); settled = None
    for i in range(20):
        p.wait_for_timeout(150); cur = p.evaluate(JS)
        if cur == prev:
            settled = i; break
        prev = cur
    c = p.evaluate(CTX); c["settle_iter"] = settled
    ctx.close()
    return prev["rects"], c


def diff(a, b):
    if len(a) != len(b):
        return [["count", len(a), len(b)]]
    return [[x, y] for x, y in zip(a, b) if x != y]


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=EXE) if EXE else pw.chromium.launch()
    for r in range(ROUNDS):
        for w in WIDTHS:
            for loc in ["EN", "DE"]:
                s = {k: sample(b, w, loc == "DE", k.rstrip("2")) for k in ["on", "off", "on2", "off2"]}
                for pa in [("on", "off"), ("on2", "off2"), ("on", "on2"), ("off", "off2")]:
                    d = diff(s[pa[0]][0], s[pa[1]][0])
                    tag = f"r{r} {w} {loc} {pa[0]}/{pa[1]}"
                    if d:
                        print(f"DIFF {tag} n={len(d)} ctx={json.dumps([s[pa[0]][1], s[pa[1]][1]])}", flush=True)
                        for x in d[:12]:
                            print(f"   {x[0]}  ||  {x[1]}", flush=True)
                    else:
                        print(f"SAME {tag}", flush=True)
    b.close()
