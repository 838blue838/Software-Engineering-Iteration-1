# LLM Web UI

A web application for comparing responses from multiple local LLM providers in one place.

This project supports:
- Ollama
- LocalAI
- llama.cpp

A user can:
- sign up and log in
- start a new conversation
- send one prompt
- compare responses from multiple local LLMs
- save and reopen chat history
- search past conversations

---

## Features

- Local account signup and login
- Rutgers CAS routing structure included
- Multi-LLM comparison workflow
- Conversation history and search
- MySQL-backed users, conversations, and messages
- Jasmine unit tests
- Cucumber acceptance tests
- Puppeteer automated demo and testing

---

## Tech Stack

- Node.js
- Express
- MySQL
- Puppeteer
- Jasmine
- Cucumber

---

## Project Structure

```text
.
├── features/
│   ├── chat.feature
│   ├── history.feature
│   ├── login.feature
│   ├── logout.feature
│   ├── signup.feature
│   └── step_definitions/
│       ├── steps.js
│       └── multiLlmSteps.js
├── spec/
│   ├── authController.spec.js
│   ├── userService.spec.js
│   └── conversations.spec.js
├── src/
│   ├── config/
│   ├── controllers/
│   ├── data/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── views/
├── tests/
│   └── puppeteer/
│       └── chat-flow.js
├── puppeteer_demo.js
├── server.js
├── package.json
└── README.md
```

---

## Prerequisites

Install these before running the project:

- Node.js
- npm
- MySQL
- Ollama
- Docker Desktop for LocalAI
- llama.cpp for Windows

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/838blue838/Software-Engineering-Iteration-1.git
cd Software-Engineering-Iteration-1
npm install
```

---

## Database Setup

Create and initialize the MySQL database.

Use MySQL Workbench or the MySQL command line and run:

```sql
CREATE DATABASE IF NOT EXISTS llm_site;
USE llm_site;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255),
    auth_provider VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    role VARCHAR(20) NOT NULL,
    provider VARCHAR(50) NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
```

If your `messages` table already exists and needs to be updated, run:

```sql
USE llm_site;

ALTER TABLE messages
MODIFY COLUMN role VARCHAR(20) NOT NULL;

ALTER TABLE messages
ADD COLUMN provider VARCHAR(50) NULL AFTER role;
```

If MySQL says `Duplicate column name 'provider'`, ignore that line.

---

## Environment Variables

Create a `.env` file in the root of the project and use:

```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=llm_site
DB_PORT=3306

SESSION_SECRET=your_session_secret
PORT=3000

BASE_URL=http://localhost:3000
CAS_BASE_URL=https://cas.rutgers.edu

OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

LOCALAI_URL=http://localhost:8080
LOCALAI_MODEL=llama-3.2-1b-instruct:q4_k_m

LLAMACPP_URL=http://localhost:8081
LLAMACPP_MODEL=ggml-org/gemma-3-1b-it-GGUF
```

For `LOCALAI_MODEL`, use the exact model name returned by:

```bash
curl http://localhost:8080/v1/models
```

---

## Starting the Local LLM Providers

Open separate terminals for each provider.

### 1. Start Ollama

```bash
ollama run llama3.2
```

Check that it is running:

```bash
curl http://localhost:11434/api/tags
```

---

### 2. Start LocalAI

If the container already exists:

```bash
docker start -ai local-ai
```

If you need to create it from scratch:

```bash
docker run -ti --name local-ai -p 8080:8080 localai/localai:latest
```

Then open the LocalAI WebUI in your browser:

```text
http://localhost:8080
```

Go to Models and install:

```text
llama-3.2-1b-instruct:q4_k_m
```

Check that it is loaded:

```bash
curl http://localhost:8080/v1/models
```

---

### 3. Start llama.cpp

On Windows PowerShell:

```powershell
& "C:\Users\omare\AppData\Local\Microsoft\WinGet\Packages\ggml.llamacpp_Microsoft.Winget.Source_8wekyb3d8bbwe\llama-server.exe" -hf ggml-org/gemma-3-1b-it-GGUF --port 8081
```

Check that it is running:

```powershell
curl http://localhost:8081/v1/models
```

---

## Starting the Web App

In a new terminal:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

---

## Test Commands

### Jasmine Unit Tests

```bash
npm test
```

### Cucumber Acceptance Tests

Make sure the app is already running in another terminal, then run:

```bash
npm run cucumber
```

### Puppeteer Automated Flow

If `tests/puppeteer/chat-flow.js` is present:

```bash
node tests/puppeteer/chat-flow.js
```

### Puppeteer Demo

For the visible demo walkthrough:

```bash
node puppeteer_demo.js
```

---

## Typical Startup Order

Use this order every time.

### Terminal 1

```bash
ollama run llama3.2
```

### Terminal 2

```bash
docker start -ai local-ai
```

### Terminal 3

```powershell
& "C:\Users\omare\AppData\Local\Microsoft\WinGet\Packages\ggml.llamacpp_Microsoft.Winget.Source_8wekyb3d8bbwe\llama-server.exe" -hf ggml-org/gemma-3-1b-it-GGUF --port 8081
```

### Terminal 4

```bash
npm start
```

### Terminal 5

```bash
npm test
```

### Terminal 6

```bash
npm run cucumber
```

### Optional Demo Terminal

```bash
node puppeteer_demo.js
```

---

## Health Checks

Before using the app, verify all three providers are up:

```bash
curl http://localhost:11434/api/tags
curl http://localhost:8080/v1/models
```

```powershell
curl http://localhost:8081/v1/models
```

---

## Known Notes

- LocalAI must have a model installed before the app can use it.
- llama.cpp must stay running in its own terminal.
- LocalAI must stay running in its own terminal.
- Ollama must be running with the configured model.
- Cucumber requires the app to already be running on `localhost:3000`.

---

## Demo Flow

A full demo run should show:

1. User signs up
2. User logs in
3. User opens chat
4. User starts a new conversation
5. User sends one prompt
6. Responses are shown from Ollama, LocalAI, and llama.cpp
7. User opens history
8. User searches previous conversations
9. User logs out

---

## Repository

GitHub repository:

```text
https://github.com/838blue838/Software-Engineering-Iteration-1
```
