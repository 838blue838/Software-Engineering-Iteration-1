const conversationsData = require("../data/conversations");
const messagesData = require("../data/messages");
const llmRouter = require("./llm/llmRouter");
const intentRouter = require("./intentRouter");
const documentContext = require("./tools/documentContext");

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

async function renameConversation(conversationId, userId, title) {
  const cleanedTitle = String(title || "").trim();

  if (!cleanedTitle) {
    throw new Error("Conversation title is required.");
  }

  const updatedConversation = await conversationsData.renameConversation(
    conversationId,
    userId,
    cleanedTitle.slice(0, 255)
  );

  if (!updatedConversation) {
    throw new Error("Conversation not found.");
  }

  return updatedConversation;
}

async function deleteConversation(conversationId, userId) {
  const deleted = await conversationsData.deleteConversation(conversationId, userId);

  if (!deleted) {
    throw new Error("Conversation not found.");
  }

  return { success: true };
}

function formatAttachmentHistoryMessage(message) {
  const name = message.attachment_name || "Unnamed file";
  const kind = (message.attachment_kind || "file").toUpperCase();
  const size = message.attachment_size_bytes
    ? `, ${message.attachment_size_bytes} bytes`
    : "";

  return `[User attached file: ${name} (${kind}${size}) and added it to the conversation context.]`;
}

async function sendMessage(conversationId, userId, userContent, model, useChainOfThought) {
  const conversation = await conversationsData.getConversationById(conversationId, userId);
  if (!conversation) throw new Error("Conversation not found.");

  const history = await messagesData.getMessagesByConversation(conversationId);

  // Set title from the first user message
  if (history.length === 0) {
    const title = userContent.length > 60 ? userContent.slice(0, 57) + "..." : userContent;
    await conversationsData.updateTitle(conversationId, title);
  }

  const userMessage = await messagesData.addMessage(conversationId, "user", userContent);

  // Try tools first (math, weather)
  const toolResult = await intentRouter.tryTools(userContent);
  if (toolResult.handled) {
    const assistantMessage = await messagesData.addMessage(
      conversationId,
      "assistant",
      toolResult.response
    );
    return { userMessage, assistantMessage, model: `tool:${toolResult.tool}` };
  }

  // Build LLM messages with system prompt for context / chain-of-thought
  const llmMessages = [];
  const systemMessage = await intentRouter.buildSystemMessage(
    conversationId,
    useChainOfThought
  );

  if (systemMessage) {
    llmMessages.push({ role: "system", content: systemMessage });
  }

  llmMessages.push(
    ...history.map((m) => {
      if (m.message_type === "attachment") {
        return {
          role: "user",
          content: formatAttachmentHistoryMessage(m)
        };
      }

      return {
        role: m.role,
        content: m.content
      };
    })
  );

  llmMessages.push({ role: "user", content: userContent });

  const assistantContent = await llmRouter.chat(model, llmMessages);
  const assistantMessage = await messagesData.addMessage(
    conversationId,
    "assistant",
    assistantContent
  );

  return {
    userMessage,
    assistantMessage,
    model: model || llmRouter.DEFAULT_MODEL
  };
}

async function addAttachmentMessage(conversationId, userId, file) {
  const conversation = await conversationsData.getConversationById(conversationId, userId);
  if (!conversation) throw new Error("Conversation not found.");
  if (!file || !file.name) throw new Error("Attachment metadata is required.");

  return await messagesData.addAttachmentMessage(conversationId, {
    name: file.name,
    kind: file.kind || "file",
    sizeBytes: file.sizeBytes ?? null,
    contextText: file.contextText || null
  });
}

async function searchConversations(userId, term) {
  return await conversationsData.searchConversations(userId, term);
}

async function listModels() {
  return await llmRouter.listAllModels();
}

async function setDocumentContext(conversationId, text) {
  await documentContext.setContext(conversationId, text);
}

async function clearDocumentContext(conversationId) {
  await documentContext.clearContext(conversationId);
}

async function hasDocumentContext(conversationId) {
  return await documentContext.hasContext(conversationId);
}

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  renameConversation,
  deleteConversation,
  sendMessage,
  addAttachmentMessage,
  searchConversations,
  listModels,
  setDocumentContext,
  clearDocumentContext,
  hasDocumentContext
};