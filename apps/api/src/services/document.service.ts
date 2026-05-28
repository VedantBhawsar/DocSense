import fs from "fs";
import {
  createDocument,
  getDocumentsByUser,
  getDocumentById,
  deleteDocument,
  renameDocument as renameDocumentRepo,
  updateDocumentStatus,
  countDocumentsByUser,
} from "../repositories/document.repository.js";
import { createPdfQueue } from "@docsense/queue";
import { uploadFile, deleteFile as deleteMinioFile } from "../lib/minio.js";

const pdfQueue = createPdfQueue();

export async function uploadDocument(
  userId: string,
  file: Express.Multer.File
) {
  const count = await countDocumentsByUser(userId);
  if (count >= 2) {
    const err = Object.assign(new Error("You can only upload 2 documents. Please delete an existing document to upload a new one."), {
      status: 403,
      code: "DOCUMENT_LIMIT",
    });
    throw err;
  }

  const fileBuffer = fs.readFileSync(file.path);
  const storageKey = await uploadFile(fileBuffer, file.originalname, file.mimetype);

  const doc = await createDocument({
    userId,
    name: file.originalname,
    mimeType: file.mimetype,
    storagePath: storageKey,
    status: "pending",
  });

  fs.unlinkSync(file.path);

  await pdfQueue.add("process-pdf", {
    documentId: doc.id,
    userId,
    storagePath: storageKey,
    mimeType: file.mimetype,
    fileName: file.originalname,
  });

  return doc;
}

export async function listDocuments(userId: string) {
  return getDocumentsByUser(userId);
}

export async function renameDocument(userId: string, documentId: string, name: string) {
  const doc = await getDocumentById(documentId);
  if (!doc) return null;
  if (doc.userId !== userId) throw new Error("Forbidden");
  return renameDocumentRepo(documentId, name);
}

export async function retryDocument(userId: string, documentId: string) {
  const doc = await getDocumentById(documentId);
  if (!doc) throw Object.assign(new Error("Not found"), { status: 404 });
  if (doc.userId !== userId) throw Object.assign(new Error("Forbidden"), { status: 403 });
  if (doc.status !== "failed") throw Object.assign(new Error("Document is not in failed state"), { status: 400 });
  const updated = await updateDocumentStatus(documentId, "pending");
  await pdfQueue.add("process-pdf", {
    documentId: doc.id,
    userId,
    storagePath: doc.storagePath,
    mimeType: doc.mimeType,
    fileName: doc.name,
  });
  return updated;
}

export async function removeDocument(userId: string, documentId: string) {
  const doc = await getDocumentById(documentId);
  if (!doc) return null;
  if (doc.userId !== userId) throw new Error("Forbidden");

  await deleteMinioFile(doc.storagePath);

  await deleteDocument(documentId);
  return doc;
}
