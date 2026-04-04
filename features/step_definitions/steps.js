const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');
const http = require('http');

let lastResponse = null;
let sessionCookie = null;

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
  await makeRequest('POST', '/api/auth/signup', {
    username: 'testuser_login',
    password: 'password123'
  });
});

// Reset session before each scenario
Before(async function () {
  sessionCookie = null;
  lastResponse = null;
});

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
    lastResponse.status === 400 || lastResponse.status === 401 || lastResponse.status === 409,
    `Expected error status but got ${lastResponse.status}`
  );
});