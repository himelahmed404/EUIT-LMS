/* Announcements: the composer. It counts characters and SMS per person (160 per SMS, 70 when the text
   has ৳ or Bangla), shows the course or batch picker, works out who it goes to, and asks once more before
   sending. Edit and Duplicate on a record fill it in. Runs after app.js, which presses the buttons. */
(function () {
  "use strict";

  var dlg = document.getElementById("compose");
  if (!dlg) {
    return;
  }
  var ALL = 286;
  var MENTORS = 7;
  var title = dlg.querySelector("#cmp-title");
  var msg = dlg.querySelector("#cmp-msg");
  var course = dlg.querySelector("#cmp-course");
  var batch = dlg.querySelector("#cmp-batch");
  var date = dlg.querySelector("#cmp-date");
  var time = dlg.querySelector("#cmp-time");
  var heading = dlg.querySelector("#compose-title");
  var next = dlg.querySelector("[data-ann-next]");
  var send = dlg.querySelector("[data-ann-send]");

  function $all(sel) {
    return Array.prototype.slice.call(dlg.querySelectorAll(sel));
  }
  function pressed(attr) {
    var b = dlg.querySelector("[" + attr + '][aria-pressed="true"]');
    return b ? b.getAttribute(attr) : "";
  }
  function press(attr, value) {
    $all("[" + attr + "]").forEach(function (b) {
      var on = (" " + value + " ").indexOf(" " + b.getAttribute(attr) + " ") !== -1;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("is-on", on && b.classList.contains("eit-chip"));
    });
  }
  function channels() {
    return $all('[data-ch][aria-pressed="true"]').map(function (b) {
      return b.getAttribute("data-ch");
    });
  }
  function count(n, word) {
    return n.toLocaleString("en-IN") + " " + word + (n === 1 || word === "SMS" ? "" : "s");
  }
  function reach() {
    var aud = pressed("data-aud");
    var pick = aud === "course" ? course : aud === "batch" ? batch : null;
    if (pick) {
      return +pick.options[pick.selectedIndex].getAttribute("data-reach");
    }
    return aud === "mentors" ? MENTORS : ALL;
  }
  function smsEach(text) {
    var wide = /[^\x00-\x7f]/.test(text);
    var one = wide ? 70 : 160;
    var part = wide ? 67 : 153;
    return text.length <= one ? 1 : Math.ceil(text.length / part);
  }
  function whenText() {
    var d = new Date(date.value + "T" + (time.value || "00:00"));
    if (isNaN(d)) {
      return "the date you pick";
    }
    return (
      d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
      ", " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  }

  function update() {
    var aud = pressed("data-aud");
    var later = pressed("data-when") === "later";
    $all("[data-aud-for]").forEach(function (el) {
      el.hidden = el.getAttribute("data-aud-for") !== aud;
    });
    $all("[data-when-for]").forEach(function (el) {
      el.hidden = !later;
    });
    var ch = channels();
    var sms = ch.indexOf("sms") !== -1;
    var n = reach();
    var who = count(n, aud === "mentors" ? "mentor" : "student");
    var text = msg.value;
    var each = smsEach(text);
    var wide = /[^\x00-\x7f]/.test(text);
    var note = count(text.length, "character");
    if (sms) {
      note += " · " + each + " SMS per person" + (wide ? " (৳ or Bangla: 70 characters per SMS)" : "");
    }
    dlg.querySelector("[data-sms-note]").textContent = note;
    var how = ch
      .map(function (c) {
        return c === "sms" ? "SMS" : "In-app";
      })
      .join(" + ");
    dlg.querySelector("[data-ann-summary]").textContent =
      "Goes to " +
      who +
      (how ? " · " + how : " · pick at least one way to send it") +
      (sms && text ? " · " + count(n * each, "SMS") : "") +
      (later ? " · " + whenText() : "");
    next.disabled = !(title.value.trim() && text.trim() && ch.length);
    next.querySelector(".eit-btn__label").textContent = later ? "Review and schedule" : "Review and send";
    var subject = "“" + (title.value.trim() || "Untitled") + "”";
    dlg.querySelector("[data-ann-confirm]").textContent = later
      ? "Schedule " + subject + " for " + whenText() + ", to " + who + " by " + how + "?"
      : "Send " + subject + " now to " + who + " by " + how + "?";
    send.querySelector(".eit-btn__label").textContent = later ? "Schedule" : "Send now";
    send.setAttribute("data-toast", later ? "Scheduled for " + whenText() : "Sent to " + who);
  }

  function step(name) {
    $all("[data-step]").forEach(function (el) {
      el.hidden = el.getAttribute("data-step") !== name;
    });
    var focus = dlg.querySelector('[data-step="' + name + '"] ' + (name === "write" ? "input" : "[data-ann-send]"));
    if (focus) {
      focus.focus();
    }
  }

  // Opening the composer: blank, or filled from a record (Edit keeps it, Duplicate makes a new one).
  function open(from, copy) {
    var rec = from && document.getElementById(from);
    var aud = rec ? rec.getAttribute("data-rec-aud") : "all";
    var target = rec ? rec.getAttribute("data-rec-target") : "";
    title.value = rec ? rec.querySelector("h2").textContent.trim() : "";
    msg.value = rec ? rec.querySelector(".c-note").textContent.trim() : "";
    press("data-aud", aud);
    if (aud === "course" && target) {
      course.value = target;
    }
    if (aud === "batch" && target) {
      batch.value = target;
    }
    press("data-ch", rec ? rec.getAttribute("data-rec-ch") : "app sms");
    var scheduled = rec && !copy && rec.getAttribute("data-rec-status") === "scheduled";
    press("data-when", scheduled ? "later" : "now");
    if (scheduled) {
      date.value = rec.getAttribute("data-rec-date");
      time.value = rec.getAttribute("data-rec-time");
    }
    heading.textContent = rec && !copy ? "Edit announcement" : "New announcement";
    step("write");
    update();
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest('[data-open-dialog="compose"]');
    if (opener) {
      open(
        opener.getAttribute("data-ann-from") || opener.getAttribute("data-ann-copy"),
        opener.hasAttribute("data-ann-copy"),
      );
      return;
    }
    if (!dlg.contains(e.target)) {
      return;
    }
    if (e.target.closest("[data-ann-next]")) {
      update();
      step("confirm");
      return;
    }
    if (e.target.closest("[data-ann-back]")) {
      step("write");
      return;
    }
    if (e.target.closest("[data-aud], [data-ch], [data-when]")) {
      update();
    }
  });
  dlg.addEventListener("input", update);
  dlg.addEventListener("change", update);
  update();
})();
