"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, MailCheck } from "lucide-react"
import { AuthLayout } from "@/components/layout/AuthLayout"

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001"

export default function ForgotPasswordPage() {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Failed to send reset link")
        return
      }

      setSuccess(true)
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
            <MailCheck className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Check your email</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              If an account exists for that email, we have sent a password reset link.
            </p>
          </div>
          <div className="pt-6">
            <Link href="/login">
              <Button variant="outline" className="w-full h-12 text-base font-medium">
                <ArrowLeft className="mr-2 size-4" /> Back to sign in
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
          <h2 className="text-3xl font-bold tracking-tight">Reset password</h2>
          <p className="text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="you@example.com" 
              required 
              className="h-12 bg-background/50 focus:bg-background transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3 animate-scale-in">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all" disabled={loading}>
            {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            Send reset link
          </Button>

          <div className="text-center pt-2">
            <Link href="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="mr-2 size-4" /> Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}