const chatService = require("../src/services/chatService");

function makeJsonResponse(body) {
  return {
    ok: true,
    json: async () => body
  };
}

describe("chatService", () => {
  afterEach(() => {
    if (global.fetch.calls) {
      global.fetch.calls.reset();
    }
  });

  it("returns all three local providers", () => {
    const providers = chatService.getAvailableProviders();
    expect(providers.map((p) => p.id)).toEqual(["ollama", "localai", "llamacpp"]);
  });

  it("compares across Ollama, LocalAI, and llama.cpp", async () => {
    spyOn(global, "fetch").and.callFake((url) => {
      if (url.includes("/api/chat")) {
        return Promise.resolve(makeJsonResponse({
          message: { content: "Ollama response" }
        }));
      }

      if (url.includes("8080")) {
        return Promise.resolve(makeJsonResponse({
          choices: [{ message: { content: "LocalAI response" } }]
        }));
      }

      if (url.includes("8081")) {
        return Promise.resolve(makeJsonResponse({
          choices: [{ message: { content: "llama.cpp response" } }]
        }));
      }

      return Promise.reject(new Error("Unexpected URL"));
    });

    const responses = await chatService.compareAcrossProviders([], "Explain stacks", [
      "ollama",
      "localai",
      "llamacpp"
    ]);

    expect(responses.length).toBe(3);
    expect(responses[0].providerId).toBe("ollama");
    expect(responses[1].providerId).toBe("localai");
    expect(responses[2].providerId).toBe("llamacpp");
  });

  it("throws an error if no valid provider is selected", () => {
    expect(() => {
      chatService.normalizeProviders(["fakeprovider"]);
    }).toThrowError("At least one valid provider must be selected.");
  });
});