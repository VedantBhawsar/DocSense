"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"

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
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Billing</h1>
        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5">
          {planLabel} Plan
        </span>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Usage</h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Documents</span>
              <span>{docCount} / {docLimit ?? "Unlimited"}</span>
            </div>
            {docLimit ? (
              <Progress value={docPercent} />
            ) : (
              <div className="h-1.5 w-full rounded-full bg-muted" />
            )}
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Messages this month</span>
              <span>{msgCount} / {msgLimit ?? "Unlimited"}</span>
            </div>
            {msgLimit ? (
              <Progress value={msgPercent} />
            ) : (
              <div className="h-1.5 w-full rounded-full bg-muted" />
            )}
          </div>
        </div>
      </div>

      {upgradeMsg && (
        <p className="text-sm text-muted-foreground">{upgradeMsg}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLAN_CONFIG.map((plan) => {
          const isCurrent = (data?.plan ?? "free") === plan.key
          const isHigher =
            (data?.plan === "free" && (plan.key === "pro" || plan.key === "enterprise")) ||
            (data?.plan === "pro" && plan.key === "enterprise")

          return (
            <div
              key={plan.key}
              className={`rounded-xl border p-5 flex flex-col gap-3 ${isCurrent ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{plan.label}</span>
                {isCurrent && (
                  <span className="text-xs font-semibold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold">{plan.price}</p>
              <ul className="space-y-1 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-muted-foreground flex gap-1.5">
                    <span>•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {isHigher && (
                <button
                  onClick={() => setUpgradeMsg("Stripe integration coming soon")}
                  className="mt-2 w-full rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2 hover:bg-primary/90 transition-colors"
                >
                  Upgrade
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
