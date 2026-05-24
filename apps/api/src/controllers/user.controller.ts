import type { Request, Response, NextFunction } from "express"
import { userService } from "../services/user.service.js"
import { userRepository } from "../repositories/user.repository.js"
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
}
