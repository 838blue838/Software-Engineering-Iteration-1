const mathTool = require("./tools/mathTool");
const weatherTool = require("./tools/weatherTool");
const documentContext = require("./tools/documentContext");

function isWeatherPrompt(content) {
  if (!content) return false;

  const text = content.toLowerCase().trim();

  return (
    /\bweather\b/.test(text) ||
    /\bforecast\b/.test(text) ||
    /\btemperature\b/.test(text) ||
    /\btemp\b/.test(text) ||
    /\brain\b/.test(text) ||
    /\bsnow\b/.test(text) ||
    /\bwind\b/.test(text) ||
    /\bhumidity\b/.test(text) ||
    /\bhot\b/.test(text) ||
    /\bcold\b/.test(text) ||
    /\bsunny\b/.test(text) ||
    /\bcloudy\b/.test(text) ||
    /\bstorm\b/.test(text)
  );
}

// Try tool calling for math/weather, fall back to LLM
async function tryTools(content) {
  // Force all weather-like prompts through the weather tool first
  if (isWeatherPrompt(content)) {
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

    return {
      handled: true,
      tool: "weather",
      response: "🌤️ I can help with weather, but I need a city or location. Try something like 'what's the weather in New Brunswick?'"
    };
  }

  // Try math next
  const mathResult = mathTool.solve(content);
  if (mathResult) {
    return {
      handled: true,
      tool: "math",
      response: `🧮 ${mathResult.formatted}`
    };
  }

  return { handled: false };
}

async function buildSystemMessage(conversationId, useChainOfThought) {
  const parts = [];

  if (useChainOfThought) {
    parts.push(
      "Before answering, think step by step. Break down the problem, reason through it carefully, then give your final answer. Format your response as: 'Reasoning: [your step-by-step thinking]\\n\\nAnswer: [your final answer]'"
    );
  }

  const context = await documentContext.getContext(conversationId);
  if (context) {
    parts.push(
      `The user has provided this context document. Use it only when it is relevant to the user's request. Do not use it to answer unrelated real-time questions like weather.\n\nContext document:\n\n${context}`
    );
  }

  if (parts.length === 0) return null;
  return parts.join("\n\n");
}

module.exports = { tryTools, buildSystemMessage };