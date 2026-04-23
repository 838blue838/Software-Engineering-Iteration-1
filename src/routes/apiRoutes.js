const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const chatController = require("../controllers/chatController");

router.get("/chat/models", requireAuth, chatController.getModels);
router.post("/chat/new", requireAuth, chatController.newConversation);
router.get("/chat/conversations", requireAuth, chatController.listConversations);
router.get("/chat/conversations/:id", requireAuth, chatController.getConversation);
router.post("/chat/conversations/:id/message", requireAuth, chatController.sendPrompt);

module.exports = router;