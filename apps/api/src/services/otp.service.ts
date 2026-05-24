import crypto from "crypto"
import { userRepository } from "../repositories/user.repository.js"
import { emailService } from "../lib/email.service.js"

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

function makeError(message: string, status: number) {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}

export const otpService = {
  async sendOTP(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email)
    if (!user) return

    const otp = generateOTP()
    const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    await userRepository.setVerificationToken(email, otp, expiry)
    await emailService.sendVerificationEmail(email, otp)
  },

  async verifyOTP(email: string, otp: string): Promise<void> {
    const user = await userRepository.findByEmail(email)
    if (!user) throw makeError("Invalid OTP", 400)

    if (!user.verificationToken || user.verificationToken !== otp) {
      throw makeError("Invalid OTP", 400)
    }

    if (!user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
      throw makeError("OTP has expired. Please request a new one.", 400)
    }

    await userRepository.markEmailVerified(user.id)
  },
}