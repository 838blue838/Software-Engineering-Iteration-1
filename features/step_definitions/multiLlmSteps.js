const { Given, When, Then } = require("@cucumber/cucumber");
const assert = require("assert");
const chatService = require("../../src/services/chatService");

let providers = null;

Given("the user has access to the local chat providers", function () {
  providers = chatService.getAvailableProviders();
});

When("the user requests a comparison", function () {
  providers = providers.map((p) => p.id);
});

Then("the system should be configured to compare multiple local LLMs", function () {
  assert.ok(Array.isArray(providers));
  assert.ok(providers.includes("ollama"));
  assert.ok(providers.includes("localai"));
  assert.ok(providers.includes("llamacpp"));
});