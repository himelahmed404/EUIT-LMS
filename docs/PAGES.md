# Page map

Every page in the site: what it's for, what's on it, what you can click, and what isn't built yet.
Read this before you change a page, so you don't have to open all 49 to find your way.

- How the shared behaviour works (states, tabs, dialogs, toasts): [README](../README.md#how-the-interactivity-works).
- What was changed after the design review, and why: [DESIGN-REVIEW.md](DESIGN-REVIEW.md).
- Checks that cover every page: `npm run check` (see [Checking your changes](#checking-your-changes)).

## Contents

- [Demo people and data](#demo-people-and-data)
- [Shared parts of every panel page](#shared-parts-of-every-panel-page)
- [Public pages](#public-pages): log in, reset password, enroll, UI guide
- [Student panel](#student-panel) (19 pages)
- [Mentor panel](#mentor-panel) (9 pages)
- [Admin panel](#admin-panel) (16 pages, console look)
- [Links that are still placeholders](#links-that-are-still-placeholders)
- [Checking your changes](#checking-your-changes)

## Demo people and data

The screens share one small, made-up cast. Keep new content consistent with it.

| Who                                     | Where they appear                                  | Facts the pages rely on                                                                                                                                                                                                                   |
| --------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nusrat Jahan**, student `EIT-24-0148` | Every student page except Paused                   | WordPress Batch 14 (offline, Lab 2, Mirpur-10, Mon and Thu 7–9 PM) and Graphic Design Batch 9 (online). 90 points, #3 of 20. Installment 2 of 3 (৳5,000) due 15 Nov. Class 12 quiz open, Class 13 on Mon 19 Oct. Phone `+880 17XXXXXX48`. |
| **Mehedi Hasan**, student `EIT-24-0155` | `student/access-paused.html`, admin student record | Access paused 8 Oct: installment 2 was due 1 Oct. 60 points, #9.                                                                                                                                                                          |
| **Kamrul Hasan**, mentor                | Mentor panel, Nusrat's mentor                      | WordPress B14 and B15, React JS B6. 5 projects to review (Nusrat, Tanvir, Mehedi from B14; Tahmid Islam and Sadia Afrin from B6), 3 student questions, Class 12 recording due 9:00 AM.                                                    |
| **Sharmin Sultana**, admin (Owner)      | Admin panel                                        | Overview numbers for October 2026: ৳6,85,000 collected, 58 enrollments, 14 overdue.                                                                                                                                                       |
| Batch 14 roster                         | Mentor batch, admin batch detail                   | Nusrat, Tanvir Hasan, Mehedi Hasan, Rafiq Islam (behind, 67% attendance), Afsana Mim, Arif Hossain, Jannatul Ferdous, Sabbir Ahmed.                                                                                                       |

"Today" in the demo is **Thursday 15 October 2026**. Known mismatch carried over from the design: the
leaderboard lists a different set of classmates (Tanvir A., Farhana R., Rakib H. and others) from the
Batch 14 roster above.

Content the design left as placeholders (you need to supply it): **[SUPPORT PHONE]** (log in, Help), **[DIRECTOR NAME]**
(certificate) and **[SMS PROVIDER]** (admin settings).

## Shared parts of every panel page

Each panel page is a self-contained HTML file. The sidebar, top bar and bell menu are **repeated in
every page of that role**: if you change one, change it in all of that role's pages (a find-and-replace
across `student/*.html`, `mentor/*.html` or `admin/*.html`).

### Student panel

| Part                           | Markup                                                                                     | Notes                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar                        | `<aside class="p-side">` → `<nav class="p-nav">`                                           | The current page's link has `aria-current="page"`. Labels are wrapped in `<span class="p-nav-text">`; long ones also have `<span class="p-nav-short" aria-hidden="true">` for the phone tab bar.                                                                                                            |
| Sidebar card                   | `.p-help` at the bottom of the sidebar                                                     | Student: points (Leaderboard shows "+10 waiting"; Paused shows "60 points").                                                                                                                                                                                                                                |
| Top bar                        | `<header class="p-top">`                                                                   | Search (not wired), language switch, bell, profile chip (`.p-me`, links to the role's profile page).                                                                                                                                                                                                        |
| Language switch                | `.eit-seg[aria-label="Language"]`                                                          | EN / বাং. The choice is saved in `localStorage` (`eit-lang`) and kept across pages. The copy stays English.                                                                                                                                                                                                 |
| Bell                           | `button[data-notif-scope]` with `aria-controls="notif-menu"`, and `#notif-menu.p-dropdown` | `data-notif-scope` is `student`, `mentor` or `admin`. Same items and count on every page of a role: student 2 unread, mentor 3, admin 3 (the paused student has their own menu with 1). "Mark all as read" clears the dots and the count and remembers it for that role (`localStorage` `eit-read-<role>`). |
| Phone layout (720px and below) | Built by `app.js`                                                                          | The top bar becomes one row (logo, search icon, language, bell, avatar). The sidebar becomes a bottom tab bar with the first four links plus **More**, which opens a sheet with everything else.                                                                                                            |
| Tablet layout (721–1099px)     | CSS only                                                                                   | The sidebar becomes an 84px icon rail; hovering an icon shows its name.                                                                                                                                                                                                                                     |

### Console (`admin/*.html` and `mentor/*.html`)

The admin and mentor panels follow the SchoolofGenZ admin console, in European IT colours. Their pages have
`<html class="is-console">`, load `assets/css/console.css` and, in `<head>` without `defer`,
`assets/js/theme.js` (it sets light or dark and the collapsed sidebar before the page paints).
Fonts: Anek Bangla for text, JetBrains Mono for section labels, codes and the Ctrl K hint.

| Part                    | Markup                                                                     | Notes                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell                   | `<div class="p-shell p-console">` → `aside.c-side` + `.p-content`          | Pages use the full width beside the sidebar (no 1320px column).                                                                                                                                                                                                                                                                                           |
| Sidebar                 | `aside.c-side#c-side` → `.c-brand` + `nav.c-nav` → `.c-group` → `a.c-item` | 232px. "European IT · admin console" (or "mentor panel") with the collapse button. Groups with mono labels (`.c-group-label`). Each item: `.c-ico` (28px tile, 16px icon) + `.c-label` + optional `.c-count` (yellow pill). Current page: `aria-current="page"`; the parent of a sub-page: `aria-current="true"`.                                         |
| Top bar                 | `header.c-top` → `.c-top-in`                                               | Phone menu button, page icon (`.c-top-ico`), title (`h1`, or `p.c-top-h` on record pages) with a subtitle (`.c-top-sub`) or breadcrumb (`nav.c-crumbs`), the page's own buttons (`.c-actions`), search (`label.c-search`, Ctrl K / ⌘ K), bell, theme button, account.                                                                                     |
| Account menu            | `button.c-me` → `#me-menu.c-pop[data-popover]`                             | Admin: My profile, Notifications, Settings, Language (EN / বাং), Log out. Mentor: My profile, Notifications, Notification settings (`profile.html#notifications`), Language, Log out.                                                                                                                                                                     |
| Light / dark            | `button[data-theme-toggle]` sets `html[data-theme]`                        | Light by default; the choice is saved in `localStorage` (`eit-theme`). Dark colours are the tokens under `html.is-console[data-theme="dark"]` in `console.css`, so pages must use tokens (`var(--ink)`, `var(--surface-card)`…), never fixed colours.                                                                                                     |
| Collapse                | `button[data-nav-toggle]` (`.c-collapse`, and `.c-expand` when collapsed)  | 1280px and up: the sidebar folds to a 68px icon rail; saved in `localStorage` (`eit-nav`).                                                                                                                                                                                                                                                                |
| Tablet (768–1279px)     | CSS only                                                                   | Always the 68px icon rail; counts become a red dot on the icon; names show on hover.                                                                                                                                                                                                                                                                      |
| Phone (767px and below) | `button[data-nav-open]` (`.c-menu`)                                        | The sidebar is a drawer over the page (Esc, the backdrop or ✕ closes it). Page buttons move to a second row of the top bar.                                                                                                                                                                                                                               |
| Record lists            | `.c-work` → `section.c-list` + `aside.c-pane`                              | Announcements, Activity log, Coupons, mentor Student questions: underline filters with counts (`button[data-filter]`), a search (`data-search`), rows as tabs (`.c-row`, tags in `data-tags`), the open row's record in the pane. Below 1100px the record slides over the page; on phones each row is a card. A list can open on a filter other than All. |
| Review queue (mentor)   | `.c-queue` → `section.c-list.c-qlist` + `.c-qwork`                         | The list of waiting projects beside the open project's review (each review is a tab panel). Below 1100px the queue is a row of cards that scrolls sideways, above the review. `assets/js/pages/review.js`.                                                                                                                                                |
| Switcher (mentor)       | `nav.c-switch` → `a.c-switch-item`                                         | The mentor's batches (My batches) or courses (Courses) above the open one, which has `aria-current="page"`. The others link to `#` until they have pages. On phones it scrolls sideways.                                                                                                                                                                  |

Sidebar links per role:

- **Student** (grouped like SchoolofGenZ's sidebar): **Learn:** Dashboard, My courses (`course-player.html`),
  Quizzes, Projects, Schedule & recordings, Explore courses · **Progress:** Leaderboard, Certificates · **Support:** My questions,
  Payments, Help. Labels are `span.p-nav-label` inside the nav; the tablet rail shows a short rule between groups, and
  the phone More sheet repeats the labels. Profile is reached from the avatar.
- **Mentor:** Dashboard · **Queues:** Reviews 5 (`review.html`), Student questions 3 (`questions.html`) ·
  **Teaching:** My batches (`batch.html`), Schedule & recordings 1 · **Content:** Courses (`course-builder.html`;
  the Quiz builder highlights it) · **Help:** Mentor handbook (no page yet). Notifications and My profile are in
  the bell and the account menu.
- **Admin:** Overview · **Queues:** Course review 3 (`courses.html#cbp-queue`, opens the Review queue tab),
  Seminar leads 6 · **People:** Students & payments, Mentors · **Catalog:** Courses & batches, Coupons &
  referrals · **Communication:** Announcements · **System:** Settings, Roles & access, Activity log. Course review, Batch detail and Create a batch highlight their parent (Course
  review, Courses & batches); Student record highlights Students & payments. Notifications and My profile
  are in the bell and the account menu.

Page widths: student pages share one column, up to 1320px wide and centred beside the sidebar
(`--page-max` in `panel.css`). Admin and mentor pages use the full width. The enroll pages use a 1200px column; the
enroll result uses 760px.

## Public pages

### `index.html` · Log in

Split screen: dark brand panel (headline, support line) and the log-in form (mobile number with +880,
password, keep me logged in, forgot password). **Demo: log in as** switch (Student, Mentor or Admin) sets
where **Log in** goes; the form also submits there. "Browse courses" opens the enroll flow.
Placeholder: **[SUPPORT PHONE]**; "ask on WhatsApp" has no link yet.

### `forgot-password.html` · Reset your password

Four steps as captured states (`phone` → `code` → `reset` → `done`) in the `reset-steps` region, with a
3-segment progress bar. Same split screen as log in (both left panels are `flex: 1 1 460px`).
"Ask the office on WhatsApp" is a placeholder.

### `enroll/course.html` · Step 1: batch and plan

Course summary, then three choices: **format** (offline ৳15,000 / online ৳10,000), **batch** (16 or 18) and
**plan** (3 installments or pay in full). The order summary on the right follows the page on wide screens
(`.p-sticky`). Every combination is a captured state, `enroll:<format>|<batch>|<plan>` (8 templates for
the `enroll` region). "Continue" goes to checkout. "Book a free seminar" is a placeholder.

### `enroll/checkout.html` · Step 2: account and payment

Create account (name, mobile, password, email), pay with bKash / Nagad / Rocket / Card (2 × 2), agree to
terms, order summary with the 3 installment dates. Pay goes to the result page. "course terms" is a placeholder.

### `enroll/result.html` · Step 3: you're in

Confirmation card: paid ৳5,000, transaction id, next payment, three next steps, **Go to my dashboard**.
"Download receipt" is a placeholder.

### `ui-guide.html` · UI guide

The design's own reference: principles, icon set, colour roles, components in every state. Not part of
the product; useful when adding new screens. Not wired: its sample links.

## Student panel

### `student/dashboard.html` · Dashboard

Hero ("Good evening, Nusrat", continue watching Class 12), 4 stat cards (lessons, attendance, projects,
points), My courses (2 cards), Up next (quiz, project, module lock), Next class, Installment, Certificate
progress. Every card links to its page.

### `student/course-player.html` · Course player (My courses)

Video area with locked skip-ahead, lesson title, "Class 13 opens when you finish this video" card.
**Tabs:** Overview (what the lesson covers), Resources (2 downloads), Ask the mentor (question form, and
the earlier question answered by Kamrul). Right column: course content by module. Modules 1–3 open and
close (`button[aria-expanded]` + `data-panel`); 4 and 5 are locked. Placeholders: Download links, Previous lesson.

### `student/quizzes.html` · Quizzes

Course switch (WordPress B14 / Graphic Design B9) is two captured states (`course:0`, `course:1`), each
split over three regions (`course-1` header, `course-2` banner, `course-3` module list). Stats, module unlock banner, quizzes grouped by module (accordions are reveal triggers,
ids prefixed `c0`/`c1` per course). "Take quiz" opens the quiz; "Review answers" opens the result.

### `student/quiz.html` · Quiz (focused mode, no sidebar)

Top bar: Exit, quiz name, countdown timer (`data-countdown`, ticks every second), Submit.
**Exit** and **Submit** ask first (dialogs `#exit-quiz`, `#submit-quiz`). Each question is a captured state
(`q1`…`q10`, region `quiz`): Next, Previous and the question map switch between them. Answers are radio
cards; Flag to check again.

### `student/quiz-result.html` · Quiz result

Hero with the score ring (10/10), stats (points, module progress, time), **Check your answers** with tabs
**All 10 / Wrong only** (the second shows a "no wrong answers" state), and a **What's next** column
(Class 13 steps, Back to the course, How points work).

### `student/projects.html` · Projects

Stats, filter chips (All / To submit / In review / Marked) as captured states (`filtered-1` is the count,
`filtered-2` the list), project rows with Details, How projects are marked, Late pass rules.

### `student/project-detail.html` · Project details (Social media post set)

Brief, what to hand in, resources, marking rubric; Submit your project form (link, file drop, note, Submit
shows a toast); **Need more time?** late pass picker (+1/+2/+3 days) and **Use 30 points** (states `none` →
`bought` in the `late-pass` region); timeline. Placeholders: the two resource downloads.

### `student/project-feedback.html` · Project feedback (Personal portfolio, 86/100)

Score ring, marks by criterion, mentor feedback, notes on the page, submission, timeline.
Placeholders: Download feedback, Message Kamrul, the portfolio link.

### `student/schedule.html` · Schedule & recordings

Course filter (not wired), Coming up (3 classes), Class recordings list with Watch buttons.
Placeholder: Add to Google Calendar.

### `student/leaderboard.html` · Leaderboard

Course switch (button state only), your position hero with podium, batch ranking table ("Show all 20
students" reveals the rest), How points work, Points history, "Show my name to classmates" switch.

### `student/explore.html` · Explore courses

Courses Nusrat can add, from the admin catalogue. Track chips with counts (All / Development / Design /
Marketing / Networking & Security) filter the cards (`data-list`, see README); a section with nothing left
to show hides. **Open to join:** React JS (Batch 7, Sat 31 Oct, Zoom), Cyber Security (Batch 4, Mon 26 Oct,
Lab 3), CCNA (Batch 8, full: Join the waiting list) and UI/UX Design (no batch yet: Tell me when it opens);
each shows fee, how to pay and the next batch. **Already yours:** WordPress B14 and Graphic Design B9 (Open
course) and Digital Marketing Essentials (completed, See certificate). **Bring a friend:** her referral code
NUSRAT148 with Copy code, and the numbers from admin Coupons & referrals (3 friends, ৳1,500 credit, ৳1,000
adding Wed 21 Oct). Placeholder: See course (no course pages yet).

### `student/certificates.html` · Certificates

Earned certificate preview with **Copy link** (copies the verify URL) and **View and download PDF**;
"On the way" progress for the two current courses. Placeholder: Add to LinkedIn.

### `student/certificate.html` · Certificate (A4 print page, no sidebar)

Toolbar: Back to certificates, **Copy verify link**, **Download PDF** (opens the print dialog; the page
prints on one A4 landscape sheet without the toolbar). The 1123 × 794 sheet scales down to fit narrow
screens (`data-fit`). Placeholder: **[DIRECTOR NAME]**; the signatures and QR code are drawn stand-ins.

### `student/questions.html` · My questions

Nusrat's questions to her mentors (the student side of mentor Student questions): one waiting (Kamrul, 2 h
ago, Class 12 at 11:36: is 400ms too slow for the menu slide-in) and two answered (Kamrul 12 Oct: why the
menu isn't showing; Nadia Rahman 8 Oct: margins in Graphic Design Live 6). Chips All / Waiting / Answered
filter the cards (`data-list`) and "n shown" follows. Each card has Open the lesson, and answered ones This
helped (toast). Side: How asking works (Ask about your current lesson opens the course player's Ask the
mentor tab, `course-player.html#lp-ask`) and Not about a lesson? (Help). The course player's Ask the mentor
tab lists both of the lesson's questions and links here; so does the notification "Kamrul answered your
question".

### `student/payments.html` · Payments

WordPress plan with 3 installments, Graphic Design paid in full, payment history, Next payment card with
bKash / Nagad / Rocket / Card and **Pay ৳5,000**. Placeholders: Receipt links, Pay the full ৳10,000.

### `student/access-paused.html` · Access paused (Mehedi Hasan)

What happens when an installment is 7+ days late: locked sidebar items (lock icons), the paused card with
**Pay ৳5,000 now**, what's paused vs still open, and a side column with the amount owed and the paused course.

### `student/profile.html` · Profile & settings

Personal details, **Notifications** (`#notifications`: which updates also come by SMS; payment reminders
can't be turned off while paying in parts), Password, Logged-in devices. Save buttons show a toast.
Placeholder: Change photo.

### `student/help.html` · Help centre

Search with popular chips, 6 topic cards (3 × 2), 21 questions with answers (each opens with a reveal;
"Did this help?" answers inline). `assets/js/pages/help.js` filters by topic and search text and shows a
no-results state. The contact column follows the page on wide screens. Placeholders: **[SUPPORT PHONE]**,
Chat / Call / Map links.

### `student/notifications.html` · Notifications

All / Unread and type chips (Classes, Quizzes, Projects, Payments, Messages), items grouped Today /
Yesterday / Earlier, each linking to its page; Mark all as read; How we reach you; Missed something?
Filtering is `assets/js/pages/notifications.js`.

## Mentor panel

All mentor pages use the console shell (see above), with the same light and dark modes as the admin panel.

### `mentor/dashboard.html` · Dashboard

The admin Overview's layout. Top bar: "Good evening, Kamrul · Thu 15 Oct". 4 stat tiles (students you
teach, average progress, projects to review with "3 days waiting", class attendance; each opens its page).
Panels: **Today** (7:00 PM done, 9:30 PM next, recording due by 9:00 AM, and the next class with Start
class and Open roster), **Today's to-do** (the boxes tick, strike the item through and move "1 of 4 done"
and its bar: `data-checklist` in `app.js`), **Waiting for your review** (all 5, newest first), **Falling
behind** (Nudge shows a toast), **My batches** (next class and average progress), **My courses**.

### `mentor/batch.html` · My batches (WordPress Batch 14)

Top bar: My batches. A switcher with the 3 batches (Batch 14 open; React JS B6 and WordPress B15 link to `#`).
The batch's name, facts and the upload reminder, then 4 stat tiles (attendance, progress, projects to
review, recordings; each opens its tab or page). **Tabs:** Attendance (Present / Late / Absent per student,
**Mark all present**, Save attendance), Students (progress, quiz average, points, last active), Projects
(Milestone 2 status and marks, Review / Nudge), Schedule (coming up and past classes).

### `mentor/review.html` · Reviews

The review queue: the 5 waiting projects (newest first, filter by batch) beside the open one's review.
Each review has the project's facts, Previous / Next ("1 of 5"), the submission with **Desktop 1440 /
Tablet 768 / Phone 360** (resizes the preview), the student's note (and, for Sadia's resubmission, your
notes on the first attempt), and a rubric whose marks **add up to the total** and say whether it passes
(pass mark 60). **Approve** waits until every part has a mark and the total passes; Approve and Request
changes show a toast and mark the project in the queue. Nusrat's review is already filled in.
`assets/js/pages/review.js`. Placeholders: the live links and Download files.

### `mentor/questions.html` · Student questions

A record list like the admin's: Waiting 3 / Answered 2 / All 5, a batch picker and a search. It opens on
Waiting. The open question's record (facts, the student's message, a link to the time in the video) has the
answer form: **Send answer** waits for some text, then marks it answered in the list, the record, the filter
counts and the sidebar count, and shows a toast. Answered questions show your answer and "Add to the lesson
FAQ". `assets/js/pages/questions.js`.

### `mentor/course-builder.html` · Courses (WooCommerce Store Building)

Top bar: Courses. A switcher with the 2 courses (the one in review links to `#`). Curriculum with drag
handles, lesson editor (title, video, what students will do, unlock rules, counts as finished at), Submit
for review (toast). Placeholders: Preview as student, choosing another lesson, drag to reorder, Replace video.

### `mentor/quiz-builder.html` · Quiz builder (Class 3 quiz)

Top bar: Quiz builder with the breadcrumb (Courses / WooCommerce Store Building). Quiz settings (points,
time limit, retry after; Shuffle questions and Show the answers after, each explained), question list,
question editor (one answer / true-false, answers with the right one marked, why it's right). Save quiz
shows a toast. Not wired: picking another question.

### `mentor/schedule.html` · Schedule & recordings

Top bar: Upload recording. Classes waiting for upload, This week, Past recordings. **Upload recording**
opens `#upload-dialog` (choose file → `upload-file` state; Start upload → `uploading`; publish when done →
`queued`).

### `mentor/profile.html` · My profile

Public profile preview and editor (photo, name, title, experience, bio, skills, show on website),
Teaching, **Notifications** (`#notifications`), Login and security. Log out is in the account menu.
Placeholders: Change password, Manage devices.

### `mentor/notifications.html` · Notifications

Same layout as the admin version with mentor items (submissions, questions, recordings, course review).
Mark all as read is in the top bar.

## Admin panel

### `admin/overview.html` · Overview

A SchoolofGenZ-style dashboard. Top bar: the period switch (This month / Last 90 days, button state only).
4 stat tiles (label, icon, value that counts up, grey sparkline with a dot for the latest week, change
against September); a 12-column grid of panels with header strips: Enrollments per week (bar chart with a
scale), Needs your attention (5 rows with small buttons), Upcoming batches (seats and status), Quick actions
(Create a batch, Record cash payment, Invite a mentor, Schedule a seminar, Send an announcement).

### `admin/courses.html` · Courses & batches

Top bar: Add course. **Tabs** (linkable: `courses.html#cbp-courses`, `#cbp-batches`, `#cbp-queue`; the
sidebar's Course review item is current while the queue is open): Courses (review-queue notice, track chips as captured states of the table rows, courses table
with Edit → course review), Batches (all batches with seats and status; Create a batch), Review queue (3
courses: Send back / Review and publish).

### `admin/course-review.html` · Review & publish

Top bar: "Review & publish" with the breadcrumb Courses & batches / Review queue. The course's name, status
and Publish course / Send back to mentor sit at the top of the page. Before-publishing checklist, curriculum with Watch links, price and installments (the plan choice, Full only
/ 2 / 3 / 4 parts, is a captured state of the price card), list on the website, note to the mentor;
Publish course / Send back to mentor (toasts).

### `admin/batch-detail.html` · Batch detail (WordPress Batch 14)

Top bar: "Batch detail" with the breadcrumb Courses & batches / Batches. The batch name, badges, schedule
and Edit batch / SMS the batch at the top of the page, then 5 stats. **Tabs:** Students (All / Payment issues / Behind chips swap the table rows),
Payments (plan, paid, next installment; Remind), Attendance (last 6 classes), Recordings. Side: next
classes, payments in this batch.

### `admin/batch-edit.html` · Create a batch

Top bar: "Create a batch" with the breadcrumb. Four sections (course and mentor, format and place, schedule, seats and fee). Offline / Online is a captured
state of the form (`batch-form`). Class days allow several (`data-multi`). The summary follows the page;
Create batch / Save as draft show toasts.

### `admin/students.html` · Students & payments

Top bar: Record cash payment, Enroll a student. Totals (collected, due this week, overdue), filter chips (states of the `filtered` table), student rows
with progress bars and status; Send reminder (toast). Placeholders: pagination, Export CSV (toast only).

### `admin/student-record.html` · Student record (Mehedi Hasan)

Top bar: "Student record" with the breadcrumb Students & payments. Name, badge and actions at the top of
the page, then the paused banner, course progress, attendance strip, payments, details, notes and history.
**Resume access / Pause access** switch between the `paused` and `active` states (these two copy the
whole page, because the banner is added or removed).

### `admin/mentors.html` · Mentors

Top bar: Add a mentor. Full-width mentors table (Assign batch stays visible when the table scrolls). **Add a mentor** opens the
`#add-mentor` dialog; Send login invite shows a toast.

### `admin/coupons.html` · Coupons & referrals

Top bar: New coupon. **Tabs** (linkable: `coupons.html#cp-coupons`, `#cp-referrals`):

- **Coupons:** 4 stat tiles (active codes, used in October, discount given, ending soon), then a record
  list of 6 codes (All / Active / Expired / Used up / Disabled, search). The open coupon shows use, expiry,
  discount given, who created it and recent uses; Copy code, **Disable** (`#disable-coupon`, with a
  reason), Add 30 more uses (used up), Run it again (expired: opens New coupon filled in), Turn back on.
  **New coupon** (`#new-coupon`, `assets/js/pages/coupons.js`): the code is kept to capitals and digits,
  a code that already exists is caught, and a preview shows what a student pays.
- **Referrals:** 4 stat tiles (friends enrolled in October, credit added, credit waiting, discount given),
  How it works, Programme settings (on/off, the friend's discount, the referrer's credit, when credit is
  added, what it pays for, expiry; Save changes), Recent referrals (9, with status), Top referrers.

The rules shown: every student has a code (first name + last 3 digits of the student ID, e.g. NUSRAT148);
a friend who enrolls with it gets ৳1,000 off their first course; 7 days after the friend's first payment
the student gets ৳1,000 credit for an installment or a new course; one code per enrollment (a coupon or a
referral code); a friend refunded within the 7 days earns no credit. Programme since 1 Sep 2026 (credit
raised from ৳500 to ৳1,000 on 1 Oct). In October: 25 coupon uses and 7 referred friends out of 58 enrollments.

### `admin/announcements.html` · Announcements

Top bar: New announcement. A record list of 7 (All / Sent / Scheduled / Drafts, search): title and author,
audience and reach, channel (In-app, SMS), when, status. The open one shows the message, reach, schedule,
author, SMS count, and for sent ones how many opened it. Edit (scheduled, draft), Duplicate (sent), Cancel
schedule, Delete draft. **New announcement** (`#compose`, `assets/js/pages/announcements.js`): title,
message with a character and SMS count (160 per SMS, 70 when the text has ৳ or Bangla), audience (all 286
students, a course, a batch, or the 7 mentors, with the head count of each), In-app and SMS, send now or
schedule; Review and send shows a last check before Send now. Reach per course and batch follows Courses &
batches.

### `admin/activity.html` · Activity log

Top bar: Export CSV (toast only). A record list of 22 entries since 1 Oct by the team (Area filters, a
Who select, search over name, action and reason): when, who and role, area, action and target, and the
reason when the list is wide. The open entry shows the time, person, role and device, the change (before →
after), any note or reason, and a link to where it happened. Entries match the recent activity on My
profile and Recent changes on Roles & access. Entries can't be edited or deleted.

### `admin/roles.html` · Roles & access

Top bar: New role, Invite team member. 6 role cards (3 × 2) that switch the permissions editor (`role-editor` states), None / View / Edit per
area, people with the role, recent changes (with a link to the Activity log), team members with All / Staff / Mentors (`team` states) and
Edit dialogs (`#edit-<tab>-<row>`), **Invite team member** (`#invite-dialog`), **New role** (`#role-dialog`).
Dialog field ids are prefixed with the dialog id so labels stay unique.

### `admin/leads.html` · Seminar leads

Top bar: Add lead, Schedule a seminar. Next two seminars with bookings, a 4-column board (Booked / Attended / Following up / Enrolled).
Placeholders: Call and WhatsApp links (no numbers yet), Add lead, Schedule a seminar.

### `admin/settings.html` · Settings

Top bar: Save changes. Sections: Payments (`#pay`), Installments & access (`#access`, the pause switch hides its options), SMS
messages (`#sms`), Learning defaults (`#learning`), Team & roles (`#team`). The section menu follows the
page and highlights where you are. Placeholder: **[SMS PROVIDER]**.

### `admin/profile.html` · My profile

Account details, security (SMS code on a new device, password, devices), recent activity.
Full activity log opens `activity.html`. Placeholder: Change photo.

### `admin/notifications.html` · Notifications

Admin items (payments, course reviews, admissions, team). Reached from the bell and the account menu; Mark
all as read is in the top bar.

## Links that are still placeholders

About 140 links still point at `#` (an action with no page or backend yet). The biggest groups:

- **Downloads and receipts:** lesson resources, project files, payment receipts, Download feedback.
- **Contact:** Call / WhatsApp on seminar leads and Help, Message Kamrul, ask on WhatsApp.
- **Lists:** pagination, Show all, Export CSV.
- **Editors:** choosing another lesson in the course builder or another question in the quiz builder.
- **Course pages:** See course on Explore courses (only WordPress has an enroll page).
- **Mentor pages not built yet:** React JS Batch 6 and WordPress Batch 15 (the My batches switcher and the
  dashboard), the course in review (Courses switcher), Mentor handbook (sidebar), Open roster (dashboard),
  and the submission links and files in the review queue.

`npm run check` reports the current count. Toast-only buttons (Save, Send, Nudge…) are marked with `data-toast`.

## Checking your changes

```sh
npm run check       # links, every page at 9 widths, every state/tab/dialog, main journeys
npm run format      # Prettier, print width 120
```

The checks start their own local server; they need Playwright's Chromium. They live in `tools/check/`:

| Script       | What it covers                                                                                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `links.mjs`  | Every relative link and `#anchor` resolves.                                                                                                                                                                                                                                                                                                 |
| `pages.mjs`  | Every page at 360–1920px: no sideways scroll, sidebar never stacks, no script errors, no duplicate ids, every `aria-*` / `for` reference resolves, every control has a name.                                                                                                                                                                |
| `states.mjs` | Every captured-state option shows its templates, every tab shows only its panel, every dialog opens and closes with Esc.                                                                                                                                                                                                                    |
| `flows.mjs`  | Log in per role, reset password, quiz, upload a recording, roles, enroll, notifications, the mentor panel (questions, the review queue, the to-do list), dialogs, and the admin console (light by default, dark mode, collapse, drawer, account menu, Ctrl K, Course review link, record lists on Announcements, Activity log and Coupons). |
