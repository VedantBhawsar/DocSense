import type { Request, Response } from "express";
import { embedQuery } from "../services/embedding.service.js";
import { searchAllChunks } from "../repositories/search.repository.js";

export async function searchHandler(req: Request, res: Response) {
  const q = req.query["q"] as string | undefined;
  if (!q?.trim()) {
    res.status(400).json({ error: "q is required" });
    return;
  }

  try {
    const embedding = await embedQuery(q.trim());
    const results = await searchAllChunks(req.user!.id, embedding);
    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Search failed" });
  }
}
