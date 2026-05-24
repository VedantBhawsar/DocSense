import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { searchHandler } from "../controllers/search.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", searchHandler);

export { router as searchRouter };
