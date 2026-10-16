const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('response', r => { if (r.status() >= 400) console.log('[http]', r.status(), r.url()); });
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.fill('#login-email', 'admin@restaurant.com');
  await page.fill('#login-password', 'admin123');
  await Promise.all([
    page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 15000 }).catch(e => console.log('[nav timeout]', e.message)),
    page.click('button:has-text("Sign In")'),
  ]);
  await page.waitForTimeout(3000);
  console.log('url after login:', page.url());
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
