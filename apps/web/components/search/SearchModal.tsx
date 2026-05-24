"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Search, X, Loader2, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all documents…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="h-4 w-4 shrink-0 text-muted-foreground animate-spin" />}
          <button
            onClick={onClose}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No results found
          </div>
        )}

        {results.length > 0 && (
          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {results.map((result, index) => (
              <li key={result.chunkId}>
                <button
                  className={cn(
                    "w-full text-left px-4 py-3 flex flex-col gap-1 hover:bg-muted transition-colors",
                    focusedIndex === index && "bg-muted"
                  )}
                  onClick={() => navigateTo(result.documentId)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-semibold truncate">{result.documentName}</span>
                    <Badge variant="outline" className="ml-auto shrink-0">
                      {(result.similarity * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-5">
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
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
            Type at least 2 characters to search
          </div>
        )}
      </div>
    </div>
  )
}
