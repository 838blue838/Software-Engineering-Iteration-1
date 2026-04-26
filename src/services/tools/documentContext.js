const conversationsData = require("../../data/conversations");

function normalizeContext(text) {
  if (!text || text.trim().length === 0) {
    return null;
  }

  // Keep a size cap so we do not overload the prompt/context window
  return text.slice(0, 5000);
}

async function setContext(conversationId, text) {
  const normalized = normalizeContext(text);

  if (!normalized) {
    await conversationsData.clearContextText(conversationId);
    return;
  }

  await conversationsData.setContextText(conversationId, normalized);
}

async function getContext(conversationId) {
  return await conversationsData.getContextText(conversationId);
}

async function hasContext(conversationId) {
  const context = await conversationsData.getContextText(conversationId);
  return !!(context && context.trim().length > 0);
}

async function clearContext(conversationId) {
  await conversationsData.clearContextText(conversationId);
}

module.exports = { setContext, getContext, hasContext, clearContext };