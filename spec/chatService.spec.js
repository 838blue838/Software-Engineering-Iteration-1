const chatService = require("../src/services/chatService");
const userService = require("../src/services/userService");

describe("chatService", () => {
  let testUserId;

  beforeEach(async () => {
    await userService.clearUsers();
    await chatService.clearConversations();
    const user = await userService.createUser("chatuser", "password123");
    testUserId = user.id;
  });

  // --- Conversation tests ---

  it("creates a new conversation for a user", async () => {
    const convo = await chatService.createConversation(testUserId, "Test Chat");

    expect(convo.id).toBeDefined();
    expect(convo.title).toBe("Test Chat");
    expect(convo.user_id).toBe(testUserId);
  });

  it("uses default title if none provided", async () => {
    const convo = await chatService.createConversation(testUserId);

    expect(convo.title).toBe("New Conversation");
  });

  it("gets all conversations for a user", async () => {
    await chatService.createConversation(testUserId, "Chat A");
    await chatService.createConversation(testUserId, "Chat B");

    const convos = await chatService.getConversationsByUser(testUserId);

    expect(convos.length).toBe(2);
  });

  it("returns empty array when user has no conversations", async () => {
    const convos = await chatService.getConversationsByUser(testUserId);

    expect(convos).toEqual([]);
  });

  // --- Message tests ---

  it("saves a user message to a conversation", async () => {
    const convo = await chatService.createConversation(testUserId, "Test");
    await chatService.saveMessage(convo.id, "user", "Hello!");

    const messages = await chatService.getMessages(convo.id);

    expect(messages.length).toBe(1);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toBe("Hello!");
  });

  it("saves an assistant message to a conversation", async () => {
    const convo = await chatService.createConversation(testUserId, "Test");
    await chatService.saveMessage(convo.id, "assistant", "Hi there!");

    const messages = await chatService.getMessages(convo.id);

    expect(messages[0].role).toBe("assistant");
    expect(messages[0].content).toBe("Hi there!");
  });

  it("retrieves messages in order", async () => {
    const convo = await chatService.createConversation(testUserId, "Test");
    await chatService.saveMessage(convo.id, "user", "First");
    await chatService.saveMessage(convo.id, "assistant", "Second");
    await chatService.saveMessage(convo.id, "user", "Third");

    const messages = await chatService.getMessages(convo.id);

    expect(messages.length).toBe(3);
    expect(messages[0].content).toBe("First");
    expect(messages[1].content).toBe("Second");
    expect(messages[2].content).toBe("Third");
  });

  it("returns empty array for conversation with no messages", async () => {
    const convo = await chatService.createConversation(testUserId, "Empty");
    const messages = await chatService.getMessages(convo.id);

    expect(messages).toEqual([]);
  });

  // --- Search tests ---

  it("searches messages by keyword", async () => {
    const convo = await chatService.createConversation(testUserId, "Test");
    await chatService.saveMessage(convo.id, "user", "Tell me about binary trees");
    await chatService.saveMessage(convo.id, "assistant", "Binary trees are data structures");
    await chatService.saveMessage(convo.id, "user", "What about databases?");

    const results = await chatService.searchMessages(testUserId, "binary");

    expect(results.length).toBe(2);
  });

  it("returns empty array when search finds nothing", async () => {
    const convo = await chatService.createConversation(testUserId, "Test");
    await chatService.saveMessage(convo.id, "user", "Hello world");

    const results = await chatService.searchMessages(testUserId, "zzznomatch");

    expect(results).toEqual([]);
  });

  it("search is case-insensitive", async () => {
    const convo = await chatService.createConversation(testUserId, "Test");
    await chatService.saveMessage(convo.id, "user", "Binary Trees");

    const results = await chatService.searchMessages(testUserId, "binary");

    expect(results.length).toBe(1);
  });

});
