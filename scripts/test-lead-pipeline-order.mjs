import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const submitStart = source.indexOf('async function entrolSubmitLead');
const fetchPosition = source.indexOf('await fetch(ENTROL_LEAD_API_URL', submitStart);
const responseGate = source.indexOf('if (!response.ok || !result.ok)', fetchPosition);
const successTrack = source.indexOf("entrolTrack(fields.submission_type === 'catalog' ? 'catalog_success' : 'inquiry_success'", responseGate);
const durableGate = source.indexOf('var storedLead = result.stored === true', responseGate);
const compatibilityGate = source.indexOf('EntrolPetProjectBrief.canSubmit(form)', submitStart);

assert.ok(submitStart >= 0 && compatibilityGate > submitStart && compatibilityGate < fetchPosition, 'compatibility gate must run before fetch');
assert.ok(fetchPosition > submitStart && responseGate > fetchPosition && durableGate > responseGate && successTrack > durableGate, 'success tracking must run only after an explicit stored=true response');
assert.equal((source.match(/gtag\('event', 'generate_lead'/g) || []).length, 1, 'generate_lead must have one controlled emission path');
assert.ok(source.includes("event: 'legacy_form_return'"));
assert.ok(source.includes("event: 'legacy_catalog_return'"));

console.log('LEAD_PIPELINE_ORDER_PASS: gate before storage; generate_lead only after explicit durable-storage evidence');
