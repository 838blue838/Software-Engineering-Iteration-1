const puppeteer = require('puppeteer');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 80 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 0. Reset users so demo runs fresh
  await page.goto('http://localhost:3000');
  await page.evaluate(async () => {
    await fetch('/api/auth/reset-users', { method: 'POST' });
  });
  await sleep(1000);

  // 1. Landing page
  console.log('Step 1: Visiting landing page...');
  await page.goto('http://localhost:3000');
  await sleep(1500);

  // 2. Go to signup
  console.log('Step 2: Going to signup page...');
  await page.goto('http://localhost:3000/signup');
  await sleep(1000);

  // 3. Fill in signup form
  console.log('Step 3: Signing up...');
  await page.type('input[name="username"]', 'demoUser');
  await sleep(500);
  await page.type('input[name="password"]', 'DemoPass1');
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
  console.log('Step 6: Logging in...');
  await page.type('input[name="username"]', 'demoUser');
  await sleep(500);
  await page.type('input[name="password"]', 'DemoPass1');
  await sleep(500);

  // 7. Submit login
  console.log('Step 7: Submitting login...');
  await page.click('button[type="submit"]');
  await sleep(2000);
  console.log('After login URL:', page.url());

  // 8. Go to chat page
  console.log('Step 8: Going to chat page...');
  await page.goto('http://localhost:3000/chat');
  await sleep(2000);

  // 9. Click New Chat button
  console.log('Step 9: Starting new chat...');
  await page.click('#newChatBtn');
  await sleep(2000);

  // 10. Type and send a message
  console.log('Step 10: Typing a chat message...');
  await page.click('#messageInput');
  await page.type('#messageInput', 'Hello! Can you tell me a fun fact?');
  await sleep(1000);
  await page.click('#sendBtn');
  console.log('Message sent! Waiting for LLM response...');
  await sleep(15000);

  // 11. Go to history page
  console.log('Step 11: Viewing conversation history...');
  await page.goto('http://localhost:3000/history');
  await sleep(2000);

  // 12. Search in history
  console.log('Step 12: Searching conversation history...');
  await page.click('#historySearch');
  await page.type('#historySearch', 'fun fact');
  await sleep(1000);
  await page.click('#searchBtn');
  await sleep(2000);

  // 13. Go to dashboard
  console.log('Step 13: Going to dashboard...');
  await page.goto('http://localhost:3000/dashboard');
  await sleep(1500);

  // 14. Click logout
  console.log('Step 14: Clicking logout...');
  const links = await page.$$('a, button');
  for (const link of links) {
    const text = await page.evaluate(el => el.textContent, link);
    if (text.includes('Logout')) {
      await link.click();
      break;
    }
  }
  await sleep(2000);

  // 15. Confirm logout
  console.log('Step 15: Confirming logout...');
  await page.click('button[type="submit"]');
  await sleep(2000);
  console.log('After logout URL:', page.url());

  console.log('✅ Demo complete!');
  await sleep(2000);
  await browser.close();
})();