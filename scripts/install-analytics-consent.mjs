import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const excluded = new Set(['whatsapp-button.html']);

function collectHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    const relative = path.relative(root, fullPath).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'outputs', 'templates', 'tmp'].includes(entry.name)) return [];
      return collectHtml(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.html') && !excluded.has(relative) ? [fullPath] : [];
  });
}

const headSnippet = /\s*<!-- Google Tag Manager -->\s*<script>\(function\(w,d,s,l,i\)\{[\s\S]*?GTM-T3ZXMRHS'\);<\/script>\s*<!-- End Google Tag Manager -->\s*/g;
const bodySnippet = /\s*<!-- Google Tag Manager \(noscript\) -->\s*<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-T3ZXMRHS"[\s\S]*?<\/iframe><\/noscript>\s*<!-- End Google Tag Manager \(noscript\) -->\s*/g;

for (const file of collectHtml(root)) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(headSnippet, '\n');
  html = html.replace(bodySnippet, '\n');
  html = html.replace(/<script src="\/analytics-consent\.js"><\/script>\s*/g, '');
  html = html.replace(/<head>\s*/i, '<head>\n  <script src="/analytics-consent.js"></script>\n');
  fs.writeFileSync(file, html, 'utf8');
}
