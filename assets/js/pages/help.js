/* Help centre: filter the questions by topic or search text, and answer "Did this help?".
   Runs after app.js, which already handles opening and closing each answer. */
(function () {
  "use strict";

  var list = document.querySelector("[data-faq-list]");
  if (!list) {
    return;
  }
  var items = Array.prototype.slice.call(list.querySelectorAll("li[data-cat]"));
  var cats = Array.prototype.slice.call(document.querySelectorAll(".hp-cat[data-cat]"));
  var input = document.querySelector(".hp-search input");
  var title = document.getElementById("faq-title");
  var sub = title && title.nextElementSibling;
  var head = title && title.closest(".p-card-head");
  var state = { cat: "", q: "" };

  var reset = document.createElement("button");
  reset.type = "button";
  reset.className = "p-ghostbtn";
  reset.textContent = "Show all topics";
  reset.hidden = true;
  if (head) {
    head.appendChild(reset);
  }

  var empty = document.createElement("div");
  empty.className = "hp-empty";
  empty.hidden = true;
  empty.innerHTML =
    '<span class="p-tile p-tile--muted" style="width: 52px; height: 52px; border-radius: 16px;">' +
    '<svg class="p-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg></span>' +
    '<strong style="font-size: 16px;"></strong>' +
    '<span class="p-small" style="max-width: 360px;">Try a shorter word, pick a topic above, or message the support team. A real person will reply.</span>';
  list.after(empty);

  function text(li) {
    return (li.textContent + " " + (li.getAttribute("data-cat-label") || "")).toLowerCase();
  }

  function apply() {
    var q = state.q.trim().toLowerCase();
    var n = 0;
    items.forEach(function (li) {
      var show = (!state.cat || li.getAttribute("data-cat") === state.cat) && (!q || text(li).indexOf(q) !== -1);
      li.hidden = !show;
      if (show) {
        n += 1;
      }
    });
    cats.forEach(function (c) {
      c.setAttribute("aria-pressed", c.getAttribute("data-cat") === state.cat ? "true" : "false");
    });
    var catLabel = state.cat ? document.querySelector('.hp-cat[data-cat="' + state.cat + '"] strong').textContent : "";
    if (title) {
      title.textContent = q ? 'Results for "' + state.q.trim() + '"' : state.cat ? catLabel : "Common questions";
    }
    if (sub) {
      sub.textContent =
        n + (n === 1 ? " answer" : " answers") + (q || state.cat ? "" : " across " + cats.length + " topics");
    }
    reset.hidden = !(state.cat || q);
    list.hidden = n === 0;
    empty.hidden = n !== 0;
    empty.querySelector("strong").textContent = 'No answers match "' + state.q.trim() + '"';
  }

  document.addEventListener("click", function (e) {
    var cat = e.target.closest(".hp-cat[data-cat]");
    if (cat) {
      var id = cat.getAttribute("data-cat");
      state.cat = state.cat === id ? "" : id;
      state.q = "";
      if (input) {
        input.value = "";
      }
      apply();
      return;
    }
    var chip = e.target.closest(".hp-chip[data-q]");
    if (chip) {
      state.q = chip.getAttribute("data-q");
      state.cat = "";
      if (input) {
        input.value = state.q;
      }
      apply();
      return;
    }
    if (e.target === reset) {
      state = { cat: "", q: "" };
      if (input) {
        input.value = "";
      }
      apply();
      return;
    }
    var yn = e.target.closest(".hp-yn");
    if (yn) {
      var row = yn.parentElement;
      var yes = yn.textContent.trim() === "Yes";
      row.innerHTML = yes
        ? '<span class="p-small" style="color: var(--success); font-weight: 600;">Thanks, glad it helped.</span>'
        : '<span class="p-small">Sorry about that. Message us on WhatsApp and we\'ll sort it out.</span>';
    }
  });

  if (input) {
    input.addEventListener("input", function () {
      state.q = input.value;
      state.cat = "";
      apply();
    });
  }
})();
