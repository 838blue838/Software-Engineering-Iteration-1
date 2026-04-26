const chatService = require("../services/chatService");

async function newConversation(req, res) {
  const userId = req.session.user.id;
  const conversation = await chatService.createConversation(userId);
  return res.redirect(`/chat?id=${conversation.id}`);
}

async function getConversations(req, res) {
  const userId = req.session.user.id;
  const conversations = await chatService.getConversations(userId);
  return res.json(conversations);
}

async function getConversation(req, res) {
  const userId = req.session.user.id;
  const conversationId = parseInt(req.params.id, 10);
  const conversation = await chatService.getConversation(conversationId, userId);

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }

  return res.json(conversation);
}

async function sendMessage(req, res) {
  const userId = req.session.user.id;
  const conversationId = parseInt(req.params.id, 10);
  const { content, model, chainOfThought } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Message content is required." });
  }

  try {
    const result = await chatService.sendMessage(
      conversationId,
      userId,
      content.trim(),
      model,
      chainOfThought === true
    );
    return res.json(result);
  } catch (error) {
    if (error.message === "Conversation not found.") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("API key not configured")) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Send message error:", error);
    return res.status(502).json({ error: `Could not reach the LLM: ${error.message}` });
  }
}

async function searchConversations(req, res) {
  const userId = req.session.user.id;
  const term = req.query.q || "";
  const conversations = await chatService.searchConversations(userId, term);
  return res.json(conversations);
}

async function listModels(req, res) {
  try {
    const models = await chatService.listModels();
    return res.json(models);
  } catch (error) {
    console.error("List models error:", error);
    return res.status(500).json({ error: "Could not list models." });
  }
}

async function setContext(req, res) {
  const conversationId = parseInt(req.params.id, 10);
  const { text } = req.body;

  if (!text) {
    chatService.clearDocumentContext(conversationId);
    return res.json({ message: "Context cleared.", hasContext: false });
  }

  chatService.setDocumentContext(conversationId, text);
  return res.json({ message: "Context saved.", hasContext: true });
}

async function getContextStatus(req, res) {
  const conversationId = parseInt(req.params.id, 10);
  return res.json({ hasContext: chatService.hasDocumentContext(conversationId) });
}

module.exports = {
  newConversation,
  getConversations,
  getConversation,
  sendMessage,
  searchConversations,
  listModels,
  setContext,
  getContextStatus
};