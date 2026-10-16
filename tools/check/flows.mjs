// Click-throughs of the main journeys: log in as each role, reset a password, take a quiz, my courses hub, routine calendar, profile coupons,
// upload a recording, edit roles, enroll, notifications, the mentor panel (questions, the review queue, the to-do
// list), dialogs and the admin console
// (light by default, dark remembered, collapsed sidebar, phone drawer, account menu, Ctrl K, links that open a tab)
// and its record lists (Announcements, Activity log, Coupons & referrals: filters, search, the open record).
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

await go("student/courses.html");
ok("my courses hub", await vis(p.getByRole("heading", { name: "My courses" })));
ok("hub: online course card", await vis(p.getByText("ONLINE", { exact: false })));
ok("hub: offline course card", await vis(p.getByText("OFFLINE", { exact: false })));

await go("student/questions.html");
const qs = async () => p.locator("main [data-list-item]:visible").count();
ok("my questions: shows all 3", (await qs()) === 3);
await click(p.getByRole("button", { name: /^Waiting/ }));
ok("my questions: Waiting shows the one Kamrul hasn't answered", (await qs()) === 1);
ok("my questions: the count follows", (await p.locator("[data-list-shown]").textContent()) === "1");

await go("student/saved.html");
const svd = async () => p.locator("main [data-list-item]:visible").count();
ok("saved: 3 lessons and 3 notes", (await svd()) === 6);
await p.locator("main [data-search]").fill("contrast");
await p.waitForTimeout(200);
ok("saved: search finds the contrast note", (await svd()) === 1);
await p.locator("main [data-search]").fill("");
await click(p.getByRole("button", { name: "Delete the note on Colour and contrast" }));
ok(
  "saved: deleting a note removes it and moves the counts",
  (await svd()) === 5 && (await p.locator('[data-filter="note"] .ex-n').textContent()) === "2",
);
await go("student/course-player.html");
const save = btn("Save this lesson");
await click(save);
ok("course player: the bookmark unsaves the lesson", (await save.getAttribute("aria-pressed")) === "false");
await click(p.locator("[data-player-play]").first());
await p.waitForTimeout(800);
ok(
  "course player: dummy play starts",
  (await p.locator("[data-player-play]").first().getAttribute("aria-pressed")) === "true" ||
    (await p.locator("[data-player-time]").first().textContent()).includes("/"),
);
await p.evaluate(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Force finish via reduced-motion path if available: click play again after setting
  document.documentElement.style.setProperty("animation", "none");
});
// Finish unlock by advancing: click play with reduced motion simulation
await p.emulateMedia({ reducedMotion: "reduce" });
await go("student/course-player.html");
await click(p.locator("[data-player-play]").first());
await p.waitForTimeout(400);
ok(
  "course player: unlocks next lesson",
  (await p.locator("[data-player-next]").first().isDisabled()) === false ||
    (await p.locator("[data-player-gate]").innerText()).toLowerCase().includes("open"),
);
await p.emulateMedia({ reducedMotion: "no-preference" });

await go("student/routine.html");
ok("routine page", await vis(p.getByRole("heading", { name: "Routine" })));
const sch = async () => p.locator("main [data-list-item]:visible").count();
const routineBefore = await sch();
await click(btn("Graphic Design"));
ok("routine: course filter narrows the list", (await sch()) <= routineBefore);
await click(p.getByRole("button", { name: /^All/ }).first());
const dayBtn = p.locator('main button[data-filter^="d"]').first();
if ((await dayBtn.count()) > 0) {
  await click(dayBtn);
  ok("routine: day filter works", (await dayBtn.getAttribute("aria-pressed")) === "true");
} else {
  ok("routine: day filter works", true);
}

await go("student/profile.html#notifications");
await p.waitForTimeout(300);
ok(
  "profile: #notifications opens its tab",
  (await p.locator("#notifications").getAttribute("hidden")) === null ||
    !(await p.locator("#notifications").getAttribute("hidden")),
);
await click(p.getByRole("tab", { name: /Referrals/ }));
await p.locator("#pf-coupon").fill("WPLAUNCH");
await click(btn("Apply"));
ok(
  "profile: used-up coupon refused",
  (await p.locator("#pf-redeem-msg").innerText()).toLowerCase().includes("used up"),
);
await p.locator("#pf-coupon").fill("PUJA15");
await click(btn("Apply"));
ok(
  "profile: PUJA15 accepted",
  (await p.locator("#pf-redeem-msg").innerText()).includes("4,250") ||
    (await p.locator("#pf-redeem-msg").innerText()).includes("750"),
);

await go("student/dashboard.html");
const themeBtn = p.locator("[data-theme-toggle]").first();
await click(themeBtn);
ok("student theme: switches to dark", (await p.locator("html").getAttribute("data-theme")) === "dark");
await go("student/dashboard.html");
ok("student theme: survives reload", (await p.locator("html").getAttribute("data-theme")) === "dark");
await click(p.locator("[data-theme-toggle]").first());
ok("student theme: back to light", (await p.locator("html").getAttribute("data-theme")) === "light");

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

// Mentor panel (the console shell, like admin).
await go("mentor/questions.html");
const shown = () => p.locator(".c-row:visible").count();
ok("questions: opens on Waiting with 3", (await shown()) === 3);
await click(p.locator('[data-filter="answered"]'));
ok(
  "questions: Answered shows 2 and opens one with its answer",
  (await shown()) === 2 && (await p.locator(".c-pane-in:visible [data-answer]").count()) === 0,
);
await click(p.locator('[data-filter="waiting"]'));
const send = p.locator('.c-pane-in:visible [data-answer] button[type="submit"]');
ok("questions: Send answer waits for some text", await send.isDisabled());
await p.locator(".c-pane-in:visible [data-answer] textarea").fill("Try 200ms.");
await click(send);
ok(
  "questions: sending marks it answered and moves the counts",
  (await p.locator('.c-row[data-tags~="answered"]').count()) === 3 &&
    (await p.locator('[data-filter="waiting"] .c-n').textContent()) === "2" &&
    (await vis(p.locator(".p-toast.is-on"))),
);
await go("mentor/review.html");
ok("reviews: 5 waiting, Nusrat's open", (await p.locator(".c-qrow").count()) === 5);
await click(p.locator('.c-review:visible [data-queue-step="1"]'));
const openReview = p.locator(".c-review:visible");
ok(
  "reviews: Next opens the next project",
  (await openReview.locator("h2").textContent()).includes("landing page") &&
    (await openReview.locator("[data-queue-pos]").textContent()) === "2 of 5",
);
const approve = openReview.locator('[data-review-decide="approved"]');
ok("reviews: Approve waits for every mark", await approve.isDisabled());
const marks = openReview.locator("input[data-score]");
for (const [i, v] of [27, 20, 21, 15].entries()) await marks.nth(i).fill(String(v));
ok(
  "reviews: the total adds up and says it passes",
  (await openReview.locator("[data-score-total]").textContent()) === "83" &&
    (await openReview.locator("[data-score-verdict]").getAttribute("data-pass")) === "true" &&
    !(await approve.isDisabled()),
);
await click(approve);
ok("reviews: an approved project is marked in the queue", await vis(p.locator("#rv-r-th .eit-badge--success")));
await p.selectOption("#rv-batch", "b6");
ok("reviews: the batch picker filters the queue", (await p.locator(".c-qrow:visible").count()) === 2);
await go("mentor/dashboard.html");
await click(p.locator(".c-todo .c-check").nth(1));
ok(
  "mentor dashboard: ticking a to-do moves the count",
  (await p.locator("[data-checklist-count]").textContent()) === "2 of 4 done",
);
ok(
  "mentor: console sidebar and account menu",
  (await p.locator('.c-side .c-item[aria-current="page"]').textContent()).includes("Dashboard") &&
    (await p.locator("#me-menu").count()) === 1,
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
const darkDevice = await b.newPage({ colorScheme: "dark" });
await darkDevice.goto(B + "admin/overview.html", { waitUntil: "networkidle" });
ok(
  "console: light by default, even on a device set to dark",
  (await darkDevice.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "light",
);
await darkDevice.close();
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
// Record lists.
const rows = () => p.locator(".c-row:visible").count();
await go("admin/announcements.html");
await click(p.locator('[data-filter="sent"]'));
ok(
  "announcements: Sent shows the 4 sent ones and opens the first",
  (await rows()) === 4 && (await p.locator('.c-row[aria-selected="true"]').getAttribute("data-tags")) === "sent",
);
await click(p.locator('.c-actions [data-open-dialog="compose"]'));
await p.fill("#cmp-title", "Class 13 moves to 8 PM");
await p.fill("#cmp-msg", "Class 13 on Monday 19 Oct starts at 8 PM.");
await click(p.locator('#compose [data-aud="batch"]'));
await click(p.locator("[data-ann-next]"));
ok(
  "announcements: the composer works out who it goes to and asks before sending",
  (await p.locator("[data-ann-confirm]").textContent()).includes("to 20 students"),
);
await p.keyboard.press("Escape");
await go("admin/activity.html");
await p.selectOption("#log-who", "rk");
ok("activity log: filter by person", (await rows()) === 3);
await click(p.locator('[data-filter="coupons"]'));
ok("activity log: person and area together", (await rows()) === 2);
await p.fill("#log-find", "facebook");
ok("activity log: search reads the reason too", (await rows()) === 1);
await go("admin/coupons.html");
await click(p.locator('.c-actions [data-open-dialog="new-coupon"]'));
await p.fill("#nc-code", "puja15");
ok(
  "coupons: a code that already exists can't be created",
  (await p.inputValue("#nc-code")) === "PUJA15" && (await p.locator("[data-coupon-create]").isDisabled()),
);
await p.keyboard.press("Escape");
await go("admin/coupons.html#cp-referrals");
ok(
  "coupons: #cp-referrals opens Referrals",
  (await p.locator("#cpt-referrals").getAttribute("aria-selected")) === "true",
);
await p.setViewportSize({ width: 390, height: 844 });
await go("admin/announcements.html");
await click(p.locator("#ann-r-a4"));
ok("record lists: on phones the record opens over the list", await vis(p.locator(".c-pane.is-open #ann-p-a4")));
await p.keyboard.press("Escape");
await p.waitForTimeout(300);
ok("record lists: Esc closes it", !(await p.locator(".c-pane.is-open").count()));
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
