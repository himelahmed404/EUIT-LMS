/* Profile: redeem a coupon. The code is kept to capitals and digits as you type. Apply answers in the
   #pf-redeem-msg line (is-ok / is-err); a good code also offers "Use on installment 2". Runs after app.js,
   which shows the toast for any [data-toast] button, including the one added here. */
(function () {
  "use strict";

  var input = document.getElementById("pf-coupon");
  var msg = document.getElementById("pf-redeem-msg");
  if (!input || !msg) {
    return;
  }
  var form = input.closest("form");
  var slot = form.querySelector("[data-redeem-action]");

  function clean() {
    var c = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c !== input.value) {
      input.value = c;
    }
    return c;
  }
  function clearAction() {
    slot.textContent = "";
  }
  function say(text, ok) {
    msg.textContent = text;
    msg.classList.toggle("is-ok", ok);
    msg.classList.toggle("is-err", !ok);
  }
  function reset() {
    msg.textContent = "";
    msg.classList.remove("is-ok", "is-err");
    clearAction();
  }

  function apply(e) {
    if (e) {
      e.preventDefault();
    }
    var code = clean();
    clearAction();
    if (!code) {
      say("Type a coupon code first.", false);
      input.focus();
      return;
    }
    if (code === "PUJA15") {
      say("৳750 off installment 2. You pay ৳4,250 on 15 Nov.", true);
      var use = document.createElement("button");
      use.type = "button";
      use.className = "eit-btn eit-btn--secondary eit-btn--md";
      use.setAttribute("data-toast", "PUJA15 applied to installment 2");
      var label = document.createElement("span");
      label.className = "eit-btn__label";
      label.textContent = "Use on installment 2";
      use.appendChild(label);
      slot.appendChild(use);
    } else if (code === "WPLAUNCH") {
      say("WPLAUNCH has been used up.", false);
    } else if (code === "EID25") {
      say("EID25 ended on 15 Apr 2026.", false);
    } else if (/^[A-Z]+1\d\d$/.test(code) || code.indexOf("NUSRAT") === 0) {
      say("Referral codes are for new students. Share yours instead.", false);
    } else {
      say("We don't know that code. Check the spelling, or ask the office.", false);
    }
  }

  input.addEventListener("input", function () {
    clean();
    reset();
  });
  form.addEventListener("submit", apply);
})();
