const chatService = require("../services/chatService");
const llmService = require("../services/llmService");

async function newConversation(req, res) {
  try {
    const userId = req.session.user.id;
    const convo = await chatService.createConversation(userId);
    res.json({ id: convo.id, title: convo.title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function sendMessage(req, res) {
  try {
    const userId = req.session.user.id;
    const { message, conversationId } = req.body;

    if (!message || !conversationId) {
      return res.status(400).json({ error: "Message and conversationId are required." });
    }

    await chatService.saveMessage(conversationId, "user", message);

    const history = await chatService.getMessages(conversationId);
    const reply = await llmService.getResponse(history);

    await chatService.saveMessage(conversationId, "assistant", reply);

    res.redirect(`/chat?id=${conversationId}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getHistory(req, res) {
  try {
    const userId = req.session.user.id;
    const conversations = await chatService.getConversationsByUser(userId);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getConversation(req, res) {
  try {
    const conversationId = req.params.id;
    const messages = await chatService.getMessages(conversationId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function searchConversations(req, res) {
  try {
    const userId = req.session.user.id;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query is required." });
    }

    const results = await chatService.searchMessages(userId, q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  newConversation,
  sendMessage,
  getHistory,
  getConversation,
  searchConversations
};
