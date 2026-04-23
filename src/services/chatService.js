const conversationsData = require("../data/conversations");
const messagesData = require("../data/messages");

const PROVIDERS = {
  ollama: {
    id: "ollama",
    label: "Ollama",
    type: "ollama",
    url: process.env.OLLAMA_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2"
  },
  localai: {
    id: "localai",
    label: "LocalAI",
    type: "openai-compatible",
    url: process.env.LOCALAI_URL || "http://localhost:8080",
    model: process.env.LOCALAI_MODEL || "localai-model"
  },
  llamacpp: {
    id: "llamacpp",
    label: "llama.cpp",
    type: "openai-compatible",
    url: process.env.LLAMACPP_URL || "http://localhost:8081",
    model: process.env.LLAMACPP_MODEL || "llamacpp-model"
  }
};

function getAvailableProviders() {
  return Object.values(PROVIDERS).map(({ id, label }) => ({ id, label }));
}

function normalizeProviders(providerIds) {
  if (!Array.isArray(providerIds) || providerIds.length === 0) {
    return Object.values(PROVIDERS);
  }

  const valid = providerIds
    .map((id) => PROVIDERS[id])
    .filter(Boolean);

  if (valid.length === 0) {
    throw new Error("At least one valid provider must be selected.");
  }

  return valid;
}

function trimTrailingSlash(url) {
  return url.replace(/\/+$/, "");
}

function extractOpenAICompatibleText(data) {
  const content = data?.choices?.[0]?.message?.content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        return part?.text || "";
      })
      .join("");
  }

  if (typeof content === "string") {
    return content;
  }

  throw new Error("Invalid response from OpenAI-compatible provider.");
}

function extractOllamaText(data) {
  const content = data?.message?.content;
  if (typeof content === "string") {
    return content;
  }

  throw new Error("Invalid response from Ollama.");
}

async function queryOllama(messages, provider) {
  const response = await fetch(`${trimTrailingSlash(provider.url)}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama returned HTTP ${response.status}`);
  }

  const data = await response.json();
  return extractOllamaText(data);
}

async function queryOpenAICompatible(messages, provider) {
  const response = await fetch(`${trimTrailingSlash(provider.url)}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`${provider.label} returned HTTP ${response.status}`);
  }

  const data = await response.json();
  return extractOpenAICompatibleText(data);
}

function buildProviderHistory(allMessages, providerId) {
  const history = [];

  for (const message of allMessages) {
    if (message.role === "user") {
      history.push({
        role: "user",
        content: message.content
      });
    } else if (message.role === "assistant" && message.provider === providerId) {
      history.push({
        role: "assistant",
        content: message.content
      });
    }
  }

  return history;
}

async function compareAcrossProviders(previousMessages, prompt, selectedProviderIds = []) {
  if (!prompt || !prompt.trim()) {
    throw new Error("Message content is required.");
  }

  const providers = normalizeProviders(selectedProviderIds);

  const settled = await Promise.allSettled(
    providers.map(async (provider) => {
      const history = buildProviderHistory(previousMessages, provider.id);
      const requestMessages = [
        ...history,
        { role: "user", content: prompt }
      ];

      let text;
      if (provider.type === "ollama") {
        text = await queryOllama(requestMessages, provider);
      } else {
        text = await queryOpenAICompatible(requestMessages, provider);
      }

      return {
        providerId: provider.id,
        providerLabel: provider.label,
        text
      };
    })
  );

  return settled.map((result, index) => {
    const provider = providers[index];

    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      providerId: provider.id,
      providerLabel: provider.label,
      text: `Error from ${provider.label}: ${result.reason.message}`
    };
  });
}

async function createConversation(userId) {
  return await conversationsData.createConversation(userId, "New Multi-LLM Chat");
}

async function getConversations(userId) {
  return await conversationsData.getConversationsByUser(userId);
}

function groupMessagesIntoTurns(messages) {
  const turns = [];
  let currentTurn = null;

  for (const message of messages) {
    if (message.role === "user") {
      if (currentTurn) {
        turns.push(currentTurn);
      }

      currentTurn = {
        prompt: message.content,
        created_at: message.created_at,
        responses: []
      };
    } else if (message.role === "assistant") {
      if (!currentTurn) continue;

      const providerId = message.provider || "unknown";
      const providerLabel = PROVIDERS[providerId]?.label || providerId;

      currentTurn.responses.push({
        providerId,
        providerLabel,
        text: message.content
      });
    }
  }

  if (currentTurn) {
    turns.push(currentTurn);
  }

  return turns;
}

async function getConversation(conversationId, userId) {
  const conversation = await conversationsData.getConversationById(conversationId, userId);
  if (!conversation) return null;

  const messages = await messagesData.getMessagesByConversation(conversationId);
  const turns = groupMessagesIntoTurns(messages);

  return {
    ...conversation,
    turns
  };
}

async function sendMessage(conversationId, userId, userContent, selectedProviderIds = []) {
  const conversation = await conversationsData.getConversationById(conversationId, userId);
  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const history = await messagesData.getMessagesByConversation(conversationId);

  if (history.length === 0) {
    const title = userContent.length > 60 ? `${userContent.slice(0, 57)}...` : userContent;
    await conversationsData.updateTitle(conversationId, title);
  }

  await messagesData.addMessage(conversationId, "user", userContent, null);

  const providerResponses = await compareAcrossProviders(history, userContent, selectedProviderIds);

  const savedResponses = [];
  for (const response of providerResponses) {
    const saved = await messagesData.addMessage(
      conversationId,
      "assistant",
      response.text,
      response.providerId
    );
    savedResponses.push(saved);
  }

  await conversationsData.touchConversation(conversationId);

  return {
    providerResponses,
    savedResponses
  };
}

async function searchConversations(userId, term) {
  return await conversationsData.searchConversations(userId, term);
}

module.exports = {
  getAvailableProviders,
  normalizeProviders,
  compareAcrossProviders,
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  searchConversations
};