import argon2 from "argon2"
import jwt from "jsonwebtoken"
import { userRepository } from "../repositories/user.repository.js"
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js"
import type { SignupBody, LoginBody, AuthResponse } from "../types/user.types.js"

function signToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

function makeError(message: string, status: number) {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}

export const userService = {
  async signup(body: SignupBody): Promise<AuthResponse> {
    const existing = await userRepository.findByEmail(body.email)
    if (existing) throw makeError("Email already in use", 409)

    const passwordHash = await argon2.hash(body.password)
    const user = await userRepository.create({ name: body.name, email: body.email, passwordHash })
    const accessToken = signToken(user.id, user.email)

    return { user: { id: user.id, name: user.name, email: user.email }, accessToken }
  },

  async login(body: LoginBody): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(body.email)
    if (!user || !user.passwordHash) throw makeError("Invalid credentials", 401)

    const valid = await argon2.verify(user.passwordHash, body.password)
    if (!valid) throw makeError("Invalid credentials", 401)

    const accessToken = signToken(user.id, user.email)
    return { user: { id: user.id, name: user.name, email: user.email }, accessToken }
  },

  async oauthUpsert(data: { email: string; name: string }): Promise<AuthResponse> {
    let user = await userRepository.findByEmail(data.email)
    if (!user) {
      user = await userRepository.create({ name: data.name, email: data.email, passwordHash: null })
    }
    const accessToken = signToken(user.id, user.email)
    return { user: { id: user.id, name: user.name, email: user.email }, accessToken }
  },
}
