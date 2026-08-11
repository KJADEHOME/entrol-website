const assert = require('node:assert/strict');
const test = require('node:test');
const readyStock = require('../ready-stock.js');

const product = {
  sku: 'TEST-001', name_en: 'Verified Test Product', category: 'Cat Toys', publish_status: 'Published',
  image_authorization: 'Authorized', stock_verified_at: '2026-08-10', price_usd: 10, moq: 5,
  verified_stock: 100, gross_weight_kg: 1.2, package_cm: { length: 40, width: 30, height: 20 }
};

test('only recently verified published products are public', () => {
  const visible = readyStock.filterPublished([product, { ...product, sku: 'OLD', stock_verified_at: '2026-07-01' }], new Date('2026-08-11T00:00:00Z'), 7);
  assert.deepEqual(visible.map((p) => p.sku), ['TEST-001']);
});

test('shipping uses the greater of gross and volumetric weight', () => {
  assert.equal(readyStock.volumetricWeight(product, 5000), 4.8);
  const quote = readyStock.estimateShipping([{ sku: 'TEST-001', quantity: 2 }], [product], {
    currency: 'USD', volumetric_divisor: 5000, first_weight_kg: 1, first_weight_fee: 20,
    additional_per_kg: 5, minimum_charge: 25
  });
  assert.equal(quote.amount, 63);
  assert.equal(quote.chargeable_weight_kg, 9.6);
});

test('missing freight rule returns To Be Quoted state', () => {
  assert.equal(readyStock.estimateShipping([{ sku: 'TEST-001', quantity: 1 }], [product], null), null);
});

test('intent summary includes reference and non-binding warning', () => {
  const summary = readyStock.buildIntentSummary('ENT-20260811-ABCD', [{ sku: 'TEST-001', quantity: 5 }], [product], null, { country: 'France', postal_code: '75001', method: 'Sea Pallet' });
  assert.match(summary, /ENT-20260811-ABCD/);
  assert.match(summary, /TEST-001/);
  assert.match(summary, /non-binding purchase intent/i);
});
