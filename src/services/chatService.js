const conversationsData = require("../data/conversations");
const messagesData = require("../data/messages");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODELS = ["llama3.2", "mistral", "gemma"];
const db = require("../config/db");


async function queryOllama(model, messages) {
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

  const grouped = {};

  messages.forEach(m => {
    if (m.role === "user") {
      
      MODELS.forEach(model => {
        if (!grouped[model]) grouped[model] = [];
        grouped[model].push(m);
      });
    } else {
      if (!grouped[m.model]) grouped[m.model] = [];
      grouped[m.model].push(m);
    }
  });

  return {
    ...conversation,
    messages: grouped,
    models: MODELS, 
    selected_model: conversation.selected_model
  };
}


async function sendMessage(conversationId, userId, userContent) {
  const conversation = await conversationsData.getConversationById(conversationId, userId);
  if (!conversation) throw new Error("Conversation not found.");

  const modelsToUse = conversation.selected_model
    ? [conversation.selected_model]
    : MODELS;

  
  const existingMessages = await messagesData.getMessagesByConversation(conversationId);

  
  if (existingMessages.length === 0) {
    const title = userContent.length > 60
      ? userContent.slice(0, 57) + "..."
      : userContent;
    await conversationsData.updateTitle(conversationId, title);
  }

  
  await messagesData.addMessage(conversationId, "user", userContent, "user");

  
  const updatedHistory = await messagesData.getMessagesByConversation(conversationId);

  await Promise.all(
    modelsToUse.map(async (model) => {

      
      const ollamaMessages = updatedHistory
        .filter(m => m.role === "user" || m.model === model)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      

      const assistantContent = await queryOllama(model, ollamaMessages);

      await messagesData.addMessage(
        conversationId,
        "assistant",
        assistantContent,
        model
      );
    })
  );

  return await getConversation(conversationId, userId);
}


async function searchConversations(userId, term) {
  return await conversationsData.searchConversations(userId, term);
}


async function setConversationModel(conversationId, userId, model) {
  const convo = await conversationsData.getConversationById(conversationId, userId);
  if (!convo) throw new Error("Conversation not found.");

  await db.execute(
    "UPDATE conversations SET selected_model = ?, updated_at = NOW() WHERE id = ?",
    [model || null, conversationId]
  );

  return { success: true };
}

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  searchConversations,
  setConversationModel
};