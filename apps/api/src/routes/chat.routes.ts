import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getOrCreateChatHandler,
  getMessagesHandler,
  sendMessageHandler,
  exportChatHandler,
  toggleShareHandler,
  getSharedChatHandler,
} from "../controllers/chat.controller.js";

const router = Router();

// Public shared-chat endpoint (no auth required)
router.get("/share/:shareToken", getSharedChatHandler);

router.use(authenticate);

router.post("/", getOrCreateChatHandler);
router.post("/:chatId/share", toggleShareHandler);
router.get("/:chatId/messages", getMessagesHandler);
router.get("/:chatId/export", exportChatHandler);
router.post("/:chatId/messages", sendMessageHandler);

export { router as chatRouter };
