import { db, documents } from "@docsense/db";
import { eq } from "drizzle-orm";
import { getSubscription, getUsage, incrementUsage } from "../repositories/subscription.repository.js";

export const PLANS = {
  free: { documents: 3, messages: 50 },
  pro: { documents: Infinity, messages: Infinity },
  enterprise: { documents: Infinity, messages: Infinity },
} as const;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getUserPlan(userId: string) {
  const [sub, usageRow] = await Promise.all([
    getSubscription(userId),
    getUsage(userId, currentMonth()),
  ]);

  const plan = (sub?.plan ?? "free") as keyof typeof PLANS;
  const limits = PLANS[plan] ?? PLANS.free;

  return {
    plan,
    subscription: sub,
    limits: {
      documents: limits.documents === Infinity ? null : limits.documents,
      messages: limits.messages === Infinity ? null : limits.messages,
    },
    usage: {
      documents: usageRow?.documentCount ?? 0,
      messages: usageRow?.messageCount ?? 0,
    },
  };
}

export async function checkDocumentLimit(userId: string) {
  const sub = await getSubscription(userId);
  const plan = (sub?.plan ?? "free") as keyof typeof PLANS;
  const limits = PLANS[plan] ?? PLANS.free;

  if (limits.documents === Infinity) return;

  const usageRow = await getUsage(userId, currentMonth());
  const count = usageRow?.documentCount ?? 0;

  if (count >= limits.documents) {
    const err = Object.assign(new Error("Document limit reached. Upgrade to Pro."), {
      status: 403,
      code: "DOCUMENT_LIMIT",
    });
    throw err;
  }
}

export async function checkMessageLimit(userId: string) {
  const sub = await getSubscription(userId);
  const plan = (sub?.plan ?? "free") as keyof typeof PLANS;
  const limits = PLANS[plan] ?? PLANS.free;

  if (limits.messages === Infinity) return;

  const usageRow = await getUsage(userId, currentMonth());
  const count = usageRow?.messageCount ?? 0;

  if (count >= limits.messages) {
    const err = Object.assign(new Error("Monthly message limit reached. Upgrade to Pro."), {
      status: 403,
      code: "MESSAGE_LIMIT",
    });
    throw err;
  }
}

export { incrementUsage, currentMonth };
