/* Coupons & referrals. New coupon: the code is kept to capitals and digits, a code that already exists is
   caught, and the preview shows what a student would pay. "Run it again" on an expired coupon fills it in.
   Disable names the coupon it's about. Runs after app.js, which presses the buttons and opens the dialogs. */
(function () {
  "use strict";

  var dlg = document.getElementById("new-coupon");
  if (!dlg) {
    return;
  }
  var code = dlg.querySelector("#nc-code");
  var value = dlg.querySelector("#nc-value");
  var scope = dlg.querySelector("#nc-scope");
  var limit = dlg.querySelector("#nc-limit");
  var codeNote = dlg.querySelector("#nc-code-note");
  var valueNote = dlg.querySelector("#nc-value-note");
  var preview = dlg.querySelector("[data-coupon-preview]");
  var create = dlg.querySelector("[data-coupon-create]");
  var taken = (dlg.querySelector("[data-codes]").getAttribute("data-codes") || "").split(" ");
  var CODE_NOTE = codeNote.textContent;

  function kind() {
    var b = dlg.querySelector('[data-kind][aria-pressed="true"]');
    return b ? b.getAttribute("data-kind") : "pct";
  }
  function setKind(k) {
    Array.prototype.forEach.call(dlg.querySelectorAll("[data-kind]"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-kind") === k ? "true" : "false");
    });
  }
  function taka(n) {
    return "৳" + Math.round(n).toLocaleString("en-IN");
  }
  function flag(input, bad) {
    input.closest(".eit-field").classList.toggle("is-error", bad);
    input.setAttribute("aria-invalid", bad ? "true" : "false");
  }

  function update() {
    var c = code.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c !== code.value) {
      code.value = c;
    }
    var dup = taken.indexOf(c) !== -1;
    codeNote.textContent = dup ? c + " already exists. Pick another code." : CODE_NOTE;
    flag(code, dup);

    var pct = kind() === "pct";
    var opt = scope.options[scope.selectedIndex];
    var fee = +opt.getAttribute("data-fee");
    var v = +value.value || 0;
    var tooBig = pct ? v > 50 : v >= fee;
    valueNote.textContent = pct ? "Up to 50% off" : "Less than the course fee (" + taka(fee) + ")";
    flag(value, tooBig);
    value.placeholder = pct ? "15" : "1000";

    var course = scope.value === "all" ? "a " + taka(fee) + " course" : opt.textContent + " (" + taka(fee) + " online)";
    var off = pct ? (fee * v) / 100 : v;
    preview.textContent =
      v > 0 && !tooBig
        ? "On " + course + ", a student pays " + taka(fee - off) + " instead of " + taka(fee) + "."
        : "Pick a discount to see what a student pays.";

    create.disabled = !(/^[A-Z0-9]{4,12}$/.test(c) && !dup && v > 0 && !tooBig);
    var uses = +limit.value;
    create.setAttribute("data-toast", c + " is live" + (uses ? " for " + uses + " uses" : ", with no limit"));
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest('[data-open-dialog="new-coupon"]');
    if (opener) {
      // A fresh coupon, or a new run of an expired one (same discount, a new code).
      var from = opener.getAttribute("data-from-code");
      code.value = from ? from.replace(/\d+$/, "") + "26" : "";
      setKind(from ? opener.getAttribute("data-from-kind") : "pct");
      value.value = from ? opener.getAttribute("data-from-value") : "";
      scope.value = from ? opener.getAttribute("data-from-scope") : "all";
      limit.value = "100";
      update();
      code.focus();
      return;
    }
    var off = e.target.closest('[data-open-dialog="disable-coupon"]');
    if (off) {
      var name = off.getAttribute("data-code");
      document.getElementById("disable-coupon-title").textContent = "Disable " + name + "?";
      document.querySelector("[data-coupon-disable]").setAttribute("data-toast", name + " is disabled");
      return;
    }
    if (dlg.contains(e.target) && e.target.closest("[data-kind]")) {
      update();
    }
  });
  dlg.addEventListener("input", update);
  dlg.addEventListener("change", update);
  update();
})();
