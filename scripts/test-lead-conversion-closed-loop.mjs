import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const browserCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];
const executablePath = browserCandidates.find((candidate) => fs.existsSync(candidate));
assert.ok(executablePath, 'Chrome or Edge is required for the closed-loop regression test');

const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage();
page.on('pageerror', (error) => console.error('BROWSER_PAGE_ERROR:', error.message));
let apiResult = { status: 500, body: { ok: false, error: 'local_failure' } };

await page.route('**/*', async (route) => {
  const url = route.request().url();
  if (url.includes('/functions/v1/entrol-submit-lead')) {
    await route.fulfill({ status: apiResult.status, contentType: 'application/json', body: JSON.stringify(apiResult.body) });
    return;
  }
  if (url.endsWith('/script.js')) {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(root, 'script.js'), 'utf8') });
    return;
  }
  if (url.endsWith('/pet-project-validator.js')) {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(root, 'pet-project-validator.js'), 'utf8') });
    return;
  }
  if (url.endsWith('/pet-project-brief.js')) {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(root, 'pet-project-brief.js'), 'utf8') });
    return;
  }
  await route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: `<!doctype html><html><body>
      <nav class="nav"></nav>
      <form class="catalog-form" data-entrol-lead="true">
        <input name="name" value="Local Test">
        <input name="email" value="local-test@example.invalid">
        <input name="catalog_request" value="yes">
        <button type="submit">Send</button>
      </form>
      <script>window.dataLayer=[];window.__gtagCalls=[];window.gtag=(...args)=>window.__gtagCalls.push(args);window.plausible=()=>{};</script>
      <script src="/script.js"></script>
    </body></html>`
  });
});

await page.goto('https://www.entrol.com/local-conversion-test?sent=1');
await page.waitForLoadState('networkidle');
assert.equal(await page.evaluate(() => typeof entrolSubmitLead), 'function', 'lead script must load');

assert.equal(await page.evaluate(() => window.__gtagCalls.filter((call) => call[1] === 'generate_lead').length), 0, 'sent=1 must not create a conversion');

async function submitAndWait() {
  await page.evaluate(() => document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await page.waitForFunction(() => !document.querySelector('button[type="submit"]').disabled);
}

await submitAndWait();
assert.equal(await page.evaluate(() => window.__gtagCalls.filter((call) => call[1] === 'generate_lead').length), 0, 'failed storage must not create a conversion');

apiResult = { status: 200, body: { ok: true, stored: false, duplicate: true } };
await submitAndWait();
assert.equal(await page.evaluate(() => window.__gtagCalls.filter((call) => call[1] === 'generate_lead').length), 0, 'duplicate acknowledgment must not create a conversion');

apiResult = { status: 201, body: { ok: true, stored: true, lead_id: 'local-only' } };
await submitAndWait();
assert.equal(await page.evaluate(() => window.__gtagCalls.filter((call) => call[1] === 'generate_lead').length), 1, 'one stored lead must create exactly one conversion');

apiResult = { status: 201, body: { ok: true, duplicate: false, lead_id: 'legacy-api-storage-confirmation' } };
await submitAndWait();
assert.equal(await page.evaluate(() => window.__gtagCalls.filter((call) => call[1] === 'generate_lead').length), 2, 'legacy API storage evidence must remain compatible during backend rollout');

await browser.close();
console.log('LEAD_CONVERSION_CLOSED_LOOP_PASS: URL, failure and duplicate do not convert; explicit new or legacy storage evidence converts once');
