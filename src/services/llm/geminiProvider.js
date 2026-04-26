const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function isAvailable() {
  return !!GEMINI_API_KEY && GEMINI_API_KEY.length > 0;
}

async function chat(model, messages) {
  if (!isAvailable()) {
    throw new Error("Gemini API key not configured. Add GEMINI_API_KEY to your .env file.");
  }

  // Gemini uses a different message format - convert from OpenAI style
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function listModels() {
  return ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.5-flash-lite"];
}

module.exports = { chat, listModels, isAvailable };