const puppeteer = require("puppeteer");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 70,
    defaultViewport: null,
    args: ["--start-maximized"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 900 });
  page.setDefaultTimeout(120000);

  const username = `demoUser_${Date.now()}`;
  const password = "DemoPass1";

  async function step(label) {
    console.log(`\n${label}`);
    await sleep(700);
  }

  async function goto(path) {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle2" });
  }

  async function clearAndType(selector, text) {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type(selector, text);
  }

  async function waitForText(selector, text) {
    await page.waitForFunction(
      ({ selector, text }) => {
        const el = document.querySelector(selector);
        return el && el.innerText.includes(text);
      },
      {},
      { selector, text }
    );
  }

  async function selectGeminiFlash() {
    await page.waitForSelector("#modelSelector", { visible: true });

    await page.waitForFunction(() => {
      const selector = document.querySelector("#modelSelector");
      if (!selector) return false;

      const option = Array.from(selector.querySelectorAll("option"))
        .find(opt => opt.value === "gemini-2.5-flash");

      return option && !option.disabled;
    });

    await page.select("#modelSelector", "gemini-2.5-flash");

    const selectedModel = await page.$eval("#modelSelector", el => el.value);

    if (selectedModel !== "gemini-2.5-flash") {
      throw new Error(`Expected Gemini Flash to be selected, but got ${selectedModel}`);
    }

    console.log("Selected model: gemini-2.5-flash");
    await sleep(1200);
  }

  async function startNewChat() {
    await page.waitForSelector("#newChatBtn", { visible: true });
    await page.click("#newChatBtn");

    await page.waitForFunction(() => {
      return new URL(window.location.href).searchParams.get("id");
    });

    await page.waitForSelector("#messageInput", { visible: true });
    await sleep(1000);
  }

  async function sendChatMessage(message) {
    await page.waitForSelector("#messageInput", { visible: true });

    const beforeBotCount = await page.$$eval(".message-row-bot", els => els.length);

    await clearAndType("#messageInput", message);
    await sleep(700);
    await page.click("#sendBtn");

    console.log("Message sent. Waiting for response...");

    await page.waitForFunction(
      (previousBotCount) => {
        const sendBtn = document.querySelector("#sendBtn");
        const thinkingRow = document.querySelector("#thinkingRow");
        const botCount = document.querySelectorAll(".message-row-bot").length;

        return sendBtn && !sendBtn.disabled && !thinkingRow && botCount > previousBotCount;
      },
      {},
      beforeBotCount
    );

    await sleep(1500);
  }

  async function renameActiveConversation(newTitle) {
    await page.waitForSelector(".conversation-item.active", { visible: true });

    page.once("dialog", async dialog => {
      console.log("Rename dialog:", dialog.message());
      await dialog.accept(newTitle);
    });

    await page.click(".conversation-item.active .conversation-action-btn:not(.danger)");
    await waitForText("#conversationList", newTitle);
    await waitForText("#chatTitle", newTitle);
    await sleep(1200);
  }

  async function deleteActiveConversation() {
    await page.waitForSelector(".conversation-item.active", { visible: true });

    page.once("dialog", async dialog => {
      console.log("Delete dialog:", dialog.message());
      await dialog.accept();
    });

    await page.click(".conversation-item.active .conversation-action-btn.danger");

    await page.waitForFunction(() => {
      const status = document.querySelector("#chatStatusBanner");
      const list = document.querySelector("#conversationList");
      return status || list;
    });

    await sleep(1500);
  }

  async function stageContextText(text) {
    await page.waitForSelector("#contextBtn", { visible: true });
    await page.click("#contextBtn");

    await page.waitForSelector("#contextModal.active", { visible: true });
    await clearAndType("#contextText", text);
    await sleep(1000);

    await page.click("#contextSaveBtn");
    await sleep(1000);
  }

  try {
    await step("Step 0: Resetting local demo users...");
    await goto("/");
    await page.evaluate(async () => {
      await fetch("/api/auth/reset-users", { method: "POST" });
    });
    await sleep(1000);

    await step("Step 1: Opening landing page...");
    await goto("/");
    await page.waitForSelector("h1", { visible: true });

    await step("Step 2: Creating a new account...");
    await goto("/signup");
    await clearAndType('input[name="username"]', username);
    await clearAndType('input[name="password"]', password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click('button[type="submit"]')
    ]);

    console.log("After signup URL:", page.url());
    await sleep(1200);

    await step("Step 3: Logging in with the new account...");
    await goto("/login");
    await clearAndType('input[name="username"]', username);
    await clearAndType('input[name="password"]', password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click('button[type="submit"]')
    ]);

    console.log("After login URL:", page.url());
    await sleep(1200);

    await step("Step 4: Opening the chat page...");
    await goto("/chat");
    await page.waitForSelector("#newChatBtn", { visible: true });
    await page.waitForSelector("#modelSelector", { visible: true });

    await step("Step 5: Selecting Gemini 2.5 Flash from the model selector...");
    await selectGeminiFlash();

    await step("Step 6: Starting a new conversation...");
    await startNewChat();

    await step("Step 7: Demonstrating the math tool...");
    await sendChatMessage("calculate 24 * 7 + 3");
    await waitForText("#chatWindow", "171");

    await step("Step 8: Adding project context through the plus button...");
    await stageContextText(
      "Project context: This application is an LLM Web UI for comparing models, saving conversations, searching history, and using tools like math and weather."
    );

    await step("Step 9: Sending a real prompt through Gemini 2.5 Flash...");
    await sendChatMessage("Using the context I added, summarize what this project does in one short sentence.");

    await step("Step 10: Renaming the active conversation from the sidebar...");
    await renameActiveConversation("Final Presentation Demo");

    await step("Step 11: Creating a temporary conversation to demonstrate delete...");
    await startNewChat();

    await step("Step 12: Confirming Gemini 2.5 Flash is still selected...");
    await selectGeminiFlash();

    await step("Step 13: Sending a Gemini prompt in the temporary conversation...");
    await sendChatMessage("Write the phrase delete me from sidebar exactly once.");
    await waitForText("#conversationList", "Write the phrase delete me from sidebar exactly once.");

    await step("Step 14: Deleting the temporary conversation from the sidebar...");
    await deleteActiveConversation();

    await step("Step 15: Opening conversation history...");
    await goto("/history");
    await page.waitForSelector("#historySearch", { visible: true });
    await page.waitForSelector("#historyGrid", { visible: true });
    await sleep(1000);

    await step("Step 16: Searching history for the renamed conversation...");
    await clearAndType("#historySearch", "Final Presentation Demo");
    await page.click("#searchBtn");
    await waitForText("#historyGrid", "Final Presentation Demo");
    await sleep(1500);

    await step("Step 17: Reopening the conversation from history...");
    await page.click(".history-card .history-card-body");
    await page.waitForFunction(() => window.location.href.includes("/chat?id="));
    await waitForText("#chatTitle", "Final Presentation Demo");
    await sleep(1500);

    await step("Step 18: Returning to dashboard...");
    await goto("/dashboard");
    await page.waitForSelector("h1", { visible: true });
    await sleep(1200);

    await step("Step 19: Logging out...");
    await goto("/logout.html");
    await page.waitForSelector('button[type="submit"]', { visible: true });

    await Promise.all([
      page.waitForFunction(
        () =>
          window.location.href.includes("logout-success") ||
          window.location.href === "http://localhost:3000/" ||
          document.body.innerText.toLowerCase().includes("logout"),
        { timeout: 5000 }
      ).catch(() => {}),
      page.click('button[type="submit"]')
    ]);

    console.log("After logout URL:", page.url());

    console.log("\n✅ Final presentation demo complete.");
    await sleep(700);
    await browser.close();
  } catch (error) {
    console.error("❌ Puppeteer demo failed:", error.message);

    try {
      await page.screenshot({ path: "puppeteer_demo_failure.png", fullPage: true });
      console.error("Saved failure screenshot as puppeteer_demo_failure.png");
    } catch (screenshotError) {
      console.error("Could not save failure screenshot:", screenshotError.message);
    }

    await sleep(2000);
    await browser.close();
    process.exit(1);
  }
})();