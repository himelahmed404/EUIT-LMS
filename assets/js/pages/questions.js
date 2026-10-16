/* Mentor questions: the list opens on Waiting (app.js filters it and opens the rows). Send answer waits for
   some text; sending marks the question answered in the list, the record and the counts, and shows the answer
   in place of the form. Nothing is sent anywhere. */
(function () {
  "use strict";

  var list = document.querySelector('.c-list[aria-label="Student questions"]');
  if (!list) {
    return;
  }

  function bump(el, by) {
    if (el) {
      el.textContent = Math.max(0, +el.textContent + by);
    }
  }
  function esc(t) {
    var d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  }

  document.addEventListener("input", function (e) {
    var form = e.target.closest("[data-answer]");
    if (form) {
      form.querySelector('[type="submit"]').disabled = !form.querySelector("textarea").value.trim();
    }
  });

  document.addEventListener("submit", function (e) {
    var form = e.target.closest("[data-answer]");
    if (!form) {
      return;
    }
    var text = form.querySelector("textarea").value.trim();
    if (!text) {
      return;
    }
    var panel = form.closest('[role="tabpanel"]');
    var row = list.querySelector('[aria-controls="' + panel.id + '"]');
    var first = row.querySelector(".c-who .c-cell-t").textContent.split(" ")[0];
    row.setAttribute("data-tags", row.getAttribute("data-tags").replace("waiting", "answered"));
    [row, panel.querySelector(".c-pane-title")].forEach(function (el) {
      var b = el.querySelector(".eit-badge");
      b.className = "eit-badge eit-badge--success";
      b.textContent = "Answered";
    });
    bump(list.querySelector('[data-filter="waiting"] .c-n'), -1);
    bump(list.querySelector('[data-filter="answered"] .c-n'), 1);
    var pill = document.querySelector('.c-item[href="questions.html"] .c-count');
    if (pill) {
      bump(pill, -1);
      if (pill.textContent === "0") {
        pill.remove();
      }
    }
    form.outerHTML =
      '<div class="c-block"><h3>Your answer</h3><p class="c-note">' +
      esc(text) +
      '</p><p class="p-small" style="margin: 0">' +
      first +
      " is told by SMS and sees it under the lesson.</p></div>";
  });
})();
