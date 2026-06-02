"use client"

import { useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled: boolean
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 116)}px`
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSend()
      return
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
      <div className="mx-auto flex max-w-2xl items-end gap-3">
        <div 
          className={cn(
            "flex-1 resize-none rounded-2xl border px-4 py-3 text-sm",
            "focus:outline-none transition-all duration-200"
          )}
          style={{ 
            borderColor: 'var(--input)', 
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            lineHeight: "1.5", 
            maxHeight: "116px"
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            rows={1}
            disabled={disabled}
            className="w-full resize-none bg-transparent focus:outline-none"
            style={{ maxHeight: "116px", color: 'var(--foreground)' }}
          />
        </div>
        <Button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          size="icon"
          aria-label="Send message"
          className="shrink-0 size-11 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-center text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
        Enter to send · Shift+Enter for new line · ⌘+Enter also works
      </p>
    </div>
  )
}