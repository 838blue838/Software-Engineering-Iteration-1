const db = require("../config/db");

async function addMessage(conversationId, role, content, model) {
  const [result] = await db.execute(
    "INSERT INTO messages (conversation_id, role, content, model) VALUES (?, ?, ?, ?)",
    [conversationId, role, content, model]
  );
  return { id: result.insertId, conversation_id: conversationId, role, content, model };
}

async function getMessagesByConversation(conversationId) {
  const [rows] = await db.execute(
    "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
    [conversationId]
  );
  return rows;
}


async function getModelsByConversation(conversationId) {
  const [rows] = await db.execute(
    "SELECT DISTINCT model FROM messages WHERE conversation_id = ? AND role = 'assistant'",
    [conversationId]
  );
  return rows.map(r => r.model);
}

module.exports = {
  addMessage,
  getMessagesByConversation,
  getModelsByConversation
};