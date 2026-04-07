const conversationsData = require("../data/conversations");
const messagesData = require("../data/messages");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

async function queryOllama(messages) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.message.content;
}

async function createConversation(userId) {
  return await conversationsData.createConversation(userId);
}

async function getConversations(userId) {
  return await conversationsData.getConversationsByUser(userId);
}

async function getConversation(conversationId, userId) {
  const conversation = await conversationsData.getConversationById(conversationId, userId);
  if (!conversation) return null;

  const messages = await messagesData.getMessagesByConversation(conversationId);
  return { ...conversation, messages };
}

async function sendMessage(conversationId, userId, userContent) {
  const conversation = await conversationsData.getConversationById(conversationId, userId);
  if (!conversation) throw new Error("Conversation not found.");

  const history = await messagesData.getMessagesByConversation(conversationId);

  // Set title from the first user message
  if (history.length === 0) {
    const title = userContent.length > 60 ? userContent.slice(0, 57) + "..." : userContent;
    await conversationsData.updateTitle(conversationId, title);
  }

  const userMessage = await messagesData.addMessage(conversationId, "user", userContent);

  const ollamaMessages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userContent }
  ];

  const assistantContent = await queryOllama(ollamaMessages);
  const assistantMessage = await messagesData.addMessage(conversationId, "assistant", assistantContent);

  return { userMessage, assistantMessage };
}

async function searchConversations(userId, term) {
  return await conversationsData.searchConversations(userId, term);
}

module.exports = { createConversation, getConversations, getConversation, sendMessage, searchConversations };
