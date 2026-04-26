const { Before, After, Given, When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const assert = require("node:assert/strict");
const puppeteer = require("puppeteer");

setDefaultTimeout(60 * 1000);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function clearAndType(page, selector, text) {
  await page.waitForSelector(selector);
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(selector, text);
}

async function waitForText(page, selector, text) {
  await page.waitForFunction(
    ({ selector, text }) => {
      const el = document.querySelector(selector);
      return el && el.innerText.includes(text);
    },
    {},
    { selector, text }
  );
}

Before(async function () {
  this.browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  this.page = await this.browser.newPage();
  await this.page.setViewport({ width: 1400, height: 900 });
});

After(async function () {
  if (this.browser) {
    await this.browser.close();
  }
});

Given("I am logged in as {string} with password {string}", async function (username, password) {
  await this.page.goto(BASE_URL, { waitUntil: "networkidle2" });

  await this.page.evaluate(async () => {
    await fetch("/api/auth/reset-users", { method: "POST" });
  });

  await this.page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle2" });

  await clearAndType(this.page, "#username", username);
  await clearAndType(this.page, "#password", password);

  await Promise.all([
    this.page.waitForNavigation({ waitUntil: "networkidle2" }),
    this.page.click('button[type="submit"]')
  ]);

  assert(this.page.url().includes("/dashboard"));
});

When("I open the chat page", async function () {
  await this.page.goto(`${BASE_URL}/chat`, { waitUntil: "networkidle2" });
  await this.page.waitForSelector("#messageInput");
});

When("I create a new conversation", async function () {
  await this.page.waitForSelector("#newChatBtn");
  await this.page.click("#newChatBtn");

  await this.page.waitForFunction(() => {
    return new URL(window.location.href).searchParams.get("id");
  });
});

Then("I should see the model selector", async function () {
  await this.page.waitForSelector("#modelSelector");
  await this.page.waitForFunction(() => {
    const select = document.querySelector("#modelSelector");
    return !!select && select.querySelectorAll("optgroup").length > 0;
  });
});

Then("the model selector should include provider labels", async function (dataTable) {
  const labels = await this.page.$$eval("#modelSelector optgroup", (groups) =>
    groups.map((g) => g.label)
  );

  for (const [expected] of dataTable.raw()) {
    assert(
      labels.some((label) => label.includes(expected)),
      `Expected a provider label containing "${expected}", but got: ${labels.join(", ")}`
    );
  }
});

When("I type {string} into the chat box", async function (text) {
  await clearAndType(this.page, "#messageInput", text);
});

When("I send the chat message", async function () {
  await this.page.click("#sendBtn");

  await this.page.waitForFunction(() => {
    const chat = document.querySelector("#chatWindow");
    const sendBtn = document.querySelector("#sendBtn");
    const thinkingRow = document.querySelector("#thinkingRow");
    return chat && sendBtn && !sendBtn.disabled && !thinkingRow && chat.innerText.length > 0;
  });
});

Then("the URL should contain {string}", async function (fragment) {
  await this.page.waitForFunction(
    (value) => window.location.href.includes(value),
    {},
    fragment
  );

  assert(this.page.url().includes(fragment));
});

Then("I should see {string} in the chat window", async function (text) {
  await waitForText(this.page, "#chatWindow", text);

  const chatText = await this.page.$eval("#chatWindow", (el) => el.innerText);
  assert(chatText.includes(text));
});

Then("I should see a conversation titled {string} in the sidebar", async function (title) {
  await waitForText(this.page, "#conversationList", title);

  const sidebarText = await this.page.$eval("#conversationList", (el) => el.innerText);
  assert(sidebarText.includes(title));
});

Then("I should not see a conversation titled {string} in the sidebar", async function (title) {
  await this.page.waitForFunction(
    (value) => {
      const list = document.querySelector("#conversationList");
      return list && !list.innerText.includes(value);
    },
    {},
    title
  );

  const sidebarText = await this.page.$eval("#conversationList", (el) => el.innerText);
  assert(!sidebarText.includes(title));
});

When("I rename the active conversation in the sidebar to {string}", async function (newTitle) {
  await this.page.waitForSelector(".conversation-item.active");
  this.page.once("dialog", async (dialog) => {
    assert.equal(dialog.type(), "prompt");
    await dialog.accept(newTitle);
  });

  await this.page.click(".conversation-item.active .conversation-action-btn");
  await waitForText(this.page, "#conversationList", newTitle);
});

When("I delete the active conversation from the sidebar", async function () {
  await this.page.waitForSelector(".conversation-item.active");

  this.page.once("dialog", async (dialog) => {
    assert.equal(dialog.type(), "confirm");
    await dialog.accept();
  });

  await this.page.click(".conversation-item.active .conversation-action-btn.danger");
  await this.page.waitForFunction(() => {
    const status = document.querySelector("#chatStatusBanner");
    return status && status.innerText.length > 0;
  });
});

Then("the chat title should be {string}", async function (title) {
  await waitForText(this.page, "#chatTitle", title);

  const chatTitle = await this.page.$eval("#chatTitle", (el) => el.innerText);
  assert.equal(chatTitle.trim(), title);
});

When("I open the history page", async function () {
  await this.page.goto(`${BASE_URL}/history`, { waitUntil: "networkidle2" });
  await this.page.waitForSelector("#historySearch");
});

When("I search history for {string}", async function (term) {
  await clearAndType(this.page, "#historySearch", term);
  await this.page.click("#searchBtn");
});

Then("I should see a history card containing {string}", async function (text) {
  await waitForText(this.page, "#historyGrid", text);

  const gridText = await this.page.$eval("#historyGrid", (el) => el.innerText);
  assert(gridText.includes(text));
});

Then("I should not see a history card containing {string}", async function (text) {
  await this.page.waitForFunction(
    (value) => {
      const grid = document.querySelector("#historyGrid");
      return grid && !grid.innerText.includes(value);
    },
    {},
    text
  );

  const gridText = await this.page.$eval("#historyGrid", (el) => el.innerText);
  assert(!gridText.includes(text));
});

When("I rename the first history conversation to {string}", async function (newTitle) {
  await this.page.waitForSelector(".history-card");

  this.page.once("dialog", async (dialog) => {
    assert.equal(dialog.type(), "prompt");
    await dialog.accept(newTitle);
  });

  await this.page.click(".history-card .history-action-btn");
  await waitForText(this.page, "#historyGrid", newTitle);
});

When("I delete the first history conversation", async function () {
  await this.page.waitForSelector(".history-card");

  const beforeCount = await this.page.$$eval(".history-card", (cards) => cards.length);

  this.page.once("dialog", async (dialog) => {
    assert.equal(dialog.type(), "confirm");
    await dialog.accept();
  });

  await this.page.click(".history-card .history-action-btn.danger");

  await this.page.waitForFunction(
    (count) => document.querySelectorAll(".history-card").length < count,
    {},
    beforeCount
  );
});