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
  assert.doesNotMatch(html, />Bestsellers</i);
  assert.match(html, /Featured Categories/);
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

test('category schema does not invent stock, prices, or customer reviews', () => {
  for (const file of ['cat-tree.html', 'pet-apparel.html', 'pet-bedding.html']) {
    const html = read(file);
    assert.doesNotMatch(html, /schema\.org\/InStock/);
    assert.doesNotMatch(html, /"(?:lowPrice|highPrice|offerCount|aggregateRating|reviewCount)"/);
  }
});

test('pet apparel explains buyer-nominated 3PL delivery without promising warehousing', () => {
  const html = read('pet-apparel.html');
  assert.match(html, /buyer-nominated 3PL or fulfillment warehouse/i);
  assert.match(html, /does not mean that warehousing or free storage is included/i);
  assert.match(html, /storage, fulfillment, international freight, duties and destination charges are confirmed separately/i);
});

test('cat tree pages have distinct search intents', () => {
  const catalog = read('cat-tree.html');
  const oem = read('cat-tree-oem.html');
  const manufacturing = read('cat-tree-manufacturer.html');

  assert.match(catalog, /<title>Wholesale Cat Trees &amp; Cat Furniture Catalog \| Entrol<\/title>/);
  assert.match(catalog, /<h1[^>]*>Wholesale Cat Trees &amp; Cat Furniture<\/h1>/);
  assert.doesNotMatch(catalog, /<title>[^<]*OEM Manufacturer/i);

  assert.match(oem, /<title>Custom Cat Tree OEM &amp; Private Label Supplier \| Entrol<\/title>/);
  assert.match(oem, /<h1[^>]*>Custom Cat Tree OEM &amp; Private Label Development<\/h1>/);

  assert.match(manufacturing, /<title>Cat Tree Manufacturing Process &amp; Quality Control \| Entrol<\/title>/);
  assert.match(manufacturing, /<h1>Cat Tree Manufacturing Process<br><em>&amp; Quality Control<\/em><\/h1>/);
});

test('pet bedding targets wholesale sourcing and asks for quote inputs', () => {
  const html = read('pet-bedding.html');
  assert.match(html, /<h1[^>]*>Wholesale Pet Beds &amp; Custom Bedding<\/h1>/);
  assert.match(html, /Information needed for an accurate pet bed quotation/);
  assert.match(html, /destination country and postal code/i);
  assert.match(html, /product-specific availability, sample plan, MOQ, unit price, lead time and freight options/i);
});

test('dog toys is a visible B2B category without fixed commercial promises', () => {
  const toys = read('dog-toys-oem.html');
  const products = read('products.html');
  const home = read('index.html');
  assert.match(toys, /<h1>Wholesale Dog Toys<br><em>&amp; Custom Pet Toy Sourcing<\/em><\/h1>/);
  assert.match(toys, /MOQ depends on the selected design, material, customization and packaging/i);
  assert.doesNotMatch(toys, /low MOQ 200pcs/i);
  assert.doesNotMatch(toys, /All toys tested to ASTM F963/i);
  assert.match(products, /href="dog-toys-oem\.html">Dog Toys<\/a>/);
  assert.match(home, /href="dog-toys-oem\.html">Dog Toys<\/a>/);
});

test('new sourcing categories are linked and keep commercial terms product-specific', () => {
  const products = read('products.html');
  for (const file of ['pet-feeding.html', 'pet-grooming.html', 'pet-travel.html']) {
    const html = read(file);
    assert.match(html, /Request .* Quote|Request .*Quote/i);
    assert.match(html, /confirmed by SKU|confirmed for each selected product|confirmed by selected design/i);
    assert.match(products, new RegExp(`href="${file.replace('.', '\\.')}"`));
  }
});
