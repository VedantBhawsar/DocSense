"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type Message = {
  id: string
  chatId: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  suggestions?: string[]
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
    <div className={cn("group flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-2xl rounded-bl-sm border border-border bg-card text-card-foreground shadow-sm prose prose-sm dark:prose-invert"
        )}
      >
        {isUser ? (
          msg.content
        ) : (
          <>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            {streaming && (
              <span className="inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-muted-foreground/60 align-middle ml-0.5" />
            )}
          </>
        )}
      </div>

      <div className={cn("flex items-center gap-2 px-1", isUser ? "flex-row-reverse" : "flex-row")}>
        <span className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
        {!streaming && (
          <button
            onClick={handleCopy}
            aria-label="Copy message"
            className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </div>

      {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
        <div className="flex flex-col gap-1.5 max-w-[80%]">
          {msg.suggestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick?.(q)}
              className="text-left text-xs text-primary border border-primary/20 bg-accent hover:bg-accent/80 rounded-xl px-3 py-1.5 transition-colors duration-200 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
