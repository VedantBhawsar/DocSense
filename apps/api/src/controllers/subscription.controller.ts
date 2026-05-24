import type { Request, Response } from "express";
import { getUserPlan } from "../services/subscription.service.js";
import { getSubscription } from "../repositories/subscription.repository.js";

export async function getSubscriptionHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const data = await getUserPlan(userId);
    res.json(data);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}
