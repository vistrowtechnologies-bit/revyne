// Small progressive enhancements. Every page works without this file.
(function () {
  var site = window.SITE || {};

  // Until the Play listing exists, buttons say "Get early access" and open an
  // email. Once site.config.js has playStoreUrl, they become "Get the app".
  if (site.playStoreUrl) {
    document.querySelectorAll("[data-play]").forEach(function (a) {
      a.href = site.playStoreUrl;
      a.rel = "noopener";
      a.childNodes.forEach(function (n) {
        if (n.nodeType === 3 && /early access/i.test(n.nodeValue)) n.nodeValue = "Get the app";
      });
    });
    document.querySelectorAll("[data-prelaunch]").forEach(function (el) { el.hidden = true; });
  }

  // Phone-only "Get early access" bar: shown after the hero, hidden near the
  // final call to action so two buttons never show at once.
  var bar = document.querySelector(".cta-bar");
  var hero = document.querySelector(".hero");
  var finalCta = document.querySelector(".cta-card");
  if (bar && hero && "IntersectionObserver" in window) {
    var heroVisible = true, ctaVisible = false;
    var update = function () { bar.classList.toggle("show", !heroVisible && !ctaVisible); };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; update(); }).observe(hero);
    if (finalCta) new IntersectionObserver(function (e) { ctaVisible = e[0].isIntersecting; update(); }).observe(finalCta);
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
