const db = require("../config/db");

async function createUser(username, password, authProvider = "local") {
  const query = `
    INSERT INTO users (username, password, auth_provider)
    VALUES (?, ?, ?)
  `;

  const [result] = await db.execute(query, [username, password, authProvider]);

  return {
    id: result.insertId,
    username,
    auth_provider: authProvider
  };
}

async function findUserByUsername(username) {
  const query = `
    SELECT * FROM users WHERE username = ?
  `;

  const [rows] = await db.execute(query, [username]);

  return rows[0] || null;
}

async function clearUsers() {
  await db.execute("DELETE FROM users");
}

module.exports = {
  createUser,
  findUserByUsername,
  clearUsers
};

// const users = [];

//module.exports = users;