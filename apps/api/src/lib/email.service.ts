import nodemailer from "nodemailer"
import crypto from "crypto"
import argon2 from "argon2"
import { db, users } from "@docsense/db"
import { eq } from "drizzle-orm"
import { userRepository } from "../repositories/user.repository.js"
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, APP_URL } from "../config/env.js"

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})

function makeError(message: string, status: number) {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}

export const emailService = {
  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email)
    if (!user) return

    const token = crypto.randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 60 * 60 * 1000)

    await userRepository.setResetToken(email, token, expiry)

    const resetUrl = `${APP_URL}/reset-password?token=${token}`

    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: "Reset your password",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await userRepository.findByResetToken(token)
    if (!user) throw makeError("Invalid or expired reset token", 400)

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw makeError("Reset token has expired", 400)
    }

    const passwordHash = await argon2.hash(newPassword)
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id))
    await userRepository.clearResetToken(user.id)
  },
}