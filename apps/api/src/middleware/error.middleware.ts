import type { ErrorRequestHandler } from "express"

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const status: number = (err as { status?: number }).status ?? 500
  const message: string = err instanceof Error ? err.message : "Internal server error"
  res.status(status).json({ error: message })
}
