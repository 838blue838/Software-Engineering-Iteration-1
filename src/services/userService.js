const users = require("../data/users");

function findUserByUsername(username) {
  return users.find((user) => user.username === username) || null;
}

function createUser(username, password) {
  if (!username || !password) {
    throw new Error("Username and password are required.");
  }

  const existingUser = findUserByUsername(username);
  if (existingUser) {
    throw new Error("User already exists.");
  }

  const newUser = { id: users.length + 1, username, password };
  users.push(newUser);
  return newUser;
}

function validateUser(username, password) {
  const user = findUserByUsername(username);
  if (!user) {
    return null;
  }

  return user.password === password ? user : null;
}

function clearUsers() {
  users.length = 0;
}

module.exports = {
  findUserByUsername,
  createUser,
  validateUser,
  clearUsers
};