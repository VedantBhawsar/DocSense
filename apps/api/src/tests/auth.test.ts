import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import request from "supertest"
import express from "express"
import jwt from "jsonwebtoken"

const JWT_SECRET = "dev-secret-change-in-production"
const JWT_REFRESH_SECRET = "dev-refresh-secret-change-in-production"
const INTERNAL_SECRET = "dev-internal-secret"

vi.mock("@docsense/db", () => {
  const mockDb = vi.fn()
  const mockUsers = vi.fn()
  return { db: mockDb, users: mockUsers }
})

vi.mock("../repositories/user.repository.js", () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateName: vi.fn(),
  },
}))

vi.mock("../services/otp.service.js", () => ({
  otpService: {
    sendOTP: vi.fn().mockResolvedValue(undefined),
    verifyOTP: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock("../lib/email.service.js", () => ({
  emailService: {
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock("../config/env.js", () => ({
  JWT_SECRET: "dev-secret-change-in-production",
  JWT_EXPIRES_IN: "15m",
  JWT_REFRESH_SECRET: "dev-refresh-secret-change-in-production",
  JWT_REFRESH_EXPIRES_IN: "7d",
  INTERNAL_SECRET: "dev-internal-secret",
  PORT: 3001,
  DATABASE_URL: "",
  SMTP_HOST: "",
  SMTP_PORT: 587,
  SMTP_USER: "",
  SMTP_PASS: "",
  SMTP_FROM: "",
  APP_URL: "http://localhost:3000",
  MINIO_ENDPOINT: "localhost",
  MINIO_PORT: 9000,
  MINIO_ACCESS_KEY: "minioadmin",
  MINIO_SECRET_KEY: "minioadmin",
  MINIO_BUCKET: "docs",
  MINIO_USE_SSL: false,
}))

import { apiRouter } from "../routes/index.js"
import { errorMiddleware } from "../middleware/error.middleware.js"
import { userRepository } from "../repositories/user.repository.js"
import { otpService } from "../services/otp.service.js"
import { emailService } from "../lib/email.service.js"
import argon2 from "argon2"

type MockUser = {
  id: string
  email: string
  name: string
  passwordHash: string | null
  emailVerified: boolean
  verificationToken: string | null
  verificationTokenExpiry: Date | null
  resetToken: string | null
  resetTokenExpiry: Date | null
  createdAt: Date
  updatedAt: Date
}

function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    passwordHash: null,
    emailVerified: false,
    verificationToken: null,
    verificationTokenExpiry: null,
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

const app = express()
app.use(express.json())
app.use("/api/v1", apiRouter)
app.use(errorMiddleware)

describe("Auth Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("POST /api/v1/auth/signup", () => {
    it("should create a new user and return 201", async () => {
      const mockUser = createMockUser()

      vi.mocked(userRepository.findByEmail).mockResolvedValue(null as any)
      vi.mocked(userRepository.create).mockResolvedValue(mockUser as any)
      vi.mocked(otpService.sendOTP).mockResolvedValue(undefined)

      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty("user")
      expect(response.body.user.email).toBe("test@example.com")
      expect(response.body).toHaveProperty("needsVerification", true)
    })

    it("should return 409 if email already exists", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        id: "existing-user",
        email: "test@example.com",
        name: "Existing User",
      } as any)

      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        })

      expect(response.status).toBe(409)
    })

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          name: "Test User",
          email: "invalid-email",
          password: "password123",
        })

      expect(response.status).toBe(400)
    })

    it("should return 400 if password is less than 8 characters", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "short",
        })

      expect(response.status).toBe(400)
    })

    it("should return 400 if name is missing", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "test@example.com",
          password: "password123",
        })

      expect(response.status).toBe(400)
    })
  })

  describe("POST /api/v1/auth/login", () => {
    it("should login user and return tokens", async () => {
      const passwordHash = await argon2.hash("password123")
      const mockUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        passwordHash,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("accessToken")
      expect(response.body).toHaveProperty("refreshToken")
      expect(response.body.user.email).toBe("test@example.com")
    })

    it("should return 401 for invalid credentials - wrong password", async () => {
      const passwordHash = await argon2.hash("password123")
      const mockUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        passwordHash,
        emailVerified: true,
      }

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe("Invalid credentials")
    })

    it("should return 401 for non-existent user", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null as any)

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })

      expect(response.status).toBe(401)
    })

    it("should return 403 if email is not verified", async () => {
      const passwordHash = await argon2.hash("password123")
      const mockUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        passwordHash,
        emailVerified: false,
      }

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe("Please verify your email before logging in.")
    })

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "invalid-email",
          password: "password123",
        })

      expect(response.status).toBe(400)
    })
  })

  describe("GET /api/v1/auth/me", () => {
    it("should return user data when authenticated", async () => {
      const mockUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        passwordHash: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any)

      const token = jwt.sign({ sub: "user-123", email: "test@example.com" }, JWT_SECRET, { expiresIn: "15m" })

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe("user-123")
      expect(response.body.email).toBe("test@example.com")
    })

    it("should return 401 when no token is provided", async () => {
      const response = await request(app).get("/api/v1/auth/me")

      expect(response.status).toBe(401)
    })

    it("should return 401 when token is invalid", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-token")

      expect(response.status).toBe(401)
    })

    it("should return 404 when user not found", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null as any)

      const token = jwt.sign({ sub: "nonexistent-user", email: "test@example.com" }, JWT_SECRET, { expiresIn: "15m" })

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(404)
    })
  })

  describe("POST /api/v1/auth/refresh", () => {
    it("should return new tokens for valid refresh token", async () => {
      const mockUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        passwordHash: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any)

      const refreshToken = jwt.sign({ sub: "user-123", email: "test@example.com" }, JWT_REFRESH_SECRET, { expiresIn: "7d" })

      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("accessToken")
      expect(response.body).toHaveProperty("refreshToken")
    })

    it("should return 400 if refresh token is missing", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe("refreshToken is required")
    })

    it("should return 401 for invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "invalid-token" })

      expect(response.status).toBe(401)
    })

    it("should return 401 when user not found", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null as any)

      const refreshToken = jwt.sign({ sub: "nonexistent-user", email: "test@example.com" }, JWT_REFRESH_SECRET, { expiresIn: "7d" })

      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })

      expect(response.status).toBe(401)
    })
  })

  describe("PATCH /api/v1/auth/profile", () => {
    it("should update user name when authenticated", async () => {
      const mockUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        passwordHash: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedUser = { ...mockUser, name: "Updated Name" }
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any)
      vi.mocked(userRepository.updateName).mockResolvedValue(updatedUser as any)

      const token = jwt.sign({ sub: "user-123", email: "test@example.com" }, JWT_SECRET, { expiresIn: "15m" })

      const response = await request(app)
        .patch("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name" })

      expect(response.status).toBe(200)
      expect(response.body.name).toBe("Updated Name")
    })

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .patch("/api/v1/auth/profile")
        .send({ name: "Updated Name" })

      expect(response.status).toBe(401)
    })

    it("should return 400 when name is missing", async () => {
      const token = jwt.sign({ sub: "user-123", email: "test@example.com" }, JWT_SECRET, { expiresIn: "15m" })

      const response = await request(app)
        .patch("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe("Name is required")
    })

    it("should return 400 when name is empty string", async () => {
      const token = jwt.sign({ sub: "user-123", email: "test@example.com" }, JWT_SECRET, { expiresIn: "15m" })

      const response = await request(app)
        .patch("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "   " })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe("Name is required")
    })
  })

  describe("POST /api/v1/auth/oauth", () => {
    it("should upsert user with valid internal secret", async () => {
      const mockUser = {
        id: "user-123",
        name: "OAuth User",
        email: "oauth@example.com",
        passwordHash: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(userRepository.findByEmail).mockResolvedValue(null as any)
      vi.mocked(userRepository.create).mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post("/api/v1/auth/oauth")
        .set("x-internal-secret", INTERNAL_SECRET)
        .send({
          email: "oauth@example.com",
          name: "OAuth User",
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("accessToken")
      expect(response.body).toHaveProperty("refreshToken")
      expect(response.body.user.email).toBe("oauth@example.com")
    })

    it("should return 403 when internal secret is missing", async () => {
      const response = await request(app)
        .post("/api/v1/auth/oauth")
        .send({
          email: "oauth@example.com",
          name: "OAuth User",
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe("Forbidden")
    })

    it("should return 403 when internal secret is incorrect", async () => {
      const response = await request(app)
        .post("/api/v1/auth/oauth")
        .set("x-internal-secret", "wrong-secret")
        .send({
          email: "oauth@example.com",
          name: "OAuth User",
        })

      expect(response.status).toBe(403)
    })

    it("should update existing user on oauth signin", async () => {
      const mockUser = {
        id: "user-123",
        name: "Existing OAuth User",
        email: "oauth@example.com",
        passwordHash: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post("/api/v1/auth/oauth")
        .set("x-internal-secret", INTERNAL_SECRET)
        .send({
          email: "oauth@example.com",
          name: "Existing OAuth User",
        })

      expect(response.status).toBe(200)
      expect(response.body.user.id).toBe("user-123")
    })
  })

  describe("POST /api/v1/auth/forgot-password", () => {
    it("should send password reset email", async () => {
      vi.mocked(emailService.sendPasswordResetEmail).mockResolvedValue(undefined)

      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "test@example.com" })

      expect(response.status).toBe(200)
      expect(response.body.message).toContain("If an account with that email exists")
    })

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "invalid-email" })

      expect(response.status).toBe(400)
    })
  })

  describe("POST /api/v1/auth/reset-password", () => {
    it("should reset password with valid token", async () => {
      vi.mocked(emailService.resetPassword).mockResolvedValue(undefined)

      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: "valid-reset-token",
          password: "newpassword123",
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toContain("Password has been reset successfully")
    })

    it("should return 400 for invalid token", async () => {
      const err = new Error("Invalid token") as Error & { status: number }
      err.status = 400
      vi.mocked(emailService.resetPassword).mockRejectedValue(err)

      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: "invalid-token",
          password: "newpassword123",
        })

      expect(response.status).toBe(400)
    })

    it("should return 400 if password is less than 8 characters", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: "valid-token",
          password: "short",
        })

      expect(response.status).toBe(400)
    })
  })

  describe("POST /api/v1/auth/send-otp", () => {
    it("should send OTP to email", async () => {
      vi.mocked(otpService.sendOTP).mockResolvedValue(undefined)

      const response = await request(app)
        .post("/api/v1/auth/send-otp")
        .send({ email: "test@example.com" })

      expect(response.status).toBe(200)
      expect(response.body.message).toContain("If an account with that email exists")
    })

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/v1/auth/send-otp")
        .send({ email: "invalid-email" })

      expect(response.status).toBe(400)
    })
  })

  describe("POST /api/v1/auth/verify-otp", () => {
    it("should verify OTP successfully", async () => {
      vi.mocked(otpService.verifyOTP).mockResolvedValue(undefined)

      const response = await request(app)
        .post("/api/v1/auth/verify-otp")
        .send({
          email: "test@example.com",
          otp: "123456",
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe("Email verified successfully.")
    })

    it("should return 400 for invalid OTP format", async () => {
      const response = await request(app)
        .post("/api/v1/auth/verify-otp")
        .send({
          email: "test@example.com",
          otp: "12345", // too short
        })

      expect(response.status).toBe(400)
    })

    it("should return 400 if OTP is not 6 digits", async () => {
      const response = await request(app)
        .post("/api/v1/auth/verify-otp")
        .send({
          email: "test@example.com",
          otp: "1234567", // too long
        })

      expect(response.status).toBe(400)
    })
  })
})