import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const validator = require('../pet-project-validator.js');

const base = { product: 'Pet Apparel', pet_type: 'dog', pet_size: 'medium', pet_age: 'adult', material_preference: 'textile', intended_use: 'wearing', packaging_format: 'ecommerce', dimensions: 'back 40 cm', message: '' };
assert.equal(validator.assess(base).severity, 'green');

const risky = { ...base, intended_use: 'chewing' };
const red = validator.assess(risky);
assert.equal(red.severity, 'red');
assert.ok(red.risks.some((risk) => risk.code === 'chew-use-mismatch'));
assert.equal(validator.canProceed(red, false), false);
assert.equal(validator.canProceed(red, true), true);

const fixed = validator.applySafeFix(risky, red);
assert.equal(fixed.intended_use, 'wearing');
assert.equal(validator.assess(fixed).severity, 'green');
assert.notEqual(validator.fingerprint(risky), validator.fingerprint(fixed));

const medical = validator.assess({ ...base, message: 'Guaranteed therapeutic treatment' });
assert.equal(medical.severity, 'red');
assert.ok(medical.risks.some((risk) => risk.code === 'medical-claim'));

const incomplete = validator.assess({ ...base, pet_size: 'xl', dimensions: '', packaging_format: 'retail' });
assert.equal(incomplete.severity, 'amber');
assert.ok(incomplete.risks.length >= 2);

const summary = validator.summarize(base, validator.assess(base));
for (const fragment of ['Pet: dog', 'Size: medium', 'Material: textile', 'Risk: GREEN']) assert.ok(summary.includes(fragment));

for (let index = 0; index < 5000; index += 1) {
  const result = validator.assess(index % 2 ? risky : base);
  assert.ok(['green', 'amber', 'red'].includes(result.severity));
}

console.log('PET_PROJECT_VALIDATOR_PASS: rules, summary, safe fix and 5000-iteration stress test');
