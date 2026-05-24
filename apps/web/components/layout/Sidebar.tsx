"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { FileText, Home, LogOut, Sun, Moon, CreditCard, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog"

const navLinks = [
  { href: "/", label: "Documents", icon: Home },
  { href: "/billing", label: "Billing", icon: CreditCard },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)
  const [profileEditOpen, setProfileEditOpen] = useState(false)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <FileText className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-base font-semibold tracking-tight">DocSense</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
              pathname === href
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3 shrink-0">
        {session?.user && (
          <button
            onClick={() => setProfileEditOpen(true)}
            className="mb-2 flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-sidebar-accent/50 cursor-pointer"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {(session.user.name ?? session.user.email ?? "?")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-medium leading-tight">
                {session.user.name ?? "User"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {session.user.email}
              </p>
            </div>
            <User className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40" />
          </button>
        )}
        <div className="flex items-center gap-1 mb-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={() => setSignOutConfirmOpen(true)}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={signOutConfirmOpen}
        onOpenChange={setSignOutConfirmOpen}
        title="Sign out"
        description="Are you sure you want to sign out?"
        confirmText="Sign out"
        variant="default"
        onConfirm={() => signOut({ callbackUrl: "/login" })}
      />
      <ProfileEditDialog
        open={profileEditOpen}
        onOpenChange={setProfileEditOpen}
      />
    </div>
  )
}
