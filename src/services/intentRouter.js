const mathTool = require("./tools/mathTool");
const weatherTool = require("./tools/weatherTool");
const documentContext = require("./tools/documentContext");

// Try tool calling for math/weather, fall back to LLM
async function tryTools(content) {
  // Try math first (cheaper, instant)
  const mathResult = mathTool.solve(content);
  if (mathResult) {
    return {
      handled: true,
      tool: "math",
      response: `🧮 ${mathResult.formatted}`
    };
  }

  // Try weather
  const weatherResult = await weatherTool.getWeather(content);
  if (weatherResult) {
    if (weatherResult.error) {
      return {
        handled: true,
        tool: "weather",
        response: `🌤️ ${weatherResult.error}`
      };
    }
    return {
      handled: true,
      tool: "weather",
      response: `🌤️ ${weatherResult.formatted}`
    };
  }

  return { handled: false };
}

function buildSystemMessage(conversationId, useChainOfThought) {
  const parts = [];

  // Add chain-of-thought instruction if enabled
  if (useChainOfThought) {
    parts.push("Before answering, think step by step. Break down the problem, reason through it carefully, then give your final answer. Format your response as: 'Reasoning: [your step-by-step thinking]\\n\\nAnswer: [your final answer]'");
  }

  // Add document context if available
  const context = documentContext.getContext(conversationId);
  if (context) {
    parts.push(`The user has provided this context document. Use it to answer their questions:\n\n${context}`);
  }

  if (parts.length === 0) return null;
  return parts.join("\n\n");
}

module.exports = { tryTools, buildSystemMessage };