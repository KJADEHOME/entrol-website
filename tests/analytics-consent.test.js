const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function collectHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    const relative = path.relative(root, fullPath).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'outputs', 'templates', 'tmp'].includes(entry.name)) return [];
      return collectHtml(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.html') && relative !== 'whatsapp-button.html' ? [fullPath] : [];
  });
}

test('every complete HTML page loads the consent controller exactly once', () => {
  for (const file of collectHtml(root)) {
    const html = fs.readFileSync(file, 'utf8');
    const matches = html.match(/<script src="\/analytics-consent\.js"><\/script>/g) || [];
    assert.equal(matches.length, 1, path.relative(root, file));
  }
});

test('legacy GTM container is removed to prevent duplicate or unconsented tags', () => {
  for (const file of collectHtml(root)) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /GTM-T3ZXMRHS|googletagmanager\.com\/gtm/);
  }
});

test('analytics code uses the configured GA4 property and keeps advertising denied', () => {
  const script = fs.readFileSync(path.join(root, 'analytics-consent.js'), 'utf8');
  assert.match(script, /G-ZRKTYL4X0L/);
  assert.match(script, /analytics_storage: analyticsState/);
  assert.match(script, /ad_storage: 'denied'/);
  assert.match(script, /ad_user_data: 'denied'/);
  assert.match(script, /ad_personalization: 'denied'/);
  assert.match(script, /ALLOWED_HOSTS/);
});

test('privacy policy discloses optional Google Analytics and preference controls', () => {
  const html = fs.readFileSync(path.join(root, 'privacy-policy.html'), 'utf8');
  assert.match(html, /Google Analytics 4/);
  assert.match(html, /only after you select/i);
  assert.match(html, /EntrolAnalyticsConsent\.showSettings/);
});
