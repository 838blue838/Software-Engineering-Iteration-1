const db = require("../config/db");

async function addMessage(conversationId, role, content) {
  const [result] = await db.execute(
    "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
    [conversationId, role, content]
  );
  return { id: result.insertId, conversation_id: conversationId, role, content };
}

async function getMessagesByConversation(conversationId) {
  const [rows] = await db.execute(
    "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
    [conversationId]
  );
  return rows;
}

module.exports = { addMessage, getMessagesByConversation };
