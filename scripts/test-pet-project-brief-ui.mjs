import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const browserCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];
const executablePath = browserCandidates.find((candidate) => fs.existsSync(candidate));
assert.ok(executablePath, 'Chrome or Edge is required for the UI regression test');
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage();
await page.setContent(`<!doctype html><html><head></head><body>
  <form data-entrol-lead="true"><select name="product"><option>Pet Apparel</option></select><textarea name="message"></textarea><div class="submit-row"><button type="submit">Send</button></div></form>
</body></html>`);
await page.addStyleTag({ path: path.join(here, '..', 'styles.css') });
await page.addScriptTag({ path: path.join(here, '..', 'pet-project-validator.js') });
await page.addScriptTag({ path: path.join(here, '..', 'pet-project-brief.js') });

assert.equal(await page.locator('.pet-project-brief').count(), 1);
for (const [name, value] of Object.entries({ pet_type: 'dog', pet_size: 'medium', pet_age: 'adult', material_preference: 'textile', intended_use: 'wearing', packaging_format: 'ecommerce' })) {
  await page.selectOption(`[name="${name}"]`, value);
}
await page.fill('[name="dimensions"]', 'back 40 cm');
assert.equal(await page.locator('.pet-project-brief').getAttribute('data-risk'), 'green');
assert.equal(await page.locator('.pet-project-fix').isHidden(), true);
assert.match(await page.locator('[name="pet_project_summary"]').inputValue(), /Pet: dog[\s\S]*Risk: GREEN/);

await page.selectOption('[name="intended_use"]', 'chewing');
assert.equal(await page.locator('.pet-project-brief').getAttribute('data-risk'), 'red');
assert.equal(await page.locator('.pet-project-fix').isVisible(), true);
assert.equal(await page.locator('.pet-project-risk').getAttribute('tabindex'), '-1');
assert.equal(await page.evaluate(() => window.EntrolPetProjectBrief.canSubmit(document.querySelector('form'))), false);
await page.locator('.pet-risk-ack').evaluate((checkbox) => checkbox.click());
assert.equal(await page.locator('.pet-risk-ack').isChecked(), true);
assert.equal(await page.evaluate(() => window.EntrolPetProjectBrief.canSubmit(document.querySelector('form'))), true);
await page.fill('[name="dimensions"]', 'back 41 cm');
assert.equal(await page.locator('.pet-risk-ack').isChecked(), false, 'risk acknowledgment must reset when the combination changes');
await page.click('.pet-project-fix');
assert.equal(await page.locator('[name="intended_use"]').inputValue(), 'wearing');
assert.equal(await page.locator('.pet-project-brief').getAttribute('data-risk'), 'green');

await page.setViewportSize({ width: 375, height: 760 });
assert.equal(await page.locator('.pet-project-grid').evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length), 1);
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'mobile project brief must not create horizontal overflow');

await browser.close();
console.log('PET_PROJECT_BRIEF_UI_PASS: summary, safe fix, risk reset, submit gate and mobile layout');
