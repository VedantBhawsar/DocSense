import { MessageSquare } from "lucide-react"
import { MessageBubble, type Message } from "./MessageBubble"

interface MessageListProps {
  messages: Message[]
  streamingContent: string | null
  sending: boolean
  state: "loading" | "ready" | "error"
  onSuggestionClick: (q: string) => void
  bottomRef: React.RefObject<HTMLDivElement | null>
}

const STARTER_QUESTIONS = [
  "What is this document about?",
  "Summarize the key points",
  "What are the main conclusions?",
]

export function MessageList({
  messages,
  streamingContent,
  sending,
  state,
  onSuggestionClick,
  bottomRef,
}: MessageListProps) {
  if (state === "loading") {
    return (
      <div className="flex h-full items-center justify-center" style={{ color: 'var(--muted-foreground)' }}>
        Loading chat…
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="flex h-full items-center justify-center" style={{ color: 'var(--destructive)' }}>
        Failed to load chat. Please refresh.
      </div>
    )
  }

  if (messages.length === 0 && !sending) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="relative animate-fade-in-up">
          <div 
            className="size-20 rounded-2xl flex items-center justify-center animate-scale-in"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <MessageSquare className="h-10 w-10" style={{ color: 'var(--primary-foreground)' }} />
          </div>
        </div>
        <div className="animate-fade-in-up animate-stagger-1">
          <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Ask anything about this PDF</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>Your conversation history is saved.</p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-2 animate-fade-in-up animate-stagger-2">
          {STARTER_QUESTIONS.map((q, i) => (
            <button
              key={q}
              onClick={() => onSuggestionClick(q)}
              className="cursor-pointer rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 hover:-translate-y-0.5"
              style={{ 
                borderColor: 'var(--border)', 
                backgroundColor: 'var(--card)', 
                color: 'var(--foreground)'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onSuggestionClick={onSuggestionClick}
        />
      ))}

      {streamingContent !== null && (
        <MessageBubble
          message={{
            id: "streaming",
            chatId: "",
            role: "assistant",
            content: streamingContent || "…",
            createdAt: new Date().toISOString(),
          }}
          streaming
        />
      )}

      {sending && streamingContent === null && (
        <div className="flex justify-start">
          <div 
            className="rounded-2xl rounded-bl-sm border px-4 py-3"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-1">
              <span className="typing-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--muted-foreground)' }} />
              <span className="typing-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--muted-foreground)' }} />
              <span className="typing-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--muted-foreground)' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}