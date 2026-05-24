import { auth } from "../auth"

const API_URL = process.env.API_URL ?? process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001"

export async function apiClient(path: string, options?: RequestInit) {
  const session = await auth()
  const accessToken = (session as { accessToken?: string } | null)?.accessToken

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options?.headers,
    },
  })
}

export async function sendOtp(email: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || "Failed to send OTP")
  }
  return res.json()
}

export async function verifyOtp(email: string, otp: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || "Failed to verify OTP")
  }
  return res.json()
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || "Failed to send reset email")
  }
  return res.json()
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || "Failed to reset password")
  }
  return res.json()
}
