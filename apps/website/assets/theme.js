// Runs in <head> before the page draws, so a saved app colour shows straight
// away instead of flashing violet first. The picker lives in site.js.
(function () {
  var t = null;
  try { t = localStorage.getItem("revyne-theme"); } catch (e) { /* storage blocked */ }
  if (!t || !/^(ocean|emerald|coral|midnight)$/.test(t)) return;
  var root = document.documentElement;
  root.setAttribute("data-theme", t);

  // Point the phone pictures at the saved colour as the parser creates them,
  // so returning visitors never see the Royal ones first.
  function retarget(img) {
    if (img.hasAttribute("data-hero")) {
      img.srcset = "/assets/hero/" + t + "-720.webp 720w, /assets/hero/" + t + "-1448.webp 1448w";
      img.src = "/assets/hero/" + t + "-1448.webp";
    } else if (img.hasAttribute("data-screen")) {
      var base = "/assets/screens/" + t + "/" + img.getAttribute("data-screen");
      img.srcset = base + "-390.webp 390w, " + base + "-780.webp 780w";
      img.src = base + "-780.webp";
    }
  }
  if (!("MutationObserver" in window)) return;
  var mo = new MutationObserver(function (list) {
    list.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        if (n.tagName === "IMG") retarget(n);
        else if (n.querySelectorAll) n.querySelectorAll("img[data-hero], img[data-screen]").forEach(retarget);
      });
    });
  });
  mo.observe(root, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", function () { mo.disconnect(); });
})();
