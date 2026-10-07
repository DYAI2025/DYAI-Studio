"""Identify the B7 flake element by its flagged rect (b7-stress-old-oracle.txt: B.@composer rounded x=515, y+scrollY=7436,
h=19; width 133 in the outlier load, 134 in the other three) at 1024 x 768, DE, scenario + audience chosen, and report its
raw rect. Also count <main> rect values lying within 1/64 px of an x.5 boundary in this one configuration."""
import json, os, sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=os.environ.get("CHROMIUM_EXECUTABLE"))
    ctx = b.new_context(viewport={"width": 1024, "height": 768}, reduced_motion="reduce")
    ctx.add_init_script("try { localStorage.setItem('dyai-locale', 'DE') } catch (e) {}")
    p = ctx.new_page(); p.goto(BASE + "#/", wait_until="networkidle"); p.evaluate("() => document.fonts.ready.then(() => true)"); p.wait_for_timeout(400)
    p.locator(".scenario-tabs button").first.click(); p.wait_for_timeout(200); p.locator(".path-toggle").first.click(); p.wait_for_timeout(1000)
    print("flagged_rect_matches", json.dumps(p.evaluate("""() => [...document.querySelectorAll('#composer b')].map(e => { const r = e.getBoundingClientRect(); return [e.textContent, r.x, r.y + scrollY, r.width, r.height]; })
        .filter(v => Math.round(v[1]) === 515 && Math.round(v[2]) === 7436 && Math.round(v[4]) === 19)""")))
    print("values_within_1_64px_of_half_1024_DE", p.evaluate("""() => { let n = 0, t = 0; document.querySelectorAll('main *').forEach(e => { if (e.closest('.bt-seg')) return; const r = e.getBoundingClientRect();
        [r.x, r.y + scrollY, r.width, r.height].forEach(v => { t++; if (Math.abs(Math.abs(v % 1) - 0.5) <= 1 / 64) n++; }); }); return [n, t]; }"""))
    b.close()
