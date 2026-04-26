const db = require("../config/db");

async function addMessage(conversationId, role, content, options = {}) {
  const {
    messageType = "text",
    attachmentName = null,
    attachmentKind = null,
    attachmentSizeBytes = null,
    attachmentContextText = null
  } = options;

  const [result] = await db.execute(
    `INSERT INTO messages
      (conversation_id, role, content, message_type, attachment_name, attachment_kind, attachment_size_bytes, attachment_context_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      conversationId,
      role,
      content,
      messageType,
      attachmentName,
      attachmentKind,
      attachmentSizeBytes,
      attachmentContextText
    ]
  );

  return {
    id: result.insertId,
    conversation_id: conversationId,
    role,
    content,
    message_type: messageType,
    attachment_name: attachmentName,
    attachment_kind: attachmentKind,
    attachment_size_bytes: attachmentSizeBytes,
    attachment_context_text: attachmentContextText
  };
}

async function addAttachmentMessage(conversationId, file) {
  return await addMessage(conversationId, "user", "", {
    messageType: "attachment",
    attachmentName: file.name,
    attachmentKind: file.kind,
    attachmentSizeBytes: file.sizeBytes,
    attachmentContextText: file.contextText
  });
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
  addAttachmentMessage,
  getMessagesByConversation
};