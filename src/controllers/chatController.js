const chatService = require("../services/chatService");

function getProviders(req, res) {
  return res.json(chatService.getAvailableProviders());
}

async function newConversation(req, res) {
  const userId = req.session.user.id;
  const conversation = await chatService.createConversation(userId);
  return res.json(conversation);
}

async function getConversations(req, res) {
  const userId = req.session.user.id;
  const conversations = await chatService.getConversations(userId);

  const enriched = await Promise.all(
    conversations.map(async (conversation) => {
      const fullConversation = await chatService.getConversation(conversation.id, userId);
      return {
        ...conversation,
        turnCount: fullConversation ? fullConversation.turns.length : 0
      };
    })
  );

  return res.json(enriched);
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
  const { content, providers } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Message content is required." });
  }

  try {
    const result = await chatService.sendMessage(
      conversationId,
      userId,
      content.trim(),
      Array.isArray(providers) ? providers : []
    );

    return res.json(result);
  } catch (error) {
    if (error.message === "Conversation not found.") {
      return res.status(404).json({ error: error.message });
    }

    return res.status(400).json({ error: error.message });
  }
}

async function searchConversations(req, res) {
  const userId = req.session.user.id;
  const term = req.query.q || "";
  const conversations = await chatService.searchConversations(userId, term);
  return res.json(conversations);
}

module.exports = {
  getProviders,
  newConversation,
  getConversations,
  getConversation,
  sendMessage,
  searchConversations
};