// RevYne website config — the one place to change site-wide values.
//
// `origin` is the public domain. Pages use relative links, so it is only needed
// where a full URL is unavoidable (canonical / Open Graph tags, sitemap,
// robots.txt). After changing it, run:  node apps/website/tools/apply-config.mjs
// which rewrites those tags to the new origin.
window.SITE = {
  // Live address. Switch to "https://revyneai.com" once that domain resolves,
  // then run tools/apply-config.mjs.
  origin: "https://revyne-pied.vercel.app",
  // Empty until the Play listing is live: buttons say "Get early access" and
  // open an email. Paste the listing URL here and every button becomes
  // "Get the app" linking to it.
  // e.g. "https://play.google.com/store/apps/details?id=com.revyne.revyne_app"
  playStoreUrl: "",
  contactEmail: "hello@vistrow.com",
  company: "Vistrow Technologies",
};
