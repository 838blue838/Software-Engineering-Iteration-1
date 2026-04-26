const conversationsData = require("../data/conversations");
const messagesData = require("../data/messages");
const llmRouter = require("./llm/llmRouter");

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

async function sendMessage(conversationId, userId, userContent, model) {
  const conversation = await conversationsData.getConversationById(conversationId, userId);
  if (!conversation) throw new Error("Conversation not found.");

  const history = await messagesData.getMessagesByConversation(conversationId);

  // Set title from the first user message
  if (history.length === 0) {
    const title = userContent.length > 60 ? userContent.slice(0, 57) + "..." : userContent;
    await conversationsData.updateTitle(conversationId, title);
  }

  const userMessage = await messagesData.addMessage(conversationId, "user", userContent);

  const llmMessages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userContent }
  ];

  const assistantContent = await llmRouter.chat(model, llmMessages);
  const assistantMessage = await messagesData.addMessage(conversationId, "assistant", assistantContent);

  return { userMessage, assistantMessage, model: model || llmRouter.DEFAULT_MODEL };
}

async function searchConversations(userId, term) {
  return await conversationsData.searchConversations(userId, term);
}

async function listModels() {
  return await llmRouter.listAllModels();
}

module.exports = { createConversation, getConversations, getConversation, sendMessage, searchConversations, listModels };