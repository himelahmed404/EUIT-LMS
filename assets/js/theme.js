/* Applies light or dark mode before the page paints, so neither flashes. Light is the default; dark is
   used only after someone picks it with the moon/sun button in the top bar (app.js), which saves the
   choice. On console pages (admin and mentor) it also restores a collapsed sidebar. Loaded in <head>
   without defer, on purpose. */
(function () {
  var root = document.documentElement;
  var theme = null;
  var nav = null;
  try {
    theme = window.localStorage.getItem("eit-theme");
    nav = window.localStorage.getItem("eit-nav");
  } catch (e) {
    /* storage blocked: use the defaults */
  }
  root.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  if (nav === "mini" && root.classList.contains("is-console")) {
    root.setAttribute("data-nav", "mini");
  }
})();
