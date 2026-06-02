"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Search, X, Loader2, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

interface SearchResult {
  chunkId: string
  documentId: string
  documentName: string
  content: string
  similarity: number
  metadata: Record<string, unknown> | null
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { data: session } = useSession()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      setQuery("")
      setResults([])
      setFocusedIndex(-1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
            },
          }
        )
        if (res.ok) {
          const data = await res.json()
          setResults(data.results ?? [])
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
        setFocusedIndex(-1)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, session?.accessToken])

  function navigateTo(documentId: string) {
    router.push(`/chat/${documentId}`)
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose()
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setFocusedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setFocusedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      const result = results[focusedIndex]
      if (result) navigateTo(result.documentId)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] backdrop-blur-sm"
      style={{ backgroundColor: 'var(--foreground)', opacity: 0.5 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
          <div className="size-5 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }}>
            <Search className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all documents…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--foreground)' }}
          />
          {loading ? (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : (
            <kbd 
              className="hidden sm:inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium font-mono"
              style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
            >
              ESC
            </kbd>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-muted"
            style={{ color: 'var(--muted-foreground)' }}
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-12 text-center animate-fade-in">
            <div className="size-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--muted)' }}>
              <Search className="h-6 w-6" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>No results found</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Try a different search term</p>
          </div>
        )}

        {results.length > 0 && (
          <ul className="max-h-[60vh] overflow-y-auto py-2">
            {results.map((result, index) => (
              <li key={result.chunkId} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <button
                  className={cn(
                    "w-full text-left px-4 py-3 flex flex-col gap-1.5 border-l-2 border-transparent transition-all",
                    focusedIndex === index && "border-l-primary"
                  )}
                  style={{ backgroundColor: focusedIndex === index ? 'var(--muted)' : 'transparent' }}
                  onClick={() => navigateTo(result.documentId)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--primary)' }} />
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{result.documentName}</span>
                    <span 
                      className="ml-auto shrink-0 text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', opacity: 0.8 }}
                    >
                      {(result.similarity * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="text-xs line-clamp-2 pl-5" style={{ color: 'var(--muted-foreground)' }}>
                    {result.content.length > 120
                      ? result.content.slice(0, 120) + "…"
                      : result.content}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.length < 2 && (
          <div className="px-4 py-8 text-center animate-fade-in">
            <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>Type at least 2 characters to search</p>
            <div className="flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span className="flex items-center gap-1">
                <kbd className="rounded px-1.5 py-0.5 font-mono" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>↑</kbd>
                <kbd className="rounded px-1.5 py-0.5 font-mono" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>↓</kbd>
                <span>to navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded px-1.5 py-0.5 font-mono" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>⏎</kbd>
                <span>to select</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}