import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  uploadDocumentHandler,
  listDocumentsHandler,
  deleteDocumentHandler,
} from "../controllers/document.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", upload.single("file"), uploadDocumentHandler);
router.get("/", listDocumentsHandler);
router.delete("/:id", deleteDocumentHandler);

export { router as documentRouter };
