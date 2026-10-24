const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE_ERROR] ${err.message}`));
  page.on('requestfailed', req => consoleLogs.push(`[REQ_FAILED] ${req.url()} - ${req.failure()?.errorText}`));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log(`[API_RES] ${res.status()} ${res.url()}`);
    }
  });

  console.log('Navigating to http://127.0.0.1:5173/simulation ...');
  try {
    await page.goto('http://127.0.0.1:5173/simulation', { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    console.log('Goto error:', e.message);
  }

  console.log('Current URL:', page.url());

  const button = await page.$('button:has-text("Run Simulation")');
  console.log('Run Simulation button present:', !!button);
  if (button) {
    console.log('Clicking Run Simulation...');
    await button.click();
    await page.waitForTimeout(3000);
  }

  const errorBanner = await page.$('.bg-rose-50');
  if (errorBanner) {
    console.log('Error banner text:', await errorBanner.innerText());
  } else {
    console.log('No error banner detected.');
  }

  await page.screenshot({ path: '../screenshots/diag_sim.png', fullPage: true });
  console.log('Console logs (total ' + consoleLogs.length + '):');
  consoleLogs.forEach(l => console.log('  ', l));

  await browser.close();
})();
