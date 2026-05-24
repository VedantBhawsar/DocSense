import type { Request, Response, NextFunction } from "express"
import { userService } from "../services/user.service.js"
import { userRepository } from "../repositories/user.repository.js"
import { emailService } from "../lib/email.service.js"
import { otpService } from "../services/otp.service.js"
import { INTERNAL_SECRET } from "../config/env.js"
import type { SignupBody, LoginBody } from "../types/user.types.js"

export const userController = {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.signup(req.body as SignupBody)
      res.status(201).json(result)
    } catch (err) {
      console.log("error", err)

      next(err)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.login(req.body as LoginBody)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userRepository.findById(req.user!.id)
      if (!user) {
        res.status(404).json({ error: "User not found" })
        return
      }
      res.json({ id: user.id, name: user.name, email: user.email })
    } catch (err) {
      next(err)
    }
  },

  async oauthSignin(req: Request, res: Response, next: NextFunction) {
    try {
      const secret = req.headers["x-internal-secret"]
      if (secret !== INTERNAL_SECRET) {
        res.status(403).json({ error: "Forbidden" })
        return
      }
      const { email, name } = req.body as { email: string; name: string }
      const result = await userService.oauthUpsert({ email, name })
      res.json(result)
    } catch (err) {
      next(err)
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body as { refreshToken?: string }
      if (!refreshToken) {
        res.status(400).json({ error: "refreshToken is required" })
        return
      }
      const tokens = await userService.refreshTokens(refreshToken)
      res.json(tokens)
    } catch (err) {
      next(err)
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body as { email: string }
      await emailService.sendPasswordResetEmail(email)
      res.json({ message: "If an account with that email exists, a password reset link has been sent." })
    } catch (err) {
      next(err)
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body as { token: string; password: string }
      await emailService.resetPassword(token, password)
      res.json({ message: "Password has been reset successfully." })
    } catch (err) {
      next(err)
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body as { name?: string }
      if (!name || !name.trim()) {
        res.status(400).json({ error: "Name is required" })
        return
      }
      const result = await userService.updateName(req.user!.id, name.trim())
      res.json(result)
    } catch (err) {
      next(err)
    }
  },

  async sendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body as { email: string }
      await otpService.sendOTP(email)
      res.json({ message: "If an account with that email exists, a verification code has been sent." })
    } catch (err) {
      next(err)
    }
  },

  async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body as { email: string; otp: string }
      await otpService.verifyOTP(email, otp)
      res.json({ message: "Email verified successfully." })
    } catch (err) {
      next(err)
    }
  },
}
