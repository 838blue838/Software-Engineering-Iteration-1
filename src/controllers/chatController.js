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
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Message content is required." });
  }

  try {
    const result = await chatService.sendMessage(conversationId, userId, content.trim());
    return res.json(result);
  } catch (error) {
    if (error.message === "Conversation not found.") {
      return res.status(404).json({ error: error.message });
    }
    console.error("Send message error:", error);
    return res.status(502).json({ error: "Could not reach the LLM. Make sure Ollama is running." });
  }
}

async function searchConversations(req, res) {
  const userId = req.session.user.id;
  const term = req.query.q || "";
  const conversations = await chatService.searchConversations(userId, term);
  return res.json(conversations);
}

module.exports = { newConversation, getConversations, getConversation, sendMessage, searchConversations };
