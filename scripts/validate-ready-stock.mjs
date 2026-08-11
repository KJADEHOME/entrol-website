import fs from 'node:fs/promises';

const productPath = new URL('../data/ready-stock-products.json', import.meta.url);
const shippingPath = new URL('../data/shipping-rates.json', import.meta.url);
const productData = JSON.parse(await fs.readFile(productPath, 'utf8'));
const shippingData = JSON.parse(await fs.readFile(shippingPath, 'utf8'));
const errors = [];
const seen = new Set();

if (productData.schema_version !== 1) errors.push('Unsupported product schema_version');
if (!Array.isArray(productData.products)) errors.push('products must be an array');

for (const [index, product] of (productData.products || []).entries()) {
  const row = `products[${index}]`;
  const required = ['sku', 'name_en', 'category', 'supply_status', 'publish_status', 'image_authorization', 'stock_verified_at', 'price_usd', 'moq', 'verified_stock', 'gross_weight_kg', 'package_cm', 'lead_time_days', 'images'];
  for (const field of required) if (product[field] === undefined || product[field] === null || product[field] === '') errors.push(`${row}.${field} is required`);
  if (seen.has(product.sku)) errors.push(`${row}.sku is duplicated: ${product.sku}`);
  seen.add(product.sku);
  if (!product.images || !product.images.main || !Array.isArray(product.images.details) || product.images.details.length !== 3) errors.push(`${row}.images requires one main image and exactly three detail images`);
  if (!product.package_cm || !['length', 'width', 'height'].every((key) => Number(product.package_cm[key]) > 0)) errors.push(`${row}.package_cm requires positive length, width and height`);
  for (const field of ['price_usd', 'moq', 'verified_stock', 'gross_weight_kg', 'lead_time_days']) if (!(Number(product[field]) >= 0)) errors.push(`${row}.${field} must be a non-negative number`);
  if (product.publish_status === 'Published' && !['Authorized', 'Own Photo'].includes(product.image_authorization)) errors.push(`${row} cannot be Published without authorized images`);
}

if (shippingData.schema_version !== 1) errors.push('Unsupported shipping schema_version');
if (!Array.isArray(shippingData.rates)) errors.push('rates must be an array');
for (const [index, rate] of (shippingData.rates || []).entries()) {
  const row = `rates[${index}]`;
  for (const field of ['country_code', 'method', 'currency', 'minimum_charge', 'first_weight_kg', 'first_weight_fee', 'additional_per_kg', 'volumetric_divisor']) {
    if (rate[field] === undefined || rate[field] === null || rate[field] === '') errors.push(`${row}.${field} is required`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`READY_STOCK_DATA_VALID: ${productData.products.length} products, ${shippingData.rates.length} shipping rates`);
}
