"""List every request origin made by the served app during load + the decisions + route changes + mapper open."""
import json, os, sys
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

BASE = sys.argv[1]
EXE = os.environ.get("CHROMIUM_EXECUTABLE")
reqs = []
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=EXE)
    for reduced in [True, False]:
        ctx = b.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce" if reduced else "no-preference")
        p = ctx.new_page()
        p.on("request", lambda r: reqs.append([r.method, urlsplit(r.url).scheme + "://" + urlsplit(r.url).netloc, r.resource_type]))
        p.goto(BASE + "#/", wait_until="networkidle"); p.wait_for_timeout(500)
        if not reduced:
            p.locator(".hero-actions .action-link--secondary").click(); p.wait_for_timeout(3000)
        for sel in [".scenario-tabs button", ".path-toggle", "#ev-tab-repeated", "#composer [role=group] button"]:
            p.locator(sel).first.click(); p.wait_for_timeout(300)
        p.locator('header button[lang="de"]:visible').first.click(); p.wait_for_timeout(500)
        for route in ["organisations", "individuals", "work", "lab", "approach", ""]:
            p.goto(BASE + f"#/{route}", wait_until="networkidle"); p.wait_for_timeout(300)
        y = 0
        while y < 20000:
            y += 400; p.evaluate(f"() => window.scrollTo(0, {y})"); p.wait_for_timeout(30)
        p.wait_for_timeout(1000)
        ctx.close()
    b.close()
agg = {}
for m, o, t in reqs:
    agg.setdefault(o, {}).setdefault(f"{m} {t}", 0)
    agg[o][f"{m} {t}"] += 1
print(json.dumps(agg, indent=1, sort_keys=True))
