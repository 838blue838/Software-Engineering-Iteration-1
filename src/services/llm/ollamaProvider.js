const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

async function chat(model, messages) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false })
  });
  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }
  const data = await response.json();
  return data.message.content;
}

async function listModels() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.models || []).map(m => m.name);
  } catch (err) {
    return [];
  }
}

module.exports = { chat, listModels };