const chatService = require("../src/services/chatService");
const conversationsData = require("../src/data/conversations");
const messagesData = require("../src/data/messages");
const llmRouter = require("../src/services/llm/llmRouter");
const intentRouter = require("../src/services/intentRouter");
const documentContext = require("../src/services/tools/documentContext");

describe("chatService", () => {
  beforeEach(() => {
    spyOn(conversationsData, "createConversation").and.resolveTo({
      id: 1,
      user_id: 7,
      title: "New Conversation",
      context_text: null
    });

    spyOn(conversationsData, "getConversationsByUser").and.resolveTo([
      { id: 1, user_id: 7, title: "Conversation A" }
    ]);

    spyOn(conversationsData, "getConversationById").and.resolveTo({
      id: 1,
      user_id: 7,
      title: "New Conversation"
    });

    spyOn(conversationsData, "updateTitle").and.resolveTo();
    spyOn(conversationsData, "renameConversation").and.resolveTo({
      id: 1,
      user_id: 7,
      title: "Renamed Conversation"
    });
    spyOn(conversationsData, "deleteConversation").and.resolveTo(true);
    spyOn(conversationsData, "searchConversations").and.resolveTo([
      { id: 1, user_id: 7, title: "Unique Algebra Question" }
    ]);

    spyOn(messagesData, "getMessagesByConversation").and.resolveTo([]);
    spyOn(messagesData, "addMessage").and.callFake(async (conversationId, role, content) => ({
      id: role === "user" ? 10 : 11,
      conversation_id: conversationId,
      role,
      content
    }));
    spyOn(messagesData, "addAttachmentMessage").and.callFake(async (conversationId, file) => ({
      id: 12,
      conversation_id: conversationId,
      role: "user",
      content: "",
      message_type: "attachment",
      attachment_name: file.name,
      attachment_kind: file.kind,
      attachment_size_bytes: file.sizeBytes,
      attachment_context_text: file.contextText
    }));

    spyOn(intentRouter, "tryTools").and.resolveTo({ handled: false });
    spyOn(intentRouter, "buildSystemMessage").and.resolveTo(null);

    spyOn(llmRouter, "chat").and.resolveTo("assistant reply");
    spyOn(llmRouter, "listAllModels").and.resolveTo({
      ollama: {},
      openai: {},
      gemini: {},
      claude: {}
    });

    spyOn(documentContext, "setContext").and.resolveTo();
    spyOn(documentContext, "clearContext").and.resolveTo();
    spyOn(documentContext, "hasContext").and.resolveTo(true);
  });

  it("creates a new conversation", async () => {
    const result = await chatService.createConversation(7);

    expect(conversationsData.createConversation).toHaveBeenCalledWith(7);
    expect(result.id).toBe(1);
  });

  it("returns all conversations for a user", async () => {
    const result = await chatService.getConversations(7);

    expect(conversationsData.getConversationsByUser).toHaveBeenCalledWith(7);
    expect(result.length).toBe(1);
  });

  it("returns a conversation with messages", async () => {
    messagesData.getMessagesByConversation.and.resolveTo([
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" }
    ]);

    const result = await chatService.getConversation(1, 7);

    expect(result).not.toBeNull();
    expect(result.messages.length).toBe(2);
  });

  it("returns null when the conversation does not exist", async () => {
    conversationsData.getConversationById.and.resolveTo(null);

    const result = await chatService.getConversation(999, 7);

    expect(result).toBeNull();
  });

  it("renames a conversation", async () => {
    const result = await chatService.renameConversation(1, 7, "Renamed Conversation");

    expect(conversationsData.renameConversation).toHaveBeenCalledWith(
      1,
      7,
      "Renamed Conversation"
    );
    expect(result.title).toBe("Renamed Conversation");
  });

  it("throws when renaming with a blank title", async () => {
    try {
      await chatService.renameConversation(1, 7, "   ");
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toBe("Conversation title is required.");
    }
  });

  it("throws when renaming a missing conversation", async () => {
    conversationsData.renameConversation.and.resolveTo(null);

    try {
      await chatService.renameConversation(999, 7, "New Title");
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toBe("Conversation not found.");
    }
  });

  it("deletes a conversation", async () => {
    const result = await chatService.deleteConversation(1, 7);

    expect(conversationsData.deleteConversation).toHaveBeenCalledWith(1, 7);
    expect(result.success).toBe(true);
  });

  it("throws when deleting a missing conversation", async () => {
    conversationsData.deleteConversation.and.resolveTo(false);

    try {
      await chatService.deleteConversation(999, 7);
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toBe("Conversation not found.");
    }
  });

  it("throws when sending a message to a missing conversation", async () => {
    conversationsData.getConversationById.and.resolveTo(null);

    try {
      await chatService.sendMessage(999, 7, "hello", "gpt-4o-mini", false);
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toBe("Conversation not found.");
    }
  });

  it("uses the math or weather tool path when a tool handles the message", async () => {
    intentRouter.tryTools.and.resolveTo({
      handled: true,
      tool: "math",
      response: "2 + 2 = 4"
    });

    const result = await chatService.sendMessage(1, 7, "what is 2 + 2", "gpt-4o-mini", false);

    expect(llmRouter.chat).not.toHaveBeenCalled();
    expect(messagesData.addMessage.calls.count()).toBe(2);
    expect(messagesData.addMessage.calls.argsFor(1)).toEqual([1, "assistant", "2 + 2 = 4"]);
    expect(result.model).toBe("tool:math");
  });

  it("builds LLM messages with system prompt, attachment history, prior history, and selected model", async () => {
    messagesData.getMessagesByConversation.and.resolveTo([
      {
        role: "user",
        content: "",
        message_type: "attachment",
        attachment_name: "Iteration 3.pdf",
        attachment_kind: "pdf",
        attachment_size_bytes: 78000
      },
      {
        role: "assistant",
        content: "previous assistant message",
        message_type: "text"
      }
    ]);

    intentRouter.buildSystemMessage.and.resolveTo("SYSTEM PROMPT");

    await chatService.sendMessage(1, 7, "hello there", "gpt-4o-mini", true);

    expect(llmRouter.chat).toHaveBeenCalledWith("gpt-4o-mini", [
      { role: "system", content: "SYSTEM PROMPT" },
      {
        role: "user",
        content: "[User attached file: Iteration 3.pdf (PDF, 78000 bytes) and added it to the conversation context.]"
      },
      { role: "assistant", content: "previous assistant message" },
      { role: "user", content: "hello there" }
    ]);
  });

  it("sets the title from the first user message", async () => {
    await chatService.sendMessage(1, 7, "Unique Algebra Question", "gpt-4o-mini", false);

    expect(conversationsData.updateTitle).toHaveBeenCalledWith(1, "Unique Algebra Question");
  });

  it("returns the selected model, or the router default if none is provided", async () => {
    llmRouter.DEFAULT_MODEL = "llama3.2";

    const result = await chatService.sendMessage(1, 7, "hello", undefined, false);

    expect(llmRouter.chat).toHaveBeenCalled();
    expect(result.model).toBe("llama3.2");
  });

  it("adds an attachment message", async () => {
    const result = await chatService.addAttachmentMessage(1, 7, {
      name: "notes.pdf",
      kind: "pdf",
      sizeBytes: 12345,
      contextText: "pdf text"
    });

    expect(messagesData.addAttachmentMessage).toHaveBeenCalledWith(1, {
      name: "notes.pdf",
      kind: "pdf",
      sizeBytes: 12345,
      contextText: "pdf text"
    });
    expect(result.message_type).toBe("attachment");
  });

  it("throws when attachment metadata is missing", async () => {
    try {
      await chatService.addAttachmentMessage(1, 7, {});
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toBe("Attachment metadata is required.");
    }
  });

  it("searches conversations for a term", async () => {
    const result = await chatService.searchConversations(7, "Algebra");

    expect(conversationsData.searchConversations).toHaveBeenCalledWith(7, "Algebra");
    expect(result[0].title).toContain("Algebra");
  });

  it("lists all available models through the router", async () => {
    const result = await chatService.listModels();

    expect(llmRouter.listAllModels).toHaveBeenCalled();
    expect(result.openai).toBeDefined();
  });

  it("delegates document-context helpers", async () => {
    await chatService.setDocumentContext(1, "some context");
    await chatService.clearDocumentContext(1);
    const hasContext = await chatService.hasDocumentContext(1);

    expect(documentContext.setContext).toHaveBeenCalledWith(1, "some context");
    expect(documentContext.clearContext).toHaveBeenCalledWith(1);
    expect(documentContext.hasContext).toHaveBeenCalledWith(1);
    expect(hasContext).toBe(true);
  });
});