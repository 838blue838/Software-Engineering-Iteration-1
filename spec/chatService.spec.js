const chatService = require("../src/services/chatService");
const conversationsData = require("../src/data/conversations");
const messagesData = require("../src/data/messages");
const userService = require("../src/services/userService");

describe("chatService", () => {
  let testUserId;

  beforeEach(async () => {
    await userService.clearUsers();
    const user = await userService.createUser("chatuser", "Password1");
    testUserId = user.id;

    // Clear conversations for this user by re-creating the user
    // (cascading delete via DB foreign key handles messages + conversations)
  });

  it("creates a new conversation for a user", async () => {
    const convo = await chatService.createConversation(testUserId);

    expect(convo.id).toBeDefined();
    expect(convo.user_id).toBe(testUserId);
    expect(convo.title).toBe("New Conversation");
  });

  it("returns all conversations for a user", async () => {
    await chatService.createConversation(testUserId);
    await chatService.createConversation(testUserId);

    const convos = await chatService.getConversations(testUserId);

    expect(convos.length).toBeGreaterThanOrEqual(2);
  });

  it("returns conversation with messages", async () => {
    const convo = await chatService.createConversation(testUserId);
    await messagesData.addMessage(convo.id, "user", "hello");
    await messagesData.addMessage(convo.id, "assistant", "hi there");

    const result = await chatService.getConversation(convo.id, testUserId);

    expect(result).not.toBeNull();
    expect(result.messages.length).toBe(2);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[1].role).toBe("assistant");
  });

  it("returns null for a conversation belonging to another user", async () => {
    const convo = await chatService.createConversation(testUserId);
    const result = await chatService.getConversation(convo.id, 99999);

    expect(result).toBeNull();
  });

  it("throws when sending message to a non-existent conversation", async () => {
    try {
      await chatService.sendMessage(99999, testUserId, "hello");
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toBe("Conversation not found.");
    }
  });

  it("searchConversations returns matching conversations by title", async () => {
    const convo = await chatService.createConversation(testUserId);
    await conversationsData.updateTitle(convo.id, "Unique Algebra Question");

    const results = await chatService.searchConversations(testUserId, "Algebra");

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].title).toContain("Algebra");
  });

  it("searchConversations returns empty array when no match", async () => {
    await chatService.createConversation(testUserId);

    const results = await chatService.searchConversations(testUserId, "xyznotfound123");

    expect(results.length).toBe(0);
  });
});
