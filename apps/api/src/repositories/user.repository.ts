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
}
