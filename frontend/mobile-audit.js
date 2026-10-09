// Mobile screenshot audit for the Next.js site at localhost:3000
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'mobile-audit');
fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { name: 'home-portfolio', url: 'http://localhost:3000/' },
  { name: 'restaurant', url: 'http://localhost:3000/restaurant' },
  { name: 'customer-menu', url: 'http://localhost:3000/customer/menu' },
  { name: 'login', url: 'http://localhost:3000/login' },
  { name: 'register', url: 'http://localhost:3000/register' },
  { name: 'admin-dashboard', url: 'http://localhost:3000/admin/dashboard' },
  { name: 'cashier-tables', url: 'http://localhost:3000/cashier/tables' },
  { name: 'chef-kitchen', url: 'http://localhost:3000/chef/kitchen' },
  { name: 'user-orders', url: 'http://localhost:3000/user/orders' },
];

(async () => {
  const browser = await chromium.launch();
  const iPhone = devices['iPhone 12'];
  const ctx = await browser.newContext({
    ...iPhone,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      console.log(`[warn] ${p.name}: ${e.message.split('\n')[0]}`);
    }
    await page.waitForTimeout(1200);
    // Full page screenshot
    await page.screenshot({ path: path.join(OUT_DIR, `${p.name}-full.png`), fullPage: true });
    // Detect horizontal overflow
    const overflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      bodyScrollW: document.body ? document.body.scrollWidth : null,
    }));
    console.log(`${p.name}: scrollWidth=${overflow.scrollW} clientWidth=${overflow.clientW} overflowX=${overflow.scrollW > overflow.clientW + 1}`);
  }
  await browser.close();
  console.log('Done. Screenshots in', OUT_DIR);
})().catch(e => { console.error(e); process.exit(1); });
