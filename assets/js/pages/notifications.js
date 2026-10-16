/* Notifications page: filter by All / Unread and by type, keep the unread counts in step.
   Runs after app.js, which flips the pressed buttons and handles "Mark all as read". */
(function () {
  "use strict";

  var page = document.getElementById("notif-page");
  if (!page) {
    return;
  }
  var items = Array.prototype.slice.call(page.querySelectorAll(".nt-item"));
  var groups = Array.prototype.slice.call(page.querySelectorAll(".nt-group"));
  var empty = page.querySelector("[data-notif-empty]");

  function pressed(attr) {
    var on = page.querySelector("[" + attr + '][aria-pressed="true"]');
    return on ? on.getAttribute(attr) : "";
  }

  function update() {
    var show = pressed("data-notif-show") || "all";
    var type = pressed("data-notif-type");
    var visible = 0;
    items.forEach(function (li) {
      var ok =
        (show === "all" || li.classList.contains("is-unread")) && (!type || li.getAttribute("data-type") === type);
      li.hidden = !ok;
      if (ok) {
        visible += 1;
      }
    });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector(".nt-item:not([hidden])");
    });
    if (empty) {
      empty.hidden = visible !== 0;
    }
    var unread = page.querySelectorAll(".nt-item.is-unread").length;
    Array.prototype.forEach.call(document.querySelectorAll("[data-notif-count]"), function (c) {
      c.textContent = unread;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-notif-summary]"), function (c) {
      c.textContent = unread ? unread + " unread" : "All caught up";
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-notif-show], [data-notif-type]")) {
      update();
      return;
    }
    // Opening a notification marks it read.
    var link = e.target.closest(".nt-link");
    var li = link && link.closest(".nt-item");
    if (li && li.classList.contains("is-unread")) {
      li.classList.remove("is-unread");
      var dot = li.querySelector("[data-unread]");
      if (dot) {
        dot.remove();
      }
      update();
    }
  });
  document.addEventListener("eit:read", update);
  update();
})();
