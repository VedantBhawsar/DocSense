import { db, users } from "@docsense/db"
import { eq } from "drizzle-orm"
import type { NewUser } from "@docsense/db"

export const userRepository = {
  async findByEmail(email: string) {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return rows[0]
  },

  async findById(id: string) {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return rows[0]
  },

  async create(data: NewUser) {
    const rows = await db.insert(users).values(data).returning()
    return rows[0]!
  },

  async setResetToken(email: string, token: string, expiry: Date) {
    const rows = await db.update(users).set({ resetToken: token, resetTokenExpiry: expiry }).where(eq(users.email, email)).returning()
    return rows[0]
  },

  async findByResetToken(token: string) {
    const rows = await db.select().from(users).where(eq(users.resetToken, token)).limit(1)
    return rows[0]
  },

  async clearResetToken(id: string) {
    const rows = await db.update(users).set({ resetToken: null, resetTokenExpiry: null }).where(eq(users.id, id)).returning()
    return rows[0]
  },
}
