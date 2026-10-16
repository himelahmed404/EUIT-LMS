# Design review: European IT LMS Panels

A review of all 42 screens as built from the design, the fixes made, and what's still open.
Reviewed on 16 Oct 2026 at 360–1920px. For what's on each page now, see [PAGES.md](PAGES.md).
The admin panel has since been restyled to the SchoolofGenZ console look and has three new pages, and the mentor
panel has followed it: see the next three sections.

## Admin console restyle (SchoolofGenZ look)

The admin panel now follows the SchoolofGenZ admin console (its sidebar, fonts, icons and dashboard),
in European IT colours. The student and mentor panels are unchanged for now and will follow.

**Decisions (from the owner):** keep European IT blue rather than SchoolofGenZ green; regroup the existing
admin pages into SchoolofGenZ-style sections instead of adding new pages; add a working dark mode.

| Area       | Before                                                                                       | Now                                                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type       | Geist and Geist Mono.                                                                        | Anek Bangla for text (it also covers Bangla), JetBrains Mono for section labels, codes and the Ctrl K hint. 14px base, 13px tables, 12px secondary text.                                                 |
| Sidebar    | 280px, 48px items, sub-links, black count bubbles, Notifications and My profile in the list. | 232px, "European IT · admin console", sections QUEUES / PEOPLE / CATALOG / SYSTEM in mono, 38px items with 28px icon tiles, yellow count pills, a collapse button. Sub-pages highlight their parent.     |
| Icons      | Mixed Lucide sets at 20px, 2px stroke.                                                       | SchoolofGenZ's admin icon paths at 16px, 1.9px stroke, in tiles.                                                                                                                                         |
| Top bar    | Search, language, bell and avatar; page titles and buttons in the page.                      | Page icon, title and subtitle (or breadcrumb), the page's buttons, search with Ctrl K, bell, dark mode, account menu (profile, settings, language, log out).                                             |
| Width      | A centred 1320px column.                                                                     | The full width beside the sidebar, as in SchoolofGenZ.                                                                                                                                                   |
| Overview   | Greeting, big stat cards, bar chart, attention list, quick-action tiles, a wide table.       | Stat tiles with a grey trend line and a dot for the latest week, panels with header strips on a 12-column grid, small buttons in the attention list, a compact batches table, quick actions as rows.     |
| Components | 20px radius cards, pill tabs, 44–48px controls, mono uppercase table headers.                | 12px radius panels without shadows, underline tabs, 34–38px controls, sentence-case table headers, calmer hover (no tilting icons).                                                                      |
| Smaller    | —                                                                                            | Dark mode (light by default; the moon button switches and remembers); a 68px icon rail on tablets; a drawer on phones; the action column of a wide table gets an edge only while there is more under it. |

**What it fixed on the way:** the profile said Sharmin is the Owner while the top bar said Admin (now Owner
everywhere); "Review & publish 1" disagreed with "3 courses waiting" (the queue item now says 3 and opens
the queue); two sticky side columns sat 20px low; three colours were fixed in the markup and would not have
changed in dark mode.

**Checked:** every admin page at 360–1920px in light and dark (no sideways scroll, text contrast AA in both
themes), and the new flows in `npm run check` (dark mode, collapse, drawer, account menu, Ctrl K, the
Course review link).

**Next:** the student panel (the mentor panel has followed; see below), with the same shell (`console.css` is written so another panel can
take it by adding `class="is-console"` and the console sidebar and top bar).

## New admin pages: Announcements, Activity log, Coupons & referrals

Three pages added to the admin console, following the matching SchoolofGenZ sections, plus one change
asked for by the owner: **light is the default theme** (dark only after someone presses the moon button;
it no longer follows the device).

| Page                | What it's for                                                                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Announcements       | Send a notice to all students, one course, one batch or the mentors, in the panel and by SMS. The composer shows the head count and the SMS count (160 characters per SMS, 70 with ৳ or Bangla) and asks once more before sending.     |
| Activity log        | Who changed what, when and why, for the whole team: filter by area and person, search, and each entry's device, before → after and reason. It can't be edited. Its entries agree with My profile and Roles & access.                   |
| Coupons & referrals | Discount codes (limits, expiry, disable with a reason, run an expired one again) and the refer-a-friend programme: a friend gets ৳1,000 off, the student who referred them gets ৳1,000 credit 7 days after the friend's first payment. |

All three use one new pattern, the **record list** (SchoolofGenZ's list + detail): filters with counts and
a search over the rows, the open row's record beside the list. Below 1100px the record slides over the
page; on phones each row becomes a card. Sidebar: Coupons & referrals under Catalog, a Communication
section for Announcements, Activity log under System. Seminar leads now has its own icon, so the megaphone
means Announcements.

**Checked:** the three pages at 360–1920px in light and dark (text contrast AA), and new flows in
`npm run check` (light by default on a dark device, filters and search, the composer's head count, a coupon
code that already exists, `#cp-referrals`, the record over the list on phones).

**Open suggestions:**

- **Show the referral code to students.** The programme is set up on the admin side only. The student
  Payments page should show the student's code, a Share button, their credit balance and how it comes off
  the next installment (Nusrat's ৳1,500 against installment 2). This belongs with the student panel move.
- **A code field at checkout.** `enroll/checkout.html` has no place to type a coupon or a referral code
  yet; it needs one, with the price updating and the "one code per enrollment" rule.
- **Real SMS costs.** The composer counts SMS but shows no price, because the SMS provider is still
  [SMS PROVIDER]. Add the rate once it's chosen.

## Mentor panel: the console look, and the problems it fixed

The 9 mentor pages now use the admin console's shell and components: the 232px sidebar (QUEUES: Reviews,
Student questions · TEACHING: My batches, Schedule & recordings · CONTENT: Courses · HELP: Mentor
handbook), page titles and buttons in the top bar, full-width pages, light and dark mode, the collapsible
sidebar, the tablet rail and the phone drawer. Kamrul's account menu has My profile, Notifications,
Notification settings, Language and Log out.

**What the critique found, and what changed:**

| Page              | Problem                                                                                                                                                                           | Severity | Now                                                                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reviews           | Only one project could be reviewed: "Next submission" went nowhere, and the "Reviews" breadcrumb led to the dashboard. The dashboard listed 4 of the 5 waiting.                   | High     | A review queue of all 5 (filter by batch) beside the open review, with Previous / Next and "2 of 5". The dashboard and the queue list the same 5.                                          |
| Reviews           | Approve could be pressed with marks missing or a failing total; nothing said whether the project passed.                                                                          | High     | The total says "Passes · pass mark 60" or "Below the pass mark"; Approve waits until every part has a mark and the total passes. A decision marks the project in the queue.                |
| Dashboard         | The to-do boxes only changed the box: the item didn't strike through and "1 of 4 done" never moved.                                                                               | Medium   | A real checklist: ticking strikes the item and moves the count and its bar.                                                                                                                |
| Dashboard         | A dark hero and big cards, unlike the admin Overview.                                                                                                                             | Medium   | The Overview's layout: 4 stat tiles that open their pages, then Today (timeline and the next class), To-do, Waiting for your review, Falling behind, My batches, My courses.               |
| My batches        | Only Batch 14 was reachable, and the "My batches" breadcrumb went to the dashboard.                                                                                               | Medium   | A switcher with all 3 batches above the open one, then 4 stat tiles (attendance, progress, projects, recordings) that open their tabs.                                                     |
| Courses           | The "Courses" breadcrumb was a dead link and the course in review wasn't shown.                                                                                                   | Medium   | A switcher with both courses.                                                                                                                                                              |
| Student questions | An inbox of its own design, with no search or batch filter; Send answer could be pressed with nothing typed.                                                                      | Medium   | The admin record list: Waiting / Answered / All with counts, a batch picker, a search, the question in the side pane. Send waits for text; sending moves the counts and the sidebar count. |
| Quiz builder      | The settings didn't line up (one field had a note, so its label sat higher), and the switches were squeezed into the same row with an unclear label ("Show answers after" what?). | Medium   | Quiz settings as a panel: three fields aligned at the top, then Shuffle questions and Show the answers after, each with a line saying what it does.                                        |
| Schedule          | Its own glowing, lifting upload buttons and a black "Onsite" pill.                                                                                                                | Low      | The console's primary button and a neutral badge.                                                                                                                                          |
| My profile        | Log out sat in the page header, away from the account.                                                                                                                            | Low      | In the account menu, as in the admin panel. The page is "My profile", like the menu.                                                                                                       |
| Sidebar           | The Mentor handbook was a promo card; counts were black and amber bubbles.                                                                                                        | Low      | A Help item; yellow count pills, red dots on the tablet rail.                                                                                                                              |
| Every page        | Fixed colours (white icon tiles, a light video poster in dark mode) and 16px card titles beside 14px ones.                                                                        | Low      | Tokens, so both themes work; one title size.                                                                                                                                               |

**Checked:** the 9 pages at 360–1920px in light and dark (no sideways scroll, text contrast AA in both
themes), and new flows in `npm run check` (questions open on Waiting, sending an answer, the review queue's
Next, marks adding up and Approve waiting for them, the batch picker, the to-do count).

**Open suggestions:**

- **Pages for the other batches and the course in review.** React JS Batch 6, WordPress Batch 15 and
  Advanced WordPress Theme Development are in the switchers but link to `#`.
- **A mentor handbook page** (rubrics, attendance rules, how course review works): it's in the sidebar.
- **Approving should leave the queue.** A decision marks the project, but the counts (sidebar, dashboard,
  notifications) stay at 5 until there's a backend.
- **The attendance table on phones** scrolls sideways with Present / Late / Absent at the edge; a card per
  student would be easier to mark on a phone.

## Student panel: cleaner, same look

The owner asked to keep the student panel's own design (not the console) and make it cleaner and easier to
get around, with the sidebar's groups and link order taken from SchoolofGenZ. The sidebar's look is unchanged.

| Finding                                                                                                                               | Severity | Change                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nine sidebar links in one flat list, and three of SchoolofGenZ's (Explore courses, Saved & notes, My questions) had no page           | 🔴       | Grouped **Learn / Progress / Support** in SchoolofGenZ's order; added the three pages. The tablet rail marks groups with a short rule; the phone More sheet repeats the labels. |
| A student could only reach a mentor's answer through a notification                                                                   | 🔴       | **My questions** lists every question and answer; the course player and the notification link to it. The waiting question now also shows under the lesson.                      |
| Schedule's course filter did nothing                                                                                                  | 🟡       | It now narrows classes, recordings and the attendance line.                                                                                                                     |
| Schedule: one class card tinted cyan for no reason, its badge wrapped under the title                                                 | 🟡       | One card look, badges above the title, Next class on the soonest.                                                                                                               |
| Dashboard greeting: two decorative stickers wrapped onto their own line; Help and Quiz result had floating icons that repeat the text | 🟡       | Removed.                                                                                                                                                                        |
| Phone dashboard: the hero filled the whole first screen                                                                               | 🟡       | The continue-watching card becomes a thumbnail row; the stats show on the first screen.                                                                                         |
| Tab counts (Resources 2) were the tab bar's own grey                                                                                  | 🟢       | Small chips.                                                                                                                                                                    |
| Projects: the first summary card had its own layout                                                                                   | 🟢       | Same icon, number and label as the others.                                                                                                                                      |
| Type: Geist here, Anek Bangla in the admin and mentor panels                                                                          | 🟢       | Student pages use Anek Bangla and JetBrains Mono, with the negative heading tracking removed.                                                                                   |

Still open for the student panel:

- **Bangla:** the language switch is remembered but the copy stays English.
- **Points card in the sidebar** pushes below the fold on screens under about 860px tall (the sidebar scrolls).
- **Login and enroll pages** still use Geist; switch them to the same fonts when they are next touched.
- **Public course / enroll pages** for courses other than WordPress (Explore was removed; enroll still only has WordPress).

## Overall impression

The design system is strong: calm colours that pass contrast, a clear "next step first" order on every
dashboard, and rich, realistic content. Most of the problems were in the **layout around the content**
(page width, the sidebar at tablet sizes, the phone header and tab bar) and in **controls that looked
interactive but did nothing** (tabs, the bell on half the pages, accordions, save buttons). Both are now fixed.

## Usability

| Finding                                                                                                                                                    | Severity    | What changed                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| On tablets (721–815px) the sidebar wrapped into a full-width block, so the whole menu (about 700px) sat above every page.                                  | 🔴 Critical | The sidebar now stays beside the page and folds into an 84px icon rail from 721 to 1099px, with tooltips.                                                                                                     |
| The Notifications page was a floating 440px card with no sidebar, no way back and one copy for all three roles.                                            | 🔴 Critical | A full page inside each panel (`student/`, `mentor/`, `admin/notifications.html`) with All/Unread and type filters, grouped by day, items that open their page, and "How we reach you". The old URL forwards. |
| The quiz builder showed **[object Object]** in the question and explanation boxes.                                                                         | 🔴 Critical | Real text from the design's data.                                                                                                                                                                             |
| Quiz result: the "Full marks" badge stretched across the hero and hid the +10 sticker; "10/10" overflowed the ring; "Wrong only · 0" showed an empty list. | 🔴 Critical | Badge keeps its width; the score fits; the filter is two tabs with a "no wrong answers" state; a What's next column uses the space.                                                                           |
| The bell opened a menu on 3 pages, linked away on 11 and did nothing on 12, with different counts (2, "2 new", "4 new", 3).                                | 🟡 Moderate | Same bell, menu and count on every page of a role; Mark all as read carries across pages.                                                                                                                     |
| Tabs moved a highlight but never changed the content: lesson tabs, mentor batch, admin batch detail, Courses & batches.                                    | 🟡 Moderate | Every tab switches a real panel, with arrow-key support.                                                                                                                                                      |
| The mentor sidebar, dashboard to-do and counts all pointed at a "Student questions" page that didn't exist.                                                | 🟡 Moderate | New `mentor/questions.html`: inbox, filters and an answer form.                                                                                                                                               |
| On phones the top bar took three rows (about 195px) and the tab bar scrolled sideways through 7–11 items with 2-line labels.                               | 🟡 Moderate | One-row top bar (search opens on tap); four tabs plus **More**, which opens a sheet with the rest.                                                                                                            |
| The certificate page had no way back or to print, and was a fixed 1123px sheet that scrolled sideways below that.                                          | 🟡 Moderate | Toolbar (Back, Copy verify link, Download PDF), centred, scales to fit, prints on one A4 landscape page.                                                                                                      |
| Save, Send, Approve, Nudge and similar buttons gave no feedback.                                                                                           | 🟡 Moderate | A short toast confirms each one (`data-toast`).                                                                                                                                                               |
| Leaving or submitting a timed quiz happened on one click.                                                                                                  | 🟡 Moderate | Exit and Submit ask first.                                                                                                                                                                                    |
| Admin tables were cut off on laptops: Mentors needed 1010px in 728, Batch detail's "Open" was cut to "Op".                                                 | 🟡 Moderate | Add a mentor moved into a dialog so the table gets the full width; row-action columns stay visible while a table scrolls; tighter cell padding below 1440px.                                                  |
| Course player: modules 1 and 2 toggled an arrow but had no classes; locked modules looked clickable.                                                       | 🟢 Minor    | Modules 1–3 open and close their class lists; 4–5 show as locked.                                                                                                                                             |
| Mentor review: the rubric total didn't change with the marks; device chips were static.                                                                    | 🟢 Minor    | The total adds up; Desktop / Tablet / Phone resize the preview.                                                                                                                                               |
| Settings: the section menu scrolled away on a long page.                                                                                                   | 🟢 Minor    | It follows the page and highlights the section you're in.                                                                                                                                                     |
| "Mark all present" did nothing; changing attendance gave options the wrong colour (Late turned red).                                                       | 🟢 Minor    | Mark all present works; each option keeps its own colour.                                                                                                                                                     |
| "Change what we send" had nowhere to go.                                                                                                                   | 🟢 Minor    | Notification preferences on the student and mentor profiles (`#notifications`); admin goes to Settings → SMS messages.                                                                                        |

## Visual hierarchy

- **What draws the eye first:** the dark hero on each dashboard, which is right: it holds the one thing to
  do next. On the quiz result the broken badge used to compete with the score; now the score ring leads.
- **Reading flow:** hero → stat cards → main column → side column. At 1920px the old layout pushed
  everything to the left with up to 600px of empty space on the right; the page column is now centred.
- **Emphasis:** one cyan button per screen holds up well. Stretched badges (quiz result, Certificates,
  enroll) read as banners and pulled focus; they now keep their own width.

## Consistency

| Element                                  | Issue                                                                                  | What changed                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Page width                               | Seven different widths (1040, 1100, 1160, 1200, 1240, 1280, 1360px), all left-aligned. | One centred column for every panel page (`--page-max: 1320px`); the top bar lines up with it.                 |
| Card grids                               | Four cards wrapped 3 + 1, six wrapped 4 + 2 or 5 + 1, five wrapped 4 + 1.              | Balanced grids: 4 → 4 or 2 × 2, 6 → 3 × 2, 5 → 5 or 3 + 2, 3 → 3 or stacked. Stat cards stay 2 × 2 on phones. |
| Sidebar labels                           | "Schedule & recordings" wrapped next to a count or lock.                               | Sidebar 280px with tighter gaps; every label fits on one line.                                                |
| Admin sub-pages                          | The parent item was highlighted on some sub-pages, not others.                         | The parent of the current sub-page always highlights.                                                         |
| Sparklines                               | Drawn as dashes with gaps (a dash animation on a stretched line).                      | A left-to-right wipe; the line is continuous.                                                                 |
| Help topics, role cards, payment options | 4 + 2, 5 + 1 and 3 + 1 layouts.                                                        | 3 × 2, 3 × 2 and 2 × 2.                                                                                       |
| Log in / reset password                  | The dark panel changed width between the two pages.                                    | Same split on both.                                                                                           |
| Mentor dashboard                         | The third stop of today's timeline wrapped under the first.                            | Three stops on one line; a vertical list on phones.                                                           |
| Enroll header                            | Brand pinned to the far left while the page was a centred 1200px column.               | Header aligned to the column; the order summary follows the form.                                             |

## Accessibility

- **Colour contrast:** passes AA for text throughout (checked on every page; the palette was built for it).
- **Keyboard:** dialogs return focus to what opened them; Esc closes dialogs and menus; tabs follow the
  ARIA tabs pattern (arrow keys, Home/End). The phone More sheet is a modal dialog.
- **Names and ids:** every control has an accessible name; duplicate ids in the roles dialogs (labels
  pointing at the wrong field) are now unique; all `aria-*` and `for` references resolve.
- **Touch targets:** buttons and tabs are 36–52px tall and switches 46 × 28px, all above the 24px minimum.
  Some text links in dense lists are 21px tall; worth enlarging later.
- **Motion:** everything still stops under reduced motion, including the new toast, sheet and wipe.

## What works well

- The palette, type and tiles are consistent and friendly, and badges always carry a word, not just a colour.
- Content is specific and believable (real fees in taka, installment rules, late passes), which makes the
  flows easy to judge.
- Status is shown where the decision is made: locks on paused items, "Opens after…" on locked quizzes,
  "Oldest 3 days" on waiting reviews.

## What changed in the code

| Area                                                                                                    | Files                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell: widths, sticky sidebar and top bar, icon rail, phone top bar, tab bar + More sheet, tabs, toasts | `assets/css/panel.css`, `assets/css/app.css`, `assets/js/app.js`                                                                                                                                                                                            |
| Balanced grids, sticky side columns, certificate print, notifications and questions styles              | `assets/css/app.css`                                                                                                                                                                                                                                        |
| Page scripts                                                                                            | `assets/js/pages/notifications.js`, `questions.js`, `review.js` (and the existing `help.js`)                                                                                                                                                                |
| New pages                                                                                               | `student/notifications.html`, `mentor/notifications.html`, `admin/notifications.html`, `mentor/questions.html`                                                                                                                                              |
| Captured states                                                                                         | Templates now hold only the part of the page that changes, not a copy of the whole `<main>` (pages 20–60% smaller, same rendering, checked state by state). `admin/student-record.html` still copies the whole page because the banner is added or removed. |
| Checks                                                                                                  | `tools/check/` (`npm run check`), and the design export refuses to overwrite these pages without `--force`.                                                                                                                                                 |

## Still open

### Content you need to supply

- **Support phone number** (log in page, Help → Call us).
- **Director's name** and real signatures for the certificate; a real QR code from the verify service.
- **SMS provider name** (admin settings).
- WhatsApp and phone links for the office and for seminar leads.

### Suggested new pages (in priority order)

1. **Receipt** (`student/receipt.html`): payment, method, transaction id, printable. Linked from Payments, the enroll
   result and the student record. Every "Receipt" link is a placeholder today.
2. **Mentor handbook**: rubrics, attendance rules, recording steps (the sidebar card links nowhere).
3. **Admin: all students** list with pagination and search results (pagination and Export are placeholders).
4. **Search results** page for the top-bar search on admin/mentor (student search was replaced by the next-class strip).
5. **Seminar booking** (public): the "Book a free seminar" link in the enroll flow.
6. **404 / no access** page for wrong links and for pages a role can't open.

### Suggested improvements to existing pages

- **Course builder and quiz builder:** choosing another lesson or question should open it in the editor
  (today only the selected one is drawn).
- **Leaderboard and student schedule:** the course switch only changes the button; it should change the list.
- **Admin overview:** the "This month / Last 90 days" switch should change the numbers.
- **Leaderboard data:** the classmates' names don't match the Batch 14 roster used elsewhere.
- **Bangla:** the language switch is remembered but the copy stays English; plan a translation file.
- **Downloads:** resources, project files and feedback need real files or links.

## How it was checked

- Screenshots of every page at 390, 900 and 1440px before and after, plus 360–1920px overflow checks.
- Every captured state rendered before and after the template change and compared pixel by pixel (51 states).
- `npm run check`: links, every page at nine widths (overflow, sidebar, script errors, duplicate ids,
  broken references, unnamed controls), every state, tab and dialog, and the main journeys.

## Student panel rework (Oct 2026)

Kept the student shell (`p-side` / `p-top`); did **not** move it to the admin/mentor console.

### What shipped

| Area           | Change                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| My courses     | New hub `courses.html`: online (Graphic Design → `course-player.html`) vs offline (WordPress → `course-offline.html`) vs completed (Digital Marketing certificate). Sidebar "My courses" opens the hub. |
| Offline course | New `course-offline.html`: class recordings ledger, notes, resources, Ask the mentor. Free seeking; no unlock ladder.                                                                                   |
| Online player  | Relabeled for Graphic Design B9. Stand-in video (`player.js`) finishes and unlocks the next lesson. Cinema chrome stays `#0a1b2c` / white so theme tokens do not wash out the player.                   |
| Routine        | Replaces Schedule & recordings. Month grid (`.rt-cal` / `.rt-day`), weekly strip, day + course filters on Next up. Recordings are not listed here.                                                      |
| Explore        | Page removed. Referrals and coupon redeem live on Profile → **Referrals & coupons**.                                                                                                                    |
| Profile        | Tabbed Account / Referrals & coupons / Notifications / Security; ID-card header with points and referral code.                                                                                          |
| Points         | Leaderboard total is the sum of marked project marks (164 for Nusrat). Quizzes unlock modules only; copy updated across sidebar, dashboard, leaderboard and help.                                       |
| Top bar        | Next-class strip instead of search; light/dark toggle (`data-theme-toggle`, `eit-theme`) with student dark tokens under `html.is-student[data-theme="dark"]`.                                           |
| Scripts        | `assets/js/pages/player.js`, `profile.js`, `routine.js`.                                                                                                                                                |

### Polish pass (browser-checked)

| Finding                                                           | Fix                                                                                            |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Dark mode: pills on ink heroes used `--on-ink` and went invisible | Hero pills use `--ink` (or solid soft fills); CSS safety net so theme swaps cannot blank them. |
| Routine calendar days had no boxes                                | `.rt-cal` cells get borders, radius and a clear hover/pressed state.                           |
| Dashboard WordPress card still opened the online player           | Links to `course-offline.html`; progress "11 of 12 classes" / 92%; "See all courses" → hub.    |
| Certificate checklist said "54 lessons" for WordPress             | "All 24 classes · 11 attended".                                                                |
| Routine "Add to Google Calendar" was a dead `#`                   | Removed.                                                                                       |

**Checked in the browser** (local `python3 -m http.server 8080`): dashboard, My courses, Routine, Profile — light and dark. `npm run check` was skipped for this pass.
