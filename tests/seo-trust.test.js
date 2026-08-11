const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

function read(file) { return fs.readFileSync(file, 'utf8'); }

test('homepage metadata leads with the Entrol brand', () => {
  const html = read('index.html');
  const title = html.match(/<title>(.*?)<\/title>/i)[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/i)[1];
  assert.match(title, /^Entrol \|/);
  assert.ok(title.length >= 30 && title.length <= 65);
  assert.ok(description.length >= 100 && description.length <= 165);
  assert.match(html, /instagram\.com\/wangyan_entrol/);
  assert.match(html, /tiktok\.com\/@yanwang837/);
});

test('custom 404 remains non-indexable and offers current recovery links', () => {
  const html = read('404.html');
  assert.match(html, /name="robots" content="noindex, follow"/);
  assert.match(html, /href="\/products\.html"/);
  assert.match(html, /Entrol-Pet-Products-Catalog-2026\.pdf/);
  assert.match(html, /href="\/contact\.html"/);
});

test('Ready Stock description stays within search snippet guidance', () => {
  const html = read('ready-stock.html');
  const description = html.match(/<meta name="description" content="([^"]+)"/i)[1];
  assert.ok(description.length >= 100 && description.length <= 165);
});
