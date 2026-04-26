const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);

router.post("/new", chatController.newConversation);
router.get("/conversations", chatController.getConversations);
router.get("/conversations/:id", chatController.getConversation);
router.post("/conversations/:id/message", chatController.sendMessage);
router.post("/conversations/:id/context", chatController.setContext);
router.get("/conversations/:id/context", chatController.getContextStatus);
router.get("/search", chatController.searchConversations);
router.get("/models", chatController.listModels);

module.exports = router;