import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"
import { JWT_SECRET } from "../config/env.js"

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed token" })
    return
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { sub: string; email: string }
    req.user = { id: payload.sub, email: payload.email }
    next()
  } catch {
    res.status(401).json({ error: "Invalid or expired token" })
  }
}
