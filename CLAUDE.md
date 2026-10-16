# EUIT-LMS: notes for Claude

Static front end for the European IT Institute LMS (student, mentor and admin panels, log in, enroll).
Plain HTML, CSS and JavaScript: no framework, no build step, no backend. Every page is a self-contained file.

## Start here

- **`docs/PAGES.md`**: what every page contains, what's interactive, where the shared markup lives,
  the demo people and data, and which links are still placeholders. Read it instead of opening every page.
- **`docs/DESIGN-REVIEW.md`**: the design review, what was changed and why, and the open suggestions.
- **`README.md`**: how the interactivity works (states, tabs, dialogs, toasts) and the folder layout.

## Commands

```sh
python3 -m http.server 8080   # or: npm start   then open http://localhost:8080
npm run check                 # links, every page at 360–1920px, every state/tab/dialog, main journeys
npm run format                # Prettier, print width 120 (.prettierrc.json)
```

Run `npm run check` after any change; it must end with "Everything passed".

## How the code is organised

- `assets/css/eit.css`: EIT design-system components (buttons, fields, badges, chips). Rarely changes.
- `assets/css/panel.css`: tokens, the panel shell (sidebar, top bar, page column, tablet rail, phone tab
  bar), and panel components. Layout tokens: `--side-w`, `--page-max`, `--page-pad`.
- `assets/css/app.css`: additions for this site (balanced grids, notifications, certificate print, toast)
  and fixes that override the design's inline styles. Student pages (`<html class="is-student">`) use the
  console's fonts, Anek Bangla and JetBrains Mono; the login and enroll pages still use Geist.
- `assets/css/console.css`: the **console** for the admin and mentor panels (SchoolofGenZ look in European IT
  colours): sidebar `.c-side`, top bar `.c-top`, dashboards (`.c-kpi`, `.c-panel`), record lists
  (`.c-list` + `.c-pane`), the mentor's review queue (`.c-queue`), batch and course switchers (`.c-switch`),
  compact versions of the shared components, and the light and dark tokens. Only admin and mentor pages load
  it (`<html class="is-console">`).
- `assets/js/theme.js`: admin and mentor pages only, in `<head>` without `defer`: sets light/dark (light
  unless the moon button picked dark) and the collapsed sidebar before the page paints.
- `assets/js/app.js`: shared behaviour driven by ARIA attributes and `data-*` hooks. **No page-specific
  code here**; a page that needs its own logic gets `assets/js/pages/<page>.js` (help, notifications,
  questions, review, announcements, coupons, saved).

## Rules when editing

- **Shared chrome is repeated per page.** The sidebar, top bar and bell menu appear in every page of a
  role. Change them in all of that role's pages (`student/*.html`, `mentor/*.html`, `admin/*.html`).
- **Admin and mentor pages use the console shell** (`aside.c-side`, `header.c-top`), not `p-side` / `p-top`.
  A page's title, subtitle and buttons live in the top bar; record pages (batch, course review, student) put the
  breadcrumb there (or `p.c-top-h` with the section's name) and keep the record's name (`h1`) and actions at
  the top of `<main>`. The student panel still uses the older `p-side` shell.
- **Record lists (admin Announcements, Activity log, Coupons; mentor Student questions):** a row is a `.c-row`
  tab with its tags in `data-tags`; its record is the tab panel in `.c-pane`. Add a row and its panel together,
  and keep the filter counts (`.c-n`) and the "Showing n of n" footer right. The mentor's review queue
  (`mentor/review.html`) is the same list with each project's review as its tab panel; the waiting count (5)
  also appears in the sidebar, the dashboard and the notifications.
- **Dark mode (admin and mentor):** colours must come from tokens (`var(--ink)`, `var(--surface-card)`, `var(--line)`…).
  A fixed colour in markup won't change with the theme. Check both themes (light is the default; the moon button switches to dark).
- **Captured states:** a `<template data-state="name" data-region="[data-region='x']">` holds only the
  element that changes. Edit the live element and every template for it together.
- State lives in ARIA (`aria-pressed`, `aria-checked`, `aria-selected`, `aria-expanded`, `aria-current`).
  New tabs use `role="tab"` + `aria-controls` and panels with `role="tabpanel"`; new dialogs copy an existing
  `.p-modal-wrap[data-dialog]`; actions that would save or send get `data-toast="…"`.
- Keep the demo data consistent with the cast in `docs/PAGES.md` (Nusrat Jahan, Kamrul Hasan, Sharmin Sultana,
  "today" is Thu 15 Oct 2026).
- Actions with no page yet use `href="#"`. Don't invent real phone numbers, names or addresses; the
  bracketed placeholders ([SUPPORT PHONE], [DIRECTOR NAME], [SMS PROVIDER]) wait for the owner's content.
- New page: copy a sibling page in the same folder, set the sidebar's `aria-current="page"`, title it
  "Name · European IT LMS", add it to `docs/PAGES.md`, run `npm run check`.
- The student panel is next to move to the console look; the owner will ask for it.
- **Never run `tools/design-export/` over this repo.** The pages were exported once and then fixed by hand;
  the script refuses without `--force`. Export into an empty folder if you need the original design.
- Format with Prettier (width 120) before committing.
