/* Routine: switching month swaps in a captured calendar (app.js, data-show-state). The new calendar starts on
   "Whole month", so press it to clear any day filter left over from the other month and refilter the cards. */
(function () {
  "use strict";

  document.addEventListener("click", function (e) {
    if (!e.target.closest('[data-show-state^="month:"]')) {
      return;
    }
    var all = document.querySelector('#rt-month [data-filter="all"]');
    if (all) {
      all.click();
    }
  });
})();
