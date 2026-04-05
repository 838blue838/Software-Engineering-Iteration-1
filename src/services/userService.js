const crypto = require("crypto");
const usersData = require("../data/users");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function isValidPassword(password) {
  if (!password || password.length < 3) {
    return false;
  }

  const hasCapital = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  return hasCapital && hasNumber;
}

async function createUser(username, password) {
  if (!username || !password) {
    throw new Error("Username and password are required.");
  }

  const existingUser = await usersData.findUserByUsername(username);

  if (existingUser) {
    throw new Error("User already exists.");
  }

  const isCasPlaceholder = password === "CAS_AUTH_ONLY";

  if (!isCasPlaceholder && !isValidPassword(password)) {
    throw new Error("Password must be at least 3 characters long and include 1 capital letter and 1 number.");
  }

  return await usersData.createUser(username, hashPassword(password), isCasPlaceholder ? "cas" : "local");
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