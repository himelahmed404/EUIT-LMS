// Per-screen extras: states the design shows only after a click, captured from the runtime
// and wired to app.js through data attributes.

// Edit an HTML string with DOM APIs in a scratch page. fn(body, arg) runs in the browser.
async function edit(pg, html, fn, arg) {
  const ctx = pg.context();
  if (!ctx.__scratch) { ctx.__scratch = await ctx.newPage(); }
  const s = ctx.__scratch;
  await s.setContent('<!doctype html><body></body>');
  return s.evaluate(({ html, src, arg }) => {
    document.body.innerHTML = html;
    // eslint-disable-next-line no-new-func
    new Function('body', 'arg', 'return (' + src + ')(body, arg)')(document.body, arg);
    return document.body.innerHTML;
  }, { html, src: fn.toString(), arg });
}

async function clickText(pg, text, opts = {}) {
  const scope = opts.within ? pg.locator(opts.within) : pg.locator('#dc-root');
  const loc = scope.locator(opts.role || 'button, a, [role="button"]').filter({ hasText: text }).nth(opts.nth || 0);
  await loc.click({ timeout: 3000 });
  await pg.waitForTimeout(250);
}

// Capture a region in several states. steps: [{ state, click: text | fn(pg), reload?: bool }]
// Returns { templates, wireText } where templates is the <template> markup to append.
async function captureStates({ pg, grab, reload }, { key, region, steps }) {
  const out = [];
  for (const st of steps) {
    if (st.reload) { await reload(); }
    if (typeof st.click === 'function') { await st.click(pg); } else if (st.click) { await clickText(pg, st.click, st); }
    const html = await grab(region);
    if (!html) { throw new Error(`region ${region} missing for state ${st.state}`); }
    out.push({ state: st.state, html });
  }
  return out.map((o) => ({ ...o, key }));
}

function templatesMarkup(states, regionAttr) {
  return states.map((s) => `<template data-state="${s.state}" data-region="[data-region='${regionAttr}']">${s.html}</template>`).join('\n') + '\n';
}

// Mark the region root and wire buttons by their text to a state name.
const wireFn = (body, { region, regionAttr, wire }) => {
  const root = body.querySelector(region) || body.firstElementChild;
  if (root) { root.setAttribute('data-region', regionAttr); }
  body.querySelectorAll('button, a').forEach((b) => {
    const label = (b.getAttribute('aria-label') || b.textContent).replace(/\s+/g, ' ').trim();
    for (const [text, state] of wire) {
      if (label === text || (text.endsWith('*') && label.startsWith(text.slice(0, -1)))) {
        b.setAttribute('data-show-state', state);
        if (b.tagName === 'A') { b.setAttribute('href', '#'); }
        break;
      }
    }
  });
};

// Full flow: capture states for a region, wire them, and patch the body's region too.
async function stated(ctx, { region, regionAttr, steps, wire, bodyState }) {
  const states = await captureStates(ctx, { key: regionAttr, region, steps });
  for (const s of states) {
    s.html = await edit(ctx.pg, s.html, wireFn, { region: ':scope > *', regionAttr, wire });
  }
  // The body shows the first state; patch its region in place.
  const first = states.find((s) => s.state === (bodyState || states[0].state));
  const body = await edit(ctx.pg, ctx.body, (b, { region, html }) => {
    const r = b.querySelector(region);
    const t = document.createElement('template');
    t.innerHTML = html;
    r.replaceWith(t.content);
  }, { region, html: first.html });
  return { body, extra: templatesMarkup(states, regionAttr) };
}

// A region that depends on several option groups. parts: [{ sel, count }] where sel matches
// that group's option buttons (in the runtime page and in the static markup alike).
async function combos(ctx, { region, regionAttr, parts, extraWire }) {
  const { pg, grab, reload } = ctx;
  await reload();
  for (const p of parts) {
    if (!p.count) { p.count = await pg.locator('#dc-root ' + p.sel).count(); }
    if (!p.count) { throw new Error('no options for ' + p.sel); }
  }
  const all = parts.reduce((acc, p) => acc.flatMap((a) => [...Array(p.count).keys()].map((i) => [...a, i])), [[]]);
  const markFn = (b, { region, regionAttr, parts, isTemplate }) => {
    const root = isTemplate ? b.firstElementChild : b.querySelector(region);
    if (root) { root.setAttribute('data-region', regionAttr); }
    parts.forEach((p, k) => {
      b.querySelectorAll(p.sel).forEach((opt, i) => {
        opt.setAttribute('data-part-of', regionAttr);
        opt.setAttribute('data-part', String(k));
        opt.setAttribute('data-value', String(i));
      });
    });
  };
  // Which option is on by default in each group?
  await reload();
  const defaults = await pg.evaluate((parts) => parts.map((p) => {
    const opts = [...document.querySelectorAll('#dc-root ' + p.sel)];
    return Math.max(0, opts.findIndex((o) => o.getAttribute('aria-pressed') === 'true' || o.getAttribute('aria-checked') === 'true'));
  }), parts);
  const states = [];
  for (const combo of all) {
    await reload();
    for (let k = 0; k < parts.length; k++) {
      if (combo[k] === defaults[k]) { continue; }
      await pg.locator('#dc-root ' + parts[k].sel).nth(combo[k]).click();
      await pg.waitForTimeout(150);
    }
    let html = await grab(region);
    html = await edit(pg, html, markFn, { region, regionAttr, parts, isTemplate: true });
    if (extraWire) { html = await edit(pg, html, extraWire, combo); }
    states.push({ state: regionAttr + ':' + combo.join('|'), html });
  }
  let body = await edit(pg, ctx.body, markFn, { region, regionAttr, parts, isTemplate: false });
  if (extraWire) { body = await edit(pg, body, extraWire, defaults); }
  return { body, extra: templatesMarkup(states, regionAttr) };
}

// Number every element in the live page so before/after can be compared across reloads.
async function markLive(pg) {
  await pg.evaluate(() => {
    let k = 0;
    document.querySelectorAll('#dc-root *').forEach((el) => el.setAttribute('data-k', String(k++)));
  });
}

// Reveal capture: for each trigger (CSS selector matched in the runtime page, nth-indexed),
// click it, record which elements were added or removed, and bake both into the static body:
// added ones inserted hidden, and the trigger told which to show/hide (data-reveal / data-conceal).
// Returns a recipe. triggers: [{ sel, nth }] or a function(pg) => count with sel.
function reveal({ sel, each = true, max = 200, prep }) {
  return async (ctx) => {
    const { pg, grab, reload } = ctx;
    await reload();
    if (prep) { await prep(pg); }
    await markLive(pg);
    const count = await pg.evaluate((sel) => document.querySelectorAll('#dc-root ' + sel).length, sel);
    // Marked body: grab keeps data-k (only data-dc / data-sc are stripped).
    let body = await grab();
    const n = each ? Math.min(count, max) : 1;
    let uid = 0;
    const plans = [];
    for (let i = 0; i < n; i++) {
      await reload();
      if (prep) { await prep(pg); }
      await markLive(pg);
      const trig = await pg.evaluate(({ sel, i }) => document.querySelectorAll('#dc-root ' + sel)[i].getAttribute('data-k'), { sel, i });
      const before = await pg.evaluate(() => {
        const m = {};
        document.querySelectorAll('#dc-root [data-k]').forEach((e) => { m[e.getAttribute('data-k')] = e.parentElement.getAttribute('data-k'); });
        return m;
      });
      await pg.locator('#dc-root ' + sel).nth(i).click();
      await pg.waitForTimeout(200);
      const diff = await pg.evaluate(cleanAdded, {});
      const present = new Set(diff.present);
      const removed = Object.keys(before).filter((k) => !present.has(k) && (before[k] == null || present.has(before[k])));
      // How the trigger itself looks once it is "on".
      const look = await pg.evaluate((k) => {
        const el = document.querySelector('#dc-root [data-k="' + k + '"]');
        if (!el) { return null; }
        const c = el.cloneNode(true);
        c.querySelectorAll('.sc-host-x, .sc-host, .sc-interp').forEach((w) => w.replaceWith(...w.childNodes));
        c.querySelectorAll('*').forEach((x) => [...x.attributes].forEach((a) => { if (a.name.startsWith('data-')) { x.removeAttribute(a.name); } }));
        return { html: c.innerHTML, style: c.getAttribute('style') };
      }, trig);
      plans.push({ trig, added: diff.added, removed, look });
    }
    body = await edit(pg, body, (b, { plans }) => {
      let uid = 0;
      const byK = (k) => b.querySelector('[data-k="' + k + '"]');
      plans.forEach((p) => {
        const t = byK(p.trig);
        if (!t) { return; }
        const shown = [];
        const hidden = [];
        p.removed.forEach((k) => {
          const el = byK(k);
          if (!el) { return; }
          el.id = el.id || 'rv' + (uid++);
          hidden.push(el.id);
        });
        p.added.forEach((a) => {
          const parent = byK(a.parent);
          if (!parent) { return; }
          const tpl = document.createElement('template');
          tpl.innerHTML = a.html;
          const el = tpl.content.firstElementChild;
          el.id = el.id || 'rv' + (uid++);
          el.hidden = true;
          const prev = a.prev != null ? byK(a.prev) : null;
          if (prev && prev.parentElement === parent) { prev.after(el); } else { parent.prepend(el); }
          shown.push(el.id);
        });
        const add = (attr, ids) => {
          if (!ids.length) { return; }
          const cur = (t.getAttribute(attr) || '').split(' ').filter(Boolean);
          t.setAttribute(attr, cur.concat(ids).join(' '));
        };
        add('data-reveal', shown);
        add('data-conceal', hidden);
        if (p.look) {
          const probe = t.cloneNode(true);
          probe.querySelectorAll('*').forEach((x) => [...x.attributes].forEach((a) => { if (a.name.startsWith('data-')) { x.removeAttribute(a.name); } }));
          if (probe.innerHTML !== p.look.html || (t.getAttribute('style') || null) !== p.look.style) {
            const tpl = document.createElement('template');
            tpl.id = 'rvlook' + (uid++);
            tpl.innerHTML = p.look.html;
            if (p.look.style != null) { tpl.setAttribute('data-style', p.look.style); }
            b.appendChild(tpl);
            t.setAttribute('data-on-look', tpl.id);
            if (!shown.length && !hidden.length) { t.setAttribute('data-reveal', ''); }
          }
        }
      });
    }, { plans });
    return { body };
  };
}

// Runs in the page after a click: elements with no data-k are new, missing k's were removed.
function cleanAdded() {
  const present = new Set([...document.querySelectorAll('#dc-root [data-k]')].map((e) => e.getAttribute('data-k')));
  const added = [];
  document.querySelectorAll('#dc-root *:not([data-k])').forEach((el) => {
    const p = el.parentElement;
    if (!p || !p.hasAttribute('data-k')) { return; } // only topmost new nodes
    let prev = el.previousElementSibling;
    while (prev && !prev.hasAttribute('data-k')) { prev = prev.previousElementSibling; }
    const c = el.cloneNode(true);
    c.querySelectorAll('.sc-host-x, .sc-host, .sc-interp').forEach((w) => w.replaceWith(...w.childNodes));
    c.querySelectorAll('*').forEach((x) => [...x.attributes].forEach((a) => { if (a.name.startsWith('data-dc') || a.name.startsWith('data-sc')) { x.removeAttribute(a.name); } }));
    let node = c;
    if (c.classList.contains('sc-host-x') || c.classList.contains('sc-host')) { node = c.firstElementChild || c; }
    added.push({ parent: p.getAttribute('data-k'), prev: prev ? prev.getAttribute('data-k') : null, html: node.outerHTML });
  });
  return { added, present: [...present] };
}

// Chain recipes that each return { body, extra }.
function chain(...fns) {
  return async (ctx) => {
    let body = ctx.body;
    let extra = '';
    for (const fn of fns) {
      await ctx.reload();
      const r = await fn({ ...ctx, body });
      body = r.body ?? body;
      extra += r.extra ?? '';
    }
    return { body, extra };
  };
}

// The bell menu used by the three dashboards.
async function notifMenu(ctx) {
  const { pg, grab } = ctx;
  await pg.click('#dc-root .p-top-right button.p-iconbtn');
  await pg.waitForTimeout(250);
  const menu = await grab('.p-dropdown');
  const body = await edit(pg, ctx.body, (b, { menu }) => {
    const bell = b.querySelector('.p-top-right button.p-iconbtn');
    bell.setAttribute('aria-controls', 'notif-menu');
    bell.setAttribute('aria-expanded', 'false');
    const badge = bell.querySelector('.p-badge-count');
    if (badge) { badge.setAttribute('data-unread-count', ''); }
    const t = document.createElement('template');
    t.innerHTML = menu;
    const m = t.content.firstElementChild;
    m.id = 'notif-menu';
    m.hidden = true;
    m.setAttribute('data-popover', '');
    m.querySelectorAll('[aria-label="Unread"]').forEach((u) => u.setAttribute('data-unread', ''));
    const mark = [...m.querySelectorAll('button')].find((x) => /mark all/i.test(x.textContent));
    if (mark) { mark.setAttribute('data-mark-read', '#notif-menu'); }
    bell.closest('.p-top-right').appendChild(m);
  }, { menu });
  return { body };
}

// Dialogs: open each in the runtime, capture its .p-modal-wrap, append it hidden.
// list: [{ id, open: async (pg) => {} }]; markOpeners(body, arg) runs on body (and templates via wireAll).
async function captureDialogs(ctx, list) {
  const { pg, grab, reload } = ctx;
  const out = [];
  for (const d of list) {
    await reload();
    await d.open(pg);
    await pg.waitForTimeout(250);
    let html = await grab('.p-modal-wrap');
    html = await edit(pg, html, (b, { id }) => {
      const w = b.firstElementChild;
      w.id = id;
      w.hidden = true;
      w.setAttribute('data-dialog', '');
      w.querySelectorAll('button').forEach((x) => {
        const label = (x.getAttribute('aria-label') || x.textContent).trim();
        if (label === 'Close' || label === 'Cancel') { x.setAttribute('data-close-dialog', ''); }
      });
      w.querySelectorAll('.p-modal-foot .eit-btn--primary').forEach((x) => x.setAttribute('data-close-dialog', ''));
    }, { id: d.id });
    if (d.after) { html = await edit(pg, html, d.after, null); }
    out.push(html);
  }
  return out.join('\n');
}

const clickLabel = (label, nth = 0) => async (pg) => {
  await pg.locator('#dc-root').getByRole('button', { name: label, exact: false }).nth(nth).click();
};

// ---------- per-screen recipes ----------

const forgotPassword = (ctx) => stated(ctx, {
  region: 'div[style*="max-width: 400px"]',
  regionAttr: 'reset-steps',
  bodyState: 'phone',
  steps: [
    { state: 'code' },
    { state: 'phone', click: 'Wrong number?' },
    { state: 'reset', reload: true, click: 'Check code' },
    { state: 'done', click: 'Save new password' },
  ],
  wire: [['Wrong number?', 'phone'], ['Send code', 'code'], ['Check code', 'reset'], ['Save new password', 'done']],
});

const markUnread = (b) => {
  b.querySelectorAll('[aria-label="Unread"]').forEach((u) => u.setAttribute('data-unread', ''));
  b.querySelectorAll('button').forEach((x) => { if (/mark all/i.test(x.textContent)) { x.setAttribute('data-mark-read', 'body'); } });
};
const notificationsPage = (ctx) => combos(ctx, {
  region: 'section[aria-labelledby="n-title"]', regionAttr: 'notif-list',
  parts: [{ sel: '.p-seg[aria-label="Show"] button' }], extraWire: markUnread,
});

// One filter group drives a region (chips, segmented "Show" controls).
const filter = (sel, region = 'main') => (ctx) => combos(ctx, { region, regionAttr: 'filtered', parts: [{ sel }] });

const enrollCourse = (ctx) => combos(ctx, {
  region: 'main', regionAttr: 'enroll',
  parts: [
    { sel: '[role="radiogroup"][aria-label="Class format"] [role="radio"]' },
    { sel: '[role="radiogroup"][aria-label="Batch"] [role="radio"]' },
    { sel: '[role="radiogroup"][aria-label="Payment plan"] [role="radio"]' },
  ],
});

const batchEdit = (ctx) => combos(ctx, {
  region: 'main', regionAttr: 'batch-form',
  parts: [{ sel: '.p-seg[aria-label="Format"] button' }],
  extraWire: (b) => b.querySelectorAll('[aria-labelledby="days-label"]').forEach((g) => g.setAttribute('data-multi', '')),
});

const courseReview = filter('.p-seg[aria-labelledby="plan-label"] button', 'main');

const studentRecord = (ctx) => stated(ctx, {
  region: 'main', regionAttr: 'record',
  steps: [{ state: 'paused' }, { state: 'active', click: 'Resume access' }],
  wire: [['Resume access', 'active'], ['Pause access', 'paused'], ['Pause access again', 'paused']],
});

const projectDetail = (ctx) => stated(ctx, {
  region: 'main', regionAttr: 'late-pass',
  steps: [{ state: 'none' }, { state: 'bought', click: 'Use 30 points' }],
  wire: [['Use 30 points', 'bought'], ['Undo*', 'none']],
});

// The quiz: one captured state per question, wired to the question map and Next / Previous.
async function quiz(ctx) {
  const { pg, grab, reload } = ctx;
  await reload();
  const total = await pg.locator('#dc-root button[aria-label^="Question "]').count();
  const states = [];
  for (let q = 1; q <= total; q++) {
    await reload();
    await pg.locator(`#dc-root button[aria-label^="Question ${q},"]`).click();
    await pg.waitForTimeout(150);
    let html = await grab('main');
    html = await edit(pg, html, (b, { q, total }) => {
      b.firstElementChild.setAttribute('data-region', 'quiz');
      b.querySelectorAll('button').forEach((x) => {
        const label = (x.getAttribute('aria-label') || x.textContent).trim();
        const m = /^Question (\d+),/.exec(label);
        if (m) { x.setAttribute('data-show-state', 'q' + m[1]); }
        if (label === 'Next question' && q < total) { x.setAttribute('data-show-state', 'q' + (q + 1)); }
        if (label === 'Previous' && q > 1) { x.setAttribute('data-show-state', 'q' + (q - 1)); }
      });
    }, { q, total });
    states.push({ state: 'q' + q, html });
  }
  // The design opens on question 4.
  await reload();
  const current = await pg.evaluate(() => {
    const b = document.querySelector('#dc-root button[aria-label^="Question "][aria-current="step"]');
    return b ? +/Question (\d+)/.exec(b.getAttribute('aria-label'))[1] : 1;
  });
  const first = states[current - 1].html;
  let body = await edit(pg, ctx.body, (b, { html }) => {
    const t = document.createElement('template');
    t.innerHTML = html;
    b.querySelector('main').replaceWith(t.content);
    // The countdown in the quiz header keeps ticking.
    // Deepest element whose whole text is "mm:ss".
    const isTime = (el) => /^\d{1,2}:\d{2}$/.test(el.textContent.trim());
    [...b.querySelectorAll('*')].filter((el) => isTime(el) && ![...el.children].some(isTime))
      .forEach((el) => el.setAttribute('data-countdown', ''));
  }, { html: first });
  return { body, extra: templatesMarkup(states, 'quiz') };
}

// Mentor schedule: the upload dialog (with its "file chosen" state) and the card's three stages.
async function mentorSchedule(ctx) {
  const { pg, grab, reload } = ctx;
  const stages = await stated(ctx, {
    region: 'main', regionAttr: 'uploads',
    steps: [
      { state: 'pending' },
      { state: 'uploading', click: async (p) => {
        await clickLabel('Upload recording')(p);
        await p.locator('#dc-root .p-modal').getByRole('button', { name: 'Choose file' }).click();
        await p.locator('#dc-root .p-modal').getByRole('button', { name: 'Start upload' }).click();
      } },
      { state: 'queued', click: 'Publish when upload finishes' },
    ],
    wire: [['Publish when upload finishes', 'queued'], ['Cancel upload', 'pending'], ['Cancel', 'pending']],
  });
  const openers = (b) => b.querySelectorAll('main button').forEach((x) => {
    const label = x.textContent.trim();
    if (/^(Upload recording|Upload|Replace)$/.test(label)) { x.setAttribute('data-open-dialog', 'upload-dialog'); x.removeAttribute('data-show-state'); }
  });
  let body = await edit(pg, stages.body, openers, null);
  const extra = await edit(pg, stages.extra, (b) => b.querySelectorAll('template').forEach((t) => {
    t.content.querySelectorAll('main button').forEach((x) => {
      if (/^(Upload recording|Upload|Replace)$/.test(x.textContent.trim())) { x.setAttribute('data-open-dialog', 'upload-dialog'); }
    });
  }), null);
  // Dialog: capture empty and file-chosen bodies; "Choose file" / "Change" swap them.
  const empty = await captureDialogs(ctx, [{ id: 'upload-dialog', open: clickLabel('Upload recording') }]);
  await reload();
  await clickLabel('Upload recording')(pg);
  await pg.locator('#dc-root .p-modal').getByRole('button', { name: 'Choose file' }).click();
  await pg.waitForTimeout(200);
  const withFile = await grab('.p-modal');
  const dialog = await edit(pg, empty, (b, { withFile }) => {
    const modal = b.querySelector('.p-modal');
    modal.setAttribute('data-region', 'upload-file');
    const wire = (root) => root.querySelectorAll('button').forEach((x) => {
      const label = x.textContent.trim();
      if (label === 'Choose file') { x.setAttribute('data-show-state', 'upload-file:chosen'); }
      if (label === 'Change') { x.setAttribute('data-show-state', 'upload-file:empty'); }
      if (label === 'Start upload') { x.setAttribute('data-show-state', 'uploads'); x.setAttribute('data-close-dialog', ''); x.disabled = false; }
      if (label === 'Cancel' || x.getAttribute('aria-label') === 'Close') { x.setAttribute('data-close-dialog', ''); }
    });
    wire(modal);
    const t1 = document.createElement('template');
    t1.setAttribute('data-state', 'upload-file:empty');
    t1.setAttribute('data-region', "[data-region='upload-file']");
    t1.innerHTML = modal.outerHTML;
    const t2 = document.createElement('template');
    t2.setAttribute('data-state', 'upload-file:chosen');
    t2.setAttribute('data-region', "[data-region='upload-file']");
    t2.innerHTML = withFile;
    t2.content.firstElementChild.setAttribute('data-region', 'upload-file');
    wire(t2.content);
    // In the file-chosen copy, "Start upload" moves the page to the uploading stage.
    t2.content.querySelectorAll('button').forEach((x) => { if (x.textContent.trim() === 'Start upload') { x.setAttribute('data-show-state', 'uploading'); } });
    modal.querySelectorAll('button').forEach((x) => { if (x.textContent.trim() === 'Start upload') { x.disabled = true; x.removeAttribute('data-show-state'); } });
    b.append(t1, t2);
  }, { withFile });
  return { body: body + '\n' + dialog, extra };
}

// Roles & access: role cards drive the editor, tabs drive the team list, three dialogs.
async function adminRoles(ctx) {
  const { pg, reload } = ctx;
  const editorRegion = '.p-split:has(> section[aria-labelledby="perm-title"])';
  const teamRegion = 'section[aria-labelledby="team-title"]';
  const tabSel = 'section[aria-labelledby="team-title"] .p-seg[aria-label="Show"] button';
  const editSel = 'section[aria-labelledby="team-title"] button.p-link';
  const markEdits = (b, combo) => {
    const tab = combo ? combo[0] : 0;
    b.querySelectorAll('section[aria-labelledby="team-title"] button.p-link').forEach((x, i) => {
      if (x.textContent.trim() === 'Edit') { x.setAttribute('data-open-dialog', `edit-${tab}-${i}`); }
    });
  };
  const markInvites = (b) => b.querySelectorAll('button').forEach((x) => {
    const label = x.textContent.trim();
    if (label === 'Invite team member' || /^\+ Invite someone/.test(label)) { x.setAttribute('data-open-dialog', 'invite-dialog'); }
    if (label === 'New role') { x.setAttribute('data-open-dialog', 'role-dialog'); }
  });
  const a = await combos(ctx, { region: editorRegion, regionAttr: 'role-editor', parts: [{ sel: '.ro-grid[aria-label="Roles"] > button' }], extraWire: markInvites });
  const b = await combos({ ...ctx, body: a.body }, { region: teamRegion, regionAttr: 'team', parts: [{ sel: tabSel }], extraWire: markEdits });
  let body = await edit(pg, b.body, markInvites, null);
  // Dialogs: invite, new role, and one edit dialog per listed person per tab.
  const list = [
    { id: 'invite-dialog', open: clickLabel('Invite team member') },
    { id: 'role-dialog', open: clickLabel('New role') },
  ];
  await reload();
  const tabs = await pg.locator('#dc-root ' + tabSel).count();
  for (let t = 0; t < tabs; t++) {
    await reload();
    await pg.locator('#dc-root ' + tabSel).nth(t).click();
    await pg.waitForTimeout(150);
    const btns = await pg.evaluate((sel) => [...document.querySelectorAll('#dc-root ' + sel)].map((x) => x.textContent.trim()), editSel);
    btns.forEach((label, i) => {
      if (label !== 'Edit') { return; }
      list.push({ id: `edit-${t}-${i}`, open: async (p) => {
        await p.locator('#dc-root ' + tabSel).nth(t).click();
        await p.waitForTimeout(150);
        await p.locator('#dc-root ' + editSel).nth(i).click();
      } });
    });
  }
  const dialogs = await captureDialogs(ctx, list);
  return { body: body + '\n' + dialogs, extra: a.extra + b.extra };
}

// Quizzes: the course switch swaps the module list, and modules expand in both courses.
async function studentQuizzes(ctx) {
  const { pg } = ctx;
  const courseSel = '.p-seg[aria-label="Course"] button';
  const mark = (b, { i }) => b.querySelectorAll('.p-seg[aria-label="Course"] button').forEach((x, j) => {
    x.setAttribute('data-part-of', 'course'); x.setAttribute('data-part', '0'); x.setAttribute('data-value', String(j));
  });
  const count = await pg.locator('#dc-root ' + courseSel).count();
  const first = await reveal({ sel: 'main button[aria-expanded]' })(ctx);
  let body = await edit(pg, first.body, (b) => { b.querySelector('main').setAttribute('data-region', 'course'); }, null);
  body = await edit(pg, body, mark, { i: 0 });
  let extra = '';
  for (let i = 1; i < count; i++) {
    const r = await reveal({ sel: 'main button[aria-expanded]', prep: async (p) => { await p.locator('#dc-root ' + courseSel).nth(i).click(); await p.waitForTimeout(200); } })(ctx);
    // Keep only main from this pass; make its ids unique.
    const main = await edit(pg, r.body, (b, { i }) => {
      const m = b.querySelector('main');
      const looks = [...b.querySelectorAll('template[id^="rvlook"]')];
      const ren = (id) => 'c' + i + id;
      m.querySelectorAll('[id^="rv"]').forEach((el) => { el.id = ren(el.id); });
      m.querySelectorAll('[data-reveal], [data-conceal], [data-on-look]').forEach((el) => {
        ['data-reveal', 'data-conceal', 'data-on-look'].forEach((a) => {
          if (el.hasAttribute(a)) { el.setAttribute(a, el.getAttribute(a).split(' ').filter(Boolean).map(ren).join(' ')); }
        });
      });
      looks.forEach((t) => { t.id = ren(t.id); });
      m.setAttribute('data-region', 'course');
      b.innerHTML = m.outerHTML + looks.map((t) => t.outerHTML).join('');
    }, { i });
    const marked = await edit(pg, main, mark, { i });
    // main goes in a template; the look templates must live in the document itself.
    const parts = await edit(pg, marked, (b) => {
      const m = b.querySelector('main');
      const looks = [...b.querySelectorAll('template[id]')].map((t) => t.outerHTML).join('');
      b.innerHTML = `<template data-state="course:${'IDX'}" data-region="[data-region='course']">${m.outerHTML}</template>` + looks;
    }, null);
    extra += parts.replace('course:IDX', 'course:' + i) + '\n';
  }
  // The default course's own template, so switching back works.
  await ctx.reload();
  const back = await edit(pg, body, (b) => {
    const m = b.querySelector('main');
    const t = document.createElement('template');
    t.setAttribute('data-state', 'course:0');
    t.setAttribute('data-region', "[data-region='course']");
    t.innerHTML = m.outerHTML;
    b.innerHTML = t.outerHTML;
  }, null);
  return { body, extra: extra + back + '\n' };
}

// Help centre: tag each question with its topic (from the design's FAQ data) for help.js.
async function helpData(ctx) {
  const fs = await import('fs');
  const src = fs.readFileSync((ctx.srcDir || '.') + '/Student-Help.dc.html', 'utf8');
  const cats = [...src.matchAll(/\['(\w+)', '([^']+)', 'p-tile[^']*', 'M/g)].map((m) => [m[1], m[2]]);
  const faq = [...src.matchAll(/\['[\w-]+', '(\w+)', '[^']*\?*/g)].map((m) => m[1]).filter((c) => cats.some(([id]) => id === c));
  const popular = [...src.matchAll(/\['([a-z ]+)', '([A-Z][^']+)'\]/g)].map((m) => [m[1], m[2]]);
  const body = await edit(ctx.pg, ctx.body, (b, { cats, faq, popular }) => {
    const label = Object.fromEntries(cats);
    const ul = b.querySelector('.hp-q').closest('ul');
    ul.setAttribute('data-faq-list', '');
    [...ul.children].filter((li) => li.tagName === 'LI').forEach((li, i) => {
      li.setAttribute('data-cat', faq[i]);
      li.setAttribute('data-cat-label', label[faq[i]]);
    });
    b.querySelectorAll('.hp-cat').forEach((c, i) => c.setAttribute('data-cat', cats[i][0]));
    b.querySelectorAll('.hp-chip').forEach((c) => {
      const p = popular.find(([, l]) => l === c.textContent.trim());
      if (p) { c.setAttribute('data-q', p[0]); }
    });
  }, { cats, faq, popular });
  return { body, extra: '<script src="../assets/js/pages/help.js" defer></script>\n' };
}

// Login: a demo switch picks which panel the Log in button opens.
async function login(ctx) {
  const body = await edit(ctx.pg, ctx.body, (b) => {
    const btn = [...b.querySelectorAll('a.eit-btn')].find((a) => a.textContent.trim() === 'Log in');
    btn.id = 'login-go';
    const box = document.createElement('div');
    box.className = 'demo-role';
    box.innerHTML = '<span class="demo-role__label" id="demo-role-label">Demo: log in as</span>'
      + '<div class="eit-seg has-thumb" role="group" aria-labelledby="demo-role-label" data-sets-href="#login-go">'
      + '<span class="eit-seg__thumb" aria-hidden="true"></span>'
      + '<button type="button" class="eit-seg__btn is-on" aria-pressed="true" data-href="student/dashboard.html">Student</button>'
      + '<button type="button" class="eit-seg__btn" aria-pressed="false" data-href="mentor/dashboard.html">Mentor</button>'
      + '<button type="button" class="eit-seg__btn" aria-pressed="false" data-href="admin/overview.html">Admin</button>'
      + '</div>';
    btn.before(box);
    const form = btn.closest('form');
    form.setAttribute('data-next-from', '#login-go');
  }, null);
  return { body };
}

export const recipes = {
  'Login.dc.html': login,
  'ForgotPassword.dc.html': forgotPassword,
  'Notifications.dc.html': notificationsPage,
  'Enroll-Course.dc.html': enrollCourse,
  'Student-Quiz.dc.html': quiz,
  'Student-QuizResult.dc.html': filter('.p-seg[aria-label="Show"] button'),
  'Student-Assignments.dc.html': filter('.eit-chips[aria-label="Filter"] .eit-chip'),
  'Student-ProjectDetail.dc.html': projectDetail,
  'Mentor-Schedule.dc.html': mentorSchedule,
  'Admin-Courses.dc.html': filter('.eit-chips[aria-label="Track"] .eit-chip'),
  'Admin-Students.dc.html': filter('.eit-chips[aria-label="Payment status"] .eit-chip'),
  'Admin-BatchDetail.dc.html': filter('.eit-chips[aria-label="Filter"] .eit-chip'),
  'Admin-StudentRecord.dc.html': studentRecord,
  'Admin-BatchEdit.dc.html': batchEdit,
  'Admin-CourseReview.dc.html': courseReview,
  'Admin-Roles.dc.html': adminRoles,
  'Main.dc.html': notifMenu,
  'Mentor-Dashboard.dc.html': chain(reveal({ sel: 'main [role="checkbox"]' }), notifMenu),
  'Admin-Overview.dc.html': notifMenu,
  'Student-Help.dc.html': chain(reveal({ sel: '.hp-q' }), helpData),
  'Student-Quizzes.dc.html': studentQuizzes,
  'Admin-Settings.dc.html': reveal({ sel: 'main [role="switch"][aria-labelledby="pause-label"]' }),
  'Student-Leaderboard.dc.html': reveal({ sel: 'main button[aria-expanded]' }),
};

export { edit, clickText, captureStates, stated, combos, chain, reveal, templatesMarkup, wireFn };
