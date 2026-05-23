import type { Request, Response, NextFunction } from "express";
import {
  uploadDocument,
  listDocuments,
  removeDocument,
} from "../services/document.service.js";

export async function uploadDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const doc = await uploadDocument(req.user!.id, req.file);
    res.status(201).json({ document: doc });
  } catch (err) {
    next(err);
  }
}

export async function listDocumentsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const docs = await listDocuments(req.user!.id);
    res.json({ documents: docs });
  } catch (err) {
    next(err);
  }
}

export async function deleteDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params as { id: string };
    const doc = await removeDocument(req.user!.id, id);
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    res.json({ message: "Document deleted" });
  } catch (err) {
    if (err instanceof Error && err.message === "Forbidden") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next(err);
  }
}
