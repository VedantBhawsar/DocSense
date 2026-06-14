"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { FileText, Home, LogOut, Sun, Moon, CreditCard } from "lucide-react"
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
    <div className="flex h-full flex-col border-r" style={{ backgroundColor: 'var(--sidebar)', borderColor: 'var(--sidebar-border)' }}>
      <div className="flex h-14 items-center gap-3 px-4 shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <FileText className="size-4 text-primary-foreground" />
        </div>
        <span className="text-base font-semibold text-sidebar-foreground">DocSense</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Main navigation">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
              )}
              style={isActive ? { backgroundColor: 'var(--sidebar-accent)' } : {}}
            >
              {isActive && (
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" 
                  style={{ backgroundColor: 'var(--sidebar-primary)' }} 
                />
              )}
              <Icon className={cn("size-4 shrink-0", isActive ? "text-sidebar-primary" : "")} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--sidebar-accent)' }}>
          {session?.user && (
            <button
              onClick={() => setProfileEditOpen(true)}
              className="flex w-full items-center gap-3 rounded-lg p-2 transition-all cursor-pointer mb-1 group hover:opacity-80"
            >
              <div 
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold bg-primary text-primary-foreground"
              >
                {(session.user.name ?? session.user.email ?? "?")[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium" style={{ color: 'var(--sidebar-foreground)' }}>
                  {session.user.name ?? "User"}
                </p>
                <p className="truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {session.user.email}
                </p>
              </div>
            </button>
          )}
          <div className="flex items-center gap-1 pt-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start gap-2 h-8 text-xs"
              style={{ color: 'var(--muted-foreground)' }}
              onClick={() => setSignOutConfirmOpen(true)}
              aria-label="Sign out"
            >
              <LogOut className="size-3.5" />
              <span className="font-medium">Sign out</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              style={{ color: 'var(--muted-foreground)' }}
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
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