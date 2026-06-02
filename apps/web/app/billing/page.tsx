"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

type PlanData = {
  plan: string
  limits: { documents: number | null; messages: number | null }
  usage: { documents: number; messages: number }
}

const PLAN_CONFIG = [
  {
    key: "free",
    label: "Free",
    price: "$0/mo",
    features: ["3 documents max", "50 messages/month", "Standard processing"],
  },
  {
    key: "pro",
    label: "Pro",
    price: "$9/mo",
    features: ["Unlimited documents", "Unlimited messages", "Standard processing"],
  },
  {
    key: "enterprise",
    label: "Enterprise",
    price: "$29/mo",
    features: ["Unlimited documents", "Unlimited messages", "Priority processing"],
  },
]

export default function BillingPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<PlanData | null>(null)
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.accessToken) return
    fetch(`${API_URL}/api/v1/subscription`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [session])

  const planLabel = data?.plan
    ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1)
    : "Free"

  const docLimit = data?.limits.documents
  const msgLimit = data?.limits.messages
  const docCount = data?.usage.documents ?? 0
  const msgCount = data?.usage.messages ?? 0

  const docPercent = docLimit ? Math.min(100, (docCount / docLimit) * 100) : 0
  const msgPercent = msgLimit ? Math.min(100, (msgCount / msgLimit) * 100) : 0

  return (
    <DashboardShell headerContent={<h1 className="text-lg font-semibold">Billing</h1>}>
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Your Plan</h1>
              <span 
                className="inline-flex items-center rounded-full text-xs font-semibold px-3 py-1"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                {planLabel}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Usage this month</h2>
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>Documents</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>{docCount} / {docLimit ?? "Unlimited"}</span>
                </div>
                <div className="h-3 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${docPercent}%`, backgroundColor: 'var(--primary)' }} 
                  />
                </div>
              </div>
              <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>Messages</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>{msgCount} / {msgLimit ?? "Unlimited"}</span>
                </div>
                <div className="h-3 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${msgPercent}%`, backgroundColor: 'var(--primary)' }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {upgradeMsg && (
            <p className="text-sm animate-fade-in" style={{ color: 'var(--muted-foreground)' }}>{upgradeMsg}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLAN_CONFIG.map((plan) => {
              const isCurrent = (data?.plan ?? "free") === plan.key
              const isHigher =
                (data?.plan === "free" && (plan.key === "pro" || plan.key === "enterprise")) ||
                (data?.plan === "pro" && plan.key === "enterprise")

              return (
                <div
                  key={plan.key}
                  className={cn(
                    "rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1",
                    isCurrent && "border-2"
                  )}
                  style={{ 
                    backgroundColor: 'var(--card)', 
                    border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>{plan.label}</span>
                    {isCurrent && (
                      <span 
                        className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                        style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{plan.price}</p>
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="text-sm flex gap-2" style={{ color: 'var(--muted-foreground)' }}>
                        <CheckCircle2 className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isHigher && (
                    <button
                      onClick={() => setUpgradeMsg("Stripe integration coming soon")}
                      className="mt-2 w-full rounded-xl text-sm font-semibold py-3 transition-all duration-200 hover:-translate-y-0.5"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                      Upgrade to {plan.label}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}