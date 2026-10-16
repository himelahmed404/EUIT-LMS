// Interactive states: every captured-state option shows its templates, every tab shows only its
// own panel, and every dialog opener opens its dialog (and Esc closes it).
import { chromium } from "playwright";
import { startServer, pages, report, done } from "./lib.mjs";

const { base, close } = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

for (const p of pages()) {
  await page.goto(base + p, { waitUntil: "networkidle" });
  const has = await page.evaluate(() => ({
    parts: document.querySelectorAll("[data-part-of]").length,
    tabs: document.querySelectorAll('[role="tab"][aria-controls]').length,
    dialogs: [
      ...new Set([...document.querySelectorAll("[data-open-dialog]")].map((b) => b.getAttribute("data-open-dialog"))),
    ],
  }));
  const issues = [];
  // 1. Options that pick a captured state.
  const n = await page.locator("[data-part-of]:visible").count();
  for (let i = 0; i < n; i++) {
    const option = page.locator("[data-part-of]:visible").nth(i);
    if (!(await option.count())) continue;
    await option.click();
    const bad = await page.evaluate(() => {
      const out = [];
      const keys = [
        ...new Set([...document.querySelectorAll("[data-part-of]")].map((b) => b.getAttribute("data-part-of"))),
      ];
      for (const key of keys) {
        const parts = [];
        document.querySelectorAll(`[data-part-of="${key}"]`).forEach((b) => {
          const attr = b.hasAttribute("aria-pressed") ? "aria-pressed" : "aria-checked";
          if (b.getAttribute(attr) === "true") parts[+b.getAttribute("data-part")] = b.getAttribute("data-value");
        });
        const name = `${key}:${parts.join("|")}`;
        const tpls = document.querySelectorAll(`template[data-state="${name}"]`);
        if (!tpls.length) out.push(`no template for ${name}`);
        tpls.forEach((t) => {
          const live = document.querySelector(t.getAttribute("data-region"));
          const text = (el) => el.textContent.replace(/\s+/g, " ").trim();
          if (!live || text(live) !== text(t.content.firstElementChild))
            out.push(`${name} not shown in ${t.getAttribute("data-region")}`);
        });
      }
      return out;
    });
    issues.push(...bad);
  }
  // 2. Tabs.
  if (has.tabs) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    const tabs = page.locator('[role="tab"][aria-controls]');
    for (let i = 0; i < has.tabs; i++) {
      const tab = tabs.nth(i);
      if (!(await tab.isVisible())) continue;
      await tab.click();
      const ok = await tab.evaluate((t) => {
        const list = t.closest('[role="tablist"]') || t.parentElement;
        return [...list.querySelectorAll('[role="tab"][aria-controls]')].every((x) => {
          const panel = document.getElementById(x.getAttribute("aria-controls"));
          return panel && panel.hidden === (x !== t) && x.getAttribute("aria-selected") === String(x === t);
        });
      });
      if (!ok) issues.push(`tab ${i + 1} does not show only its panel`);
    }
  }
  // 3. Dialogs.
  for (const id of has.dialogs) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    const opener = page.locator(`[data-open-dialog="${id}"]`).first();
    if (!(await opener.isVisible())) continue;
    await opener.click();
    const open = await page.locator("#" + id).isVisible();
    await page.keyboard.press("Escape");
    const shut = !(await page.locator("#" + id).isVisible());
    if (!open || !shut) issues.push(`dialog #${id} ${open ? "does not close on Esc" : "does not open"}`);
  }
  if (has.parts || has.tabs || has.dialogs.length) report(p, issues.length === 0, issues.slice(0, 5).join("; "));
}
report("no script errors while clicking", errors.length === 0, [...new Set(errors)].join(" | "));
await browser.close();
close();
done();
