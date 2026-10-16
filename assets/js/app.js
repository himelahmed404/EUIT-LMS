/* European IT LMS: shared UI behaviour for every page.
   No business logic: these handlers only keep the interface responsive (toggles, tabs, menus,
   motion) so the screens can be clicked through. All state lives in the DOM's ARIA attributes. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = {
    get: function (k) {
      try {
        return window.localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        window.localStorage.setItem(k, v);
      } catch (e) {
        /* storage blocked */
      }
    },
  };

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function onVisible(el, cb, threshold) {
    if (!("IntersectionObserver" in window)) {
      cb();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            io.disconnect();
            cb();
          }
        });
      },
      { threshold: threshold == null ? 0.2 : threshold },
    );
    io.observe(el);
  }
  function tween(ms, fn) {
    var start = null;
    function frame(now) {
      if (start === null) {
        start = now;
      }
      var t = Math.min(1, (now - start) / ms);
      fn(1 - Math.pow(1 - t, 4));
      if (t < 1) {
        window.requestAnimationFrame(frame);
      }
    }
    window.requestAnimationFrame(frame);
  }

  /* ---------- Motion: headline word reveal and number count-up ---------- */
  function initMotion(root) {
    if (reduceMotion) {
      return;
    }
    $all(".eit-hl.is-static", root).forEach(function (hl) {
      hl.classList.remove("is-static");
      hl.classList.add("is-pre");
      onVisible(
        hl,
        function () {
          hl.classList.remove("is-pre");
          hl.classList.add("is-in");
        },
        0.1,
      );
    });
    $all(".eit-count", root).forEach(function (el) {
      var n = el.querySelector(".eit-count__n");
      var finalText = (el.querySelector(".eit-sr") || n).textContent;
      var m = /^(\D*?)(\d[\d,]*)(\.\d+)?(\D*)$/.exec(finalText);
      if (!n || !m) {
        return;
      }
      var target = parseFloat(m[2].replace(/,/g, "") + (m[3] || ""));
      var decimals = m[3] ? m[3].length - 1 : 0;
      var indian = /\d,\d\d,\d{3}/.test(m[2]);
      var fmt = new Intl.NumberFormat(indian ? "en-IN" : "en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      n.textContent = m[1] + fmt.format(0) + m[4];
      onVisible(
        el,
        function () {
          tween(1400, function (k) {
            n.textContent = m[1] + fmt.format(target * k) + m[4];
          });
        },
        0.5,
      );
    });
  }

  /* ---------- Segmented controls (EIT.SegmentedControl) ---------- */
  function placeThumb(seg) {
    var thumb = seg.querySelector(".eit-seg__thumb");
    var on = seg.querySelector(".eit-seg__btn.is-on");
    if (!thumb || !on) {
      return;
    }
    thumb.style.width = on.offsetWidth + "px";
    thumb.style.transform = "translateX(" + on.offsetLeft + "px)";
  }
  function selectSeg(seg, btn) {
    $all(".eit-seg__btn", seg).forEach(function (b) {
      var on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    placeThumb(seg);
  }
  function isLanguageSeg(seg) {
    return seg.getAttribute("aria-label") === "Language";
  }
  function initLanguage(root) {
    // Visual only for now: the choice is remembered, the copy stays English.
    var lang = store.get("eit-lang");
    $all(".eit-seg", root).forEach(function (seg) {
      if (isLanguageSeg(seg) && lang) {
        var btn = $all(".eit-seg__btn", seg).filter(function (b) {
          return (b.getAttribute("lang") || "en") === lang;
        })[0];
        if (btn) {
          selectSeg(seg, btn);
        }
      }
      placeThumb(seg);
    });
  }

  /* ---------- Pressed / radio / checkbox groups ---------- */
  // Some states are drawn with inline styles, so remember each group's "on" and "off" style.
  function groupOf(el) {
    return el.closest('[role="group"], [role="radiogroup"], [role="tablist"], .p-seg, .eit-chips') || el.parentElement;
  }
  function stateAttr(el) {
    return el.hasAttribute("aria-pressed") ? "aria-pressed" : "aria-checked";
  }
  function members(group, el) {
    var attr = stateAttr(el);
    return $all("[" + attr + "]", group).filter(function (b) {
      return groupOf(b) === group && b.getAttribute("role") !== "switch" && b.getAttribute("role") !== "checkbox";
    });
  }
  function rememberStyles(group, list) {
    if (group.__styles) {
      return group.__styles;
    }
    var attr = stateAttr(list[0]);
    var on = list.filter(function (b) {
      return b.getAttribute(attr) === "true";
    })[0];
    var off = list.filter(function (b) {
      return b.getAttribute(attr) !== "true";
    })[0];
    group.__styles = { on: on ? on.getAttribute("style") : null, off: off ? off.getAttribute("style") : null };
    return group.__styles;
  }
  // Some groups colour each option differently when it's on (Present green, Late amber, Absent red).
  // Learn each option's "on" look from any group on the page where that option is already on.
  var pressedLooks = null;
  function lookKey(group, btn) {
    var labels = members(group, btn).map(function (b) {
      return b.textContent.trim();
    });
    return labels.join("/") + "|" + btn.textContent.trim();
  }
  function pressedLook(group, btn, fallback) {
    if (!pressedLooks) {
      pressedLooks = {};
      $all('[aria-pressed="true"], [role="radio"][aria-checked="true"]').forEach(function (b) {
        var g = groupOf(b);
        if (members(g, b).length > 1) {
          var k = lookKey(g, b);
          if (!(k in pressedLooks)) {
            pressedLooks[k] = b.getAttribute("style");
          }
        }
      });
    }
    var key = lookKey(group, btn);
    if (key in pressedLooks) {
      return pressedLooks[key];
    }
    // An option never seen "on" in a group of individually coloured options gets the plain look.
    var sig = key.slice(0, key.lastIndexOf("|") + 1);
    var looks = {};
    Object.keys(pressedLooks).forEach(function (k) {
      if (k.indexOf(sig) === 0) {
        looks[pressedLooks[k]] = true;
      }
    });
    return Object.keys(looks).length > 1 ? null : fallback;
  }
  function setState(btn, on, look) {
    btn.setAttribute(stateAttr(btn), on ? "true" : "false");
    if (btn.classList.contains("eit-chip")) {
      btn.classList.toggle("is-on", on);
    }
    if (look !== undefined) {
      if (look == null) {
        btn.removeAttribute("style");
      } else {
        btn.setAttribute("style", look);
      }
    }
  }
  function pressInGroup(btn) {
    var group = groupOf(btn);
    var list = members(group, btn);
    var styles = list.length > 1 ? rememberStyles(group, list) : null;
    var swap = styles && styles.on !== styles.off;
    function lookFor(b, on) {
      if (!swap) {
        return undefined;
      }
      return on ? pressedLook(group, b, styles.on) : styles.off;
    }
    var multi = group.hasAttribute("data-multi") || list.length < 2;
    if (multi) {
      var turnOn = btn.getAttribute(stateAttr(btn)) !== "true";
      setState(btn, turnOn, lookFor(btn, turnOn));
    } else {
      list.forEach(function (b) {
        setState(b, b === btn, lookFor(b, b === btn));
      });
    }
  }

  /* ---------- Captured states ----------
     Screens whose content changes with a choice ship each state as <template data-state="name">.
     A state can have several templates, one for each part of the page that changes; each names
     the element it replaces in data-region. A trigger with data-show-state="name" swaps them in. */
  function showState(name) {
    $all('template[data-state="' + name + '"]').forEach(function (tpl) {
      var region = document.querySelector(tpl.getAttribute("data-region"));
      if (!region) {
        return;
      }
      var frag = tpl.content.cloneNode(true);
      var fresh = frag.firstElementChild;
      region.replaceWith(frag);
      initMotion(fresh);
      initLanguage(fresh);
    });
  }

  // A region driven by several choices: each option carries data-part-of="region",
  // data-part="n" and data-value; the template is named "region:v0|v1|...".
  function showCombo(key) {
    var parts = [];
    $all('[data-part-of="' + key + '"]').forEach(function (b) {
      if (b.getAttribute(stateAttr(b)) === "true") {
        parts[+b.getAttribute("data-part")] = b.getAttribute("data-value");
      }
    });
    showState(key + ":" + parts.join("|"));
  }

  /* ---------- Pop-overs and dialogs ---------- */
  function closeAllPopovers(except) {
    $all("[data-popover]").forEach(function (p) {
      if (p === except) {
        return;
      }
      p.hidden = true;
      var t = document.querySelector('[aria-controls="' + p.id + '"]');
      if (t) {
        t.setAttribute("aria-expanded", "false");
      }
    });
  }
  var lastOpener = null;
  function openDialog(id, opener) {
    var d = document.getElementById(id);
    if (!d) {
      return;
    }
    d.hidden = false;
    lastOpener = opener || document.activeElement;
    if (opener && opener.hasAttribute("aria-expanded")) {
      opener.setAttribute("aria-expanded", "true");
    }
    var focusable = d.querySelector("input, select, textarea, button") || d.querySelector("a[href]");
    if (focusable) {
      focusable.focus();
    }
  }
  function closeDialog(d) {
    if (!d || d.hidden) {
      return;
    }
    d.hidden = true;
    var opener = document.querySelector('[aria-controls="' + d.id + '"][aria-expanded]');
    if (opener) {
      opener.setAttribute("aria-expanded", "false");
    }
    // Give focus back to whatever opened the dialog.
    if (lastOpener && document.contains(lastOpener)) {
      lastOpener.focus();
    }
    lastOpener = null;
  }

  /* ---------- Copy, and fit-to-width ---------- */
  function copyText(text, btn) {
    var label = btn.querySelector("span:last-child") || btn;
    var was = label.textContent;
    function done() {
      label.textContent = "Copied";
      btn.setAttribute("data-copied", "");
      setTimeout(function () {
        label.textContent = was;
        btn.removeAttribute("data-copied");
      }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      done();
    }
  }
  // A fixed-size sheet (the A4 certificate) scales down to the width it has, never up.
  function fitAll() {
    $all("[data-fit]").forEach(function (box) {
      var sheet = box.firstElementChild;
      if (!sheet) {
        return;
      }
      var scale = Math.min(1, box.parentElement.clientWidth / sheet.offsetWidth);
      box.style.transform = scale < 1 ? "scale(" + scale + ")" : "";
      box.style.height = scale < 1 ? sheet.offsetHeight * scale + "px" : "";
    });
  }

  /* ---------- Section menus that follow the scroll (admin settings) ---------- */
  function initScrollspy() {
    $all("nav[data-scrollspy]").forEach(function (nav) {
      var links = $all('a[href^="#"]', nav);
      var targets = links
        .map(function (a) {
          return document.getElementById(a.getAttribute("href").slice(1));
        })
        .filter(Boolean);
      if (!targets.length || !("IntersectionObserver" in window)) {
        return;
      }
      function mark(id) {
        links.forEach(function (a) {
          if (a.getAttribute("href") === "#" + id) {
            a.setAttribute("aria-current", "true");
          } else {
            a.removeAttribute("aria-current");
          }
        });
      }
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              mark(en.target.id);
            }
          });
        },
        { rootMargin: "-100px 0px -60% 0px" },
      );
      targets.forEach(function (t) {
        t.style.scrollMarginTop = "96px";
        io.observe(t);
      });
    });
  }

  /* ---------- Tabs ---------- */
  function tabsOf(tab) {
    return $all('[role="tab"]', tab.closest('[role="tablist"]') || tab.parentElement);
  }
  function selectTab(tab, focus) {
    tabsOf(tab).forEach(function (x) {
      var on = x === tab;
      x.setAttribute("aria-selected", on ? "true" : "false");
      x.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(x.getAttribute("aria-controls"));
      if (panel) {
        panel.hidden = !on;
        if (on) {
          initMotion(panel);
        }
      }
    });
    if (focus) {
      tab.focus();
    }
    // Tab lists marked data-linkable keep the address in step (courses.html#cbp-queue), so a tab
    // can be linked to, and a sidebar link that points at the tab lights up.
    var list = tab.closest('[role="tablist"]');
    if (list && list.hasAttribute("data-linkable") && window.history && history.replaceState) {
      history.replaceState(null, "", "#" + tab.getAttribute("aria-controls"));
      syncNavCurrent();
    }
  }
  // page.html#panel-id opens the tab that controls that panel.
  function openHashTab() {
    var id = window.location.hash.slice(1);
    var panel = id && document.getElementById(id);
    if (!panel || panel.getAttribute("role") !== "tabpanel") {
      return;
    }
    var tab = document.querySelector('[role="tab"][aria-controls="' + id + '"]');
    if (tab) {
      selectTab(tab);
    }
  }
  // Admin sidebar: the link for this page is current; a link to this page's open tab wins over it.
  function syncNavCurrent() {
    var nav = document.querySelector(".c-nav");
    if (!nav) {
      return;
    }
    var page = window.location.pathname.split("/").pop();
    var mine = $all("a[href]", nav).filter(function (a) {
      return a.getAttribute("href").split("#")[0] === page;
    });
    var hash = window.location.hash;
    var match =
      mine.filter(function (a) {
        var h = a.getAttribute("href");
        return hash && h.indexOf("#") !== -1 && h.slice(h.indexOf("#")) === hash;
      })[0] ||
      mine.filter(function (a) {
        return a.getAttribute("href").indexOf("#") === -1;
      })[0];
    if (!match) {
      return;
    }
    mine.forEach(function (a) {
      a.removeAttribute("aria-current");
    });
    match.setAttribute("aria-current", "page");
  }

  /* ---------- Notifications: unread dots and counts ---------- */
  function markAllRead(scope) {
    $all("[data-unread]", scope).forEach(function (u) {
      u.remove();
    });
    $all("[data-unread-count]").forEach(function (c) {
      c.remove();
    });
    $all(".is-unread").forEach(function (el) {
      el.classList.remove("is-unread");
    });
    $all("[data-notif-scope]").forEach(function (b) {
      b.setAttribute("aria-label", "Notifications");
    });
    document.dispatchEvent(new CustomEvent("eit:read"));
  }
  function initReadState() {
    var bell = document.querySelector("[data-notif-scope]");
    if (bell && store.get("eit-read-" + bell.getAttribute("data-notif-scope")) === "1") {
      markAllRead(document);
    }
  }

  /* ---------- Toast: a short "done" message for actions that would save or send ---------- */
  var toastTimer = null;
  function toast(message) {
    var el = document.querySelector(".p-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "p-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.innerHTML =
      '<svg class="p-icon p-icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
    el.appendChild(document.createTextNode(message));
    el.classList.remove("is-on");
    void el.offsetWidth;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("is-on");
    }, 2800);
  }

  /* ---------- Console (admin and mentor panels): light/dark, collapsible sidebar, phone drawer ---------- */
  var root = document.documentElement;
  function syncThemeButtons() {
    var dark = root.getAttribute("data-theme") === "dark";
    $all("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-pressed", dark ? "true" : "false");
      b.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
    });
  }
  function isMini() {
    var rail = window.matchMedia("(min-width: 768px) and (max-width: 1279px)").matches;
    var wide = window.matchMedia("(min-width: 1280px)").matches;
    return rail || (wide && root.getAttribute("data-nav") === "mini");
  }
  // With the labels hidden, each icon shows its name on hover.
  function syncNavTitles() {
    var mini = isMini();
    $all(".c-side .c-item").forEach(function (a) {
      var label = a.querySelector(".c-label");
      if (mini && label) {
        a.setAttribute("title", label.textContent.trim());
      } else if (label) {
        a.removeAttribute("title");
      }
    });
  }
  function setDrawer(open) {
    var side = document.querySelector(".c-side");
    var menu = document.querySelector("[data-nav-open]");
    var scrim = document.querySelector(".c-scrim");
    if (!side) {
      return;
    }
    side.classList.toggle("is-open", open);
    if (scrim) {
      scrim.hidden = !open && !document.querySelector(".c-pane.is-open");
    }
    // While the drawer is open, the page behind it can't be reached with Tab.
    var content = document.querySelector(".p-console > .p-content");
    if (content) {
      content.inert = open;
    }
    if (menu) {
      menu.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (open) {
      var first = side.querySelector(".c-close") || side.querySelector("a[href]");
      if (first) {
        first.focus();
      }
    } else if (menu && side.contains(document.activeElement)) {
      menu.focus();
    }
  }
  function initConsole() {
    if (!document.querySelector(".c-side")) {
      return;
    }
    syncThemeButtons();
    syncNavTitles();
    // A list can open on a filter other than All (the mentor's questions open on Waiting).
    $all(".c-list").forEach(filterList);
    var scrim = document.createElement("div");
    scrim.className = "c-scrim";
    scrim.hidden = true;
    scrim.setAttribute("data-nav-close", "");
    document.body.appendChild(scrim);
    // Ctrl K on Windows and Linux, Command K on a Mac.
    if (/Mac|iPhone|iPad/.test(navigator.platform || "")) {
      $all(".c-kbd").forEach(function (k) {
        k.textContent = "⌘ K";
      });
    }
    window.addEventListener("resize", function () {
      syncNavTitles();
      if (window.innerWidth > 767) {
        setDrawer(false);
      }
      if (!narrowPane.matches) {
        closePanes();
      }
    });
  }

  /* ---------- Record lists (admin and mentor): filters, search and the open record ----------
     A .c-list holds .c-row tabs (a vertical tab list; each row's record is its tab panel in .c-pane).
     Each row names its tags in data-tags. Filter buttons (data-filter="tag", or "all") and selects
     (data-filter, the option's value is a tag, "" for any) narrow the rows; data-search matches their text.
     Below 1100px the pane is closed, and opening a row slides its record over the page. */
  var narrowPane = window.matchMedia ? window.matchMedia("(max-width: 1099px)") : { matches: false };
  var paneOpener = null;
  function filterList(list) {
    if (!list) {
      return;
    }
    var need = $all('[data-filter][aria-pressed="true"]', list)
      .concat($all("select[data-filter]", list))
      .map(function (c) {
        return c.tagName === "SELECT" ? c.value : c.getAttribute("data-filter");
      })
      .filter(function (v) {
        return v && v !== "all";
      });
    var box = list.querySelector("[data-search]");
    var q = box ? box.value.trim().toLowerCase() : "";
    var rows = $all(".c-row", list);
    var shown = rows.filter(function (r) {
      var tags = (r.getAttribute("data-tags") || "").split(" ");
      var ok =
        need.every(function (v) {
          return tags.indexOf(v) !== -1;
        }) &&
        (!q || r.textContent.toLowerCase().indexOf(q) !== -1);
      r.hidden = !ok;
      return ok;
    });
    $all("[data-list-empty]", list).forEach(function (el) {
      el.hidden = shown.length > 0;
    });
    $all("[data-list-shown]", list).forEach(function (el) {
      el.textContent = shown.length;
    });
    // Keep a record open: if the open row was filtered out, open the first row still shown.
    var open = rows.filter(function (r) {
      return r.getAttribute("aria-selected") === "true";
    })[0];
    if (shown.length && (!open || open.hidden)) {
      selectTab(shown[0]);
    }
  }
  function setPane(pane, open, from) {
    if (!pane || pane.classList.contains("is-open") === open) {
      return;
    }
    pane.classList.toggle("is-open", open);
    var scrim = document.querySelector(".c-scrim");
    if (scrim) {
      scrim.hidden = !open;
    }
    if (open) {
      pane.closest(".c-work").setAttribute("data-opened", "");
      paneOpener = from || null;
      var close = pane.querySelector('[role="tabpanel"]:not([hidden]) [data-pane-close]');
      if (close) {
        close.focus();
      }
    } else if (paneOpener && document.contains(paneOpener)) {
      paneOpener.focus();
      paneOpener = null;
    }
  }
  function closePanes() {
    $all(".c-pane.is-open").forEach(function (p) {
      setPane(p, false);
    });
  }

  /* ---------- Click handling ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target;

    if (t.closest("[data-theme-toggle]")) {
      var dark = root.getAttribute("data-theme") !== "dark";
      root.setAttribute("data-theme", dark ? "dark" : "light");
      store.set("eit-theme", dark ? "dark" : "light");
      syncThemeButtons();
      return;
    }
    if (t.closest("[data-nav-toggle]")) {
      var mini = root.getAttribute("data-nav") !== "mini";
      if (mini) {
        root.setAttribute("data-nav", "mini");
      } else {
        root.removeAttribute("data-nav");
      }
      store.set("eit-nav", mini ? "mini" : "full");
      syncNavTitles();
      return;
    }
    if (t.closest("[data-nav-open]")) {
      setDrawer(true);
      return;
    }
    if (t.closest("[data-nav-close]")) {
      setDrawer(false);
      closePanes();
      return;
    }

    // Actions that would save or send say so, then carry on with any other behaviour they have.
    var done = t.closest("[data-toast]");
    if (done && !done.disabled) {
      toast(done.getAttribute("data-toast"));
      if (done.matches('a[href="#"]')) {
        e.preventDefault();
      }
    }
    // "Mark all present" style shortcuts: press every matching option.
    var all = t.closest("[data-press-all]");
    if (all) {
      $all(all.getAttribute("data-press-all")).forEach(pressInGroup);
    }

    var stateBtn = t.closest("[data-show-state]");
    if (stateBtn) {
      e.preventDefault();
      var inDialog = stateBtn.hasAttribute("data-close-dialog") && stateBtn.closest("[data-dialog]");
      if (inDialog) {
        closeDialog(inDialog);
      }
      showState(stateBtn.getAttribute("data-show-state"));
      return;
    }

    var opener = t.closest("[data-open-dialog]");
    if (opener) {
      e.preventDefault();
      openDialog(opener.getAttribute("data-open-dialog"), opener);
      return;
    }
    var closer = t.closest("[data-close-dialog]");
    if (closer) {
      e.preventDefault();
      closeDialog(closer.closest("[data-dialog]"));
      return;
    }
    var backdrop = t.matches("[data-dialog]") ? t : null;
    if (backdrop) {
      closeDialog(backdrop);
      return;
    }

    var popBtn = t.closest("[aria-controls][aria-expanded]");
    if (popBtn) {
      var pop = document.getElementById(popBtn.getAttribute("aria-controls"));
      if (pop) {
        var open = popBtn.getAttribute("aria-expanded") !== "true";
        if (pop.hasAttribute("data-popover")) {
          closeAllPopovers(pop);
        }
        popBtn.setAttribute("aria-expanded", open ? "true" : "false");
        pop.hidden = !open;
        return;
      }
    }
    if (!t.closest("[data-popover]")) {
      closeAllPopovers();
    }

    var markRead = t.closest("[data-mark-read]");
    if (markRead) {
      // "Mark all as read" clears the bell menu and the notifications page alike.
      markAllRead(document);
      // Remember it for this panel so the bell stays clear on the next page too.
      var bell = document.querySelector("[data-notif-scope]");
      if (bell) {
        store.set("eit-read-" + bell.getAttribute("data-notif-scope"), "1");
      }
      return;
    }

    var seg = t.closest(".eit-seg__btn");
    if (seg) {
      var segRoot = seg.closest(".eit-seg");
      selectSeg(segRoot, seg);
      if (isLanguageSeg(segRoot)) {
        var lang = seg.getAttribute("lang") || "en";
        store.set("eit-lang", lang);
        $all(".eit-seg")
          .filter(isLanguageSeg)
          .forEach(function (s) {
            var match = $all(".eit-seg__btn", s).filter(function (b) {
              return (b.getAttribute("lang") || "en") === lang;
            })[0];
            if (match) {
              selectSeg(s, match);
            }
          });
      }
      var href = seg.getAttribute("data-href");
      var target = segRoot.getAttribute("data-sets-href");
      if (href && target) {
        $all(target).forEach(function (a) {
          a.setAttribute("href", href);
        });
      }
      return;
    }

    var sw = t.closest('[role="switch"], [role="checkbox"][aria-checked]');
    if (sw && !sw.disabled) {
      var on = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", on ? "true" : "false");
      var ctl = sw.getAttribute("data-toggles");
      if (ctl) {
        $all(ctl).forEach(function (el) {
          el.hidden = !on;
        });
      }
      // A checklist (the mentor's to-do) keeps its "n of n done" line and its bar in step.
      var list = sw.closest("[data-checklist]");
      if (list) {
        var boxes = $all('[role="checkbox"]', list);
        var ticked = boxes.filter(function (b) {
          return b.getAttribute("aria-checked") === "true";
        }).length;
        $all("[data-checklist-count]", list).forEach(function (el) {
          el.textContent = ticked + " of " + boxes.length + " done";
        });
        $all("[data-checklist-bar]", list).forEach(function (el) {
          el.style.width = Math.round((ticked / boxes.length) * 100) + "%";
        });
      }
      return;
    }

    var pressed = t.closest('button[aria-pressed], button[role="radio"][aria-checked]');
    if (pressed && !pressed.disabled) {
      pressInGroup(pressed);
      if (pressed.hasAttribute("data-part-of")) {
        showCombo(pressed.getAttribute("data-part-of"));
      }
      return;
    }

    // A shortcut elsewhere on the page that opens a tab ("Open the review queue").
    var tabLink = t.closest("[data-select-tab]");
    if (tabLink) {
      e.preventDefault();
      var target = document.getElementById(tabLink.getAttribute("data-select-tab"));
      if (target) {
        selectTab(target, true);
        target.scrollIntoView({ block: "nearest" });
      }
      return;
    }

    // Tabs with panels: role="tab" + aria-controls shows its panel and hides its siblings' panels.
    var tabBtn = t.closest('[role="tab"][aria-controls]');
    if (tabBtn) {
      e.preventDefault();
      selectTab(tabBtn);
      return;
    }

    var tab = t.closest('.p-tabs a, [role="tablist"] [aria-current]');
    if (tab && tab.getAttribute("href") === "#") {
      e.preventDefault();
      $all("a", tab.closest('.p-tabs, [role="tablist"]')).forEach(function (a) {
        if (a === tab) {
          a.setAttribute("aria-current", "page");
        } else {
          a.removeAttribute("aria-current");
        }
      });
      return;
    }

    var exp = t.closest("button[aria-expanded]");
    if (exp) {
      var isOpen = exp.getAttribute("aria-expanded") === "true";
      exp.setAttribute("aria-expanded", isOpen ? "false" : "true");
      var panelId = exp.getAttribute("data-panel");
      var panel = panelId ? document.getElementById(panelId) : null;
      if (panel) {
        panel.hidden = isOpen;
      }
      return;
    }

    // Print / save as PDF (certificate, receipts).
    if (t.closest("[data-print]")) {
      e.preventDefault();
      window.print();
      return;
    }
    // Copy a link to the clipboard and say so on the button for a moment.
    var copy = t.closest("[data-copy]");
    if (copy) {
      e.preventDefault();
      copyText(copy.getAttribute("data-copy"), copy);
      return;
    }

    var dead = t.closest('a[href="#"]');
    if (dead) {
      e.preventDefault();
    }
  });

  // Record lists: runs after the generic handler has pressed the filter or opened the row's tab.
  document.addEventListener("click", function (e) {
    var t = e.target;
    var filter = t.closest("button[data-filter]");
    if (filter) {
      filterList(filter.closest(".c-list"));
      return;
    }
    // A list with its record beside it in a pane (.c-work) slides the pane in on narrow screens; the
    // mentor's review queue keeps the open review on the page instead.
    var row = t.closest(".c-row[aria-controls]");
    var work = row && row.closest(".c-work");
    if (work && narrowPane.matches) {
      setPane(work.querySelector(".c-pane"), true, row);
      return;
    }
    if (t.closest("[data-pane-close]")) {
      setPane(t.closest(".c-pane"), false);
    }
  });
  document.addEventListener("input", function (e) {
    if (e.target.matches && e.target.matches("[data-search]")) {
      filterList(e.target.closest(".c-list"));
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.matches && e.target.matches("select[data-filter]")) {
      filterList(e.target.closest(".c-list"));
    }
  });

  // Reveal / conceal: a trigger lists elements it shows (data-reveal) and hides (data-conceal).
  // Clicking flips it; clicking again undoes it. Runs after the generic handler above.
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-reveal], [data-conceal]");
    if (!t) {
      return;
    }
    e.preventDefault();
    var on = t.getAttribute("data-on") !== "true";
    t.setAttribute("data-on", on ? "true" : "false");
    // The trigger's own "on" look (e.g. a rotated chevron) is captured in a template.
    var look = t.getAttribute("data-on-look") && document.getElementById(t.getAttribute("data-on-look"));
    if (look) {
      if (!t.__offLook) {
        t.__offLook = { html: t.innerHTML, style: t.getAttribute("style") };
      }
      var next = on ? { html: look.innerHTML, style: look.getAttribute("data-style") } : t.__offLook;
      t.innerHTML = next.html;
      if (next.style == null) {
        t.removeAttribute("style");
      } else {
        t.setAttribute("style", next.style);
      }
    }
    (t.getAttribute("data-reveal") || "").split(" ").forEach(function (id) {
      var el = id && document.getElementById(id);
      if (el) {
        el.hidden = !on;
        if (on) {
          initMotion(el);
        }
      }
    });
    (t.getAttribute("data-conceal") || "").split(" ").forEach(function (id) {
      var el = id && document.getElementById(id);
      if (el) {
        el.hidden = on;
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    // Ctrl K / Command K jumps to the search in the console top bar.
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      var search = document.querySelector(".c-search input");
      if (search) {
        e.preventDefault();
        search.focus();
        search.select();
        return;
      }
    }
    // Arrow keys move between tabs, as screen-reader users expect from a tab list.
    var tab = e.target.closest && e.target.closest('[role="tab"][aria-controls]');
    var keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (tab && keys.indexOf(e.key) !== -1) {
      var list = tabsOf(tab).filter(function (x) {
        return !x.hidden;
      });
      var i = list.indexOf(tab);
      var fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
      var next =
        e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : (i + (fwd ? 1 : -1) + list.length) % list.length;
      e.preventDefault();
      selectTab(list[next], true);
      return;
    }
    if (e.key !== "Escape") {
      return;
    }
    closeAllPopovers();
    $all("[data-dialog]").forEach(closeDialog);
    var drawer = document.querySelector(".c-side.is-open");
    if (drawer) {
      setDrawer(false);
    }
    closePanes();
    if (document.activeElement && document.activeElement.closest(".c-search")) {
      document.activeElement.blur();
    }
  });
  window.addEventListener("hashchange", function () {
    openHashTab();
    syncNavCurrent();
    setDrawer(false);
  });

  // Forms are mock-ups: never post anywhere. A form can name where it leads with data-next.
  document.addEventListener("submit", function (e) {
    e.preventDefault();
    var from = e.target.getAttribute("data-next-from");
    var link = from && document.querySelector(from);
    var next = link ? link.getAttribute("href") : e.target.getAttribute("data-next");
    if (next) {
      window.location.href = next;
    }
  });

  // Countdowns (e.g. the quiz timer): "mm:ss" text that ticks down once a second.
  function initCountdowns() {
    $all("[data-countdown]").forEach(function (el) {
      var p = (/(\d{1,2}):(\d{2})/.exec(el.textContent) || [0, 0, 0]).slice(1);
      var secs = +p[0] * 60 + +p[1];
      setInterval(function () {
        if (secs <= 0) {
          return;
        }
        secs -= 1;
        // The element may have been swapped out by a captured state; follow the live one.
        var text = Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
        $all("[data-countdown]").forEach(function (live) {
          // Update only the "mm:ss" text node so icons inside the pill stay put.
          var walker = document.createTreeWalker(live, NodeFilter.SHOW_TEXT);
          for (var n = walker.nextNode(); n; n = walker.nextNode()) {
            if (/\d{1,2}:\d{2}/.test(n.nodeValue)) {
              n.nodeValue = n.nodeValue.replace(/\d{1,2}:\d{2}/, text);
              break;
            }
          }
        });
      }, 1000);
    });
  }

  /* ---------- Shell: phone tabs + "More" sheet, top-bar brand, rail tooltips ----------
     Phones show the first four sidebar links as tabs; everything else moves into a bottom sheet. */
  var MORE_ICON =
    '<svg class="p-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"></circle>' +
    '<circle cx="12" cy="12" r="1.5"></circle><circle cx="19" cy="12" r="1.5"></circle></svg>';
  function initShell() {
    var side = document.querySelector(".p-side");
    var nav = side && side.querySelector(".p-nav");
    var top = document.querySelector(".p-top");
    if (!side || !nav) {
      return;
    }
    var brand = side.querySelector(".p-brand");
    if (top && brand && !top.querySelector(".p-top-brand")) {
      var mark = brand.cloneNode(true);
      mark.classList.add("p-top-brand");
      mark.setAttribute("aria-label", "European IT Institute, home");
      top.insertBefore(mark, top.firstChild);
    }

    var links = $all(":scope > a", nav);
    if (links.length > 5) {
      var items = [];
      var label = null;
      Array.prototype.forEach.call(nav.children, function (el) {
        if (el.classList.contains("p-nav-label")) {
          label = el.textContent;
        } else if (el.tagName === "A" && links.indexOf(el) >= 4) {
          items.push({ label: label, el: el, sub: false });
        } else if (el.classList.contains("p-subnav")) {
          $all("a", el).forEach(function (a) {
            items.push({ label: label, el: a, sub: true });
          });
        }
      });
      var sheet = document.createElement("div");
      sheet.className = "p-sheet-wrap";
      sheet.id = "more-sheet";
      sheet.hidden = true;
      sheet.setAttribute("data-dialog", "");
      var body = document.createElement("div");
      body.className = "p-sheet";
      body.setAttribute("role", "dialog");
      body.setAttribute("aria-modal", "true");
      body.setAttribute("aria-label", "More pages");
      body.innerHTML = '<span class="p-sheet-grip" aria-hidden="true"></span>';
      var me = top && top.querySelector(".p-me");
      if (me) {
        var meCopy = me.cloneNode(true);
        meCopy.className = "p-sheet-me";
        body.appendChild(meCopy);
      }
      var shown = null;
      items.forEach(function (it) {
        if (it.label && it.label !== shown) {
          var h = document.createElement("span");
          h.className = "p-nav-label";
          h.textContent = it.label;
          body.appendChild(h);
          shown = it.label;
        }
        var a = it.el.cloneNode(true);
        a.removeAttribute("style");
        if (it.sub) {
          a.className = "p-sheet-sub";
        }
        body.appendChild(a);
      });
      var promo = side.querySelector(".p-help");
      if (promo) {
        var promoCopy = promo.cloneNode(true);
        promoCopy.style.marginTop = "8px";
        body.appendChild(promoCopy);
      }
      sheet.appendChild(body);
      document.body.appendChild(sheet);

      var more = document.createElement("button");
      more.type = "button";
      more.className = "p-more";
      more.setAttribute("aria-expanded", "false");
      more.setAttribute("aria-controls", "more-sheet");
      more.setAttribute("data-open-dialog", "more-sheet");
      more.innerHTML = MORE_ICON + "<span>More</span>";
      var current = items.some(function (it) {
        return it.el.getAttribute("aria-current") === "page";
      });
      if (current) {
        more.classList.add("is-current");
      }
      if (
        items.some(function (it) {
          return it.el.querySelector(".p-count");
        })
      ) {
        more.insertAdjacentHTML("beforeend", '<span class="p-pip" aria-hidden="true"></span>');
        more.setAttribute("aria-label", "More pages, some have updates");
      }
      nav.appendChild(more);
      side.classList.add("has-more");
    }

    // Icon rail (tablets): the labels are visually hidden, so show them as tooltips.
    var rail = window.matchMedia("(min-width: 721px) and (max-width: 1099px)");
    function syncRail() {
      links.forEach(function (a) {
        var text = a.querySelector(".p-nav-text");
        if (rail.matches && text) {
          a.setAttribute("title", text.textContent.trim());
        } else {
          a.removeAttribute("title");
        }
      });
    }
    syncRail();
    if (rail.addEventListener) {
      rail.addEventListener("change", syncRail);
    }
  }

  window.addEventListener("resize", function () {
    $all(".eit-seg").forEach(placeThumb);
    fitAll();
  });

  function init() {
    initShell();
    initConsole();
    openHashTab();
    syncNavCurrent();
    initReadState();
    initLanguage(document);
    initMotion(document);
    initCountdowns();
    initScrollspy();
    fitAll();
    // Thumbs measure text, so place them again once the web fonts are in.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        $all(".eit-seg").forEach(placeThumb);
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
