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
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("in");
        io.unobserve(el);
        // Once risen in, drop the reveal classes so hover effects aren't delayed.
        var wait = 750 + (parseInt(el.style.getPropertyValue("--i"), 10) || 0) * 80;
        setTimeout(function () { el.classList.remove("pre", "in"); }, wait);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    // Cards in a group rise in one after another.
    var groups = ".steps, .grid, .promise-list, .chips, .faq, .topic-list, .belief-list, .soon-list, .show-tabs, .facts";
    document.querySelectorAll(groups).forEach(function (g) {
      [].forEach.call(g.children, function (c, i) {
        c.classList.add("reveal");
        c.style.setProperty("--i", String(Math.min(i, 8)));
      });
    });
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

  // Phone status bar takes the colour of the top edge of the visible screen,
  // read from the image itself, so it always blends in (any screen, any theme).
  function tintDevice(device) {
    var img = device.querySelector("img[data-screen]:not([hidden])");
    var bar = device.querySelector(".status-bar");
    var strip = device.querySelector(".nav-strip");
    if (!img || !bar) return;
    var apply = function () {
      try {
        var c = document.createElement("canvas");
        c.width = 4; c.height = 1;
        var ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, img.naturalWidth, 4, 0, 0, 4, 1);
        var d = ctx.getImageData(1, 0, 1, 1).data;
        bar.style.setProperty("--sb", "rgb(" + d[0] + "," + d[1] + "," + d[2] + ")");
        // ...and the strip under the app takes the colour of its bottom edge.
        ctx.drawImage(img, 0, img.naturalHeight - 4, img.naturalWidth, 4, 0, 0, 4, 1);
        var b = ctx.getImageData(1, 0, 1, 1).data;
        if (strip) strip.style.setProperty("--nb", "rgb(" + b[0] + "," + b[1] + "," + b[2] + ")");
      } catch (e) { bar.style.removeProperty("--sb"); }
    };
    if (img.complete && img.naturalWidth) apply(); else img.addEventListener("load", apply, { once: true });
  }
  function tintStatusBar() { document.querySelectorAll(".device").forEach(tintDevice); }
  window.__tintStatusBar = tintStatusBar; // used by the colour picker
  tintStatusBar();
  tabs.forEach(function (t) { t.addEventListener("click", tintStatusBar); t.addEventListener("keyup", tintStatusBar); });

  // Preload the other screenshots once the page has loaded, so switching tabs
  // never shows an empty phone.
  window.addEventListener("load", function () {
    document.querySelectorAll(".device img[loading]").forEach(function (img) { img.loading = "eager"; });
  });

  // App colour picker (hero). Recolours the site and swaps the phone images
  // to the same screens in that colour. Choice is remembered in this browser.
  var THEME_COLOURS = { royal: "#6334E2", ocean: "#2563EB", emerald: "#047857", coral: "#BE123C", midnight: "#1E293B" };
  // Themes whose phone images exist; others keep the Royal pictures.
  var THEME_IMAGES = { royal: true, ocean: true, emerald: true, coral: true, midnight: true };
  var swatches = [].slice.call(document.querySelectorAll(".theme-picker .sw"));

  function imagesFor(theme) { return THEME_IMAGES[theme] ? theme : "royal"; }

  function swapImages(theme) {
    var t = imagesFor(theme);
    // Hero picture: download and decode the new one first, then a quick
    // fade-out / swap / fade-in, so the phones are never left faded.
    var hero = document.querySelector("img[data-hero]");
    var shot = hero && hero.closest(".hero-shot");
    if (hero && hero.getAttribute("src").indexOf("/hero/" + t + "-") === -1) {
      var big = "/assets/hero/" + t + "-1200.webp";
      var set = "/assets/hero/" + t + "-600.webp 600w, " + big + " 1200w";
      var pre = new Image();
      pre.sizes = hero.sizes; pre.srcset = set; pre.src = big;
      var token = (swapImages.token = (swapImages.token || 0) + 1);
      var swap = function () {
        if (token !== swapImages.token) return; // a newer choice won
        if (shot) shot.classList.add("is-swapping");
        setTimeout(function () {
          hero.srcset = set; hero.src = big;
          var reveal = function () { if (shot && token === swapImages.token) shot.classList.remove("is-swapping"); };
          if (hero.complete && hero.naturalWidth) setTimeout(reveal, 30);
          else { hero.addEventListener("load", reveal, { once: true }); setTimeout(reveal, 1200); } // never leave it faded
        }, 200);
      };
      // Wait for the download (decode can be deferred in background tabs),
      // with a safety timeout so a slow network never blocks the switch.
      var fired = false;
      var go = function () { if (!fired) { fired = true; swap(); } };
      if (pre.complete && pre.naturalWidth) go();
      else { pre.onload = go; pre.onerror = go; setTimeout(go, 2500); }
    }
    // Showcase screenshots.
    document.querySelectorAll("img[data-screen]").forEach(function (img) {
      if (img.getAttribute("src").indexOf("/screens/" + t + "/") !== -1) return;
      var base = "/assets/screens/" + t + "/" + img.getAttribute("data-screen");
      img.srcset = base + "-390.webp 390w, " + base + "-780.webp 780w";
      img.src = base + "-780.webp";
    });
    if (window.__tintStatusBar) window.__tintStatusBar();
  }

  function setTheme(theme, save) {
    if (!THEME_COLOURS[theme]) theme = "royal";
    var root = document.documentElement;
    if (theme === "royal") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOURS[theme]);
    swatches.forEach(function (b) {
      var on = b.getAttribute("data-theme-id") === theme;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    swapImages(theme);
    if (save) { try { localStorage.setItem("revyne-theme", theme); } catch (e) { /* not saved */ } }
  }

  setTheme(document.documentElement.getAttribute("data-theme") || "royal", false);
  swatches.forEach(function (b, i) {
    b.addEventListener("click", function () { setTheme(b.getAttribute("data-theme-id"), true); });
    b.addEventListener("keydown", function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      var next = swatches[(i + d + swatches.length) % swatches.length];
      setTheme(next.getAttribute("data-theme-id"), true);
      next.focus();
    });
  });

  // Header gets a soft shadow once the page scrolls.
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
