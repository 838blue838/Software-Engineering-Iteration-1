const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function isAvailable() {
  return !!OPENAI_API_KEY && OPENAI_API_KEY.length > 0;
}

async function chat(model, messages) {
  if (!isAvailable()) {
    throw new Error("OpenAI API key not configured. Add OPENAI_API_KEY to your .env file.");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({ model, messages })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function listModels() {
  return ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];
}

module.exports = { chat, listModels, isAvailable };