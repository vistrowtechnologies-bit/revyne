// Applies `origin` from site.config.js to the few places that need a full URL
// (canonical / Open Graph tags, sitemap.xml, robots.txt).
//   node apps/website/tools/apply-config.mjs
// Finds whatever origin is currently in those files and swaps in the new one.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const cfg = await readFile(join(root, "site.config.js"), "utf8");
const origin = cfg.match(/origin:\s*"([^"]+)"/)[1].replace(/\/$/, "");

async function files(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (["r", "review", "tools", "node_modules"].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await files(p));
    else if (/\.(html|xml|txt)$/.test(e.name)) out.push(p);
  }
  return out;
}

const tag = /(<link rel="canonical" href="|<meta property="og:(?:url|image)" content="|<loc>|Sitemap: )(https?:\/\/[^/"<\s]+)/g;
let changed = 0;
for (const f of await files(root)) {
  const s = await readFile(f, "utf8");
  const t = s.replace(tag, (_, pre) => pre + origin);
  if (t !== s) { await writeFile(f, t); changed++; }
}
console.log(`Origin set to ${origin} in ${changed} file(s).`);
