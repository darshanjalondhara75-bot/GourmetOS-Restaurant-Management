// Panel layout audit: navbar overlap + page heading width (mobile & desktop)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'mobile-audit', 'panels');
fs.mkdirSync(OUT, { recursive: true });

const ACCOUNTS = {
  admin: { email: 'admin@restaurant.com', pass: 'admin123' },
  cashier: { email: 'cashier@restaurant.com', pass: 'cashier123' },
  chef: { email: 'chef@restaurant.com', pass: 'chef123' },
};

const GROUPS = [
  ['admin', [
    ['admin-dashboard', '/admin/dashboard'],
    ['admin-users', '/admin/users'],
    ['admin-orders', '/admin/orders'],
    ['admin-shifts', '/admin/shifts'],
    ['admin-tables', '/admin/tables'],
    ['admin-reports', '/admin/reports'],
    ['admin-inventory', '/admin/inventory'],
  ]],
  ['cashier', [
    ['cashier-tables', '/cashier/tables'],
    ['cashier-orders', '/cashier/orders'],
    ['cashier-payments', '/cashier/payments'],
  ]],
  ['chef', [
    ['chef-kitchen', '/chef/kitchen'],
    ['chef-inventory', '/chef/inventory'],
  ]],
];

const PROBE = () => {
  const nav = document.querySelector('header');
  const navBox = nav ? nav.getBoundingClientRect() : null;
  const navH = navBox ? Math.round(navBox.bottom) : 0;
  const main = document.querySelector('main');
  const mainBox = main ? main.getBoundingClientRect() : null;
  const h1 = document.querySelector('main h1') || document.querySelector('h1');
  const h1Box = h1 ? h1.getBoundingClientRect() : null;
  // walk up to the header card (parent with a border/background)
  let card = h1 ? h1.parentElement : null;
  while (card && card !== document.body) {
    const cs = getComputedStyle(card);
    if (cs.borderTopWidth !== '0px' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)') break;
    card = card.parentElement;
  }
  const cardBox = card && card.getBoundingClientRect ? card.getBoundingClientRect() : null;
  const cs = h1 ? getComputedStyle(h1) : null;
  const h1Parent = h1 ? h1.parentElement : null;
  const hpBox = h1Parent ? h1Parent.getBoundingClientRect() : null;
  return {
    vw: window.innerWidth,
    navH,
    mainTop: mainBox ? Math.round(mainBox.top) : null,
    overlap: mainBox ? Math.round(navH - mainBox.top) : null,
    h1Text: h1 ? h1.textContent.trim().slice(0, 60) : null,
    h1Top: h1Box ? Math.round(h1Box.top) : null,
    h1H: h1Box ? Math.round(h1Box.height) : null,
    h1W: h1Box ? Math.round(h1Box.width) : null,
    h1ParentW: hpBox ? Math.round(hpBox.width) : null,
    h1FS: cs ? cs.fontSize : null,
    cardW: cardBox ? Math.round(cardBox.width) : null,
    mainW: mainBox ? Math.round(mainBox.width) : null,
    docW: document.documentElement.scrollWidth,
  };
};

(async () => {
  const browser = await chromium.launch();

  for (const [label, vp] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
    for (const [role, pages] of GROUPS) {
      const creds = ACCOUNTS[role];
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
      const page = await ctx.newPage();

      await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      await page.fill('#login-email', creds.email);
      await page.fill('#login-password', creds.pass);
      await Promise.all([
        page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 20000 }).catch(() => {}),
        page.click('button:has-text("Sign In")').catch(() => {}),
      ]);
      await page.waitForTimeout(2500);
      console.log(`${label}/${role}: -> ${page.url()}`);

      for (const [name, url] of pages) {
        try {
          await page.goto('http://localhost:3000' + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
          console.log(`[warn] ${name}: ${e.message.split('\n')[0]}`);
        }
        await page.waitForTimeout(3000);
        const probe = await page.evaluate(PROBE);
        console.log(
          `  ${label.padEnd(7)} ${name.padEnd(20)} nav=${String(probe.navH).padStart(3)} mainTop=${String(probe.mainTop).padStart(4)} ` +
          `overlap=${String(probe.overlap).padStart(4)} h1Top=${String(probe.h1Top).padStart(4)} h1W=${String(probe.h1W).padStart(4)}/${probe.mainW} ` +
          `cardW=${probe.cardW} h1H=${probe.h1H} ${probe.h1FS} "${probe.h1Text}"`
        );
        await page.screenshot({ path: path.join(OUT, `${label}-${name}.png`) });
      }
      await ctx.close();
    }
  }

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
