// In-memory document store per conversation
// Lets users upload text/context that gets prepended to LLM messages

const conversationContexts = new Map();

function setContext(conversationId, text) {
  if (!text || text.trim().length === 0) {
    conversationContexts.delete(conversationId);
    return;
  }
  // Limit to 5000 chars to avoid blowing up the context window
  const truncated = text.slice(0, 5000);
  conversationContexts.set(conversationId, truncated);
}

function getContext(conversationId) {
  return conversationContexts.get(conversationId) || null;
}

function hasContext(conversationId) {
  return conversationContexts.has(conversationId);
}

function clearContext(conversationId) {
  conversationContexts.delete(conversationId);
}

module.exports = { setContext, getContext, hasContext, clearContext };