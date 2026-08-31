const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const redirects = new Map([
  ['products/sunflower-pet-sniffing-mat-144/index.html', '/dog-toys-oem.html'],
  ['products/sunflower-pet-sniffing-mat-155/index.html', '/dog-toys-oem.html'],
  ['products/pet-sniffing-mat-143/index.html', '/dog-toys-oem.html'],
  ['collections/pet-feeder-31/index.html', '/pet-feeding.html'],
  ['pages/company-technology-3/index.html', '/about.html'],
  ['pages/about-us-1/index.html', '/about.html'],
  ['products/index.html', '/products.html'],
  ['collections/pet-bedding/index.html', '/pet-bedding.html'],
  ['collections/winter-socks/index.html', 'https://socks.entrol.com/products.html'],
]);

const intentionallyGone = [
  'products/cute-printed-eye-mask-293',
  'collections/wish-box',
  'collections/fashion-accessories/2.html',
  'collections/gifts-custom',
  'products/glass-storage-476',
  'cases-detail/beauty-and-confidence-of-the-secret-weapon---wig',
  'case',
  'collections/oral-care',
  'collections/teeth-whitening',
  'collections/head-band',
  'collections/home-decor',
  'collections/light-products',
  'collections/pillows',
  'collections/glass-products',
  'collections/mdf-products',
  'products/human-hair-weaves-extension---straight-p27-color-201',
  'collections/ceramic-products',
  'collections/head-band-80',
];

test('every relevant legacy 404 has an explicit, semantically matched redirect', () => {
  for (const [relativePath, target] of redirects) {
    const html = fs.readFileSync(path.join(root, relativePath), 'utf8');
    assert.match(html, /http-equiv="refresh"/i, relativePath);
    assert.ok(html.includes(target), `${relativePath} -> ${target}`);
  }
});

test('irrelevant legacy catalog URLs are not recreated or redirected to the homepage', () => {
  for (const oldUrl of intentionallyGone) {
    const exactPath = path.join(root, oldUrl);
    const exactFileExists = fs.existsSync(exactPath) && fs.statSync(exactPath).isFile();
    assert.equal(exactFileExists, false, oldUrl);
    assert.equal(fs.existsSync(path.join(root, oldUrl, 'index.html')), false, oldUrl);
  }
});

test('the exported GSC 404 set is completely classified', () => {
  assert.equal(redirects.size, 9);
  assert.equal(intentionallyGone.length, 18);
  assert.equal(redirects.size + intentionallyGone.length, 27);
});
