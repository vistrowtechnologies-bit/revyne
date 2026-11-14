// Tiny local preview server for the RevYne website. No dependencies.
//   node apps/website/dev-server.mjs [port]      (default 5176)
//
// Mirrors how Cloudflare Pages will serve the site:
//   /pricing  -> pricing/index.html   (clean URLs, trailing slash optional)
//   /r/<code> -> r/index.html         (the `_redirects` rewrite)
//   unknown   -> 404.html with status 404
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.argv[2] || process.env.PORT || 5176);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

// Files that exist for hosting/tooling only and are never served.
const hidden = /^\/(dev-server\.mjs|tools\/|_headers$|_redirects$|README\.md$)/;

async function isFile(p) {
  try { return (await stat(p)).isFile(); } catch { return false; }
}

async function resolve(pathname) {
  if (hidden.test(pathname)) return null;
  const safe = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  const abs = join(root, safe);
  if (!abs.startsWith(root.replace(/[/\\]$/, "") + sep) && abs !== root) return null;
  if (await isFile(abs)) return abs;
  if (await isFile(join(abs, "index.html"))) return join(abs, "index.html");
  if (await isFile(abs + ".html")) return abs + ".html";
  // `_redirects`: /r/*  /r/index.html  200
  if (/^\/r\/[^/]+\/?$/.test(pathname)) return join(root, "r", "index.html");
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  let file = await resolve(pathname);
  let status = 200;
  if (!file) { file = join(root, "404.html"); status = 404; }
  try {
    const body = await readFile(file);
    res.writeHead(status, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server error");
  }
  console.log(`${status} ${req.method} ${pathname}`);
}).listen(port, () => {
  console.log(`RevYne website on http://localhost:${port}`);
});
