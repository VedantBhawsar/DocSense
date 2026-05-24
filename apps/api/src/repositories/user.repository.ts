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

  async setVerificationToken(email: string, token: string, expiry: Date) {
    const rows = await db.update(users).set({ verificationToken: token, verificationTokenExpiry: expiry }).where(eq(users.email, email)).returning()
    return rows[0]
  },

  async findByVerificationToken(token: string) {
    const rows = await db.select().from(users).where(eq(users.verificationToken, token)).limit(1)
    return rows[0]
  },

  async markEmailVerified(id: string) {
    const rows = await db.update(users).set({ emailVerified: true, verificationToken: null, verificationTokenExpiry: null }).where(eq(users.id, id)).returning()
    return rows[0]
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

  async updateName(id: string, name: string) {
    const rows = await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, id)).returning()
    return rows[0]
  },
}
