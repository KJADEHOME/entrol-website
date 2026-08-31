const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const source = fs.readFileSync('supabase/functions/entrol-submit-lead/index.ts', 'utf8');

test('lead scoring uses explicit commercial qualification signals and capped priorities', () => {
  assert.match(source, /function scoreLead\(lead: ScorableLead\)/);
  assert.match(source, /company provided/);
  assert.match(source, /product interest provided/);
  assert.match(source, /quantity at least 500/);
  assert.match(source, /commercial buying intent/);
  assert.match(source, /Math\.min\(score, 100\)/);
  assert.match(source, /cappedScore >= 65 \? "HOT" : cappedScore >= 35 \? "WARM" : "COLD"/);
});

test('consumer email services are not penalized', () => {
  assert.match(source, /freeEmailDomains = new Set/);
  assert.match(source, /"gmail\.com"/);
  assert.match(source, /!freeEmailDomains\.has\(emailDomain\)/);
  assert.doesNotMatch(source, /free email[^\n]*-/i);
});

test('score evidence is stored and included in internal notification and API response', () => {
  assert.match(source, /lead_score: leadScoring\.score/);
  assert.match(source, /lead_priority: leadScoring\.priority/);
  assert.match(source, /lead_score_reasons: leadScoring\.reasons/);
  assert.match(source, /Priority: \$\{leadScoring\.priority\}/);
  assert.match(source, /Lead score: \$\{leadScoring\.score\}\/100/);
  assert.match(source, /\[\$\{leadScoring\.priority\} \$\{leadScoring\.score\}\] \[\$\{site\.notificationLabel\}\]/);
});

test('scoring is advisory and does not change sales status or reject a lead', () => {
  assert.doesNotMatch(source, /sales_status/);
  assert.doesNotMatch(source, /leadScoring\.priority[^\n]*(return|reject|delete)/);
});
