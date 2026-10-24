const { chromium } = require('../frontend/node_modules/playwright');
const path = require('path');
const fs = require('fs');

async function verify() {
  console.log('[1/4] Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  [BROWSER ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.log(`  [PAGE ERROR] ${err.message}`);
  });

  const reportsDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 1. Verify Simulation Page with Mitigation Panel
  console.log('[2/4] Verifying /simulation page with Prescriptive Mitigation...');
  await page.goto('http://127.0.0.1:5173/simulation?delay=20&station=ADH&time=2026-08-03T08:00:00', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Wait for mitigation panel
  await page.waitForSelector('text=AI Incident Dispatcher & Mitigation Engine', { timeout: 15000 });
  console.log('  ✓ Prescriptive Incident Mitigation header found');

  // Verify plan tabs
  await page.waitForSelector('text=Tactical Relief Rake Injection');
  await page.waitForSelector('text=FOB Gate Inflow Metering');
  await page.waitForSelector('text=Dynamic Semi-Fast Skip-Stop');
  console.log('  ✓ All 3 mitigation strategies found');

  // Verify Stampede Defense badge / Fruin LOS
  await page.waitForSelector('text=Fruin Pedestrian Platform Safety Index');
  console.log('  ✓ Fruin LOS metric scale verified');

  // Click on "Deploy Plan & Re-Simulate" button
  const deployBtn = await page.locator('button:has-text("Deploy Plan & Re-Simulate")');
  if (await deployBtn.isVisible()) {
    console.log('  ✓ Clicking "Deploy Plan & Re-Simulate" button...');
    await deployBtn.click();
    await page.waitForTimeout(1500);
  }

  // Take screenshot of Simulation with Mitigation
  const simScreenshotPath = path.join(reportsDir, 'simulation_with_mitigation.png');
  await page.screenshot({ path: simScreenshotPath, fullPage: false });
  console.log(`  ✓ Saved screenshot to ${simScreenshotPath}`);

  // 2. Verify Platform Vision CCTV Page
  console.log('[3/4] Verifying /cctv Platform CCTV AI Vision...');
  await page.goto('http://127.0.0.1:5173/cctv', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForSelector('text=Platform Computer Vision & Crowd Telemetry', { timeout: 15000 });
  console.log('  ✓ CCTV Vision header found');

  // Wait for canvas
  await page.waitForSelector('canvas', { timeout: 10000 });
  console.log('  ✓ HTML5 platform canvas found');

  // Check camera telemetry badges
  await page.waitForSelector('text=YOLOv8 Edge TPU');
  await page.waitForSelector('text=Real-Time Headcount');
  await page.waitForSelector('text=Pedestrian Safety Index');
  console.log('  ✓ Edge CV telemetry strips verified');

  // Switch camera to Borivali
  const selectElem = await page.locator('select');
  if (await selectElem.isVisible()) {
    await selectElem.selectOption('BVI');
    await page.waitForTimeout(500);
    console.log('  ✓ Switched camera to Borivali (BVI)');
  }

  // Take screenshot of CCTV page
  const cctvScreenshotPath = path.join(reportsDir, 'platform_cctv_ai.png');
  await page.screenshot({ path: cctvScreenshotPath, fullPage: false });
  console.log(`  ✓ Saved screenshot to ${cctvScreenshotPath}`);

  // 3. Verify Overview Page and Weather Radar Pill
  console.log('[4/4] Verifying TopBar weather radar telemetry on / ...');
  await page.goto('http://127.0.0.1:5173/', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForSelector('text=Santacruz Radar', { timeout: 10000 });
  console.log('  ✓ Live Santacruz Doppler radar pill active in TopBar');

  await browser.close();
  console.log('\n[SUCCESS] All UI and edge telemetry features verified successfully!');
}

verify().catch(err => {
  console.error('[FAILED] Verification error:', err);
  process.exit(1);
});
