// Renders each design screen through the design runtime, then writes a static HTML page.
// usage: node build.mjs <design project dir> <output site dir> [Only.dc.html,...] [--force]
// The design project must be served (with dc-runtime.js saved as support.js) at DESIGN_URL.
//
// The pages in this repo were exported once and have since been fixed and extended by hand
// (see docs/DESIGN-REVIEW.md). Exporting over them would undo that work, so the script refuses
// to write into a folder that has docs/DESIGN-REVIEW.md unless you pass --force. Export into an
// empty folder instead and compare, or copy over only what you need.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { recipes } from './recipes.mjs';

const args = process.argv.slice(2).filter((a) => a !== '--force');
const force = process.argv.includes('--force');
const [SRC, OUT, only] = args;
if (!force && fs.existsSync(path.join(OUT, 'docs', 'DESIGN-REVIEW.md'))) {
  console.error(`${OUT} holds hand-fixed pages (docs/DESIGN-REVIEW.md). Export into an empty folder, or pass --force.`);
  process.exit(1);
}
const DESIGN_URL = (process.env.DESIGN_URL || 'http://localhost:8765') + '/';

export const MAP = {
  'Login.dc.html': 'index.html',
  'ForgotPassword.dc.html': 'forgot-password.html',
  'Notifications.dc.html': 'notifications.html',
  'UI-Guide.dc.html': 'ui-guide.html',
  'Enroll-Course.dc.html': 'enroll/course.html',
  'Enroll-Checkout.dc.html': 'enroll/checkout.html',
  'Enroll-Result.dc.html': 'enroll/result.html',
  'Main.dc.html': 'student/dashboard.html',
  'Student-Player.dc.html': 'student/course-player.html',
  'Student-Quizzes.dc.html': 'student/quizzes.html',
  'Student-Quiz.dc.html': 'student/quiz.html',
  'Student-QuizResult.dc.html': 'student/quiz-result.html',
  'Student-Assignments.dc.html': 'student/projects.html',
  'Student-ProjectDetail.dc.html': 'student/project-detail.html',
  'Student-Feedback.dc.html': 'student/project-feedback.html',
  'Student-Schedule.dc.html': 'student/schedule.html',
  'Student-Leaderboard.dc.html': 'student/leaderboard.html',
  'Student-Certificates.dc.html': 'student/certificates.html',
  'Certificate.dc.html': 'student/certificate.html',
  'Student-Payments.dc.html': 'student/payments.html',
  'Student-Paused.dc.html': 'student/access-paused.html',
  'Student-Profile.dc.html': 'student/profile.html',
  'Student-Help.dc.html': 'student/help.html',
  'Mentor-Dashboard.dc.html': 'mentor/dashboard.html',
  'Mentor-Batch.dc.html': 'mentor/batch.html',
  'Mentor-Builder.dc.html': 'mentor/course-builder.html',
  'Mentor-Review.dc.html': 'mentor/review.html',
  'Mentor-Schedule.dc.html': 'mentor/schedule.html',
  'Mentor-Profile.dc.html': 'mentor/profile.html',
  'Mentor-QuizBuilder.dc.html': 'mentor/quiz-builder.html',
  'Admin-Overview.dc.html': 'admin/overview.html',
  'Admin-Courses.dc.html': 'admin/courses.html',
  'Admin-Students.dc.html': 'admin/students.html',
  'Admin-Leads.dc.html': 'admin/leads.html',
  'Admin-StudentRecord.dc.html': 'admin/student-record.html',
  'Admin-CourseReview.dc.html': 'admin/course-review.html',
  'Admin-BatchEdit.dc.html': 'admin/batch-edit.html',
  'Admin-Mentors.dc.html': 'admin/mentors.html',
  'Admin-Settings.dc.html': 'admin/settings.html',
  'Admin-Profile.dc.html': 'admin/profile.html',
  'Admin-BatchDetail.dc.html': 'admin/batch-detail.html',
  'Admin-Roles.dc.html': 'admin/roles.html',
};

// Runs in the page: returns cleaned markup of a node (default: the whole rendered root).
function cleanInPage({ sel, map, from }) {
  const live = sel ? document.querySelector(sel) : document.getElementById('dc-root');
  if (!live) return null;
  const c = live.cloneNode(true);
  const lv = live.querySelectorAll('select, input, textarea');
  const cl = c.querySelectorAll('select, input, textarea');
  lv.forEach((el, i) => {
    const k = cl[i];
    if (el.tagName === 'SELECT') [...k.options].forEach((o, j) => o.toggleAttribute('selected', el.options[j].selected));
    else if (el.tagName === 'TEXTAREA') k.textContent = el.value;
    else if (el.type === 'checkbox' || el.type === 'radio') k.toggleAttribute('checked', el.checked);
    else if (el.value) k.setAttribute('value', el.value);
  });
  c.querySelectorAll('.sc-host-x, .sc-host, .sc-interp').forEach((w) => w.replaceWith(...w.childNodes));
  c.querySelectorAll('*').forEach((el) => [...el.attributes].forEach((a) => {
    if (a.name.startsWith('data-dc') || a.name.startsWith('data-sc')) el.removeAttribute(a.name);
  }));
  // Rewrite design links to site paths, relative to the current page.
  const rel = (to) => {
    const a = from.split('/').slice(0, -1);
    const b = to.split('/');
    let i = 0;
    while (i < a.length && i < b.length - 1 && a[i] === b[i]) i++;
    return '../'.repeat(a.length - i) + b.slice(i).join('/');
  };
  c.querySelectorAll('[href]').forEach((el) => {
    const h = el.getAttribute('href');
    const m = /^([A-Za-z0-9_-]+\.dc\.html)(#.*)?$/.exec(h);
    if (m && map[m[1]]) el.setAttribute('href', rel(map[m[1]]) + (m[2] || ''));
  });
  return sel ? c.outerHTML : c.innerHTML;
}

function helmetStyles(src) {
  const m = /<helmet>([\s\S]*?)<\/helmet>/.exec(src);
  if (!m) return '';
  const css = [...m[1].matchAll(/<style>([\s\S]*?)<\/style>/g)].map((x) => x[1]).join('\n');
  // Drop the base rules every artboard repeats; the shared stylesheet has them.
  return css.replace(/^body\{margin:0[^}]*\}\s*$/m, '').replace(/^a\{color:#00739E\}a:hover\{color:#00587A\}\s*$/m, '').trim();
}

function page({ file, title, body, css, extra }) {
  const out = MAP[file];
  const up = '../'.repeat(out.split('/').length - 1);
  const bodyClass = { 'Notifications.dc.html': 'page-panel', 'Certificate.dc.html': 'page-print' }[file] || '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · European IT LMS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700&amp;family=Geist:wght@400;500;600;700&amp;family=Geist+Mono:wght@400;500&amp;display=swap">
<link rel="stylesheet" href="${up}assets/css/eit.css">
<link rel="stylesheet" href="${up}assets/css/panel.css">
<link rel="stylesheet" href="${up}assets/css/app.css">
${css ? `<style>\n${css}\n</style>\n` : ''}<script src="${up}assets/js/app.js" defer></script>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${body}
${extra || ''}</body>
</html>
`;
}

const files = Object.keys(MAP).filter((f) => !only || only.split(',').includes(f));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const pg = await ctx.newPage();
pg.on('pageerror', (e) => console.log('  page error:', e.message));

for (const file of files) {
  const from = MAP[file];
  const src = fs.readFileSync(path.join(SRC, file), 'utf8');
  await pg.goto(DESIGN_URL + file, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(500);
  const grab = (sel) => pg.evaluate(cleanInPage, { sel, map: MAP, from });
  let body = await grab();
  const title = (/<title>([^<]*)<\/title>/.exec(src) || [])[1] || file;
  let extra = '';
  const recipe = recipes[file];
  if (recipe) {
    const r = await recipe({ pg, grab, body, srcDir: SRC, reload: async () => { await pg.goto(DESIGN_URL + file, { waitUntil: 'networkidle' }); await pg.waitForTimeout(400); } });
    body = r.body ?? body;
    extra = r.extra ?? '';
  }
  body = body.replace(/ data-k="\d+"/g, '');
  extra = extra.replace(/ data-k="\d+"/g, '');
  // Final link pass: captured states (reveals, templates) may still point at design files.
  const up = '../'.repeat(from.split('/').length - 1);
  const fix = (s) => s
    .replace(/href="([A-Za-z0-9_-]+\.dc\.html)(#[^"]*)?"/g, (m, f, h) => (MAP[f] ? `href="${up}${MAP[f]}${h || ''}"` : m))
    .replace(/<a([^>]*) href="#"([^>]*)>Log out</g, `<a$1 href="${up}index.html"$2>Log out<`);
  body = fix(body);
  extra = fix(extra);
  const html = page({ file, title, body, css: helmetStyles(src), extra });
  const dest = path.join(OUT, from);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  console.log(file, '->', from, html.length);
}
await browser.close();
