const express = require("express");
const chatController = require("../controllers/chatController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/new", requireAuth, chatController.newConversation);
router.post("/message", requireAuth, chatController.sendMessage);
router.get("/history", requireAuth, chatController.getHistory);
router.get("/conversation/:id", requireAuth, chatController.getConversation);
router.get("/search", requireAuth, chatController.searchConversations);

module.exports = router;
