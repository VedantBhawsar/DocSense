"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTokenCount, formatUsd } from "@/lib/format"

export type MessageUsage = {
  model?: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd: number
}

export type Message = {
  id: string
  chatId: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  suggestions?: string[]
  usage?: MessageUsage
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

interface MessageBubbleProps {
  message: Message
  streaming?: boolean
  onSuggestionClick?: (q: string) => void
}

export function MessageBubble({ message: msg, streaming, onSuggestionClick }: MessageBubbleProps) {
  const isUser = msg.role === "user"
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("group flex flex-col gap-1.5 w-full animate-fade-in-up", isUser ? "items-end pl-12" : "items-start pr-12")}>
      {!isUser && (
        <div className="flex items-center gap-2 mb-1 pl-1">
          <div 
            className="size-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-foreground)' }}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>DocSense AI</span>
        </div>
      )}

      <div
        className={cn(
          "px-4 py-3 text-sm leading-relaxed relative",
          isUser
            ? "rounded-2xl rounded-tr-md"
            : "rounded-2xl rounded-tl-md"
        )}
        style={
          isUser
            ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }
            : { backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }
        }
      >
        {!isUser && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full" 
            style={{ backgroundColor: 'var(--primary)', opacity: 0.5 }}
          />
        )}
        
        {isUser ? (
          msg.content
        ) : (
          <>
            <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
            {streaming && (
              <span 
                className="inline-block h-4 w-2 ml-1 animate-pulse rounded-sm" 
                style={{ backgroundColor: 'var(--primary)' }}
              />
            )}
          </>
        )}
      </div>

      <div className={cn("flex items-center gap-2 px-1 mt-0.5", isUser ? "flex-row-reverse" : "flex-row")}>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatTime(msg.createdAt)}</span>
        {!isUser && !streaming && msg.usage && (
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }} title={`Model: ${msg.usage.model ?? '—'}`}>
            · {formatTokenCount(msg.usage.totalTokens)} · {formatUsd(msg.usage.costUsd)}
          </span>
        )}
        {!streaming && (
          <button
            onClick={handleCopy}
            aria-label="Copy message"
            className="rounded p-1 transition-all hover:bg-muted"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {copied ? <Check className="size-3.5" style={{ color: 'var(--success, #22c55e)' }} /> : <Copy className="size-3.5" />}
          </button>
        )}
      </div>

      {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {msg.suggestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick?.(q)}
              className="text-left text-xs font-medium rounded-full px-4 py-2 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              style={{ 
                border: '1px solid var(--primary)',
                backgroundColor: 'transparent',
                color: 'var(--primary)'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}