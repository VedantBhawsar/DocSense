import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getOrCreateChatHandler,
  getMessagesHandler,
  sendMessageHandler,
  exportChatHandler,
} from "../controllers/chat.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", getOrCreateChatHandler);
router.get("/:chatId/messages", getMessagesHandler);
router.get("/:chatId/export", exportChatHandler);
router.post("/:chatId/messages", sendMessageHandler);

export { router as chatRouter };
