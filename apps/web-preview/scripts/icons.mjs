// Rebuilds the two icon fonts in public/fonts with only the icons listed in
// icon-names.txt (Google Fonts icon_names subsetting): one outlined (FILL 0)
// and one filled (FILL 1). Subsets come back as static fonts, so the filled
// style needs its own file.
// Add a name to icon-names.txt when you use a new <Icon name="…" />, then: npm run icons
import { readFileSync, writeFileSync } from 'node:fs';

const names = [...new Set(readFileSync('icon-names.txt', 'utf8').split(/\s+/).filter(Boolean))].sort();
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36' };

async function subset(fill, file) {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,${fill},0&icon_names=${names.join(',')}&display=block`, { headers: UA })
  ).text();
  const url = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
  if (!url) throw new Error('Google Fonts did not return a font — check the icon names.\n' + css.slice(0, 300));
  const font = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(`public/fonts/${file}`, font);
  return font.length;
}

const outlined = await subset(0, 'material-symbols-rounded-subset.woff2');
const filled = await subset(1, 'material-symbols-rounded-filled-subset.woff2');
writeFileSync('icon-names.txt', names.join('\n') + '\n');
console.log(`${names.length} icons → ${(outlined / 1024).toFixed(1)} KB outlined + ${(filled / 1024).toFixed(1)} KB filled`);
