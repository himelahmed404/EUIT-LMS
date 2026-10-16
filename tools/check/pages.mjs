// Every page at phone, tablet, laptop and wide widths: no sideways scroll, the sidebar never stacks
// above the page, no script errors, no duplicate ids, every aria/for reference resolves,
// every control has a name.
import { chromium } from "playwright";
import { startServer, pages, report, done } from "./lib.mjs";

const WIDTHS = [360, 390, 768, 900, 1024, 1280, 1366, 1440, 1920];
const { base, close } = await startServer();
const browser = await chromium.launch();
const ctx = await browser.newContext({ reducedMotion: "reduce" });
const page = await ctx.newPage();
let errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_/.test(m.text())) errors.push(m.text());
});

for (const p of pages()) {
  const issues = [];
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    errors = [];
    await page.goto(base + p, { waitUntil: "networkidle" });
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const side = document.querySelector(".p-side");
      const stacked =
        side && getComputedStyle(side).position !== "fixed" && side.getBoundingClientRect().width > vw * 0.9;
      return { over: document.documentElement.scrollWidth - vw, stacked };
    });
    if (r.over > 0) issues.push(`${w}px scrolls sideways by ${r.over}px`);
    if (r.stacked) issues.push(`${w}px sidebar stacks above the page`);
    if (errors.length) issues.push(`${w}px errors: ${[...new Set(errors)].join(" | ")}`);
    if (w !== 1440) continue;
    const a = await page.evaluate(() => {
      const ids = {};
      document.querySelectorAll("[id]").forEach((e) => {
        ids[e.id] = (ids[e.id] || 0) + 1;
      });
      const dup = Object.keys(ids).filter((k) => ids[k] > 1);
      const refs = [
        ...document.querySelectorAll("[aria-controls], [aria-labelledby], [aria-describedby], label[for]"),
      ].flatMap((el) =>
        ["aria-controls", "aria-labelledby", "aria-describedby", "for"].flatMap((attr) =>
          (el.getAttribute(attr) || "")
            .split(" ")
            .filter((id) => id && !document.getElementById(id))
            .map((id) => `#${id}`),
        ),
      );
      const unnamed = [
        ...document.querySelectorAll(
          'button, a[href], [role="tab"], [role="switch"], input:not([type="hidden"]), select, textarea',
        ),
      ]
        .filter((el) => {
          if (!el.getClientRects().length) return false;
          const by = el.getAttribute("aria-labelledby");
          const name =
            el.getAttribute("aria-label") ||
            (by &&
              by
                .split(" ")
                .map((id) => document.getElementById(id)?.textContent || "")
                .join("")) ||
            (el.labels && [...el.labels].map((l) => l.textContent).join("")) ||
            (["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)
              ? el.getAttribute("placeholder") || el.title
              : el.textContent || el.title);
          return !(name || "").trim();
        })
        .map((el) => el.outerHTML.slice(0, 60));
      return { dup, refs: [...new Set(refs)], unnamed };
    });
    if (a.dup.length) issues.push(`duplicate ids: ${a.dup.join(", ")}`);
    if (a.refs.length) issues.push(`references to missing ids: ${a.refs.slice(0, 5).join(", ")}`);
    if (a.unnamed.length) issues.push(`controls with no name: ${a.unnamed.slice(0, 3).join(" | ")}`);
  }
  report(p, issues.length === 0, issues.join("; "));
}
await browser.close();
close();
done();
