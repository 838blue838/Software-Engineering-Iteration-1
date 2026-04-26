const chatController = require("../src/controllers/chatController");
const chatService = require("../src/services/chatService");

function makeRes() {
  const res = {};
  res.status = jasmine.createSpy("status").and.callFake(() => res);
  res.json = jasmine.createSpy("json").and.callFake(() => res);
  res.redirect = jasmine.createSpy("redirect").and.callFake(() => res);
  return res;
}

describe("chatController", () => {
  beforeEach(() => {
    spyOn(chatService, "createConversation").and.resolveTo({ id: 25 });
    spyOn(chatService, "getConversations").and.resolveTo([{ id: 25, title: "Test" }]);
    spyOn(chatService, "getConversation").and.resolveTo({ id: 25, title: "Test", messages: [] });
    spyOn(chatService, "renameConversation").and.resolveTo({
      id: 25,
      title: "Renamed Chat",
      messages: []
    });
    spyOn(chatService, "deleteConversation").and.resolveTo({ success: true });
    spyOn(chatService, "sendMessage").and.resolveTo({
      userMessage: { content: "hello" },
      assistantMessage: { content: "hi there" },
      model: "gpt-4o-mini"
    });
    spyOn(chatService, "addAttachmentMessage").and.resolveTo({
      id: 99,
      conversation_id: 25,
      role: "user",
      content: "",
      message_type: "attachment",
      attachment_name: "spec.pdf",
      attachment_kind: "pdf",
      attachment_size_bytes: 12345
    });
    spyOn(chatService, "searchConversations").and.resolveTo([{ id: 25, title: "algebra" }]);
    spyOn(chatService, "listModels").and.resolveTo({
      openai: { models: ["gpt-4o-mini"], available: false }
    });
    spyOn(chatService, "setDocumentContext").and.resolveTo();
    spyOn(chatService, "clearDocumentContext").and.resolveTo();
    spyOn(chatService, "hasDocumentContext").and.resolveTo(true);
  });

  it("redirects after creating a new conversation", async () => {
    const req = { session: { user: { id: 7 } } };
    const res = makeRes();

    await chatController.newConversation(req, res);

    expect(chatService.createConversation).toHaveBeenCalledWith(7);
    expect(res.redirect).toHaveBeenCalledWith("/chat?id=25");
  });

  it("returns all conversations", async () => {
    const req = { session: { user: { id: 7 } } };
    const res = makeRes();

    await chatController.getConversations(req, res);

    expect(chatService.getConversations).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith([{ id: 25, title: "Test" }]);
  });

  it("returns one conversation", async () => {
    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" }
    };
    const res = makeRes();

    await chatController.getConversation(req, res);

    expect(chatService.getConversation).toHaveBeenCalledWith(25, 7);
    expect(res.json).toHaveBeenCalled();
  });

  it("returns 404 when conversation is missing", async () => {
    chatService.getConversation.and.resolveTo(null);

    const req = {
      session: { user: { id: 7 } },
      params: { id: "999" }
    };
    const res = makeRes();

    await chatController.getConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Conversation not found." });
  });

  it("renames a conversation", async () => {
    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" },
      body: { title: "Renamed Chat" }
    };
    const res = makeRes();

    await chatController.renameConversation(req, res);

    expect(chatService.renameConversation).toHaveBeenCalledWith(25, 7, "Renamed Chat");
    expect(res.json).toHaveBeenCalledWith({
      id: 25,
      title: "Renamed Chat",
      messages: []
    });
  });

  it("returns 400 when renaming with a blank title", async () => {
    chatService.renameConversation.and.callFake(() =>
      Promise.reject(new Error("Conversation title is required."))
    );

    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" },
      body: { title: "   " }
    };
    const res = makeRes();

    await chatController.renameConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Conversation title is required." });
  });

  it("deletes a conversation", async () => {
    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" }
    };
    const res = makeRes();

    await chatController.deleteConversation(req, res);

    expect(chatService.deleteConversation).toHaveBeenCalledWith(25, 7);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("returns 400 when message content is blank", async () => {
    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" },
      body: { content: "   " }
    };
    const res = makeRes();

    await chatController.sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Message content is required." });
  });

  it("passes content, model, and chainOfThought to the service", async () => {
    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" },
      body: {
        content: "hello",
        model: "gpt-4o-mini",
        chainOfThought: true
      }
    };
    const res = makeRes();

    await chatController.sendMessage(req, res);

    expect(chatService.sendMessage).toHaveBeenCalledWith(
      25,
      7,
      "hello",
      "gpt-4o-mini",
      true
    );
    expect(res.json).toHaveBeenCalled();
  });

  it("maps missing conversations to 404 when sending", async () => {
    chatService.sendMessage.and.callFake(() =>
      Promise.reject(new Error("Conversation not found."))
    );

    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" },
      body: { content: "hello", model: "llama3.2", chainOfThought: false }
    };
    const res = makeRes();

    await chatController.sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Conversation not found." });
  });

  it("maps missing API keys to 400", async () => {
    chatService.sendMessage.and.callFake(() =>
      Promise.reject(new Error("OpenAI API key not configured. Add OPENAI_API_KEY to your .env file."))
    );

    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" },
      body: { content: "hello", model: "gpt-4o-mini", chainOfThought: false }
    };
    const res = makeRes();

    await chatController.sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "OpenAI API key not configured. Add OPENAI_API_KEY to your .env file."
    });
  });

  it("adds an attachment message", async () => {
    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" },
      body: {
        name: "spec.pdf",
        kind: "pdf",
        sizeBytes: 12345,
        contextText: "file text"
      }
    };
    const res = makeRes();

    await chatController.addAttachment(req, res);

    expect(chatService.addAttachmentMessage).toHaveBeenCalledWith(25, 7, {
      name: "spec.pdf",
      kind: "pdf",
      sizeBytes: 12345,
      contextText: "file text"
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 400 when attachment name is missing", async () => {
    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" },
      body: { kind: "pdf" }
    };
    const res = makeRes();

    await chatController.addAttachment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Attachment name is required." });
  });

  it("returns the model list", async () => {
    const req = {};
    const res = makeRes();

    await chatController.listModels(req, res);

    expect(chatService.listModels).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it("clears context when no text is provided", async () => {
    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" },
      body: {}
    };
    const res = makeRes();

    await chatController.setContext(req, res);

    expect(chatService.clearDocumentContext).toHaveBeenCalledWith(25);
    expect(res.json).toHaveBeenCalledWith({
      message: "Context cleared.",
      hasContext: false
    });
  });

  it("saves context when text is provided", async () => {
    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" },
      body: { text: "some context" }
    };
    const res = makeRes();

    await chatController.setContext(req, res);

    expect(chatService.setDocumentContext).toHaveBeenCalledWith(25, "some context");
    expect(res.json).toHaveBeenCalledWith({
      message: "Context saved.",
      hasContext: true
    });
  });

  it("returns context status", async () => {
    const req = {
      session: { user: { id: 7 } },
      params: { id: "25" }
    };
    const res = makeRes();

    await chatController.getContextStatus(req, res);

    expect(chatService.hasDocumentContext).toHaveBeenCalledWith(25);
    expect(res.json).toHaveBeenCalledWith({ hasContext: true });
  });
});