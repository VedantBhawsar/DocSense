import argon2 from "argon2"
import jwt from "jsonwebtoken"
import { userRepository } from "../repositories/user.repository.js"
import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } from "../config/env.js"
import { otpService } from "./otp.service.js"
import type { SignupBody, LoginBody, AuthResponse } from "../types/user.types.js"

function signToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

function signRefreshToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions)
}

function makeError(message: string, status: number) {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}

export const userService = {
  async signup(body: SignupBody): Promise<AuthResponse & { needsVerification: boolean }> {
    const existing = await userRepository.findByEmail(body.email)
    if (existing) throw makeError("Email already in use", 409)

    const passwordHash = await argon2.hash(body.password)
    const user = await userRepository.create({ name: body.name, email: body.email, passwordHash })
    await otpService.sendOTP(body.email)

    return {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken: "",
      refreshToken: "",
      needsVerification: true,
    }
  },

  async login(body: LoginBody): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(body.email)
    if (!user || !user.passwordHash) throw makeError("Invalid credentials", 401)

    const valid = await argon2.verify(user.passwordHash, body.password)
    if (!valid) throw makeError("Invalid credentials", 401)

    if (!user.emailVerified) {
      throw makeError("Please verify your email before logging in.", 403)
    }

    const accessToken = signToken(user.id, user.email)
    const refreshToken = signRefreshToken(user.id, user.email)
    return { user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken }
  },

  async oauthUpsert(data: { email: string; name: string }): Promise<AuthResponse> {
    let user = await userRepository.findByEmail(data.email)
    if (!user) {
      user = await userRepository.create({ name: data.name, email: data.email, passwordHash: null })
    }
    const accessToken = signToken(user.id, user.email)
    const refreshToken = signRefreshToken(user.id, user.email)
    return { user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken }
  },

  async refreshTokens(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string; email: string }
    try {
      payload = jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string; email: string }
    } catch {
      throw makeError("Invalid or expired refresh token", 401)
    }

    const user = await userRepository.findById(payload.sub)
    if (!user) throw makeError("User not found", 401)

    return {
      accessToken: signToken(user.id, user.email),
      refreshToken: signRefreshToken(user.id, user.email),
    }
  },

  async updateName(userId: string, name: string) {
    const user = await userRepository.findById(userId)
    if (!user) throw makeError("User not found", 404)

    const updated = await userRepository.updateName(userId, name)
    return { id: updated.id, name: updated.name, email: updated.email }
  },
}
