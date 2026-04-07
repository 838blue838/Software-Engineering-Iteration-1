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

async function getConversationById(id, userId) {
  const [rows] = await db.execute(
    "SELECT * FROM conversations WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return rows[0] || null;
}

async function updateTitle(id, title) {
  await db.execute("UPDATE conversations SET title = ? WHERE id = ?", [title, id]);
}

async function searchConversations(userId, term) {
  const like = `%${term}%`;
  const [rows] = await db.execute(
    `SELECT DISTINCT c.* FROM conversations c
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE c.user_id = ?
       AND (c.title LIKE ? OR m.content LIKE ?)
     ORDER BY c.updated_at DESC`,
    [userId, like, like]
  );
  return rows;
}

module.exports = { createConversation, getConversationsByUser, getConversationById, updateTitle, searchConversations };
