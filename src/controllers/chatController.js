const chatService = require("../services/chatService");

async function ensureConversationAccess(conversationId, userId) {
  const conversation = await chatService.getConversation(conversationId, userId);
  if (!conversation) {
    throw new Error("Conversation not found.");
  }
  return conversation;
}

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

async function renameConversation(req, res) {
  const userId = req.session.user.id;
  const conversationId = parseInt(req.params.id, 10);
  const { title } = req.body;

  try {
    await ensureConversationAccess(conversationId, userId);

    const updatedConversation = await chatService.renameConversation(
      conversationId,
      userId,
      title
    );

    return res.json(updatedConversation);
  } catch (error) {
    if (error.message === "Conversation not found.") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Conversation title is required.") {
      return res.status(400).json({ error: error.message });
    }

    console.error("Rename conversation error:", error);
    return res.status(500).json({ error: "Could not rename conversation." });
  }
}

async function deleteConversation(req, res) {
  const userId = req.session.user.id;
  const conversationId = parseInt(req.params.id, 10);

  try {
    await ensureConversationAccess(conversationId, userId);
    await chatService.deleteConversation(conversationId, userId);
    return res.json({ success: true });
  } catch (error) {
    if (error.message === "Conversation not found.") {
      return res.status(404).json({ error: error.message });
    }

    console.error("Delete conversation error:", error);
    return res.status(500).json({ error: "Could not delete conversation." });
  }
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

async function addAttachment(req, res) {
  const userId = req.session.user.id;
  const conversationId = parseInt(req.params.id, 10);
  const { name, kind, sizeBytes, contextText } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Attachment name is required." });
  }

  try {
    await ensureConversationAccess(conversationId, userId);

    const attachmentMessage = await chatService.addAttachmentMessage(
      conversationId,
      userId,
      {
        name: String(name).trim(),
        kind: kind || "file",
        sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : null,
        contextText: contextText || null
      }
    );

    return res.status(201).json(attachmentMessage);
  } catch (error) {
    if (error.message === "Conversation not found.") {
      return res.status(404).json({ error: error.message });
    }
    console.error("Add attachment error:", error);
    return res.status(500).json({ error: "Could not save attachment." });
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
  const userId = req.session.user.id;
  const conversationId = parseInt(req.params.id, 10);
  const { text } = req.body;

  try {
    await ensureConversationAccess(conversationId, userId);

    if (!text) {
      await chatService.clearDocumentContext(conversationId);
      return res.json({ message: "Context cleared.", hasContext: false });
    }

    await chatService.setDocumentContext(conversationId, text);
    return res.json({ message: "Context saved.", hasContext: true });
  } catch (error) {
    if (error.message === "Conversation not found.") {
      return res.status(404).json({ error: error.message });
    }
    console.error("Set context error:", error);
    return res.status(500).json({ error: "Could not save context." });
  }
}

async function getContextStatus(req, res) {
  const userId = req.session.user.id;
  const conversationId = parseInt(req.params.id, 10);

  try {
    await ensureConversationAccess(conversationId, userId);
    const hasContext = await chatService.hasDocumentContext(conversationId);
    return res.json({ hasContext });
  } catch (error) {
    if (error.message === "Conversation not found.") {
      return res.status(404).json({ error: error.message });
    }
    console.error("Get context status error:", error);
    return res.status(500).json({ error: "Could not fetch context status." });
  }
}

module.exports = {
  newConversation,
  getConversations,
  getConversation,
  renameConversation,
  deleteConversation,
  sendMessage,
  addAttachment,
  searchConversations,
  listModels,
  setContext,
  getContextStatus
};