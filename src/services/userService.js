const crypto = require("crypto");
const usersData = require("../data/users");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function createUser(username, password) {
  if (!username || !password) {
    throw new Error("Username and password are required.");
  }

  const existingUser = await usersData.findUserByUsername(username);

  if (existingUser) {
    throw new Error("User already exists.");
  }

  return await usersData.createUser(username, hashPassword(password), "local");
}

async function validateUser(username, password) {
  const user = await usersData.findUserByUsername(username);

  if (!user) {
    return null;
  }

  if (user.password !== hashPassword(password)) {
    return null;
  }

  return user;
}

async function findUserByUsername(username) {
  return await usersData.findUserByUsername(username);
}

async function clearUsers() {
  await usersData.clearUsers();
}

module.exports = {
  createUser,
  validateUser,
  findUserByUsername,
  clearUsers
};
