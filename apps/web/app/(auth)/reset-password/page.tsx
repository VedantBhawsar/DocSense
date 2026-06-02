"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react"
import { AuthLayout } from "@/components/layout/AuthLayout"

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001"

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const router = useRouter()
  const params = use(searchParams)
  const token = params.token

  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Invalid Link</h2>
            <p className="text-muted-foreground">This password reset link is missing or invalid.</p>
          </div>
          <Link href="/forgot-password">
            <Button className="w-full h-12 text-base font-medium">Request a new link</Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Failed to reset password. The link might be expired.")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center animate-fade-in-up">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Password reset!</h2>
            <p className="text-muted-foreground">
              Your password has been successfully updated. Redirecting you to login...
            </p>
          </div>
          <div className="pt-6">
            <Link href="/login">
              <Button className="w-full h-12 text-base font-medium">
                Continue to login <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center lg:text-left">
          <h2 className="text-3xl font-bold tracking-tight">Create new password</h2>
          <p className="text-muted-foreground">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min. 8 characters"
                minLength={8}
                required
                className="h-12 bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                minLength={8}
                required
                className="h-12 bg-background/50 focus:bg-background transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3 animate-scale-in">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all" disabled={loading}>
            {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            Reset password
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}