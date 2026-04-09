# LLM Web UI — Iteration 2

A web application skeleton for LLM inference with local authentication, Rutgers CAS integration, a protected dashboard, Jasmine unit tests, Cucumber acceptance tests, and Puppeteer browser automation.

## Features

- Landing page
- Account creation with SHA-256 password hashing
- Login and logout
- Protected dashboard route
- Rutgers CAS integration scaffold
- Jasmine unit tests (14 specs)
- Cucumber acceptance tests (signup, login, logout scenarios)
- Puppeteer automated browser demo

## Tech Stack

- Node.js / Express
- express-session
- MySQL (mysql2)
- Jasmine (unit testing)
- Cucumber.js (acceptance testing)
- Puppeteer (browser automation)

## Prerequisites

Make sure the following are installed before running the project:

- Node.js
- npm
- Git
- MySQL (running locally with a database and user configured)

To verify:

```bash
node -v
npm -v
git --version
mysql --version
```

## Environment Setup

Create a `.env` file in the project root with the following variables:

```
DB_HOST=localhost
DB_USER=<your_mysql_user>
DB_PASSWORD=<your_mysql_password>
DB_NAME=<your_database_name>
DB_PORT=3306
SESSION_SECRET=<any_random_string>
PORT=3000
```

You will also need to create the `users` table in your MySQL database:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  auth_provider VARCHAR(50) DEFAULT 'local',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Setup Instructions

1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd Software-Engineering-Iteration-1
```

2. Install dependencies

```bash
npm install
```

3. Configure `.env` (see Environment Setup above)

4. Run the unit test suite

```bash
npm test
```

Expected result:

```
14 specs, 0 failures
```

5. Start the application

```bash
npm start
```

You should see:

```
Server running on http://localhost:3000
```

6. Open the app in your browser

```
http://localhost:3000
```

## Running Acceptance Tests (Cucumber)

The server must be running before executing Cucumber tests.

In one terminal:

```bash
npm start
```

In a second terminal:

```bash
npm run cucumber
```

Expected result:

```
5 scenarios (5 passed)
19 steps (19 passed)
```

## Running the Puppeteer Demo

The server must be running first:

```bash
npm start
```

Then in a second terminal:

```bash
node puppeteer_demo.js
```

This opens a visible browser window and walks through: signup, login, and logout automatically.

Note: if `puppeteerUser` already exists in the database from a previous run, delete it before re-running:

```sql
DELETE FROM users WHERE username = 'puppeteerUser';
```
