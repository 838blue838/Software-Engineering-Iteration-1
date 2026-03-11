# LLM Web UI Starter

This project is a minimal starter implementation for the Software Engineering project. 
It provides a working web application skeleton with local authentication, a protected dashboard, Rutgers CAS integration scaffolding, and Jasmine unit tests.

## Features

- Landing page
- Account creation
- Login and logout
- Protected dashboard route
- Rutgers CAS integration status/scaffold
- Jasmine unit tests

## Tech Stack

- Node.js
- Express
- express-session
- Jasmine

## Prerequisites

Before running the project, make sure the following are installed on your machine:

- Node.js
- npm
- Git

To verify installation, run:

```bash
node -v
npm -v
git --version
Fresh Setup Instructions
1. Clone the repository
git clone <YOUR_REPOSITORY_URL>
2. Move into the project folder
cd llm-web-ui-starter

If your folder has a different name, use that instead.

3. Install dependencies
npm install

4. Initialize Jasmine support files if needed

Only run this if the spec/support folder does not already exist:

npx jasmine init
5. Run the test suite
npm test

Expected result:

9 specs, 0 failures

6. Start the application
npm start

You should see:

Server running on http://localhost:3000

7. Open the app in your browser
http://localhost:3000
Full Command List From a Fresh Download

If the repository is already created and you just downloaded or cloned it, these are the full commands:

git clone <YOUR_REPOSITORY_URL>
cd llm-web-ui-starter
npm install
npx jasmine init
npm test
npm start

If npx jasmine init was already done previously, you can skip it:

git clone <YOUR_REPOSITORY_URL>
cd llm-web-ui-starter
npm install
npm test
npm start