"use client"

import { useState, useEffect } from "react"
import { Menu, Search } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { SearchModal } from "@/components/search/SearchModal"
import { cn } from "@/lib/utils"

export function DashboardShell({
  children,
  headerContent,
}: {
  children: React.ReactNode
  headerContent?: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-border">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-200 ease-in-out md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main panel */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
          <button
            className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center">
            {headerContent}
          </div>
          <button
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
            onClick={() => setSearchOpen(true)}
            aria-label="Search documents"
          >
            <Search className="h-5 w-5" />
          </button>
        </header>
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
