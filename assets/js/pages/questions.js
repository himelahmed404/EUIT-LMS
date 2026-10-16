/* Mentor questions: filter the inbox by Waiting / Answered / All. Choosing a question opens it
   (app.js treats the list as tabs); an answered question moves out of Waiting when it's sent. */
(function () {
  "use strict";

  var list = document.querySelector(".qa-list");
  if (!list) {
    return;
  }
  var items = Array.prototype.slice.call(list.querySelectorAll(".qa-item"));
  var empty = list.querySelector("[data-qa-empty]");

  function apply() {
    var on = document.querySelector('[data-qa-show][aria-pressed="true"]');
    var show = on ? on.getAttribute("data-qa-show") : "all";
    var shown = items.filter(function (it) {
      var ok = show === "all" || it.getAttribute("data-status") === show;
      it.hidden = !ok;
      return ok;
    });
    if (empty) {
      empty.hidden = shown.length !== 0;
    }
    // Keep an open question in view: if the selected one is filtered out, open the first shown.
    var selected = items.filter(function (it) {
      return it.getAttribute("aria-selected") === "true";
    })[0];
    if (shown.length && (!selected || selected.hidden)) {
      shown[0].click();
    }
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-qa-show]")) {
      apply();
    }
  });
  document.addEventListener("submit", function (e) {
    var panel = e.target.closest(".qa-detail");
    if (!panel) {
      return;
    }
    var tab = document.getElementById(panel.getAttribute("aria-labelledby"));
    if (tab) {
      tab.setAttribute("data-status", "answered");
      var badge = tab.querySelector(".eit-badge");
      if (badge) {
        badge.className = "eit-badge eit-badge--success";
        badge.textContent = "Answered";
      }
    }
    var box = e.target;
    box.innerHTML =
      '<p class="p-notice" style="margin: 0">Answer sent. The student sees it under the lesson and gets an SMS.</p>';
  });
  apply();
})();
