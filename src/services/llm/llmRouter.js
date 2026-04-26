const ollamaProvider = require("./ollamaProvider");
const openaiProvider = require("./openaiProvider");
const geminiProvider = require("./geminiProvider");
const claudeProvider = require("./claudeProvider");

const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "llama3.2";

function getProvider(model) {
  if (!model) return ollamaProvider;
  if (model.startsWith("gpt-")) return openaiProvider;
  if (model.startsWith("gemini-")) return geminiProvider;
  if (model.startsWith("claude-")) return claudeProvider;
  return ollamaProvider; // default to local Ollama for everything else
}

function getProviderName(model) {
  if (!model) return "ollama";
  if (model.startsWith("gpt-")) return "openai";
  if (model.startsWith("gemini-")) return "gemini";
  if (model.startsWith("claude-")) return "claude";
  return "ollama";
}

async function chat(model, messages) {
  const selectedModel = model || DEFAULT_MODEL;
  const provider = getProvider(selectedModel);
  return await provider.chat(selectedModel, messages);
}

async function listAllModels() {
  const ollamaModels = await ollamaProvider.listModels();

  return {
    ollama: {
      name: "Ollama (Local)",
      available: ollamaModels.length > 0,
      models: ollamaModels
    },
    openai: {
      name: "OpenAI",
      available: openaiProvider.isAvailable(),
      models: openaiProvider.listModels()
    },
    gemini: {
      name: "Google Gemini",
      available: geminiProvider.isAvailable(),
      models: geminiProvider.listModels()
    },
    claude: {
      name: "Anthropic Claude",
      available: claudeProvider.isAvailable(),
      models: claudeProvider.listModels()
    }
  };
}

module.exports = { chat, listAllModels, getProviderName, DEFAULT_MODEL };