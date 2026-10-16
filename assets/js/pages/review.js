/* Mentor reviews: the queue of waiting projects and the open one's review. Each review's total follows its
   marks, says whether it passes, and Approve waits until every part has a mark. The preview frame takes the
   chosen device width. Previous / Next step through the queue as it's filtered. Approve and Request changes
   mark the project done in the queue. Nothing is saved. Runs after app.js, which opens the rows (tabs). */
(function () {
  "use strict";

  var queue = document.querySelector("[data-queue]");
  if (!queue) {
    return;
  }
  var PASS = 60;

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function sum(rubric) {
    var inputs = $all("input[data-score]", rubric);
    var n = 0;
    var filled = 0;
    inputs.forEach(function (i) {
      var max = +i.getAttribute("max") || 100;
      var raw = i.value.trim();
      var bad = raw !== "" && (+raw > max || +raw < 0);
      i.setAttribute("aria-invalid", bad ? "true" : "false");
      if (raw !== "" && !bad) {
        filled += 1;
        n += Math.round(+raw);
      }
    });
    var all = filled === inputs.length;
    rubric.querySelector("[data-score-total]").textContent = filled ? n : "—";
    var verdict = rubric.querySelector("[data-score-verdict]");
    if (!all) {
      verdict.removeAttribute("data-pass");
      verdict.textContent =
        inputs.length - filled === inputs.length
          ? "Give a mark for each part"
          : inputs.length - filled + " of " + inputs.length + " parts still need a mark";
    } else {
      verdict.setAttribute("data-pass", n >= PASS ? "true" : "false");
      verdict.textContent = n >= PASS ? "Passes · pass mark " + PASS : "Below the pass mark of " + PASS;
    }
    var approve = rubric.querySelector('[data-review-decide="approved"]');
    approve.disabled = !all || n < PASS;
  }

  function rows() {
    return $all(".c-qrow", queue).filter(function (r) {
      return !r.hidden;
    });
  }
  // "2 of 5" and the ends of the queue, for the open review.
  function syncPosition() {
    var shown = rows();
    var open = shown.filter(function (r) {
      return r.getAttribute("aria-selected") === "true";
    })[0];
    var i = shown.indexOf(open);
    var panel = open && document.getElementById(open.getAttribute("aria-controls"));
    if (!panel) {
      return;
    }
    panel.querySelector("[data-queue-pos]").textContent = i + 1 + " of " + shown.length;
    panel.querySelector('[data-queue-step="-1"]').disabled = i <= 0;
    panel.querySelector('[data-queue-step="1"]').disabled = i >= shown.length - 1;
  }

  document.addEventListener("input", function (e) {
    var rubric = e.target.closest("[data-rubric]");
    if (rubric && e.target.matches("input[data-score]")) {
      sum(rubric);
    }
  });
  queue.addEventListener("change", function () {
    // The batch picker filters the queue (app.js); keep the position line right.
    window.setTimeout(syncPosition, 0);
  });

  document.addEventListener("click", function (e) {
    var t = e.target;
    var size = t.closest("[data-preview-size]");
    if (size) {
      var panel = size.closest('[role="tabpanel"]');
      var frame = panel.querySelector("[data-preview-frame]");
      var label = panel.querySelector("[data-preview-label]");
      var px = +size.getAttribute("data-preview-size");
      frame.style.maxWidth = px >= 1440 ? "100%" : px === 768 ? "60%" : "32%";
      label.textContent = "Live site preview · " + px + "px";
      return;
    }
    var step = t.closest("[data-queue-step]");
    if (step) {
      var shown = rows();
      var open = shown.filter(function (r) {
        return r.getAttribute("aria-selected") === "true";
      })[0];
      var next = shown[shown.indexOf(open) + +step.getAttribute("data-queue-step")];
      if (next) {
        next.click();
        next.scrollIntoView({ block: "nearest", inline: "nearest" });
        var focus = document.getElementById(next.getAttribute("aria-controls")).querySelector("h2");
        focus.setAttribute("tabindex", "-1");
        focus.focus({ preventScroll: true });
        window.scrollTo({ top: 0 });
      }
      syncPosition();
      return;
    }
    var decide = t.closest("[data-review-decide]");
    if (decide && !decide.disabled) {
      var tab = queue.querySelector('[aria-controls="' + decide.closest('[role="tabpanel"]').id + '"]');
      var meta = tab.querySelector(".c-qmeta");
      var old = meta.querySelector(".eit-badge");
      if (old) {
        old.remove();
      }
      var done = decide.getAttribute("data-review-decide");
      meta.insertAdjacentHTML(
        "beforeend",
        '<span class="eit-badge eit-badge--' +
          (done === "approved" ? "success" : "neutral") +
          '">' +
          (done === "approved" ? "Approved" : "Sent back") +
          "</span>",
      );
      tab.setAttribute("data-done", "");
      return;
    }
    if (t.closest(".c-qrow")) {
      syncPosition();
    }
  });

  $all("[data-rubric]").forEach(sum);
  syncPosition();
})();
