/* Admin console: applies light or dark mode, and a collapsed sidebar, before the page paints,
   so neither flashes. The first visit follows the device setting; after that the choice made with
   the moon/sun button in the top bar (app.js) wins. Loaded in <head> without defer, on purpose. */
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
  if (theme !== "dark" && theme !== "light") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  root.setAttribute("data-theme", theme);
  if (nav === "mini") {
    root.setAttribute("data-nav", "mini");
  }
})();
