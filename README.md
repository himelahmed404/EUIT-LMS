# EUIT-LMS

The front-end UI for the European IT Institute learning portal: the student, mentor and admin
panels, log in, and the enroll flow. Plain HTML, CSS and JavaScript with no framework and no build step.
It started as a copy of the **European IT LMS Panels** design (42 screens, with its motion) and has since
had a full design review: see [docs/DESIGN-REVIEW.md](docs/DESIGN-REVIEW.md).

There is no backend yet. Every page can be clicked through, and forms and buttons respond, but nothing
is saved or sent anywhere.

## Run it

Open `index.html` in a browser, or serve the folder so relative links behave like a real site:

```sh
npm start            # serves on http://localhost:8080
# or: python3 -m http.server 8080
```

On the log-in page, the **Demo: log in as** switch picks which panel **Log in** opens
(Student, Mentor or Admin).

## Pages

| Area     | Pages                                                                                                                                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Everyone | `index.html` (log in), `forgot-password.html`, `ui-guide.html`                                                                                                                                                                                                      |
| Enroll   | `enroll/course.html` → `enroll/checkout.html` → `enroll/result.html`                                                                                                                                                                                                |
| Student  | `student/dashboard.html`, `course-player`, `quizzes`, `quiz`, `quiz-result`, `projects`, `project-detail`, `project-feedback`, `schedule`, `leaderboard`, `certificates`, `certificate` (A4 print), `payments`, `access-paused`, `profile`, `help`, `notifications` |
| Mentor   | `mentor/dashboard.html`, `batch`, `course-builder`, `review`, `questions`, `schedule`, `profile`, `quiz-builder`, `notifications`                                                                                                                                   |
| Admin    | `admin/overview.html`, `courses`, `course-review`, `batch-detail`, `batch-edit`, `students`, `student-record`, `mentors`, `coupons`, `announcements`, `roles`, `activity`, `leads`, `settings`, `profile`, `notifications`                                          |

**[docs/PAGES.md](docs/PAGES.md)** describes every page: what's on it, what you can click, and what's not built yet.

## Structure

```
assets/css/eit.css        European IT design-system components (buttons, fields, badges, motion)
assets/css/panel.css      Tokens, the panel shell (sidebar, top bar, tablet rail, phone tab bar), components
assets/css/app.css        Additions for this site: balanced grids, notifications, certificate print, toast
assets/css/console.css    Console (admin and mentor): SchoolofGenZ-style sidebar, top bar, dashboard, record lists,
                          the review queue, light and dark tokens
assets/js/app.js          Shared behaviour for every page
assets/js/theme.js        Admin and mentor pages: light/dark and collapsed sidebar, applied before the page paints
assets/js/pages/*.js      Page scripts: help, notifications, questions (mentor), review (mentor), announcements and
                          coupons (admin)
docs/PAGES.md             Page-by-page map
docs/DESIGN-REVIEW.md     Design review, changes made, open suggestions
tools/check/              Checks for every page (npm run check)
tools/design-export/      The script that first generated the pages from the design (see below)
```

## Layout

The **admin and mentor panels** use the SchoolofGenZ console look in European IT colours (Anek Bangla and
JetBrains Mono, grouped sidebar with icon tiles and count pills, page titles and buttons in the top bar,
full-width pages, light mode by default with a dark mode). From 1280px the sidebar can be collapsed to icons;
from 768 to 1279px it is an icon rail; below that it opens as a drawer from the top bar. The student panel
uses the layout below for now:

- **Desktop (1100px and up):** a 280px sidebar that stays in view, and a page column up to 1320px wide,
  centred beside it. The top bar lines up with the column.
- **Tablet (721–1099px):** the sidebar folds into an icon rail; hover an icon for its name.
- **Phone (720px and below):** a one-row top bar (search opens when tapped) and a bottom tab bar with
  the first four links plus **More**, which opens a sheet with the rest.
- Card grids divide evenly: four cards show as 4 or 2 × 2, six as 3 × 2, five as 5 or 3 + 2.

## How the interactivity works

`app.js` has no page-specific code. It reads the ARIA state and `data-*` hooks in the markup:

- `aria-pressed` and `role="radio"` buttons act as single-choice groups (segmented controls, filter
  chips, option cards). Add `data-multi` to a group to let several be on at once. Options that are
  coloured one by one (Present / Late / Absent) keep their own colour.
- `role="switch"` and `role="checkbox"` buttons toggle `aria-checked`; `data-toggles` shows or hides what they control.
- **Tabs:** `role="tab"` with `aria-controls` shows its `role="tabpanel"` and hides the others; arrow
  keys, Home and End move between tabs. `data-select-tab="tab-id"` opens a tab from elsewhere.
- `button[aria-expanded]` with `data-panel="id"` opens and closes an accordion panel.
- The bell (`data-notif-scope`) opens the notifications menu (`aria-controls` and `data-popover`). Esc or
  a click outside closes it. **Mark all as read** clears the dots and the count, and remembers it for that panel.
- Dialogs: `data-open-dialog="id"` opens one, and `data-close-dialog`, the backdrop or Esc closes it.
  Focus goes back to the button that opened it.
- **Captured states.** When a choice changes what a screen shows (the steps of a form, filters, quiz
  questions, course switches), each state is in the page as a `<template data-state>` holding only the
  element that changes (named by `data-region`; a state can have several templates). A button with
  `data-show-state="name"` swaps them in. When several choices combine (format × batch × plan on the
  enroll page), options carry `data-part-of`, `data-part` and `data-value`, and the matching
  `region:v0|v1|v2` templates are shown.
- **Reveal and conceal.** Accordions and "show more" buttons list the elements they show
  (`data-reveal`) or hide (`data-conceal`). `data-on-look` holds the trigger's own "open" look.
- Console (admin and mentor): `data-theme-toggle` switches light and dark (light by default; the choice is saved),
  `data-nav-toggle` collapses the sidebar (saved), `data-nav-open` opens the phone drawer, Ctrl K / ⌘ K
  goes to the search. A link to `page.html#panel-id` opens that tab; tab lists with `data-linkable` keep
  the address in step.
- **Record lists** (admin Announcements, Activity log, Coupons; mentor Student questions): `.c-list` rows are `role="tab"` buttons
  (`.c-row`) whose records are tab panels in the `.c-pane` beside the list. Each row lists its tags in
  `data-tags`; filter buttons (`data-filter="tag"`, `"all"`), selects (`select[data-filter]`) and a search
  box (`data-search`) narrow the rows, and `data-list-shown` / `data-list-empty` follow along. Below
  1100px the pane slides over the page when a row is opened (`data-pane-close`, Esc or the backdrop
  closes it). The mentor's review queue (`.c-queue`) is the same list with the open review beside it
  instead of in a pane; below 1100px the queue becomes a row of cards above the review.
  Student pages filter cards the same way without tabs: a `[data-list]` holds the filters and
  `[data-list-item]` cards with `data-tags`; a `[data-list-group]` section hides once none of its cards
  show (Explore courses, Schedule & recordings, My questions, Saved & notes).
- `[data-checklist]` keeps an "n of n done" line (`data-checklist-count`) and a bar (`data-checklist-bar`)
  in step with the `role="checkbox"` buttons inside it (the mentor's to-do).
- `data-toast="Changes saved"` shows a short confirmation; `data-copy="text"` copies to the clipboard;
  `data-print` opens the print dialog; `data-press-all="selector"` presses every matching option
  (Mark all present); `data-fit` scales a fixed-size sheet down to fit (the certificate);
  `nav[data-scrollspy]` highlights the section you're reading (admin settings).
- Motion: headline words rise in and numbers count up as they scroll into view. Everything else
  (page rise, filling bars and rings, pulsing dots, the ringing bell, floating stickers, sparklines) is
  CSS. All motion stops when the visitor has reduced motion turned on.
- The language switch (EN / বাং) is remembered across pages, but the copy stays English for now.

When real data arrives, replace the captured templates with rendering from the API. The ARIA
attributes and CSS classes stay the same.

## Check your changes

```sh
npm run check     # links, every page at 360–1920px, every state, tab and dialog, the main journeys
npm run format    # Prettier, print width 120
```

The checks start their own local server and use Playwright's Chromium (`npm install`, then
`npx playwright install chromium` if you don't have it).

## Not built yet (on purpose)

- Business logic: payments, unlocking lessons, marking, points and attendance totals stay as drawn and
  don't recalculate when you click (the mentor's rubric totals and question counts are the exceptions).
- Links marked `href="#"` are actions with no page yet (downloads, receipts, call and WhatsApp links,
  pagination). The list is in [docs/PAGES.md](docs/PAGES.md#links-that-are-still-placeholders).
- Bangla translations.
- Suggested next pages (receipt, My courses overview, mentor handbook and more) are listed in
  [docs/DESIGN-REVIEW.md](docs/DESIGN-REVIEW.md#still-open).

## Regenerating from the design

`tools/design-export/build.mjs` renders each design screen in headless Chromium through the design's
own runtime, cleans the markup and writes pages; `recipes.mjs` captures the states that only appear after
a click. **The pages in this repo have been fixed by hand since, so don't export over them**: the script
refuses to write into this folder unless you pass `--force`. To compare with the original design, export
into an empty folder:

```sh
npm install
(cd path/to/design/project && python3 -m http.server 8765) &
node tools/design-export/build.mjs path/to/design/project /tmp/design-export
```

The design's `project/` folder needs the design runtime (`artifact-type/dc-runtime.js`) saved into it as `support.js`.
