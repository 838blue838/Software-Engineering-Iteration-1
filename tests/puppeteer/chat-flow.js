const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);

  const username = `puppeteer_${Date.now()}`;
  const password = "Password1";
  const prompt = "Explain stacks in one sentence.";

  try {
    // Sign up
    await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle2" });
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click('button[type="submit"]')
    ]);

    // Go to chat
    if (await page.$('a[href="/chat"]')) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click('a[href="/chat"]')
      ]);
    } else {
      await page.goto("http://localhost:3000/chat", { waitUntil: "networkidle2" });
    }

    // Create a new conversation if button exists
    if (await page.$("#newChatBtn")) {
      await page.click("#newChatBtn");
      await page.waitForFunction(() => window.location.href.includes("/chat"));
    }

    // Send a prompt
    await page.waitForSelector("#messageInput");
    await page.type("#messageInput", prompt);

    await Promise.all([
      page.click("#sendBtn"),
      page.waitForFunction(
        () => document.querySelectorAll(".compare-card").length >= 3,
        { timeout: 120000 }
      )
    ]);

    const cardCount = await page.$$eval(".compare-card", els => els.length);
    if (cardCount < 3) {
      throw new Error(`Expected at least 3 response cards, got ${cardCount}`);
    }

    const cardTitles = await page.$$eval(".compare-card h3", els =>
      els.map(el => el.textContent.trim())
    );

    console.log("Puppeteer test passed.");
    console.log("Response cards found:", cardCount);
    console.log("Providers:", cardTitles.join(", "));

  } catch (error) {
    console.error("Puppeteer test failed:", error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();