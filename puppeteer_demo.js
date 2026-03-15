const puppeteer = require('puppeteer');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  // 1. Landing page
  console.log('Step 1: Visiting landing page...');
  await page.goto('http://localhost:3000');
  await sleep(1500);

  // 2. Click "Create Account" link
  console.log('Step 2: Clicking Create Account...');
  await page.click('a[href="/signup"]');
  await sleep(1000);

  // 3. Fill in signup form
  console.log('Step 3: Filling in signup form...');
  await page.type('input[name="username"]', 'puppeteerUser');
  await sleep(500);
  await page.type('input[name="password"]', 'testpass123');
  await sleep(500);

  // 4. Submit signup
  console.log('Step 4: Submitting signup...');
  await page.click('button[type="submit"]');
  await sleep(2000);
  console.log('After signup URL:', page.url());

  // 5. Go to login page
  console.log('Step 5: Going to login page...');
  await page.goto('http://localhost:3000/login');
  await sleep(1000);

  // 6. Fill in login form
  console.log('Step 6: Filling in login form...');
  await page.type('input[name="username"]', 'puppeteerUser');
  await sleep(500);
  await page.type('input[name="password"]', 'testpass123');
  await sleep(500);

  // 7. Submit login
  console.log('Step 7: Submitting login...');
  await page.click('button[type="submit"]');
  await sleep(2000);
  console.log('After login URL:', page.url());

  // 8. Logout
  console.log('Step 8: Logging out...');
  await page.evaluate(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
  });
  await page.goto('http://localhost:3000');
  await sleep(1500);

  console.log('✅ Demo complete!');
  await browser.close();
})();