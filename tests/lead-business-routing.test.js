const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const source = fs.readFileSync('supabase/functions/entrol-submit-lead/index.ts', 'utf8');
const migration = fs.readFileSync(
  'supabase/migrations/20260821090000_add_entrol_business_unit_routing.sql',
  'utf8',
);
const kjadehomeMigration = fs.readFileSync(
  'supabase/migrations/20260822155000_add_kjadehome_lead_routing.sql',
  'utf8',
);

test('business unit is selected from a server-owned Origin map', () => {
  assert.match(source, /const SITE_BY_ORIGIN/);
  assert.match(source, /"https:\/\/www\.entrol\.com"/);
  assert.match(source, /"https:\/\/entrol\.com"/);
  assert.match(source, /"https:\/\/socks\.entrol\.com"/);
  assert.match(source, /"https:\/\/www\.kjadehome\.com"/);
  assert.match(source, /"https:\/\/kjadehome\.com"/);
  assert.match(source, /const site = siteForOrigin\(origin\)/);
  assert.match(source, /business_unit: site\.businessUnit/);
  assert.match(source, /source_site: site\.sourceSite/);
  assert.doesNotMatch(source, /business_unit:\s*clean\(payload\./);
  assert.doesNotMatch(source, /source_site:\s*clean\(payload\./);
});

test('CORS reflects only an allowlisted Origin and does not use a fallback origin', () => {
  assert.match(source, /if \(siteForOrigin\(origin\)\) headers\["Access-Control-Allow-Origin"\] = origin/);
  assert.doesNotMatch(source, /Access-Control-Allow-Origin"[^\n]+\?[^\n]+:/);
  assert.match(source, /if \(!site\) return jsonResponse\(origin, \{ ok: false, error: "origin_not_allowed" \}, 403\)/);
});

test('pet and socks notification identities and customer replies remain separate', () => {
  assert.match(source, /notificationLabel: "Entrol Pet Lead"/);
  assert.match(source, /notificationLabel: "Entrol Socks Lead"/);
  assert.match(source, /A new Entrol pet-products website lead/);
  assert.match(source, /A new Entrol socks website lead/);
  assert.match(source, /ENTROL_SOCKS_NOTIFICATION_TO/);
  assert.match(source, /ENTROL_SOCKS_NOTIFICATION_FROM/);
  assert.match(source, /ENTROL_SOCKS_CUSTOMER_REPLY_FROM/);
  assert.match(source, /senderWithDisplayName\(defaultNotificationFrom, "Entrol Socks Leads"\)/);
  assert.match(source, /senderWithDisplayName\(notificationFrom, "Entrol Socks Team"\)/);
  assert.match(source, /function petCustomerReplyContent/);
  assert.match(source, /function socksCustomerReplyContent/);
  assert.match(source, /Thank you for contacting Entrol Socks/);
  assert.match(source, /sock type, material composition, size range/);
  assert.doesNotMatch(
    source.match(/function socksCustomerReplyContent[\s\S]+?function customerReplyContent/)?.[0] || '',
    /Pet Products Catalog|pet products catalog|cat tree/i,
  );
});

test('KJadeHome uses separate trusted routing, notification identity and customer reply', () => {
  assert.match(source, /businessUnit: "kjadehome"/);
  assert.match(source, /notificationLabel: "KJadeHome Lead"/);
  assert.match(source, /A new KJadeHome website lead/);
  assert.match(source, /function kjadehomeCustomerReplyContent/);
  assert.match(source, /Thank you for contacting KJadeHome/);
  assert.match(source, /senderWithDisplayName\(defaultNotificationFrom, "KJadeHome Leads"\)/);
  assert.match(source, /senderWithDisplayName\(notificationFrom, "KJadeHome Sourcing Team"\)/);
  const replyBlock = source.match(/function kjadehomeCustomerReplyContent[\s\S]+?function customerReplyContent/)?.[0] || '';
  assert.doesNotMatch(replyBlock, /Entrol Socks|Pet Products Catalog|cat tree/i);
});

test('database migration stores and exposes trusted routing fields', () => {
  assert.match(migration, /add column if not exists business_unit/);
  assert.match(migration, /add column if not exists source_site/);
  assert.match(migration, /check \(business_unit in \('pet_products', 'socks'\)\)/);
  assert.match(migration, /business_unit,\s+source_site\s+from public\.entrol_leads/);
  assert.match(migration, /revoke all on public\.entrol_lead_dashboard from anon, authenticated/);
  assert.match(kjadehomeMigration, /business_unit in \('pet_products', 'socks', 'kjadehome'\)/);
  assert.match(kjadehomeMigration, /'www\.kjadehome\.com', 'kjadehome\.com'/);
});
