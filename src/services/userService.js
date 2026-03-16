const usersData = require("../data/users");
const crypto = require("crypto");

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

  return await usersData.createUser(username, password, "local");
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


// const users = require("../data/users");

// function findUserByUsername(username) {
//   return users.find((user) => user.username === username) || null;
// }

// function createUser(username, password) {
//   if (!username || !password) {
//     throw new Error("Username and password are required.");
//   }

//   const existingUser = findUserByUsername(username);
//   if (existingUser) {
//     throw new Error("User already exists.");
//   }

//   const newUser = { id: users.length + 1, username, password };
//   users.push(newUser);
//   return newUser;
// }

// function validateUser(username, password) {
//   const user = findUserByUsername(username);
//   if (!user) {
//     return null;
//   }

//   return user.password === password ? user : null;
// }

// function clearUsers() {
//   users.length = 0;
// }

// module.exports = {
//   findUserByUsername,
//   createUser,
//   validateUser,
//   clearUsers
// };