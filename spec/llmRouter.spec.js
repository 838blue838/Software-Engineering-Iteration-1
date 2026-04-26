const llmRouter = require("../src/services/llm/llmRouter");

describe("llmRouter", () => {

  it("identifies OpenAI provider for gpt models", () => {
    expect(llmRouter.getProviderName("gpt-4o-mini")).toBe("openai");
    expect(llmRouter.getProviderName("gpt-4o")).toBe("openai");
    expect(llmRouter.getProviderName("gpt-3.5-turbo")).toBe("openai");
  });

  it("identifies Gemini provider for gemini models", () => {
    expect(llmRouter.getProviderName("gemini-2.5-flash")).toBe("gemini");
    expect(llmRouter.getProviderName("gemini-2.5-pro")).toBe("gemini");
  });

  it("identifies Claude provider for claude models", () => {
    expect(llmRouter.getProviderName("claude-opus-4-5")).toBe("claude");
    expect(llmRouter.getProviderName("claude-sonnet-4-5")).toBe("claude");
  });

  it("defaults to Ollama for local models", () => {
    expect(llmRouter.getProviderName("llama3.2")).toBe("ollama");
    expect(llmRouter.getProviderName("mistral")).toBe("ollama");
    expect(llmRouter.getProviderName("phi")).toBe("ollama");
  });

  it("defaults to Ollama when no model specified", () => {
    expect(llmRouter.getProviderName(null)).toBe("ollama");
    expect(llmRouter.getProviderName(undefined)).toBe("ollama");
    expect(llmRouter.getProviderName("")).toBe("ollama");
  });

  it("listAllModels returns all four providers", async () => {
    const models = await llmRouter.listAllModels();
    expect(models.ollama).toBeDefined();
    expect(models.openai).toBeDefined();
    expect(models.gemini).toBeDefined();
    expect(models.claude).toBeDefined();
  });

  it("listAllModels includes hardcoded cloud model lists", async () => {
    const models = await llmRouter.listAllModels();
    expect(models.openai.models).toContain("gpt-4o-mini");
    expect(models.gemini.models).toContain("gemini-2.5-flash");
    expect(models.claude.models).toContain("claude-sonnet-4-5");
  });

  it("marks providers as unavailable when API key is missing", async () => {
    const models = await llmRouter.listAllModels();
    // OpenAI and Claude have no keys set, should be unavailable
    if (!process.env.OPENAI_API_KEY) {
      expect(models.openai.available).toBe(false);
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      expect(models.claude.available).toBe(false);
    }
  });

});