// Fails if the code uses a Material Symbols name that isn't in icon-names.txt
// (it would show as plain text, e.g. "TRAVEL_EXPLORE"). Run: npm run check-icons
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const url =
  'https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsRounded%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints';
const valid = new Set(
  (await (await fetch(url)).text())
    .split(/\r?\n/)
    .map((l) => l.split(' ')[0])
    .filter(Boolean),
);
const have = new Set(readFileSync('icon-names.txt', 'utf8').split(/\s+/).filter(Boolean));

const files = [];
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      if (!p.includes('reactbits')) walk(p);
    } else if (/\.tsx?$/.test(p)) files.push(p);
  }
};
walk('src');

const missing = new Set();
for (const f of files) {
  for (const m of readFileSync(f, 'utf8').matchAll(/['"`]([a-z][a-z0-9_]{1,40})['"`]/g)) {
    if (valid.has(m[1]) && !have.has(m[1])) missing.add(m[1]);
  }
}
if (missing.size) {
  console.error('Add these to icon-names.txt, then run npm run icons:\n  ' + [...missing].sort().join('\n  '));
  process.exit(1);
}
console.log(`OK: all ${have.size} icon names are in the font.`);
