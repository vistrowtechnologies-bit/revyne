// Rebuilds public/fonts/material-symbols-rounded-subset.woff2 with only the
// icons listed in icon-names.txt (Google Fonts icon_names subsetting).
// Add a name to icon-names.txt when you use a new <Icon name="…" />, then: npm run icons
import { readFileSync, writeFileSync } from 'node:fs';

const names = [...new Set(readFileSync('icon-names.txt', 'utf8').split(/\s+/).filter(Boolean))].sort();
const css = await (
  await fetch(
    `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${names.join(',')}&display=block`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36' } },
  )
).text();
const url = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
if (!url) throw new Error('Google Fonts did not return a font — check the icon names.\n' + css.slice(0, 300));
const font = Buffer.from(await (await fetch(url)).arrayBuffer());
writeFileSync('public/fonts/material-symbols-rounded-subset.woff2', font);
writeFileSync('icon-names.txt', names.join('\n') + '\n');
console.log(`${names.length} icons → ${(font.length / 1024).toFixed(1)} KB`);
