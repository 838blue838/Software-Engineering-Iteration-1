const puppeteer = require('puppeteer');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Starting Puppeteer Demo...");

  
  await page.goto('http://localhost:3000');
  await page.evaluate(async () => {
    await fetch('/api/auth/reset-users', { method: 'POST' });
  });
  await sleep(1000);

  
  console.log("Signing up...");
  await page.goto('http://localhost:3000/signup');

  await page.type('input[name="username"]', 'demoUser');
  await page.type('input[name="password"]', 'DemoPass1');

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  
  console.log("Logging in...");
  await page.goto('http://localhost:3000/login');

  await page.type('input[name="username"]', 'demoUser');
  await page.type('input[name="password"]', 'DemoPass1');

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  
  console.log("Opening chat...");
  await page.goto('http://localhost:3000/chat');

  
  console.log("Creating new conversation...");
  await page.click('#newChatBtn');

  await page.waitForFunction(() => {
    return window.location.href.includes("id=");
  });

  
  console.log("Sending message to all LLMs...");
  await page.type('#messageInput', 'Tell me a fun fact about space.');
  await page.click('#sendBtn');

  
  console.log("Waiting for LLM responses...");
  await page.waitForFunction(() => {
    const responses = document.querySelectorAll('.message.assistant');
    return responses.length >= 3;
  }, { timeout: 35000 });

  console.log("Received responses from multiple LLMs");

  
  console.log("Opening history page...");
  await page.goto('http://localhost:3000/history');

  await page.waitForSelector('.history-card');

  
  console.log("Searching history...");
  await page.type('#historySearch', 'space');
  await page.click('#searchBtn');

  await sleep(2000);

  console.log("Search completed");

  
  console.log("Logging out...");

  const links = await page.$$('a, button');
  for (const link of links) {
    const text = await page.evaluate(el => el.textContent, link);
    if (text.includes('Logout')) {
      await link.click();
      break;
    }
  }

  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.toLowerCase().includes('logout') || text.toLowerCase().includes('confirm')) {
      await btn.click();
      break;
    }
  }

  await sleep(2000);

  console.log("✅ Demo complete!");

  await browser.close();
})();