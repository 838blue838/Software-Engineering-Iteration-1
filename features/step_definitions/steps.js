const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');
const http = require('http');

let lastResponse = null;
let sessionCookie = null;
let activeConversationId = null;

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(sessionCookie ? { Cookie: sessionCookie } : {})
      }
    };
    const req = http.request(options, (res) => {
      let raw = '';
      if (res.headers['set-cookie']) sessionCookie = res.headers['set-cookie'][0];
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: raw, headers: res.headers }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Create login test user before scenarios that need it
Before({ tags: '@requiresUser' }, async function () {
  await makeRequest('POST', '/api/auth/reset-users', {});
  await makeRequest('POST', '/api/auth/signup', {
    username: 'testuser_login',
    password: 'Password1'
  });
});

// Reset session before each scenario
Before(async function () {
  sessionCookie = null;
  lastResponse = null;
  activeConversationId = null;
});

// Auth steps
Given('I am on the signup page', function () {});
Given('I am on the login page', function () {});

Given('I am logged in as {string} with password {string}', async function (username, password) {
  lastResponse = await makeRequest('POST', '/api/auth/login', { username, password });
});

When('I enter username {string} and password {string}', function (username, password) {
  this.username = username;
  this.password = password;
});

When('I click the signup button', async function () {
  lastResponse = await makeRequest('POST', '/api/auth/signup', {
    username: this.username,
    password: this.password
  });
});

When('I click the login button', async function () {
  lastResponse = await makeRequest('POST', '/api/auth/login', {
    username: this.username,
    password: this.password
  });
});

When('I click the logout button', async function () {
  lastResponse = await makeRequest('POST', '/api/auth/logout', '');
});

Then('I should be redirected to the dashboard', function () {
  assert.ok(
    lastResponse.status === 200 || lastResponse.status === 302,
    `Expected success but got ${lastResponse.status}`
  );
});

Then('I should be redirected to the home page', function () {
  assert.ok(
    lastResponse.status === 200 || lastResponse.status === 302,
    `Expected redirect but got ${lastResponse.status}`
  );
});

Then('I should see an error message', function () {
  assert.ok(
    lastResponse.status === 400 || lastResponse.status === 401 ||
    lastResponse.status === 409 || lastResponse.status === 302,
    `Expected error status but got ${lastResponse.status}`
  );
});

// Chat steps
When('I create a new conversation', async function () {
  lastResponse = await makeRequest('POST', '/api/chat/new', {});
});

Then('I should receive a conversation ID', function () {
  // new conversation redirects to /chat?id=N — check redirect happened
  assert.ok(
    lastResponse.status === 302 || lastResponse.status === 200,
    `Expected redirect but got ${lastResponse.status}`
  );
  const location = lastResponse.headers['location'] || '';
  const match = location.match(/[?&]id=(\d+)/);
  assert.ok(match, `Expected location header with id, got: ${location}`);
  activeConversationId = parseInt(match[1], 10);
});

Given('I have an active conversation', async function () {
  lastResponse = await makeRequest('POST', '/api/chat/new', {});
  const location = lastResponse.headers['location'] || '';
  const match = location.match(/[?&]id=(\d+)/);
  assert.ok(match, `Could not get conversation id from redirect: ${location}`);
  activeConversationId = parseInt(match[1], 10);
});

When('I send the message {string}', async function (message) {
  lastResponse = await makeRequest(
    'POST',
    `/api/chat/conversations/${activeConversationId}/message`,
    { content: message }
  );
});

Then('I should receive an assistant reply', function () {
  assert.strictEqual(lastResponse.status, 200, `Expected 200 but got ${lastResponse.status}: ${lastResponse.body}`);
  const data = JSON.parse(lastResponse.body);
  assert.ok(data.assistantMessage, 'Expected assistantMessage in response');
  assert.ok(data.assistantMessage.content, 'Expected assistant message to have content');
});

When('I fetch the conversation', async function () {
  lastResponse = await makeRequest('GET', `/api/chat/conversations/${activeConversationId}`, '');
});

Then('the conversation should contain at least 1 message', function () {
  assert.strictEqual(lastResponse.status, 200);
  const data = JSON.parse(lastResponse.body);
  assert.ok(Array.isArray(data.messages), 'Expected messages array');
  assert.ok(data.messages.length >= 1, `Expected at least 1 message, got ${data.messages.length}`);
});

// History steps
When('I fetch my conversation history', async function () {
  lastResponse = await makeRequest('GET', '/api/chat/conversations', '');
});

Then('I should receive a list of conversations', function () {
  assert.strictEqual(lastResponse.status, 200, `Expected 200 but got ${lastResponse.status}`);
  const data = JSON.parse(lastResponse.body);
  assert.ok(Array.isArray(data), 'Expected an array of conversations');
});

When('I search my history for {string}', async function (term) {
  lastResponse = await makeRequest('GET', `/api/chat/search?q=${encodeURIComponent(term)}`, '');
});

Then('I should receive search results', function () {
  assert.strictEqual(lastResponse.status, 200, `Expected 200 but got ${lastResponse.status}`);
  const data = JSON.parse(lastResponse.body);
  assert.ok(Array.isArray(data), 'Expected an array of search results');
});
