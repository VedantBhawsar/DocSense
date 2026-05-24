import { z } from "zod"

export const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

export interface SignupBody {
  name: string
  email: string
  password: string
}

export interface LoginBody {
  email: string
  password: string
}

export interface AuthResponse {
  user: { id: string; name: string; email: string }
  accessToken: string
  refreshToken: string
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string }
    }
  }
}
