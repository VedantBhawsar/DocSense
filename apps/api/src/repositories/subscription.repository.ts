import { db, subscriptions, usage } from "@docsense/db";
import { eq, and, sql } from "drizzle-orm";

export async function getSubscription(userId: string) {
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  return row ?? null;
}

export async function upsertSubscription(data: {
  userId: string;
  plan: string;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: Date | null;
}) {
  const [row] = await db
    .insert(subscriptions)
    .values(data)
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        plan: data.plan,
        status: data.status,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        currentPeriodEnd: data.currentPeriodEnd,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row!;
}

export async function getUsage(userId: string, month: string) {
  const [row] = await db
    .select()
    .from(usage)
    .where(and(eq(usage.userId, userId), eq(usage.month, month)));
  return row ?? null;
}

export async function incrementUsage(userId: string, month: string, field: "documentCount" | "messageCount") {
  const col = field === "documentCount" ? usage.documentCount : usage.messageCount;
  await db
    .insert(usage)
    .values({ userId, month, documentCount: 0, messageCount: 0 })
    .onConflictDoUpdate({
      target: [usage.userId, usage.month],
      set: { [field === "documentCount" ? "document_count" : "message_count"]: sql`${col} + 1` },
    });
}
