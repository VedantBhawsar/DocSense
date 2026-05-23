import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getOrCreateChatHandler,
  getMessagesHandler,
  sendMessageHandler,
} from "../controllers/chat.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", getOrCreateChatHandler);
router.get("/:chatId/messages", getMessagesHandler);
router.post("/:chatId/messages", sendMessageHandler);

export { router as chatRouter };
