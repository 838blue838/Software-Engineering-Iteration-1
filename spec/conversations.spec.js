const db = require("../src/config/db");
const conversations = require("../src/data/conversations");
const messages = require("../src/data/messages");
const users = require("../src/data/users");

describe("conversations data store", () => {
  let user;

  beforeEach(async () => {
    await db.execute("DELETE FROM messages");
    await db.execute("DELETE FROM conversations");
    await users.clearUsers();

    user = await users.createUser("convtestuser", "hashedpassword", "local");
  });

  it("lists conversations by user", async () => {
    await conversations.createConversation(user.id, "First Chat");
    await conversations.createConversation(user.id, "Second Chat");

    const list = await conversations.getConversationsByUser(user.id);

    expect(Array.isArray(list)).toBeTrue();
    expect(list.length).toBe(2);
    expect(list[0].user_id).toBe(user.id);
  });

  it("creates a new conversation", async () => {
    const conversation = await conversations.createConversation(user.id, "New Conversation");

    expect(conversation.id).toBeDefined();
    expect(conversation.user_id).toBe(user.id);
    expect(conversation.title).toBe("New Conversation");
  });

  it("adds messages to a conversation", async () => {
    const conversation = await conversations.createConversation(user.id, "Message Test");

    await messages.addMessage(conversation.id, "user", "hello");
    await messages.addMessage(conversation.id, "assistant", "hi there");

    const storedMessages = await messages.getMessagesByConversation(conversation.id);

    expect(storedMessages.length).toBe(2);
    expect(storedMessages[0].content).toBe("hello");
    expect(storedMessages[1].content).toBe("hi there");
  });
});