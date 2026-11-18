// Applies `origin` from site.config.js everywhere a full URL is unavoidable
// (canonical / Open Graph tags, structured data, sitemap.xml, robots.txt, the
// review page's share card).
//   node apps/website/tools/apply-config.mjs
// It reads the origin currently used in index.html's canonical tag and swaps
// every occurrence of it for the new one, then re-syncs the review page.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));
const cfg = await readFile(join(root, "site.config.js"), "utf8");
const origin = cfg.match(/origin:\s*"([^"]+)"/)[1].replace(/\/$/, "");
const home = await readFile(join(root, "index.html"), "utf8");
const old = home.match(/<link rel="canonical" href="(https?:\/\/[^/"]+)/)[1];

async function files(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (["r", "review", "tools", "node_modules", ".vercel"].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await files(p));
    else if (/\.(html|xml|txt|webmanifest)$/.test(e.name)) out.push(p);
  }
  return out;
}

let changed = 0;
if (old !== origin) {
  for (const f of await files(root)) {
    const s = await readFile(f, "utf8");
    const t = s.split(old).join(origin);
    if (t !== s) { await writeFile(f, t); changed++; }
  }
}
execFileSync(process.execPath, [join(root, "tools", "sync-review-web.mjs")], { stdio: "inherit" });
console.log(`Origin ${old} -> ${origin}: ${changed} file(s) changed.`);
