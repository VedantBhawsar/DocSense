"use client"

import { SessionProvider, useSession, signOut } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { useEffect } from "react"

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/login" })
    }
  }, [session?.error])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <SessionGuard>{children}</SessionGuard>
      </SessionProvider>
    </ThemeProvider>
  )
}
