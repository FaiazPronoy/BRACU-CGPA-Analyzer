#!/usr/bin/env python3
"""
Browser checks for CGPA Analyzer, in a real browser through Playwright.

  1. pages     every page, empty and with a transcript, loads without errors
  2. contrast  every piece of text against WCAG AA, light and dark
  3. phone     nothing scrolls sideways at 390 px
  4. reset     Start over asks first, then clears every grade
  5. sheet     a real grade sheet from fixtures/private, if there is one,
               imports and every semester matches

Screenshots of each page go to tools/shots (gitignored).

Start the site first (npm run dev, on :5180), then:

  python tools/browser_checks.py

Uses the Edge that ships with Windows; set HB_BROWSER=chrome for Chrome.
Needs: pip install playwright
"""
import glob, os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("HB_BASE", "http://localhost:5180/")
CHANNEL = os.environ.get("HB_BROWSER", "msedge")
HERE = os.path.dirname(os.path.abspath(__file__))
SHEETS = sorted(glob.glob(os.path.join(HERE, "..", "fixtures", "private", "*.pdf")))
PAGES = ["home", "repeat", "plan", "courses", "rules"]
SHOTS = os.path.join(HERE, "shots")
PASS, FAIL = [], []


def check(name, ok, extra=""):
    (PASS if ok else FAIL).append(name)
    print(("  ok   " if ok else "  FAIL ") + name + ("  -> " + str(extra) if extra and not ok else ""))


CONTRAST_JS = r"""
() => {
  const parse = c => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return {r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1};
  };
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = c => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const over = (top, under) => ({r: top.r * top.a + under.r * (1 - top.a),
                                 g: top.g * top.a + under.g * (1 - top.a),
                                 b: top.b * top.a + under.b * (1 - top.a), a: 1});
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

  // every background this element could be sitting on; a gradient gives one per stop
  const backgrounds = el => {
    let stack = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage.includes('gradient')) {
        const stops = [...cs.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m => parse(m[0])).filter(s => s.a > 0);
        if (stops.length) {
          const solid = stops.filter(s => s.a >= 1), glass = stops.filter(s => s.a < 1);
          let under = solid;
          if (!under.length) {
            // a see-through highlighter: test it over whatever is behind it
            // (the dot grid on body is one, painted over body's own colour)
            let base = parse(cs.backgroundColor);
            if (base && base.a < 1) base = null;
            for (let b = e.parentElement; b && !base; b = b.parentElement) {
              const c = parse(getComputedStyle(b).backgroundColor);
              if (c && c.a >= 1) base = c;
            }
            under = [base || {r: 255, g: 255, b: 255, a: 1}];
          }
          const all = under.concat(...glass.map(g => under.map(u => over(g, u))));
          return all.map(s => stack.reduceRight((acc, layer) => over(layer, acc), s));
        }
      }
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        stack.push(c);
        if (c.a >= 1) break;
      }
    }
    let base = {r: 255, g: 255, b: 255, a: 1};
    if (!stack.length || stack[stack.length - 1].a < 1) stack.push(base);
    return [stack.reduceRight((acc, layer) => acc ? over(layer, acc) : layer, null)];
  };

  const bad = [];
  let checked = 0;
  for (const el of document.querySelectorAll('body *')) {
    const text = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!text) continue;
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || box.width === 0 || box.height === 0) continue;
    if (el.closest('[aria-hidden="true"], .sr-only, [hidden], option, script, style, iframe, .ql-editor .ql-blank')) continue;
    if (el.closest('button:disabled, input:disabled, [aria-disabled="true"], .ant-select-disabled')) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10);
    const need = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : 4.5;
    for (const bg of backgrounds(el)) {
      const r = ratio(fg.a < 1 ? over(fg, bg) : fg, bg);
      checked++;
      if (r < need) {
        bad.push({text: text.slice(0, 40), ratio: Math.round(r * 100) / 100, need,
                  cls: (el.className && el.className.baseVal === undefined ? el.className : '') || el.tagName});
        break;
      }
    }
  }
  return {checked, bad};
}
"""


def context(browser, theme, width=1366):
    ctx = browser.new_context(viewport={"width": width, "height": 900})
    ctx.add_init_script("try { localStorage.setItem('cgpa-analyzer:theme', '%s') } catch (e) {}" % theme)
    return ctx


def load_sample(page):
    page.goto(BASE + "#/home")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name="Try a sample student").click()
    page.wait_for_timeout(500)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel=CHANNEL)

        os.makedirs(SHOTS, exist_ok=True)
        for theme in ("light", "dark"):
            print("\n=== %s ===" % theme)
            ctx = context(browser, theme)
            page = ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            # empty first, then with the sample transcript
            fails, total = [], 0
            for stage in ("empty", "sample"):
                if stage == "sample":
                    load_sample(page)
                for name in PAGES:
                    page.goto(BASE + "#/" + name)
                    page.wait_for_timeout(350)
                    res = page.evaluate(CONTRAST_JS)
                    total += res["checked"]
                    fails += [(stage, name, b) for b in res["bad"]]
                    page.screenshot(path=os.path.join(SHOTS, "%s-%s-%s.png" % (theme, stage, name)), full_page=True)
            check("%s: %d pages load without errors" % (theme, len(PAGES) * 2), not errors, errors[:3])
            check("%s: %d text checks pass AA" % (theme, total), not fails, fails[:8])
            ctx.close()

        print("\n=== phone and reset ===")
        ctx = context(browser, "light", 390)
        page = ctx.new_page()
        wide = {}
        for stage in ("empty", "sample"):
            if stage == "sample":
                load_sample(page)
            for name in PAGES:
                page.goto(BASE + "#/" + name)
                page.wait_for_timeout(350)
                w = page.evaluate("document.documentElement.scrollWidth")
                if w > 390:
                    wide["%s/%s" % (stage, name)] = w
                page.screenshot(path=os.path.join(SHOTS, "phone-%s-%s.png" % (stage, name)), full_page=True)
        check("nothing scrolls sideways at 390 px", not wide, wide)

        # Start over: cancelling keeps the grades, confirming clears them
        page.goto(BASE + "#/home")
        page.get_by_role("button", name="Start over with a new grade sheet").click()
        page.get_by_role("button", name="Keep my grades").click()
        kept = page.evaluate("(JSON.parse(localStorage.getItem('cgpa-analyzer:v1') || '{}').attempts || []).length")
        check("Keep my grades leaves the grades alone", kept > 0, kept)
        page.get_by_role("button", name="Start over with a new grade sheet").click()
        page.get_by_role("button", name="Yes, start over").click()
        page.wait_for_timeout(300)
        left = page.evaluate("(JSON.parse(localStorage.getItem('cgpa-analyzer:v1') || '{}').attempts || []).length")
        back = page.get_by_role("button", name="Try a sample student").is_visible()
        check("Start over clears every grade and goes back to the upload page", left == 0 and back, (left, back))
        ctx.close()

        if SHEETS:
            print("\n=== real grade sheets ===")
            for sheet in SHEETS:
                ctx = context(browser, "light")
                page = ctx.new_page()
                page.goto(BASE + "#/home")
                page.wait_for_load_state("networkidle")
                page.set_input_files("input[type=file]", sheet)
                page.wait_for_selector("dialog[open]", timeout=20000)
                text = page.inner_text("dialog[open]")
                check("%s: every semester matches the sheet" % os.path.basename(sheet), "semesters match your sheet" in text, text[:160])
                ctx.close()

        browser.close()
    print("\n%d passed, %d failed" % (len(PASS), len(FAIL)))
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
