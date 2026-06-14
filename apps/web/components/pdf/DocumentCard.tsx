"use client"

import { useState } from "react"
import { FileText, MessageSquare, Trash2, Loader2, Pencil, RefreshCw, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { DocumentRenameDialog } from "./document-rename-dialog"

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
  onNewChat: () => void
  onOpenChat: (chatId: string) => void
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

export function DocumentCard({ document: doc, progress, onNewChat, onOpenChat, onDelete, onRename, onRetry }: DocumentCardProps) {
  const { data: session } = useSession()
  const [expanded, setExpanded] = useState(false)
  const [chats, setChats] = useState<{ id: string; title: string | null; createdAt: string }[]>([])
  const [loadingChats, setLoadingChats] = useState(false)

  const isChunking = progress?.stage === "chunk"
  const pct = isChunking ? Math.round((progress.index / progress.total) * 100) : 0

  const [renameDialogOpen, setRenameDialogOpen] = useState(false)

  function handleRename(newName: string) {
    onRename?.(doc.id, newName)
  }

  async function loadChats() {
    if (!session?.accessToken) return
    setLoadingChats(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/v1/chats?documentId=${doc.id}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setChats(data.chats || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingChats(false)
    }
  }

  function toggleExpand() {
    if (!expanded && chats.length === 0) {
      loadChats()
    }
    setExpanded(!expanded)
  }

  return (
    <div 
      className="group flex flex-col gap-2 rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up"
      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-4">
        <div 
          className="flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors bg-primary/10"
        >
          <FileText className="size-5 text-primary"  />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p 
              className="truncate text-base font-semibold cursor-pointer transition-colors" 
              title={doc.name} 
              onClick={() => setRenameDialogOpen(true)}
              style={{ color: 'var(--foreground)' }}
            >
              {doc.name}
            </p>
            <button
              onClick={() => setRenameDialogOpen(true)}
              aria-label={`Rename ${doc.name}`}
              className="shrink-0 rounded p-1 transition-opacity hover:bg-muted"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span 
              className="text-xs font-medium px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              {doc.mimeType === "application/pdf" ? "PDF" : "DOCX"}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>•</span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatDate(doc.createdAt)}</span>
            {doc.status === "ready" && doc.messageCount != null && doc.messageCount > 0 && (
              <>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>•</span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <MessageSquare className="size-3.5" />
                  {doc.messageCount}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {doc.status === "ready" && (
            <Button size="sm" variant="secondary" onClick={toggleExpand} className="h-8 gap-1.5 rounded-lg font-medium">
              <MessageSquare className="size-3.5" />
              Chats
              <ChevronDown className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")} />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            aria-label={`Delete ${doc.name}`}
            className="size-8 rounded-lg transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div 
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          expanded && doc.status === "ready" ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-3 pl-14 pr-2" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Recent Conversations</p>
              <Button size="sm" variant="ghost" onClick={onNewChat} className="h-7 px-2 text-xs gap-1" style={{ color: 'var(--primary)' }}>
                <Plus className="size-3.5" /> New
              </Button>
            </div>
            {loadingChats ? (
              <div className="py-4 text-sm flex items-center justify-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                <Loader2 className="size-4 animate-spin" /> Loading chats...
              </div>
            ) : chats.length === 0 ? (
              <div 
                className="py-6 text-center rounded-xl border"
                style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', borderStyle: 'dashed' }}
              >
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No conversations yet.</p>
                <Button size="sm" variant="link" onClick={onNewChat} className="h-auto p-0 mt-1" style={{ color: 'var(--primary)' }}>Start chatting now</Button>
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map(chat => (
                  <div 
                    key={chat.id} 
                    className="group/chat flex items-center justify-between rounded-lg p-2.5 cursor-pointer transition-colors" 
                    style={{ backgroundColor: 'transparent' }}
                    onClick={() => onOpenChat(chat.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="size-7 rounded flex items-center justify-center shrink-0 border transition-colors"
                        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                      >
                        <MessageSquare className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
                      </div>
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{chat.title || "New Chat"}</span>
                    </div>
                    <span className="text-xs shrink-0 pl-3" style={{ color: 'var(--muted-foreground)' }}>{formatDate(chat.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {progress?.stage === "processing" && (
        <div className="flex items-center gap-2 pl-14 mt-2 text-xs font-medium animate-pulse" style={{ color: 'var(--primary)' }}>
          <Loader2 className="size-3.5 animate-spin" />
          Starting processing…
        </div>
      )}

      {isChunking && (
        <div className="space-y-2 pl-14 mt-2">
          <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            <span className="flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Analyzing document...</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
      )}

      {progress?.stage === "failed" && (
        <div 
          className="flex items-center justify-between pl-14 mt-2 p-2 rounded-lg"
          style={{ backgroundColor: 'var(--destructive)', opacity: 0.1, border: '1px solid var(--destructive)' }}
        >
          <p className="text-xs font-medium truncate mr-2" style={{ color: 'var(--destructive)' }} title={progress.error}>{progress.error}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRetry?.(doc.id)}
            className="h-7 gap-1.5 px-2 text-xs shrink-0"
            style={{ color: 'var(--destructive)' }}
          >
            <RefreshCw className="size-3" />
            Retry
          </Button>
        </div>
      )}

      {doc.status === "failed" && !progress && (
        <div 
          className="flex items-center justify-between pl-14 mt-2 p-2 rounded-lg"
          style={{ backgroundColor: 'var(--destructive)', opacity: 0.1, border: '1px solid var(--destructive)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--destructive)' }}>Processing failed</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRetry?.(doc.id)}
            className="h-7 gap-1.5 px-2 text-xs shrink-0"
            style={{ color: 'var(--destructive)' }}
          >
            <RefreshCw className="size-3" />
            Retry
          </Button>
        </div>
      )}

      <DocumentRenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        documentName={doc.name}
        onRename={handleRename}
      />
    </div>
  )
}

export function DocumentCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl p-4" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
      <Skeleton className="size-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-3 py-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  )
}

function StatusBadge({ status, progress }: { status: string; progress?: DocProgress }) {
  if (progress?.stage === "chunk") {
    return (
      <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--primary)', opacity: 0.15, border: '1px solid var(--primary)' }}>
        <div className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--primary)' }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>{Math.round((progress.index / progress.total) * 100)}%</span>
      </div>
    )
  }
  if (status === "ready") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="size-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Ready</span>
      </div>
    )
  }
  if (status === "failed") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="size-1.5 rounded-full" style={{ backgroundColor: 'var(--destructive)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--destructive)' }}>Failed</span>
      </div>
    )
  }
  if (status === "processing") {
    return (
      <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#f59e0b', opacity: 0.15, border: '1px solid #f59e0b' }}>
        <div className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#f59e0b' }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#f59e0b' }}>Processing</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="size-1.5 rounded-full" style={{ backgroundColor: 'var(--muted-foreground)' }} />
      <span className="text-xs font-medium capitalize" style={{ color: 'var(--muted-foreground)' }}>{status}</span>
    </div>
  )
}
