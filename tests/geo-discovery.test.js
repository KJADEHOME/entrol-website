const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('robots policy explicitly permits search-oriented AI retrieval', () => {
  const robots = fs.readFileSync('robots.txt', 'utf8');
  assert.match(robots, /User-agent: OAI-SearchBot\s+Allow: \//);
  assert.match(robots, /User-agent: ChatGPT-User\s+Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/www\.entrol\.com\/sitemap\.xml/);
});

test('llms summary identifies the business and points to authoritative buyer pages', () => {
  const llms = fs.readFileSync('llms.txt', 'utf8');
  assert.match(llms, /^# Entrol/m);
  assert.match(llms, /Weihai Yuanchuang Import & Export Co\., Ltd\./);
  assert.match(llms, /https:\/\/www\.entrol\.com\/contact\.html/);
  assert.match(llms, /Entrol-Pet-Products-Catalog-2026\.pdf/);
  assert.match(llms, /quotation-dependent/);
  assert.doesNotMatch(llms, /guaranteed|best price|always in stock/i);
});
