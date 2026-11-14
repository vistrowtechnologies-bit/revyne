// Small progressive enhancements. Every page works without this file.
(function () {
  var site = window.SITE || {};

  // "Get the app" buttons point at the Play Store link from site.config.js.
  if (site.playStoreUrl) {
    document.querySelectorAll("[data-play]").forEach(function (a) {
      a.href = site.playStoreUrl;
    });
  }

  // Mobile menu.
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("open", !open);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("open");
      }
    });
  }

  // Mark the current page in the nav.
  var path = location.pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
  document.querySelectorAll(".site-nav a[href^='/']").forEach(function (a) {
    var href = a.getAttribute("href").replace(/\/$/, "") || "/";
    if (href === path) a.setAttribute("aria-current", "page");
  });

  // Fade-in on scroll (skipped when the user prefers reduced motion).
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("pre");
      io.observe(el);
    });
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
