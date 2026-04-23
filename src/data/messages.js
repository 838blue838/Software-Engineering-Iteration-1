const db = require("../config/db");

async function addMessage(conversationId, role, content, provider = null) {
  const [result] = await db.execute(
    "INSERT INTO messages (conversation_id, role, provider, content) VALUES (?, ?, ?, ?)",
    [conversationId, role, provider, content]
  );

  return {
    id: result.insertId,
    conversation_id: conversationId,
    role,
    provider,
    content,
    created_at: new Date().toISOString()
  };
}

async function getMessagesByConversation(conversationId) {
  const [rows] = await db.execute(
    "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC",
    [conversationId]
  );

  return rows;
}

module.exports = {
  addMessage,
  getMessagesByConversation
};