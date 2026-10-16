/* Mentor review: the rubric total follows the marks, and the preview frame takes the chosen width.
   No marks are saved; this only keeps the screen consistent while it's clicked through. */
(function () {
  "use strict";

  var inputs = Array.prototype.slice.call(document.querySelectorAll("input[data-score]"));
  var total = document.querySelector("[data-score-total]");
  function sum() {
    var n = 0;
    inputs.forEach(function (i) {
      var max = +i.getAttribute("max") || 100;
      var v = Math.max(0, Math.min(max, Math.round(+i.value || 0)));
      i.setAttribute("aria-invalid", +i.value > max || +i.value < 0 ? "true" : "false");
      n += v;
    });
    if (total) {
      total.textContent = n;
    }
  }
  inputs.forEach(function (i) {
    i.addEventListener("input", sum);
  });

  var frame = document.getElementById("preview-frame");
  var label = document.querySelector("[data-preview-label]");
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-preview-size]");
    if (!b || !frame) {
      return;
    }
    var px = +b.getAttribute("data-preview-size");
    frame.style.maxWidth = px >= 1440 ? "100%" : px === 768 ? "60%" : "32%";
    if (label) {
      label.textContent = "Live site preview · " + px + "px";
    }
  });
})();
