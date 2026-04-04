const host = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const model = process.env.OLLAMA_MODEL || "llama3.2";

async function getResponse(messageHistory) {
  const response = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: messageHistory.map((m) => ({ role: m.role, content: m.content })),
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.message.content;
}

module.exports = { getResponse };
