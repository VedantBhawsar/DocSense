import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getSubscriptionHandler } from "../controllers/subscription.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", getSubscriptionHandler);

export { router as subscriptionRouter };
