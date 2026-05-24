"use client"

import { useState, useRef, useEffect } from "react"
import { FileText, MessageSquare, Trash2, Loader2, Pencil, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

type DocProgress =
  | { stage: "processing" }
  | { stage: "chunk"; index: number; total: number }
  | { stage: "ready" }
  | { stage: "failed"; error: string }

interface Document {
  id: string
  name: string
  mimeType: string
  status: string
  createdAt: string
  messageCount?: number
}

interface DocumentCardProps {
  document: Document
  progress?: DocProgress
  onChat: () => void
  onDelete: () => void
  onRename?: (id: string, newName: string) => void
  onRetry?: (id: string) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function DocumentCard({ document: doc, progress, onChat, onDelete, onRename, onRetry }: DocumentCardProps) {
  const isChunking = progress?.stage === "chunk"
  const pct = isChunking ? Math.round((progress.index / progress.total) * 100) : 0

  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(doc.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function startEdit() {
    setDraftName(doc.name)
    setEditing(true)
  }

  async function commitEdit() {
    const trimmed = draftName.trim()
    setEditing(false)
    if (!trimmed || trimmed === doc.name) return
    onRename?.(doc.id, trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      commitEdit()
    } else if (e.key === "Escape") {
      setEditing(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3 transition-colors duration-200 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
          <FileText className="h-4 w-4 text-accent-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-full truncate rounded border border-border bg-background px-1 py-0 text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          ) : (
            <div className="group flex items-center gap-1">
              <p className="truncate text-sm font-medium text-foreground" title={doc.name}>
                {doc.name}
              </p>
              <button
                onClick={startEdit}
                aria-label={`Rename ${doc.name}`}
                className="invisible shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:visible group-hover:opacity-100"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {doc.mimeType === "application/pdf" ? "PDF" : "DOCX"}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</span>
            {doc.status === "ready" && doc.messageCount != null && doc.messageCount > 0 && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {doc.messageCount} {doc.messageCount === 1 ? "message" : "messages"}
                </span>
              </>
            )}
            <span className="text-xs text-muted-foreground">·</span>
            <StatusBadge status={doc.status} progress={progress} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {doc.status === "ready" && (
            <Button size="sm" onClick={onChat} className="gap-1.5 transition-colors duration-200">
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </Button>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onDelete}
            aria-label={`Delete ${doc.name}`}
            className="text-muted-foreground hover:text-destructive transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {progress?.stage === "processing" && (
        <div className="flex items-center gap-2 pl-12 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Starting processing…
        </div>
      )}

      {isChunking && (
        <div className="space-y-1 pl-12">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Embedding chunks…</span>
            <span>{progress.index}/{progress.total}</span>
          </div>
          <Progress value={pct} />
        </div>
      )}

      {progress?.stage === "failed" && (
        <div className="flex items-center gap-2 pl-12">
          <p className="text-xs text-destructive">{progress.error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRetry?.(doc.id)}
            className="h-6 gap-1 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}

      {doc.status === "failed" && !progress && (
        <div className="flex items-center gap-2 pl-12">
          <p className="text-xs text-destructive">Processing failed</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRetry?.(doc.id)}
            className="h-6 gap-1 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}

export function DocumentCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

function StatusBadge({ status, progress }: { status: string; progress?: DocProgress }) {
  if (progress?.stage === "chunk") {
    return (
      <Badge variant="default">
        {Math.round((progress.index / progress.total) * 100)}%
      </Badge>
    )
  }
  if (status === "ready") return <Badge variant="success">Ready</Badge>
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>
  if (status === "processing") return <Badge variant="warning">Processing</Badge>
  return <Badge variant="outline">{status}</Badge>
}
