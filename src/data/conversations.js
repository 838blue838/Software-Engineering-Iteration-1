const db = require("../config/db");

async function createConversation(userId, title = "New Conversation") {
  const [result] = await db.execute(
    "INSERT INTO conversations (user_id, title, context_text) VALUES (?, ?, NULL)",
    [userId, title]
  );

  return {
    id: result.insertId,
    user_id: userId,
    title,
    context_text: null
  };
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
  await db.execute(
    "UPDATE conversations SET title = ? WHERE id = ?",
    [title, id]
  );
}

async function renameConversation(id, userId, title) {
  await db.execute(
    "UPDATE conversations SET title = ? WHERE id = ? AND user_id = ?",
    [title, id, userId]
  );

  return await getConversationById(id, userId);
}

async function deleteConversation(id, userId) {
  const [result] = await db.execute(
    "DELETE FROM conversations WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  return result.affectedRows > 0;
}

async function setContextText(id, text) {
  await db.execute(
    "UPDATE conversations SET context_text = ? WHERE id = ?",
    [text, id]
  );
}

async function getContextText(id) {
  const [rows] = await db.execute(
    "SELECT context_text FROM conversations WHERE id = ?",
    [id]
  );
  return rows[0]?.context_text || null;
}

async function clearContextText(id) {
  await db.execute(
    "UPDATE conversations SET context_text = NULL WHERE id = ?",
    [id]
  );
}

async function searchConversations(userId, term) {
  const like = `%${term}%`;
  const [rows] = await db.execute(
    `SELECT DISTINCT c.* FROM conversations c
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE c.user_id = ?
       AND (
         c.title LIKE ?
         OR c.context_text LIKE ?
         OR m.content LIKE ?
         OR m.attachment_name LIKE ?
       )
     ORDER BY c.updated_at DESC`,
    [userId, like, like, like, like]
  );
  return rows;
}

module.exports = {
  createConversation,
  getConversationsByUser,
  getConversationById,
  updateTitle,
  renameConversation,
  deleteConversation,
  setContextText,
  getContextText,
  clearContextText,
  searchConversations
};