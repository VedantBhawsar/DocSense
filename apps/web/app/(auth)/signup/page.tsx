"use client"

import { useState, useEffect, useRef } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, User } from "lucide-react"
import { AuthLayout } from "@/components/layout/AuthLayout"

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001"

type Step = "form" | "verification"

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [step, setStep] = useState<Step>("form")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [countdown, setCountdown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const data = new FormData(e.currentTarget)
    const emailVal = data.get("email") as string
    const password = data.get("password") as string
    const name = data.get("name") as string

    const res = await fetch(`${API_URL}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: emailVal, password }),
    })

    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      setError(body.error ?? "Signup failed")
      setLoading(false)
      return
    }

    const result = await res.json() as { needsVerification: boolean }
    if (result.needsVerification) {
      setEmail(emailVal)
      setStep("verification")
      setCountdown(60)
    }
    setLoading(false)
  }

  async function handleResendOTP() {
    setResendLoading(true)
    const res = await fetch(`${API_URL}/api/v1/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setResendLoading(false)
    if (res.ok) {
      setCountdown(60)
      setOtp(["", "", "", "", "", ""])
      otpRefs.current[0]?.focus()
    }
  }

  async function handleVerifyOTP() {
    setVerifyLoading(true)
    setError("")
    const otpVal = otp.join("")
    if (otpVal.length !== 6) {
      setError("Please enter a complete 6-digit code")
      setVerifyLoading(false)
      return
    }

    const res = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: otpVal }),
    })

    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      setError(body.error ?? "Verification failed")
      setVerifyLoading(false)
      return
    }

    const loginResult = await signIn("credentials", { email, password: "", redirect: false })
    setVerifyLoading(false)
    if (loginResult?.error) {
      router.push("/login")
    } else {
      router.push("/")
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      handleVerifyOTP()
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn("google", { callbackUrl: "/" })
  }

  if (step === "verification") {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <div className="space-y-2 text-center lg:text-left animate-fade-in-up">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Verify your email</h2>
            <p style={{ color: 'var(--muted-foreground)' }}>
              We sent a code to <strong style={{ color: 'var(--foreground)' }}>{email}</strong>
            </p>
          </div>

          <div className="space-y-6 mt-8 animate-fade-in-up animate-stagger-1">
            <div className="flex gap-2 justify-center lg:justify-start">
              {otp.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-semibold"
                  style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--input)' }}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-center lg:text-left animate-scale-in" style={{ color: 'var(--destructive)' }}>
                {error}
              </p>
            )}

            <Button
              type="button"
              className="w-full h-12 text-base font-medium"
              onClick={handleVerifyOTP}
              disabled={verifyLoading || otp.join("").length !== 6}
            >
              {verifyLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Verify code
            </Button>

            <div className="text-center lg:text-left text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {countdown > 0 ? (
                <span>Resend code in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="font-medium disabled:opacity-50"
                  style={{ color: 'var(--primary)' }}
                >
                  {resendLoading ? "Sending..." : "Resend code"}
                </button>
              )}
            </div>

            <p className="text-center lg:text-left text-sm" style={{ color: 'var(--muted-foreground)' }}>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="font-medium"
                style={{ color: 'var(--primary)' }}
              >
                Use a different email
              </button>
            </p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center lg:text-left">
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Create an account</h2>
          <p style={{ color: 'var(--muted-foreground)' }}>Get started for free, no credit card required</p>
        </div>

        <div className="space-y-5 mt-8">
          <Button
            variant="outline"
            className="w-full h-12 text-base font-medium bg-background/80 hover:bg-muted transition-all duration-200"
            style={{ borderColor: 'var(--border)' }}
            onClick={handleGoogle}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Full name</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
                <Input 
                  id="name" 
                  name="name" 
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  className="h-12 pl-10 bg-background/50 focus:bg-background transition-colors"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                  className="h-12 pl-10 bg-background/50 focus:bg-background transition-colors"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                  className="h-12 pl-10 bg-background/50 focus:bg-background transition-colors"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm animate-scale-in" style={{ color: 'var(--destructive)' }}>
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading || googleLoading}>
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Create account
            </Button>
          </form>

          <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium" style={{ color: 'var(--primary)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}