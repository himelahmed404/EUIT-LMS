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
  function setState(btn, on, styles) {
    btn.setAttribute(stateAttr(btn), on ? "true" : "false");
    if (btn.classList.contains("eit-chip")) {
      btn.classList.toggle("is-on", on);
    }
    if (styles && styles.on !== styles.off) {
      var s = on ? styles.on : styles.off;
      if (s == null) {
        btn.removeAttribute("style");
      } else {
        btn.setAttribute("style", s);
      }
    }
  }
  function pressInGroup(btn) {
    var group = groupOf(btn);
    var list = members(group, btn);
    var styles = list.length > 1 ? rememberStyles(group, list) : null;
    var multi = group.hasAttribute("data-multi") || list.length < 2;
    if (multi) {
      setState(btn, btn.getAttribute(stateAttr(btn)) !== "true", styles);
    } else {
      list.forEach(function (b) {
        setState(b, b === btn, styles);
      });
    }
  }

  /* ---------- Captured states ----------
     Screens whose content changes with a choice ship each state as a <template data-state>.
     A trigger with data-show-state="name" swaps the matching region in. */
  function showState(name) {
    var tpl = document.querySelector('template[data-state="' + name + '"]');
    if (!tpl) {
      return;
    }
    var region = document.querySelector(tpl.getAttribute("data-region"));
    if (!region) {
      return;
    }
    var frag = tpl.content.cloneNode(true);
    var fresh = frag.firstElementChild;
    region.replaceWith(frag);
    initMotion(fresh);
    initLanguage(fresh);
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
  function openDialog(id) {
    var d = document.getElementById(id);
    if (!d) {
      return;
    }
    d.hidden = false;
    var focusable = d.querySelector("input, select, textarea, button");
    if (focusable) {
      focusable.focus();
    }
  }
  function closeDialog(d) {
    d.hidden = true;
  }

  /* ---------- Click handling ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target;

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
      openDialog(opener.getAttribute("data-open-dialog"));
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
      var scope = document.querySelector(markRead.getAttribute("data-mark-read")) || document;
      $all("[data-unread]", scope).forEach(function (u) {
        u.remove();
      });
      $all("[data-unread-count]").forEach(function (c) {
        c.remove();
      });
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

    var dead = t.closest('a[href="#"]');
    if (dead) {
      e.preventDefault();
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
    if (e.key !== "Escape") {
      return;
    }
    closeAllPopovers();
    $all("[data-dialog]").forEach(closeDialog);
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

  window.addEventListener("resize", function () {
    $all(".eit-seg").forEach(placeThumb);
  });

  function init() {
    initLanguage(document);
    initMotion(document);
    initCountdowns();
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
