const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const source = fs.readFileSync('supabase/functions/entrol-submit-lead/index.ts', 'utf8');

test('customer acknowledgement uses the verified catalog and official reply channel', () => {
  assert.match(source, /https:\/\/www\.entrol\.com\/assets\/Entrol-Pet-Products-Catalog-2026\.pdf/);
  assert.match(source, /reply_to: notificationTo/);
  assert.match(source, /ENTROL_CUSTOMER_REPLY_FROM/);
  assert.match(source, /reply within one business day/);
});

test('auto reply does not promise unverified commercial terms', () => {
  assert.match(source, /confirm current availability, MOQ, pricing, production lead time and shipping options/);
  assert.match(source, /No price, stock level, production date or freight cost is confirmed/);
  assert.match(source, /Bulk purchasing and consolidated shipments are usually more economical/);
});

test('customer email is sent only when an email address and Resend configuration exist', () => {
  assert.match(source, /if \(!isQuarantined && resendApiKey && row\.email\)/);
  assert.match(source, /row\.email \? "not_configured" : "not_applicable"/);
});

test('quarantined submissions do not trigger internal or customer email', () => {
  assert.match(source, /const isQuarantined = leadScoring\.isSpam \|\| abuseAssessment\.quarantined/);
  assert.match(source, /if \(isQuarantined\)/);
  assert.match(source, /notificationStatus = "not_configured"/);
  assert.match(source, /customerReplyStatus = "not_applicable"/);
  assert.match(source, /customer_auto_reply_status: "suppressed_spam"/);
  assert.match(source, /else if \(resendApiKey\)/);
});

test('customer reply delivery evidence is stored separately from internal notification status', () => {
  assert.match(source, /customer_auto_reply_status/);
  assert.match(source, /customer_auto_reply_provider_id/);
  assert.match(source, /customer_reply_status: customerReplyStatus/);
});

test('tracked website forms no longer expose the legacy FormSubmit endpoint', () => {
  const files = fs.readdirSync('.').filter((name) => name.endsWith('.html'));
  for (const file of files) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /formsubmit\.co/i, file);
  }
  assert.doesNotMatch(fs.readFileSync('script.js', 'utf8'), /formsubmit\.co/i);
});
