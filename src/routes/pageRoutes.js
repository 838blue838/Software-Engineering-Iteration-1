const express = require("express");
const path = require("path");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/signup.html"));
});

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/login.html"));
});

router.get("/dashboard", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard.html"));
});

router.get("/chat", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/chat.html"));
});

router.get("/history", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/history.html"));
});

router.get("/about", (req, res) => {
  return res.redirect("/");
});

router.get("/profile", requireAuth, (req, res) => {
  return res.redirect("/dashboard");
});

module.exports = router;