const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";

function isAvailable() {
  return !!ANTHROPIC_API_KEY && ANTHROPIC_API_KEY.length > 0;
}

async function chat(model, messages) {
  if (!isAvailable()) {
    throw new Error("Claude API key not configured. Add ANTHROPIC_API_KEY to your .env file.");
  }

  // Claude separates system messages from user/assistant messages
  const systemMessages = messages.filter(m => m.role === "system").map(m => m.content).join("\n");
  const conversationMessages = messages.filter(m => m.role !== "system");

  const body = {
    model,
    max_tokens: 1024,
    messages: conversationMessages
  };

  if (systemMessages) {
    body.system = systemMessages;
  }

  const response = await fetch(CLAUDE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude request failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function listModels() {
  return ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5"];
}

module.exports = { chat, listModels, isAvailable };