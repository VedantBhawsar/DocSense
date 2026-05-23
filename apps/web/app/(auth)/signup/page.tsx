"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001"

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const data = new FormData(e.currentTarget)
    const email = data.get("email") as string
    const password = data.get("password") as string
    const name = data.get("name") as string

    const res = await fetch(`${API_URL}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      setError(body.error ?? "Signup failed")
      setLoading(false)
      return
    }

    const result = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError("Account created but sign-in failed. Please log in.")
      router.push("/login")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <h1>Create account</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input name="name" type="text" required style={{ display: "block", width: "100%", marginBottom: 12 }} />
        </div>
        <div>
          <label>Email</label>
          <input name="email" type="email" required style={{ display: "block", width: "100%", marginBottom: 12 }} />
        </div>
        <div>
          <label>Password</label>
          <input name="password" type="password" minLength={8} required style={{ display: "block", width: "100%", marginBottom: 12 }} />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <hr style={{ margin: "24px 0" }} />
      <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} style={{ width: "100%" }}>
        Sign up with Google
      </button>
      <p style={{ marginTop: 16 }}>
        Already have an account? <a href="/login">Sign in</a>
      </p>
    </div>
  )
}
