const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE_ERROR] ${err.message}`));
  page.on('requestfailed', req => consoleLogs.push(`[REQ_FAILED] ${req.url()} - ${req.failure().errorText}`));

  console.log('Navigating to http://127.0.0.1:5173/simulation ...');
  try {
    await page.goto('http://127.0.0.1:5173/simulation', { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    console.log('Goto error:', e.message);
  }

  console.log('Current URL:', page.url());
  const errorElements = await page.$$eval('[class*="rose"], [class*="red"], [class*="error"]', els => els.map(e => e.innerText));
  console.log('Error-like elements:', errorElements.filter(t => t.trim().length > 0));

  // Let's check button text or loading state
  const button = await page.$('button:has-text("Run Simulation")');
  console.log('Run Simulation button present:', !!button);
  if (button) {
    console.log('Clicking Run Simulation...');
    await button.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: '../screenshots/diag_sim.png', fullPage: true });
  console.log('Console logs (total ' + consoleLogs.length + '):');
  consoleLogs.forEach(l => console.log('  ', l));

  await browser.close();
})();
