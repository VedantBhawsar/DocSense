import dotenv from 'dotenv'

dotenv.config()

export const PORT: number = Number(process.env["PORT"]) || 3001
export const DATABASE_URL = process.env["DATABASE_URL"] ?? ""
export const JWT_SECRET = process.env["JWT_SECRET"] ?? "dev-secret-change-in-production"
export const JWT_EXPIRES_IN = process.env["JWT_EXPIRES_IN"] ?? "15m"
export const JWT_REFRESH_SECRET = process.env["JWT_REFRESH_SECRET"] ?? "dev-refresh-secret-change-in-production"
export const JWT_REFRESH_EXPIRES_IN = process.env["JWT_REFRESH_EXPIRES_IN"] ?? "7d"
export const INTERNAL_SECRET = process.env["INTERNAL_SECRET"] ?? "dev-internal-secret"