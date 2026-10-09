// Viewport screenshots at multiple scroll positions for mobile audit
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'mobile-audit');
fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { name: 'home-portfolio', url: 'http://localhost:3000/', scrolls: [0, 844, 1688, 2532, 3376, 4220, 5064, 5908] },
  { name: 'restaurant', url: 'http://localhost:3000/restaurant', scrolls: [0, 844, 1688, 2532, 3376] },
  { name: 'customer-menu', url: 'http://localhost:3000/customer/menu', scrolls: [0, 844, 1688, 2532, 3376] },
  { name: 'login', url: 'http://localhost:3000/login', scrolls: [0] },
  { name: 'register', url: 'http://localhost:3000/register', scrolls: [0] },
  { name: 'admin-dashboard', url: 'http://localhost:3000/admin/dashboard', scrolls: [0, 844] },
  { name: 'cashier-tables', url: 'http://localhost:3000/cashier/tables', scrolls: [0] },
  { name: 'chef-kitchen', url: 'http://localhost:3000/chef/kitchen', scrolls: [0] },
  { name: 'user-orders', url: 'http://localhost:3000/user/orders', scrolls: [0] },
];

(async () => {
  const browser = await chromium.launch();
  const iPhone = devices['iPhone 12'];
  const ctx = await browser.newContext({ ...iPhone, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      console.log(`[warn] ${p.name}: ${e.message.split('\n')[0]}`);
    }
    await page.waitForTimeout(1000);
    for (const y of p.scrolls) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT_DIR, `${p.name}-vp-${y}.png`) });
    }
    console.log(`${p.name}: done (${p.scrolls.length} shots)`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
