// Builds one edition of the site into dist/. Each Vercel project sets EDITION.
//   nl      → Dutch page (/) + expat page (/en/)
//   bangkok → Bangkok page (/) + expat page without language switch (/netherlands/)
// Blocks wrapped in <!--nl-only--> … <!--/nl-only--> are removed from the Bangkok copy,
// so the Bangkok site never links to the Dutch-language page.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const edition = process.env.EDITION || 'nl';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
cpSync('shared/assets', 'dist/assets', { recursive: true });
cpSync('shared/images', 'dist/images', { recursive: true });

if (edition === 'nl') {
  cpSync('site/nl', 'dist', { recursive: true });
} else if (edition === 'bangkok') {
  cpSync('site/bangkok', 'dist', { recursive: true });
  const expat = readFileSync('site/nl/en/index.html', 'utf8')
    .replace(/\s*<!--nl-only-->[\s\S]*?<!--\/nl-only-->/g, '')
    .replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<meta name="robots" content="noindex">')
    .replace('<header class="hero">', `<header class="hero">
  <nav class="lang-switch" aria-label="Region">
    <a href="/"><span class="long">South East Asia</span><span class="short">South East Asia</span></a><span class="sep" aria-hidden="true">|</span><span aria-current="page"><span class="long">Europe</span><span class="short">Europe</span></span>
  </nav>`);
  mkdirSync('dist/netherlands', { recursive: true });
  writeFileSync('dist/netherlands/index.html', expat);
} else {
  throw new Error(`Unknown EDITION "${edition}" (expected "nl" or "bangkok")`);
}
console.log(`Built edition "${edition}" into dist/`);
