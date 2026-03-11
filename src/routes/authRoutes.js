const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

router.get("/cas", authController.casLogin);
router.get("/cas/callback", authController.casCallback);

module.exports = router;