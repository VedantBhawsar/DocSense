"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const data = new FormData(e.currentTarget)
    const result = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError("Invalid email or password")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input name="email" type="email" required style={{ display: "block", width: "100%", marginBottom: 12 }} />
        </div>
        <div>
          <label>Password</label>
          <input name="password" type="password" required style={{ display: "block", width: "100%", marginBottom: 12 }} />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <hr style={{ margin: "24px 0" }} />
      <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} style={{ width: "100%" }}>
        Sign in with Google
      </button>
      <p style={{ marginTop: 16 }}>
        No account? <a href="/signup">Sign up</a>
      </p>
    </div>
  )
}
