/* Saved & notes: Remove takes a lesson or a note off the page (app.js shows the toast) and keeps the chip
   counts and the empty state right. Nothing is saved anywhere. */
(function () {
  "use strict";

  var list = document.querySelector(".sv-page[data-list]");
  if (!list) {
    return;
  }

  function bump(el, by) {
    if (el) {
      el.textContent = Math.max(0, +el.textContent + by);
    }
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-remove]");
    var card = btn && btn.closest("[data-list-item]");
    if (!card) {
      return;
    }
    var tag = card.getAttribute("data-tags");
    var group = card.closest("[data-list-group]");
    var next = card.nextElementSibling || card.previousElementSibling;
    card.remove();
    bump(list.querySelector('[data-filter="all"] .ex-n'), -1);
    bump(list.querySelector('[data-filter="' + tag + '"] .ex-n'), -1);
    if (group && !group.querySelector("[data-list-item]")) {
      group.hidden = true;
    }
    var shown = list.querySelectorAll("[data-list-item]:not([hidden])").length;
    list.querySelector("[data-list-empty]").hidden = shown > 0;
    // Keep keyboard focus nearby once the card has gone.
    var focus = next && next.querySelector("a, button");
    if (focus) {
      focus.focus();
    }
  });
})();
