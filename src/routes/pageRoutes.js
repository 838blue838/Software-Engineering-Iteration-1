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

router.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/about.html"));
});

router.get("/profile", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/profile.html"));
});

module.exports = router;
