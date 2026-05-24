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
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading chat…
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        Failed to load chat. Please refresh.
      </div>
    )
  }

  if (messages.length === 0 && !sending) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
          <MessageSquare className="h-7 w-7 text-accent-foreground" />
        </div>
        <div>
          <p className="text-base font-medium text-foreground">Ask anything about this PDF</p>
          <p className="mt-1 text-sm text-muted-foreground">Your conversation history is saved.</p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-2">
          {STARTER_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onSuggestionClick(q)}
              className="cursor-pointer rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm text-foreground transition-colors duration-200 hover:border-primary/20 hover:bg-accent"
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
          <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-1">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
