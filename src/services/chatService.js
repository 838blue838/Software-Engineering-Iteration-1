const db = require("../config/db");

async function createConversation(userId, title = "New Conversation") {
  const [result] = await db.execute(
    "INSERT INTO conversations (user_id, title) VALUES (?, ?)",
    [userId, title]
  );
  return { id: result.insertId, user_id: userId, title };
}

async function getConversationsByUser(userId) {
  const [rows] = await db.execute(
    "SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC",
    [userId]
  );
  return rows;
}

async function saveMessage(conversationId, role, content) {
  const [result] = await db.execute(
    "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
    [conversationId, role, content]
  );
  return { id: result.insertId, conversation_id: conversationId, role, content };
}

async function getMessages(conversationId) {
  const [rows] = await db.execute(
    "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
    [conversationId]
  );
  return rows;
}

async function searchMessages(userId, keyword) {
  const [rows] = await db.execute(
    `SELECT m.*, c.title AS conversation_title
     FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE c.user_id = ? AND m.content LIKE ?
     ORDER BY m.created_at DESC`,
    [userId, `%${keyword}%`]
  );
  return rows;
}

async function clearConversations() {
  await db.execute("DELETE FROM messages");
  await db.execute("DELETE FROM conversations");
  await db.execute("ALTER TABLE messages AUTO_INCREMENT = 1");
  await db.execute("ALTER TABLE conversations AUTO_INCREMENT = 1");
}

module.exports = {
  createConversation,
  getConversationsByUser,
  saveMessage,
  getMessages,
  searchMessages,
  clearConversations
};
