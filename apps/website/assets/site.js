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

  // "See it in action" tabs: click or arrow keys swap the screenshot.
  var tabs = [].slice.call(document.querySelectorAll(".show-tab"));
  var caption = document.querySelector(".show-caption");
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    if (caption) caption.textContent = tab.querySelector(".show-desc").textContent;
    if (focus) tab.focus();
    // On phones the tabs are a sideways-scrolling row: centre the chosen one
    // (scroll the row only, never the page).
    var row = tab.parentElement;
    if (row.scrollWidth > row.clientWidth) {
      var t = tab.getBoundingClientRect(), r = row.getBoundingClientRect();
      row.scrollLeft += (t.left - r.left) - (r.width - t.width) / 2;
    }
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab, false); });
    tab.addEventListener("keydown", function (e) {
      var next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (e.key === "Home") next = -i;
      if (e.key === "End") next = tabs.length - 1 - i;
      if (next === undefined) return;
      e.preventDefault();
      selectTab(tabs[(i + next + tabs.length) % tabs.length], true);
    });
  });

  // Preload the other screenshots once the page has loaded, so switching tabs
  // never shows an empty phone.
  window.addEventListener("load", function () {
    document.querySelectorAll(".device img[loading]").forEach(function (img) { img.loading = "eager"; });
  });

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
