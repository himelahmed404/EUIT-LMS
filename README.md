# EUIT-LMS

The front-end UI for the European IT Institute learning portal: the student, mentor and admin
panels, log in, and the enroll flow. Plain HTML, CSS and JavaScript with no framework and no build step.
It is a faithful copy of the **European IT LMS Panels** design (42 screens), including its motion.

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

| Area | Pages |
| --- | --- |
| Everyone | `index.html` (log in), `forgot-password.html`, `notifications.html`, `ui-guide.html` |
| Enroll | `enroll/course.html` → `enroll/checkout.html` → `enroll/result.html` |
| Student | `student/dashboard.html`, `course-player`, `quizzes`, `quiz`, `quiz-result`, `projects`, `project-detail`, `project-feedback`, `schedule`, `leaderboard`, `certificates`, `certificate` (A4 print), `payments`, `access-paused`, `profile`, `help` |
| Mentor | `mentor/dashboard.html`, `batch`, `course-builder`, `review`, `schedule`, `profile`, `quiz-builder` |
| Admin | `admin/overview.html`, `courses`, `course-review`, `batch-detail`, `batch-edit`, `students`, `student-record`, `mentors`, `roles`, `leads`, `settings`, `profile` |

## Structure

```
assets/css/eit.css      European IT design-system components (buttons, fields, badges, motion)
assets/css/panel.css    Panel shell, tokens and all panel animations, copied as-is from the design
assets/css/app.css      Small additions for the static site (phone-width fixes, demo switch)
assets/js/app.js        Shared behaviour for every page
assets/js/pages/help.js Help centre topic and search filtering
tools/design-export/    The script that regenerated these pages from the design (see below)
```

## How the interactivity works

`app.js` has no page-specific code. It reads the ARIA state that is already in the markup:

- `aria-pressed` and `role="radio"` buttons act as single-choice groups (segmented controls, filter
  chips, option cards). Add `data-multi` to a group to let several be on at once.
- `role="switch"` and `role="checkbox"` buttons toggle `aria-checked`.
- `.p-tabs` links with `href="#"` move `aria-current`.
- The bell button opens the notifications menu (`aria-controls` and `data-popover`). Esc or a click outside closes it.
- Dialogs: `data-open-dialog="id"` opens one, and `data-close-dialog`, the backdrop or Esc closes it.
- **Captured states.** When a choice changes what a screen shows (the steps of a form, filters, quiz
  questions, course switches), each state is in the page as a `<template data-state>`. A button with
  `data-show-state="name"` swaps it in. When several choices combine (format × batch × plan on the
  enroll page), options carry `data-part-of`, `data-part` and `data-value`, and the matching
  `region:v0|v1|v2` template is shown.
- **Reveal and conceal.** Accordions and "show more" buttons list the elements they show
  (`data-reveal`) or hide (`data-conceal`). `data-on-look` holds the trigger's own "open" look,
  such as a rotated chevron.
- Motion: headline words rise in and numbers count up as they scroll into view. Everything else
  (page rise, filling bars and rings, pulsing dots, the ringing bell, floating stickers) is CSS in
  `panel.css`. All motion stops when the visitor has reduced motion turned on.
- The language switch (EN / বাং) is remembered across pages, but the copy stays English for now.

When real data arrives, replace the captured templates with rendering from the API. The ARIA
attributes and CSS classes stay the same.

## Not built yet (on purpose)

- Business logic: payments, unlocking lessons, marking, points, attendance totals and other counters
  stay as drawn in the design and don't recalculate when you click.
- Links marked `href="#"` are actions with no page in the design yet (download, send reminder, receipt, and so on).
- Copy link on Certificates and the Leaderboard's course switch only change the button state.
- Bangla translations.

## Regenerating from the design

`tools/design-export/build.mjs` renders each design screen in headless Chromium through the design's
own runtime, cleans the markup and writes these pages. `recipes.mjs` captures the states that only
appear after a click. To use it, download the design's `project/` folder, save the design runtime
(`artifact-type/dc-runtime.js`) into it as `support.js`, and serve that folder:

```sh
npm install
(cd path/to/design/project && python3 -m http.server 8765) &
cd path/to/design/project && node /path/to/EUIT-LMS/tools/design-export/build.mjs . /path/to/EUIT-LMS
```

It overwrites the HTML pages. The files in `assets/` are maintained by hand.
