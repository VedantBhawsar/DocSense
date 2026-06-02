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
    <div className="flex h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden transition-opacity"
          style={{ backgroundColor: 'var(--foreground)', opacity: 0.3 }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 md:hidden",
        )}
        style={{
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          backgroundColor: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)'
        }}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main panel */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header 
          className="flex h-14 shrink-0 items-center gap-3 px-5 z-10"
          style={{ 
            backgroundColor: 'var(--background)',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <button
            className="md:hidden rounded-lg p-2 -ml-2 transition-colors duration-150"
            style={{ color: 'var(--muted-foreground)' }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex flex-1 items-center">
            {headerContent}
          </div>
          
          <button
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors duration-150"
            style={{ 
              backgroundColor: 'var(--muted)', 
              color: 'var(--muted-foreground)',
              border: '1px solid var(--border)'
            }}
            onClick={() => setSearchOpen(true)}
            aria-label="Search documents"
          >
            <Search className="size-4" />
            <span>Search...</span>
            <kbd 
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium font-mono ml-2"
              style={{ 
                backgroundColor: 'var(--background)', 
                border: '1px solid var(--border)',
                color: 'var(--muted-foreground)'
              }}
            >
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
          
          <button
            className="sm:hidden rounded-lg p-2 -mr-2 transition-colors duration-150"
            style={{ color: 'var(--muted-foreground)' }}
            onClick={() => setSearchOpen(true)}
            aria-label="Search documents"
          >
            <Search className="size-5" />
          </button>
        </header>
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  )
}