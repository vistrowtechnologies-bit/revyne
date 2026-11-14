// RevYne website config — the one place to change site-wide values.
//
// `origin` is the public domain. Pages use relative links, so it is only needed
// where a full URL is unavoidable (canonical / Open Graph tags, sitemap,
// robots.txt). After changing it, run:  node apps/website/tools/apply-config.mjs
// which rewrites those tags to the new origin.
window.SITE = {
  origin: "https://revyneai.com",
  // Placeholder until the app is live on Google Play.
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.revyne.revyne_app",
  contactEmail: "hello@vistrow.com",
  company: "Vistrow Technologies",
};
