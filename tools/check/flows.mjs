// Click-throughs of the main journeys: log in as each role, reset a password, take a quiz,
// upload a recording, edit roles, enroll, notifications, mentor questions, dialogs and the admin console
// (light/dark, collapsed sidebar, phone drawer, account menu, Ctrl K, links that open a tab).
import { chromium } from "playwright";
import { startServer, report, done } from "./lib.mjs";

const { base: B, close } = await startServer();
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
const go = async (u) => {
  await p.goto(B + u, { waitUntil: "networkidle" });
  await p.waitForTimeout(300);
};
const click = async (loc) => {
  await loc.click();
  await p.waitForTimeout(250);
};
const btn = (name, exact = true) => p.getByRole("button", { name, exact });
const vis = async (loc) => (await loc.count()) > 0 && (await loc.first().isVisible());
const ok = (name, cond) => report(name, !!cond);

await go("index.html");
await click(btn("Mentor"));
await click(p.getByRole("link", { name: "Log in" }));
ok("login as mentor -> mentor dashboard", p.url().endsWith("mentor/dashboard.html"));

await go("forgot-password.html");
ok("forgot starts at phone step", await vis(p.getByRole("heading", { name: "Reset your password" })));
await click(btn("Send code"));
ok("-> code step", await vis(p.getByRole("heading", { name: "Enter the code" })));
await click(btn("Check code"));
ok("-> new password", await vis(p.getByRole("heading", { name: "Choose a new password" })));
await click(btn("Save new password"));
ok("-> done", await vis(p.getByRole("heading", { name: "Password changed" })));

await go("student/quiz.html");
const cur = async () => p.locator('button[aria-current="step"]').getAttribute("aria-label");
ok("quiz opens on Q4: " + (await cur()), (await cur()).startsWith("Question 4"));
await click(btn("Next question"));
ok("next -> Q5: " + (await cur()), (await cur()).startsWith("Question 5"));
await click(p.locator('button[aria-label^="Question 9,"]'));
ok("map -> Q9", (await cur()).startsWith("Question 9"));
const t1 = await p.locator("[data-countdown]").first().textContent();
await p.waitForTimeout(2100);
const t2 = await p.locator("[data-countdown]").first().textContent();
ok(`quiz timer ticks (${t1.trim()} -> ${t2.trim()})`, t1 !== t2);
await click(p.locator('[role="radio"]').nth(2));
ok("answer picks", (await p.locator('[role="radio"]').nth(2).getAttribute("aria-checked")) === "true");

await go("student/projects.html");
const rows0 = await p.locator("main").innerText();
await click(btn("Marked"));
const rows1 = await p.locator("main").innerText();
ok("projects filter changes list", rows0 !== rows1 && (await btn("Marked").getAttribute("aria-pressed")) === "true");

await go("mentor/schedule.html");
await click(btn("Upload recording").first());
ok("upload dialog opens", await vis(p.locator("#upload-dialog")));
ok("start disabled before file", await btn("Start upload").isDisabled());
await click(btn("Choose file"));
ok("file chosen", await vis(p.getByText("class-12-custom-header.mp4")));
await click(btn("Start upload"));
ok(
  "dialog closed + uploading",
  !(await vis(p.locator("#upload-dialog"))) && (await vis(p.getByText("62% uploaded", { exact: false }))),
);
await click(btn("Publish when upload finishes"));
ok("queued", !(await vis(p.getByText("62% uploaded", { exact: false }))));

await go("admin/roles.html");
await click(btn("Invite team member"));
ok("invite dialog", await vis(p.locator("#invite-dialog")));
await p.keyboard.press("Escape");
await p.waitForTimeout(200);
ok("esc closes", !(await vis(p.locator("#invite-dialog"))));
const ed0 = await p.locator('section[aria-labelledby="perm-title"]').innerText();
await click(p.locator(".ro-grid > button").nth(3));
const ed1 = await p.locator('section[aria-labelledby="perm-title"]').innerText();
ok("role card swaps permissions", ed0 !== ed1);
await click(p.locator('section[aria-labelledby="team-title"] button.p-link', { hasText: "Edit" }).first());
ok("edit member dialog", await vis(p.locator("[data-dialog]:not([hidden])")));
await click(p.locator("[data-dialog]:not([hidden]) [data-close-dialog]").first());
await click(p.locator('section[aria-labelledby="team-title"] .p-seg button').nth(1));
await click(p.locator('section[aria-labelledby="team-title"] button.p-link', { hasText: "Edit" }).first());
const dn = await p.locator("[data-dialog]:not([hidden])").getAttribute("id");
ok("mentor-tab edit dialog " + dn, dn && dn.startsWith("edit-1-"));

await go("enroll/course.html");
const s0 = await p.locator("main").innerText();
await click(p.locator('[aria-label="Class format"] [role="radio"]').nth(1));
await click(p.locator('[aria-label="Payment plan"] [role="radio"]').nth(0));
const s1 = await p.locator("main").innerText();
ok("enroll combos change summary", s0 !== s1);

await go("student/quizzes.html");
const q0 = await p.locator("main").innerText();
await click(p.locator('.p-seg[aria-label="Course"] button').nth(1));
const q1 = await p.locator("main").innerText();
ok("course switch", q0 !== q1);
const exp = p.locator("main button[aria-expanded]").first();
const before = await p.locator("main").innerText();
await click(exp);
ok("module toggles in 2nd course", before !== (await p.locator("main").innerText()));

await go("student/help.html");
{
  const q = p.locator(".hp-q").nth(3);
  const id = (await q.getAttribute("data-reveal")).split(" ")[0];
  await click(q);
  ok("faq opens", await vis(p.locator("#" + id)));
}

await go("student/notifications.html");
await click(p.locator('[data-notif-show="unread"]'));
ok("unread filter shows 2", (await p.locator(".nt-item:visible").count()) === 2);
await click(p.locator('[data-notif-show="all"]'));
await click(p.locator('[data-notif-type="payments"]'));
ok("type filter: payments", (await p.locator(".nt-item:visible").count()) === 2);
await click(p.locator("main .p-ghostbtn[data-mark-read]"));
ok("mark read", (await p.locator("[data-unread]").count()) === 0 && (await p.locator(".p-badge-count").count()) === 0);
await go("student/projects.html");
ok("read state carries to next page", (await p.locator(".p-badge-count").count()) === 0);

await go("student/dashboard.html");
await click(p.locator(".p-top-right .p-iconbtn"));
ok("bell menu", await vis(p.locator("#notif-menu")));
await click(p.locator("main h1").first());
ok("click outside closes", !(await vis(p.locator("#notif-menu"))));

await go("admin/settings.html");
const sw = p.locator('[aria-labelledby="pause-label"]');
await click(sw);
ok("pause switch hides block", (await sw.getAttribute("aria-checked")) === "false");

await go("mentor/questions.html");
ok("questions: waiting filter shows 3", (await p.locator(".qa-item:visible").count()) === 3);
await click(p.locator('[data-qa-show="answered"]'));
ok(
  "questions: answered filter opens an answered one",
  (await p.locator(".qa-item:visible").count()) === 2 &&
    (await p.locator(".qa-detail:visible .qa-msg--mentor").count()) === 1,
);
await click(p.locator('[data-qa-show="waiting"]'));
await p.locator(".qa-detail:visible textarea").fill("Try 200ms.");
await click(p.locator('.qa-detail:visible button[type="submit"]'));
ok(
  "questions: sending marks it answered",
  (await p.locator('.qa-item[data-status="answered"]').count()) === 3 && (await vis(p.locator(".p-toast.is-on"))),
);
await go("student/quiz.html");
await click(p.locator('a[data-open-dialog="submit-quiz"]'));
ok("quiz submit asks first", await vis(p.locator("#submit-quiz")));
await go("admin/mentors.html");
await click(btn("Add a mentor"));
ok("add mentor dialog", await vis(p.locator("#add-mentor")));
// Admin console.
await go("admin/overview.html");
const attr = (a) => p.evaluate((n) => document.documentElement.getAttribute(n), a);
const themeBefore = await attr("data-theme");
await click(p.locator("[data-theme-toggle]"));
const themeAfter = await attr("data-theme");
await go("admin/students.html");
ok(
  "console: dark mode switch, remembered on the next page",
  themeBefore !== themeAfter && (await attr("data-theme")) === themeAfter,
);
await click(p.locator("[data-theme-toggle]"));
await click(p.locator(".c-collapse"));
const sideW = () => p.evaluate(() => document.querySelector(".c-side").getBoundingClientRect().width);
await go("admin/mentors.html");
ok("console: collapsed sidebar, remembered on the next page", (await sideW()) < 80);
await click(p.locator(".c-expand"));
ok("console: sidebar expands again", (await sideW()) > 200);
await click(p.locator(".c-me"));
ok("console: account menu", await vis(p.locator("#me-menu")));
await p.keyboard.press("Escape");
await p.keyboard.press("Control+k");
ok("console: Ctrl K goes to search", await p.evaluate(() => !!document.activeElement.closest(".c-search")));
await click(p.locator('.c-nav a[href="courses.html#cbp-queue"]'));
await p.waitForLoadState("networkidle");
const current = () => p.evaluate(() => document.querySelector(".c-nav [aria-current]").textContent.trim());
ok(
  "console: Course review opens the review queue tab",
  (await p.locator("#cbt-queue").getAttribute("aria-selected")) === "true" &&
    (await current()).startsWith("Course review"),
);
await click(p.locator("#cbt-courses"));
ok("console: Courses tab moves the sidebar highlight back", (await current()).startsWith("Courses"));
await p.setViewportSize({ width: 390, height: 844 });
await go("admin/students.html");
await click(p.locator("[data-nav-open]"));
ok("console: phone menu opens as a drawer", await vis(p.locator(".c-side.is-open")));
await p.keyboard.press("Escape");
await p.waitForTimeout(300);
ok("console: Esc closes the drawer", !(await p.locator(".c-side.is-open").count()));
await p.setViewportSize({ width: 1440, height: 900 });

report("no script errors", errs.length === 0, errs.join(" | "));
await b.close();
close();
done();
